import { loadConfig } from './config.js';
import { ScreenshotStorage } from './storage.js';
import { AppServer } from './server.js';
import { DashboardBrowser } from './browser.js';
import { CaptureScheduler } from './scheduler.js';

async function main() {
  console.log('[App] Starting Home Assistant Dashboard Screenshot Service...');

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error('[App] Configuration error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const mimeType = config.imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
  const storage = new ScreenshotStorage(mimeType);
  const browser = new DashboardBrowser({ config });
  const server = new AppServer({ storage, port: config.port, host: config.host });

  const captureTask = async () => {
    console.log(`[Capture] Taking screenshot of ${config.haUrl}/${config.dashboardPath}...`);
    const buffer = await browser.captureScreenshot();
    storage.setScreenshot(buffer, mimeType, new Date());
    console.log(`[Capture] Screenshot updated successfully (${buffer.length} bytes).`);
  };

  const scheduler = new CaptureScheduler({
    intervalSeconds: config.intervalSeconds,
    task: captureTask,
    onError: (err) => {
      console.error('[Capture] Screenshot capture failed:', err instanceof Error ? err.message : String(err));
      console.info('[Capture] Serving previous valid screenshot if available.');
    },
  });

  try {
    await server.start();
    console.log(`[Server] HTTP server listening on http://${config.host}:${config.port}`);
  } catch (err) {
    console.error('[Server] Failed to bind HTTP server:', err);
    await browser.close();
    process.exit(1);
  }

  // Start periodic capture
  scheduler.start(true);

  // Graceful shutdown handling
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`[App] Received ${signal}. Gracefully shutting down...`);

    try {
      await scheduler.stop();
      await server.stop();
      await browser.close();
      console.log('[App] Clean shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('[App] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[App] Fatal error at startup:', err);
  process.exit(1);
});
