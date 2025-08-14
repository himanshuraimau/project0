"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ChevronDown,
  Search,
  FolderPlus,
  Edit3,
  Folder,
  Trash2
} from "lucide-react"
import { NotesViewer } from "@/components/pdf"

export function MyNotesSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("All Notes")
  const [folders, setFolders] = useState<string[]>(["Work", "Personal"])
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState("")
  const [editFolderName, setEditFolderName] = useState("")

  const handleCreateFolder = () => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders([...folders, newFolderName.trim()])
      setNewFolderName("")
      setShowCreateFolderDialog(false)
    }
  }

  const handleEditFolder = () => {
    if (editFolderName.trim() && !folders.includes(editFolderName.trim())) {
      const updatedFolders = folders.map(folder =>
        folder === editingFolder ? editFolderName.trim() : folder
      )
      setFolders(updatedFolders)

      // Update selected folder if it was the one being edited
      if (selectedFolder === editingFolder) {
        setSelectedFolder(editFolderName.trim())
      }

      setEditingFolder("")
      setEditFolderName("")
      setShowEditFolderDialog(false)
    }
  }

  const handleDeleteFolder = (folderToDelete: string) => {
    if (confirm(`Are you sure you want to delete the "${folderToDelete}" folder?`)) {
      setFolders(folders.filter(folder => folder !== folderToDelete))

      // Reset to "All Notes" if the deleted folder was selected
      if (selectedFolder === folderToDelete) {
        setSelectedFolder("All Notes")
      }
    }
  }

  const openEditFolderDialog = (folder: string) => {
    setEditingFolder(folder)
    setEditFolderName(folder)
    setShowEditFolderDialog(true)
  }

  return (
    <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">My Notes</h2>
        <p className="text-muted-foreground">View and manage all your generated notes</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-between min-w-[200px] rounded-2xl">
                {selectedFolder}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setSelectedFolder("All Notes")}>
                <Folder className="h-4 w-4 mr-2" />
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
                      <Folder className="h-4 w-4 mr-2" />
                      {folder}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditFolderDialog(folder)
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolder(folder)
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

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
      </div>

      {/* Notes Display */}
      <div className="rounded-2xl overflow-hidden">
        <NotesViewer searchQuery={searchQuery} />
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
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
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFolderDialog(false)
                setNewFolderName("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || folders.includes(newFolderName.trim())}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={showEditFolderDialog} onOpenChange={setShowEditFolderDialog}>
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
                  if (e.key === 'Enter') {
                    handleEditFolder()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditFolderDialog(false)
                setEditingFolder("")
                setEditFolderName("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditFolder}
              disabled={!editFolderName.trim() || folders.includes(editFolderName.trim())}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
