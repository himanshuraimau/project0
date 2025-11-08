"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, ChevronRight, MoreVertical, Edit, Trash2 } from "lucide-react";
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
    // Don't navigate if clicking on menu
    if ((e.target as HTMLElement).closest(".folder-menu")) {
      return;
    }
    router.push(`/dashboard/folders/${folder.id}`);
  };

  return (
    <>
      <div
        className="neomorphic w-full border-0 cursor-pointer rounded-2xl transition-all duration-300"
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            {/* Left section - Icon and Content */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Folder Icon */}
              <div
                className="neomorphic flex-shrink-0 p-3 rounded-md"
                style={{
                  backgroundColor: folder.color
                    ? `${folder.color}15`
                    : "#6366f115",
                }}
              >
                <Folder
                  className="h-7 w-7"
                  style={{ color: folder.color || "#6366f1" }}
                />
              </div>

              {/* Folder Info */}
              <div className="flex-1 min-w-0">
                {/* Name */}
                <h3 className="font-bold text-lg leading-tight text-foreground mb-1">
                  {folder.name}
                </h3>

                {/* Note count */}
                <p className="text-sm text-muted-foreground mb-2">
                  {folder.noteCount} {folder.noteCount === 1 ? "note" : "notes"}
                </p>

                {/* Description if exists */}
                {folder.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right section - Menu and Chevron */}
            <div className="flex items-center gap-2">
              {/* Three-dot menu */}
              <div className="folder-menu">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Chevron */}
              <div className="neomorphic-icon flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Edit Dialog */}
      <EditFolderDialog
        folder={folder}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onUpdate}
      />

      {/* Delete Dialog */}
      <DeleteFolderDialog
        folder={folder}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={onUpdate}
      />
    </>
  );
}
