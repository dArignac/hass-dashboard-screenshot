import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { type Config } from './config.js';
import { buildHassTokens, createAuthInitScript } from './auth.js';

export const HIDE_HEADER_AND_SIDEBAR_CSS = `
  ha-sidebar,
  app-header,
  .header,
  #header,
  app-drawer,
  ha-top-app-bar-fixed,
  .toolbar,
  .action-items,
  .sidebar-shell,
  .mdc-drawer {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
    width: 0 !important;
  }
  .app-content,
  .mdc-drawer-app-content {
    padding-left: 0 !important;
    margin-left: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  #view,
  hui-view-container {
    padding: 0 !important;
    margin: 0 !important;
    padding-top: 0 !important;
    min-height: 100vh !important;
  }
  body, html {
    overflow: hidden !important;
  }
`;

export async function applyKioskMode(page: Page): Promise<void> {
  await page.evaluate((css: string) => {
    function injectIntoShadow(node: Node | null) {
      if (!node) return;
      const element = node as Element;
      if (element.shadowRoot) {
        if (!element.shadowRoot.querySelector('#kiosk-injected-style')) {
          const style = document.createElement('style');
          style.id = 'kiosk-injected-style';
          style.textContent = css;
          element.shadowRoot.appendChild(style);
        }
        injectIntoShadow(element.shadowRoot);
      }
      for (const child of element.children || []) {
        injectIntoShadow(child);
      }
    }

    if (!document.getElementById('kiosk-injected-style')) {
      const docStyle = document.createElement('style');
      docStyle.id = 'kiosk-injected-style';
      docStyle.textContent = css;
      document.head.appendChild(docStyle);
    }

    injectIntoShadow(document.body);

    try {
      const ha = document.querySelector('home-assistant');
      const main = ha?.shadowRoot?.querySelector('home-assistant-main');
      const drawer = main?.shadowRoot?.querySelector('ha-drawer');
      if (drawer) {
        const sidebarShell = drawer.shadowRoot?.querySelector('.sidebar-shell') as HTMLElement | null;
        if (sidebarShell) sidebarShell.style.display = 'none';
        const appContent = drawer.shadowRoot?.querySelector('.app-content') as HTMLElement | null;
        if (appContent) {
          appContent.style.paddingLeft = '0px';
          appContent.style.marginLeft = '0px';
          appContent.style.width = '100%';
        }
        const sidebar = drawer.querySelector('ha-sidebar') as HTMLElement | null;
        if (sidebar) sidebar.style.display = 'none';
      }

      const panelResolver = drawer?.querySelector('partial-panel-resolver');
      const panelLovelace = panelResolver?.querySelector('ha-panel-lovelace');
      const huiRoot = panelLovelace?.shadowRoot?.querySelector('hui-root');
      if (huiRoot) {
        const header = huiRoot.shadowRoot?.querySelector('.header') as HTMLElement | null;
        if (header) header.style.display = 'none';
        const view = huiRoot.shadowRoot?.querySelector('#view') as HTMLElement | null;
        if (view) {
          view.style.paddingTop = '0px';
          view.style.marginTop = '0px';
        }
      }
    } catch {
      // Ignore DOM hierarchy variances
    }
  }, HIDE_HEADER_AND_SIDEBAR_CSS).catch(() => {});
}

export interface DashboardBrowserOptions {
  config: Config;
}

export class DashboardBrowser {
  private config: Config;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  constructor(options: DashboardBrowserOptions) {
    this.config = options.config;
  }

  private async ensurePage(): Promise<Page> {
    if (this.browser && this.context && this.page && !this.page.isClosed()) {
      return this.page;
    }

    await this.cleanup();

    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: {
        width: this.config.viewportWidth,
        height: this.config.viewportHeight,
      },
      deviceScaleFactor: 1,
    });

    const tokens = buildHassTokens(this.config.haUrl, this.config.haToken);
    const authScript = createAuthInitScript(tokens);
    await this.context.addInitScript(authScript);

    this.page = await this.context.newPage();
    return this.page;
  }

  public async captureScreenshot(): Promise<Buffer> {
    try {
      const page = await this.ensurePage();
      const targetUrl = `${this.config.haUrl}/${this.config.dashboardPath}`;

      await page.goto(targetUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      }).catch(async () => {
        // If networkidle times out (e.g. streaming WebSockets), fallback to domcontentloaded
        if (page.url() !== targetUrl) {
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        }
      });

      // Try waiting for Home Assistant main view element if present
      await page.waitForSelector('#view, ha-panel-lovelace, hui-view', { timeout: 5000 }).catch(() => {
        // Continue even if selector wait times out
      });

      if (this.config.hideHeaderAndSidebar) {
        await applyKioskMode(page);
      }

      if (this.config.renderDelaySeconds > 0) {
        await page.waitForTimeout(this.config.renderDelaySeconds * 1000);
      }

      // Re-apply right before capture to catch any late-rendering components
      if (this.config.hideHeaderAndSidebar) {
        await applyKioskMode(page);
      }

      const screenshotBuffer = await page.screenshot({
        type: this.config.imageFormat,
        fullPage: false,
      });

      return screenshotBuffer;
    } catch (error) {
      // Invalidate page/context on capture error so subsequent attempt recovers
      await this.cleanup();
      throw error;
    }
  }

  public async cleanup(): Promise<void> {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close().catch(() => {});
      }
    } finally {
      this.page = null;
    }

    try {
      if (this.context) {
        await this.context.close().catch(() => {});
      }
    } finally {
      this.context = null;
    }

    try {
      if (this.browser) {
        await this.browser.close().catch(() => {});
      }
    } finally {
      this.browser = null;
    }
  }

  public async close(): Promise<void> {
    await this.cleanup();
  }
}
