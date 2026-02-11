"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Mic01Icon,
  Upload01Icon,
  Video01Icon,
  GlobeIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { NotesNoteWithTranscript } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getRelativeTime } from "@/lib/utils/relative-time";
import { NoteSettingsModal } from "./note-settings-modal";

interface NoteCardProps {
  note: NotesNoteWithTranscript;
  onUpdate?: () => void;
}

function getTypeIcon(note: NotesNoteWithTranscript) {
  const type = note.transcript?.type;
  if (type === "audio") {
    const name = note.transcript?.originalName ?? "";
    return name.toLowerCase().includes("recorded") ? Mic01Icon : Upload01Icon;
  }
  switch (type) {
    case "pdf":
      return File01Icon;
    case "youtube":
      return Video01Icon;
    case "webpage":
      return GlobeIcon;
    default:
      return File01Icon;
  }
}

export function NoteCard({ note, onUpdate }: NoteCardProps) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const IconComponent = getTypeIcon(note);

  const updatedAt =
    note.updatedAt instanceof Date
      ? note.updatedAt.toISOString()
      : note.updatedAt;
  const lastOpenedText = updatedAt ? getRelativeTime(updatedAt) : "—";

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".note-settings-trigger")) return;
    router.push(`/notes/${note.id}`);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick(e as unknown as React.MouseEvent);
          }
        }}
        className="group flex items-center gap-4 w-full rounded-xl border-none bg-card dark:bg-card/80 p-4 sm:p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 cursor-pointer"
      >
        {/* Left: type icon in primary square */}
        <div className="flex shrink-0 items-center justify-center size-12 rounded-xl bg-primary text-primary-foreground">
          <HugeiconsIcon icon={IconComponent} className="size-6" />
        </div>

        {/* Center: title + last opened */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-medium text-black truncate text-xl dark:text-white leading-tight"
            title={note.title}
          >
            {note.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last opened {lastOpenedText}
          </p>
        </div>

        {/* Right: three-dots menu */}
        <button
          type="button"
          aria-label="Note settings"
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(true);
          }}
          className="note-settings-trigger flex shrink-0 items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} className="size-16" />
        </button>
      </div>

      <NoteSettingsModal
        note={note}
        open={showSettings}
        onOpenChange={setShowSettings}
        onSuccess={onUpdate}
      />
    </>
  );
}
