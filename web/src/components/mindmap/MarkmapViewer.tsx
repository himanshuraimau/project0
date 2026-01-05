"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { useTheme } from 'next-themes';

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

  return (
    <div className="w-full">
      <div className="relative w-full border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-card dark:bg-card neomorphic" style={{ height: '700px' }}>
        <svg
          ref={refSvg}
          className="w-full h-full text-black dark:text-white "
          style={{ fontFamily: 'Arial, sans-serif' }}
        />
      </div>
    </div>
  );
}
