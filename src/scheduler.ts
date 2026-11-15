export type CaptureTask = () => Promise<void>;

export interface SchedulerOptions {
  intervalSeconds: number;
  task: CaptureTask;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
}

export class CaptureScheduler {
  private intervalSeconds: number;
  private task: CaptureTask;
  private timer: NodeJS.Timeout | null = null;
  private isExecuting: boolean = false;
  private isStopped: boolean = true;
  private onError?: (error: unknown) => void;
  private onSuccess?: () => void;

  constructor(options: SchedulerOptions) {
    this.intervalSeconds = options.intervalSeconds;
    this.task = options.task;
    this.onError = options.onError;
    this.onSuccess = options.onSuccess;
  }

  public async triggerNow(): Promise<void> {
    if (this.isExecuting) {
      console.warn('[Scheduler] Capture already in progress, skipping tick.');
      return;
    }

    this.isExecuting = true;
    try {
      await this.task();
      this.onSuccess?.();
    } catch (error) {
      if (this.onError) {
        this.onError(error);
      } else {
        console.error('[Scheduler] Capture job failed:', error instanceof Error ? error.message : String(error));
      }
    } finally {
      this.isExecuting = false;
    }
  }

  public start(runImmediately: boolean = true): void {
    if (!this.isStopped) {
      return;
    }
    this.isStopped = false;

    if (runImmediately) {
      void this.triggerNow();
    }

    this.timer = setInterval(() => {
      void this.triggerNow();
    }, this.intervalSeconds * 1000);
  }

  public async stop(): Promise<void> {
    this.isStopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isRunning(): boolean {
    return !this.isStopped;
  }
}
