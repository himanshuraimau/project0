"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  MoreVerticalIcon,
  Edit01Icon,
  Delete01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DeleteFolderDialog } from "./delete-folder-dialog";
import { EditFolderDialog } from "./edit-folder-dialog";

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    description?: string | null;
    noteCount: number;
    color?: string | null;
    updatedAt: Date | string;
  };
  onUpdate: () => void;
}

export function FolderCard({ folder, onUpdate }: FolderCardProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".folder-menu")) return;
    router.push(`/dashboard/folders/${folder.id}`);
  };

  const accentBg = folder.color ? `${folder.color}18` : "hsl(var(--primary) / 0.12)";

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
        className="group w-full rounded-2xl border border-border bg-card dark:bg-card/80 p-5 sm:p-6 transition-all duration-200 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="flex shrink-0 items-center justify-center size-12 rounded-xl text-primary"
              style={{
                backgroundColor: accentBg,
                color: folder.color || undefined,
              }}
            >
              <HugeiconsIcon icon={Folder01Icon} className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-base leading-tight mb-1">
                {folder.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {folder.noteCount} {folder.noteCount === 1 ? "note" : "notes"}
              </p>
              {folder.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {folder.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="folder-menu">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HugeiconsIcon icon={MoreVerticalIcon} className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditDialog(true);
                    }}
                    className="cursor-pointer rounded-lg"
                  >
                    <HugeiconsIcon icon={Edit01Icon} className="size-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-center size-9 rounded-lg text-muted-foreground group-hover:text-foreground transition-colors">
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
            </div>
          </div>
        </div>
      </div>

      <EditFolderDialog
        folder={folder}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onUpdate}
      />
      <DeleteFolderDialog
        folder={folder}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onUpdate}
      />
    </>
  );
}
