import { getPath } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';
import { DocumentService } from '../document-service';
import { PDFParseResult } from '../types/documents.types';

// Configure the worker for Node.js / Next.js / serverless environments
PDFParse.setWorker(getPath());

/**
 * PDF Parser using pdf-parse npm package (Mozilla PDF.js)
 * Extracts text locally — no API key or external service required.
 * Works in Node.js and serverless (e.g. Vercel).
 */
export class PDFParser {
  private readonly documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Parse PDF from buffer using pdf-parse (local extraction)
   */
  async parseFromBuffer(buffer: Buffer): Promise<PDFParseResult> {
    console.log('Starting PDF parsing with pdf-parse...');
    console.log('Buffer length:', buffer.length);

    const parser = new PDFParse({
      data: new Uint8Array(buffer),
    });

    try {
      const result = await parser.getText();
      await parser.destroy();

      const rawText = result.text ?? '';
      console.log('Raw text length:', rawText.length);

      const cleanText = this.cleanExtractedText(rawText);
      console.log('Clean text length:', cleanText.length);

      if (!cleanText || cleanText.length < 10) {
        throw new Error(
          'No text content extracted from PDF - it may be image-based or empty'
        );
      }

      const pageCount = result.total ?? 1;
      console.log('✓ PDF parsing completed successfully');

      return {
        text: cleanText,
        cleanText,
        pages: pageCount,
        metadata: {
          Title: 'PDF Document',
          ExtractedBy: 'pdf-parse (PDF.js)',
          ExtractedAt: new Date().toISOString(),
        },
      };
    } catch (error: unknown) {
      await parser.destroy().catch(() => {});
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error parsing PDF with pdf-parse:', error);

      if (message.includes('Password') || message.includes('password')) {
        throw new Error('Password-protected PDFs are not supported.');
      }
      if (message.includes('Invalid PDF') || message.includes('corrupted')) {
        throw new Error('The file is not a valid PDF or may be corrupted.');
      }

      throw new Error(`Failed to parse PDF: ${message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanExtractedText(text: string): string {
    if (!text || text.trim().length === 0) {
      return '';
    }

    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      .trim();
  }

  /**
   * Extract PDF and save to database
   */
  async extractToDatabase(
    buffer: Buffer,
    originalName: string,
    userId?: string
  ): Promise<PDFParseResult> {
    try {
      console.log('Starting PDF extraction to database...');

      const parseResult = await this.parseFromBuffer(buffer);

      if (!parseResult.text || parseResult.text.length < 10) {
        throw new Error('No text content found in PDF');
      }

      console.log('Saving document to database...');

      const document = await this.documentService.saveDocument({
        fileName: `${Date.now()}_${originalName}`,
        originalName: originalName,
        content: parseResult.text,
        cleanContent: parseResult.cleanText,
        pages: parseResult.pages,
        metadata: parseResult.metadata,
        userId: userId,
      });

      console.log('✓ Document saved successfully, ID:', document.id);

      return {
        ...parseResult,
        documentId: document.id,
      };
    } catch (error: unknown) {
      console.error('Error in extractToDatabase:', error);
      throw error;
    }
  }
}
