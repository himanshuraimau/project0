"use client";
import { Chapter, Course, Unit } from "@prisma/client";
import React from "react";
import ChapterCard, { ChapterCardHandler } from "./ChapterCard";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { Button, buttonVariants } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
};

const ConfirmChapters = ({ course }: Props) => {
  const [loading, setLoading] = React.useState(false);
  const [currentlyProcessing, setCurrentlyProcessing] = React.useState<string>("");
  const [processedCount, setProcessedCount] = React.useState(0);
  const [failedChapters, setFailedChapters] = React.useState<Set<string>>(new Set());
  
  const chapterRefs: Record<string, React.RefObject<ChapterCardHandler | null>> = {};
  course.units.forEach((unit) => {
    unit.chapters.forEach((chapter) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      chapterRefs[chapter.id] = React.useRef<ChapterCardHandler | null>(null);
    });
  });
  const [completedChapters, setCompletedChapters] = React.useState<Set<string>>(
    new Set()
  );
  const totalChaptersCount = React.useMemo(() => {
    return course.units.reduce((acc, unit) => {
      return acc + unit.chapters.length;
    }, 0);
  }, [course.units]);

  // Helper function to find chapter by ID
  const findChapterById = (chapterId: string): Chapter | null => {
    for (const unit of course.units) {
      const chapter = unit.chapters.find(ch => ch.id === chapterId);
      if (chapter) return chapter;
    }
    return null;
  };

  // Sequential chapter processing function
    const processChaptersBatch = async () => {
    setLoading(true);
    setCurrentlyProcessing("");
    setProcessedCount(0);
    const chapterEntries = Object.entries(chapterRefs);
    const BATCH_SIZE = 4; // Process 4 chapters at a time
    
    for (let i = 0; i < chapterEntries.length; i += BATCH_SIZE) {
      const batch = chapterEntries.slice(i, i + BATCH_SIZE);
      
      // Set currently processing status for the batch
      const batchNames = batch
        .map(([chapterId]) => {
          const chapter = findChapterById(chapterId);
          return chapter?.name || `Chapter ${Math.floor(i / BATCH_SIZE) + 1}`;
        })
        .join(", ");
      
      setCurrentlyProcessing(`Processing: ${batchNames}`);
      
      // Process batch concurrently
      const batchPromises = batch.map(async ([chapterId, ref]) => {
        const chapter = findChapterById(chapterId);
        
        if (chapter?.videoId) {
          // Chapter already processed
          return { success: true, chapterId, chapterName: chapter.name };
        }
        
        try {
          await ref.current?.triggerLoad();
          return { success: true, chapterId, chapterName: chapter?.name };
        } catch (error) {
          console.error(`Failed to process chapter ${chapterId}:`, error);
          return { success: false, chapterId, chapterName: chapter?.name, error };
        }
      });
      
      // Wait for batch to complete
      const results = await Promise.allSettled(batchPromises);
      
      // Process results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { success, chapterId, chapterName } = result.value;
          if (success) {
            toast.success(`✅ ${chapterName || `Chapter ${i + index + 1}`} completed`);
            setProcessedCount(prev => prev + 1);
          } else {
            toast.error(`❌ Failed to process ${chapterName || `Chapter ${i + index + 1}`}. Click retry to try again.`);
            setFailedChapters(prev => new Set([...prev, chapterId]));
          }
        } else {
          const [chapterId] = batch[index];
          const chapter = findChapterById(chapterId);
          toast.error(`❌ Failed to process ${chapter?.name || `Chapter ${i + index + 1}`}. Click retry to try again.`);
          setFailedChapters(prev => new Set([...prev, chapterId]));
        }
      });
      
      // Add delay between batches to prevent API overload
      if (i + BATCH_SIZE < chapterEntries.length) {
        setCurrentlyProcessing("Preparing next batch...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
      }
    }
    
    setCurrentlyProcessing("");
    setLoading(false);
    
    if (failedChapters.size === 0) {
      toast.success("All chapters processed successfully!");
    } else {
      toast.warning(`⚠️ ${failedChapters.size} chapter(s) failed. You can retry them individually.`);
    }
  };

  // Retry failed chapters
  const retryFailedChapters = async () => {
    if (failedChapters.size === 0) return;

    setLoading(true);
    const newFailed = new Set<string>();

    for (const chapterId of failedChapters) {
      const chapter = course.units
        .flatMap(unit => unit.chapters)
        .find(ch => ch.id === chapterId);
      
      if (!chapter) continue;

      setCurrentlyProcessing(`Retrying: ${chapter.name}`);

      try {
        await chapterRefs[chapterId].current?.triggerLoad();
        console.log(`Successfully retried chapter: ${chapter.name}`);
      } catch (error) {
        console.error(`Retry failed for chapter: ${chapter.name}`, error);
        newFailed.add(chapterId);
      }

      // Add delay between retries
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setFailedChapters(newFailed);
    setCurrentlyProcessing("");
    setLoading(false);

    // Show retry completion message
    if (newFailed.size === 0) {
      toast.success("All failed chapters have been successfully retried!");
    } else {
      toast.error(`${newFailed.size} chapters still failed after retry. Please check the console for details.`);
    }
  };

  console.log(totalChaptersCount, completedChapters.size);
  return (
    <div className="w-full mt-4">
      {course.units.map((unit, unitIndex) => {
        return (
          <div key={unit.id} className="mt-5">
            <h2 className="text-sm uppercase text-secondary-foreground/60">
              Unit {unitIndex + 1}
            </h2>
            <h3 className="text-2xl font-bold">{unit.name}</h3>
            <div className="mt-3">
              {unit.chapters.map((chapter, chapterIndex) => {
                return (
                  <ChapterCard
                    completedChapters={completedChapters}
                    setCompletedChapters={setCompletedChapters}
                    ref={chapterRefs[chapter.id]}
                    key={chapter.id}
                    chapter={chapter}
                    chapterIndex={chapterIndex}
                    isCurrentlyProcessing={currentlyProcessing.includes(chapter.name)}
                    hasFailed={failedChapters.has(chapter.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-center mt-4">
        <Separator className="flex-[1]" />
        <div className="flex items-center mx-4">
          <Link
            href="/dashboard/create?mode=manual"
            className={buttonVariants({
              variant: "secondary",
            })}
          >
            <ChevronLeft className="w-4 h-4 mr-2" strokeWidth={4} />
            Back
          </Link>
          
          {/* Progress Display */}
          {loading && (
            <div className="ml-4 mr-4 text-center">
              <div className="text-sm font-medium text-accent">
                Generating Course Content...
              </div>
              <div className="text-xs text-gray-500">
                {currentlyProcessing || 'Preparing...'}
              </div>
              <div className="text-xs text-gray-500">
                {processedCount}/{totalChaptersCount} chapters completed
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(processedCount / totalChaptersCount) * 100}%` }}
                />
              </div>
              <div className="text-xs text-accent/80 mt-1">
                Processing 4 chapters at a time
              </div>
            </div>
          )}

          {/* Failed Chapters Retry */}
          {!loading && failedChapters.size > 0 && (
            <Button
              type="button"
              variant="destructive"
              className="ml-4"
              onClick={retryFailedChapters}
            >
              Retry Failed ({failedChapters.size})
            </Button>
          )}

          {totalChaptersCount === completedChapters.size ? (
            <Link
              className={buttonVariants({
                className: "ml-4 font-semibold",
              })}
              href={`/dashboard/course/${course.id}/0/0`}
            >
              Save & Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          ) : (
            <Button
              type="button"
              className="ml-4 font-semibold"
              disabled={loading}
              onClick={processChaptersBatch}
            >
              {loading ? "Generating..." : "Generate"}
              <ChevronRight className="w-4 h-4 ml-2" strokeWidth={4} />
            </Button>
          )}
        </div>
        <Separator className="flex-[1]" />
      </div>
    </div>
  );
};

export default ConfirmChapters;