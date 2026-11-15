export interface ScreenshotData {
  buffer: Buffer;
  mimeType: string;
  timestamp: Date;
}

export interface HealthStats {
  status: 'ok' | 'initializing';
  lastScreenshot: string | null;
  capturesTotal: number;
}

export class ScreenshotStorage {
  private buffer: Buffer | null = null;
  private mimeType: string = 'image/png';
  private lastScreenshot: Date | null = null;
  private capturesTotal: number = 0;

  constructor(defaultMimeType: string = 'image/png') {
    this.mimeType = defaultMimeType;
  }

  public setScreenshot(buffer: Buffer, mimeType: string = this.mimeType, timestamp: Date = new Date()): void {
    this.buffer = buffer;
    this.mimeType = mimeType;
    this.lastScreenshot = timestamp;
    this.capturesTotal += 1;
  }

  public getScreenshot(): ScreenshotData | null {
    if (!this.buffer || !this.lastScreenshot) {
      return null;
    }
    return {
      buffer: this.buffer,
      mimeType: this.mimeType,
      timestamp: this.lastScreenshot,
    };
  }

  public hasScreenshot(): boolean {
    return this.buffer !== null;
  }

  public getHealthStats(): HealthStats {
    return {
      status: this.buffer !== null ? 'ok' : 'initializing',
      lastScreenshot: this.lastScreenshot ? this.lastScreenshot.toISOString() : null,
      capturesTotal: this.capturesTotal,
    };
  }
}
