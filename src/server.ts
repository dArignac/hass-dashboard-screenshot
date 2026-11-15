import { createServer, IncomingMessage, ServerResponse, Server } from 'node:http';
import { ScreenshotStorage } from './storage.js';

export interface ServerOptions {
  storage: ScreenshotStorage;
  port: number;
  host: string;
}

export function createHttpServer(storage: ScreenshotStorage): Server {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = url.pathname;

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    if (pathname === '/health') {
      const stats = storage.getHealthStats();
      const body = JSON.stringify(stats);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': Buffer.byteLength(body),
      });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(body);
      }
      return;
    }

    if (
      pathname === '/' ||
      pathname === '/screenshot.png' ||
      pathname === '/screenshot.jpeg' ||
      pathname === '/screenshot.jpg'
    ) {
      const screenshot = storage.getScreenshot();
      if (!screenshot) {
        const body = 'No screenshot available yet';
        res.writeHead(503, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Length': Buffer.byteLength(body),
        });
        if (req.method === 'HEAD') {
          res.end();
        } else {
          res.end(body);
        }
        return;
      }

      res.writeHead(200, {
        'Content-Type': screenshot.mimeType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Screenshot-Timestamp': screenshot.timestamp.toISOString(),
        'Content-Length': screenshot.buffer.length,
      });

      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(screenshot.buffer);
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  });
}

export class AppServer {
  private server: Server;
  private port: number;
  private host: string;

  constructor(options: ServerOptions) {
    this.server = createHttpServer(options.storage);
    this.port = options.port;
    this.host = options.host;
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(this.port, this.host, () => {
        this.server.removeListener('error', reject);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  public getRawServer(): Server {
    return this.server;
  }
}
