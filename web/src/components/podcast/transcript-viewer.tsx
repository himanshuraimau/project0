"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Download, 
  FileText, 
  FileDown,
  ChevronUp,
  ChevronDown,
  User,
  Clock,
  X,
  Settings,
  Hash,
  Filter
} from 'lucide-react';
import { PodcastSegment } from '@/lib/types/podcast.types';
import { TranscriptViewerSkeleton, PodcastInlineLoading } from './podcast-loading-states';
import { 
  searchTranscript, 
  exportAsText, 
  exportAsHTML, 
  exportAsMarkdown,
  downloadFile,
  extractTopicsAdvanced,
  SearchOptions,
  SearchResult as AdvancedSearchResult,
  TopicSection as AdvancedTopicSection
} from '@/lib/utils/transcript-export';

interface TranscriptViewerProps {
  segments: PodcastSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  className?: string;
  autoScroll?: boolean;
  showSpeakerNames?: boolean;
  host1Name?: string;
  host2Name?: string;
}

// Use the advanced types from the utility module
type SearchResult = AdvancedSearchResult;
type TopicSection = AdvancedTopicSection;

// Utility function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Use the advanced topic extraction from the utility module

// Individual segment component
const TranscriptSegment: React.FC<{
  segment: PodcastSegment;
  isActive: boolean;
  isHighlighted: boolean;
  searchTerm?: string;
  onSeek: (time: number) => void;
  showSpeakerName: boolean;
  speakerName: string;
  className?: string;
}> = ({ 
  segment, 
  isActive, 
  isHighlighted, 
  searchTerm, 
  onSeek, 
  showSpeakerName, 
  speakerName,
  className 
}) => {
  const segmentRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to active segment
  useEffect(() => {
    if (isActive && segmentRef.current) {
      segmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isActive]);
  
  // Highlight search terms in content
  const highlightedContent = useMemo(() => {
    if (!searchTerm || !segment.content) return segment.content;
    
    // Create a simple regex for highlighting (fallback for complex searches)
    try {
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = segment.content.split(regex);
      
      return parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
            {part}
          </mark>
        ) : part
      );
    } catch (error) {
      // If regex fails, return original content
      return segment.content;
    }
  }, [segment.content, searchTerm]);
  
  const handleClick = () => {
    if (segment.startTime !== undefined) {
      onSeek(segment.startTime);
    }
  };
  
  return (
    <div
      ref={segmentRef}
      className={cn(
        "group p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50",
        isActive && "bg-primary/10 border-primary shadow-sm",
        isHighlighted && "ring-2 ring-yellow-400",
        !isActive && "border-transparent hover:border-border",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Speaker indicator */}
        <div className={cn(
          "flex items-center gap-2 min-w-0 flex-shrink-0",
          showSpeakerName ? "w-24" : "w-8"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            segment.speaker === 'host1' ? "bg-blue-500" : "bg-green-500",
            isActive && "animate-pulse"
          )} />
          {showSpeakerName && (
            <span className={cn(
              "text-xs font-medium truncate",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {speakerName}
            </span>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className={cn(
                "text-xs font-mono px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors",
                isActive && "bg-primary/20 text-primary"
              )}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              {formatTime(segment.startTime || 0)}
            </button>
          </div>
          
          <p className={cn(
            "text-sm leading-relaxed",
            isActive ? "text-foreground" : "text-muted-foreground"
          )}>
            {highlightedContent}
          </p>
        </div>
      </div>
    </div>
  );
};

// Topic section component
const TopicSection: React.FC<{
  topic: TopicSection;
  currentTime: number;
  onSeek: (time: number) => void;
  searchTerm?: string;
  showSpeakerNames: boolean;
  host1Name: string;
  host2Name: string;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ 
  topic, 
  currentTime, 
  onSeek, 
  searchTerm, 
  showSpeakerNames, 
  host1Name, 
  host2Name,
  isExpanded,
  onToggle
}) => {
  const isCurrentTopic = currentTime >= topic.startTime && currentTime <= topic.endTime;
  
  return (
    <div className={cn(
      "border rounded-lg overflow-hidden",
      isCurrentTopic && "border-primary shadow-sm"
    )}>
      {/* Topic header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between",
          isCurrentTopic && "bg-primary/5"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isCurrentTopic ? "bg-primary animate-pulse" : "bg-muted-foreground/50"
          )} />
          <div>
            <h4 className={cn(
              "font-medium",
              isCurrentTopic ? "text-primary" : "text-foreground"
            )}>
              {topic.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              {formatTime(topic.startTime)} - {formatTime(topic.endTime)} 
              <span className="ml-2">({topic.segments.length} segments)</span>
            </p>
            {topic.keywords && topic.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {topic.keywords.slice(0, 3).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {/* Topic segments */}
      {isExpanded && (
        <div className="border-t bg-muted/20">
          {topic.segments.map((segment, index) => {
            const isActive = segment.startTime !== undefined && 
                           segment.endTime !== undefined &&
                           currentTime >= segment.startTime && 
                           currentTime <= segment.endTime;
            
            const isHighlighted = searchTerm && 
                                segment.content.toLowerCase().includes(searchTerm.toLowerCase());
            
            const speakerName = segment.speaker === 'host1' ? host1Name : host2Name;
            
            return (
              <TranscriptSegment
                key={`${segment.id || index}`}
                segment={segment}
                isActive={isActive}
                isHighlighted={!!isHighlighted}
                searchTerm={searchTerm}
                onSeek={onSeek}
                showSpeakerName={showSpeakerNames}
                speakerName={speakerName}
                className="border-b last:border-b-0"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  segments,
  currentTime,
  onSeek,
  className,
  autoScroll = true,
  showSpeakerNames = true,
  host1Name = 'Host 1',
  host2Name = 'Host 2'
}) => {
  // Show skeleton if segments are not available
  if (!segments || segments.length === 0) {
    return <TranscriptViewerSkeleton />;
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<'linear' | 'topics'>('linear');
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWords: false,
    regex: false
  });
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeTimestamps: true,
    includeSpeakerNames: true
  });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate topics from segments using advanced extraction
  const topics = useMemo(() => extractTopicsAdvanced(segments), [segments]);
  
  // Advanced search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }
    
    const results = searchTranscript(segments, searchTerm, searchOptions);
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  }, [searchTerm, segments, searchOptions]);
  
  // Navigate search results
  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
    } else {
      newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
    }
    
    setCurrentSearchIndex(newIndex);
    
    // Seek to the segment with the search result
    const result = searchResults[newIndex];
    if (result.segment.startTime !== undefined) {
      onSeek(result.segment.startTime);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  };
  
  // Toggle topic expansion
  const toggleTopic = (topicIndex: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicIndex)) {
      newExpanded.delete(topicIndex);
    } else {
      newExpanded.add(topicIndex);
    }
    setExpandedTopics(newExpanded);
  };
  
  // Expand all topics
  const expandAllTopics = () => {
    setExpandedTopics(new Set(topics.map((_, index) => index)));
  };
  
  // Collapse all topics
  const collapseAllTopics = () => {
    setExpandedTopics(new Set());
  };
  
  // Enhanced export functionality
  const handleExport = (format: 'pdf' | 'txt' | 'docx' | 'html' | 'md') => {
    const exportConfig = {
      host1Name,
      host2Name,
      title: 'Podcast Transcript',
      includeTimestamps: exportOptions.includeTimestamps,
      includeSpeakerNames: exportOptions.includeSpeakerNames
    };
    
    switch (format) {
      case 'txt':
        const textContent = exportAsText(segments, exportConfig);
        downloadFile(textContent, 'transcript.txt', 'text/plain');
        break;
        
      case 'html':
        const htmlContent = exportAsHTML(segments, exportConfig);
        downloadFile(htmlContent, 'transcript.html', 'text/html');
        break;
        
      case 'md':
        const markdownContent = exportAsMarkdown(segments, exportConfig);
        downloadFile(markdownContent, 'transcript.md', 'text/markdown');
        break;
        
      case 'pdf':
        // For PDF, we'll generate HTML and let the user print to PDF
        const pdfHtmlContent = exportAsHTML(segments, exportConfig);
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
          pdfWindow.document.write(pdfHtmlContent);
          pdfWindow.document.close();
          setTimeout(() => {
            pdfWindow.print();
          }, 500);
        }
        break;
        
      case 'docx':
        // For DOCX, we'll provide a structured text format
        // In a real implementation, you'd use a library like docx
        const docxContent = exportAsText(segments, exportConfig);
        downloadFile(docxContent, 'transcript.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        break;
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transcript</CardTitle>
          
          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'linear' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('linear')}
            >
              Linear
            </Button>
            <Button
              variant={viewMode === 'topics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('topics')}
            >
              Topics
            </Button>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20"
              />
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearchOptions(!showSearchOptions)}
                  className="h-6 w-6 p-0"
                  title="Search options"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search navigation */}
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateSearch('prev')}
                  disabled={searchResults.length === 0}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateSearch('next')}
                  disabled={searchResults.length === 0}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Advanced search options */}
          {showSearchOptions && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.caseSensitive}
                    onChange={(e) => setSearchOptions(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                    className="rounded"
                  />
                  Case sensitive
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.wholeWords}
                    onChange={(e) => setSearchOptions(prev => ({ ...prev, wholeWords: e.target.checked }))}
                    className="rounded"
                  />
                  Whole words
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.regex}
                    onChange={(e) => setSearchOptions(prev => ({ ...prev, regex: e.target.checked }))}
                    className="rounded"
                  />
                  Regex
                </label>
              </div>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {viewMode === 'topics' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAllTopics}
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAllTopics}
                >
                  Collapse All
                </Button>
              </>
            )}
          </div>
          
          {/* Export options */}
          <div className="flex items-center gap-1">
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
              
              {/* Export dropdown */}
              <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg p-2 space-y-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-48">
                <div className="text-xs font-medium text-muted-foreground mb-2">Export Options</div>
                
                <div className="space-y-1 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTimestamps}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                      className="rounded"
                    />
                    Include timestamps
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSpeakerNames}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeSpeakerNames: e.target.checked }))}
                      className="rounded"
                    />
                    Include speaker names
                  </label>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Format</div>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('txt')}
                      className="justify-start text-xs h-7"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      TXT
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('html')}
                      className="justify-start text-xs h-7"
                    >
                      <FileDown className="h-3 w-3 mr-1" />
                      HTML
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('md')}
                      className="justify-start text-xs h-7"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      MD
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('pdf')}
                      className="justify-start text-xs h-7"
                    >
                      <FileDown className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('docx')}
                      className="justify-start text-xs h-7 col-span-2"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      DOCX
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className="max-h-96 overflow-y-auto p-4 space-y-2"
        >
          {viewMode === 'linear' ? (
            /* Linear view */
            segments.map((segment, index) => {
              const isActive = segment.startTime !== undefined && 
                             segment.endTime !== undefined &&
                             currentTime >= segment.startTime && 
                             currentTime <= segment.endTime;
              
              const isHighlighted = searchResults.length > 0 && 
                                  currentSearchIndex >= 0 &&
                                  searchResults[currentSearchIndex].segmentIndex === index;
              
              const speakerName = segment.speaker === 'host1' ? host1Name : host2Name;
              
              return (
                <TranscriptSegment
                  key={segment.id || index}
                  segment={segment}
                  isActive={isActive}
                  isHighlighted={isHighlighted}
                  searchTerm={searchTerm}
                  onSeek={onSeek}
                  showSpeakerName={showSpeakerNames}
                  speakerName={speakerName}
                />
              );
            })
          ) : (
            /* Topics view */
            topics.map((topic, index) => (
              <TopicSection
                key={index}
                topic={topic}
                currentTime={currentTime}
                onSeek={onSeek}
                searchTerm={searchTerm}
                showSpeakerNames={showSpeakerNames}
                host1Name={host1Name}
                host2Name={host2Name}
                isExpanded={expandedTopics.has(index)}
                onToggle={() => toggleTopic(index)}
              />
            ))
          )}
          
          {segments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No transcript available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TranscriptViewer;