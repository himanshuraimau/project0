import { prisma } from "./prisma";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { indexNoteContent } from "./embedding-service";
import {
  NoteData,
  NoteType,
  GeneratedNoteResult,
  NotesFromContentResult
} from "./types/notes.types";


export class NoteService {
  private model = openai("gpt-4o");

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

      // Generate AI summary using the same prompt structure from your example
      const result = await generateText({
        model: this.model,
        prompt: `
          Analysis ID: ${analysisId}
Timestamp: ${timestamp}
Document: ${transcript.originalName}

You are an advanced AI educational content specialist, designed to transform any document into comprehensive, tutorial-style learning materials. Your mission is to create detailed study notes that not only summarize content but teach concepts thoroughly, as if you were an expert educator helping someone achieve complete mastery of the subject.

## CORE TRANSFORMATION PHILOSOPHY
Transform the input document into educational content that enables deep understanding, not just surface-level knowledge. Every explanation should be detailed enough that a learner never needs to ask "but how does that actually work?" or "can you explain that more clearly?"

## COMPREHENSIVE EDUCATIONAL STRUCTURE

### 1. LEARNING JOURNEY INTRODUCTION (400-600 words)
Create a detailed educational overview that establishes the learning foundation:

**What You'll Master:**
- Comprehensive breakdown of knowledge and skills to be gained
- Specific competencies and practical abilities
- Level of expertise expected after studying this material

**Why This Matters:**
- Real-world significance and practical applications
- Industry relevance and professional impact
- Problems this knowledge solves and opportunities it creates

**Learning Prerequisites:**
- Required background knowledge with brief explanations
- Recommended preparation or foundational concepts
- Skill level assumptions and how to bridge gaps

**Study Strategy:**
- Optimal approach for learning this material
- Recommended study sequence and time investment
- Learning techniques that work best for this subject

**Key Breakthrough Moments:**
- Major insights or "aha moments" to expect
- Conceptual shifts that transform understanding
- Critical connections that tie everything together

**Professional Applications:**
- Specific career contexts where this applies
- Industry use cases and business value
- Skills that translate to practical work scenarios

### 2. FOUNDATIONAL KNOWLEDGE ARCHITECTURE (500-800 words)

**Essential Context for Deep Learning:**

*Historical Evolution:*
- Complete development story of these concepts
- Problems that led to innovations and solutions
- Key milestones and breakthrough moments
- Evolution from past approaches to current methods

*Theoretical Foundation:*
- Underlying principles and core theories
- Mathematical or scientific basis where applicable
- Fundamental laws or rules that govern this subject
- Conceptual frameworks that organize the knowledge

*Current Landscape:*
- State of the field today
- Major players, tools, and approaches
- Recent developments and emerging trends
- How this fits into the broader ecosystem

*Problem-Solution Journey:*
- Original problems and challenges
- Evolution of solutions over time
- Why current approaches work better
- Remaining challenges and future directions

**Learning Foundation Building:**
- Prerequisite concepts with detailed explanations
- Mathematical/technical background needed
- Connected fields and interdisciplinary aspects
- Building blocks that everything else depends on

### 3. COMPREHENSIVE CONCEPT MASTERY SECTIONS

For each major topic identified in the document, provide complete educational coverage (400-600 words per major topic):

**A. Complete Concept Explanation:**
- Clear, expandable definition (simple → detailed)
- Core mechanism: exactly HOW it works in clear steps
- Underlying reasoning and principles
- Visual description as if explaining a diagram
- Most critical insight students must grasp

**B. Technical Deep Dive:**
- Process breakdown in numbered, sequential steps
- Mathematical, quantitative, or technical aspects
- Component analysis for complex systems
- Input-processing-output flow description
- Critical points, edge cases, special considerations

**C. Practical Learning Examples:**
- Primary example with every step explained
- Alternative scenarios showing versatility
- Common real-world use cases
- Problem-solving applications
- Troubleshooting common issues

**D. Learning Reinforcement:**
- Essential takeaways for permanent retention
- Common misconceptions and correct understanding
- Connections to other concepts in the material
- Memory aids, analogies, or frameworks
- Self-check questions for comprehension

**For Each Subtopic (200-300 words):**
- Complete explanation with clear reasoning
- Practical context and real-world relevance
- Integration points with main topics
- Supporting examples and applications

### 4. COMPREHENSIVE LEARNING GLOSSARY

Create detailed explanations for all important terms (4-6 sentences each):

For each term provide:
- Student-friendly definition (jargon-free)
- Detailed contextual description
- Practical examples showing usage
- Significance for understanding the subject
- Professional/academic usage patterns
- Related concepts and connections

Organize by learning importance and sequence, covering all essential terms while prioritizing those critical for core understanding.

### 5. PRACTICAL MASTERY AND APPLICATION GUIDE (400-600 words)

**Complete Learning Pathway:**

*Foundation Phase:*
- Recommended concept learning sequence
- Specific study techniques for each concept type
- Comprehension checkpoints and verification methods
- Common learning challenges and solution strategies

*Application Phase:*
- Methods for integrating different concepts
- Practical scenarios for knowledge application
- Problem-solving frameworks and approaches
- Skill development through hands-on practice

*Mastery Phase:*
- Distinguishing deep mastery from surface knowledge
- Teaching others to solidify understanding
- Staying current with field developments
- Professional application strategies

*Implementation Strategies:*
- Effective study session organization
- Systematic review and reinforcement approaches
- Regular practice exercises and skill maintenance
- Long-term knowledge retention techniques

### 6. LEARNING ASSESSMENT AND GROWTH PATHWAY (500-800 words)

**Mastery Verification:**
- Self-assessment criteria for true understanding
- Practical application tests and scenarios
- Common knowledge gaps and identification methods
- Remediation strategies for discovered gaps

**Educational Impact Analysis:**
- How this knowledge transforms field understanding
- Specific skills gained and development continuation
- Professional readiness and career preparation
- Academic foundation for advanced study

**Continued Learning Architecture:**
- Next-level topics with specific learning pathways
- Specialization options and direction choices
- Advanced resources for continued growth
- Community engagement for ongoing learning
- Innovation opportunities and contribution areas

**Long-Term Knowledge Management:**
- Knowledge maintenance and skill sharpening
- Adaptation strategies as the field evolves
- Teaching and mentoring opportunities
- Continuous innovation and cutting-edge development

## EDUCATIONAL QUALITY STANDARDS

**Tutorial-Level Explanations:**
- Complete understanding enabling independent mastery
- No assumptions beyond stated prerequisites
- Step-by-step clarity for complex processes
- Multiple explanation approaches for different learning styles

**Learning-Optimized Structure:**
- Logical progression for optimal learning sequence
- Reinforced concepts revisited throughout
- Theory immediately connected to practical applications
- Memory-enhanced information structure

**Student Success Focus:**
- Anticipate and address natural questions
- Prevent confusion through proactive clarification
- Build confidence through structured success
- Enable students to teach concepts to others

## INPUT PROCESSING INSTRUCTIONS

Transform the provided document content through this comprehensive educational framework:

**Educational Transformation Process:**
1. Learning Analysis: Identify every concept needing detailed explanation
2. Tutorial Planning: Organize for step-by-step learning progression  
3. Deep Explanation Creation: Write comprehensive, tutorial-style explanations
4. Example Integration: Include detailed examples throughout
5. Learning Optimization: Structure for maximum educational effectiveness

**Success Metrics:**
- Students achieve deep mastery using only these notes
- Complex concepts become intuitively understandable
- Practical applications are clear and actionable
- Learning progression builds understanding systematically
- Students confidently explain concepts to others

**Document to Process:** ${contentToAnalyze}

Transform the provided document into comprehensive educational notes that serve as a complete tutorial for achieving subject mastery.`,
      });

      // Validate AI response
      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate a title with timestamp to ensure uniqueness
      const baseTitle =
        result.text
          .split("\n")
          .find((line) => line.trim().length > 0)
          ?.replace(/^\*+\s*/, "") || `Analysis of ${transcript.originalName}`;
      const uniqueTitle = `${baseTitle.substring(
        0,
        80
      )} - ${new Date().toLocaleDateString()}`;
      const title =
        uniqueTitle.length > 100
          ? uniqueTitle.substring(0, 97) + "..."
          : uniqueTitle;

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
    Create a comprehensive executive summary that serves as a complete learning overview:
    
    **EXECUTIVE LEARNING SUMMARY STRUCTURE:**
    - **Key Insights & Discoveries:** Most important findings and breakthrough concepts (200-300 words)
    - **Strategic Implications:** Business impact, decisions enabled, and strategic value (150-200 words)
    - **Core Concepts Mastered:** Essential knowledge gained from this material (150-200 words)
    - **Actionable Intelligence:** Immediate applications and implementation opportunities (100-150 words)
    - **Future Pathways:** Next steps, continued learning, and growth opportunities (100-150 words)
    
    Focus on creating a summary that enables executives to understand both the immediate value and long-term learning implications. Make complex concepts accessible while maintaining depth and accuracy.
  `,

        detailed: `
    Provide a comprehensive educational analysis that enables complete mastery of all content:
    
    **COMPREHENSIVE MASTERY FRAMEWORK:**
    - **Learning Foundation:** Historical context, theoretical basis, and prerequisite knowledge (400-500 words)
    - **Detailed Concept Exploration:** In-depth analysis of every major topic with step-by-step explanations (500-800 words per major concept)
    - **Technical Deep Dives:** Methodologies, processes, and technical implementations explained thoroughly (300-400 words per technical aspect)
    - **Practical Application Analysis:** Real-world use cases, examples, and implementation strategies (400-600 words)
    - **Integration Framework:** How concepts connect and build upon each other (200-300 words)
    - **Mastery Assessment:** Self-check criteria and knowledge verification methods (200-300 words)
    
    Explain everything as if teaching someone who needs to become an expert. Include multiple examples, analogies, and practical applications for each concept.
  `,

        "action-items": `
    Create a comprehensive action-oriented guide that enables immediate implementation and long-term strategy:
    
    **STRATEGIC ACTION FRAMEWORK:**
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
    Provide a comprehensive technical analysis that enables deep technical mastery and implementation:
    
    **TECHNICAL MASTERY FRAMEWORK:**
    - **Technical Foundation:** Core technologies, architectures, and theoretical principles (400-500 words)
    - **Detailed Methodologies:** Step-by-step technical processes with implementation details (500-700 words)
    - **Technology Stack Analysis:** Tools, platforms, APIs, and technical requirements with specific recommendations (400-500 words)
    - **Architecture & Design Patterns:** System design principles, best practices, and scalability considerations (400-600 words)
    - **Implementation Guidelines:** Code examples, configuration details, and technical specifications (500-700 words)
    - **Technical Troubleshooting:** Common issues, debugging approaches, and solution strategies (300-400 words)
    - **Performance & Optimization:** Efficiency considerations, monitoring, and improvement strategies (300-400 words)
    - **Integration & APIs:** Technical connectivity, data flows, and system interactions (300-400 words)
    
    Explain technical concepts with sufficient depth for implementation while maintaining clarity. Include specific examples, code snippets where relevant, and practical technical guidance.
  `,

        executive: `
    Create a strategic executive briefing that enables informed decision-making and strategic planning:
    
    **EXECUTIVE DECISION FRAMEWORK:**
    - **Strategic Overview:** Business context, market implications, and competitive advantages (300-400 words)
    - **Financial Impact Analysis:** Cost-benefit analysis, ROI projections, and budget considerations (300-400 words)
    - **Risk & Opportunity Assessment:** Strategic risks, market opportunities, and mitigation strategies (300-400 words)
    - **Resource Requirements:** Personnel, infrastructure, and investment needs with timeline implications (250-300 words)
    - **Competitive Intelligence:** Market positioning, competitive advantages, and differentiation opportunities (300-350 words)
    - **Implementation Strategy:** High-level roadmap, key milestones, and success criteria (300-400 words)
    - **Stakeholder Impact:** Effects on customers, employees, partners, and other stakeholders (200-300 words)
    - **Decision Points:** Critical choices, trade-offs, and strategic alternatives (250-300 words)
    
    Focus on strategic insights that enable confident decision-making. Present complex information in executive-friendly format while maintaining analytical rigor and actionable recommendations.
  `,

        tutorial: `
    Create comprehensive tutorial-style educational content that enables complete skill mastery:
    
    **TUTORIAL MASTERY FRAMEWORK:**
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
    Provide comprehensive research analysis that enables evidence-based understanding and decision-making:
    
    **RESEARCH ANALYSIS FRAMEWORK:**
    - **Research Context & Methodology:** Study background, research methods, and analytical approach (300-400 words)
    - **Key Findings & Evidence:** Primary discoveries with supporting data and statistical significance (500-700 words)
    - **Comparative Analysis:** How findings relate to existing research, contradictions, and confirmations (400-500 words)
    - **Implications & Applications:** Practical significance, real-world applications, and impact assessment (400-500 words)
    - **Limitations & Considerations:** Research constraints, potential biases, and interpretive cautions (300-400 words)
    - **Future Research Directions:** Unanswered questions, recommended studies, and research opportunities (300-400 words)
    - **Evidence Quality Assessment:** Reliability, validity, and confidence levels of findings (200-300 words)
    
    Present research with academic rigor while making findings accessible and actionable. Include critical analysis and practical implications.
  `,

        creative: `
    Transform content into engaging, creative educational material that inspires and educates:
    
    **CREATIVE LEARNING FRAMEWORK:**
    - **Engaging Introduction:** Hook the reader with compelling stories, analogies, or thought experiments (300-400 words)
    - **Narrative-Driven Explanations:** Use storytelling to explain complex concepts and make them memorable (400-600 words per major concept)
    - **Visual Descriptions:** Paint vivid mental pictures of abstract concepts and processes (300-400 words)
    - **Creative Analogies & Metaphors:** Use familiar concepts to explain unfamiliar ones (200-300 words per analogy)
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
          Analysis ID: ${analysisId}
          Timestamp: ${timestamp}
          Note Type: ${noteType.toUpperCase()}
          Document: ${transcript.originalName}
          
          ${specificPrompt}
          
          Analyze the following content and generate notes in the requested style:
          
          ${contentToAnalyze}
          
          Provide a structured, professional analysis that is unique to this specific document and context.
        `,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      const title = `${noteType.charAt(0).toUpperCase() + noteType.slice(1)
        } - ${transcript.originalName} - ${new Date().toLocaleDateString()}`;

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
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
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
        include: {
          transcript: {
            select: {
              id: true,
              originalName: true,
              createdAt: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error retrieving user notes:", error);
      throw new Error("Failed to retrieve user notes");
    }
  }

  /**
   * Delete note by ID
   */
  async deleteNote(id: string) {
    try {
      return await prisma.note.delete({
        where: { id },
      });
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
        prompt: `
          Analysis ID: ${analysisId}
          Timestamp: ${timestamp}
          Source: Text Input
          Title: ${title}
          
          You are a specialized AI tutor, designed to transform text content into comprehensive, tutorial-style educational notes. Your mission is to create detailed study materials that teach concepts thoroughly, as if you were a patient, expert teacher explaining everything step-by-step to help someone truly master the subject.

          Transform the following text content into comprehensive educational notes:

          ${content}

          Create structured, educational notes that include:
          1. A clear overview of the main concepts
          2. Detailed explanations of key points
          3. Important insights and takeaways
          4. Practical applications where relevant
          5. A summary of essential information

          Make the notes comprehensive yet accessible, suitable for learning and reference.
        `,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error('AI failed to generate meaningful content');
      }

      // Generate a descriptive title based on the content
      const generatedTitle = title || `Notes - ${new Date().toLocaleDateString()}`;

      return {
        title: generatedTitle,
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
