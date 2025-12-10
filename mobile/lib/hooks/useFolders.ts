import { useState, useCallback } from 'react';
import { foldersApi } from '@/lib/api';
import type { Folder, FolderWithCount, CreateFolderRequest, UpdateFolderRequest } from '@/lib/api/types';

interface UseFoldersReturn {
  folders: FolderWithCount[];
  selectedFolder: Folder | null;
  loading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  fetchFolder: (id: string, includeNotes?: boolean) => Promise<Folder | null>;
  createFolder: (data: CreateFolderRequest) => Promise<Folder | null>;
  updateFolder: (id: string, data: UpdateFolderRequest) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  moveNote: (noteId: string, folderId: string | null) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Custom hook for managing folders
 * Provides state management and API methods for folder operations
 */
export const useFolders = (): UseFoldersReturn => {
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all folders for the user
   */
  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await foldersApi.getFolders();
      setFolders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch folders';
      setError(message);
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a specific folder by ID
   */
  const fetchFolder = useCallback(async (id: string, includeNotes: boolean = true): Promise<Folder | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await foldersApi.getFolderById(id, includeNotes);
      setSelectedFolder(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch folder';
      setError(message);
      console.error('Error fetching folder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new folder
   */
  const createFolder = useCallback(async (data: CreateFolderRequest): Promise<Folder | null> => {
    setLoading(true);
    setError(null);
    try {
      const newFolder = await foldersApi.createFolder(data);
      // Refresh folders list
      await fetchFolders();
      return newFolder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create folder';
      setError(message);
      console.error('Error creating folder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFolders]);

  /**
   * Update an existing folder
   */
  const updateFolder = useCallback(async (id: string, data: UpdateFolderRequest): Promise<Folder | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedFolder = await foldersApi.updateFolder(id, data);
      // Refresh folders list
      await fetchFolders();
      return updatedFolder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update folder';
      setError(message);
      console.error('Error updating folder:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFolders]);

  /**
   * Delete a folder
   * Notes in the folder will be moved to uncategorized
   */
  const deleteFolder = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await foldersApi.deleteFolder(id);
      // Refresh folders list
      await fetchFolders();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete folder';
      setError(message);
      console.error('Error deleting folder:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchFolders]);

  /**
   * Move a note to a different folder
   */
  const moveNote = useCallback(async (noteId: string, folderId: string | null): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await foldersApi.moveNoteToFolder(noteId, folderId);
      // Refresh folders list to update note counts
      await fetchFolders();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move note';
      setError(message);
      console.error('Error moving note:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchFolders]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    folders,
    selectedFolder,
    loading,
    error,
    fetchFolders,
    fetchFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    moveNote,
    clearError,
  };
};
