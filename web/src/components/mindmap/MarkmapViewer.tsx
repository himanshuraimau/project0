"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Markmap } from 'markmap-view';
import { Transformer } from 'markmap-lib';
import { Toolbar } from 'markmap-toolbar';
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

export function MarkmapViewer({ markdownContent, title }: MarkmapViewerProps) {
  const [value] = useState(markdownContent);
  const refSvg = useRef<SVGSVGElement>(null);
  const refMm = useRef<Markmap | null>(null);
  const refToolbar = useRef<HTMLDivElement>(null);

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
  }, [refMm.current, value]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      
      <div className="relative w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-900" style={{ height: '700px' }}>
        <svg 
          ref={refSvg} 
          className="w-full h-full"
          style={{ fontFamily: 'Arial, sans-serif' }}
        />
        <div 
          ref={refToolbar} 
          className="absolute bottom-4 right-4"
        />
      </div>
    </div>
  );
}
