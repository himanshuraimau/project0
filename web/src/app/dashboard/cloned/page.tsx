import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SubscriptionService } from "@/lib/subscription-service";
import { prisma } from "@/lib/prisma";
import { ClonedPageView } from "@/components/dashboard/cloned-page-view";
import type { ClonedNoteSerialized } from "@/components/dashboard/cloned-page-view";

export default async function ClonedNotesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/sign-in");

  const hasSubscription =
    await SubscriptionService.hasActiveSubscription(session.user.id);
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

  const serializedNotes: ClonedNoteSerialized[] = clonedNotes.map((note) => ({
    id: note.id,
    title: note.title,
    content: note.content,
    transcriptId: note.transcriptId,
    userId: note.userId,
    folderId: note.folderId,
    isCloned: note.isCloned,
    sourceNoteId: note.sourceNoteId ?? undefined,
    originalAuthor: note.originalAuthor ?? undefined,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    transcript: {
      id: note.transcript.id,
      fileName: note.transcript.fileName,
      originalName: note.transcript.originalName,
      type: note.transcript.type,
      createdAt: note.transcript.createdAt.toISOString(),
    },
  }));

  return (
    <div className="w-full space-y-8">
      <ClonedPageView notes={serializedNotes} />
    </div>
  );
}
