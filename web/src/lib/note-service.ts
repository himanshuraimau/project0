import { prisma } from "./prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { indexNoteContent } from "./course/embedding-service";
import {
  NoteData,
  NoteType,
  GeneratedNoteResult,
  NotesFromContentResult,
} from "@/lib/types/notes.types";

export class NoteService {
  private model = google("gemini-2.5-flash");

  /** Disable thinking for faster, cheaper non-thinking responses */
  private providerOptions = {
    google: {
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  /**
   * Get content-specific instructions based on transcript type
   */
  private getContentSpecificInstructions(contentType: string): string {
    const instructions = {
      pdf: `## CONTENT TYPE: PDF Document

**Special Focus Areas for PDF Content:**
- This content comes from a document, likely containing structured information, diagrams, or formal content
- Pay attention to any tables, figures, or structured data that may be referenced
- Academic or professional documents may contain citations, references, or formal terminology
- Preserve the logical flow and hierarchical structure of the original document
- If the content appears to be from textbooks or academic papers, emphasize theoretical foundations
- For technical manuals or guides, focus on step-by-step procedures and practical implementation
- Business documents should emphasize strategic insights, data analysis, and actionable recommendations`,

      audio: `## CONTENT TYPE: Audio Recording / Transcription

**Special Focus Areas for Audio Content:**
- This content comes from spoken audio (lecture, meeting, or voice recording)
- The original format was conversational - translate verbal explanations into clear written concepts
- Speaker may have used informal language, filler words, or repetition - distill the core message
- Verbal emphasis and tone cannot be conveyed - ensure critical points are clearly highlighted in text
- Multiple speakers may be present - organize ideas logically rather than chronologically
- Anecdotes or examples from speech should be preserved as they aid understanding
- Transcription may contain errors - use context to ensure accuracy of technical terms
- Focus on extracting the key insights and organizing them into coherent study material`,

      youtube: `## CONTENT TYPE: YouTube Video Transcript

**Special Focus Areas for YouTube Content:**
- This content comes from a video, likely including visual demonstrations or screen content
- The speaker may reference "as you can see" or point to visual elements - describe these conceptually
- Tutorial videos: Focus on the step-by-step process being demonstrated
- Educational videos: Extract the teaching methodology and key learning points
- Presentation videos: Capture both the verbal content and implied visual structure
- The casual or engaging tone of video content should be translated into clear, professional notes
- Time-sensitive information (current events, trends) should be noted with appropriate context
- If demonstrations were shown, describe the process and outcomes in detailed written form`,

      webpage: `## CONTENT TYPE: Web Article / Blog Post

**Special Focus Areas for Web Content:**
- This content comes from online publication, optimized for web reading
- May contain hyperlinks, embedded media, or interactive elements - focus on the core information
- Web articles often have a journalistic or informal tone - maintain professionalism while preserving clarity
- Content may be time-sensitive - note dates, current contexts, or evolving situations
- Multiple formats may be mixed (lists, quotes, images) - integrate into coherent study notes
- Author's perspective and potential bias should be noted for balanced understanding
- Practical tips, how-to guides, or tutorials should maintain their actionable nature
- Blog content: Extract substantive knowledge while filtering opinion from fact`,

      text: `## CONTENT TYPE: Plain Text / General Content

**Special Focus Areas for Text Content:**
- This is general text content without specific source formatting
- Focus on extracting the core knowledge and organizing it logically
- Identify the main themes, concepts, and relationships between ideas
- Structure the information in a way that facilitates learning and retention
- Ensure clarity and comprehension regardless of the original format
- Adapt the depth of explanation based on the complexity of the content`,
    };

    return (
      instructions[contentType as keyof typeof instructions] ||
      instructions["text"]
    );
  }

  /**
   * Generate AI summary notes from transcript content
   */
  async generateAINote(
    transcriptId: string,
    userId?: string,
    folderId?: string,
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
          `Warning: ${transcript.notes.length} existing notes found for transcript ${transcriptId}`,
        );
      }

      // Use the clean content for better AI processing
      const contentToAnalyze = transcript.cleanContent || transcript.content;

      // Validate that we have content to analyze
      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        throw new Error(
          "No content available in transcript to generate notes from",
        );
      }

      // Add timestamp and uniqueness factors to the prompt
      const timestamp = new Date().toISOString();
      const analysisId = Math.random().toString(36).substring(2, 15);

      // Determine content-specific prompt based on transcript type
      const contentType = transcript.type || "text";
      const contentSpecificInstructions =
        this.getContentSpecificInstructions(contentType);

      // Generate AI summary using content-specific prompts
      const result = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `You are an expert note-taking AI that transforms content into highly engaging, visually scannable study notes.

Analysis ID: ${analysisId}
Timestamp: ${timestamp}
Document: ${transcript.originalName}
Content Type: ${contentType}

${contentSpecificInstructions}

## YOUR GOAL

Transform the source content into clean, engaging, and information-dense notes. The notes should feel like a well-crafted cheat sheet — easy to scan, visually appealing, and packed with value. NOT a textbook chapter.

## OUTPUT STRUCTURE

### 1. Title & Brief Overview
- Start with a relevant emoji + topic title as H1 (e.g., "📚 Framer Monetization", "🧠 Machine Learning Basics")
- Add a "Brief Overview" section: 2-4 sentences explaining what this content covers and where it came from. Keep it tight.

### 2. Key Points
- 4-7 bullet points summarizing the most important takeaways
- Each bullet should be a standalone insight someone can learn from
- Prefix each bullet with a relevant emoji

### 3. Main Content Sections (4-8 sections, dynamic)
- Each section gets a relevant emoji + descriptive H2 title (e.g., "📊 Revenue Model", "🚀 Getting Started", "✅ Quality Checklist")
- Section titles must be DYNAMIC — based on what the content actually covers, not a fixed template
- Within sections, use the BEST format for the data:
  - **Tables** for comparisons, metrics, specifications, feature lists, step-by-step plans, timelines, or any structured data with 3+ items that share attributes
  - **Bullet points** for explanations, insights, and key ideas
  - **Numbered lists** for sequential steps or ranked items
  - **Bold key terms** within bullets for scannability
  - **Blockquotes** (>) for critical definitions, formulas, or important callouts
- Keep bullets concise — one idea per bullet, no run-on explanations
- PRIORITIZE TABLES whenever data can be structured into rows and columns — tables dramatically improve readability

### 4. FAQ Section (if applicable)
- If the content naturally raises common questions, add a "❓ Common Questions" section
- Use bold question + answer format
- Keep answers to 2-4 sentences each

### 5. Key Takeaways
- End with a "🔑 Key Takeaways" section
- 3-7 bullets of the most critical points from the entire content

## HARD RULES

1. **SOURCE ONLY**: Use only information from the provided content. No outside knowledge or hallucination.
2. **NO REPETITION**: Each piece of information should appear ONCE. Do not restate the same concept across multiple sections.
3. **NO META TALK**: Do not say "this video discusses" or "the author mentions". Just present the information directly.
4. **NO FILLER**: Every sentence must carry information. No generic statements like "this is important" or "understanding this is valuable".
5. **NO TEXTBOOK VOICE**: Do NOT add sections like "Prerequisites", "Study Strategy", "Learning Path", "Mastery Verification", "Educational Impact", "Growth and Next Steps", or "Comprehensive Glossary" unless the source content explicitly warrants it.
6. **CONCISE > VERBOSE**: Aim for information density. If you can say it in 10 words, don't use 50.
7. **TABLES ARE YOUR FRIEND**: Use markdown tables for ANY structured data — metrics, comparisons, lists of items with attributes, timelines, feature breakdowns, checklists with descriptions, etc.
8. **EMOJIS FOR HEADERS ONLY**: Use relevant emojis as prefixes for H1, H2 headers, and key point bullets to make notes visually scannable. Do NOT sprinkle emojis randomly throughout body text. Choose from: 📚 📊 🚀 💡 ✅ 💸 🗓️ ❓ 🔑 💎 🎯 📈 🛠️ ⚡ 🧠 🔍 📋 💰 🏆 🔄 📌 🎨 📝 🌟 ⚙️
9. **DATA ACCURACY**: Include numbers, percentages, and metrics only if explicitly stated in the source.
10. **SMART SECTIONING**: Create sections based on the content's natural themes. Prefer the source's own structure/headings when available. A section must have enough substance — don't create a section for a minor mention.

## FORMATTING GUIDE

Use this markdown formatting:
- \`#\` for the main title (with emoji)
- \`##\` for section headers (with emoji)
- \`###\` for subsection headers (no emoji needed)
- **bold** for key terms and emphasis
- *italics* for definitions or secondary emphasis
- \`>\` blockquotes for critical callouts, definitions, or formulas
- Tables with \`|\` syntax for structured data
- \`-\` bullet points for lists
- \`1.\` numbered lists for sequences

### Example of good table usage:

| Metric | Value | Source |
|--------|-------|--------|
| Total views | 800,000+ | Public analytics |
| Conversion rate | 5% | Program data |
| Revenue estimate | $400,000 | Calculation |

### Example of good callout usage:

> **Key formula**: Revenue = Customers × Monthly payout × Average months subscribed

### Example of good bullet usage:

- **Affiliate commission**: 50% of subscriber's plan price for up to 12 months
- **Average payout**: ~$15/month per converted customer

## INPUT TO PROCESS

${contentToAnalyze}

Generate the notes now. Make them engaging, scannable, and information-dense. Quality over quantity — every line must earn its place.`,
      });

      // Validate AI response
      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title
      const titleResult = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `TITLE GENERATOR

Create ONE concise, engaging title that accurately represents this content.

Requirements:
- 3-8 words long
- Specific and descriptive (not vague)
- Start with a relevant emoji (📚 🧠 💡 🚀 📊 💰 🎯 🛠️ ⚡ 🔍 📈 🎨 ✅)
- Makes the topic sound interesting

Examples of GOOD titles:
- "📚 Framer Monetization"
- "🧠 Machine Learning Fundamentals"
- "💰 Financial Analysis & Investment Strategies"
- "🚀 Digital Marketing & SEO"

Examples of BAD titles (avoid these):
- "Notes" (too vague)
- "Analysis of document" (generic)
- "Important information" (not specific)

Content to Analyze:
${result.text.substring(0, 1000)}...

Source Document: ${transcript.originalName}

Generate ONE perfect title (no quotes, no extra text, just the title):`,
      });

      const aiGeneratedTitle =
        titleResult.text.trim().replace(/^["'`]|["'`]$/g, "") ||
        `Educational Notes on ${transcript.originalName}`;

      // Ensure title is reasonable length and add timestamp for uniqueness
      const baseTitle =
        aiGeneratedTitle.length > 80
          ? aiGeneratedTitle.substring(0, 77) + "..."
          : aiGeneratedTitle;
      const title = `${baseTitle}`;

      // Save the generated note to database
      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
        folderId,
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
    userId?: string,
    folderId?: string,
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
          "No content available in transcript to generate notes from",
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
  `,
      };

      const specificPrompt = prompts[noteType];

      const result = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `
SPECIALIZED EDUCATIONAL CONTENT ARCHITECT

Analysis ID: ${analysisId}
Timestamp: ${timestamp}
Note Type: ${noteType.toUpperCase()}
Document: ${transcript.originalName}

${specificPrompt}

Content to Transform into Professional Educational Notes:
${contentToAnalyze}

Provide a structured, engaging analysis that is unique to this specific document and context. Make it comprehensive and valuable for learning.

FORMATTING RULES:
- Use relevant emojis as prefixes for H1 and H2 section headers ONLY (📚 📊 🚀 💡 ✅ 💸 🗓️ ❓ 🔑 💎 🎯 📈 🛠️ ⚡ 🧠 🔍 📋 💰 🏆 🔄 📌). Do NOT scatter emojis through body text.
- Use markdown **tables** for ANY structured or comparative data (metrics, comparisons, feature lists, timelines, checklists with descriptions). Tables dramatically improve readability.
- Use **bold** for key terms, *italics* for definitions, blockquotes (>) for critical callouts.
- Keep bullets concise — one idea per bullet. Prioritize information density over verbosity.
- Do NOT repeat the same information across sections.
        `,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title based on note type and content
      const titleResult = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `FOCUSED NOTE TITLE GENERATOR

Create a perfect title for a ${noteType.toUpperCase()} note based on the content below.

Note Type: ${noteType} 
Source: ${transcript.originalName}

Title Requirements:
- Should reflect the ${noteType} focus (${noteType === "summary" ? "concise overview" : noteType === "detailed" ? "comprehensive analysis" : noteType === "action-items" ? "actionable strategies" : noteType === "technical" ? "technical implementation" : "executive briefing"})
- Be specific and descriptive (3-8 words)
- Start with a relevant emoji (📚 🧠 💡 🚀 📊 💰 🎯 🛠️ ⚡ 🔍 📈 🎨 ✅ 📋)
- Make the content type clear

Content Preview:
${result.text.substring(0, 500)}...

Generate ONE perfect title (no quotes, just the title):`,
      });

      const aiGeneratedTitle =
        titleResult.text.trim().replace(/^["'`]|["'`]$/g, "") ||
        `${noteType.charAt(0).toUpperCase() + noteType.slice(1)} Notes`;
      const title =
        aiGeneratedTitle.length > 80
          ? aiGeneratedTitle.substring(0, 77) + "..."
          : aiGeneratedTitle;

      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
        folderId,
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
          folderId: data.folderId,
        },
      });

      // Index the note content for vector search synchronously
      // This ensures the chatbot will work immediately after note creation
      console.log(`🔄 Starting indexing for note: ${note.id}`);
      console.log(`📊 Note content length: ${note.content.length} characters`);

      // Pre-indexing validation
      if (!note.content || note.content.trim().length === 0) {
        console.error(`❌ Cannot index note ${note.id}: content is empty`);
        console.warn(
          `⚠️ Note ${note.id} created but chatbot will not work (empty content)`,
        );
      } else if (!process.env.OPENAI_API_KEY) {
        console.error(
          `❌ Cannot index note ${note.id}: OPENAI_API_KEY not configured`,
        );
        console.warn(
          `⚠️ Note ${note.id} created but chatbot will not work (missing API key)`,
        );
      } else {
        try {
          await indexNoteContent(note.id, note.content);
          console.log(`✅ Successfully indexed note: ${note.id}`);
        } catch (error) {
          // Enhanced error logging with full details
          console.error(`❌ Error indexing note ${note.id}:`, error);

          if (error instanceof Error) {
            console.error(`❌ Error name: ${error.name}`);
            console.error(`❌ Error message: ${error.message}`);
            console.error(`❌ Error stack: ${error.stack}`);
          } else {
            console.error(`❌ Unknown error type:`, typeof error, error);
          }

          // Don't fail note creation if indexing fails
          // The note is still usable, just chatbot won't work until manual reindex
          console.warn(
            `⚠️ Note ${note.id} created but chatbot may not work until reindexed`,
          );
          console.warn(
            `⚠️ Please check the error logs above for details on why indexing failed`,
          );
        }
      }

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
              content: true,
              cleanContent: true,
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
              content: true,
              cleanContent: true,
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
          folderId: true,
          createdAt: true,
          updatedAt: true,
          transcript: {
            select: {
              id: true,
              originalName: true,
              content: true,
              cleanContent: true,
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
      console.error("Error retrieving user notes:", error);

      // Check if it's a Prisma error
      if (error && typeof error === "object" && "code" in error) {
        const prismaError = error as { code: string; message: string };

        switch (prismaError.code) {
          case "P2021":
            throw new Error(
              "Database table 'notes' does not exist. Please check your database migration status.",
            );
          case "P2002":
            throw new Error(
              "A unique constraint violation occurred while retrieving notes.",
            );
          case "P1001":
            throw new Error(
              "Database connection failed. Please check your database configuration.",
            );
          case "P2025":
            throw new Error("The requested notes data was not found.");
          default:
            throw new Error(
              `Database error (${prismaError.code}): ${prismaError.message}`,
            );
        }
      }

      // Handle other types of errors
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve user notes: ${error.message}`);
      }

      throw new Error(
        "An unexpected error occurred while retrieving user notes",
      );
    }
  }

  /**
   * Delete note by ID
   * Requirements: 7.4 - Cascade delete associated podcasts
   */
  async deleteNote(id: string) {
    try {
      // Delete the note (this will cascade delete podcasts due to database constraints)
      const deletedNote = await prisma.note.delete({
        where: { id },
      });

      console.log(`Successfully deleted note ${id} and associated podcasts`);
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
    data: Partial<Pick<NoteData, "title" | "content">>,
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
    title: string = "Text Note",
  ): Promise<NotesFromContentResult> {
    try {
      if (!content || content.trim().length === 0) {
        throw new Error("Content is required to generate notes");
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      const result = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `You are a SOURCE-GROUNDED NOTE GENERATOR that creates engaging, visually scannable notes.

Goal: Convert the provided SOURCE into clean, engaging notes that are easy to scan and packed with value. Focus ONLY on what the SOURCE says.

HARD RULES:
1) SOURCE ONLY: Use only information in SOURCE. No outside knowledge.
2) NO HALLUCINATION: If it's not in SOURCE, do not include it.
3) NO META TALK: Do not mention "PDF/paper/transcript/source" or talk about the document itself. Just present the information.
4) NO EXTRAS: Do not add quizzes, flashcards, self-tests, or follow-up questions.
5) NO GENERIC FILLER: Avoid vague filler like "this is important/valuable" unless SOURCE explicitly says so.
6) DATA CAUTION: Include numbers/percentages only if explicitly written in SOURCE text.
7) RELEVANCE FILTER (critical):
   - Silently infer the MAIN TOPIC of the SOURCE.
   - Include only content that helps understand the MAIN TOPIC.
   - Don't create standalone sections for minor side-mentions; fold into another section or omit.
   - A section should be supported by multiple points; otherwise fold or omit.
8) NO "STUDY MATERIAL" VOICE: No "study", "learner", "student", "mastery", "prerequisites", "learning path", "next steps". Notes must be neutral and content-focused.
9) CONTENT-ONLY OUTPUT: Every bullet must summarize a specific point from SOURCE. If a bullet cannot be traced to SOURCE, delete it.
10) NO REPETITION: Each piece of information appears ONCE only. Do not restate across sections.

OUTPUT FORMAT:

# [emoji] [Title]
Use the title from SOURCE if present; otherwise create a neutral descriptive title.

## Brief Overview
2-4 sentences summarizing what this content covers. Keep it tight.

## Key Points
4-7 bullet points (each prefixed with a relevant emoji) of the most important takeaways.

## [emoji] [Dynamic Section Title]
Create 4-8 content sections with dynamic titles based on SOURCE themes.
- Use **tables** for any structured/comparative data (metrics, comparisons, lists with attributes, timelines, checklists with descriptions)
- Use bullet points for explanations and insights
- Use numbered lists for sequential steps
- **Bold key terms** within bullets for scannability
- Use blockquotes (>) for critical definitions, formulas, or callouts
- Keep bullets concise — one idea per bullet

(Repeat for each section)

## ❓ Common Questions
Only include if the content naturally raises FAQs. Use bold question + 2-4 sentence answer format. Omit this section if no natural questions arise.

## 🔑 Key Takeaways
3-7 bullets of the most critical points from SOURCE.

FORMATTING RULES:
- Use emojis on H1, H2 headers, and key point bullets ONLY (📚 📊 🚀 💡 ✅ 💸 🗓️ ❓ 🔑 💎 🎯 📈 🛠️ ⚡ 🧠 🔍 📋 💰 🏆 🔄 📌 🎨 📝 🌟 ⚙️). Do NOT scatter emojis through body text.
- Use markdown tables for ANY structured data — this is critical for readability
- Keep bullets concise
- Bold key terms within bullets
- Use blockquotes for important callouts

Return ONLY the notes.

SOURCE TO PROCESS:
${content}`,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title
      const titleResult = await generateText({
        model: this.model,
        providerOptions: this.providerOptions,
        prompt: `TITLE GENERATOR

Create a perfect engaging title for these notes.

Requirements:
- Clearly describe what the content is about
- Be specific and engaging (3-8 words)
- Start with a relevant emoji (📚 🧠 💡 🚀 📊 💰 🎯 🛠️ ⚡ 🔍 📈 🎨 ✅ 📋)
- Make people want to read these notes

Original Title Provided: ${title}
Generated Content Preview:
${result.text.substring(0, 600)}...

Generate ONE perfect title (no quotes, just the title):`,
      });

      const aiGeneratedTitle =
        titleResult.text.trim().replace(/^["'`]|["'`]$/g, "") ||
        title ||
        "Educational Text Notes";
      const finalTitle =
        aiGeneratedTitle.length > 80
          ? aiGeneratedTitle.substring(0, 77) + "..."
          : aiGeneratedTitle;

      return {
        title: finalTitle,
        content: result.text,
      };
    } catch (error) {
      console.error("Error generating notes from content:", error);
      throw new Error("Failed to generate notes from content");
    }
  }
}

// Export a function for use in API routes
export async function generateNotesFromContent(
  content: string,
  title: string = "Text Note",
): Promise<NotesFromContentResult> {
  const noteService = new NoteService();
  return noteService.generateNotesFromContent(content, title);
}
