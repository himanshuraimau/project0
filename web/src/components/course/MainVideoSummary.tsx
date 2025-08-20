import { Chapter, Unit } from "@prisma/client";
import React from "react";

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
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow mb-6">
        <iframe
          title="chapter video"
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${chapter.videoId}`}
          allowFullScreen
        />
      </div>
      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-semibold mb-2 text-foreground">Summary</h3>
        <p className="text-base text-muted-foreground leading-relaxed">{chapter.summary}</p>
      </div>
    </div>
  );
};

export default MainVideoSummary;