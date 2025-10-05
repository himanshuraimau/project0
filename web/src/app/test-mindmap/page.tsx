"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

export default function TestMindmap() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Mindmap</h1>
      
      <div className="p-6 border rounded-lg bg-slate-50 dark:bg-slate-800">
        <pre className="whitespace-pre-wrap">
{`# Test Mindmap

## First Branch
### Sub-item 1
- Detail point
- Another detail

## Second Branch
### Sub-item 2
- More details
- Final point`}
        </pre>
      
        <Button className="mt-4">
          Test Button
        </Button>
      </div>
    </div>
  );
}