import { prisma } from './prisma';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { indexNoteContent } from './embedding-service';

export interface NoteData {
  title: string;
  content: string;
  transcriptId: string;
  userId?: string;
}

export class NoteService {
  private model = google('models/gemini-1.5-flash-latest');

  /**
   * Generate AI summary notes from transcript content
   */
  async generateAINote(transcriptId: string, userId?: string): Promise<{ id: string; title: string; content: string }> {
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
            }
          }
        },
      });

      if (!transcript) {
        throw new Error('Transcript not found');
      }

      // Check if notes already exist for this transcript
      if (transcript.notes && transcript.notes.length > 0) {
        console.log(`Warning: ${transcript.notes.length} existing notes found for transcript ${transcriptId}`);
      }

      // Use the clean content for better AI processing
      const contentToAnalyze = transcript.cleanContent || transcript.content;

      // Validate that we have content to analyze
      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        throw new Error('No content available in transcript to generate notes from');
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
          
          You are a professional document analyst and technical writer. I will provide you with a text file that contains extracted content or raw data. Your task is to carefully read and deeply analyze the entire document, and then produce a structured point-wise summary following the exact format outlined below.

          IMPORTANT: Each analysis should be unique and tailored specifically to the content provided. Do not generate generic responses.

          Your summary must explain all relevant content in clear depth and detail, going beyond surface-level interpretation. Where appropriate, include interpretation, inference, and reasoning to clarify technical, ambiguous, or fragmented content. Do not summarize vaguely — instead, ensure each section reflects a thorough understanding of the original material.

          INSTRUCTIONS
          Please follow the structure and content expectations below. Each section is required and must be addressed explicitly, even if no content is found for it (in which case, explain what is missing and what would be needed).

          1. OVERVIEW / ABSTRACT
          Provide a concise summary (150–200 words) of the entire document.

          Explain the primary purpose, scope, and core subject of the document.

          Highlight the key findings, conclusions, or outcomes reached.

          Write in a clear, business-like tone as if the reader is an executive or decision-maker who needs to quickly grasp what the document is about without reading the full text.

          2. BACKGROUND AND MOTIVATION
          Explain the context in which the document was created.

          Identify:

          The problem statement or need being addressed.

          The underlying motivations behind the work.

          The challenges, gaps, or opportunities that led to this effort.

          Include any relevant:

          Historical context

          Prior research

          Industry trends

          Technical or operational drivers

          Provide detailed, well-developed explanations to ensure clarity of the intent and origins of the work.

          3. DETAILED SECTION ANALYSIS
          Identify all section headings and subheadings from the document.

          For each section or subsection:

          State the exact heading or a logical placeholder if no headings are given.

          Provide a in-depth explanation of the content under that heading (minimum 200–250 words per section).

          Include any:

          Key points or arguments

          Data, findings, or analysis

          Methods or processes used

          Interpretations or implications

          Explain how this section contributes to the overall purpose or narrative of the document.

          If no headings exist, divide the document into logical thematic sections and follow the same structure.

          4. KEY TERMS & DEFINITIONS
          Identify and define all:

          Technical terms

          Acronyms

          Specialized vocabulary

          Metrics or units

          For each term:

          Provide a clear, concise 2–3 sentence definition.

          Explain the context or role of the term in the document.

          Present terms in alphabetical order for easy reference.

          5. ACTION ITEMS / NEXT STEPS
          Identify any:

          Recommendations

          Planned actions

          Deliverables

          Follow-ups or implementation steps

          If the document does not explicitly mention next steps, infer logical actions based on the document's content and purpose.

          Format this section as a numbered list, where each point is a specific, actionable statement.

          Include:

          Responsibilities

          Deadlines (if stated)

          Suggestions for improvements or changes

          6. CONCLUSION
          Summarize the main findings, outcomes, or conclusions.

          State:

          Whether the document's goals or objectives were achieved.

          Any limitations, uncertainties, or challenges mentioned or implied.

          The implications of the document's conclusions or results.

          End with a statement on the overall value or impact of the work, and how it contributes to its domain, field, or use case.

          FORMATTING AND WRITING GUIDELINES
          Use clear, professional headings and a consistent structure.

          Avoid casual language or emojis.

          Write in precise, formal, and neutral tone.

          Use point-wise explanations wherever helpful.

          Ensure:

          Logical flow between sections

          Consistency in terminology and references

          Objectivity and accuracy throughout

          When required, interpret and elaborate — do not just paraphrase; explain why something matters, how it works, or what its implications are.

          QUALITY STANDARDS
          Be comprehensive yet concise.

          Focus on depth of explanation, especially for technical or dense material.

          Maintain clarity, structure, and readability.

          If any section cannot be completed due to missing or unclear data, explicitly state:

          What is missing

          What kind of information would be needed to complete that section

          Input:
          You will be given a text file containing extracted document content as: ${contentToAnalyze}
          Your task is to analyze this input and generate the structured point-wise summary in the format provided above. Keep it strictly point-wise.
        `,
      });

      // Validate AI response
      if (!result.text || result.text.trim().length === 0) {
        throw new Error('AI failed to generate meaningful content');
      }

      // Generate a title with timestamp to ensure uniqueness
      const baseTitle = result.text.split('\n').find(line => line.trim().length > 0)?.replace(/^\*+\s*/, '') || `Analysis of ${transcript.originalName}`;
      const uniqueTitle = `${baseTitle.substring(0, 80)} - ${new Date().toLocaleDateString()}`;
      const title = uniqueTitle.length > 100 ? uniqueTitle.substring(0, 97) + '...' : uniqueTitle;

      // Save the generated note to database
      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
      });

      return note;
    } catch (error) {
      console.error('Error generating AI note:', error);
      throw new Error('Failed to generate AI note');
    }
  }

  /**
   * Generate AI notes with specific focus/style
   */
  async generateFocusedNote(
    transcriptId: string, 
    noteType: 'summary' | 'detailed' | 'action-items' | 'technical' | 'executive' = 'summary',
    userId?: string
  ): Promise<{ id: string; title: string; content: string }> {
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
        throw new Error('Transcript not found');
      }

      const contentToAnalyze = transcript.cleanContent || transcript.content;
      
      if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
        throw new Error('No content available in transcript to generate notes from');
      }

      const analysisId = Math.random().toString(36).substring(2, 15);
      const timestamp = new Date().toISOString();

      // Different prompts based on note type
      const prompts = {
        summary: `Create a concise executive summary focusing on key points and conclusions.`,
        detailed: `Provide a comprehensive analysis with detailed explanations of all sections.`,
        'action-items': `Focus specifically on actionable items, recommendations, and next steps.`,
        technical: `Emphasize technical details, methodologies, and technical terminology.`,
        executive: `Create an executive briefing suitable for decision-makers and stakeholders.`
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
        throw new Error('AI failed to generate meaningful content');
      }

      const title = `${noteType.charAt(0).toUpperCase() + noteType.slice(1)} - ${transcript.originalName} - ${new Date().toLocaleDateString()}`;

      const note = await this.saveNote({
        title,
        content: result.text,
        transcriptId,
        userId,
      });

      return note;
    } catch (error) {
      console.error('Error generating focused AI note:', error);
      throw new Error('Failed to generate focused AI note');
    }
  }

  /**
   * Save note to database
   */
  async saveNote(data: NoteData) {
    try {
      // Validate required fields
      if (!data.title || !data.content || !data.transcriptId) {
        throw new Error('Title, content, and transcriptId are required');
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
          .catch(error => console.error(`Error indexing note ${note.id}:`, error));
      }, 0);

      return note;
    } catch (error) {
      console.error('Error saving note to database:', error);
      throw new Error('Failed to save note to database');
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
      console.error('Error retrieving note:', error);
      throw new Error('Failed to retrieve note');
    }
  }

  /**
   * Get notes by transcript ID
   */
  async getNotesByTranscript(transcriptId: string) {
    try {
      return await prisma.note.findMany({
        where: { transcriptId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      console.error('Error retrieving notes for transcript:', error);
      throw new Error('Failed to retrieve notes for transcript');
    }
  }

  /**
   * Get notes by user ID
   */
  async getNotesByUser(userId: string) {
    try {
      return await prisma.note.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
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
      console.error('Error retrieving user notes:', error);
      throw new Error('Failed to retrieve user notes');
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
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }

  /**
   * Update note by ID
   */
  async updateNote(id: string, data: Partial<Pick<NoteData, 'title' | 'content'>>) {
    try {
      return await prisma.note.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  }
}
