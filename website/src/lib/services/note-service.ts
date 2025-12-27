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

      // Generate AI summary using SOURCE-GROUNDED approach
      const result = await generateText({
        model: this.model,
        prompt: `You are a SOURCE-GROUNDED NOTE GENERATOR.

Goal: Convert the provided SOURCE (PDF text / transcript / pasted text) into clean, simple study notes that focus only on what the SOURCE says.

HARD RULES:
- SOURCE ONLY: Use only information in SOURCE. No outside knowledge.
- NO HALLUCINATION: If it's not in SOURCE, do not include it.
- NO META TALK: Do not mention "PDF/paper/transcript/source" or talk about the document itself.
- NO EXTRAS: Do not add quizzes, flashcards, self-tests, or follow-up questions.
- NO GENERIC FILLER: Avoid vague "this is important/valuable" lines unless SOURCE explicitly says so.
- DATA CAUTION: Include numbers/percentages only if they are explicitly written in SOURCE text you received. If values are only in charts/images and not written, do not guess—omit them.

RELEVANCE FILTER (critical):
- First infer the MAIN TOPIC of the SOURCE (do this silently).
- Include only content that directly supports understanding the MAIN TOPIC: definitions, key ideas, arguments, steps, examples, applications.
- Do NOT create a section for "meta" content about the document itself (e.g., literature review methodology, research steps, protocol, sampling details), unless the MAIN TOPIC is actually about that methodology.
- If "process/methodology" is mentioned but not central: either omit it OR compress it to ONE bullet inside the most relevant section.
- Do NOT create a standalone section for a minor mention that appears briefly.

SECTIONING (dynamic, content-driven):
- Decide section titles based on the SOURCE.
- Prefer using the SOURCE's own headings if available (but skip headings that are mostly meta).
- If headings are missing, infer 4–8 section titles from the main themes (topic-driven).
- Section titles must be short (2–6 words) and reflect the actual content (e.g., "Key Concepts", "How It Works", "Examples", "Steps", "Pros/Cons", "Case Studies", "Timeline", "Applications", "Takeaways").

OUTPUT FORMAT (exact structure):

# Title
Use the title from SOURCE if present; otherwise create a neutral descriptive title using SOURCE words only.

## Overview
3–5 bullets summarizing what the content covers (content-only).

## Notes
Create 4–8 sections (dynamic titles).
Each section must have 3–8 bullets.
Bullets must be short, clear, and skimmable.

### [Dynamic Section Title]
- bullet
- bullet
- bullet

(Repeat for each section)

## Key Takeaways
3–7 bullets of the most important points from SOURCE.

STYLE CONSTRAINTS:
- Markdown headings + bullet points only.
- No tables.
- No long paragraphs.
- No emojis.
- Minimal explanation; prioritize capturing the source's points clearly.
- Do not add any closing questions or suggestions.

Return ONLY the notes in this format.

SOURCE TO PROCESS:
${contentToAnalyze}`,
      });

      // Validate AI response
      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate a simple descriptive title from the content
      const titleResult = await generateText({
        model: this.model,
        prompt: `Generate a clear, descriptive title (3-8 words) for study notes based on this content. Use only words and concepts from the content itself. No quotes, just the title.

Content preview:
${result.text.substring(0, 500)}...

Title:`,
      });

      const aiGeneratedTitle = titleResult.text.trim().replace(/^["'`]|["'`]$/g, '') || `Notes on ${transcript.originalName}`;

      // Ensure title is reasonable length
      const title = aiGeneratedTitle.length > 80 ? aiGeneratedTitle.substring(0, 77) + "..." : aiGeneratedTitle;

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

      const result = await generateText({
        model: this.model,
        prompt: `You are a SOURCE-GROUNDED NOTE GENERATOR.

Goal: Convert the provided SOURCE (PDF text / transcript / pasted text) into clean, simple study notes that focus only on what the SOURCE says.

Note Type Focus: ${noteType.toUpperCase()}

HARD RULES:
- SOURCE ONLY: Use only information in SOURCE. No outside knowledge.
- NO HALLUCINATION: If it's not in SOURCE, do not include it.
- NO META TALK: Do not mention "PDF/paper/transcript/source" or talk about the document itself.
- NO EXTRAS: Do not add quizzes, flashcards, self-tests, or follow-up questions.
- NO GENERIC FILLER: Avoid vague "this is important/valuable" lines unless SOURCE explicitly says so.
- DATA CAUTION: Include numbers/percentages only if they are explicitly written in SOURCE text you received. If values are only in charts/images and not written, do not guess—omit them.

RELEVANCE FILTER (critical):
- First infer the MAIN TOPIC of the SOURCE (do this silently).
- Include only content that directly supports understanding the MAIN TOPIC: definitions, key ideas, arguments, steps, examples, applications.
- Do NOT create a section for "meta" content about the document itself (e.g., literature review methodology, research steps, protocol, sampling details), unless the MAIN TOPIC is actually about that methodology.
- If "process/methodology" is mentioned but not central: either omit it OR compress it to ONE bullet inside the most relevant section.
- Do NOT create a standalone section for a minor mention that appears briefly.

SECTIONING (dynamic, content-driven):
- Decide section titles based on the SOURCE.
- Prefer using the SOURCE's own headings if available (but skip headings that are mostly meta).
- If headings are missing, infer 4–8 section titles from the main themes (topic-driven).
- Section titles must be short (2–6 words) and reflect the actual content (e.g., "Key Concepts", "How It Works", "Examples", "Steps", "Pros/Cons", "Case Studies", "Timeline", "Applications", "Takeaways").

OUTPUT FORMAT (exact structure):

# Title
Use the title from SOURCE if present; otherwise create a neutral descriptive title using SOURCE words only.

## Overview
3–5 bullets summarizing what the content covers (content-only).

## Notes
Create 4–8 sections (dynamic titles).
Each section must have 3–8 bullets.
Bullets must be short, clear, and skimmable.

### [Dynamic Section Title]
- bullet
- bullet
- bullet

(Repeat for each section)

## Key Takeaways
3–7 bullets of the most important points from SOURCE.

STYLE CONSTRAINTS:
- Markdown headings + bullet points only.
- No tables.
- No long paragraphs.
- No emojis.
- Minimal explanation; prioritize capturing the source's points clearly.
- Do not add any closing questions or suggestions.

Return ONLY the notes in this format.

SOURCE TO PROCESS:
${contentToAnalyze}`,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("AI failed to generate meaningful content");
      }

      // Generate a simple descriptive title
      const titleResult = await generateText({
        model: this.model,
        prompt: `Generate a clear, descriptive title (3-8 words) for ${noteType} notes based on this content. Use only words and concepts from the content itself. No quotes, just the title.

Content preview:
${result.text.substring(0, 500)}...

Title:`,
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

      const result = await generateText({
        model: this.model,
        prompt: `You are a SOURCE-GROUNDED NOTE GENERATOR.

Goal: Convert the provided SOURCE (PDF text / transcript / pasted text) into clean, simple study notes that focus only on what the SOURCE says.

HARD RULES:
- SOURCE ONLY: Use only information in SOURCE. No outside knowledge.
- NO HALLUCINATION: If it's not in SOURCE, do not include it.
- NO META TALK: Do not mention "PDF/paper/transcript/source" or talk about the document itself.
- NO EXTRAS: Do not add quizzes, flashcards, self-tests, or follow-up questions.
- NO GENERIC FILLER: Avoid vague "this is important/valuable" lines unless SOURCE explicitly says so.
- DATA CAUTION: Include numbers/percentages only if they are explicitly written in SOURCE text you received. If values are only in charts/images and not written, do not guess—omit them.

RELEVANCE FILTER (critical):
- First infer the MAIN TOPIC of the SOURCE (do this silently).
- Include only content that directly supports understanding the MAIN TOPIC: definitions, key ideas, arguments, steps, examples, applications.
- Do NOT create a section for "meta" content about the document itself (e.g., literature review methodology, research steps, protocol, sampling details), unless the MAIN TOPIC is actually about that methodology.
- If "process/methodology" is mentioned but not central: either omit it OR compress it to ONE bullet inside the most relevant section.
- Do NOT create a standalone section for a minor mention that appears briefly.

SECTIONING (dynamic, content-driven):
- Decide section titles based on the SOURCE.
- Prefer using the SOURCE's own headings if available (but skip headings that are mostly meta).
- If headings are missing, infer 4–8 section titles from the main themes (topic-driven).
- Section titles must be short (2–6 words) and reflect the actual content (e.g., "Key Concepts", "How It Works", "Examples", "Steps", "Pros/Cons", "Case Studies", "Timeline", "Applications", "Takeaways").

OUTPUT FORMAT (exact structure):

# Title
Use the title from SOURCE if present; otherwise create a neutral descriptive title using SOURCE words only.

## Overview
3–5 bullets summarizing what the content covers (content-only).

## Notes
Create 4–8 sections (dynamic titles).
Each section must have 3–8 bullets.
Bullets must be short, clear, and skimmable.

### [Dynamic Section Title]
- bullet
- bullet
- bullet

(Repeat for each section)

## Key Takeaways
3–7 bullets of the most important points from SOURCE.

STYLE CONSTRAINTS:
- Markdown headings + bullet points only.
- No tables.
- No long paragraphs.
- No emojis.
- Minimal explanation; prioritize capturing the source's points clearly.
- Do not add any closing questions or suggestions.

Return ONLY the notes in this format.

SOURCE TO PROCESS:
${content}`,
      });

      if (!result.text || result.text.trim().length === 0) {
        throw new Error('AI failed to generate meaningful content');
      }

      // Generate a simple descriptive title
      const titleResult = await generateText({
        model: this.model,
        prompt: `Generate a clear, descriptive title (3-8 words) for study notes based on this content. Use only words and concepts from the content itself. No quotes, just the title.

Content preview:
${result.text.substring(0, 500)}...

Title:`,
      });

      const aiGeneratedTitle = titleResult.text.trim().replace(/^["'`]|["'`]$/g, '') || title || 'Study Notes';
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