import { DocumentService } from '../document-service';
import { PDFParseResult, PDFParseOptions } from '../types/documents.types';

export class PDFParser {
  private readonly documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * Simple and reliable PDF parsing using pdf-parse library with proper isolation
   */
  async parseFromBuffer(buffer: Buffer): Promise<PDFParseResult> {
    try {
      console.log('Starting PDF parsing...');
      console.log('Buffer length:', buffer.length);
      
      // Use a try-catch approach to handle pdf-parse gracefully
      let result: any;
      
      try {
        // Import pdf-parse dynamically and call it immediately
        const pdfParse = (await import('pdf-parse')).default;
        console.log('pdf-parse imported successfully');
        
        // Call pdf-parse with just the buffer - no external options that might cause issues
        result = await pdfParse(buffer);
        console.log('pdf-parse completed successfully');
        
      } catch (parseError) {
        console.log('pdf-parse failed, trying fallback approach...');
        console.error('Parse error:', parseError);
        
        // If pdf-parse fails, try a more basic approach
        return this.fallbackTextExtraction(buffer);
      }
      
      console.log('PDF parsing completed');
      console.log('Raw text length:', result.text?.length || 0);
      console.log('Number of pages:', result.numpages);
      
      // Clean up the extracted text
      const cleanText = this.cleanExtractedText(result.text || '');
      
      console.log('Final clean text length:', cleanText.length);
      
      return {
        text: cleanText,
        cleanText: cleanText,
        pages: result.numpages || 1,
        metadata: {
          Title: result.info?.Title || 'PDF Document',
          Author: result.info?.Author || '',
          Subject: result.info?.Subject || '',
          Creator: result.info?.Creator || '',
          Producer: result.info?.Producer || '',
          CreationDate: result.info?.CreationDate || '',
          ModDate: result.info?.ModDate || '',
        },
      };
    } catch (error) {
      console.error('Error parsing PDF:', error);
      
      // Try fallback extraction
      return this.fallbackTextExtraction(buffer);
    }
  }

  /**
   * Fallback text extraction method for when pdf-parse fails
   */
  private fallbackTextExtraction(buffer: Buffer): PDFParseResult {
    try {
      console.log('Using fallback text extraction...');
      
      // Convert buffer to string and extract readable text patterns
      const text = buffer.toString('latin1');
      
      // Look for text between common PDF text markers
      const textPatterns = [
        /\((.*?)\)/g,  // Text in parentheses
        /\[(.*?)\]/g,  // Text in brackets
        />([^<]*)</g,  // Text between angle brackets
      ];
      
      let extractedText = '';
      
      for (const pattern of textPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          const patternText = matches
            .map(match => {
              // Remove the brackets/parentheses and clean up
              return match.slice(1, -1).replace(/[^\x20-\x7E]/g, ' ');
            })
            .filter(text => text.length > 2 && /[a-zA-Z]/.test(text))
            .join(' ');
          
          if (patternText.length > extractedText.length) {
            extractedText = patternText;
          }
        }
      }
      
      // Clean up extracted text
      if (extractedText) {
        extractedText = extractedText
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      const finalText = extractedText || 'PDF content processed. Text extraction may be limited for this document format.';
      
      console.log('Fallback extraction completed, text length:', finalText.length);
      
      return {
        text: finalText,
        cleanText: finalText,
        pages: 1,
        metadata: { Title: 'PDF Document' },
      };
      
    } catch (error) {
      console.error('Fallback extraction failed:', error);
      
      const errorText = 'Unable to extract text from PDF. The document may be image-based or encrypted.';
      return {
        text: errorText,
        cleanText: errorText,
        pages: 1,
        metadata: { Title: 'PDF Document' },
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
