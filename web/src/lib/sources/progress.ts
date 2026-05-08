import { pusherServer } from "@/lib/realtime/pusher-server";
import type {
  SourceErrorCode,
  SourceKind,
  SourceProgressEvent,
  SourceStage,
  SourceStatus,
} from "./types";

export const SOURCE_PROGRESS_CHANNEL = "source-progress";

export interface PublishSourceProgressInput {
  transcriptId: string;
  batchId: string | null;
  sourceKind: SourceKind;
  status: SourceStatus;
  stage: SourceStage | null;
  progress: number;
  message: string;
  errorCode?: SourceErrorCode | null;
  title?: string;
}

export async function publishSourceProgress(
  input: PublishSourceProgressInput
): Promise<void> {
  const event: SourceProgressEvent = {
    ...input,
    progress: Math.max(0, Math.min(100, Math.round(input.progress))),
    updatedAt: Date.now(),
  };

  try {
    await Promise.all([
      pusherServer.trigger(
        SOURCE_PROGRESS_CHANNEL,
        `source-${input.transcriptId}`,
        event
      ),
      input.batchId
        ? pusherServer.trigger(
            SOURCE_PROGRESS_CHANNEL,
            `batch-${input.batchId}`,
            event
          )
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("[sources/progress] Pusher publish failed:", err);
  }
}
