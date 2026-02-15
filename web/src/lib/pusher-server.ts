import Pusher from "pusher";

const globalForPusher = globalThis as typeof globalThis & {
  __pusherServer?: Pusher;
};

export const pusherServer =
  globalForPusher.__pusherServer ??
  (globalForPusher.__pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID || "",
    key: process.env.PUSHER_KEY || "",
    secret: process.env.PUSHER_SECRET || "",
    cluster: process.env.PUSHER_CLUSTER || "us2",
    useTLS: true,
  }));

export const NOTE_PROGRESS_CHANNEL = "note-progress";
