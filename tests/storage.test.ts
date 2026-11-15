import { describe, it, expect } from 'vitest';
import { ScreenshotStorage } from '../src/storage.js';

describe('Storage Module', () => {
  it('initializes with empty buffer and initial health status', () => {
    const storage = new ScreenshotStorage('image/png');

    expect(storage.hasScreenshot()).toBe(false);
    expect(storage.getScreenshot()).toBeNull();

    const health = storage.getHealthStats();
    expect(health.status).toBe('initializing');
    expect(health.lastScreenshot).toBeNull();
    expect(health.capturesTotal).toBe(0);
  });

  it('stores screenshot buffer and metadata', () => {
    const storage = new ScreenshotStorage('image/png');
    const fakeBuffer = Buffer.from('fake-png-data');
    const timestamp = new Date('2026-01-01T12:00:00Z');

    storage.setScreenshot(fakeBuffer, 'image/png', timestamp);

    expect(storage.hasScreenshot()).toBe(true);
    const data = storage.getScreenshot();
    expect(data).not.toBeNull();
    expect(data?.buffer.toString()).toBe('fake-png-data');
    expect(data?.mimeType).toBe('image/png');
    expect(data?.timestamp).toEqual(timestamp);

    const health = storage.getHealthStats();
    expect(health.status).toBe('ok');
    expect(health.lastScreenshot).toBe('2026-01-01T12:00:00.000Z');
    expect(health.capturesTotal).toBe(1);
  });

  it('increments total capture counts across multiple sets', () => {
    const storage = new ScreenshotStorage('image/jpeg');
    const buf1 = Buffer.from('image1');
    const buf2 = Buffer.from('image2');

    storage.setScreenshot(buf1, 'image/jpeg');
    expect(storage.getHealthStats().capturesTotal).toBe(1);

    storage.setScreenshot(buf2, 'image/jpeg');
    expect(storage.getHealthStats().capturesTotal).toBe(2);
    expect(storage.getScreenshot()?.buffer.toString()).toBe('image2');
  });
});
