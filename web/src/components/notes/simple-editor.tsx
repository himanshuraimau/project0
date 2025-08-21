"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, X } from "lucide-react"

interface SimpleEditorProps {
  initialTitle: string
  initialContent: string
  onSave: (title: string, content: string) => void
  onCancel: () => void
  isSaving?: boolean
}

export function SimpleEditor({
  initialTitle,
  initialContent,
  onSave,
  onCancel, // We keep this parameter for interface compatibility but don't use it
  isSaving = false,
}: SimpleEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)

  // We don't need a handleSave function here anymore as the save button is in the parent component
  // The parent component will call onSave directly with the current title and content

  return (
    <Card className="ring-2 ring-primary/20 simple-editor">
      <CardHeader className="pb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="text-xl font-semibold border-0 p-0 h-auto text-foreground bg-transparent"
          onBlur={() => onSave(title, content)} // Save on blur
        />
      </CardHeader>
      <CardContent className="pb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[400px] p-4 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm leading-relaxed bg-background text-foreground"
          placeholder="Write your note here..."
          onBlur={() => onSave(title, content)} // Save on blur
        />
        {/* No buttons here - they're in the top bar */}
      </CardContent>
    </Card>
  )
}
