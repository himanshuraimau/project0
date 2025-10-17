"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Type,
  Minus,
  Plus,
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
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getRoot,
  FORMAT_ELEMENT_COMMAND,
  EditorState,
  TextNode,
  $createTextNode,
  $isTextNode,
} from "lexical";
import { $convertToMarkdownString } from "@lexical/markdown";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { useCallback, useEffect } from "react";

interface LexicalViewerProps {
  content: string;
  title?: string;
  showToolbar?: boolean;
  className?: string;
  contentClassName?: string;
  minHeight?: string;
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  isEditable?: boolean;
}

// Lexical theme configuration
const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "text-muted-foreground text-base",
  paragraph: "mb-4 leading-7 text-base",
  quote: "border-l-4 border-accent pl-6 py-4 my-6 italic text-muted-foreground bg-accent/5 rounded-r-lg",
  heading: {
    h1: "text-4xl font-bold mb-6 mt-8 pb-4 border-b border-border tracking-tight",
    h2: "text-3xl font-bold mb-5 mt-7 pb-3 border-b border-border tracking-tight",
    h3: "text-2xl font-semibold mb-4 mt-6 tracking-tight",
    h4: "text-xl font-semibold mb-3 mt-5 tracking-tight",
    h5: "text-lg font-semibold mb-2 mt-4 tracking-tight",
    h6: "text-base font-semibold mb-2 mt-3 tracking-tight",
  },
  list: {
    nested: {
      listitem: "list-none ml-4",
    },
    ol: "list-decimal ml-6 my-6 space-y-2",
    ul: "list-disc ml-6 my-6 space-y-2",
    listitem: "leading-7 text-base pl-2",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-muted px-2 py-1 rounded text-sm font-mono before:content-none after:content-none border border-border/50",
  },
  code: "block bg-muted border border-border/50 p-6 rounded-xl my-6 font-mono text-sm overflow-x-auto leading-relaxed",
  codeHighlight: {
    atrule: "text-purple-600 dark:text-purple-400",
    attr: "text-accent",
    boolean: "text-red-600 dark:text-red-400",
    builtin: "text-purple-600 dark:text-purple-400",
    cdata: "text-gray-600 dark:text-gray-400",
    char: "text-green-600 dark:text-green-400",
    class: "text-accent",
    "class-name": "text-accent",
    comment: "text-gray-500 dark:text-gray-400",
    constant: "text-red-600 dark:text-red-400",
    deleted: "text-red-600 dark:text-red-400",
    doctype: "text-gray-600 dark:text-gray-400",
    entity: "text-red-600 dark:text-red-400",
    function: "text-purple-600 dark:text-purple-400",
    important: "text-red-600 dark:text-red-400",
    inserted: "text-green-600 dark:text-green-400",
    keyword: "text-purple-600 dark:text-purple-400",
    namespace: "text-red-600 dark:text-red-400",
    number: "text-red-600 dark:text-red-400",
    operator: "text-gray-700 dark:text-gray-300",
    prolog: "text-gray-600 dark:text-gray-400",
    property: "text-accent",
    punctuation: "text-gray-700 dark:text-gray-300",
    regex: "text-green-600 dark:text-green-400",
    selector: "text-green-600 dark:text-green-400",
    string: "text-green-600 dark:text-green-400",
    symbol: "text-red-600 dark:text-red-400",
    tag: "text-red-600 dark:text-red-400",
    url: "text-accent underline",
    variable: "text-red-600 dark:text-red-400",
  },
  link: "text-primary underline hover:text-primary/80 font-medium transition-colors",
  table: "border-collapse border border-border rounded-lg my-6 overflow-hidden",
  tableCell: "border border-border p-3",
  tableCellHeader: "border border-border p-3 bg-muted font-semibold",
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
    editor.focus();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  const formatItalic = () => {
    editor.focus();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  };

  const formatUnderline = () => {
    editor.focus();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  };

  const formatAlignLeft = () => {
    editor.focus();
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
  };

  const formatAlignCenter = () => {
    editor.focus();
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
  };

  const formatAlignRight = () => {
    editor.focus();
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
  };

  const insertBulletList = () => {
    editor.focus();
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const insertNumberedList = () => {
    editor.focus();
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const applyFontFamily = (fontClass: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        const fontFamily = FONT_OPTIONS.find(f => f.value === fontClass)?.family || 'serif';
        
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            const writableNode = node.getWritable();
            const currentStyle = writableNode.getStyle() || '';
            // Remove existing font-family
            const styleWithoutFont = currentStyle.replace(/font-family:[^;]+;?/g, '').trim();
            const newStyle = styleWithoutFont ? `${styleWithoutFont}; font-family: ${fontFamily};` : `font-family: ${fontFamily};`;
            writableNode.setStyle(newStyle);
          }
        });
      }
    });
    setSelectedFont(fontClass);
  };

  const applyFontSize = (size: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            const writableNode = node.getWritable();
            const currentStyle = writableNode.getStyle() || '';
            // Remove existing font-size
            const styleWithoutSize = currentStyle.replace(/font-size:[^;]+;?/g, '').trim();
            const newStyle = styleWithoutSize ? `${styleWithoutSize}; font-size: ${size}px;` : `font-size: ${size}px;`;
            writableNode.setStyle(newStyle);
          }
        });
      }
    });
    setFontSize(size);
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
            filename: "content.pdf",
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
          a.download = "content.txt";
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
      const newSize = sizes[currentIndex + 1].toString();
      applyFontSize(newSize);
    }
  };

  const decreaseFontSize = () => {
    const currentSize = Number.parseInt(fontSize);
    const sizes = FONT_SIZE_OPTIONS.map((s) => Number.parseInt(s.value));
    const currentIndex = sizes.indexOf(currentSize);
    if (currentIndex > 0) {
      const newSize = sizes[currentIndex - 1].toString();
      applyFontSize(newSize);
    }
  };

  return (
    <div className=" bg-white dark:bg-stone-900 fixed top-20 z-50 rounded-lg p-3">
      <div className="flex flex-wrap justify-center items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-40 justify-between text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800">
              {FONT_OPTIONS.find((f) => f.value === selectedFont)?.label ||
                "Select Font"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {FONT_OPTIONS.map((font) => (
              <DropdownMenuItem
                key={font.value}
                onClick={() => applyFontFamily(font.value)}
              >
                <span className={font.value}>{font.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Button
            className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
            size="sm"
            onClick={decreaseFontSize}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-16 justify-center text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800">
                {fontSize}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FONT_SIZE_OPTIONS.map((size) => (
                <DropdownMenuItem
                  key={size.value}
                  onClick={() => applyFontSize(size.value)}
                >
                  {size.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
            size="sm"
            onClick={increaseFontSize}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-2.5" />

        <Button
          size="sm"
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          onClick={formatBold}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onClick={formatItalic}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onClick={formatUnderline}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Type className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-2.5" />

        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onClick={formatAlignLeft}
          onMouseDown={(e) => e.preventDefault()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onClick={formatAlignCenter}
          onMouseDown={(e) => e.preventDefault()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onClick={formatAlignRight}
          onMouseDown={(e) => e.preventDefault()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-2.5" />

        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onClick={insertBulletList}
          onMouseDown={(e) => e.preventDefault()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onClick={insertNumberedList}
          onMouseDown={(e) => e.preventDefault()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-stone-200 dark:bg-stone-700 mx-2.5" />

        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
          size="sm"
          onClick={onCopy}
          title="Copy Content"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          className="text-black hover:bg-stone-100 dark:hover:bg-stone-700 dark:text-white cursor-pointer bg-stone-50 dark:bg-stone-800"
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

export function LexicalViewer({
  content,
  title,
  showToolbar = true,
  className = "",
  contentClassName = "",
  onContentChange,
  onTitleChange,
  isEditable = false,
}: LexicalViewerProps) {
  const [selectedFont, setSelectedFont] = useState("font-serif");
  const [fontSize, setFontSize] = useState("15");

  // Handle content changes
  const handleEditorChange = useCallback((editorState: EditorState) => {
    if (onContentChange && isEditable) {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onContentChange(markdown);
      });
    }
  }, [onContentChange, isEditable]);

  // Initial editor configuration with content
  const initialConfig = {
    namespace: "ContentViewer",
    theme,
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    editorState: () =>
      $convertFromMarkdownString(
        content || "# No Content\n\nThis content has no text.",
        TRANSFORMERS
      ),
    editable: isEditable,
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
    if (content) {
      await navigator.clipboard.writeText(content);
      toast("Content copied to clipboard.");
    }
  };

  const handleDownload = () => {
    if (content) {
      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `${title || "content"}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <Card className={`border-none bg-transparent ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        {showToolbar && (
          <ToolbarPlugin
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
            fontSize={fontSize}
            setFontSize={setFontSize}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        )}

        <div className="relative mt-2">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={`p-6 outline-none ${contentClassName}`}
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
          {isEditable && onContentChange && (
            <OnChangePlugin onChange={handleEditorChange} />
          )}
        </div>
      </LexicalComposer>
    </Card>
  );
}
