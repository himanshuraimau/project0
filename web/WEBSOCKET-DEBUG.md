 # WebSocket Debugging Guide

## Issues Found & Fixed

### 1. **Missing WebSocket Event Handlers** ✅ FIXED
**Problem:** The client WebSocket connection had no `onopen`, `onerror`, or `onclose` handlers.

**Impact:** 
- Connection failures were invisible
- No error reporting
- No automatic reconnection
- Silent failures

**Fix Applied:**
- Added `socket.onopen` for connection success logging
- Added `socket.onerror` for error visibility
- Added `socket.onclose` with automatic reconnection logic (2s delay)
- All handlers now include detailed console logging

### 2. **No Server-Side Logging** ✅ FIXED
**Problem:** The WebSocket server had zero logging for debugging.

**Impact:**
- Impossible to diagnose connection issues
- No visibility into upgrade requests
- No tracking of client connections/disconnections

**Fix Applied:**
- Added comprehensive logging throughout the upgrade handler
- Logs all connection events (open, close, error)
- Logs message broadcasts
- Logs subscription management

### 3. **Silent Error Handling** ✅ FIXED
**Problem:** Errors were caught and ignored without logging.

**Impact:**
- Bootstrap failures went unnoticed
- Parse errors were invisible
- Progress manager errors were swallowed

**Fix Applied:**
- All error handlers now log to console
- Bootstrap errors are logged but don't prevent connection attempts
- Message parse errors are logged

### 4. **No Progress Manager Visibility** ✅ FIXED
**Problem:** No logging when events are published or when no listeners exist.

**Impact:**
- Can't tell if progress events are being published
- Can't tell if clients are connected

**Fix Applied:**
- Logs when no listeners are available for a jobId
- Logs number of listeners receiving each event
- Error handling for listener callbacks

---

## How to Debug WebSocket Issues

### Step 1: Check Server Availability
Visit: `http://localhost:3000/api/notes/progress/ws-debug`

This will show:
- Whether the HTTP server instance is available
- Number of upgrade listeners registered
- Platform and environment info
- Recommendations if issues detected

### Step 2: Check Browser Console
When a note is being created, you should see logs like:

```
[WebSocket] Connecting to: ws://localhost:3000/api/notes/progress/ws?jobId=...
[WebSocket] Connected successfully for job: abc123
```

If you see errors, they'll be detailed:
```
[WebSocket] Connection error: Event {...}
[WebSocket] Failed to connect to: ws://localhost:3000/api/notes/progress/ws?jobId=...
```

### Step 3: Check Server Console
In your server terminal, you should see:

```
[WebSocket API] Handler called, server available: true
[WebSocket Server] Initializing upgrade handler
[WebSocket Server] Upgrade request received: { url: '...', jobId: 'abc123', hasJobId: true }
[WebSocket Server] Handshake completed for jobId: abc123
[Progress Manager] Publishing to 1 listener(s): { ... }
[WebSocket Server] Broadcasting progress update: { ... }
```

### Step 4: Common Issues & Solutions

#### Issue: "Socket server unavailable"
**Cause:** Running in standalone/Docker mode where the HTTP server isn't accessible
**Solution:** 
1. Use external WebSocket server (set `NEXT_PUBLIC_NOTES_PROGRESS_WS_URL`)
2. OR remove `output: "standalone"` from next.config.ts for local dev

#### Issue: Connection closes immediately
**Symptoms:** 
```
[WebSocket] Connected successfully
[WebSocket] Connection closed: { code: 1006, reason: '', wasClean: false }
```
**Cause:** Server not properly handling upgrade or CSP blocking connection
**Check:** 
- Server logs for upgrade handler
- Browser Network tab for CSP errors
- Verify `ws://localhost:*` is in CSP `connect-src`

#### Issue: No progress updates
**Symptoms:** WebSocket connects but no messages received
**Check:**
1. Server logs - is progress being published?
   ```
   [Progress Manager] No listeners for jobId: abc123
   ```
   This means the WebSocket connected but subscription failed
   
2. Is `noteProgressManager.publish()` being called in the PDF/audio processing route?
   ```typescript
   noteProgressManager.publish({
     jobId: progressJobId,
     progress: 50,
     stage: 'processing',
     message: 'Processing...',
   });
   ```

#### Issue: "Bootstrap error" in client
**Cause:** The `/api/notes/progress/ws` endpoint failed to initialize
**Check:** Server logs for "Socket server unavailable"
**Not critical:** WebSocket may still work even if bootstrap fails

---

## Architecture Notes

### How It Works:
1. **Client** calls `/api/notes/progress/ws` (HTTP) to ensure upgrade handler is registered
2. **Client** opens WebSocket connection to same URL with `?jobId=xyz`
3. **Server** intercepts the `upgrade` event and performs WebSocket handshake
4. **Server** immediately sends latest progress (if any) for that jobId
5. **Server** subscribes to progress updates for that jobId
6. **Progress Manager** broadcasts updates to all subscribed WebSocket clients
7. **Client** auto-reconnects if connection drops (unless job completed/errored)

### Next.js Compatibility:
- ✅ Works in dev mode (`next dev`)
- ✅ Works in production mode (`next start`)
- ⚠️ May NOT work in `output: "standalone"` mode (Docker)
- ⚠️ May NOT work on serverless platforms (Vercel, AWS Lambda)

For serverless/standalone, you need an external WebSocket server and set:
```env
NEXT_PUBLIC_NOTES_PROGRESS_WS_URL=wss://your-ws-server.com/ws
```

---

## Testing WebSocket Connection

### Manual Test:
1. Start the dev server: `npm run dev`
2. Open browser console
3. Run:
```javascript
const ws = new WebSocket('ws://localhost:3000/api/notes/progress/ws?jobId=test123');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
```

4. In another terminal, trigger progress:
```bash
curl -X POST http://localhost:3000/api/pdf/process \
  -F "file=@test.pdf" \
  -F "progressJobId=test123"
```

You should see messages in the browser console as the PDF processes.

---

## Production Deployment

### If using Docker/Standalone:
**Remove** this from next.config.ts:
```typescript
output: "standalone",  // ← Remove this line
```

OR use an external WebSocket server.

### If using Vercel/Serverless:
You **must** use an external WebSocket server because:
- Vercel functions are stateless
- No persistent HTTP server for upgrade events
- Each request gets a new function instance

Options:
1. Ably (managed WebSocket service)
2. Pusher (managed WebSocket service)  
3. AWS API Gateway WebSocket API
4. Self-hosted WebSocket server on a VPS

---

## Monitoring WebSocket Health

Add this to your monitoring:

```typescript
// In your client code
let connectionAttempts = 0;
let successfulConnections = 0;

socket.onopen = () => {
  successfulConnections++;
  // Send to analytics
  analytics.track('websocket_connected', { attempts: connectionAttempts });
};

socket.onerror = () => {
  connectionAttempts++;
  // Send to analytics  
  analytics.track('websocket_error', { attempts: connectionAttempts });
};
```

Track metrics:
- Connection success rate
- Average time to first message
- Reconnection frequency
- Message latency

---

## Next Steps

1. **Test the fixes:**
   - Upload a PDF and watch browser + server console
   - Verify progress updates appear in real-time
   - Check that reconnection works (kill server mid-upload, restart)

2. **Remove standalone mode** (if applicable):
   - Edit `next.config.ts` and remove `output: "standalone"`
   - Restart dev server

3. **Add monitoring:**
   - Track WebSocket connection success/failure rates
   - Alert if connection failure rate > 10%

4. **Consider external WS for production:**
   - If deploying to serverless, implement external WSocket server
   - Update `NEXT_PUBLIC_NOTES_PROGRESS_WS_URL` in production env vars
