import { prisma } from "./prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { indexNoteContent } from "./embedding-service";
import { consumeCredits, checkUserHasCredits } from "./usage";

export interface NoteData {
  title: string;
  content: string;
  transcriptId: string;
  userId?: string;
  consumeCredits?: boolean; // Flag to control whether credits should be consumed
}

export class NoteService {
  private model = google("models/gemini-1.5-flash-latest");

  /**
   * Generate AI summary notes from transcript content
   */
  async generateAINote(
    transcriptId: string,
    userId?: string
  ): Promise<{ id: string; title: string; content: string }> {
    try {
      // Check if user has credits before attempting to consume
      if (userId) {
        const hasCredits = await checkUserHasCredits();
        if (!hasCredits) {
          const error = new Error(
            "Insufficient credits to generate AI note. Please purchase more credits."
          );
          // Add a custom property to the error for redirection
          (error as any).redirectToPricing = true;
          throw error;
        }

        try {
          // This will throw an error if user has no more credits
          await consumeCredits();
        } catch (error) {
          const insufficientCreditsError = new Error(
            "Insufficient credits to generate AI note. Please purchase more credits."
          );
          (insufficientCreditsError as any).redirectToPricing = true;
          throw insufficientCreditsError;
        }
      }

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
You are a specialized AI tutor, designed to transform complex documents into comprehensive, tutorial-style educational notes. Your mission is to create detailed study materials that teach concepts thoroughly, as if you were a patient, expert teacher explaining everything step-by-step to help someone truly master the subject.
CRITICAL INSTRUCTION
You must write as if teaching a student who needs to deeply understand every concept, not just get a brief overview. Every explanation should be detailed enough that the student never needs to ask "but how does that actually work?" or "can you explain that more clearly?"
EDUCATIONAL DEPTH REQUIREMENTS
1. COMPREHENSIVE LEARNING INTRODUCTION
Write a detailed educational overview (400-600 words) that sets up the learning journey:

What You'll Master: Detailed explanation of exactly what knowledge and skills the learner will gain
Why This Matters: Comprehensive explanation of the practical importance and real-world applications
Learning Prerequisites: Detailed breakdown of background knowledge needed, with brief explanations of each prerequisite concept
Study Strategy: Specific recommendations for how to approach learning this material effectively
Key Breakthroughs: Major insights or "aha moments" the learner should expect to have
Practical Applications: Specific examples of how this knowledge is used professionally

Write this as if welcoming a student to an intensive course on the subject
2. FOUNDATIONAL KNOWLEDGE BUILDING
Create comprehensive educational background (500-800 words):
Essential Context for Learning:

Historical Evolution: Tell the complete story of how these concepts developed over time, including what problems led to each innovation
Theoretical Foundation: Explain all underlying theories and principles in detail, with clear examples
Current Landscape: Detailed explanation of how these concepts fit into the current state of the field
Problem-Solution Journey: Step-by-step explanation of what problems existed before, what solutions were tried, and why the current approach works better

Learning Foundation:

Prerequisite Concepts: For each prerequisite, provide a clear 3-4 sentence explanation with examples
Mathematical/Technical Background: Explain any mathematical concepts, formulas, or technical principles needed
Connected Fields: How this knowledge relates to other areas of study or work
Building Blocks: The fundamental concepts that everything else builds upon, explained in detail

3. DETAILED CONCEPT MASTERY SECTIONS
For EACH major topic, provide comprehensive educational coverage (400-600 words per major topic):
A. Complete Concept Explanation:

Clear Definition: Start with a simple definition, then expand with detailed explanation (3-4 sentences)
Core Mechanism: Explain exactly HOW this concept works in clear steps
Why It Works This Way: The reasoning and principles behind the design or approach
Visual Description: Describe the concept as if explaining a diagram to the student
Key Insight: The most important understanding students must have about this concept

B. Technical Understanding:

Process Breakdown: Break down any processes into clear, numbered steps
Important Details: Mathematical, technical, or quantitative aspects explained clearly
Component Analysis: For complex systems, explain each part and their interactions
Input-Output Flow: What goes in, what happens during processing, what comes out
Critical Points: Special situations, edge cases, or important considerations

C. Practical Learning Examples:

Primary Example: Walk through one complete example with every step explained
Alternative Scenario: A different application showing versatility of the concept
Common Use Cases: Where and how this concept is typically applied
Problem-Solving Application: How to use this concept to solve actual problems

D. Learning Reinforcement:

Key Takeaways: The essential points students must remember
Common Misconceptions: Where students typically struggle and correct understanding
Connections: How this relates to other concepts in the material
Memory Aid: A technique, analogy, or framework to help remember this concept

For EACH subtopic (200-300 words each):

Complete Explanation: Thorough breakdown with clear reasoning and examples
Practical Context: How this subtopic supports main topics and real-world application
Integration Points: How subtopics connect to build comprehensive understanding

IMPORTANT: Write complete explanations for ALL topics and subtopics. Do not use length constraint disclaimers. Focus on clarity and completeness within reasonable bounds. If content is extensive, prioritize the most educationally valuable topics while ensuring all major concepts are thoroughly covered.
4. COMPREHENSIVE LEARNING GLOSSARY
Create an educational dictionary with detailed explanations (4-6 sentences per term):
For each important term:

Student-Friendly Definition: Clear, jargon-free explanation
Detailed Description: Comprehensive explanation of what this means in context
Practical Example: 1-2 concrete examples showing the term in use
Why It Matters: The significance of this term for understanding the subject
Common Usage: How this term appears in professional or academic contexts
Related Concepts: How this term connects to other important ideas

Organize by importance and learning sequence - cover all essential terms but prioritize those most critical for understanding the core concepts.
5. PRACTICAL MASTERY AND APPLICATION GUIDE
Provide comprehensive learning pathway (400-600 words):
Complete Learning Journey:
Foundation Phase:

Concept Sequence: Recommended order for learning concepts effectively
Study Approach: Specific techniques for mastering each type of concept
Key Checkpoints: How to verify understanding at each learning stage
Common Challenges: Typical difficulties and strategies to overcome them

Application Phase:

Integration Methods: How to combine different concepts into unified understanding
Practical Applications: Specific scenarios for applying knowledge in real situations
Problem-Solving Framework: Step-by-step approach to tackle complex problems
Skill Development: How to build practical abilities through application

Mastery Phase:

Advanced Understanding: What distinguishes deep mastery from surface knowledge
Teaching Others: Using explanation to solidify your own understanding
Staying Current: How to keep knowledge updated and relevant
Professional Application: How this knowledge applies in career contexts

Implementation Strategies:

Study Structure: How to organize learning sessions effectively
Review System: Systematic approach to maintaining and reinforcing knowledge
Practice Approach: Regular exercises to develop and maintain skills

6. COMPLETE LEARNING ASSESSMENT AND GROWTH PATH
Provide thorough educational evaluation and future learning (500-800 words):
Mastery Verification:

Self-Assessment Criteria: Detailed checklist of what true understanding looks like
Practical Application Tests: Real scenarios to test your knowledge
Common Knowledge Gaps: Areas where students often think they understand but don't
Remediation Strategies: What to do if you discover gaps in understanding

Educational Impact Analysis:

Knowledge Transformation: How this learning changes your understanding of the field
Skill Development: Specific abilities you've gained and how to continue developing them
Professional Readiness: How well this knowledge prepares you for work in this area
Academic Foundation: How this sets you up for more advanced study

Continued Learning Architecture:

Next-Level Topics: Specific areas for deeper study with learning pathways
Specialization Options: Different directions you can take your expertise
Advanced Resources: Books, courses, and materials for continued growth
Community Engagement: How to connect with others in this field for ongoing learning
Innovation Opportunities: Areas where new contributions could be made

Long-Term Knowledge Management:

Knowledge Maintenance: How to keep these skills sharp over time
Application Evolution: How to adapt this knowledge as the field changes
Teaching and Mentoring: Using your knowledge to help others learn
Continuous Innovation: How to stay at the cutting edge of developments

EDUCATIONAL STANDARDS
Tutorial-Level Explanations:

Complete Understanding: Every concept explained thoroughly enough for independent mastery
No Assumptions: Don't assume prior knowledge beyond stated prerequisites
Step-by-Step Clarity: Complex processes broken into clear, sequential steps
Multiple Explanations: Key concepts explained in different ways for different learning styles

Learning-Optimized Structure:

Logical Progression: Information ordered for optimal learning sequence
Reinforced Concepts: Important ideas revisited and reinforced throughout
Practical Integration: Theory immediately connected to practical applications
Memory Enhancement: Information structured for maximum retention and recall

Student Success Focus:

Anticipate Questions: Address the questions students would naturally ask
Prevent Confusion: Clarify potentially confusing points before they become problems
Build Confidence: Structure learning to create success and understanding at each step
Enable Teaching: Students should be able to teach these concepts to others after studying

INPUT PROCESSING INSTRUCTIONS
You will receive document content as: ${contentToAnalyze}
Educational Transformation Process:

Learning Analysis: Identify every concept that needs detailed educational explanation
Tutorial Planning: Organize information for step-by-step learning progression
Deep Explanation Creation: Write comprehensive, tutorial-style explanations for every concept
Example Integration: Include detailed examples and practical applications throughout
Learning Optimization: Structure everything for maximum educational effectiveness

Success Metrics:

Students can achieve deep mastery using only these notes
Complex concepts become intuitively understandable through detailed explanation
Practical applications are clear and immediately actionable
Learning progression builds understanding systematically
Students feel confident explaining these concepts to others

Transform the provided document into comprehensive educational notes that serve as a complete tutorial for deep subject mastery.
        `,
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
        consumeCredits: false, // Don't consume credits again since we already did
      });

      return note;
    } catch (error) {
      console.error("Error generating AI note:", error);

      // If it's our custom error with redirection flag, pass it through
      if (error instanceof Error && (error as any).redirectToPricing) {
        throw error;
      }

      throw new Error("Failed to generate AI note");
    }
  }

  /**
   * Generate AI notes with specific focus/style
   */
  async generateFocusedNote(
    transcriptId: string,
    noteType:
      | "summary"
      | "detailed"
      | "action-items"
      | "technical"
      | "executive" = "summary",
    userId?: string
  ): Promise<{ id: string; title: string; content: string }> {
    try {
      // Check if user has credits before attempting to consume
      if (userId) {
        const hasCredits = await checkUserHasCredits();
        if (!hasCredits) {
          const error = new Error(
            "Insufficient credits to generate AI note. Please purchase more credits."
          );
          // Add a custom property to the error for redirection
          (error as any).redirectToPricing = true;
          throw error;
        }

        try {
          // This will throw an error if user has no more credits
          await consumeCredits();
        } catch (error) {
          const insufficientCreditsError = new Error(
            "Insufficient credits to generate AI note. Please purchase more credits."
          );
          (insufficientCreditsError as any).redirectToPricing = true;
          throw insufficientCreditsError;
        }
      }

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
      const prompts = {
        summary: `Create a concise executive summary focusing on key points and conclusions.`,
        detailed: `Provide a comprehensive analysis with detailed explanations of all sections.`,
        "action-items": `Focus specifically on actionable items, recommendations, and next steps.`,
        technical: `Emphasize technical details, methodologies, and technical terminology.`,
        executive: `Create an executive briefing suitable for decision-makers and stakeholders.`,
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

      const title = `${
        noteType.charAt(0).toUpperCase() + noteType.slice(1)
      } - ${transcript.originalName} - ${new Date().toLocaleDateString()}`;

      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
        consumeCredits: false, // Don't consume credits again since we already did
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

      // Consume credits if this is a user-initiated note creation
      // and not part of another credit-consuming operation
      if (data.userId && data.consumeCredits !== false) {
        try {
          const hasCredits = await checkUserHasCredits();
          if (!hasCredits) {
            const error = new Error(
              "Insufficient credits to create note. Please purchase more credits."
            );
            (error as any).redirectToPricing = true;
            throw error;
          }

          await consumeCredits();
        } catch (error) {
          // If the error is not our custom insufficient credits error, rethrow
          if (!(error instanceof Error && (error as any).redirectToPricing)) {
            const insufficientCreditsError = new Error(
              "Insufficient credits to create note. Please purchase more credits."
            );
            (insufficientCreditsError as any).redirectToPricing = true;
            throw insufficientCreditsError;
          }
          throw error;
        }
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
  ): Promise<{ title: string; content: string }> {
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
): Promise<{ title: string; content: string }> {
  const noteService = new NoteService();
  return noteService.generateNotesFromContent(content, title);
}
