import { prisma } from './prisma';
import * as cheerio from 'cheerio';

export interface WebpageMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  publishedDate?: string;
  wordCount: number;
  lastCrawled: Date;
}

export interface WebpageCrawlResult {
  documentId: string;
  title: string;
  content: string;
  cleanContent: string;
  url: string;
  domain: string;
  metadata: WebpageMetadata;
}

export class WebpageCrawlerService {
  private scrapeDoApiKey: string;
  private scrapeDoBaseUrl = 'https://api.scrape.do/';

  constructor() {
    this.scrapeDoApiKey = process.env.SCRAPE_DO_API_TOKEN || '';
    if (!this.scrapeDoApiKey) {
      throw new Error('SCRAPE_DO_API_TOKEN environment variable is required');
    }
    console.log('Scrape.do API key loaded:', this.scrapeDoApiKey ? 'Yes' : 'No');
  }

  /**
   * Validate if URL is safe and accessible
   */
  private validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Block localhost and private IP ranges
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.2') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract clean content from HTML using Cheerio
   */
  private extractContent(html: string): {
    title: string;
    content: string;
    cleanContent: string;
    metadata: WebpageMetadata;
  } {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .popup, .modal').remove();
    $('.nav, .navigation, .menu, .sidebar, .widget, .social, .share').remove();
    $('.comment, .comments, .related, .recommended, .newsletter').remove();

    // Extract metadata
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled Page';
    
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    const author = $('meta[name="author"]').attr('content') || 
                  $('meta[property="article:author"]').attr('content') || '';
    
    const publishedDate = $('meta[property="article:published_time"]').attr('content') ||
                         $('time[datetime]').attr('datetime') || '';

    // Try to find main content using common selectors
    let mainContent = '';
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.page-content',
      '#content',
      '#main-content',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > 200) {
        mainContent = element.text();
        break;
      }
    }

    // If no main content found, try body but remove common noise
    if (!mainContent) {
      $('body').find('nav, header, footer, aside, .sidebar, .menu').remove();
      mainContent = $('body').text();
    }

    // Clean the content
    const cleanContent = mainContent
      .replace(/\s+/g, ' ')           // Replace multiple whitespace with single space
      .replace(/\n+/g, '\n')          // Replace multiple newlines with single newline
      .replace(/\t/g, ' ')            // Replace tabs with spaces
      .trim();

    const wordCount = cleanContent.split(/\s+/).filter(word => word.length > 0).length;

    const metadata = {
      title,
      description,
      keywords,
      author,
      publishedDate,
      wordCount,
      lastCrawled: new Date(),
    };

    return {
      title,
      content: mainContent,
      cleanContent,
      metadata,
    };
  }

  /**
   * Crawl webpage using Scrape.do API
   */
  async crawlWebpage(url: string, userId?: string): Promise<WebpageCrawlResult> {
    try {
      // Validate URL
      if (!this.validateUrl(url)) {
        throw new Error('Invalid or unsafe URL provided');
      }

      console.log(`Starting to crawl webpage: ${url}`);

      // Prepare Scrape.do API request according to their documentation
      const targetUrl = encodeURIComponent(url);
      const scrapeUrl = `${this.scrapeDoBaseUrl}?token=${this.scrapeDoApiKey}&url=${targetUrl}`;

      console.log(`Making request to Scrape.do API: ${scrapeUrl.replace(this.scrapeDoApiKey, 'TOKEN_HIDDEN')}`);

      // Make request to Scrape.do
      const response = await fetch(scrapeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
      });

      console.log(`Scrape.do API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Scrape.do API error response:`, errorText);
        throw new Error(`Scrape.do API error: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const html = await response.text();

      if (!html || html.trim().length === 0) {
        throw new Error('No content received from webpage');
      }

      console.log(`Successfully crawled ${html.length} characters from ${url}`);

      // Extract content from HTML
      const { title, content, cleanContent, metadata } = this.extractContent(html);

      if (cleanContent.length < 100) {
        throw new Error('Extracted content is too short - webpage may not be accessible or may be mostly dynamic content');
      }

      // Get domain from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Save to database as transcript
      const transcript = await prisma.transcript.create({
        data: {
          originalName: title,
          fileName: `${domain}-${Date.now()}.html`,
          content: content,
          cleanContent: cleanContent,
          type: 'webpage',
          userId: userId,
          metadata: {
            sourceUrl: url,
            domain: domain,
            ...metadata,
          },
        },
      });

      console.log(`Saved webpage content as transcript: ${transcript.id}`);

      return {
        documentId: transcript.id,
        title,
        content,
        cleanContent,
        url,
        domain,
        metadata: {
          ...metadata,
          lastCrawled: new Date(),
        },
      };

    } catch (error) {
      console.error(`Error crawling webpage ${url}:`, error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to crawl webpage: ${error.message}`);
      }
      
      throw new Error('Failed to crawl webpage: Unknown error occurred');
    }
  }

  /**
   * Get cached webpage content if available
   */
  async getCachedWebpage(url: string, maxAgeHours: number = 24): Promise<WebpageCrawlResult | null> {
    try {
      const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
      
      const transcript = await prisma.transcript.findFirst({
        where: {
          type: 'webpage',
          metadata: {
            path: ['sourceUrl'],
            equals: url,
          },
          createdAt: {
            gte: maxAge,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!transcript) {
        return null;
      }

      const metadata = transcript.metadata as unknown as WebpageMetadata & { sourceUrl: string; domain: string };
      const urlObj = new URL(url);

      return {
        documentId: transcript.id,
        title: transcript.originalName,
        content: transcript.content,
        cleanContent: transcript.cleanContent,
        url: url,
        domain: urlObj.hostname,
        metadata: {
          ...metadata,
          lastCrawled: transcript.createdAt,
        },
      };

    } catch (error) {
      console.error('Error checking cached webpage:', error);
      return null;
    }
  }

  /**
   * Get webpage with caching support
   */
  async getWebpage(url: string, userId?: string, useCache: boolean = true): Promise<WebpageCrawlResult> {
    if (useCache) {
      const cached = await this.getCachedWebpage(url);
      if (cached) {
        console.log(`Using cached content for ${url}`);
        return cached;
      }
    }

    return await this.crawlWebpage(url, userId);
  }
}
