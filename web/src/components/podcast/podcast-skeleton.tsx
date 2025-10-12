"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, FileText, Users, User, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface PodcastSkeletonProps {
  variant?: "generator" | "player" | "layout" | "form" | "compact";
  className?: string;
}

/**
 * Main podcast skeleton component with different variants
 */
export function PodcastSkeleton({ 
  variant = "generator", 
  className 
}: PodcastSkeletonProps) {
  switch (variant) {
    case "generator":
      return <PodcastGeneratorSkeleton className={className} />;
    case "player":
      return <PodcastPlayerSkeleton className={className} />;
    case "layout":
      return <PodcastLayoutSkeleton className={className} />;
    case "form":
      return <PodcastFormSkeleton className={className} />;
    case "compact":
      return <PodcastCompactSkeleton className={className} />;
    default:
      return <PodcastGeneratorSkeleton className={className} />;
  }
}

/**
 * Loading skeleton for the main podcast generator interface
 */
export function PodcastGeneratorSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-[calc(100vh-64px)] w-full flex items-center justify-center bg-background px-6", className)}>
      <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
        <div className="flex flex-col items-center gap-8">
          {/* Animated Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
              <Mic className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-3">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>

          {/* Loading Bar */}
          <div className="w-64 h-2 neomorphic rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full animate-loading-bar" />
          </div>

          {/* Action Button Skeleton */}
          <Skeleton className="h-16 w-full max-w-xs rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the podcast player component
 */
export function PodcastPlayerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Main Player Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio Player Card */}
        <Card className="neomorphic border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="neomorphic-icon w-12 h-12 rounded-xl flex items-center justify-center">
                <Mic className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Metadata */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            {/* Audio Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>

        {/* Transcript Preview Card */}
        <Card className="neomorphic border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Skeleton className="h-6 w-40" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 animate-pulse" />
                <Skeleton className="h-4 w-48 mx-auto mb-2" />
                <Skeleton className="h-3 w-56 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the full podcast layout with synchronized transcript
 */
export function PodcastLayoutSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-20 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Main Two-Card Layout */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Audio Player Card */}
        <Card className="neomorphic border-0 flex flex-col min-h-[400px] xl:min-h-[600px]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="neomorphic-icon w-12 h-12 rounded-xl flex items-center justify-center">
                <Mic className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-6 w-40" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col space-y-6">
            {/* Metadata */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            {/* Audio Controls */}
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="flex items-center justify-center gap-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>

            {/* Progress Information */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1 w-full rounded-full" />
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-1 pt-3 border-t">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>

        {/* Transcript Card */}
        <Card className="neomorphic border-0 flex flex-col min-h-[400px] xl:min-h-[600px]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            
            {/* Topics navigation */}
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-16" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-24 rounded" />
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto pr-2 space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-3 w-8 mt-1 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center justify-between mt-2">
                          <Skeleton className="h-4 w-16 rounded-full" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active chunk info */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the podcast generation form
 */
export function PodcastFormSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-muted-foreground animate-pulse" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Podcast Mode Selection */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div className="flex items-center gap-2">
                    {i === 1 ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Configuration */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          
          {/* Host Voice */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-3 w-48" />
          </div>

          {/* Guest Voice */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-3 w-52" />
          </div>
        </div>

        {/* Quality Settings */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          
          {/* Quality Preset */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duration Scale */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Settings */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact loading skeleton for sidebar or small spaces
 */
export function PodcastCompactSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("neomorphic border-0", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="neomorphic-icon w-10 h-10 rounded-lg flex items-center justify-center">
                <Mic className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-1 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-2 w-8" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for podcast generation progress
 */
export function PodcastGenerationSkeleton({ 
  progress = 0,
  message = "Generating Podcast",
  submessage = "Creating AI-generated podcast with voices...",
  className 
}: { 
  progress?: number;
  message?: string;
  submessage?: string;
  className?: string;
}) {
  return (
    <div className={cn("h-[87vh] flex items-center justify-center bg-transparent dark:bg-[#0A0B0D] px-6", className)}>
      <div className="neomorphic rounded-3xl p-12 bg-background border-0 max-w-2xl w-full">
        <div className="flex flex-col items-center gap-8">
          {/* Animated Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative neomorphic-icon w-20 h-20 rounded-2xl flex items-center justify-center">
              <Mic className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-semibold text-foreground">{message}</h3>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              {submessage}
            </p>
            {progress > 0 && (
              <p className="text-sm text-primary font-medium">
                Progress: {Math.round(progress)}%
              </p>
            )}
          </div>

          {/* Loading Animation */}
          <div className="w-full max-w-md space-y-4">
            {/* Pulsing dots */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
              <div className="neomorphic rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Status Steps */}
          <div className="w-full max-w-md space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Content processed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                progress > 25 ? "bg-green-500" : "bg-muted animate-pulse"
              )} />
              <span>Voices configured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                progress > 50 ? "bg-green-500" : "bg-muted animate-pulse"
              )} />
              <span>Audio generation in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                progress > 90 ? "bg-green-500" : "bg-muted"
              )} />
              <span>Finalizing podcast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for transcript synchronization
 */
export function TranscriptSyncSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 rounded-lg border animate-pulse">
          <div className="flex items-start gap-3">
            <Skeleton className="h-3 w-8 mt-1 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              {i % 2 === 0 && <Skeleton className="h-4 w-3/5" />}
              <div className="flex items-center justify-between mt-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for podcast sidebar item
 */
export function PodcastSidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg", className)}>
      <div className="neomorphic-icon w-8 h-8 rounded-lg flex items-center justify-center">
        <Mic className="h-4 w-4 text-primary animate-pulse" />
      </div>
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center gap-1">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
    </div>
  );
}