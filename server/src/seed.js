import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { seedFromFile } from './seedData.js';
import { startMemoryMongo, stopMemoryMongo } from './memoryDb.js';

// Public DNS first so Atlas SRV lookups work behind strict resolvers.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
} catch {
  /* non-fatal */
}

/**
 * Standalone seeding CLI. Useful when pointing at a persistent MongoDB.
 * (With the default in-memory DB, seeding happens automatically on server start,
 * so this is only needed for an external MONGODB_URI.)
 */
async function seed() {
  let uri = process.env.MONGODB_URI;
  const useMemory = !uri;
  if (useMemory) uri = await startMemoryMongo();

  await connectDB(uri);
  const r = await seedFromFile();
  console.log(
    `[seed] upserted ${r.upserted}, modified ${r.modified}. Collection now has ${r.total} dishes.`
  );

  await mongoose.disconnect();
  if (useMemory) await stopMemoryMongo();
  console.log('[seed] done.');
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
