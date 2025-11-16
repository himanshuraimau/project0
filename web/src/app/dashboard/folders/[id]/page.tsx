import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FolderDetailView } from "@/components/folders/folder-detail-view";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function FolderDetailPage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  return (
    <div className="w-full space-y-8">
      <FolderDetailView folderId={id} />
    </div>
  );
}
