import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket as any;
  const server = socket?.server;

  const debugInfo = {
    socketAvailable: !!socket,
    serverAvailable: !!server,
    serverType: server?.constructor?.name,
    hasUpgradeHandler: server && typeof server.on === 'function',
    upgradeListenerCount: server?.listenerCount?.('upgrade') ?? 'N/A',
    nodeEnv: process.env.NODE_ENV,
    nextOutputMode: process.env.NEXT_OUTPUT || 'N/A',
    platform: process.platform,
    nodeVersion: process.version,
  };

  console.log('[WebSocket Debug]', debugInfo);

  res.status(200).json({
    success: true,
    debug: debugInfo,
    recommendations: [
      !server && 'Server instance not available - may not work in standalone/Docker mode',
      server && debugInfo.upgradeListenerCount === 0 && 'No upgrade listeners registered - WebSocket won\'t work',
    ].filter(Boolean),
  });
}
