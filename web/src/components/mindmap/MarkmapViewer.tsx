"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { Toolbar } from 'markmap-toolbar';
import { useTheme } from 'next-themes';
import 'markmap-toolbar/dist/style.css';

interface MarkmapViewerProps {
  markdownContent: string;
  title: string;
}

const transformer = new Transformer();

function renderToolbar(mm: Markmap, wrapper: HTMLElement | null) {
  if (!wrapper) return;

  while (wrapper?.firstChild) wrapper.firstChild.remove();

  if (mm && wrapper) {
    const toolbar = new Toolbar();
    toolbar.attach(mm);
    toolbar.setItems(Toolbar.defaultItems);
    wrapper.append(toolbar.render());
  }
}

// Helper function to apply theme colors to the SVG elements
function applyThemeColors(svg: SVGSVGElement, isDark: boolean) {
  const textColor = isDark ? '#ffffff' : '#000000';
  const linkColor = isDark ? '#888888' : '#555555';
  const foreignObjects = svg.querySelectorAll('foreignObject');
  foreignObjects.forEach((foreignObject) => {
    const divElements = foreignObject.querySelectorAll('div');
    divElements.forEach((div) => {
      div.style.color = textColor;
    });
  });

  // Apply colors to all path elements (the connecting lines)
  const pathElements = svg.querySelectorAll('path');
  pathElements.forEach((path) => {
    path.style.stroke = linkColor;
  });
}

export function MarkmapViewer({ markdownContent, title }: MarkmapViewerProps) {
  const [value] = useState(markdownContent);
  const refSvg = useRef<SVGSVGElement>(null);
  const refMm = useRef<Markmap | null>(null);
  const refToolbar = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();

  // Determine if we're in dark mode
  const isDark = resolvedTheme === 'dark' || theme === 'dark';

  useEffect(() => {
    if (refMm.current || !refSvg.current) return;

    const mm = Markmap.create(refSvg.current, {
      duration: 500,
      maxWidth: 400,
      paddingX: 20,
      spacingHorizontal: 100,
      spacingVertical: 20,
    });

    refMm.current = mm;
    renderToolbar(refMm.current, refToolbar.current);
  }, [refSvg.current]);

  useEffect(() => {
    const mm = refMm.current;
    if (!mm) return;

    const { root } = transformer.transform(value);
    mm.setData(root);
    mm.fit();

    // Wait for the SVG to be fully rendered before applying colors
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (refSvg.current) {
          applyThemeColors(refSvg.current, isDark);
        }
      }, 100); // Small delay to ensure markmap has finished rendering
    });
  }, [refMm.current, value, isDark]);

  // Apply theme colors whenever the theme changes
  useEffect(() => {
    if (!refSvg.current) return;

    // Wait for any pending renders to complete
    const applyColors = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (refSvg.current) {
            applyThemeColors(refSvg.current, isDark);
          }
        }, 50);
      });
    };

    applyColors();
  }, [isDark]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-medium">
          {title.replace(/- Mindmap/i, '').trim()}
        </h2>
      </div>


      <div className="relative w-full borde border-gray-200 dark:border-gray-700 rounded-lg bg-card dark:bg-card" style={{ height: '700px' }}>
        <svg
          ref={refSvg}
          className="w-full h-full text-black dark:text-white "
          style={{ fontFamily: 'Arial, sans-serif' }}
        />
      </div>
    </div>
  );
}
