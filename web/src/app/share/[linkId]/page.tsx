import { redirect } from "next/navigation";
import { SharePreviewClient } from "./share-preview-client";

interface Params {
  linkId: string;
}

export default async function SharePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { linkId } = await params;
  const { token } = await searchParams;

  if (!token) {
    redirect("/");
  }

  return <SharePreviewClient linkId={linkId} token={token} />;
}
