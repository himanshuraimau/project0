// Transcript export utilities for different formats

import { PodcastSegment } from '@/lib/types/podcast.types';

// Utility function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format transcript as plain text
export const exportAsText = (
  segments: PodcastSegment[],
  options: {
    host1Name: string;
    host2Name: string;
    includeTimestamps?: boolean;
    includeSpeakerNames?: boolean;
  }
): string => {
  const { host1Name, host2Name, includeTimestamps = true, includeSpeakerNames = true } = options;

  return segments
    .map(segment => {
      const speaker = segment.speaker === 'host1' ? host1Name : host2Name;
      const time = includeTimestamps ? `[${formatTime(segment.startTime || 0)}] ` : '';
      const speakerLabel = includeSpeakerNames ? `${speaker}: ` : '';

      return `${time}${speakerLabel}${segment.content}`;
    })
    .join('\n\n');
};

// Format transcript as HTML for PDF generation
export const exportAsHTML = (
  segments: PodcastSegment[],
  options: {
    host1Name: string;
    host2Name: string;
    title?: string;
    includeTimestamps?: boolean;
    includeSpeakerNames?: boolean;
  }
): string => {
  const { host1Name, host2Name, title = 'Podcast Transcript', includeTimestamps = true, includeSpeakerNames = true } = options;

  const segmentsHTML = segments
    .map(segment => {
      const speaker = segment.speaker === 'host1' ? host1Name : host2Name;
      const time = includeTimestamps ? `<span class="timestamp">[${formatTime(segment.startTime || 0)}]</span> ` : '';
      const speakerLabel = includeSpeakerNames ? `<strong class="speaker ${segment.speaker}">${speaker}:</strong> ` : '';

      return `
        <div class="segment ${segment.speaker}">
          ${time}${speakerLabel}
          <span class="content">${segment.content}</span>
        </div>
      `;
    })
    .join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #2563eb;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .segment {
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 8px;
          background: #f9fafb;
        }
        .segment.host1 {
          border-left: 4px solid #3b82f6;
        }
        .segment.host2 {
          border-left: 4px solid #10b981;
        }
        .timestamp {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.85em;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .speaker {
          color: #1f2937;
        }
        .speaker.host1 {
          color: #1d4ed8;
        }
        .speaker.host2 {
          color: #059669;
        }
        .content {
          display: block;
          margin-top: 4px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .segment { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="transcript">
        ${segmentsHTML}
      </div>
    </body>
    </html>
  `;
};

// Format transcript as Markdown
export const exportAsMarkdown = (
  segments: PodcastSegment[],
  options: {
    host1Name: string;
    host2Name: string;
    title?: string;
    includeTimestamps?: boolean;
    includeSpeakerNames?: boolean;
  }
): string => {
  const { host1Name, host2Name, title = 'Podcast Transcript', includeTimestamps = true, includeSpeakerNames = true } = options;

  const header = `# ${title}\n\n`;

  const segmentsMarkdown = segments
    .map(segment => {
      const speaker = segment.speaker === 'host1' ? host1Name : host2Name;
      const time = includeTimestamps ? `\`${formatTime(segment.startTime || 0)}\` ` : '';
      const speakerLabel = includeSpeakerNames ? `**${speaker}:** ` : '';

      return `${time}${speakerLabel}${segment.content}`;
    })
    .join('\n\n');

  return header + segmentsMarkdown;
};

// Generate structured data for DOCX export (would need docx library)
export const generateDocxData = (
  segments: PodcastSegment[],
  options: {
    host1Name: string;
    host2Name: string;
    title?: string;
    includeTimestamps?: boolean;
    includeSpeakerNames?: boolean;
  }
) => {
  const { host1Name, host2Name, title = 'Podcast Transcript', includeTimestamps = true, includeSpeakerNames = true } = options;

  return {
    title,
    segments: segments.map(segment => ({
      speaker: segment.speaker === 'host1' ? host1Name : host2Name,
      speakerType: segment.speaker,
      timestamp: segment.startTime || 0,
      formattedTime: formatTime(segment.startTime || 0),
      content: segment.content,
      includeTimestamp: includeTimestamps,
      includeSpeakerName: includeSpeakerNames
    }))
  };
};

// Download file utility
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Advanced search functionality
export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWords?: boolean;
  regex?: boolean;
}

export interface SearchResult {
  segmentIndex: number;
  segment: PodcastSegment;
  matches: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  context: string;
}

export const searchTranscript = (
  segments: PodcastSegment[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] => {
  if (!query.trim()) return [];

  const { caseSensitive = false, wholeWords = false, regex = false } = options;
  const results: SearchResult[] = [];

  let searchRegex: RegExp;

  try {
    if (regex) {
      searchRegex = new RegExp(query, caseSensitive ? 'g' : 'gi');
    } else {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = wholeWords ? `\\b${escapedQuery}\\b` : escapedQuery;
      searchRegex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    }
  } catch (error) {
    // Invalid regex, fall back to literal search
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    searchRegex = new RegExp(escapedQuery, caseSensitive ? 'g' : 'gi');
  }

  segments.forEach((segment, index) => {
    const content = segment.content;
    const matches: Array<{ start: number; end: number; text: string }> = [];
    let match;

    // Reset regex lastIndex for global search
    searchRegex.lastIndex = 0;

    while ((match = searchRegex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });

      // Prevent infinite loop for zero-length matches
      if (match.index === searchRegex.lastIndex) {
        searchRegex.lastIndex++;
      }
    }

    if (matches.length > 0) {
      // Create context around matches
      const contextRadius = 100;
      const firstMatch = matches[0];
      const lastMatch = matches[matches.length - 1];

      const contextStart = Math.max(0, firstMatch.start - contextRadius);
      const contextEnd = Math.min(content.length, lastMatch.end + contextRadius);

      let context = content.substring(contextStart, contextEnd);
      if (contextStart > 0) context = '...' + context;
      if (contextEnd < content.length) context = context + '...';

      results.push({
        segmentIndex: index,
        segment,
        matches,
        context
      });
    }
  });

  return results;
};

// Topic extraction with improved algorithms
export interface TopicSection {
  title: string;
  startTime: number;
  endTime: number;
  segments: PodcastSegment[];
  keywords: string[];
  summary?: string;
}

export const extractTopicsAdvanced = (segments: PodcastSegment[]): TopicSection[] => {
  const topics: TopicSection[] = [];
  let currentTopic: TopicSection | null = null;

  // Common topic transition phrases
  const topicTransitions = [
    /let'?s talk about/i,
    /moving on to/i,
    /next topic/i,
    /another important/i,
    /now let'?s discuss/i,
    /switching gears/i,
    /turning to/i,
    /speaking of/i
  ];

  // Keywords extraction (simple approach)
  const extractKeywords = (text: string): string[] => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'].includes(word));

    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  segments.forEach((segment, index) => {
    const content = segment.content;
    const isTopicStart = topicTransitions.some(pattern => pattern.test(content)) ||
      index === 0 || // First segment starts a topic
      (index > 0 &&
        segments[index - 1].speaker !== segment.speaker &&
        content.length > 100); // Speaker change with substantial content

    if (isTopicStart || !currentTopic) {
      // Finalize previous topic
      if (currentTopic && currentTopic.segments && currentTopic.segments.length > 0) {
        const lastSegment = currentTopic.segments[currentTopic.segments.length - 1];
        currentTopic.endTime = lastSegment.endTime || lastSegment.startTime || 0;

        // Extract keywords from all segments in the topic
        const allText = currentTopic.segments.map((s: PodcastSegment) => s.content).join(' ');
        currentTopic.keywords = extractKeywords(allText);

        topics.push(currentTopic);
      }

      // Start new topic
      const topicTitle = extractTopicTitle(content);
      currentTopic = {
        title: topicTitle,
        startTime: segment.startTime || 0,
        endTime: segment.endTime || 0,
        segments: [segment],
        keywords: []
      };
    } else if (currentTopic) {
      currentTopic.segments.push(segment);
    }
  });

  // Add final topic
  if (currentTopic) {
    const topic = currentTopic as TopicSection;
    if (topic.segments.length > 0) {
      const lastSegment = topic.segments[topic.segments.length - 1];
      topic.endTime = lastSegment.endTime || lastSegment.startTime || 0;

      const allText = topic.segments.map(s => s.content).join(' ');
      topic.keywords = extractKeywords(allText);

      topics.push(topic);
    }
  }

  return topics;
};

// Extract a meaningful title from segment content
const extractTopicTitle = (content: string): string => {
  // Remove common conversation starters and get the main topic
  const cleaned = content
    .replace(/^(well,|so,|now,|let's talk about|moving on to|next topic|another important|you know,|i think|i mean)/i, '')
    .trim();

  // Try to find the main subject by looking for key patterns
  const sentences = cleaned.split(/[.!?]/);
  const firstSentence = sentences[0]?.trim();

  if (!firstSentence) return 'Untitled Topic';

  // Look for topic indicators
  const topicPatterns = [
    /(?:about|regarding|concerning|discussing)\s+(.+)/i,
    /(?:the topic of|the subject of)\s+(.+)/i,
    /(.+?)\s+(?:is|are|was|were)\s+(?:important|interesting|significant)/i
  ];

  for (const pattern of topicPatterns) {
    const match = firstSentence.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 50) + (match[1].length > 50 ? '...' : '');
    }
  }

  // Fall back to first sentence or first 50 characters
  const title = firstSentence.length > 50
    ? firstSentence.substring(0, 50) + '...'
    : firstSentence;

  return title || 'Untitled Topic';
};