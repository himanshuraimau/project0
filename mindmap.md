# Markmap - Markdown Mind Maps

This project uses Markmap to convert markdown into interactive, visual mind maps.

## Prompt for AI to Generate Markmap Markdown

Use this prompt when asking AI to generate mind maps:

---

**System Instruction:**

Generate a mind map in Markmap markdown format. Follow these rules strictly:

1. Use markdown heading syntax (# ## ### ####) to create hierarchy
2. # is the root node, ## for main branches, ### for sub-branches, etc.
3. Use bullet points (-) for list items under headings if needed
4. Keep it clear, organized, and logically structured
5. Use **bold** for emphasis and *italic* for secondary emphasis where appropriate
6. You can include links: [text](url)
7. You can add inline code: `code`
8. DO NOT use triple backticks or code blocks
9. Start directly with the markdown content

**Example Format:**

# Main Topic
## First Branch
### Sub-topic 1
- Detail point 1
- Detail point 2
### Sub-topic 2
## Second Branch
### Another sub-topic

**User Request:**
[Insert your specific mind map request here]

---

**Example Usage:**

"Generate a mind map about Microsoft Designer vs Canva comparing their features, pricing, and use cases"



## Implementation in this Project

This project uses Markmap to generate interactive mind maps from markdown content. The implementation consists of:

1. A MarkmapViewer component that renders markdown as a mind map
2. An API route that generates markdown mind maps using the AI SDK
3. A generator component that displays the mind map and provides controls

### MarkmapViewer Component

```tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Download, Copy, Code } from 'lucide-react';
import { toast } from 'sonner';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

interface MarkmapViewerProps {
  markdownContent: string;
  title: string;
}

export function MarkmapViewer({ markdownContent, title }: MarkmapViewerProps) {
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !markdownContent) return;
    
    const renderMarkmap = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (containerRef.current) {
          // Clear container first
          containerRef.current.innerHTML = '';
          
          // Create SVG element
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          containerRef.current.appendChild(svg);
          svgRef.current = svg;
          
          // Transform markdown to markmap data
          const transformer = new Transformer();
          const { root } = transformer.transform(markdownContent);
          
          // Create markmap
          const isDarkMode = document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;
            
          markmapRef.current = Markmap.create(svg, {
            duration: 500,
            maxWidth: 300,
            color: (node: any) => {
              const colors = isDarkMode 
                ? ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16']
                : ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#65a30d'];
              return colors[node.state.depth % colors.length];
            },
            paddingX: 16,
            spacingHorizontal: 80,
            spacingVertical: 10,
          });
          
          // Set data and fit to view
          markmapRef.current.setData(root);
          markmapRef.current.fit();
          
          // Apply styling based on theme
          svg.style.borderRadius = '8px';
          svg.style.padding = '30px';
          svg.style.boxShadow = isDarkMode
            ? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          svg.style.backgroundColor = isDarkMode ? '#0f172a' : '#ffffff';
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error rendering markmap:', err);
        let errorMessage = 'Failed to render mindmap. The markdown may be invalid.';
        
        if (err instanceof Error) {
          errorMessage = `Markmap error: ${err.message}`;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    };
    
    renderMarkmap();
  }, [markdownContent]);
  
  // Additional code for zooming, downloading, etc.
  // ...
}
```

### API Route

```typescript
// app/api/mindmap/generate/route.ts
export async function POST(req: NextRequest) {
  // Authentication and validation...
  
  // Generate mindmap using Markmap markdown format
  const prompt = `Generate a mind map in Markmap markdown format for this content:

Title: ${sourceTitle}
Content: ${sourceContent.substring(0, 1500)}

Follow these rules strictly:
1. Use markdown heading syntax (# ## ### ####) to create hierarchy
2. # is the root node (use the title), ## for main branches, ### for sub-branches, etc.
3. Use bullet points (-) for list items under headings if needed
4. Keep it clear, organized, and logically structured
5. Use **bold** for emphasis and *italic* for secondary emphasis where appropriate
6. Keep headings short (2-5 words max)
7. DO NOT use triple backticks or code blocks
8. Start directly with the markdown content

Generate ONLY the markdown content for the mind map:`;

  const result = await generateText({
    model: openai('gpt-4o'),
    prompt: prompt,
    temperature: 0.7,
  });

  let markdownContent = result.text.trim();
  
  // Clean up and format the markdown...
  
  // Store the markdown in the mermaidCode field
  const mindmap = await prisma.mindMap.upsert({
    where: { noteId: noteId },
    update: {
      title: `${note.title} - Mindmap`,
      mermaidCode: markdownContent,
      updatedAt: new Date(),
    },
    create: {
      title: `${note.title} - Mindmap`,
      mermaidCode: markdownContent,
      noteId: noteId,
      userId: userId,
    }
  });
}
```

## Dependencies

Required packages:
- markmap-lib: For transforming markdown to markmap data
- markmap-view: For rendering the interactive mind map
- d3: Required by markmap for rendering

## Features

- **Interactive Mind Maps**: Clickable, expandable/collapsible nodes
- **Zoom Controls**: Zoom in/out and reset zoom
- **Theme Aware**: Supports both light and dark modes
- **Export to SVG**: Download the mindmap as SVG
- **View Source**: Show/hide the markdown source code

## Tips for AI-Generated Mind Maps

1. **Keep it concise**: Short, clear node labels work best
2. **Limit depth**: 3-4 levels of hierarchy is optimal for readability
3. **Use formatting**: Bold and italic text helps highlight important points
4. **Add context**: Bullet points can provide additional context under headings
5. **Balance the tree**: Try to maintain a balanced structure