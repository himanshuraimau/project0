import { prisma } from "./prisma";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { indexNoteContent } from "@/lib/services/embedding-service";
import {
  NoteData,
  NoteType,
  GeneratedNoteResult,
  NotesFromContentResult
} from "@/lib/types/notes.types";


export class NoteService {
  private model = openai("gpt-4o");

  /**
   * Get content-specific instructions based on transcript type
   */
  private getContentSpecificInstructions(contentType: string): string {
    const instructions = {
      'pdf': `## CONTENT TYPE: PDF Document

**Special Focus Areas for PDF Content:**
- This content comes from a document, likely containing structured information, diagrams, or formal content
- Pay attention to any tables, figures, or structured data that may be referenced
- Academic or professional documents may contain citations, references, or formal terminology
- Preserve the logical flow and hierarchical structure of the original document
- If the content appears to be from textbooks or academic papers, emphasize theoretical foundations
- For technical manuals or guides, focus on step-by-step procedures and practical implementation
- Business documents should emphasize strategic insights, data analysis, and actionable recommendations`,

      'audio': `## CONTENT TYPE: Audio Recording / Transcription

**Special Focus Areas for Audio Content:**
- This content comes from spoken audio (lecture, meeting, or voice recording)
- The original format was conversational - translate verbal explanations into clear written concepts
- Speaker may have used informal language, filler words, or repetition - distill the core message
- Verbal emphasis and tone cannot be conveyed - ensure critical points are clearly highlighted in text
- Multiple speakers may be present - organize ideas logically rather than chronologically
- Anecdotes or examples from speech should be preserved as they aid understanding
- Transcription may contain errors - use context to ensure accuracy of technical terms
- Focus on extracting the key insights and organizing them into coherent study material`,

      'youtube': `## CONTENT TYPE: YouTube Video Transcript

**Special Focus Areas for YouTube Content:**
- This content comes from a video, likely including visual demonstrations or screen content
- The speaker may reference "as you can see" or point to visual elements - describe these conceptually
- Tutorial videos: Focus on the step-by-step process being demonstrated
- Educational videos: Extract the teaching methodology and key learning points
- Presentation videos: Capture both the verbal content and implied visual structure
- The casual or engaging tone of video content should be translated into clear, professional notes
- Time-sensitive information (current events, trends) should be noted with appropriate context
- If demonstrations were shown, describe the process and outcomes in detailed written form`,

      'webpage': `## CONTENT TYPE: Web Article / Blog Post

**Special Focus Areas for Web Content:**
- This content comes from online publication, optimized for web reading
- May contain hyperlinks, embedded media, or interactive elements - focus on the core information
- Web articles often have a journalistic or informal tone - maintain professionalism while preserving clarity
- Content may be time-sensitive - note dates, current contexts, or evolving situations
- Multiple formats may be mixed (lists, quotes, images) - integrate into coherent study notes
- Author's perspective and potential bias should be noted for balanced understanding
- Practical tips, how-to guides, or tutorials should maintain their actionable nature
- Blog content: Extract substantive knowledge while filtering opinion from fact`,

      'text': `## CONTENT TYPE: Plain Text / General Content

**Special Focus Areas for Text Content:**
- This is general text content without specific source formatting
- Focus on extracting the core knowledge and organizing it logically
- Identify the main themes, concepts, and relationships between ideas
- Structure the information in a way that facilitates learning and retention
- Ensure clarity and comprehension regardless of the original format
- Adapt the depth of explanation based on the complexity of the content`
    };

    return instructions[contentType as keyof typeof instructions] || instructions['text'];
  }

  /**
   * Generate AI summary notes from transcript content
   */
  async generateAINote(
    transcriptId: string,
    userId?: string
  ): Promise<GeneratedNoteResult> {
    try {

      // Get the transcript data
      const transcript = await prisma.transcript.findUnique({
        where: { id: transcriptId },
        select: {
          id: true,
          originalName: true,
          cleanContent: true,
          content: true,
          type: true,
          createdAt: true,
          notes: {
            select: {
              id: true,
              title: true,
              createdAt: true,
            },
          },
        },
      });

      if (!transcript) {
        throw new Error("Transcript not found");
      }

      // Check if notes already exist for this transcript
      if (transcript.notes && transcript.notes.length > 0) {
        console.log(
          `Warning: ${transcript.notes.length} existing notes found for transcript ${transcriptId}`
        );
      }

      // Use the clean content for better AI processing
      const contentToAnalyze = transcript.cleanContent || transcript.content;

      // Validate that we have content to analyze
      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        throw new Error(
          "No content available in transcript to generate notes from"
        );
      }

      // Add timestamp and uniqueness factors to the prompt
      const timestamp = new Date().toISOString();
      const analysisId = Math.random().toString(36).substring(2, 15);
      
      // Determine content-specific prompt based on transcript type
      const contentType = transcript.type || 'text';
      const contentSpecificInstructions = this.getContentSpecificInstructions(contentType);

      // Generate AI summary using content-specific prompts
      const result = await generateText({
        model: this.model,
        prompt: `You are an expert educational content specialist. Transform the following content into comprehensive, well-structured study notes.

Analysis ID: ${analysisId}
Timestamp: ${timestamp}
Document: ${transcript.originalName}
Content Type: ${contentType}

${contentSpecificInstructions}

## CORE STRUCTURE REQUIREMENTS

### 1. Introduction and Overview (400-600 words)
**What You'll Learn:**
- Comprehensive breakdown of knowledge and skills covered
- Specific competencies and practical abilities you'll gain
- Level of expertise expected after studying this material

**Why This Matters:**
- Real-world significance and practical applications
- Industry relevance and professional impact
- Problems this knowledge solves and opportunities it creates

**Prerequisites:**
- Required background knowledge with clear explanations
- Recommended preparation or foundational concepts needed
- Skill level assumptions and how to bridge any gaps

**Study Strategy:**
- Optimal approach for learning this material effectively
- Recommended study sequence and time investment
- Learning techniques that work best for this subject

### 2. Foundational Knowledge (500-800 words)

**Essential Context:**

*Historical Evolution:*
- Complete development story of these concepts
- Problems that led to innovations and breakthrough solutions
- Key milestones and important moments in the field

*Theoretical Foundation:*
- Underlying principles and core theories explained clearly
- Mathematical or scientific basis where applicable
- Fundamental laws or rules that govern this subject

*Current Landscape:*
- State of the field today with recent developments
- Major players, tools, and methodologies currently used
- Emerging trends and future directions

### 3. Detailed Concept Explanations

For each major topic (400-600 words per concept):

**Complete Understanding:**
- Clear definition progressing from simple to detailed
- Core mechanism: exactly HOW it works in sequential steps
- Underlying reasoning and governing principles
- Visual description as if explaining a diagram or process

**Technical Deep Dive:**
- Process breakdown in numbered, sequential steps
- Mathematical, quantitative, or technical aspects explained
- Component analysis for complex systems
- Input-processing-output flow description

**Practical Examples:**
- Primary example with every step thoroughly explained
- Alternative scenarios showing versatility and adaptability
- Common real-world use cases with context
- Problem-solving applications with detailed walkthroughs

**Learning Reinforcement:**
- Essential takeaways for permanent retention
- Common misconceptions and their corrections
- Connections to other concepts in the material
- Memory aids, analogies, or conceptual frameworks

### 4. Comprehensive Glossary

For each important term provide:
- Clear, jargon-free definition accessible to students
- Detailed contextual description with relevant background
- Practical examples showing proper usage
- Significance for understanding the broader subject

### 5. Practical Application Guide (400-600 words)

**Complete Learning Pathway:**

*Foundation Phase:*
- Recommended concept learning sequence and progression
- Specific study techniques optimized for each concept
- Comprehension checkpoints and verification methods

*Application Phase:*
- Methods for integrating different concepts together
- Practical scenarios for knowledge application
- Problem-solving frameworks and systematic approaches

*Mastery Phase:*
- Distinguishing deep mastery from surface knowledge
- Teaching others to solidify and test understanding
- Staying current with ongoing field developments

### 6. Growth and Next Steps (500-800 words)

**Mastery Verification:**
- Self-assessment criteria for measuring true understanding
- Practical application tests and real-world scenarios
- Common knowledge gaps and methods to identify them

**Educational Impact:**
- How this knowledge transforms your understanding
- Specific skills gained and pathways for development
- Professional readiness and career preparation insights

**Continued Learning:**
- Next-level topics with specific learning pathways outlined
- Specialization options and strategic direction choices
- Advanced resources for continued growth and expertise

## FORMATTING REQUIREMENTS

- Use clear markdown formatting with proper headers (##, ###)
- Utilize **bold** for key terms and *italics* for emphasis
- Include numbered lists for sequential steps
- Include bulleted lists for related points
- Create clear visual hierarchy with consistent formatting
- Add blockquotes (>) for important callouts or warnings
- Use code blocks (\`\`\`) for technical examples when relevant
- NO EMOJIS - Keep formatting professional and clean

## INPUT TO PROCESS

${contentToAnalyze}

Generate comprehensive, professional study notes following this structure exactly. Adapt the depth and technical level based on the content complexity. Focus on clarity, accuracy, and practical learning value.`,
      });

      // Validate AI response
      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title
      const titleResult = await generateText({
        model: this.model,
        prompt: `EDUCATIONAL TITLE GENERATOR

You are an expert at creating clear, descriptive titles for educational content. Create ONE perfect title that accurately represents the content and makes students interested to learn.

Content Analysis: Based on the following educational content, create a title that:
- Clearly describes what students will learn
- Is specific and descriptive (not vague)
- Sounds educational and professional
- Makes the topic sound interesting and valuable
- Is 3-8 words long (concise but descriptive)

Examples of GOOD titles:
- "Advanced React Hooks and State Management"
- "Machine Learning Fundamentals and Applications"
- "Financial Analysis and Investment Strategies"
- "Digital Marketing and SEO Optimization"

Examples of BAD titles (avoid these):
- "Notes" (too vague)
- "Analysis of document" (generic)
- "Important information" (not specific)

Educational Content to Analyze:
${result.text.substring(0, 1000)}...

Source Document: ${transcript.originalName}

Generate ONE perfect educational title (no quotes, no extra text, just the title):`,
      });

      const aiGeneratedTitle = titleResult.text.trim().replace(/^["'`]|["'`]$/g, '') || `Educational Notes on ${transcript.originalName}`;

      // Ensure title is reasonable length and add timestamp for uniqueness
      const baseTitle = aiGeneratedTitle.length > 80 ? aiGeneratedTitle.substring(0, 77) + "..." : aiGeneratedTitle;
      const title = `${baseTitle}`;

      // Save the generated note to database
      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
      });

      return note;
    } catch (error) {
      console.error("Error generating AI note:", error);
      throw new Error("Failed to generate AI note");
    }
  }

  /**
   * Generate AI notes with specific focus/style
   */
  async generateFocusedNote(
    transcriptId: string,
    noteType: NoteType = "summary",
    userId?: string
  ): Promise<GeneratedNoteResult> {
    try {

      const transcript = await prisma.transcript.findUnique({
        where: { id: transcriptId },
        select: {
          id: true,
          originalName: true,
          cleanContent: true,
          content: true,
        },
      });

      if (!transcript) {
        throw new Error("Transcript not found");
      }

      const contentToAnalyze = transcript.cleanContent || transcript.content;

      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        throw new Error(
          "No content available in transcript to generate notes from"
        );
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      // Different prompts based on note type
      // Enhanced prompts based on note type with educational and comprehensive focus
      const prompts = {
        summary: `
COMPREHENSIVE EXECUTIVE LEARNING SUMMARY

Create a comprehensive executive summary that serves as a complete learning overview:

EXECUTIVE LEARNING SUMMARY STRUCTURE:
- **Key Insights and Discoveries:** Most important findings and breakthrough concepts (200-300 words)
- **Strategic Implications:** Business impact, decisions enabled, and strategic value (150-200 words)
- **Core Concepts Mastered:** Essential knowledge gained from this material (150-200 words)
- **Actionable Intelligence:** Immediate applications and implementation opportunities (100-150 words)
- **Future Pathways:** Next steps, continued learning, and growth opportunities (100-150 words)

Focus on creating a summary that enables executives to understand both the immediate value and long-term learning implications. Make complex concepts accessible while maintaining depth and accuracy.
  `,

        detailed: `
COMPREHENSIVE EDUCATIONAL MASTERY FRAMEWORK

Provide a comprehensive educational analysis that enables complete mastery of all content:

COMPREHENSIVE MASTERY FRAMEWORK:
- **Learning Foundation:** Historical context, theoretical basis, and prerequisite knowledge (400-500 words)
- **Detailed Concept Exploration:** In-depth analysis of every major topic with step-by-step explanations (500-800 words per major concept)
- **Technical Deep Dives:** Methodologies, processes, and technical implementations explained thoroughly (300-400 words per technical aspect)
- **Practical Application Analysis:** Real-world use cases, examples, and implementation strategies (400-600 words)
- **Integration Framework:** How concepts connect and build upon each other (200-300 words)
- **Mastery Assessment:** Self-check criteria and knowledge verification methods (200-300 words)

Explain everything as if teaching someone who needs to become an expert. Include multiple examples, analogies, and practical applications for each concept.
  `,

        "action-items": `
STRATEGIC ACTION FRAMEWORK AND IMPLEMENTATION GUIDE

Create a comprehensive action-oriented guide that enables immediate implementation and long-term strategy:

STRATEGIC ACTION FRAMEWORK:
- **Immediate Actions (0-30 days):** Specific, implementable steps with clear success criteria and resource requirements (300-400 words)
- **Short-term Strategy (1-6 months):** Tactical initiatives with timelines, dependencies, and measurable outcomes (400-500 words)
- **Long-term Vision (6+ months):** Strategic recommendations with growth pathways and scalability considerations (300-400 words)
- **Resource Requirements:** Personnel, budget, tools, and infrastructure needed for each phase (200-300 words)
- **Risk Mitigation:** Potential challenges and proactive solutions (200-300 words)
- **Success Metrics:** KPIs, measurement frameworks, and evaluation criteria (200-250 words)
- **Implementation Roadmap:** Step-by-step execution plan with checkpoints and decision points (300-400 words)

Focus on creating actionable intelligence that bridges the gap between knowledge and implementation. Include specific tools, methodologies, and best practices.
  `,

        technical: `
COMPREHENSIVE TECHNICAL MASTERY FRAMEWORK

Provide a comprehensive technical analysis that enables deep technical mastery and implementation:
    
TECHNICAL MASTERY FRAMEWORK:
- **Technical Foundation:** Core technologies, architectures, and theoretical principles (400-500 words)
- **Detailed Methodologies:** Step-by-step technical processes with implementation details (500-700 words)
- **Technology Stack Analysis:** Tools, platforms, APIs, and technical requirements with specific recommendations (400-500 words)
- **Architecture and Design Patterns:** System design principles, best practices, and scalability considerations (400-600 words)
- **Implementation Guidelines:** Code examples, configuration details, and technical specifications (500-700 words)
- **Technical Troubleshooting:** Common issues, debugging approaches, and solution strategies (300-400 words)
- **Performance and Optimization:** Efficiency considerations, monitoring, and improvement strategies (300-400 words)
- **Integration and APIs:** Technical connectivity, data flows, and system interactions (300-400 words)
    
Explain technical concepts with sufficient depth for implementation while maintaining clarity. Include specific examples, code snippets where relevant, and practical technical guidance.
  `,

        executive: `
STRATEGIC EXECUTIVE BRIEFING AND DECISION FRAMEWORK

Create a strategic executive briefing that enables informed decision-making and strategic planning:
    
EXECUTIVE DECISION FRAMEWORK:
- **Strategic Overview:** Business context, market implications, and competitive advantages (300-400 words)
- **Financial Impact Analysis:** Cost-benefit analysis, ROI projections, and budget considerations (300-400 words)
- **Risk and Opportunity Assessment:** Strategic risks, market opportunities, and mitigation strategies (300-400 words)
- **Resource Requirements:** Personnel, infrastructure, and investment needs with timeline implications (250-300 words)
- **Competitive Intelligence:** Market positioning, competitive advantages, and differentiation opportunities (300-350 words)
- **Implementation Strategy:** High-level roadmap, key milestones, and success criteria (300-400 words)
- **Stakeholder Impact:** Effects on customers, employees, partners, and other stakeholders (200-300 words)
- **Decision Points:** Critical choices, trade-offs, and strategic alternatives (250-300 words)
    
Focus on strategic insights that enable confident decision-making. Present complex information in executive-friendly format while maintaining analytical rigor and actionable recommendations.
  `,

        tutorial: `
COMPREHENSIVE TUTORIAL MASTERY FRAMEWORK

Create comprehensive tutorial-style educational content that enables complete skill mastery:
    
TUTORIAL MASTERY FRAMEWORK:
- **Learning Journey Introduction:** What you'll master, why it matters, prerequisites, and study strategy (400-600 words)
- **Foundational Knowledge Building:** Historical context, theoretical foundation, and current landscape (500-800 words)
- **Step-by-Step Concept Mastery:** Detailed explanations of each concept with examples and applications (400-600 words per major concept)
- **Practical Application Guide:** Hands-on exercises, real-world scenarios, and implementation strategies (400-600 words)
- **Comprehensive Learning Glossary:** Detailed definitions with context and examples (4-6 sentences per term)
- **Mastery Assessment:** Self-check criteria, knowledge gaps identification, and remediation strategies (300-400 words)
- **Continued Learning Pathway:** Next steps, advanced topics, and specialization options (400-500 words)
    
Write as if teaching someone who needs deep mastery, not just surface understanding. Include multiple examples, clear explanations, and practical applications throughout.
  `,

        research: `
COMPREHENSIVE RESEARCH ANALYSIS FRAMEWORK

Provide comprehensive research analysis that enables evidence-based understanding and decision-making:
    
RESEARCH ANALYSIS FRAMEWORK:
- **Research Context and Methodology:** Study background, research methods, and analytical approach (300-400 words)
- **Key Findings and Evidence:** Primary discoveries with supporting data and statistical significance (500-700 words)
- **Comparative Analysis:** How findings relate to existing research, contradictions, and confirmations (400-500 words)
- **Implications and Applications:** Practical significance, real-world applications, and impact assessment (400-500 words)
- **Limitations and Considerations:** Research constraints, potential biases, and interpretive cautions (300-400 words)
- **Future Research Directions:** Unanswered questions, recommended studies, and research opportunities (300-400 words)
- **Evidence Quality Assessment:** Reliability, validity, and confidence levels of findings (200-300 words)
    
Present research with academic rigor while making findings accessible and actionable. Include critical analysis and practical implications.
  `,

        creative: `
CREATIVE LEARNING TRANSFORMATION FRAMEWORK

Transform content into engaging, creative educational material that inspires and educates:
    
CREATIVE LEARNING FRAMEWORK:
- **Engaging Introduction:** Hook the reader with compelling stories, analogies, or thought experiments (300-400 words)
- **Narrative-Driven Explanations:** Use storytelling to explain complex concepts and make them memorable (400-600 words per major concept)
- **Visual Descriptions:** Paint vivid mental pictures of abstract concepts and processes (300-400 words)
- **Creative Analogies and Metaphors:** Use familiar concepts to explain unfamiliar ones (200-300 words per analogy)
- **Interactive Elements:** Thought experiments, hypothetical scenarios, and engaging questions (300-400 words)
- **Memorable Frameworks:** Create acronyms, mnemonics, and memorable structures for complex information (200-300 words)
- **Inspirational Applications:** Show the exciting possibilities and transformative potential (300-400 words)
    
Make learning enjoyable and memorable while maintaining educational value. Use creativity to enhance understanding, not replace substance.
  `
      };

      const specificPrompt = prompts[noteType];

      const result = await generateText({
        model: this.model,
        prompt: `
SPECIALIZED EDUCATIONAL CONTENT ARCHITECT

Analysis ID: ${analysisId}
Timestamp: ${timestamp}
Note Type: ${noteType.toUpperCase()}
Document: ${transcript.originalName}

${specificPrompt}

Content to Transform into Professional Educational Notes:
${contentToAnalyze}

Provide a structured, professional analysis that is unique to this specific document and context. Make it comprehensive and valuable for learning. Use clear markdown formatting with NO EMOJIS.
        `,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title based on note type and content
      const titleResult = await generateText({
        model: this.model,
        prompt: `FOCUSED NOTE TITLE GENERATOR

Create a perfect title for a ${noteType.toUpperCase()} note based on the content below.

Note Type: ${noteType} 
Source: ${transcript.originalName}

Title Requirements:
- Should reflect the ${noteType} focus (${noteType === 'summary' ? 'concise overview' : noteType === 'detailed' ? 'comprehensive analysis' : noteType === 'action-items' ? 'actionable strategies' : noteType === 'technical' ? 'technical implementation' : 'executive briefing'})
- Be specific and descriptive (3-8 words)
- Sound professional and educational
- Make the content type clear
- NO EMOJIS - Keep it professional

Content Preview:
${result.text.substring(0, 500)}...

Generate ONE perfect title (no quotes, just the title):`,
      });

      const aiGeneratedTitle = titleResult.text.trim().replace(/^["'`]|["'`]$/g, '') || `${noteType.charAt(0).toUpperCase() + noteType.slice(1)} Notes`;
      const title = aiGeneratedTitle.length > 80 ? aiGeneratedTitle.substring(0, 77) + "..." : aiGeneratedTitle;

      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
      });

      return note;
    } catch (error) {
      console.error("Error generating focused AI note:", error);
      throw new Error("Failed to generate focused AI note");
    }
  }

  /**
   * Save note to database
   */
  async saveNote(data: NoteData) {
    try {
      // Validate required fields
      if (!data.title || !data.content || !data.transcriptId) {
        throw new Error("Title, content, and transcriptId are required");
      }

      const note = await prisma.note.create({
        data: {
          title: data.title,
          content: data.content,
          transcriptId: data.transcriptId,
          userId: data.userId,
        },
      });

      // Index the note content for vector search (non-blocking)
      setTimeout(() => {
        indexNoteContent(note.id, note.content)
          .then(() => console.log(`Successfully indexed note: ${note.id}`))
          .catch((error) =>
            console.error(`Error indexing note ${note.id}:`, error)
          );
      }, 0);

      return note;
    } catch (error) {
      console.error("Error saving note to database:", error);
      throw new Error("Failed to save note to database");
    }
  }

  /**
   * Get note by ID
   */
  async getNote(id: string) {
    try {
      return await prisma.note.findUnique({
        where: { id },
        include: {
          transcript: {
            select: {
              id: true,
              originalName: true,
              createdAt: true,
              type: true,
            },
          },
          translations: {
            select: {
              id: true,
              language: true,
              title: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error retrieving note:", error);
      throw new Error("Failed to retrieve note");
    }
  }

  /**
   * Get notes by transcript ID
   */
  async getNotesByTranscript(transcriptId: string) {
    try {
      return await prisma.note.findMany({
        where: { transcriptId },
        orderBy: { createdAt: "desc" },
        include: {
          transcript: {
            select: {
              id: true,
              originalName: true,
              createdAt: true,
              type: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error retrieving notes for transcript:", error);
      throw new Error("Failed to retrieve notes for transcript");
    }
  }

  /**
   * Get notes by user ID
   */
  async getNotesByUser(userId: string) {
    try {
      return await prisma.note.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          transcriptId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          transcript: {
            select: {
              id: true,
              originalName: true,
              createdAt: true,
              type: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error retrieving user notes:", error);
      
      // Check if it's a Prisma error
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; message: string };
        
        switch (prismaError.code) {
          case 'P2021':
            throw new Error("Database table 'notes' does not exist. Please check your database migration status.");
          case 'P2002':
            throw new Error("A unique constraint violation occurred while retrieving notes.");
          case 'P1001':
            throw new Error("Database connection failed. Please check your database configuration.");
          case 'P2025':
            throw new Error("The requested notes data was not found.");
          default:
            throw new Error(`Database error (${prismaError.code}): ${prismaError.message}`);
        }
      }
      
      // Handle other types of errors
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user notes: ${error.message}`);
      }
      
      throw new Error("An unexpected error occurred while retrieving user notes");
    }
  }

  /**
   * Delete note by ID
   * Requirements: 7.4 - Cascade delete associated podcasts and clean up audio files
   */
  async deleteNote(id: string) {
    try {
      // First, get all podcasts associated with this note to clean up audio files
      const podcasts = await prisma.podcast.findMany({
        where: { noteId: id },
        select: {
          id: true,
          audioFileKey: true,
          status: true,
        },
      });

      // Clean up audio files for all podcasts before deleting the note
      const audioFileKeys = podcasts
        .filter(podcast => podcast.audioFileKey && podcast.audioFileKey.trim().length > 0)
        .map(podcast => podcast.audioFileKey!);

        if (audioFileKeys.length > 0) {
        try {
          // Import UploadThing service for bulk file deletion using a non-literal path
          // This avoids TypeScript trying to statically resolve './uploadthing' at compile time
          const uploadThingModulePath = './' + 'uploadthing';
          const { uploadThingAudioStorageService } = await import(uploadThingModulePath as any);
          await uploadThingAudioStorageService.deleteAudioFiles(audioFileKeys);
          console.log(`Successfully deleted ${audioFileKeys.length} audio files for note ${id}`);
        } catch (fileError) {
          console.warn(`Failed to delete some audio files for note ${id}:`, fileError);
          // Continue with note deletion even if file cleanup fails
          // This prevents orphaned database records due to storage issues
        }
      } else if (podcasts.length > 0) {
        console.log(`Note ${id} has ${podcasts.length} podcasts but no audio files to clean up`);
      }

      // Delete the note (this will cascade delete podcasts due to database constraints)
      const deletedNote = await prisma.note.delete({
        where: { id },
      });

      console.log(`Successfully deleted note ${id} and ${podcasts.length} associated podcasts`);
      return deletedNote;
    } catch (error) {
      console.error("Error deleting note:", error);
      throw new Error("Failed to delete note");
    }
  }

  /**
   * Update note by ID
   */
  async updateNote(
    id: string,
    data: Partial<Pick<NoteData, "title" | "content">>
  ) {
    try {
      return await prisma.note.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error updating note:", error);
      throw new Error("Failed to update note");
    }
  }

  /**
   * Generate AI notes from text content
   */
  async generateNotesFromContent(
    content: string,
    title: string = 'Text Note'
  ): Promise<NotesFromContentResult> {
    try {
      if (!content || content.trim().length === 0) {
        throw new Error('Content is required to generate notes');
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const result = await generateText({
        model: this.model,
        prompt: `SPECIALIZED AI TUTOR AND EDUCATIONAL CONTENT ARCHITECT

Analysis ID: ${analysisId}
Timestamp: ${timestamp}
Source: Text Input
Title: ${title}

You are a specialized AI tutor, designed to transform text content into comprehensive, tutorial-style educational notes that make learning both engaging and effective. Your mission is to create detailed study materials that teach concepts thoroughly, as if you were an expert teacher explaining everything step-by-step to help someone truly master the subject.

TRANSFORMATION MISSION: Convert the following text content into professional educational notes that students will find valuable for learning.

Content to Transform:
${content}

CREATE STRUCTURED, PROFESSIONAL EDUCATIONAL NOTES THAT INCLUDE:

### 1. Clear Overview of Main Concepts
- What students will learn and master
- Why this knowledge is valuable and important
- Key themes and main ideas to focus on
- Learning objectives and goals

### 2. Detailed Explanations of Key Points
- Step-by-step breakdowns of complex concepts
- Clear reasoning and logical connections
- How different ideas relate to each other
- In-depth coverage with examples and context

### 3. Important Insights and Takeaways
- Key insights and essential understanding
- Critical points for long-term retention
- Breakthrough moments and deep understanding
- Concepts that unlock deeper learning

### 4. Practical Applications (where relevant)
- Real-world examples and use cases
- Professional or academic applications
- Interactive scenarios and problem-solving
- How to apply knowledge in practice

### 5. Summary of Essential Information
- Quick reference points and key facts
- Most important concepts to remember
- Review points for reinforcement
- Memorable frameworks or structures

STYLE GUIDELINES:
- Use engaging, professional tone that facilitates learning
- Include clear headings with markdown (##, ###) and bullet points for easy navigation
- Add emphasis with **bold** and *italics* strategically
- Make complex concepts accessible and understandable
- Build confidence through structured, logical progression
- Create notes suitable for both learning and quick reference
- NO EMOJIS - Keep formatting clean and professional
- Use blockquotes (>) for important callouts
- Use code blocks when showing technical examples

Make the notes comprehensive yet accessible, suitable for both deep learning and quick reference.`,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error('AI failed to generate meaningful content');
      }

      // Generate an AI-powered descriptive title
      const titleResult = await generateText({
        model: this.model,
        prompt: `TEXT NOTE TITLE GENERATOR

Create a perfect educational title for notes generated from the text content below.

Requirements:
- Clearly describe what the content is about
- Be specific and engaging (3-8 words)
- Sound educational and valuable
- Make students want to read these notes
- NO EMOJIS - Keep it professional

Original Title Provided: ${title}
Generated Content Preview:
${result.text.substring(0, 600)}...

Generate ONE perfect educational title (no quotes, just the title):`,
      });

      const aiGeneratedTitle = titleResult.text.trim().replace(/^["'`]|["'`]$/g, '') || title || 'Educational Text Notes';
      const finalTitle = aiGeneratedTitle.length > 80 ? aiGeneratedTitle.substring(0, 77) + "..." : aiGeneratedTitle;

      return {
        title: finalTitle,
        content: result.text,
      };
    } catch (error) {
      console.error('Error generating notes from content:', error);
      throw new Error('Failed to generate notes from content');
    }
  }
}

// Export a function for use in API routes
export async function generateNotesFromContent(
  content: string,
  title: string = 'Text Note'
): Promise<NotesFromContentResult> {
  const noteService = new NoteService();
  return noteService.generateNotesFromContent(content, title);
}