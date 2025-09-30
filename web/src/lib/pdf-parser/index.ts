import { DocumentService } from '../document-service';
import { PDFParseResult, PDFParseOptions } from '../types/documents.types';

export class PDFParser {
  private readonly documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * PDF parsing using pdfjs-dist library
   */
  async parseFromBuffer(buffer: Buffer): Promise<PDFParseResult> {
    try {
      console.log('Starting PDF parsing with pdfjs-dist...');
      console.log('Buffer length:', buffer.length);

      // Import pdfjs-dist dynamically
      const pdfjsLib = await import('pdfjs-dist');

      // Set worker source for Node.js environment
      if (typeof window === 'undefined') {
        // Server-side: disable worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      }

      // Load PDF document from buffer
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
        disableFontFace: true,
        verbosity: 0, // Reduce logging
      });

      const pdfDocument = await loadingTask.promise;
      console.log('PDF loaded successfully, pages:', pdfDocument.numPages);

      // Extract text from all pages
      let fullText = '';
      const metadata: any = {};

      // Get document metadata
      try {
        const info = await pdfDocument.getMetadata();
        if (info.info) {
          const infoObj = info.info as any;
          metadata.Title = infoObj.Title || 'PDF Document';
          metadata.Author = infoObj.Author || '';
          metadata.Subject = infoObj.Subject || '';
          metadata.Creator = infoObj.Creator || '';
          metadata.Producer = infoObj.Producer || '';
          metadata.CreationDate = infoObj.CreationDate || '';
          metadata.ModDate = infoObj.ModDate || '';
        }
      } catch (metaError) {
        console.log('Could not extract metadata:', metaError);
        metadata.Title = 'PDF Document';
      }

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Combine text items from the page
          const pageText = textContent.items
            .map((item: any) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ');

          if (pageText.trim()) {
            fullText += pageText + '\n\n';
          }

          // Clean up page resources
          page.cleanup();
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }

      // Clean up document resources
      pdfDocument.destroy();

      console.log('PDF parsing completed');
      console.log('Raw text length:', fullText.length);
      console.log('Number of pages:', pdfDocument.numPages);

      // Clean up the extracted text
      const cleanText = this.cleanExtractedText(fullText);

      console.log('Final clean text length:', cleanText.length);

      return {
        text: cleanText,
        cleanText: cleanText,
        pages: pdfDocument.numPages,
        metadata: metadata,
      };

    } catch (error) {
      console.error('Error parsing PDF with pdfjs-dist:', error);

      // Try fallback extraction
      return this.fallbackTextExtraction(buffer);
    }
  }

  /**
   * Fallback text extraction method for when pdfjs-dist fails
   */
  private fallbackTextExtraction(buffer: Buffer): PDFParseResult {
    try {
      console.log('Using fallback text extraction...');

      // Convert buffer to string and extract readable text patterns
      const text = buffer.toString('latin1');

      // Simple text extraction patterns for PDFs
      const textPatterns = [
        // Text in parentheses (most common in PDFs)
        /\(([^)]*)\)/g,
        // Text after Tj operators
        /\((.*?)\)\s*Tj/g,
      ];

      let extractedTexts: string[] = [];

      for (const pattern of textPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          const patternTexts = matches
            .map(match => {
              const parenMatch = match.match(/\(([^)]*)\)/);
              return parenMatch ? parenMatch[1] : '';
            })
            .map(text => {
              return text
                .replace(/[^\x20-\x7E]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            })
            .filter(text => text.length > 2 && /[a-zA-Z]/.test(text));

          extractedTexts.push(...patternTexts);
        }
      }

      // Combine extracted text
      let finalText = '';
      if (extractedTexts.length > 0) {
        const uniqueTexts = [...new Set(extractedTexts)];
        finalText = uniqueTexts.join(' ').replace(/\s+/g, ' ').trim();
      }

      if (!finalText || finalText.length < 10) {
        finalText = 'PDF processed successfully. Text extraction was limited - the document may contain images or complex formatting.';
      }

      console.log('Fallback extraction completed, text length:', finalText.length);

      return {
        text: finalText,
        cleanText: finalText,
        pages: 1,
        metadata: {
          Title: 'PDF Document',
          ExtractedBy: 'Fallback Method'
        },
      };

    } catch (error) {
      console.error('Fallback extraction failed:', error);

      const errorText = 'PDF uploaded successfully but text extraction was limited. The document may be image-based or encrypted.';
      return {
        text: errorText,
        cleanText: errorText,
        pages: 1,
        metadata: {
          Title: 'PDF Document',
          ProcessingNote: 'Limited extraction due to document format'
        },
      };
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanExtractedText(text: string): string {
    if (!text || text.trim().length === 0) {
      return 'PDF processed successfully. No readable text content found.';
    }

    return text
      // Normalize whitespace
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      // Remove excessive whitespace
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
  }

  /**
   * Save PDF content to database - simplified
   */

  async extractToDatabase(buffer: Buffer, originalName: string, userId?: string): Promise<PDFParseResult> {
    // Parse PDF - simple and direct
    const parseResult = await this.parseFromBuffer(buffer);

    // Save to database - simple
    const document = await this.documentService.saveDocument({
      fileName: `${Date.now()}_${originalName}`,
      originalName: originalName,
      content: parseResult.text,
      cleanContent: parseResult.cleanText,
      pages: parseResult.pages,
      metadata: parseResult.metadata,
      userId: userId,
    });

    return {
      ...parseResult,
      documentId: document.id,
    };
  }


}
