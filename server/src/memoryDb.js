import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet = null;

/**
 * Start an in-memory MongoDB as a single-node replica set.
 * A replica set is required for change streams, so the real-time bonus works
 * with zero external setup (no Docker, no system MongoDB install).
 * Data is ephemeral — the server auto-seeds on startup.
 */
export async function startMemoryMongo() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  return replSet.getUri('dishdb');
}

export async function stopMemoryMongo() {
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}
