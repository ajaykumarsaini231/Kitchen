import pino from 'pino';

// Structured JSON logger. Set LOG_LEVEL to control verbosity.
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});
