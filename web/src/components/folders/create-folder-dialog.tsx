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
import { Loader2 } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

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

      toast.success("📁 Folder created successfully!");
      
      // Reset form
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={`text-left ${jakarta.className}`}>
            Create New Folder
          </DialogTitle>
          <DialogDescription className={`${jakarta.className}`}>
            Organize your notes by creating a new folder
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Folder Name */}
          <div className="space-y-2">
            <Label htmlFor="folder-name">
              Folder Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="folder-name"
              placeholder="e.g., AI Research, Class Notes, Projects"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={loading}
              className="h-[40px]"
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="folder-description">Description (Optional)</Label>
            <Textarea
              id="folder-description"
              placeholder="Brief description of what this folder contains..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              disabled={loading}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 characters
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Folder Color</Label>
            <div className="grid grid-cols-5 gap-3">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  disabled={loading}
                  className={`
                    h-10 w-full rounded-lg transition-all duration-200
                    ${
                      selectedColor === color.value
                        ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                        : "hover:scale-105"
                    }
                  `}
                  style={{
                    backgroundColor: color.value,
                  }}
                  title={color.name}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-[40px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 h-[40px] bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e3] hover:to-[#7c4ddc] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
