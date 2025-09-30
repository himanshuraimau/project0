import { DocumentService } from '../document-service';
import { PDFParseResult } from '../types/documents.types';

export class PDFParser {
  private readonly documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Suppress canvas warnings that are expected in serverless environment
   */
  private suppressCanvasWarnings() {
    const originalWarn = console.warn;
    console.warn = function (...args: any[]) {
      const msg = args[0]?.toString() || '';
      if (msg.includes('@napi-rs/canvas') ||
        msg.includes('DOMMatrix') ||
        msg.includes('ImageData') ||
        msg.includes('Path2D')) {
        return; // Suppress these warnings - they're expected on Vercel
      }
      originalWarn.apply(console, args);
    };
  }

  /**
   * PDF parsing using pdfjs-dist library
   */
  async parseFromBuffer(buffer: Buffer): Promise<PDFParseResult> {
    this.suppressCanvasWarnings();

    try {
      console.log('Starting PDF parsing with pdfjs-dist...');
      console.log('Buffer length:', buffer.length);

      // Import pdfjs-dist legacy build for Node.js
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

      // Set worker source for Node.js environment
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.mjs',
        import.meta.url
      ).href;

      // Load PDF document from buffer
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: false,
        disableFontFace: true,
        verbosity: 0,
        isEvalSupported: false,
        disableAutoFetch: true,
        disableStream: true,
        standardFontDataUrl: undefined,
        cMapUrl: undefined,
        cMapPacked: false,
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

          // Build text with proper spacing and line breaks
          let pageText = '';
          let lastY: number | null = null;

          for (const item of textContent.items) {
            const textItem = item as any;
            if (textItem.str) {
              // Add line break if Y position changed significantly
              const currentY = textItem.transform ? textItem.transform[5] : null;
              if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
                pageText += '\n';
              }

              // Add the text
              pageText += textItem.str;

              // Add space if item has width (word boundary)
              if (textItem.width && textItem.width > 0) {
                pageText += ' ';
              }

              lastY = currentY;
            }
          }

          // Clean up page text
          pageText = pageText.replace(/\s+/g, ' ').replace(/\n\s+/g, '\n').trim();

          if (pageText.length > 0) {
            fullText += pageText + '\n\n';
          }

          console.log(`Page ${pageNum}/${pdfDocument.numPages} extracted, length: ${pageText.length}`);

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

      // Clean up the extracted text
      const cleanText = this.cleanExtractedText(fullText);

      console.log('Final clean text length:', cleanText.length);

      // Validate extraction was successful
      if (!cleanText || cleanText.length < 10) {
        throw new Error('No text content extracted from PDF');
      }

      // Check if we got PDF structure instead of text
      if (cleanText.includes('endstream') || cleanText.includes('endobj') || cleanText.includes('/Type')) {
        throw new Error('Extracted PDF structure instead of text content');
      }

      return {
        text: cleanText,
        cleanText: cleanText,
        pages: pdfDocument.numPages,
        metadata: metadata,
      };

    } catch (error) {
      console.error('Error parsing PDF with pdfjs-dist:', error);

      // DO NOT use fallback - it extracts garbage
      // Instead, throw a proper error
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        'The PDF may be image-based, encrypted, or corrupted.');
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
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  /**
   * Save PDF content to database
   */
  async extractToDatabase(buffer: Buffer, originalName: string, userId?: string): Promise<PDFParseResult> {
    try {
      // Parse PDF
      const parseResult = await this.parseFromBuffer(buffer);

      // Validate we have actual content
      if (!parseResult.text || parseResult.text.length < 10) {
        throw new Error('No text content found in PDF');
      }

      // Save to database
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
    } catch (error) {
      console.error('Error in extractToDatabase:', error);
      throw error;
    }
  }
}
