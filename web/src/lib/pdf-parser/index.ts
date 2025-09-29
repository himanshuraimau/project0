import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { DocumentService } from '../document-service';
import { PDFParseResult, PDFParseOptions } from '../types/documents.types';

export class PDFParser {
  private readonly uploadDir: string;
  private readonly documentService: DocumentService;

  constructor(uploadDir: string = './storage/uploads') {
    this.uploadDir = uploadDir;
    this.documentService = new DocumentService();
  }

  /**
   * Extract text and metadata from PDF buffer
   */
  async parseFromBuffer(buffer: Buffer, options: PDFParseOptions = {}): Promise<PDFParseResult> {
    try {
      // Dynamic import of pdf-parse
      const pdf = (await import('pdf-parse')).default;

      const data = await pdf(buffer, {
        max: options.maxPages || 0, // 0 means no limit
      });

      // Log raw text statistics for debugging
      const nullByteCount = (data.text.match(/\x00/g) || []).length;
      const controlCharCount = (data.text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;

      if (nullByteCount > 0 || controlCharCount > 0) {
        console.warn(`PDF text contains ${nullByteCount} null bytes and ${controlCharCount} control characters - cleaning...`);
      }

      const cleanText = this.cleanExtractedText(data.text);

      return {
        text: data.text,
        cleanText: cleanText,
        pages: data.numpages,
        metadata: data.info,
        images: options.extractImages ? await this.extractImagesFromBuffer(buffer) : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`PDF parsing failed: ${message}`);
    }
  }

  /**
   * Save uploaded PDF and return the file path
   */
  async savePDF(buffer: Buffer, originalName: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(this.uploadDir, fileName);
    
    await writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Clean up temporary files
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn(`Failed to cleanup file ${filePath}:`, message);
    }
  }

  /**
   * Clean extracted text similar to the original extract.js
   */
  private cleanExtractedText(text: string): string {
    return text
      // Remove null bytes and other control characters that can cause database issues
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other control characters
      .split('\n')
      .map(line => line.trim())
      .filter((line, index, array) => {
        // Remove empty lines at the beginning
        if (index === 0 || array.slice(0, index).every(l => l === '')) {
          return line !== '';
        }
        return true;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // Replace 3 or more consecutive newlines with just 2
      .replace(/\n+$/, '') // Remove trailing newlines
      .trim(); // Remove leading/trailing whitespace
  }

  /**
   * Extract images from PDF buffer using pdfjs-dist (advanced version)
   */
  private async extractImagesFromBuffer(_buffer: Buffer): Promise<string[]> {
    try {
      console.log('⚠️ Image extraction is currently disabled due to server-side DOM limitations');
      console.log('💡 To enable image extraction, please implement server-side PDF image processing');
      
      // TODO: Implement server-side image extraction using alternative libraries
      // Alternative approaches:
      // 1. Use pdf-poppler or pdf2pic (requires system dependencies)
      // 2. Use puppeteer with headless browser
      // 3. Use ImageMagick with pdf support
      
      return [];
    } catch (error) {
      console.error('Error in image extraction placeholder:', error);
      return [];
    }
  }

  /**
   * Extract images from PDF (placeholder - legacy method)
   */
  private async extractImages(buffer: Buffer): Promise<string[]> {
    return this.extractImagesFromBuffer(buffer);
  }

  /**
   * Save PDF content to database instead of files
   */
  async extractToDatabase(buffer: Buffer, originalName: string, options: PDFParseOptions = {}, userId?: string): Promise<PDFParseResult> {
    try {
      // Parse the PDF
      const parseResult = await this.parseFromBuffer(buffer, options);
      
      // Generate filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${originalName}`;
      
      // Save to database
      const document = await this.documentService.saveDocument({
        fileName,
        originalName,
        content: parseResult.text,
        cleanContent: parseResult.cleanText,
        pages: parseResult.pages,
        metadata: parseResult.metadata,
        userId,
      });

      return {
        ...parseResult,
        documentId: document.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`PDF extraction to database failed: ${message}`);
    }
  }

  /**
   * Save PDF and extract content to files (comprehensive extraction)
   */
  async extractToFiles(buffer: Buffer, originalName: string, options: PDFParseOptions = {}): Promise<PDFParseResult> {
    try {
      // Create output directory based on PDF name
      const timestamp = Date.now();
      const baseName = originalName.replace('.pdf', '');
      const outputDir = join(this.uploadDir, `${timestamp}_${baseName}`);
      
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
      }

      // Parse the PDF
      const parseResult = await this.parseFromBuffer(buffer, options);
      
      // Save cleaned text to file
      const textFile = join(outputDir, 'extracted_text.txt');
      await writeFile(textFile, parseResult.cleanText);
      
      // Extract images if requested
      let imagesDir: string | undefined;
      if (options.extractImages) {
        imagesDir = join(outputDir, 'images');
        if (!existsSync(imagesDir)) {
          await mkdir(imagesDir, { recursive: true });
        }
        // Images are already saved during extraction
      }

      return {
        ...parseResult,
        extractedFiles: {
          textFile,
          imagesDir: options.extractImages ? imagesDir : undefined,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`PDF extraction failed: ${message}`);
    }
  }

  /**
   * Generate summary using AI (placeholder)
   */
  async generateSummary(_text: string): Promise<string> {
    // TODO: Integrate with Gemini AI for summary generation
    // This is a placeholder
    const words = _text.split(' ');
    const summary = words.slice(0, 100).join(' ') + '...';
    return summary;
  }

  /**
   * Generate quiz questions (placeholder)
   */
  async generateQuiz(_text: string): Promise<Array<{ question: string; options: string[]; correct: number }>> {
    // TODO: Integrate with Gemini AI for quiz generation
    // This is a placeholder
    return [
      {
        question: "Sample question based on the document",
        options: ["A", "B", "C", "D"],
        correct: 0
      }
    ];
  }

  /**
   * Generate flashcards (placeholder)
   */
  async generateFlashcards(_text: string): Promise<Array<{ front: string; back: string }>> {
    // TODO: Integrate with Gemini AI for flashcard generation
    // This is a placeholder
    return [
      {
        front: "Sample concept",
        back: "Sample explanation"
      }
    ];
  }


}
