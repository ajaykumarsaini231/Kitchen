// Vercel serverless entry for the API.
// Vercel's @vercel/node runtime uses this file's DEFAULT export as the request
// handler. We delegate to the Express app after ensuring a (cached) DB connection.
//
// NOTE: Socket.IO / MongoDB change streams are NOT started here — Vercel
// serverless functions can't hold persistent connections. REST works fully;
// real-time live updates require a persistent host (Render/Railway). MONGODB_URI
// (Atlas) is REQUIRED — the in-memory fallback can't run on serverless.
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/db.js';
import { ensureSeeded } from '../src/seedData.js';
import { ensureUsersSeeded } from '../src/seedUsers.js';

const app = createApp();

let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error(
          'MONGODB_URI is required on Vercel (the in-memory DB cannot run in a serverless function).'
        );
      }
      if (mongoose.connection.readyState !== 1) {
        await connectDB(uri);
      }
      await ensureSeeded();
      await ensureUsersSeeded();
    })().catch((err) => {
      readyPromise = null; // allow retry on next invocation
      throw err;
    });
  }
  return readyPromise;
}

export default async function handler(req, res) {
  try {
    await ensureReady();
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message, code: 'DB_INIT_FAILED' }));
    return;
  }
  return app(req, res);
}
