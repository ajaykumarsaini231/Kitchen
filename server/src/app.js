import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { logger } from './logger.js';
import { dishesRouter } from './routes/dishes.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter } from './routes/orders.js';
import { reservationsRouter } from './routes/reservations.js';
import { openapiSpec } from './openapi.js';

/**
 * Build the Express app (no DB connection, no listen) so it can be imported
 * directly by tests as well as the server bootstrap.
 */
export function createApp() {
  const app = express();
  const isTest = process.env.NODE_ENV === 'test';

  const origins = (
    process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:3000'
  )
    .split(',')
    .map((s) => s.trim());

  app.use(helmet());
  app.use(cors({ origin: origins }));
  app.use(compression());
  app.use(express.json());
  // autoLogging off: don't print a line for every request (keeps the terminal
  // quiet). Errors are still logged via the central handler / logger.
  if (!isTest) app.use(pinoHttp({ logger, autoLogging: false }));

  // Rate limiting (skipped under test to keep suites deterministic).
  if (!isTest) {
    app.use(
      '/api/auth/login',
      rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })
    );
    app.use(
      '/api',
      rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false })
    );
  }

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/ready', (_req, res) => res.json({ ready: true }));

  // API docs.
  app.get('/api/openapi.json', (_req, res) => res.json(openapiSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // Routes + versioned aliases.
  app.use('/api/auth', authRouter);
  app.use('/api/dishes', dishesRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/reservations', reservationsRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/dishes', dishesRouter);
  app.use('/api/v1/orders', ordersRouter);
  app.use('/api/v1/reservations', reservationsRouter);

  // Consistent error envelope { error, code }.
  app.use((err, _req, res, _next) => {
    logger.error({ err }, 'api error');
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
    });
  });

  return app;
}
