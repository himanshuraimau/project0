import { createHash } from "crypto";
import type { Server as HttpServer, IncomingMessage } from "http";
import type { Socket } from "net";
import { noteProgressManager } from "@/lib/note-progress-manager";

const WS_PATH = "/api/notes/progress/ws";
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

type ServerWithProgressWs = HttpServer & {
  __noteProgressWsInitialized?: boolean;
};

type WsClient = {
  socket: Socket;
  unsubscribe: () => void;
};

const globalWsState = globalThis as typeof globalThis & {
  __noteProgressClientsBySocket?: WeakMap<Socket, WsClient>;
};

if (!globalWsState.__noteProgressClientsBySocket) {
  globalWsState.__noteProgressClientsBySocket = new WeakMap();
}

function createAcceptValue(clientKey: string) {
  return createHash("sha1").update(clientKey + WS_GUID).digest("base64");
}

function encodeFrame(opcode: number, payload: Buffer) {
  const payloadLength = payload.length;

  if (payloadLength < 126) {
    return Buffer.concat([
      Buffer.from([0x80 | opcode, payloadLength]),
      payload,
    ]);
  }

  if (payloadLength < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x80 | opcode;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payloadLength), 2);
  return Buffer.concat([header, payload]);
}

function sendText(socket: Socket, data: unknown) {
  if (socket.destroyed || !socket.writable) {
    console.warn('[WebSocket Server] Attempted to send to destroyed/non-writable socket');
    return;
  }
  try {
    const payload = Buffer.from(JSON.stringify(data), "utf8");
    socket.write(encodeFrame(0x1, payload));
  } catch (error) {
    console.error('[WebSocket Server] Error sending message:', error);
  }
}

function sendPong(socket: Socket, payload: Buffer) {
  if (socket.destroyed || !socket.writable) {
    return;
  }
  socket.write(encodeFrame(0xA, payload));
}

function parseFrameHeader(buffer: Buffer) {
  if (buffer.length < 2) {
    return null;
  }

  const opcode = buffer[0] & 0x0f;
  const masked = (buffer[1] & 0x80) !== 0;
  let payloadLength = buffer[1] & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) {
      return null;
    }
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) {
      return null;
    }
    payloadLength = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  if (!masked) {
    return { opcode, payload: Buffer.alloc(0) };
  }

  if (buffer.length < offset + 4 + payloadLength) {
    return null;
  }

  const mask = buffer.subarray(offset, offset + 4);
  const payloadStart = offset + 4;
  const payload = Buffer.from(
    buffer.subarray(payloadStart, payloadStart + payloadLength)
  );

  for (let i = 0; i < payload.length; i += 1) {
    payload[i] ^= mask[i % 4];
  }

  return { opcode, payload };
}

function cleanupSocket(socket: Socket) {
  const client = globalWsState.__noteProgressClientsBySocket?.get(socket);
  if (!client) {
    return;
  }
  client.unsubscribe();
  globalWsState.__noteProgressClientsBySocket?.delete(socket);
}

function handleProgressSocketUpgrade(request: IncomingMessage, socket: Socket) {
  const rawUrl = request.url || WS_PATH;
  const url = new URL(rawUrl, "http://localhost");
  const jobId = url.searchParams.get("jobId");

  console.log('[WebSocket Server] Upgrade request received:', {
    url: rawUrl,
    jobId,
    hasJobId: !!jobId,
  });

  if (!jobId) {
    console.error('[WebSocket Server] Missing jobId parameter');
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  const clientKey = request.headers["sec-websocket-key"];
  if (!clientKey || Array.isArray(clientKey)) {
    console.error('[WebSocket Server] Missing or invalid sec-websocket-key');
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  const acceptValue = createAcceptValue(clientKey);
  const responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptValue}`,
    "\r\n",
  ];

  socket.write(responseHeaders.join("\r\n"));
  console.log('[WebSocket Server] Handshake completed for jobId:', jobId);

  const latest = noteProgressManager.getLatest(jobId);
  if (latest) {
    console.log('[WebSocket Server] Sending latest progress:', latest);
    sendText(socket, latest);
  } else {
    console.log('[WebSocket Server] No existing progress for jobId:', jobId);
  }

  const unsubscribe = noteProgressManager.subscribe(jobId, (event) => {
    console.log('[WebSocket Server] Broadcasting progress update:', event);
    sendText(socket, event);
  });

  globalWsState.__noteProgressClientsBySocket?.set(socket, {
    socket,
    unsubscribe,
  });

  socket.on("data", (chunk: Buffer) => {
    const frame = parseFrameHeader(chunk);
    if (!frame) {
      return;
    }

    if (frame.opcode === 0x8) {
      console.log('[WebSocket Server] Client close frame received');
      socket.end();
      return;
    }

    if (frame.opcode === 0x9) {
      sendPong(socket, frame.payload);
    }
  });

  socket.on("close", () => {
    console.log('[WebSocket Server] Socket closed for jobId:', jobId);
    cleanupSocket(socket);
  });
  socket.on("end", () => {
    console.log('[WebSocket Server] Socket ended for jobId:', jobId);
    cleanupSocket(socket);
  });
  socket.on("error", (error) => {
    console.error('[WebSocket Server] Socket error for jobId:', jobId, error);
    cleanupSocket(socket);
  });
}

export function ensureNoteProgressWebSocketServer(server: HttpServer) {
  const nextServer = server as ServerWithProgressWs;

  if (nextServer.__noteProgressWsInitialized) {
    console.log('[WebSocket Server] Already initialized, skipping');
    return;
  }

  console.log('[WebSocket Server] Initializing upgrade handler');
  nextServer.__noteProgressWsInitialized = true;

  nextServer.on("upgrade", (request: IncomingMessage, socket: Socket) => {
    try {
      const url = new URL(request.url || WS_PATH, "http://localhost");
      console.log('[WebSocket Server] Upgrade event:', {
        pathname: url.pathname,
        targetPath: WS_PATH,
      });
      
      if (url.pathname !== WS_PATH) {
        console.log('[WebSocket Server] Path mismatch, ignoring');
        return;
      }
      handleProgressSocketUpgrade(request, socket);
    } catch (error) {
      console.error('[WebSocket Server] Upgrade handler error:', error);
      socket.destroy();
    }
  });

  console.log('[WebSocket Server] Initialization complete');
}
