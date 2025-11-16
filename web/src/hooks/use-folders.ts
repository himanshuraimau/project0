"use client";

import { useState, useCallback } from "react";
import { FolderWithCount } from "@/lib/folder-service";

interface CreateFolderData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface UpdateFolderData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export function useFolders() {
  const [folders, setFolders] = useState<FolderWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch folders");
      }

      setFolders(data.data);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch folders";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFolder = useCallback(async (folderId: string, includeNotes = true) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/folders/${folderId}?includeNotes=${includeNotes}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch folder");
      }

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch folder";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (folderData: CreateFolderData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(folderData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || "Failed to create folder");
      }

      // Refresh folders list
      await getFolders();

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create folder";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getFolders]);

  const updateFolder = useCallback(
    async (folderId: string, folderData: UpdateFolderData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/folders/${folderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(folderData),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || data.message || "Failed to update folder");
        }

        // Refresh folders list
        await getFolders();

        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update folder";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getFolders]
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/folders/${folderId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || data.message || "Failed to delete folder");
        }

        // Refresh folders list
        await getFolders();

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete folder";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getFolders]
  );

  const moveNoteToFolder = useCallback(
    async (noteId: string, folderId: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/notes/${noteId}/move`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderId }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || data.message || "Failed to move note");
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to move note";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refreshFolders = useCallback(async () => {
    await getFolders();
  }, [getFolders]);

  return {
    folders,
    loading,
    error,
    getFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    moveNoteToFolder,
    refreshFolders,
  };
}
