/**
 * PixelFlow — Production Node.js Server & WebSocket Host
 * Designed for deployment on Render as a Web Service.
 *
 * Requirements satisfied:
 * 1. Listens on process.env.PORT (defaults to 10000 on Render).
 * 2. Binds explicitly to '0.0.0.0' for external container routing.
 * 3. Serves the frontend static files from the exact same server.
 * 4. Shares the HTTP server with WebSocketServer so WebSocket upgrades (ws:// and wss://)
 *    work seamlessly on the exact same port and domain without reverse-proxy issues.
 */

const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');

// 1. Port & Host Configuration for Render
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

// 2. Express Application Setup
const app = express();

// Serve static frontend assets (index.html, style.css, script.js, etc.)
app.use(express.static(path.join(__dirname)));

// Health check endpoint for Render monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback all other routes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Create Shared HTTP Server
const server = http.createServer(app);

// 4. Attach WebSocket Server to Shared HTTP Server
const wss = new WebSocketServer({ server });

// Heartbeat tracker to keep long-lived connections healthy through Render's proxy
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  const clientIp = req.socket.remoteAddress;
  console.log(`[WebSocket] Client connected from ${clientIp}. Total clients: ${wss.clients.size}`);

  // Send initial welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Welcome to PixelFlow Realtime Engine',
    clients: wss.clients.size,
    timestamp: Date.now()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      console.log('[WebSocket] Received message:', parsed);

      // Echo message or broadcast back to client
      ws.send(JSON.stringify({
        type: 'ack',
        data: parsed,
        timestamp: Date.now()
      }));
    } catch (err) {
      // Handle plain text
      ws.send(JSON.stringify({
        type: 'echo',
        payload: data.toString(),
        timestamp: Date.now()
      }));
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[WebSocket] Client disconnected (code ${code}). Remaining: ${wss.clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WebSocket] Error on client connection:', err.message);
  });
});

// 5. Ping-Pong Keepalive Interval (runs every 30 seconds to prevent Render 55s proxy timeout)
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('[WebSocket] Terminating inactive client connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(pingInterval);
});

// 6. Start Listening on 0.0.0.0 and process.env.PORT
server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(` PixelFlow Server running on http://${HOST}:${PORT}`);
  console.log(` Environment Port: ${process.env.PORT || 'default 10000'}`);
  console.log(` WebSocket Server active on same port & origin`);
  console.log('====================================================');
});
