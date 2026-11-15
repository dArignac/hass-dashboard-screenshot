import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('Config Module', () => {
  it('loads valid configuration with defaults for optional variables', () => {
    const config = loadConfig({
      HA_URL: 'http://homeassistant.local:8123',
      HA_TOKEN: 'super-secret-token',
    });

    expect(config.haUrl).toBe('http://homeassistant.local:8123');
    expect(config.haToken).toBe('super-secret-token');
    expect(config.dashboardPath).toBe('lovelace/0');
    expect(config.viewportWidth).toBe(1920);
    expect(config.viewportHeight).toBe(1080);
    expect(config.intervalSeconds).toBe(60);
    expect(config.renderDelaySeconds).toBe(3);
    expect(config.port).toBe(8080);
    expect(config.host).toBe('0.0.0.0');
    expect(config.hideHeaderAndSidebar).toBe(true);
    expect(config.imageFormat).toBe('png');
  });

  it('normalizes URLs and paths by stripping trailing/leading slashes', () => {
    const config = loadConfig({
      HA_URL: 'http://homeassistant.local:8123/',
      HA_TOKEN: 'token',
      DASHBOARD_PATH: '/lovelace-kiosk/main',
    });

    expect(config.haUrl).toBe('http://homeassistant.local:8123');
    expect(config.dashboardPath).toBe('lovelace-kiosk/main');
  });

  it('correctly parses custom optional values', () => {
    const config = loadConfig({
      HA_URL: 'https://ha.example.com',
      HA_TOKEN: 'token-123',
      DASHBOARD_PATH: 'wall-display',
      VIEWPORT_WIDTH: '1024',
      VIEWPORT_HEIGHT: '768',
      SCREENSHOT_INTERVAL_SECONDS: '30',
      RENDER_DELAY_SECONDS: '5',
      PORT: '9000',
      HOST: '127.0.0.1',
      HIDE_HEADER_AND_SIDEBAR: 'false',
      IMAGE_FORMAT: 'jpeg',
    });

    expect(config.haUrl).toBe('https://ha.example.com');
    expect(config.dashboardPath).toBe('wall-display');
    expect(config.viewportWidth).toBe(1024);
    expect(config.viewportHeight).toBe(768);
    expect(config.intervalSeconds).toBe(30);
    expect(config.renderDelaySeconds).toBe(5);
    expect(config.port).toBe(9000);
    expect(config.host).toBe('127.0.0.1');
    expect(config.hideHeaderAndSidebar).toBe(false);
    expect(config.imageFormat).toBe('jpeg');
  });

  it('correctly handles boolean variations', () => {
    expect(loadConfig({ HA_URL: 'http://ha.local:8123', HA_TOKEN: 't', HIDE_HEADER_AND_SIDEBAR: '0' }).hideHeaderAndSidebar).toBe(false);
    expect(loadConfig({ HA_URL: 'http://ha.local:8123', HA_TOKEN: 't', HIDE_HEADER_AND_SIDEBAR: 'no' }).hideHeaderAndSidebar).toBe(false);
    expect(loadConfig({ HA_URL: 'http://ha.local:8123', HA_TOKEN: 't', HIDE_HEADER_AND_SIDEBAR: '1' }).hideHeaderAndSidebar).toBe(true);
    expect(loadConfig({ HA_URL: 'http://ha.local:8123', HA_TOKEN: 't', HIDE_HEADER_AND_SIDEBAR: 'yes' }).hideHeaderAndSidebar).toBe(true);
  });

  it('throws an error if HA_URL is missing or invalid', () => {
    expect(() => loadConfig({ HA_TOKEN: 'token' })).toThrowError(/HA_URL/);
    expect(() => loadConfig({ HA_URL: 'not-a-valid-url', HA_TOKEN: 'token' })).toThrowError(/HA_URL/);
  });

  it('throws an error if HA_TOKEN is missing or empty', () => {
    expect(() => loadConfig({ HA_URL: 'http://ha.local:8123' })).toThrowError(/HA_TOKEN/);
    expect(() => loadConfig({ HA_URL: 'http://ha.local:8123', HA_TOKEN: '' })).toThrowError(/HA_TOKEN/);
  });

  it('throws an error if numeric options are invalid', () => {
    expect(() =>
      loadConfig({
        HA_URL: 'http://ha.local:8123',
        HA_TOKEN: 'token',
        VIEWPORT_WIDTH: '-100',
      })
    ).toThrowError(/VIEWPORT_WIDTH/);
  });
});
