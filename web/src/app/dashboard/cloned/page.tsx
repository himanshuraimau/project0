import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SubscriptionService } from "@/lib/subscription-service";
import { prisma } from "@/lib/prisma";
import { NoteCard } from "@/components/notes/note-card";
import { Share2 } from "lucide-react";

export default async function ClonedNotesPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user) redirect("/sign-in");

  const hasSubscription = await SubscriptionService.hasActiveSubscription(session.user.id);
  if (!hasSubscription) redirect("/pricing");

  const clonedNotes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      isCloned: true,
    },
    include: {
      folder: true,
      transcript: {
        select: {
          id: true,
          fileName: true,
          originalName: true,
          type: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const handleUpdate = async () => {
    "use server";
    // Revalidate the page
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Share2 className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-bold">Shared With Me</h1>
        </div>
        <p className="text-muted-foreground">
          Notes shared with you and saved to your workspace
        </p>
      </div>

      {/* Notes List */}
      {clonedNotes.length === 0 ? (
        <div className="neomorphic p-12 rounded-2xl text-center">
          <Share2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No shared notes yet</h3>
          <p className="text-muted-foreground">
            When someone shares a note with you and you save it, it will appear here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          {clonedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={{
                ...note,
                transcript: {
                  ...note.transcript,
                  createdAt: note.transcript.createdAt.toISOString(),
                },
              }}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
