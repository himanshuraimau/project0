"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link2, Eye } from "lucide-react";
import { toast } from "sonner";

interface ShareLinkDialogProps {
  noteId: string;
  noteTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareLinkDialog({
  noteId,
  noteTitle,
  open,
  onOpenChange,
}: ShareLinkDialogProps) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    if (open) {
      fetchOrCreateShareLink();
    }
  }, [open, noteId]);

  const fetchOrCreateShareLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notes/${noteId}/share-link`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create share link");
      }

      const data = await response.json();
      setShareUrl(data.data.shareUrl);
      setViewCount(data.data.viewCount);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create share link"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-accent" />
            Share Note
          </DialogTitle>
          <DialogDescription>
            Share "{noteTitle}" with anyone via link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Share URL Input */}
          <div className="space-y-2">
            <Label htmlFor="share-url">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="flex-1 neomorphic"
                placeholder={loading ? "Generating link..." : ""}
              />
              <Button
                size="icon"
                onClick={copyToClipboard}
                disabled={!shareUrl || loading}
                className="neomorphic-button"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Stats */}
          {shareUrl && (
            <div className="neomorphic p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>Views: {viewCount}</span>
                </div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Anyone with this link can view the note</p>
            <p>• Viewers need to login to save a copy</p>
            <p>• Your original note remains private</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
