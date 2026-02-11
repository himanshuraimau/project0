"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { NoteAppSidebar } from "@/components/notes/NoteAppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useFlashcards } from "@/hooks/use-flashcards";
import { useMindmap } from "@/hooks/use-mindmap";
import { NoteProvider, useNoteContext } from "@/contexts/note-context";
import { Card, CardContent } from "@/components/ui/card";
import { UpgradeModalProvider } from "@/contexts/upgrade-modal-context";

function NotesIdLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const { note } = useNoteContext();

  // We can keep these hooks if we need them for global state or pre-fetching
  useFlashcards();
  useMindmap();

  const handleDeleteNote = async () => {
    if (!noteId) return;

    const loadingToast = toast.loading("Deleting note...", {
      position: "top-center",
    });

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`
        );
      }

      toast.success("Note deleted successfully", {
        duration: 3000,
        position: "top-center",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(
        `Failed to delete note: ${error instanceof Error ? error.message : "Unknown error"
        }`,
        {
          duration: 5000,
          position: "top-center",
        }
      );
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      <AlertDialog>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle className="text-red-600">
                Delete Note
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 mt-2">
              <p className="font-medium text-base border-l-4 border-l-red-200 pl-3 py-1">
                {note?.title}
              </p>
              <p>
                This action cannot be undone. This will permanently delete this
                note and all associated content.
              </p>
              <Card className="border-red-800 mt-2 bg-white dark:bg-[#0A0B0D]">
                <CardContent className="p-3 text-sm text-red-900 dark:text-red-200">
                  <p className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>
                      All flashcards, quizzes, podcasts, and other content
                      generated from this note will also be deleted.
                    </span>
                  </p>
                </CardContent>
              </Card>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
              onClick={handleDeleteNote}
            >
              <Trash2 className="h-4 w-4" />
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

        <SidebarProvider defaultOpen={true} className="w-full h-screen">
          <div className="flex w-full h-full">
            {/* Left Column: App Sidebar */}
            <NoteAppSidebar noteId={noteId} />

            <SidebarInset className="flex-1 flex flex-col h-full overflow-hidden">
                <main className="flex-1 h-full overflow-y-auto bg-[#F9FAFB] dark:bg-[#0A0B0D]">
                    {children}
                </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AlertDialog>
    </div>
  );
}

export default function NotesIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NoteProvider>
      <UpgradeModalProvider>
        <NotesIdLayoutContent>{children}</NotesIdLayoutContent>
      </UpgradeModalProvider>
    </NoteProvider>
  );
}
