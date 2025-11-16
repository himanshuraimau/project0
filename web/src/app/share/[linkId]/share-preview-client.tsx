"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, User, Eye, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { MDXRenderer } from "@/components/mdx-renderer";

interface SharePreviewClientProps {
  linkId: string;
  token: string;
}

export function SharePreviewClient({ linkId, token }: SharePreviewClientProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteData, setNoteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedNote();
  }, [linkId, token]);

  const fetchSharedNote = async () => {
    try {
      const response = await fetch(
        `/api/share/${linkId}?token=${encodeURIComponent(token)}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to load shared note");
      }

      const data = await response.json();
      setNoteData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/share/${linkId}?token=${token}`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/notes/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save note");
      }

      const data = await response.json();
      toast.success("Note saved to your account");

      router.push(`/notes/${data.data.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save note"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading shared note...</p>
      </div>
    );
  }

  if (error || !noteData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "Note not found"}</p>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="neomorphic rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {noteData.note.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Shared by {noteData.author.name}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {noteData.shareInfo.viewCount} views
                </span>
              </div>
            </div>
            <Button
              onClick={handleSaveNote}
              disabled={saving}
              className="neomorphic-button"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save to My Notes"}
            </Button>
          </div>

          {!isSignedIn && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-foreground">
                <strong>Sign in to save this note</strong> - You need an account to save notes
                to your workspace.
              </p>
            </div>
          )}
        </div>

        {/* Note Content */}
        <Card className="neomorphic border-0">
          <CardContent className="p-8">
            <MDXRenderer content={noteData.note.content} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
