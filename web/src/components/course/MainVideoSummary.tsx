import { Chapter, Unit } from "@prisma/client";
import React from "react";
import { YouTubePlayer } from "./YouTubePlayer";

type Props = {
  chapter: Chapter;
  unit: Unit;
  unitIndex: number;
  chapterIndex: number;
};

const MainVideoSummary = ({
  unit,
  unitIndex,
  chapter,
  chapterIndex,
}: Props) => {
  return (
    <div className="flex-[2]">
      <h4 className="text-xs uppercase text-muted-foreground tracking-wide mb-2">
        Unit {unitIndex + 1} &bull; Chapter {chapterIndex + 1}
      </h4>
      <h1 className="text-3xl font-bold text-foreground mb-4">{chapter.name}</h1>
      {chapter.videoId && (
        <div className="mb-6">
          <YouTubePlayer
            videoId={chapter.videoId}
            title={chapter.name}
            className="rounded-xl overflow-hidden shadow"
          />
        </div>
      )}
      {!chapter.videoId && (
        <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Video content is being generated</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        </div>
      )}
      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-semibold mb-2 text-foreground">Summary</h3>
        <p className="text-base text-muted-foreground leading-relaxed">{chapter.summary}</p>
      </div>
    </div>
  );
};

export default MainVideoSummary;