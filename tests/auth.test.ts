import { describe, it, expect } from 'vitest';
import { buildHassTokens, createAuthInitScript } from '../src/auth.js';
import { HIDE_HEADER_AND_SIDEBAR_CSS } from '../src/browser.js';

describe('Auth & Browser Controller Logic', () => {
  it('builds Home Assistant tokens payload correctly', () => {
    const tokens = buildHassTokens('http://homeassistant.local:8123/', 'my-secret-token');

    expect(tokens.access_token).toBe('my-secret-token');
    expect(tokens.token_type).toBe('Bearer');
    expect(tokens.clientId).toBe('http://homeassistant.local:8123/');
    expect(tokens.hassUrl).toBe('http://homeassistant.local:8123');
    expect(tokens.expires).toBe(9999999999999);
  });

  it('generates executable localStorage injection script', () => {
    const tokens = buildHassTokens('http://192.168.1.100:8123', 'test-token');
    const script = createAuthInitScript(tokens);

    expect(script).toContain("localStorage.setItem('hassTokens'");
    expect(script).toContain('test-token');
    expect(script).toContain('http://192.168.1.100:8123');

    // Simulate running the script in an environment with localStorage
    const storageMock: Record<string, string> = {};
    const fakeLocalStorage = {
      setItem: (k: string, v: string) => {
        storageMock[k] = v;
      },
    };

    const runScript = new Function('localStorage', script);
    runScript(fakeLocalStorage);

    expect(storageMock['hassTokens']).toBeDefined();
    const parsed = JSON.parse(storageMock['hassTokens']);
    expect(parsed.access_token).toBe('test-token');
    expect(parsed.hassUrl).toBe('http://192.168.1.100:8123');
  });

  it('defines CSS selectors to hide Lovelace header and sidebar', () => {
    expect(HIDE_HEADER_AND_SIDEBAR_CSS).toContain('ha-sidebar');
    expect(HIDE_HEADER_AND_SIDEBAR_CSS).toContain('app-header');
    expect(HIDE_HEADER_AND_SIDEBAR_CSS).toContain('display: none !important');
    expect(HIDE_HEADER_AND_SIDEBAR_CSS).toContain('#view');
  });
});
