"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFolders } from "@/hooks/use-folders";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderAddIcon, Loading01Icon } from "@hugeicons/core-free-icons";

const FOLDER_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Blue", value: "#3b82f6" },
];

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateFolderDialogProps) {
  const { createFolder, loading } = useFolders();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      await createFolder({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
      });

      toast.success("Folder created successfully");

      setName("");
      setDescription("");
      setSelectedColor(FOLDER_COLORS[0].value);

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create folder"
      );
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName("");
      setDescription("");
      setSelectedColor(FOLDER_COLORS[0].value);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-xl border-border p-0 gap-0 overflow-hidden bg-card">
        <DialogHeader className="space-y-1.5 px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={FolderAddIcon} className="size-5" />
            </div>
            <div className="">
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                Create New Folder
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground -mt-0.5">
                Organize your notes by creating a new folder
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6 pt-4">
          {/* Folder Name */}
          <div className="space-y-2">
            <Label
              htmlFor="folder-name"
              className="text-sm font-medium text-foreground"
            >
              Folder name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="folder-name"
              placeholder="e.g., AI Research, Class Notes, Projects"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={loading}
              className="h-10 rounded-md border-none bg-background px-3 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-describedby="folder-name-count"
            />
            <p
              id="folder-name-count"
              className="text-xs text-muted-foreground tabular-nums"
            >
              {name.length}/50
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="folder-description"
              className="text-lg font-medium text-foreground"
            >
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="folder-description"
              placeholder="Brief description of what this folder contains..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              disabled={loading}
              rows={3}
              className="rounded-md border-none bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-none"
              aria-describedby="folder-desc-count"
            />
            <p
              id="folder-desc-count"
              className="text-xs text-muted-foreground tabular-nums"
            >
              {description.length}/200
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Folder color
            </Label>
            <div
              className="grid grid-cols-5 gap-2.5"
              role="group"
              aria-label="Choose folder color"
            >
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  disabled={loading}
                  className={`h-9 w-full rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105 ${
                    selectedColor === color.value
                      ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : ""
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  aria-label={`Select ${color.name} color`}
                  aria-pressed={selectedColor === color.value}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-10 cursor-pointer rounded-md font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 h-10 cursor-pointer text-white rounded-md bg-primary font-medium hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="size-4 animate-spin shrink-0"
                  />
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
