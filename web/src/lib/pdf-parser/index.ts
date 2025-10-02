import { DocumentService } from '../document-service';
import { PDFParseResult } from '../types/documents.types';

/**
 * PDF Parser using PDF.co API for reliable text extraction
 * Works perfectly on Vercel serverless environment
 */
export class PDFParser {
  private readonly documentService: DocumentService;
  private readonly apiKey: string;

  constructor() {
    this.documentService = new DocumentService();
    
    // Get API key from environment
    this.apiKey = process.env.PDFCO_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️  PDFCO_API_KEY not set in environment variables');
    }
  }

  /**
   * Parse PDF from buffer using PDF.co API
   */
  async parseFromBuffer(buffer: Buffer): Promise<PDFParseResult> {
    try {
      // Try inline mode first (more likely to work)
      return await this.parseWithInlineMode(buffer, true);
    } catch (error) {
      console.log('Inline mode failed, trying with URL mode...');
      return await this.parseWithInlineMode(buffer, false);
    }
  }

  /**
   * Internal method to parse PDF with specific inline mode
   */
  private async parseWithInlineMode(buffer: Buffer, inline: boolean): Promise<PDFParseResult> {
    if (!this.apiKey) {
      throw new Error(
        'PDF.co API key not configured. Please set PDFCO_API_KEY in your environment variables. ' +
        'Sign up at https://pdf.co to get your free API key.'
      );
    }

    console.log(`Starting PDF parsing with PDF.co API (inline: ${inline})...`);
    console.log('Buffer length:', buffer.length);

    try {
      // Step 1: Upload PDF to PDF.co
      console.log('Step 1: Uploading PDF...');
      const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload/base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          file: buffer.toString('base64'),
          name: 'document.pdf',
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`PDF.co upload failed (${uploadResponse.status}): ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.url) {
        throw new Error('PDF.co did not return file URL after upload');
      }

      const fileUrl = uploadData.url;
      console.log('✓ PDF uploaded successfully');

      // Step 2: Extract text from PDF
      console.log('Step 2: Extracting text...');
      const extractResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: fileUrl,
          inline: inline,
          async: false,
        }),
      });

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        throw new Error(`PDF.co text extraction failed (${extractResponse.status}): ${errorText}`);
      }

      const extractData = await extractResponse.json();
      console.log('Extract response data:', JSON.stringify(extractData, null, 2));

      // Check for API errors
      if (extractData.error === true || extractData.error === 'true') {
        throw new Error(`PDF.co API error: ${extractData.message || 'Unknown error'}`);
      }

      // Handle inline mode (text returned directly)
      if (inline) {
        // When inline=true, the text should be in extractData.body
        const textContent = extractData.body;
        
        if (!textContent || typeof textContent !== 'string') {
          throw new Error(`PDF.co inline mode did not return text content. Response: ${JSON.stringify(extractData)}`);
        }

        console.log('✓ Text extraction completed (inline mode)');
        console.log('Raw text length:', textContent.length);

        const cleanText = this.cleanExtractedText(textContent);
        console.log('Clean text length:', cleanText.length);
        
        if (!cleanText || cleanText.length < 10) {
          throw new Error('No text content extracted from PDF - it may be image-based or empty');
        }

        const pageCount = extractData.pageCount || extractData.pages || 1;
        
        console.log('✓ PDF parsing completed successfully');

        return {
          text: cleanText,
          cleanText: cleanText,
          pages: pageCount,
          metadata: {
            Title: 'PDF Document',
            ExtractedBy: 'PDF.co API',
            ExtractedAt: new Date().toISOString(),
          },
        };
      }

      // Handle URL mode (text needs to be downloaded)
      const textUrl = extractData.url;
      
      if (!textUrl) {
        throw new Error(`PDF.co did not return text URL. Response: ${JSON.stringify(extractData)}`);
      }

      console.log('✓ Text extraction completed (URL mode)');

      // Step 3: Download extracted text
      console.log('Step 3: Downloading extracted text...');
      const textResponse = await fetch(textUrl);
      
      if (!textResponse.ok) {
        throw new Error(`Failed to download extracted text: ${textResponse.statusText}`);
      }

      const rawText = await textResponse.text();
      console.log('Raw text length:', rawText.length);

      // Clean the extracted text
      const cleanText = this.cleanExtractedText(rawText);
      console.log('Clean text length:', cleanText.length);

      // Validate extraction
      if (!cleanText || cleanText.length < 10) {
        throw new Error('No text content extracted from PDF - it may be image-based or empty');
      }

      // Get page count from response
      const pageCount = extractData.pageCount || 1;

      console.log('✓ PDF parsing completed successfully');

      return {
        text: cleanText,
        cleanText: cleanText,
        pages: pageCount,
        metadata: {
          Title: 'PDF Document',
          ExtractedBy: 'PDF.co API',
          ExtractedAt: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      console.error('Error parsing PDF with PDF.co:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error(
          'PDF.co API key is invalid. Please check your PDFCO_API_KEY environment variable. ' +
          'Get your API key at https://pdf.co'
        );
      }
      
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error(
          'PDF.co API quota exceeded. Please check your account limits at https://pdf.co/dashboard'
        );
      }

      throw new Error(`Failed to parse PDF: ${error.message}`);
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
   * Extract PDF and save to database
   */
  async extractToDatabase(
    buffer: Buffer,
    originalName: string,
    userId?: string
  ): Promise<PDFParseResult> {
    try {
      console.log('Starting PDF extraction to database...');
      
      // Parse PDF using PDF.co
      const parseResult = await this.parseFromBuffer(buffer);

      // Validate content
      if (!parseResult.text || parseResult.text.length < 10) {
        throw new Error('No text content found in PDF');
      }

      console.log('Saving document to database...');

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
      
    } catch (error: any) {
      console.error('Error in extractToDatabase:', error);
      throw error;
    }
  }
}
