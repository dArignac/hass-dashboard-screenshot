import { describe, it, expect, vi, afterEach } from 'vitest';
import { CaptureScheduler } from '../src/scheduler.js';

describe('Scheduler Module', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('triggers task immediately on start and periodically after interval', async () => {
    vi.useFakeTimers();

    let callCount = 0;
    const task = vi.fn().mockImplementation(async () => {
      callCount++;
    });

    const scheduler = new CaptureScheduler({
      intervalSeconds: 10,
      task,
    });

    scheduler.start(true);
    expect(scheduler.isRunning()).toBe(true);

    // Initial run
    await Promise.resolve();
    expect(callCount).toBe(1);

    // Advance 10 seconds
    vi.advanceTimersByTime(10000);
    await Promise.resolve();
    expect(callCount).toBe(2);

    // Advance another 10 seconds
    vi.advanceTimersByTime(10000);
    await Promise.resolve();
    expect(callCount).toBe(3);

    await scheduler.stop();
    expect(scheduler.isRunning()).toBe(false);

    // Verify no further calls after stop
    vi.advanceTimersByTime(20000);
    await Promise.resolve();
    expect(callCount).toBe(3);
  });

  it('handles task errors gracefully via onError callback without crashing', async () => {
    vi.useFakeTimers();

    const errorLog: string[] = [];
    let attempts = 0;

    const failingTask = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('Network timeout reaching Home Assistant');
      }
      return;
    });

    const scheduler = new CaptureScheduler({
      intervalSeconds: 5,
      task: failingTask,
      onError: (err) => {
        errorLog.push((err as Error).message);
      },
    });

    scheduler.start(true);
    await Promise.resolve();

    expect(attempts).toBe(1);
    expect(errorLog).toEqual(['Network timeout reaching Home Assistant']);
    expect(scheduler.isRunning()).toBe(true);

    // Next tick recovers successfully
    vi.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(attempts).toBe(2);
    expect(errorLog.length).toBe(1);

    await scheduler.stop();
  });

  it('prevents concurrent executions if previous run is still executing', async () => {
    let isFirst = true;
    let resolveFirstTask!: () => void;
    let callCount = 0;

    const taskWithDelay = vi.fn().mockImplementation(async () => {
      callCount++;
      if (isFirst) {
        isFirst = false;
        await new Promise<void>((resolve) => {
          resolveFirstTask = resolve;
        });
      }
    });

    const scheduler = new CaptureScheduler({
      intervalSeconds: 5,
      task: taskWithDelay,
    });

    // Start first trigger
    const p1 = scheduler.triggerNow();
    expect(callCount).toBe(1);

    // Second trigger while first is still pending
    await scheduler.triggerNow();
    expect(callCount).toBe(1); // Should not have triggered second execution

    // Complete first task
    resolveFirstTask();
    await p1;

    // Trigger after first completes
    await scheduler.triggerNow();
    expect(callCount).toBe(2);

    await scheduler.stop();
  });
});
