"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, 
  Download, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Archive,
  History
} from "lucide-react";
// Simple date formatting utility to replace date-fns
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  let result = '';
  if (diffInMinutes < 1) result = 'just now';
  else if (diffInMinutes < 60) result = `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'}`;
  else if (diffInHours < 24) result = `${diffInHours} hour${diffInHours === 1 ? '' : 's'}`;
  else if (diffInDays < 30) result = `${diffInDays} day${diffInDays === 1 ? '' : 's'}`;
  else {
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) result = `${diffInMonths} month${diffInMonths === 1 ? '' : 's'}`;
    else {
      const diffInYears = Math.floor(diffInDays / 365);
      result = `${diffInYears} year${diffInYears === 1 ? '' : 's'}`;
    }
  }
  
  return options?.addSuffix && result !== 'just now' ? `${result} ago` : result;
};
import type { Podcast } from "@/lib/types/podcast";

interface PodcastHistoryProps {
  history: {
    podcasts: Podcast[];
    latest: Podcast | null;
    inProgress: Podcast | null;
    completed: Podcast[];
    failed: Podcast[];
    superseded: Podcast[];
  };
  onPlayPodcast: (podcast: Podcast) => void;
  onDownloadPodcast: (podcast: Podcast) => void;
  onDeletePodcast: (podcast: Podcast) => void;
  onRegeneratePodcast: (podcast: Podcast) => void;
  className?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'GENERATING':
    case 'IN_PROGRESS':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'SUPERSEDED':
      return <Archive className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'COMPLETED': 'default',
    'GENERATING': 'secondary',
    'IN_PROGRESS': 'secondary',
    'FAILED': 'destructive',
    'SUPERSEDED': 'outline',
  };

  const labels: Record<string, string> = {
    'COMPLETED': 'Completed',
    'GENERATING': 'Generating',
    'IN_PROGRESS': 'In Progress',
    'FAILED': 'Failed',
    'SUPERSEDED': 'Superseded',
  };

  return (
    <Badge variant={variants[status] || 'outline'} className="text-xs">
      {labels[status] || status}
    </Badge>
  );
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return 'Unknown';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function PodcastHistory({
  history,
  onPlayPodcast,
  onDownloadPodcast,
  onDeletePodcast,
  onRegeneratePodcast,
  className = "",
}: PodcastHistoryProps) {
  const { podcasts, latest, completed, failed, superseded } = history;

  if (podcasts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No podcast history available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Podcast History</h3>
          <Badge variant="outline" className="text-xs">
            {podcasts.length} total
          </Badge>
        </div>
        
        {superseded.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {superseded.length} superseded
          </Badge>
        )}
      </div>

      {/* Latest Podcast Highlight */}
      {latest && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getStatusIcon(latest.status)}
                Latest Podcast
              </CardTitle>
              {getStatusBadge(latest.status)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{latest.title}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{latest.mode.toLowerCase()} mode</span>
                  {latest.duration && <span>{formatDuration(latest.duration)}</span>}
                  <span>{formatDistanceToNow(new Date(latest.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {latest.status === 'COMPLETED' && latest.audioUrl && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPlayPodcast(latest)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Play
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownloadPodcast(latest)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </>
                )}
                
                {latest.status === 'FAILED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRegeneratePodcast(latest)}
                  >
                    Retry
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeletePodcast(latest)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podcast List */}
      <div className="space-y-3">
        {podcasts.map((podcast) => (
          <Card key={podcast.id} className={podcast.id === latest?.id ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(podcast.status)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{podcast.title}</p>
                      {getStatusBadge(podcast.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{podcast.mode.toLowerCase()} mode</span>
                      {podcast.duration && <span>{formatDuration(podcast.duration)}</span>}
                      <span>{formatDistanceToNow(new Date(podcast.createdAt), { addSuffix: true })}</span>
                    </div>
                    {podcast.errorMessage && (
                      <p className="text-xs text-red-500 mt-1">{podcast.errorMessage}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {podcast.status === 'COMPLETED' && podcast.audioUrl && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPlayPodcast(podcast)}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDownloadPodcast(podcast)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  
                  {podcast.status === 'FAILED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRegeneratePodcast(podcast)}
                    >
                      Retry
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeletePodcast(podcast)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{completed.length}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{failed.length}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{superseded.length}</div>
          <div className="text-xs text-muted-foreground">Superseded</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{podcasts.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>
    </div>
  );
}