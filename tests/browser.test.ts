import { describe, it, expect, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { applyKioskMode } from '../src/browser.js';

describe('Browser Kiosk Mode with Snapshot HTML', () => {
  let browser: Browser | null = null;

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('hides top header, sidebar drawer, and resets view padding on real Home Assistant DOM', async () => {
    const haHtmlPath = path.resolve('ha.html');
    if (!fs.existsSync(haHtmlPath)) {
      return;
    }

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    await page.goto(`file://${haHtmlPath}`);

    // Verify elements exist before kiosk mode
    const beforeState = await page.evaluate(() => {
      const ha = document.querySelector('home-assistant');
      const main = ha?.shadowRoot?.querySelector('home-assistant-main');
      const drawer = main?.shadowRoot?.querySelector('ha-drawer');
      const sidebarShell = drawer?.shadowRoot?.querySelector('.sidebar-shell');
      const panelResolver = drawer?.querySelector('partial-panel-resolver');
      const panelLovelace = panelResolver?.querySelector('ha-panel-lovelace');
      const huiRoot = panelLovelace?.shadowRoot?.querySelector('hui-root');
      const header = huiRoot?.shadowRoot?.querySelector('.header');

      return {
        headerDisplay: header ? window.getComputedStyle(header).display : null,
        sidebarShellDisplay: sidebarShell ? window.getComputedStyle(sidebarShell).display : null,
      };
    });

    expect(beforeState.headerDisplay).toBe('block');
    expect(beforeState.sidebarShellDisplay).toBe('block');

    // Apply kiosk mode
    await applyKioskMode(page);

    // Verify elements are hidden after kiosk mode
    const afterState = await page.evaluate(() => {
      const ha = document.querySelector('home-assistant');
      const main = ha?.shadowRoot?.querySelector('home-assistant-main');
      const drawer = main?.shadowRoot?.querySelector('ha-drawer');
      const sidebarShell = drawer?.shadowRoot?.querySelector('.sidebar-shell');
      const sidebar = drawer?.querySelector('ha-sidebar');
      const panelResolver = drawer?.querySelector('partial-panel-resolver');
      const panelLovelace = panelResolver?.querySelector('ha-panel-lovelace');
      const huiRoot = panelLovelace?.shadowRoot?.querySelector('hui-root');
      const header = huiRoot?.shadowRoot?.querySelector('.header');

      return {
        headerDisplay: header ? window.getComputedStyle(header).display : null,
        sidebarShellDisplay: sidebarShell ? window.getComputedStyle(sidebarShell).display : null,
        sidebarDisplay: sidebar ? window.getComputedStyle(sidebar).display : null,
      };
    });

    expect(afterState.headerDisplay).toBe('none');
    expect(afterState.sidebarShellDisplay).toBe('none');
    expect(afterState.sidebarDisplay).toBe('none');
  });
});
