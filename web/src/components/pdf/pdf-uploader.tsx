'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ParseResult {
  text: string;
  cleanText: string;
  pages: number;
  metadata: Record<string, unknown>;
  imageCount: number;
  extractedFiles?: {
    textFile?: string;
    imagesDir?: string;
  };
}

export function PDFUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Always use these default options - no user configuration needed
  const options = {
    extractImages: false,
    saveToFiles: true,
    maxPages: 0,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('extractImages', options.extractImages.toString());
      formData.append('saveToFiles', options.saveToFiles.toString());
      if (options.maxPages > 0) {
        formData.append('maxPages', options.maxPages.toString());
      }

      const response = await fetch('/api/pdf/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to parse PDF');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF Parser</CardTitle>
          <CardDescription>
            Upload a PDF file to extract all text and generate AI-powered content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? 'Processing...' : 'Parse PDF'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Converted Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-md text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
              {result.cleanText}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
