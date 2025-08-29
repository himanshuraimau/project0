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

        🎓✨ **INTERACTIVE EDUCATIONAL CONTENT CREATOR** 📚🚀

        You are an advanced AI educational content specialist with a flair for creating visually engaging learning materials! 🌟 Transform this document into well-formatted educational content that's both comprehensive AND visually clear. Make learning engaging while ensuring deep understanding! 💡

        ## 🚀🎯 TRANSFORMATION MISSION
        Create educational content that's informative and well-structured with abundant visual formatting that keeps learners engaged and focused! 📖✨

        ## 📚 INTERACTIVE LEARNING STRUCTURE

        ### 1. 🌟💫 LEARNING JOURNEY INTRODUCTION (400-600 words)
        ** What You'll Master:**
        -  Comprehensive breakdown of knowledge and skills
        -  Specific competencies and practical abilities  
        -  Level of expertise expected after studying

        **💡 Why This Matters:**
        -  Real-world significance and practical applications
        -  Industry relevance and professional impact
        -  Problems this knowledge solves and opportunities it creates

        **📋 Learning Prerequisites:**
        -  Required background knowledge with explanations
        -  Recommended preparation or foundational concepts
        -  Skill level assumptions and how to bridge gaps

        **🎨 Study Strategy:**
        -  Optimal approach for learning this material
        -  Recommended study sequence and time investment
        -  Learning techniques that work best for this subject

        ### 2. 🏗️ FOUNDATIONAL KNOWLEDGE ARCHITECTURE (500-800 words)

        **🧠 Essential Context for Deep Learning:**

        *📚 Historical Evolution:*
        -  Complete development story of these concepts
        -  Problems that led to innovations and solutions
        -  Key milestones and breakthrough moments

        *🔬 Theoretical Foundation:*
        -  Underlying principles and core theories
        -  Mathematical or scientific basis where applicable
        -  Fundamental laws or rules that govern this subject

        *🌐 Current Landscape:*
        -  State of the field today
        -  Major players, tools, and approaches
        -  Recent developments and emerging trends

        ### 3. 💫 CONCEPT MASTERY SECTIONS

        For each major topic (400-600 words per topic):

        **🧠✨ Complete Concept Explanation:**
        -  Clear, expandable definition (simple → detailed)
        -  Core mechanism: exactly HOW it works in clear steps
        -  Underlying reasoning and principles
        -  Visual description as if explaining a diagram

        **🔧⚡ Technical Deep Dive:**
        -  Process breakdown in numbered, sequential steps
        -  Mathematical, quantitative, or technical aspects
        -  Component analysis for complex systems
        -  Input-processing-output flow description

        **💼🎯 Practical Learning Examples:**
        -  Primary example with every step explained
        -  Alternative scenarios showing versatility
        -  Common real-world use cases
        -  Problem-solving applications

        **🧠 Learning Reinforcement:**
        -  Essential takeaways for permanent retention
        -  Common misconceptions and correct understanding
        -  Connections to other concepts in the material
        -  Memory aids, analogies, or frameworks

        ### 4. 📝 INTERACTIVE GLOSSARY

        For each term provide:
        -  Student-friendly definition (jargon-free)
        -  Detailed contextual description
        -  Practical examples showing usage
        -  Significance for understanding the subject

        ### 5. 🛠️ PRACTICAL MASTERY GUIDE (400-600 words)

        **🚀 Complete Learning Pathway:**

        *🏗️ Foundation Phase:*
        -  Recommended concept learning sequence
        -  Specific study techniques for each concept
        -  Comprehension checkpoints and verification methods

        *💼 Application Phase:*
        -  Methods for integrating different concepts
        -  Practical scenarios for knowledge application
        -  Problem-solving frameworks and approaches

        *🏆 Mastery Phase:*
        -  Distinguishing deep mastery from surface knowledge
        -  Teaching others to solidify understanding
        -  Staying current with field developments

        ### 6. 🚀🌟 GROWTH PATHWAY (500-800 words)

        **✅ Mastery Verification:**
        -  Self-assessment criteria for true understanding
        -  Practical application tests and scenarios
        -  Common knowledge gaps and identification methods

        **🎓💡 Educational Impact:**
        -  How this knowledge transforms understanding
        -  Specific skills gained and development continuation
        -  Professional readiness and career preparation

        **📚 Continued Learning:**
        -  Next-level topics with specific learning pathways
        -  Specialization options and direction choices
        -  Advanced resources for continued growth

        ## ✨ VISUAL PRESENTATION REQUIREMENTS

        -  Use abundant emojis (at least 25% more than usual) to highlight major sections and key points
        -  Create clear organization with structured formatting
        -  Utilize **bold**, *italics*, and other text formatting extensively
        -  Include numbered and bulleted lists for maximum clarity
        -  Add tip boxes with special insights when relevant
        -  Create clear separations between major sections
        -  Highlight critical concepts with attention-grabbing formatting
        -  Every major point should have an emoji for visual appeal

        ## INPUT PROCESSING INSTRUCTIONS

        Transform the provided document content through this engaging educational framework:

        **Document to Process:** ${contentToAnalyze}

        Create well-structured educational notes that are visually clear and formatted for maximum learning impact! 📖`,
      });

      // Validate AI response
      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title
      const titleResult = await generateText({
        model: this.model,
        prompt: `🎯 **EDUCATIONAL TITLE GENERATOR** 📚

You are an expert at creating engaging, descriptive titles for educational content. Your mission is to create a clear, compelling title that accurately represents the content and makes students excited to learn!

📖 **Content Summary:** Based on the following educational content, create ONE perfect title that:
-  Clearly describes what students will learn
-  Is specific and descriptive (not vague)
-  Sounds educational and professional
-  Makes the topic sound interesting and valuable
-  Is 3-8 words long (concise but descriptive)

**Examples of GOOD titles:**
- "Advanced React Hooks and State Management"
- "Machine Learning Fundamentals and Applications"
- "Financial Analysis and Investment Strategies"
- "Digital Marketing and SEO Optimization"

**Examples of BAD titles (avoid these):**
- "Notes" (too vague)
- "Analysis of document" (generic)
- "Important information" (not specific)

**Educational Content to Analyze:**
${result.text.substring(0, 1000)}...

**Source Document:** ${transcript.originalName}

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
🎯 **COMPREHENSIVE EXECUTIVE LEARNING SUMMARY** 📊

Create a comprehensive executive summary that serves as a complete learning overview:

**✨ EXECUTIVE LEARNING SUMMARY STRUCTURE:**
- 🔍 **Key Insights & Discoveries:** Most important findings and breakthrough concepts (200-300 words)
- 🚀 **Strategic Implications:** Business impact, decisions enabled, and strategic value (150-200 words)
- 🧠 **Core Concepts Mastered:** Essential knowledge gained from this material (150-200 words)
- ⚡ **Actionable Intelligence:** Immediate applications and implementation opportunities (100-150 words)
- 🌟 **Future Pathways:** Next steps, continued learning, and growth opportunities (100-150 words)

Focus on creating a summary that enables executives to understand both the immediate value and long-term learning implications. Make complex concepts accessible while maintaining depth and accuracy! 💼
  `,

        detailed: `
📚 **COMPREHENSIVE EDUCATIONAL MASTERY FRAMEWORK** 🎓

Provide a comprehensive educational analysis that enables complete mastery of all content:

**🌟 COMPREHENSIVE MASTERY FRAMEWORK:**
- 🏗️ **Learning Foundation:** Historical context, theoretical basis, and prerequisite knowledge (400-500 words)
- 🔍 **Detailed Concept Exploration:** In-depth analysis of every major topic with step-by-step explanations (500-800 words per major concept)
- 🔧 **Technical Deep Dives:** Methodologies, processes, and technical implementations explained thoroughly (300-400 words per technical aspect)
- 🛠️ **Practical Application Analysis:** Real-world use cases, examples, and implementation strategies (400-600 words)
- 🔗 **Integration Framework:** How concepts connect and build upon each other (200-300 words)
- ✅ **Mastery Assessment:** Self-check criteria and knowledge verification methods (200-300 words)

Explain everything as if teaching someone who needs to become an expert! Include multiple examples, analogies, and practical applications for each concept. 🚀
  `,

        "action-items": `
🎯 **STRATEGIC ACTION FRAMEWORK & IMPLEMENTATION GUIDE** ⚡

Create a comprehensive action-oriented guide that enables immediate implementation and long-term strategy:

**🚀 STRATEGIC ACTION FRAMEWORK:**
- **Immediate Actions (0-30 days):** Specific, implementable steps with clear success criteria and resource requirements (300-400 words)
- **Short-term Strategy (1-6 months):** Tactical initiatives with timelines, dependencies, and measurable outcomes (400-500 words)
- **Long-term Vision (6+ months):** Strategic recommendations with growth pathways and scalability considerations (300-400 words)
- **Resource Requirements:** Personnel, budget, tools, and infrastructure needed for each phase (200-300 words)
- **Risk Mitigation:** Potential challenges and proactive solutions (200-300 words)
- **Success Metrics:** KPIs, measurement frameworks, and evaluation criteria (200-250 words)
- **Implementation Roadmap:** Step-by-step execution plan with checkpoints and decision points (300-400 words)

Focus on creating actionable intelligence that bridges the gap between knowledge and implementation! Include specific tools, methodologies, and best practices. 💪
  `,

        technical: `
🔧 **COMPREHENSIVE TECHNICAL MASTERY FRAMEWORK** ⚡

Provide a comprehensive technical analysis that enables deep technical mastery and implementation:
    
**🛠️ TECHNICAL MASTERY FRAMEWORK:**
- 🏗️ **Technical Foundation:** Core technologies, architectures, and theoretical principles (400-500 words)
- ⚙️ **Detailed Methodologies:** Step-by-step technical processes with implementation details (500-700 words)
- 🔧 **Technology Stack Analysis:** Tools, platforms, APIs, and technical requirements with specific recommendations (400-500 words)
- 🏛️ **Architecture & Design Patterns:** System design principles, best practices, and scalability considerations (400-600 words)
- 💻 **Implementation Guidelines:** Code examples, configuration details, and technical specifications (500-700 words)
- 🔍 **Technical Troubleshooting:** Common issues, debugging approaches, and solution strategies (300-400 words)
- 🚀 **Performance & Optimization:** Efficiency considerations, monitoring, and improvement strategies (300-400 words)
- 🔗 **Integration & APIs:** Technical connectivity, data flows, and system interactions (300-400 words)
    
Explain technical concepts with sufficient depth for implementation while maintaining clarity. Include specific examples, code snippets where relevant, and practical technical guidance! 🌟
  `,

        executive: `
👔 **STRATEGIC EXECUTIVE BRIEFING & DECISION FRAMEWORK** 📊

Create a strategic executive briefing that enables informed decision-making and strategic planning:
    
**🎯 EXECUTIVE DECISION FRAMEWORK:**
- 🌟 **Strategic Overview:** Business context, market implications, and competitive advantages (300-400 words)
- 💰 **Financial Impact Analysis:** Cost-benefit analysis, ROI projections, and budget considerations (300-400 words)
- ⚠️ **Risk & Opportunity Assessment:** Strategic risks, market opportunities, and mitigation strategies (300-400 words)
- 🏢 **Resource Requirements:** Personnel, infrastructure, and investment needs with timeline implications (250-300 words)
- 🏆 **Competitive Intelligence:** Market positioning, competitive advantages, and differentiation opportunities (300-350 words)
- 🗺️ **Implementation Strategy:** High-level roadmap, key milestones, and success criteria (300-400 words)
- 👥 **Stakeholder Impact:** Effects on customers, employees, partners, and other stakeholders (200-300 words)
- 🎯 **Decision Points:** Critical choices, trade-offs, and strategic alternatives (250-300 words)
    
Focus on strategic insights that enable confident decision-making. Present complex information in executive-friendly format while maintaining analytical rigor and actionable recommendations! 🚀
  `,

        tutorial: `
🎓 **COMPREHENSIVE TUTORIAL MASTERY FRAMEWORK** ✨

Create comprehensive tutorial-style educational content that enables complete skill mastery:
    
**📖 TUTORIAL MASTERY FRAMEWORK:**
- 🚀 **Learning Journey Introduction:** What you'll master, why it matters, prerequisites, and study strategy (400-600 words)
- 🏗️ **Foundational Knowledge Building:** Historical context, theoretical foundation, and current landscape (500-800 words)
- 🎯 **Step-by-Step Concept Mastery:** Detailed explanations of each concept with examples and applications (400-600 words per major concept)
- 💼 **Practical Application Guide:** Hands-on exercises, real-world scenarios, and implementation strategies (400-600 words)
- 📋 **Comprehensive Learning Glossary:** Detailed definitions with context and examples (4-6 sentences per term)
- ✅ **Mastery Assessment:** Self-check criteria, knowledge gaps identification, and remediation strategies (300-400 words)
- 🚀 **Continued Learning Pathway:** Next steps, advanced topics, and specialization options (400-500 words)
    
Write as if teaching someone who needs deep mastery, not just surface understanding. Include multiple examples, clear explanations, and practical applications throughout! 🌟
  `,

        research: `
🔬 **COMPREHENSIVE RESEARCH ANALYSIS FRAMEWORK** 🎯

Provide comprehensive research analysis that enables evidence-based understanding and decision-making:
    
**📈 RESEARCH ANALYSIS FRAMEWORK:**
- 🧪 **Research Context & Methodology:** Study background, research methods, and analytical approach (300-400 words)
- 🏆 **Key Findings & Evidence:** Primary discoveries with supporting data and statistical significance (500-700 words)
- 📊 **Comparative Analysis:** How findings relate to existing research, contradictions, and confirmations (400-500 words)
- 🌍 **Implications & Applications:** Practical significance, real-world applications, and impact assessment (400-500 words)
- ⚠️ **Limitations & Considerations:** Research constraints, potential biases, and interpretive cautions (300-400 words)
- 🚀 **Future Research Directions:** Unanswered questions, recommended studies, and research opportunities (300-400 words)
- ✅ **Evidence Quality Assessment:** Reliability, validity, and confidence levels of findings (200-300 words)
    
Present research with academic rigor while making findings accessible and actionable. Include critical analysis and practical implications! 🌟
  `,

        creative: `
🎨 **CREATIVE LEARNING TRANSFORMATION FRAMEWORK** ✨

Transform content into engaging, creative educational material that inspires and educates:
    
**🚀 CREATIVE LEARNING FRAMEWORK:**
- 🎯 **Engaging Introduction:** Hook the reader with compelling stories, analogies, or thought experiments (300-400 words)
- 📚 **Narrative-Driven Explanations:** Use storytelling to explain complex concepts and make them memorable (400-600 words per major concept)
- 👁️ **Visual Descriptions:** Paint vivid mental pictures of abstract concepts and processes (300-400 words)
- 🧠 **Creative Analogies & Metaphors:** Use familiar concepts to explain unfamiliar ones (200-300 words per analogy)
- 🎮 **Interactive Elements:** Thought experiments, hypothetical scenarios, and engaging questions (300-400 words)
- 🧠 **Memorable Frameworks:** Create acronyms, mnemonics, and memorable structures for complex information (200-300 words)
- 🌟 **Inspirational Applications:** Show the exciting possibilities and transformative potential (300-400 words)
    
Make learning enjoyable and memorable while maintaining educational value. Use creativity to enhance understanding, not replace substance! 🎓✨
  `
      };

      const specificPrompt = prompts[noteType];

      const result = await generateText({
        model: this.model,
        prompt: `
🎓 **SPECIALIZED EDUCATIONAL CONTENT ARCHITECT** 📚

Analysis ID: ${analysisId}
Timestamp: ${timestamp}
Note Type: ${noteType.toUpperCase()} ✨
Document: ${transcript.originalName}

${specificPrompt}

📖 **Content to Transform into Amazing Educational Notes:**
${contentToAnalyze}

🚀 Provide a structured, professional analysis that is unique to this specific document and context. Make it engaging, comprehensive, and valuable for learning! 🌟
        `,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate an AI-powered descriptive title based on note type and content
      const titleResult = await generateText({
        model: this.model,
        prompt: `🎯 **FOCUSED NOTE TITLE GENERATOR** 📚

Create a perfect title for a ${noteType.toUpperCase()} note based on the content below.

**Note Type:** ${noteType} 
**Source:** ${transcript.originalName}

**Title Requirements:**
-  Should reflect the ${noteType} focus (${noteType === 'summary' ? 'concise overview' : noteType === 'detailed' ? 'comprehensive analysis' : noteType === 'action-items' ? 'actionable strategies' : noteType === 'technical' ? 'technical implementation' : 'executive briefing'})
-  Be specific and descriptive (3-8 words)
-  Sound professional and educational
-  Make the content type clear

**Content Preview:**
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
🎓 **SPECIALIZED AI TUTOR & EDUCATIONAL CONTENT ARCHITECT** 📚

Analysis ID: ${analysisId}
Timestamp: ${timestamp}
Source: Text Input ✍️
Title: ${title}

You are a specialized AI tutor, designed to transform text content into comprehensive, tutorial-style educational notes that make learning both engaging and effective! Your mission is to create detailed study materials that teach concepts thoroughly, as if you were the most patient, expert teacher explaining everything step-by-step to help someone truly master the subject. ✨

🎯 **TRANSFORMATION MISSION:** Convert the following text content into amazing educational notes that students will love to learn from!

📖 **Content to Transform:**
${content}

🌟 **CREATE STRUCTURED, ENGAGING EDUCATIONAL NOTES THAT INCLUDE:**

### 1. 🚀 **Clear Overview of Main Concepts**
- 🎯 What students will learn and master
- 💡 Why this knowledge is valuable and important
- 🔍 Key themes and main ideas to focus on
- 📋 Learning objectives and goals

### 2. 📚 **Detailed Explanations of Key Points**
- 🧠 Step-by-step breakdowns of complex concepts
- 💭 Clear reasoning and logical connections
- 🔗 How different ideas relate to each other
- 📖 In-depth coverage with examples and context

### 3. ⚡ **Important Insights and Takeaways**
- 💎 Golden nuggets of wisdom and key insights
- 🎯 Essential points for long-term retention
- ✨ "Aha moments" and breakthrough understanding
- 🔑 Critical concepts that unlock deeper learning

### 4. 🛠️ **Practical Applications** (where relevant)
- 🌍 Real-world examples and use cases
- 💼 Professional or academic applications
- 🎮 Interactive scenarios and problem-solving
- 🏆 How to apply knowledge in practice

### 5. 📝 **Summary of Essential Information**
- ✅ Quick reference points and key facts
- 📌 Most important concepts to remember
- 🔄 Review points for reinforcement
- 🎪 Memorable frameworks or structures

🎨 **STYLE GUIDELINES:**
- Use engaging, enthusiastic tone that makes learning fun! 🎉
- Include clear headings and bullet points for easy navigation 📋
- Add emphasis with **bold** and *italics* when helpful ✨
- Make complex concepts accessible and understandable 🧩
- Build confidence through structured, logical progression 💪
- Create notes that students will want to review and study! 📚

Make the notes comprehensive yet accessible, suitable for both learning and quick reference. Transform knowledge into an adventure! 🚀`,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error('AI failed to generate meaningful content');
      }

      // Generate an AI-powered descriptive title
      const titleResult = await generateText({
        model: this.model,
        prompt: `🎯 **TEXT NOTE TITLE GENERATOR** 📝

Create a perfect educational title for notes generated from the text content below.

**Requirements:**
- ✨ Clearly describe what the content is about
- 🎯 Be specific and engaging (3-8 words)
- 📚 Sound educational and valuable
- 💡 Make students want to read these notes

**Original Title Provided:** ${title}
**Generated Content Preview:**
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
