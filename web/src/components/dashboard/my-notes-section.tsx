"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  Search,
  FolderPlus,
  Edit3,
  Folder,
  Trash2,
} from "lucide-react";
import { NotesList } from "@/components/notes/notes-list";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export function MyNotesSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All Notes");
  const [folders, setFolders] = useState<string[]>(["Work", "Personal"]);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState("");
  const [editFolderName, setEditFolderName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders([...folders, newFolderName.trim()]);
      setNewFolderName("");
      setShowCreateFolderDialog(false);
    }
  };

  const handleEditFolder = () => {
    if (editFolderName.trim() && !folders.includes(editFolderName.trim())) {
      const updatedFolders = folders.map((folder) =>
        folder === editingFolder ? editFolderName.trim() : folder
      );
      setFolders(updatedFolders);

      // Update selected folder if it was the one being edited
      if (selectedFolder === editingFolder) {
        setSelectedFolder(editFolderName.trim());
      }

      setEditingFolder("");
      setEditFolderName("");
      setShowEditFolderDialog(false);
    }
  };

  const handleDeleteFolder = (folderToDelete: string) => {
    // Using AlertDialog component instead of browser confirm
    setFolders(folders.filter((folder) => folder !== folderToDelete));

    // Reset to "All Notes" if the deleted folder was selected
    if (selectedFolder === folderToDelete) {
      setSelectedFolder("All Notes");
    }
  };

  const openEditFolderDialog = (folder: string) => {
    setEditingFolder(folder);
    setEditFolderName(folder);
    setShowEditFolderDialog(true);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto font-inter ${inter.className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          My Notes
        </h2>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="justify-between min-w-[150px] h-10 px-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{selectedFolder}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-stone-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setSelectedFolder("All Notes")}>
                <Folder className="h-4 w-4 mr-2 text-yellow-500" />
                All Notes
              </DropdownMenuItem>

              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className="group"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2 text-yellow-500" />
                      {folder}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditFolderDialog(folder);
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}

              <DropdownMenuItem
                onClick={() => setShowCreateFolderDialog(true)}
                className="border-t mt-1 pt-1"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search any notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Notes Display */}
      <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
        <NotesList searchQuery={searchQuery} />
      </div>

      {/* Create Folder Dialog */}
      <Dialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your notes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="folder-name" className="text-right">
                Name
              </label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3"
                placeholder="Enter folder name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFolderDialog(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={
                !newFolderName.trim() || folders.includes(newFolderName.trim())
              }
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog
        open={showEditFolderDialog}
        onOpenChange={setShowEditFolderDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Rename the "{editingFolder}" folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-folder-name" className="text-right">
                Name
              </label>
              <Input
                id="edit-folder-name"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                className="col-span-3"
                placeholder="Enter new folder name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEditFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditFolderDialog(false);
                setEditingFolder("");
                setEditFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditFolder}
              disabled={
                !editFolderName.trim() ||
                folders.includes(editFolderName.trim())
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
