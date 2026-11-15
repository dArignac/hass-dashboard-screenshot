import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ScreenshotStorage } from '../src/storage.js';
import { AppServer } from '../src/server.js';
import type { AddressInfo } from 'node:net';

describe('HTTP Server Module', () => {
  let storage: ScreenshotStorage;
  let server: AppServer;
  let baseUrl: string;

  beforeAll(async () => {
    storage = new ScreenshotStorage('image/png');
    // Port 0 binds to a free random ephemeral port
    server = new AppServer({ storage, port: 0, host: '127.0.0.1' });
    await server.start();
    const addr = server.getRawServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('returns 503 on GET / and /screenshot.png when no screenshot is captured yet', async () => {
    const resRoot = await fetch(`${baseUrl}/`);
    expect(resRoot.status).toBe(503);
    expect(resRoot.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate');

    const resFile = await fetch(`${baseUrl}/screenshot.png`);
    expect(resFile.status).toBe(503);
    expect(resFile.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate');
  });

  it('returns 200 on GET /health when initializing', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const body = await res.json();
    expect(body).toEqual({
      status: 'initializing',
      lastScreenshot: null,
      capturesTotal: 0,
    });
  });

  it('returns 200 with screenshot binary and correct headers once stored', async () => {
    const fakeData = Buffer.from('png-binary-stream-data');
    const timestamp = new Date('2026-05-15T10:30:00Z');
    storage.setScreenshot(fakeData, 'image/png', timestamp);

    const resRoot = await fetch(`${baseUrl}/`);
    expect(resRoot.status).toBe(200);
    expect(resRoot.headers.get('content-type')).toBe('image/png');
    expect(resRoot.headers.get('cache-control')).toBe('no-cache, no-store, must-revalidate');
    expect(resRoot.headers.get('x-screenshot-timestamp')).toBe('2026-05-15T10:30:00.000Z');

    const buffer = Buffer.from(await resRoot.arrayBuffer());
    expect(buffer.toString()).toBe('png-binary-stream-data');

    const resFile = await fetch(`${baseUrl}/screenshot.png`);
    expect(resFile.status).toBe(200);
    expect(resFile.headers.get('content-type')).toBe('image/png');

    const resHealth = await fetch(`${baseUrl}/health`);
    const health = await resHealth.json();
    expect(health.status).toBe('ok');
    expect(health.lastScreenshot).toBe('2026-05-15T10:30:00.000Z');
    expect(health.capturesTotal).toBe(1);
  });

  it('returns 404 for unknown endpoints', async () => {
    const res = await fetch(`${baseUrl}/unknown-path`);
    expect(res.status).toBe(404);
  });

  it('returns 405 for non-GET methods', async () => {
    const res = await fetch(`${baseUrl}/`, { method: 'POST', body: 'test' });
    expect(res.status).toBe(405);
  });
});
