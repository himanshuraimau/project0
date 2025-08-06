"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronDown, 
  Search, 
  FileText, 
  Video,
  Mic,
  Link2,
  Clock,
  FolderPlus,
  Edit3
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  title: string
  type: 'audio' | 'video' | 'text' | 'link'
  timestamp: string
  summary?: string
  duration?: string
}

// Mock data for demonstration
const mockNotes: Note[] = [
  {
    id: "1",
    title: "Meeting Notes - Q1 Planning",
    type: 'audio',
    timestamp: "2 hours ago",
    duration: "45 min",
    summary: "Quarterly planning session covering goals, budget allocation, and team assignments."
  },
  {
    id: "2", 
    title: "Product Launch Strategy",
    type: 'video',
    timestamp: "Yesterday",
    duration: "1h 20min",
    summary: "Comprehensive overview of our new product launch strategy and timeline."
  },
  {
    id: "3",
    title: "Research Paper Summary",
    type: 'text',
    timestamp: "3 days ago",
    summary: "Analysis of recent market research findings and implications for our business."
  },
  {
    id: "4",
    title: "Tech Conference Highlights",
    type: 'link',
    timestamp: "1 week ago",
    duration: "2h 15min",
    summary: "Key takeaways from the annual technology conference presentations."
  },
]

export function MyNotesSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("All Notes")

  const getTypeIcon = (type: Note['type']) => {
    switch (type) {
      case 'audio':
        return <Mic className="h-5 w-5 text-primary" />
      case 'video':
        return <Video className="h-5 w-5 text-secondary" />
      case 'text':
        return <FileText className="h-5 w-5 text-accent-foreground" />
      case 'link':
        return <Link2 className="h-5 w-5 text-secondary" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getTypeBadge = (type: Note['type']) => {
    const badgeConfig = {
      audio: { label: "Audio", className: "bg-primary/10 text-primary border-primary/20" },
      video: { label: "Video", className: "bg-secondary/10 text-secondary border-secondary/20" },
      text: { label: "Text", className: "bg-accent/10 text-accent-foreground border-accent/20" },
      link: { label: "Link", className: "bg-secondary/10 text-secondary border-secondary/20" }
    }
    
    const config = badgeConfig[type]
    return (
      <Badge className={cn("rounded-full px-3 py-1 text-xs font-medium", config.className)}>
        {config.label}
      </Badge>
    )
  }

  const filteredNotes = mockNotes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="rounded-3xl border-0 p-8 shadow-xl bg-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">My Notes</h2>
        <p className="text-muted-foreground">Manage and organize your notes</p>
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

      {/* Notes Grid */}
      <div className="grid gap-6">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <Card 
              key={note.id}
              className="p-6 border border-border hover:border-primary/20 rounded-2xl transition-all duration-300 hover:shadow-lg cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-2xl bg-muted/50 group-hover:bg-primary/5 transition-colors">
                  {getTypeIcon(note.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {getTypeBadge(note.type)}
                    </div>
                  </div>
                  
                  {note.summary && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {note.summary}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{note.timestamp}</span>
                    </div>
                    {note.duration && (
                      <div className="flex items-center gap-1">
                        <span>Duration: {note.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notes found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search terms" : "Create your first note to get started"}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
