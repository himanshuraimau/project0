import React, { useState } from 'react';
import { useNotes } from '@/hooks/use-notes';
import { ProcessPDFResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/shared/mdx-renderer';
import { useRouter } from 'next/navigation';

interface PDFProcessorProps {
  onProcessComplete?: (result: ProcessPDFResult) => void;
}

export function PDFProcessor({ onProcessComplete }: PDFProcessorProps) {
  const { processPDFWithNotes, loading, error } = useNotes();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessPDFResult | null>(null);
  const [options, setOptions] = useState({
    extractImages: false,
    maxPages: undefined as number | undefined,
    generateNotes: true,
  });



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setResult(null);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    try {
      const processResult = await processPDFWithNotes(selectedFile, options);
      
      if (processResult) {
        setResult(processResult);
        onProcessComplete?.(processResult);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
        // Redirect to pricing page
        router.push('/pricing?reason=no-subscription');
        return;
      }
      // Other errors will be shown in the error state of the component
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF AI Note Generator</CardTitle>
          <CardDescription>
            Upload a PDF to extract text and generate structured AI-powered notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <label htmlFor="pdf-upload" className="block text-sm font-medium mb-2">
              Select PDF File
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Processing Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Processing Options</h4>
            
            <div className="flex items-center space-x-2">
              <input
                id="extract-images"
                type="checkbox"
                checked={options.extractImages}
                onChange={(e) => setOptions(prev => ({ ...prev, extractImages: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="extract-images" className="text-sm">
                Extract images from PDF
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="generate-notes"
                type="checkbox"
                checked={options.generateNotes}
                onChange={(e) => setOptions(prev => ({ ...prev, generateNotes: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="generate-notes" className="text-sm">
                Generate AI notes (recommended)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="max-pages" className="text-sm">
                Max pages to process:
              </label>
              <input
                id="max-pages"
                type="number"
                min="1"
                max="1000"
                placeholder="All pages"
                value={options.maxPages || ''}
                onChange={(e) => setOptions(prev => ({ 
                  ...prev, 
                  maxPages: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-24 px-2 py-1 border rounded"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleProcess} 
              disabled={!selectedFile || loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Process PDF & Generate Notes'}
            </Button>
            
            {selectedFile && (
              <Button 
                onClick={resetForm} 
                variant="outline"
                disabled={loading}
              >
                Reset
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Processing Results</span>
              <Badge variant="secondary">Success</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transcript Info */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Document Transcript</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {result.transcript.id}
                </div>
                <div>
                  <span className="font-medium">Pages:</span> {result.transcript.pages}
                </div>
                <div>
                  <span className="font-medium">Images:</span> {result.transcript.imageCount}
                </div>
                <div>
                  <span className="font-medium">Text Length:</span> {result.transcript.cleanText?.length || 0} chars
                </div>
              </div>
            </div>

            {/* AI Notes Info */}
            {result.note && (
              <div>
                <h4 className="text-sm font-semibold mb-2">AI-Generated Notes</h4>
                {'error' in result.note ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                      Note generation failed: {result.note.message}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-sm">Title:</span>
                      <p className="text-sm text-gray-600 mt-1">{result.note.title}</p>
                    </div>
                    <div>
                      <span className="font-medium text-sm">Content Preview:</span>
                      <div className="text-sm text-gray-600 mt-1 line-clamp-3">
                        <MarkdownRenderer 
                          content={result.note.content ? result.note.content.substring(0, 300) + '...' : 'No content available'} 
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-sm">Note ID:</span> {result.note.id}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons for Results */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (result.note && !('error' in result.note)) {
                    // Navigate to note view (you can implement this based on your routing)
                    console.log('Navigate to note:', result.note.id);
                  }
                }}
                disabled={'error' in (result.note || {})}
              >
                View Notes
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Navigate to transcript view
                  console.log('Navigate to transcript:', result.transcript.id);
                }}
              >
                View Transcript
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
