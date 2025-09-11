"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Download, Copy, Code } from 'lucide-react';
import { toast } from 'sonner';

interface MindmapViewerProps {
  mermaidCode: string;
  title: string;
  onClose?: () => void;
}

export function MindmapViewer({ mermaidCode, title }: MindmapViewerProps) {
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid with better configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
        nodeSpacing: 100,
        rankSpacing: 100,
        diagramPadding: 20,
        wrappingWidth: 200,
      },
      themeVariables: {
        primaryColor: '#f0f9ff',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#3b82f6',
        lineColor: '#64748b',
        sectionBkgColor: '#f8fafc',
        altSectionBkgColor: '#e2e8f0',
        gridColor: '#e5e7eb',
        tertiaryColor: '#f1f5f9',
        background: '#ffffff',
        secondaryColor: '#e0f2fe',
        mainBkg: '#f0f9ff',
        secondBkg: '#e0f2fe',
        tertiaryTextColor: '#475569',
      },
      fontFamily: '"Inter", "system-ui", sans-serif',
    });

    const renderMermaidDiagram = async () => {
      if (!containerRef.current || !mermaidCode) return;

      setIsLoading(true);
      setError(null);

      try {
        // Clear container
        containerRef.current.innerHTML = '';

        // Generate unique ID for this render
        const id = `mindmap-${Date.now()}`;
        
        // Create a temporary div element for mermaid to render into
        const element = document.createElement('div');
        element.id = id;
        containerRef.current.appendChild(element);

        // Render the mermaid diagram
        const { svg } = await mermaid.render(id, mermaidCode);
        
        // Replace the temporary div with the rendered SVG
        containerRef.current.innerHTML = svg;
        
        // Add some styling to the SVG
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = 'auto';
          svgElement.style.minHeight = '500px';
          svgElement.style.maxWidth = '100%';
          svgElement.style.transform = `scale(${scale})`;
          svgElement.style.transformOrigin = 'center center';
          svgElement.style.backgroundColor = '#ffffff';
          svgElement.style.borderRadius = '8px';
          
          // Add padding and better styling
          svgElement.style.padding = '30px';
          svgElement.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          
          // Improve text styling
          const textElements = svgElement.querySelectorAll('text');
          textElements.forEach((textEl) => {
            textEl.style.fontFamily = '"Inter", "system-ui", sans-serif';
            textEl.style.fontSize = '14px';
            textEl.style.fontWeight = '500';
          });
          
          // Style the nodes better
          const rectElements = svgElement.querySelectorAll('rect');
          rectElements.forEach((rectEl) => {
            rectEl.style.strokeWidth = '2px';
            rectEl.style.rx = '6px';
            rectEl.style.ry = '6px';
          });
          
          // Style the paths (connections)
          const pathElements = svgElement.querySelectorAll('path');
          pathElements.forEach((pathEl) => {
            pathEl.style.strokeWidth = '2px';
            pathEl.style.stroke = '#64748b';
          });
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error rendering mermaid:', err);
        setError('Failed to render mindmap. The diagram syntax may be invalid.');
        setIsLoading(false);
      }
    };

    renderMermaidDiagram();
  }, [mermaidCode, scale]);

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.2, 2);
    setScale(newScale);
    updateSvgScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    updateSvgScale(newScale);
  };

  const handleResetZoom = () => {
    setScale(1);
    updateSvgScale(1);
  };

  const updateSvgScale = (newScale: number) => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (svgElement) {
      svgElement.style.transform = `scale(${newScale})`;
    }
  };

  const handleDownload = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) {
      toast.error('No mindmap to download');
      return;
    }

    try {
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      
      // Create download link
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Mindmap downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download mindmap');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      toast.success('Mermaid code copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy code');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            disabled={scale === 1}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
          >
            <Copy className="h-4 w-4" />
            Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            <Code className="h-4 w-4" />
            {showCode ? 'Hide' : 'Show'} Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            SVG
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCode && (
          <div className="mb-4">
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-60">
              <pre className="text-sm">
                <code>{mermaidCode}</code>
              </pre>
            </div>
          </div>
        )}
        <div className="relative">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Rendering mindmap...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-red-600">
                <p className="font-medium">Error rendering mindmap</p>
                <p className="text-sm mt-1">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-3"
                  size="sm"
                >
                  Reload Page
                </Button>
              </div>
            </div>
          )}
          
          <div 
            ref={containerRef}
            className={`w-full overflow-auto border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 ${isLoading || error ? 'hidden' : ''}`}
            style={{ minHeight: '600px', maxHeight: '80vh' }}
          />
          
          {scale !== 1 && !isLoading && !error && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {Math.round(scale * 100)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
