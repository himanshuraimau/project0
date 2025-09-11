import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId } = await req.json();

    if (!noteId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    // Get the note content and transcript
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: { 
        mindmap: true,
        transcript: true  // Include the full transcript
      }
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if mindmap already exists
    if (note.mindmap) {
      return NextResponse.json({
        success: true,
        data: note.mindmap
      });
    }

    // Use transcript content if available, otherwise fall back to note content
    const sourceContent = note.transcript?.content || note.content;
    const sourceTitle = note.title;

    if (!sourceContent || sourceContent.trim().length < 50) {
      return NextResponse.json({ 
        error: "Not enough content to generate a meaningful mindmap" 
      }, { status: 400 });
    }

    // Generate mindmap using AI with comprehensive prompt
    const prompt = `
You are a technical knowledge extraction specialist. Create a comprehensive Mermaid flowchart that captures ALL the important concepts, techniques, algorithms, tools, and specific details from this content.

CONTENT TO ANALYZE:
Title: ${sourceTitle}
Full Content: ${sourceContent.substring(0, 4000)}

CRITICAL REQUIREMENTS:

1. EXTRACT EVERYTHING IMPORTANT:
   - All algorithms, techniques, and methods mentioned
   - Specific tools, systems, databases, technologies
   - Key concepts, principles, and theories
   - Performance metrics, numbers, percentages
   - Best practices and optimization strategies
   - Common problems and their solutions
   - Step-by-step processes and workflows

2. CREATE COMPREHENSIVE STRUCTURE:
   - Main topic as root (A)
   - 6-10 major concept branches (B through J)
   - 3-6 detailed sub-concepts under EACH major branch
   - Include tertiary details (C1a, C1b, etc.) for complex topics
   - Total nodes should be 25-40 for rich content

3. USE SPECIFIC TERMINOLOGY:
   - Extract exact algorithm names (B-Tree, Hash Join, etc.)
   - Include specific tool names (PostgreSQL, MySQL, etc.)
   - Use technical terms as they appear in content
   - Include performance metrics and numbers
   - Capture optimization techniques mentioned

4. SHOW REAL RELATIONSHIPS:
   - Connect related concepts logically
   - Show cause-effect relationships
   - Group similar techniques together
   - Display hierarchical dependencies

EXAMPLE STRUCTURE (aim for this level of detail):
flowchart TD
    A[Main Topic] --> B[Algorithms & Methods]
    A --> C[Performance Optimization]
    A --> D[Database Systems]
    A --> E[Query Processing]
    A --> F[Indexing Strategies]
    A --> G[Join Operations]
    
    B --> B1[Specific Algorithm 1]
    B --> B2[Specific Algorithm 2]
    B1 --> B1a[Implementation Detail]
    B1 --> B1b[Performance Characteristic]
    
    C --> C1[Optimization Technique 1]
    C --> C2[Cost-Based Methods]
    C --> C3[Heuristic Approaches]
    C1 --> C1a[Specific Optimization]
    C2 --> C2a[Cost Model Details]
    
    [Continue this pattern for ALL major branches]

QUALITY TARGETS:
- Minimum 25 nodes total
- Include ALL technical terms from content
- Capture specific examples and use cases
- Include performance insights and metrics
- Show comprehensive knowledge structure

Generate a detailed, content-rich Mermaid flowchart:
`;

    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: prompt,
    });

    let mermaidCode = result.text.trim();
    
    console.log('Raw AI response:', mermaidCode.substring(0, 200) + '...');
    
    // Clean up the mermaid code - remove markdown code blocks if present
    if (mermaidCode.startsWith('```')) {
      mermaidCode = mermaidCode.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
    }

    // Remove any extra whitespace and normalize line endings
    mermaidCode = mermaidCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Fix common syntax issues
    mermaidCode = mermaidCode
      .replace(/^graph\s+TD/gm, 'flowchart TD')  // Fix mixed syntax
      .replace(/flowchart\s+TD\s*\n\s*graph\s+TD/g, 'flowchart TD')  // Remove duplicate declarations
      .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes
      .replace(/[\u2018\u2019]/g, "'")  // Replace smart apostrophes
      .replace(/[^\x00-\x7F]/g, ' ')   // Replace non-ASCII with spaces
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .replace(/;\s*$/gm, '')          // Remove trailing semicolons
      .trim();

    // Ensure it starts with 'flowchart TD'
    if (!mermaidCode.startsWith('flowchart TD')) {
      mermaidCode = 'flowchart TD\n    ' + mermaidCode;
    }

    console.log('Cleaned mermaid code:', mermaidCode.substring(0, 300) + '...');

    // Basic validation - ensure it has sufficient nodes and connections for a comprehensive mindmap
    const hasConnections = mermaidCode.includes('-->');
    const connectionCount = (mermaidCode.match(/-->/g) || []).length;
    const lineCount = mermaidCode.split('\n').length;
    const nodeCount = (mermaidCode.match(/\w+\[/g) || []).length;
    
    console.log('Validation check:', { hasConnections, connectionCount, lineCount, nodeCount });
    
    // Expect at least 10 connections and 15 nodes for a comprehensive mindmap
    if (!hasConnections || connectionCount < 8 || nodeCount < 12) {
      console.log('Mindmap not comprehensive enough, trying fallback...');
      console.log('Current code:', mermaidCode);
      
      // Try a comprehensive fallback approach
      const fallbackPrompt = `Create a detailed Mermaid flowchart for: ${sourceTitle}

Content: ${sourceContent.substring(0, 2000)}

Generate a comprehensive flowchart with 6-8 main branches and 3-4 sub-items each. Extract ALL technical terms, algorithms, tools, and specific concepts mentioned.

Use this detailed format:
flowchart TD
    A[${sourceTitle}] --> B[Major Concept 1]
    A --> C[Major Concept 2]
    A --> D[Major Concept 3]
    A --> E[Major Concept 4]
    A --> F[Major Concept 5]
    A --> G[Major Concept 6]
    
    B --> B1[Specific Detail 1]
    B --> B2[Specific Detail 2]
    B --> B3[Specific Detail 3]
    
    C --> C1[Technical Term 1]
    C --> C2[Technical Term 2]
    C --> C3[Technical Term 3]
    
    D --> D1[Algorithm/Method 1]
    D --> D2[Algorithm/Method 2]
    D --> D3[Tool/System 1]
    
    E --> E1[Optimization 1]
    E --> E2[Optimization 2]
    E --> E3[Performance Aspect]
    
    F --> F1[Implementation Detail]
    F --> F2[Best Practice]
    F --> F3[Common Problem]
    
    G --> G1[Advanced Topic 1]
    G --> G2[Advanced Topic 2]
    G --> G3[Future Direction]

Replace the placeholder text with actual concepts from the content.`;

      console.log('Trying fallback generation...');
      const fallbackResult = await generateText({
        model: google('gemini-1.5-flash'),
        prompt: fallbackPrompt,
      });
      
      let fallbackCode = fallbackResult.text.trim();
      if (fallbackCode.startsWith('```')) {
        fallbackCode = fallbackCode.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
      }
      if (!fallbackCode.startsWith('flowchart TD')) {
        fallbackCode = 'flowchart TD\n' + fallbackCode;
      }
      
      if (fallbackCode.includes('-->') && (fallbackCode.match(/-->/g) || []).length >= 8) {
        mermaidCode = fallbackCode;
        console.log('Fallback generation successful');
      } else {
        throw new Error(`Both primary and fallback generation failed. Connections: ${connectionCount}, Nodes: ${nodeCount}`);
      }
    }

    // Create or update the mindmap record using upsert
    const mindmap = await prisma.mindMap.upsert({
      where: { noteId: noteId },
      update: {
        title: `${note.title} - Mindmap`,
        mermaidCode: mermaidCode,
        updatedAt: new Date(),
      },
      create: {
        title: `${note.title} - Mindmap`,
        mermaidCode: mermaidCode,
        noteId: noteId,
        userId: userId,
      }
    });

    return NextResponse.json({
      success: true,
      data: mindmap
    });

  } catch (error) {
    console.error("Error generating mindmap:", error);
    
    // More specific error messages
    let errorMessage = "Failed to generate mindmap";
    if (error instanceof Error) {
      if (error.message.includes('too simple')) {
        errorMessage = "Content too simple to generate a meaningful mindmap";
      } else if (error.message.includes('syntax')) {
        errorMessage = "Generated mindmap has syntax errors";
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
