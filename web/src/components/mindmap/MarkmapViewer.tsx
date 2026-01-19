"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ZoomIn,ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface MarkmapViewerProps {
  markdownContent: string;
  title: string;
}

const transformer = new Transformer();

function applyThemeColors(svg: SVGSVGElement, isDark: boolean) {
  const textColor = isDark ? '#ffffff' : '#000000';
  const linkColor = isDark ? '#888888' : '#555555';

  const foreignObjects = svg.querySelectorAll('foreignObject');
  foreignObjects.forEach((foreignObject) => {
    const divElements = foreignObject.querySelectorAll('div');
    divElements.forEach((div) => {
      (div as HTMLElement).style.color = textColor;
    });
  });

  const pathElements = svg.querySelectorAll('path');
  pathElements.forEach((path) => {
    (path as SVGPathElement).style.stroke = linkColor;
  });
}

export function MarkmapViewer({ markdownContent, title }: MarkmapViewerProps) {
  const [value] = useState(markdownContent);
  const refSvg = useRef<SVGSVGElement>(null);
  const refMm = useRef<Markmap | null>(null);
  const { resolvedTheme } = useTheme();
  const colorAppliedRef = useRef(false);
  const [currentScale, setCurrentScale] = useState(1);

  const isDark = resolvedTheme === 'dark';

  const applyColors = useCallback(() => {
    if (!refSvg.current) return;

    requestAnimationFrame(() => {
      if (refSvg.current) {
        applyThemeColors(refSvg.current, isDark);
      }
    });
  }, [isDark]);

  useEffect(() => {
    if (refMm.current || !refSvg.current) return;

    const mm = Markmap.create(refSvg.current, {
      duration: 500,
      maxWidth: 400,
      paddingX: 20,
      spacingHorizontal: 100,
      spacingVertical: 20,
      pan: true,
      zoom: true,
    });

    refMm.current = mm;

    const { root } = transformer.transform(value);
    mm.setData(root);

    // Wait for rendering, then center on the content at 100% zoom
    setTimeout(() => {
      if (refSvg.current && mm) {
        // Find the main <g> element that contains all the mindmap content
        const mainGroup = refSvg.current.querySelector('g[transform]');

        if (mainGroup) {
          // Get the bounding box of the content
          const bbox = (mainGroup as SVGGraphicsElement).getBBox();
          const svgRect = refSvg.current.getBoundingClientRect();

          // Calculate the center of the SVG viewport
          const svgCenterX = svgRect.width / 1;
          const svgCenterY = svgRect.height / 1;

          // Calculate the center of the content at scale 1 (100% zoom)
          const contentCenterX = bbox.x + bbox.width / 1;
          const contentCenterY = bbox.y + bbox.height / 1;

          // Calculate the translation needed to center the content
          const translateX = svgCenterX - contentCenterX;
          const translateY = svgCenterY - contentCenterY;

          // Force scale to 1 (100% zoom, no automatic scaling)
          mainGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(1)`);
        }
      }

      applyColors();
      colorAppliedRef.current = true;
    }, 100);

    return () => {
      if (refMm.current) {
        refMm.current.destroy();
        refMm.current = null;
      }
    };
  }, []);


  useEffect(() => {
    if (!colorAppliedRef.current || !refSvg.current) return;

    const timeoutId = setTimeout(() => {
      applyColors();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [isDark, applyColors]);

  const handleZoomIn = () => {
    if (!refSvg.current) return;
    const mainGroup = refSvg.current.querySelector('g[transform]');
    if (mainGroup) {
      const transform = mainGroup.getAttribute('transform') || '';
      const match = transform.match(/scale\(([\d.]+)\)/);
      const currentScaleValue = match ? parseFloat(match[1]) : 1;
      const newScale = Math.min(currentScaleValue * 1.25, 3);

      const newTransform = transform.replace(/scale\(([\d.]+)\)/, `scale(${newScale})`);
      mainGroup.setAttribute('transform', newTransform);
      setCurrentScale(newScale);
    }
  };

  const handleZoomOut = () => {
    if (!refSvg.current) return;
    const mainGroup = refSvg.current.querySelector('g[transform]');
    if (mainGroup) {
      const transform = mainGroup.getAttribute('transform') || '';
      const match = transform.match(/scale\(([\d.]+)\)/);
      const currentScaleValue = match ? parseFloat(match[1]) : 1;
      const newScale = Math.max(currentScaleValue * 0.8, 0.3);

      const newTransform = transform.replace(/scale\(([\d.]+)\)/, `scale(${newScale})`);
      mainGroup.setAttribute('transform', newTransform);
      setCurrentScale(newScale);
    }
  };

  const handleSaveAsImage = async () => {
    if (!refSvg.current) {
      toast.error('No mindmap to download');
      return;
    }

    try {
      const svgElement = refSvg.current;
      const mainGroup = svgElement.querySelector('g[transform]') as SVGGraphicsElement;
      
      if (!mainGroup) {
        toast.error('No mindmap content found');
        return;
      }

      // Get the bounding box of all content
      const bbox = mainGroup.getBBox();
      
      // Add generous padding
      const padding = 100;
      const contentWidth = bbox.width + (padding * 2);
      const contentHeight = bbox.height + (padding * 2);
      
      // Create a new SVG with proper dimensions
      const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      exportSvg.setAttribute('width', String(contentWidth));
      exportSvg.setAttribute('height', String(contentHeight));
      exportSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${contentWidth} ${contentHeight}`);
      exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Add background
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', String(bbox.x - padding));
      bgRect.setAttribute('y', String(bbox.y - padding));
      bgRect.setAttribute('width', String(contentWidth));
      bgRect.setAttribute('height', String(contentHeight));
      bgRect.setAttribute('fill', isDark ? '#1a1a2e' : '#ffffff');
      exportSvg.appendChild(bgRect);
      
      // Clone the main group (without transform)
      const clonedGroup = mainGroup.cloneNode(true) as SVGGElement;
      // Remove the transform to show content at original position
      clonedGroup.removeAttribute('transform');
      
      // Convert all foreignObject elements to text elements
      const foreignObjects = clonedGroup.querySelectorAll('foreignObject');
      foreignObjects.forEach((fo) => {
        const foElement = fo as SVGForeignObjectElement;
        const x = parseFloat(foElement.getAttribute('x') || '0');
        const y = parseFloat(foElement.getAttribute('y') || '0');
        const width = parseFloat(foElement.getAttribute('width') || '0');
        const textContent = foElement.textContent?.trim() || '';

        // Create a text element
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', String(x + 5)); // Small offset for padding
        textElement.setAttribute('y', String(y + 16)); // Adjust for baseline
        textElement.setAttribute('fill', isDark ? '#ffffff' : '#000000');
        textElement.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
        textElement.setAttribute('font-size', '14px');
        textElement.setAttribute('font-weight', '400');
        
        // Handle text wrapping for long content
        if (textContent.length > 30 && width > 0) {
          const words = textContent.split(' ');
          let line = '';
          let lineNumber = 0;
          const lineHeight = 18;
          
          words.forEach((word, i) => {
            const testLine = line + word + ' ';
            if (testLine.length > 30 && line.length > 0) {
              const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
              tspan.setAttribute('x', String(x + 5));
              tspan.setAttribute('dy', lineNumber === 0 ? '0' : String(lineHeight));
              tspan.textContent = line.trim();
              textElement.appendChild(tspan);
              line = word + ' ';
              lineNumber++;
            } else {
              line = testLine;
            }
          });
          
          // Add remaining text
          if (line.trim().length > 0) {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.setAttribute('x', String(x + 5));
            tspan.setAttribute('dy', lineNumber === 0 ? '0' : String(lineHeight));
            tspan.textContent = line.trim();
            textElement.appendChild(tspan);
          }
        } else {
          textElement.textContent = textContent;
        }

        // Replace foreignObject with text element
        foElement.parentNode?.replaceChild(textElement, foElement);
      });
      
      exportSvg.appendChild(clonedGroup);
      
      // Apply theme colors to paths and fix stroke width
      const paths = exportSvg.querySelectorAll('path');
      paths.forEach((path) => {
        const pathElement = path as SVGPathElement;
        pathElement.setAttribute('stroke', isDark ? '#888888' : '#999999');
        pathElement.setAttribute('stroke-width', '1.5');
        pathElement.setAttribute('fill', 'none');
      });
      
      // Apply colors to circles (node markers)
      const circles = exportSvg.querySelectorAll('circle');
      circles.forEach((circle) => {
        const circleElement = circle as SVGCircleElement;
        // Keep existing fill color but ensure stroke is visible
        if (!circleElement.getAttribute('fill') || circleElement.getAttribute('fill') === 'none') {
          circleElement.setAttribute('fill', isDark ? '#888888' : '#999999');
        }
      });
      
      // Serialize the SVG
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(exportSvg);
      
      // Add XML declaration and ensure proper encoding
      svgString = '<?xml version="1.0" encoding="UTF-8"?>' + svgString;
      
      // Create image from SVG using data URL
      const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      
      const img = new Image();
      img.onload = () => {
        // Create canvas with high resolution
        const canvas = document.createElement('canvas');
        const scale = 2; // 2x for retina displays
        
        canvas.width = contentWidth * scale;
        canvas.height = contentHeight * scale;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          toast.error('Canvas context not available');
          return;
        }
        
        // Scale context for high resolution
        ctx.scale(scale, scale);
        
        // Draw the image
        ctx.drawImage(img, 0, 0, contentWidth, contentHeight);
        
        // Convert to PNG and download
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to create image');
            return;
          }
          
          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(pngUrl);
          
          toast.success('Mindmap saved as image');
        }, 'image/png');
      };
      
      img.onerror = (error) => {
        console.error('Image load error:', error);
        // Fallback: download as SVG
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = svgUrl;
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(svgUrl);
        toast.success('Mindmap saved as SVG');
      };
      
      img.src = dataUrl;
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download mindmap');
    }
  };

  return (
    <div className="w-full">
      <div className="relative w-full border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-card dark:bg-card neomorphic" style={{ height: '700px' }}>
        <svg
          ref={refSvg}
          className="w-full h-full text-black dark:text-white "
          style={{ fontFamily: 'Arial, sans-serif' }}
        />

        {/* Floating Controls - Bottom Center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
          {/* Zoom Out Button */}
          <Button
            variant="outline"
            className="h-12 w-12 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
            onClick={handleZoomOut}
            disabled={currentScale <= 0.3}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-6 w-6 text-black dark:text-white" />
          </Button>

          {/* Save as Image Button */}
          <Button
            className="h-12 px-8 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 shadow-xl font-medium text-base"
            onClick={handleSaveAsImage}
          >
            Save as image
          </Button>

          {/* Zoom In Button */}
          <Button
            variant="outline"
            className="h-12 w-12 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
            onClick={handleZoomIn}
            disabled={currentScale >= 3}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-6 w-6 text-black dark:text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
