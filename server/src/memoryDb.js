let replSet = null;

/**
 * Start an in-memory MongoDB as a single-node replica set.
 * A replica set is required for change streams, so the real-time bonus works
 * with zero external setup (no Docker, no system MongoDB install).
 * Data is ephemeral — the server auto-seeds on startup.
 *
 * `mongodb-memory-server` is a devDependency and is imported lazily so that
 * production hosts (which install only `dependencies` and provide MONGODB_URI)
 * never need it.
 */
export async function startMemoryMongo() {
  const { MongoMemoryReplSet } = await import('mongodb-memory-server');
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  return replSet.getUri('dishdb');
}

export async function stopMemoryMongo() {
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
}
