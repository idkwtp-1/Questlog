import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8083;
const CLIENT_DIR = path.join(__dirname, 'dist', 'client');

// Import the SSR server handler
import ssrServer from './dist/server/server.js';

// MIME types lookup
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  
  // 1. Try serving static file from dist/client
  if (urlPath !== '/') {
    const filePath = path.join(CLIENT_DIR, urlPath);
    
    // Prevent directory traversal
    if (filePath.startsWith(CLIENT_DIR)) {
      try {
        const stats = await fs.promises.stat(filePath);
        if (stats.isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable'
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      } catch (err) {
        // File not found, fallback to SSR
      }
    }
  }

  // 2. Delegate to SSR Handler
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || `localhost:${PORT}`;
    const fullUrl = `${protocol}://${host}${req.url}`;
    
    // Read request body if present
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      body = Buffer.concat(buffers);
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers: req.headers,
      body,
    });

    const webResponse = await ssrServer.fetch(webRequest);

    // Write Web Response back to Node.js response
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = await webResponse.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (err) {
    console.error('SSR Error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`QuestLog Server running at http://localhost:${PORT}`);
});
