"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocuments } from "@/hooks/use-documents";

interface DocumentWithContent {
  id: string;
  fileName: string;
  originalName: string;
  content: string;
  cleanContent: string;
  pages: number;
  metadata: Record<string, unknown> | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function DocumentsList() {
  const { documents, loading, error, deleteDocument, getDocument } =
    useDocuments();
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentWithContent | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loadingDocument, setLoadingDocument] = useState(false);

  const handleViewDocument = async (id: string) => {
    setLoadingDocument(true);
    const document = await getDocument(id);
    setSelectedDocument(document);
    setLoadingDocument(false);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      await deleteDocument(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your documents...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading documents: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
          <CardDescription>
            {documents.length === 0
              ? "No documents uploaded yet"
              : `${documents.length} document${
                  documents.length === 1 ? "" : "s"
                } saved in database`}
          </CardDescription>
        </CardHeader>
      </Card>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Upload your first PDF to get started!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-sm truncate">
                        {document.originalName}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {document.pages} pages
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Uploaded: {formatDate(document.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400">
                      ID: {document.id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocument(document.id)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDelete(document.id, document.originalName)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument ? selectedDocument.originalName : "Document"}
            </DialogTitle>
          </DialogHeader>
          {loadingDocument ? (
            <div className="p-6 text-center">Loading document content...</div>
          ) : selectedDocument ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Pages:</strong> {selectedDocument.pages}
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {formatDate(selectedDocument.createdAt)}
                </div>
              </div>

              {selectedDocument.metadata?.title && (
                <div className="text-sm">
                  <strong>Title:</strong>{" "}
                  {String(selectedDocument.metadata.title)}
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Content:</h4>
                <div className="p-4 bg-gray-50 rounded-md text-sm max-h-96 overflow-y-auto whitespace-pre-wrap border">
                  {selectedDocument.cleanContent}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-red-500">
              Failed to load document content
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
