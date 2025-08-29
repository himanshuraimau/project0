"use client";
import { cn } from "@/lib/utils";
import { Chapter } from "@prisma/client";
import axios from "axios";
import React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  chapter: Chapter;
  chapterIndex: number;
  completedChapters: Set<string>;
  setCompletedChapters: React.Dispatch<React.SetStateAction<Set<string>>>;
  courseId?: string;
};

export type ChapterCardHandler = {
  triggerLoad: () => void;
};

const ChapterCard = React.forwardRef<ChapterCardHandler, Props>(
  ({ chapter, setCompletedChapters, courseId }, ref) => {
    const [success, setSuccess] = React.useState<boolean | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    const getChapterInfo = async () => {
      try {
        setIsLoading(true);
        const response = await axios.post("/api/chapter/info", {
          chapterId: chapter.id,
        });
        return response.data;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    const addChapterIdToSet = React.useCallback(() => {
      setCompletedChapters((prev) => {
        const newSet = new Set(prev);
        newSet.add(chapter.id);
        return newSet;
      });
    }, [chapter.id, setCompletedChapters]);

    React.useEffect(() => {
      if (chapter.videoId) {
        setSuccess(true);
        addChapterIdToSet();
      }
    }, [chapter, addChapterIdToSet]);

    React.useImperativeHandle(ref, () => ({
      async triggerLoad() {
        if (chapter.videoId) {
          addChapterIdToSet();
          return;
        }

        try {
          await getChapterInfo();
          setSuccess(true);
          addChapterIdToSet();
        } catch (error) {
          console.error(error);
          setSuccess(false);
          toast("There was an error loading your chapter");
          addChapterIdToSet();
        }
      },
    }));
    return (
      <div
        key={chapter.id}
        className={cn("px-4 py-2 mt-2 rounded flex justify-between cursor-pointer hover:opacity-80 transition-opacity", {
          "bg-secondary": success === null,
          "bg-red-500": success === false,
          "bg-green-500": success === true,
        })}
        onClick={() => {
          if (courseId) {
            // Navigate to the chapter page
            router.push(`/dashboard/course/${courseId}/chapter/${chapter.id}`);
          } else {
            // Fallback: just trigger the load
            if (!chapter.videoId && !isLoading) {
              getChapterInfo().catch(console.error);
            }
          }
        }}
      >
        <h5>{chapter.name}</h5>
        {isLoading && <Loader2 className="animate-spin" />}
      </div>
    );
  }
);

ChapterCard.displayName = "ChapterCard";

export default ChapterCard;