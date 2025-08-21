"use client"

import React, { useState, useEffect } from "react"
import { EditorState, ContentState, convertToRaw } from "draft-js"
import { Editor } from "react-draft-wysiwyg"
import draftToMarkdown from "draftjs-to-markdown"
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, X } from "lucide-react"

interface RichTextEditorProps {
  initialTitle: string
  initialContent: string
  onSave: (title: string, content: string) => void
  onCancel: () => void
  isSaving?: boolean
}

export function RichTextEditor({
  initialTitle,
  initialContent,
  onSave,
  onCancel,
  isSaving = false,
}: RichTextEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  )

  // Initialize editor with content
  useEffect(() => {
    if (initialContent) {
      const contentState = ContentState.createFromText(initialContent)
      setEditorState(EditorState.createWithContent(contentState))
    }
  }, [initialContent])

  const handleSave = () => {
    const contentRaw = convertToRaw(editorState.getCurrentContent())
    const markdown = draftToMarkdown(contentRaw)
    onSave(title, markdown)
  }

  return (
    <Card className="ring-2 ring-primary/20">
      <CardHeader className="pb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="text-xl font-semibold border-0 p-0 h-auto text-foreground bg-transparent"
        />
      </CardHeader>
      <CardContent className="pb-6">
        <div className="border border-input rounded-md mb-4">
          <Editor
            editorState={editorState}
            onEditorStateChange={setEditorState}
            wrapperClassName="w-full"
            editorClassName="px-4 py-2 min-h-[300px] text-foreground bg-background"
            toolbar={{
              options: [
                "inline",
                "blockType",
                "list",
                "textAlign",
                "link",
                "history",
              ],
              inline: {
                options: ["bold", "italic", "underline", "strikethrough"],
              },
              blockType: {
                options: [
                  "Normal",
                  "H1",
                  "H2",
                  "H3",
                  "H4",
                  "H5",
                  "H6",
                  "Blockquote",
                  "Code",
                ],
              },
              list: {
                options: ["unordered", "ordered"],
              },
              textAlign: {
                options: ["left", "center", "right", "justify"],
              },
            }}
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
