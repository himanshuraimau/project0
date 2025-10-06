"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { NotesList, NotesListRef } from "@/components/notes/notes-list";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { useDashboardRefresh } from "@/contexts/dashboard-refresh-context";

const inter = Inter({ subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

export function MyNotesSection() {
  const { setRefreshHandler } = useDashboardRefresh();
  const notesListRef = useRef<NotesListRef>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("All Notes");
  const [folders, setFolders] = useState<string[]>(["Work", "Personal"]);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState("");
  const [editFolderName, setEditFolderName] = useState("");

  // Register refresh handler when component mounts
  useEffect(() => {
    const refreshHandler = async () => {
      if (notesListRef.current?.refreshNotes) {
        await notesListRef.current.refreshNotes();
      }
    };
    setRefreshHandler(refreshHandler);
  }, [setRefreshHandler]);

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
    <div className={`w-full ${inter.className}`}>
      <div className="mb-8">
        <h2 className={`text-2xl leading-8 font-semibold text-foreground mb-3 ${jakarta.className}`}>
          My Notes
        </h2>
        <p className={`text-muted-foreground text-base font-medium leading-6 ${jakarta.className}`}>
          Manage and organize your notes
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8 sm:justify-between">
        <div className="flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="justify-between min-w-[180px] h-12 px-4 bg-card border border-border rounded-2xl hover:bg-muted/50 text-foreground font-medium transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Folder className="h-4 w-4 text-accent" />
                  <span className="text-sm">{selectedFolder}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card border border-border shadow-xl">
              <DropdownMenuItem onClick={() => setSelectedFolder("All Notes")}>
                <Folder className="h-4 w-4 mr-2.5 text-accent" />
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
                      <Folder className="h-4 w-4 mr-2 text-accent" />
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
                className="border-t border-border mt-1 pt-2"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative min-w-xl">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-12 h-12 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Notes Display */}
      <div className="w-full rounded-2xl pt-5">
        <NotesList 
          ref={notesListRef}
          searchQuery={searchQuery} 
        />
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
              Rename the &quot;{editingFolder}&quot; folder.
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
