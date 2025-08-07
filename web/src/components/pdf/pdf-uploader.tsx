'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ParseResult {
  documentId?: string;
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
  // Always use these default options - save to database by default
  const options = {
    extractImages: false,
    saveToDatabase: true,
    saveToFiles: false,
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
      formData.append('saveToDatabase', options.saveToDatabase.toString());
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
        <div className="space-y-4">
          {result.documentId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">✓ Successfully Saved</CardTitle>
                <CardDescription>
                  Your PDF has been processed and saved to the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  <strong>Document ID:</strong> {result.documentId}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Pages:</strong> {result.pages}
                </p>
                {result.metadata?.title && (
                  <p className="text-sm text-gray-600">
                    <strong>Title:</strong> {String(result.metadata.title)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Extracted Text Preview</CardTitle>
              <CardDescription>
                First 1000 characters of the extracted content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-md text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
                {result.cleanText.length > 1000 
                  ? result.cleanText.substring(0, 1000) + '...'
                  : result.cleanText
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
