import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { FolderDetailView } from "@/components/folders/folder-detail-view";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function FolderDetailPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() }); const userId = session?.user?.id;

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
