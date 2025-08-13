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
  ChevronDown, 
  Search, 
  FolderPlus,
  Edit3
} from "lucide-react"
import { NotesViewer } from "@/components/pdf"

export function MyNotesSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("All Notes")

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
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSelectedFolder("All Notes")}>
                All Notes
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create New Folder
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Folder
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
        <NotesViewer />
      </div>
    </Card>
  )
}
