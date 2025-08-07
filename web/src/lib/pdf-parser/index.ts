import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface PDFParseResult {
  text: string;
  cleanText: string;
  pages: number;
  metadata?: Record<string, unknown>;
  images?: string[];
  extractedFiles?: {
    textFile?: string;
    imagesDir?: string;
  };
}

export interface ParseOptions {
  extractImages?: boolean;
  maxPages?: number;
}

export class PDFParser {
  private readonly uploadDir: string;

  constructor(uploadDir: string = './storage/uploads') {
    this.uploadDir = uploadDir;
  }

  /**
   * Extract text and metadata from PDF buffer
   */
  async parseFromBuffer(buffer: Buffer, options: ParseOptions = {}): Promise<PDFParseResult> {
    try {
      // Dynamic import to avoid test file dependency issues
      let pdf: any;
      try {
        pdf = (await import('pdf-parse')).default;
      } catch (importError) {
        // If pdf-parse fails to load due to test file dependency, create the test file temporarily
        if (importError instanceof Error && importError.message.includes('ENOENT') && importError.message.includes('test/data/05-versions-space.pdf')) {
          await this.createTemporaryTestFile();
          pdf = (await import('pdf-parse')).default;
        } else {
          throw importError;
        }
      }
      
      const data = await pdf(buffer, {
        max: options.maxPages || 0, // 0 means no limit
      });

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
   * Extract text from PDF file path
   */
  async parseFromFile(filePath: string, options: ParseOptions = {}): Promise<PDFParseResult> {
    try {
      const buffer = await readFile(filePath);
      return await this.parseFromBuffer(buffer, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to read PDF file: ${message}`);
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
      .replace(/\n+$/, ''); // Remove trailing newlines
  }

  /**
   * Extract images from PDF buffer using pdfjs-dist (advanced version)
   */
  private async extractImagesFromBuffer(buffer: Buffer): Promise<string[]> {
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
   * Save PDF and extract content to files (comprehensive extraction)
   */
  async extractToFiles(buffer: Buffer, originalName: string, options: ParseOptions = {}): Promise<PDFParseResult> {
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

  /**
   * Create temporary test file for pdf-parse library dependency
   * This is a workaround for the library's hardcoded test file requirement
   */
  private async createTemporaryTestFile(): Promise<void> {
    try {
      const testDir = join(process.cwd(), 'test', 'data');
      const testFile = join(testDir, '05-versions-space.pdf');
      
      if (!existsSync(testFile)) {
        // Create directory
        await mkdir(testDir, { recursive: true });
        
        // Create a minimal dummy PDF file
        const dummyPdfContent = `%PDF-1.4
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Count 1/Kids[3 0 R]>>
endobj
3 0 obj
<</Type/Page/Parent 2 0 R>>
endobj
xref
0 4
0000000000 65535 f 
trailer
<</Size 4/Root 1 0 R>>
startxref
184
%%EOF`;
        
        await writeFile(testFile, dummyPdfContent);
        console.log('⚠️ Created temporary test file for pdf-parse library');
      }
    } catch (error) {
      console.warn('Could not create temporary test file:', error);
    }
  }
}
