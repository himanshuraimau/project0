import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface MindMap {
  id: string;
  title: string;
  mermaidCode: string;
  noteId: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useMindmap() {
  const [mindmap, setMindmap] = useState<MindMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMindmap = useCallback(async (noteId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mindmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate mindmap');
      }

      if (data.success) {
        setMindmap(data.data);
        toast.success('Mindmap generated successfully!');
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to generate mindmap');
      }
    } catch (error) {
      console.error('Error generating mindmap:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate mindmap';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMindmap = useCallback(async (noteId: string) => {
    try {
      const response = await fetch(`/api/mindmap/${noteId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMindmap(data.data);
          return [data.data];
        }
      }
      // If mindmap doesn't exist, return empty array
      setMindmap(null);
      return [];
    } catch (error) {
      console.error('Error fetching mindmap:', error);
      setMindmap(null);
      return [];
    }
  }, []);

  const deleteMindmap = useCallback(async (noteId: string) => {
    try {
      const response = await fetch(`/api/mindmap/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete mindmap');
      }

      setMindmap(null);
      toast.success('Mindmap deleted successfully');
    } catch (error) {
      console.error('Error deleting mindmap:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete mindmap';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  return {
    mindmap,
    loading,
    error,
    generateMindmap,
    getMindmap,
    deleteMindmap,
  };
}
