import 'dotenv/config';
import { z } from 'zod';
import { logger } from './logger.js';

// Validate environment on boot and fail fast on misconfiguration.
const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().optional(),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  JWT_SECRET: z.string().min(1).default('dev-secret-change-me'),
  JWT_EXPIRES: z.string().default('7d'),
  ADMIN_EMAIL: z.string().email().default('admin@metnmat.com'),
  ADMIN_PASSWORD: z.string().min(1).default('admin123'),
  VIEWER_EMAIL: z.string().email().default('viewer@metnmat.com'),
  VIEWER_PASSWORD: z.string().min(1).default('viewer123'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  logger.error(
    { issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) },
    'Invalid environment configuration — aborting'
  );
  process.exit(1);
}

export const config = parsed.data;
