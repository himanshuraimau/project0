'use client';

import { useState, useEffect } from 'react';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  pages: number;
  createdAt: string;
  updatedAt: string;
}

interface DocumentWithContent extends Document {
  content: string;
  cleanContent: string;
  metadata: Record<string, unknown> | null;
  userId: string | null;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/documents');
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getDocument = async (id: string): Promise<DocumentWithContent | null> => {
    try {
      const response = await fetch(`/api/documents/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('Error fetching document:', err);
      return null;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      // Refresh the documents list
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    getDocument,
    deleteDocument,
  };
}
