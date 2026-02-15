import type { NextApiRequest, NextApiResponse } from "next";
import { ensureNoteProgressWebSocketServer } from "@/lib/note-progress-ws-server";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const server = (res.socket as { server?: Parameters<typeof ensureNoteProgressWebSocketServer>[0] } | undefined)?.server;

  console.log('[WebSocket API] Handler called, server available:', !!server);

  if (!server) {
    console.error('[WebSocket API] Socket server unavailable - this may indicate a deployment/architecture issue');
    res.status(500).json({ success: false, error: "Socket server unavailable" });
    return;
  }

  ensureNoteProgressWebSocketServer(server);
  console.log('[WebSocket API] Server initialization triggered');
  res.status(200).json({ success: true });
}
