import React from "react";

interface NoteDetailSkeletonProps {
  showChatbot?: boolean;
}

export function NoteDetailSkeleton({ showChatbot = false }: NoteDetailSkeletonProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Loading Text with Pulse */}
        <div className="text-center mb-8 space-y-3">
          <h2 className="text-2xl font-bold text-foreground animate-pulse">
            Loading Note
          </h2>
          <p className="text-muted-foreground animate-pulse" style={{ animationDelay: '0.5s' }}>
            Please wait a moment...
          </p>
        </div>

        {/* Skeleton Card */}
        <div className="rounded-2xl border-2 border-dashed border-black/30 dark:border-muted/30 bg-accent/5 p-8 ">
          <div className="text-center space-y-6">
            {/* Avatar Circle */}
            <div className="mx-auto w-20 h-20 rounded-full bg-muted relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Title Bar */}
            <div className="h-6 w-3/5 bg-muted rounded-xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Text Lines */}
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full bg-muted rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-11/12 bg-muted rounded-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-9/12 bg-muted rounded-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-10/12 bg-muted rounded-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <div className="h-4 w-7/12 bg-muted rounded-lg mx-auto relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default NoteDetailSkeleton;