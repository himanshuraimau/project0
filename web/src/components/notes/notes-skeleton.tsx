import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NoteDetailSkeletonProps {
  className?: string;
  showChatbot?: boolean;
}

export function NoteDetailSkeleton({ className, showChatbot = true }: NoteDetailSkeletonProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="w-full mx-auto p-8">
        {/* Two Column Layout - Responsive Grid */}
        <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${showChatbot ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* Main Content Skeleton */}
          <div className={showChatbot ? "lg:col-span-2" : "lg:col-span-1"}>
            <Card className="rounded-3xl border-0 shadow-xl bg-card">
              {/* Header Section Skeleton */}
              <CardHeader className="p-8 pb-6">
                <div className="space-y-6">
                  {/* Title and Controls Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      {/* Title skeleton */}
                      <div className="h-10 bg-muted rounded-lg w-3/4 animate-pulse" />
                      
                      {/* Metadata skeleton */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="h-4 bg-muted rounded w-48 animate-pulse" />
                        <Separator orientation="vertical" className="h-4" />
                        <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                      </div>
                    </div>

                    {/* Controls Toolbar skeleton */}
                    <div className="flex items-center gap-3">
                      {/* Mode Toggle skeleton */}
                      <div className="hidden sm:flex items-center bg-muted rounded-2xl p-1 gap-1">
                        <div className="h-9 w-24 bg-primary/20 rounded-xl animate-pulse" />
                        <div className="h-9 w-20 bg-muted-foreground/10 rounded-xl animate-pulse" />
                      </div>

                      {/* Action Buttons skeleton */}
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-20 bg-muted rounded-xl animate-pulse" />
                        <div className="h-9 w-28 bg-muted rounded-xl animate-pulse" />
                        <div className="h-9 w-10 bg-muted rounded-xl animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Content Section Skeleton */}
              <CardContent className="p-8 pt-8">
                <div className="min-h-[400px] space-y-6">
                  {/* Content lines skeleton */}
                  <div className="space-y-4">
                    {/* First paragraph */}
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                    </div>
                    
                    {/* Second paragraph */}
                    <div className="space-y-2 pt-4">
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
                    </div>

                    {/* Heading skeleton */}
                    <div className="pt-6">
                      <div className="h-8 bg-muted rounded-lg w-1/2 animate-pulse mb-4" />
                    </div>

                    {/* Third paragraph */}
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    </div>

                    {/* List items skeleton */}
                    <div className="space-y-3 pt-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-muted rounded-full animate-pulse" />
                        <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-muted rounded-full animate-pulse" />
                        <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 bg-muted rounded-full animate-pulse" />
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                      </div>
                    </div>

                    {/* Another paragraph */}
                    <div className="space-y-2 pt-4">
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted rounded w-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chatbot Sidebar Skeleton */}
          {showChatbot && (
            <div className="lg:col-span-1">
              <Card className="rounded-3xl border-0 shadow-xl bg-card fixed mr-[3.1vw]">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-primary/10 rounded-full animate-pulse" />
                      <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                    </div>
                    <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  </div>
                  <div className="h-4 bg-muted rounded w-48 animate-pulse mt-2" />
                </CardHeader>
                <CardContent className="p-0 pb-6">
                  <div className="h-[500px] lg:h-[600px] px-6">
                    {/* Chat messages skeleton */}
                    <div className="space-y-4">
                      {/* Message 1 */}
                      <div className="flex gap-3">
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                      
                      {/* Message 2 */}
                      <div className="flex gap-3 justify-end">
                        <div className="flex-1 space-y-2 flex flex-col items-end">
                          <div className="h-4 bg-primary/20 rounded w-2/3 animate-pulse" />
                        </div>
                      </div>

                      {/* Message 3 */}
                      <div className="flex gap-3">
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-3/5 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Input area skeleton */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="h-12 bg-muted rounded-xl animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteDetailSkeleton;
