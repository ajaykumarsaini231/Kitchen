import 'dotenv/config';
import dns from 'node:dns';
import http from 'node:http';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import { connectDB } from './db.js';
import { createApp } from './app.js';
import { startRealtime } from './realtime.js';
import { ensureSeeded } from './seedData.js';
import { ensureUsersSeeded } from './seedUsers.js';
import { startMemoryMongo } from './memoryDb.js';
import { logger } from './logger.js';
import { config } from './config.js';
import { setIo } from './io.js';

// Public DNS first so Atlas SRV (mongodb+srv://) lookups work behind strict
// resolvers where Node's c-ares gets ECONNREFUSED from the system DNS.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
} catch {
  /* non-fatal */
}

const PORT = config.PORT;
const CLIENT_ORIGIN = config.CLIENT_ORIGIN.split(',').map((s) => s.trim());
const POLL_INTERVAL_MS = config.POLL_INTERVAL_MS;

// Survive transient driver/network errors (e.g. flaky TLS to Atlas) instead of
// crashing the whole process; mongoose auto-reconnects when the DB recovers.
process.on('unhandledRejection', (reason) =>
  logger.error({ reason: String(reason) }, 'unhandledRejection (continuing)')
);
process.on('uncaughtException', (err) =>
  logger.error({ err: err.message }, 'uncaughtException (continuing)')
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, { attempts = 3, delayMs = 2000, label = 'op' } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      logger.warn({ err: err.message, attempt: i }, `[${label}] retrying`);
      if (i < attempts) await sleep(delayMs);
    }
  }
  throw lastErr;
}

async function main() {
  // External MongoDB if MONGODB_URI is set; otherwise an in-memory replica set.
  // If the external DB is unreachable (e.g. Atlas IP not whitelisted / paused /
  // flaky network), automatically fall back to in-memory so the server ALWAYS
  // starts and the app keeps working for local dev/demos.
  let uri = config.MONGODB_URI;
  let usingMemory = false;

  if (!uri) {
    logger.info('no MONGODB_URI set — starting in-memory MongoDB replica set');
    uri = await startMemoryMongo();
    usingMemory = true;
  }

  try {
    await connectDB(uri);
  } catch (err) {
    if (usingMemory) throw err;
    logger.warn(
      { err: err.message },
      'external MongoDB unreachable — falling back to in-memory MongoDB'
    );
    await mongoose.disconnect().catch(() => {});
    uri = await startMemoryMongo();
    usingMemory = true;
    await connectDB(uri);
  }

  logger.info(usingMemory ? '[db] using in-memory MongoDB' : '[db] using external MongoDB');

  // Seeding can hit transient blips (e.g. Atlas primary re-election). Retry a
  // few times; if it still fails, start anyway — mongoose auto-reconnects and
  // queries recover once the DB is healthy.
  await withRetry(
    async () => {
      await ensureSeeded();
      await ensureUsersSeeded();
    },
    { attempts: 4, delayMs: 3000, label: 'seed' }
  ).catch((err) => logger.warn({ err: err.message }, '[seed] skipped after retries'));

  const app = createApp();
  const server = http.createServer(app);
  const io = new SocketServer(server, { cors: { origin: CLIENT_ORIGIN } });
  setIo(io);

  io.on('connection', (socket) => {
    logger.info({ id: socket.id }, 'ws client connected');
    socket.on('disconnect', () => logger.info({ id: socket.id }, 'ws client disconnected'));
  });

  startRealtime(io, { pollIntervalMs: POLL_INTERVAL_MS });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use — a server is already running. Stop it first.`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, () => logger.info(`API listening on http://localhost:${PORT}`));
}

main().catch((err) => {
  logger.error({ err }, 'startup failed');
  process.exit(1);
});
