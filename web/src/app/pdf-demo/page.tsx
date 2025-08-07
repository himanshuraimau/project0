'use client';

import { PDFProcessor, NotesViewer } from '@/components/pdf';
import { ProcessPDFResult } from '@/hooks/use-notes';
import { useState } from 'react';

export default function PDFNotesDemo() {
  const [currentResult, setCurrentResult] = useState<ProcessPDFResult | null>(null);

  const handleProcessComplete = (result: ProcessPDFResult) => {
    setCurrentResult(result);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF AI Note Generator
          </h1>
          <p className="text-gray-600">
            Upload a PDF document to automatically extract text and generate structured AI-powered notes
          </p>
        </div>

        {/* PDF Processor */}
        <PDFProcessor onProcessComplete={handleProcessComplete} />

        {/* Show notes for the current processed document */}
        {currentResult?.transcript && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Generated Notes</h2>
            <NotesViewer transcriptId={currentResult.transcript.id} />
          </div>
        )}

        {/* Show all user notes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Your Notes</h2>
          <NotesViewer />
        </div>
      </div>
    </div>
  );
}
