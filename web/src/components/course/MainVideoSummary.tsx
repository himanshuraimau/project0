import { Chapter, Unit } from "@prisma/client";
import React from "react";
import { ChapterView } from "./ChapterView";

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
      
      <ChapterView chapter={chapter} />
    </div>
  );
};

export default MainVideoSummary;