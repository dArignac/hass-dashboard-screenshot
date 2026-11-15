import { z } from 'zod';

const booleanPreprocessor = z.preprocess((val) => {
  if (val === undefined || val === '') return undefined;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }
  return val;
}, z.boolean().default(true));

export const ConfigSchema = z.object({
  haUrl: z.string({ required_error: 'HA_URL is required' })
    .url('HA_URL must be a valid URL (e.g. http://homeassistant.local:8123)')
    .transform((url) => url.replace(/\/+$/, '')),
  haToken: z.string({ required_error: 'HA_TOKEN is required' })
    .min(1, 'HA_TOKEN is required and cannot be empty'),
  dashboardPath: z.string().default('lovelace/0').transform((p) => p.replace(/^\/+/, '')),
  viewportWidth: z.coerce.number().int().positive().default(1920),
  viewportHeight: z.coerce.number().int().positive().default(1080),
  intervalSeconds: z.coerce.number().int().min(1).default(60),
  renderDelaySeconds: z.coerce.number().int().min(0).default(3),
  port: z.coerce.number().int().positive().default(8080),
  host: z.string().default('0.0.0.0'),
  hideHeaderAndSidebar: booleanPreprocessor,
  imageFormat: z.enum(['png', 'jpeg']).default('png'),
});

export type Config = z.infer<typeof ConfigSchema>;

const ENV_KEY_MAP: Record<string, string> = {
  haUrl: 'HA_URL',
  haToken: 'HA_TOKEN',
  dashboardPath: 'DASHBOARD_PATH',
  viewportWidth: 'VIEWPORT_WIDTH',
  viewportHeight: 'VIEWPORT_HEIGHT',
  intervalSeconds: 'SCREENSHOT_INTERVAL_SECONDS',
  renderDelaySeconds: 'RENDER_DELAY_SECONDS',
  port: 'PORT',
  host: 'HOST',
  hideHeaderAndSidebar: 'HIDE_HEADER_AND_SIDEBAR',
  imageFormat: 'IMAGE_FORMAT',
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const raw = {
    haUrl: env.HA_URL,
    haToken: env.HA_TOKEN,
    dashboardPath: env.DASHBOARD_PATH,
    viewportWidth: env.VIEWPORT_WIDTH,
    viewportHeight: env.VIEWPORT_HEIGHT,
    intervalSeconds: env.SCREENSHOT_INTERVAL_SECONDS,
    renderDelaySeconds: env.RENDER_DELAY_SECONDS,
    port: env.PORT,
    host: env.HOST,
    hideHeaderAndSidebar: env.HIDE_HEADER_AND_SIDEBAR,
    imageFormat: env.IMAGE_FORMAT,
  };

  const parsed = ConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => {
        const field = String(issue.path[0]);
        const envName = ENV_KEY_MAP[field] || field;
        return `[${envName}]: ${issue.message}`;
      })
      .join(', ');
    throw new Error(`Invalid configuration: ${errorMessages}`);
  }

  return parsed.data;
}
