"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Note } from "@/lib/types";
import {
  Copy,
  Download,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Table,
  Type,
  Minus,
  Plus,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

// Lexical imports
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getRoot,
  FORMAT_ELEMENT_COMMAND,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";

interface ViewNoteProps {
  note: Note;
}

// Lexical theme configuration
const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "text-muted-foreground text-base",
  paragraph: "mb-2",
  quote: "border-l-4 border-accent pl-4 italic text-muted-foreground",
  heading: {
    h1: "text-3xl font-sans font-bold mb-4",
    h2: "text-2xl font-sans font-semibold mb-3",
    h3: "text-xl font-sans font-semibold mb-2",
    h4: "text-lg font-sans font-semibold mb-2",
    h5: "text-base font-sans font-semibold mb-1",
    h6: "text-sm font-sans font-semibold mb-1",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal list-inside mb-2",
    ul: "list-disc list-inside mb-2",
    listitem: "mb-1",
  },
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-muted px-1 py-0.5 rounded text-sm font-mono",
  },
  code: "bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto",
  codeHighlight: {
    atrule: "text-purple-600",
    attr: "text-blue-600",
    boolean: "text-red-600",
    builtin: "text-purple-600",
    cdata: "text-gray-600",
    char: "text-green-600",
    class: "text-blue-600",
    "class-name": "text-blue-600",
    comment: "text-gray-500",
    constant: "text-red-600",
    deleted: "text-red-600",
    doctype: "text-gray-600",
    entity: "text-red-600",
    function: "text-purple-600",
    important: "text-red-600",
    inserted: "text-green-600",
    keyword: "text-purple-600",
    namespace: "text-red-600",
    number: "text-red-600",
    operator: "text-gray-700",
    prolog: "text-gray-600",
    property: "text-blue-600",
    punctuation: "text-gray-700",
    regex: "text-green-600",
    selector: "text-green-600",
    string: "text-green-600",
    symbol: "text-red-600",
    tag: "text-red-600",
    url: "text-blue-600",
    variable: "text-red-600",
  },
  link: "text-accent underline hover:text-accent/80",
  table: "border-collapse border border-border",
  tableCell: "border border-border p-2",
  tableCellHeader: "border border-border p-2 bg-muted font-semibold",
};

// Font options for the editor
const FONT_OPTIONS = [
  { value: "font-serif", label: "Open Sans", family: "Open Sans" },
  { value: "font-sans", label: "Work Sans", family: "Work Sans" },
  { value: "font-mono", label: "Courier New", family: "Courier New" },
  { value: "font-georgia", label: "Georgia", family: "Georgia" },
  { value: "font-times", label: "Times New Roman", family: "Times New Roman" },
];

// Font size options
const FONT_SIZE_OPTIONS = [
  { value: "12", label: "12" },
  { value: "14", label: "14" },
  { value: "16", label: "16" },
  { value: "18", label: "18" },
  { value: "20", label: "20" },
  { value: "24", label: "24" },
  { value: "32", label: "32" },
];

// ToolbarPlugin component with functional buttons
function ToolbarPlugin({
  selectedFont,
  setSelectedFont,
  fontSize,
  setFontSize,
  onCopy,
  onDownload,
}: {
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<
    "left" | "center" | "right" | "justify"
  >("left");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementFormat = element.getFormat();
      if (
        typeof elementFormat === "string" &&
        ["left", "center", "right", "justify"].includes(elementFormat)
      ) {
        setAlignment(elementFormat as "left" | "center" | "right" | "justify");
      } else {
        setAlignment("left");
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1
    );
  }, [editor, updateToolbar]);

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  };

  const formatAlignLeft = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
  };

  const formatAlignCenter = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
  };

  const formatAlignRight = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
  };

  const insertBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const insertNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const downloadAsPDF = useCallback(() => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = root
        .getChildren()
        .map((node) => {
          const element = document.createElement("div");
          element.textContent = node.getTextContent();
          return element.outerHTML;
        })
        .join("");

      // @ts-expect-error html2pdf.js may not have proper TypeScript declarations
      import("html2pdf.js")
        .then((html2pdf) => {
          const opt = {
            margin: 1,
            filename: "note.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
          };

          const editorElement = document.querySelector(
            '[contenteditable="true"]'
          );
          if (editorElement) {
            html2pdf.default().set(opt).from(editorElement).save();
          }
        })
        .catch(() => {
          const blob = new Blob([textContent], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "note.txt";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
    });
  }, [editor]);

  const increaseFontSize = () => {
    const currentSize = Number.parseInt(fontSize);
    const sizes = FONT_SIZE_OPTIONS.map((s) => Number.parseInt(s.value));
    const currentIndex = sizes.indexOf(currentSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1].toString());
    }
  };

  const decreaseFontSize = () => {
    const currentSize = Number.parseInt(fontSize);
    const sizes = FONT_SIZE_OPTIONS.map((s) => Number.parseInt(s.value));
    const currentIndex = sizes.indexOf(currentSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1].toString());
    }
  };

  return (
    <div className="border-b border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-40 justify-between">
              {FONT_OPTIONS.find((f) => f.value === selectedFont)?.label ||
                "Select Font"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {FONT_OPTIONS.map((font) => (
              <DropdownMenuItem
                key={font.value}
                onClick={() => setSelectedFont(font.value)}
              >
                <span className={font.value}>{font.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={decreaseFontSize}>
            <Minus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-16 justify-center">
                {fontSize}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FONT_SIZE_OPTIONS.map((size) => (
                <DropdownMenuItem
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                >
                  {size.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={increaseFontSize}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant={isBold ? "default" : "outline"}
          size="sm"
          onClick={formatBold}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={isItalic ? "default" : "outline"}
          size="sm"
          onClick={formatItalic}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={isUnderline ? "default" : "outline"}
          size="sm"
          onClick={formatUnderline}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Type className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant={alignment === "left" ? "default" : "outline"}
          size="sm"
          onClick={formatAlignLeft}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={alignment === "center" ? "default" : "outline"}
          size="sm"
          onClick={formatAlignCenter}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={alignment === "right" ? "default" : "outline"}
          size="sm"
          onClick={formatAlignRight}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="outline" size="sm" onClick={insertBulletList}>
          <List className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={insertNumberedList}>
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm">
          <Link className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Table className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          title="Copy Note Content"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            try {
              downloadAsPDF();
            } catch (error) {
              console.error(
                "PDF download failed, falling back to text download:",
                error
              );
              onDownload();
            }
          }}
          title="Download as PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ViewNote({ note }: ViewNoteProps) {
  const [selectedFont, setSelectedFont] = useState("font-serif");
  const [fontSize, setFontSize] = useState("16");

  // Initial editor configuration with note content
  const initialConfig = {
    namespace: "NoteViewer",
    theme,
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    editorState: () =>
      $convertFromMarkdownString(
        note.content || "# No Content\n\nThis note has no content.",
        TRANSFORMERS
      ),
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  const handleCopy = async () => {
    if (note?.content) {
      await navigator.clipboard.writeText(note.content);
      toast("Note content copied to clipboard.");
    }
  };

  const handleDownload = () => {
    if (note) {
      const element = document.createElement("a");
      const file = new Blob([note.content || ""], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${note.title || "note"}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-sans font-bold text-foreground mb-2">
          {note.title}
        </h1>
        <p className="text-muted-foreground">
          Last updated:{" "}
          {formatDate(
            note.updatedAt instanceof Date
              ? note.updatedAt.toISOString()
              : note.updatedAt
          )}
        </p>
      </div>

      <Card className="border border-border shadow-sm">
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
            fontSize={fontSize}
            setFontSize={setFontSize}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />

          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={`min-h-[500px] p-6 outline-none resize-none overflow-hidden ${selectedFont}`}
                  style={{ fontSize: `${fontSize}px` }}
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <LinkPlugin />
            <ListPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          </div>
        </LexicalComposer>
      </Card>
    </div>
  );
}
