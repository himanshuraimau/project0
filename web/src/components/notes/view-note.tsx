"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/mdx-renderer"
import { Note } from "@/lib/types"
import { Edit, Copy, Download } from "lucide-react"
import { toast } from "sonner"

interface ViewNoteProps {
  note: Note
  onEdit: () => void
}

export function ViewNote({ note, onEdit }: ViewNoteProps) {
  const handleCopy = async () => {
    if (note?.content) {
      await navigator.clipboard.writeText(note.content)
      toast("Note content copied to clipboard.")
    }
  }

  const handleDownload = () => {
    if (note) {
      const element = document.createElement("a")
      const file = new Blob([note.content || ""], { type: "text/plain" })
      element.href = URL.createObjectURL(file)
      element.download = `${note.title || "note"}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">{note.title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {formatDate(
              note.updatedAt instanceof Date
                ? note.updatedAt.toISOString()
                : note.updatedAt
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
          <MarkdownRenderer content={note.content || ""} />
        </div>
      </CardContent>
    </Card>
  )
}
