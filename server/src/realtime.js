import { Dish, toClientDoc } from './models/Dish.js';
import { logger } from './logger.js';

/**
 * Wire real-time dish updates to all connected Socket.IO clients.
 *
 * Primary path: MongoDB Change Streams — fires for ANY write, including direct
 * edits to the database that bypass our API (this is what the bonus asks for).
 *
 * Fallback path: if change streams are unavailable (e.g. a standalone mongod
 * with no replica set), poll the collection on an interval and diff snapshots.
 * Either way the dashboard reacts to out-of-band changes.
 */
export function startRealtime(io, { pollIntervalMs = 2000 } = {}) {
  try {
    const changeStream = Dish.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', (change) => {
      switch (change.operationType) {
        case 'insert':
        case 'update':
        case 'replace': {
          const doc = change.fullDocument;
          // A soft-deleted dish should disappear -> tell clients to resync.
          if (!doc || doc.deletedAt) {
            io.emit('dishes:resync');
            break;
          }
          io.emit('dish:updated', toClientDoc(doc));
          break;
        }
        case 'delete': {
          // documentKey holds the deleted doc's _id only; broadcast a re-sync hint.
          io.emit('dishes:resync');
          break;
        }
        default:
          break;
      }
    });

    changeStream.on('error', (err) => {
      logger.warn({ err: err.message }, '[realtime] change stream error, switching to polling');
      changeStream.close().catch(() => {});
      startPolling(io, pollIntervalMs);
    });

    logger.info('[realtime] using MongoDB change streams');
    return;
  } catch (err) {
    logger.warn({ err: err.message }, '[realtime] change streams unavailable, using polling');
    startPolling(io, pollIntervalMs);
  }
}

/**
 * Polling fallback: compare a snapshot of (dishId -> isPublished) every interval
 * and emit updates for any dish whose published state changed.
 */
function startPolling(io, intervalMs) {
  let snapshot = new Map();
  let primed = false;

  setInterval(async () => {
    try {
      const dishes = await Dish.find({ deletedAt: null }).lean();
      const next = new Map();

      for (const d of dishes) {
        next.set(d.dishId, d.isPublished);
        // After the first pass, emit any dish whose state differs from last seen.
        if (primed && snapshot.get(d.dishId) !== d.isPublished) {
          io.emit('dish:updated', toClientDoc(d));
        }
      }

      // Detect deletions after priming.
      if (primed) {
        for (const id of snapshot.keys()) {
          if (!next.has(id)) io.emit('dishes:resync');
        }
      }

      snapshot = next;
      primed = true;
    } catch (err) {
      logger.error({ err: err.message }, '[realtime] poll error');
    }
  }, intervalMs);

  logger.info(`[realtime] polling every ${intervalMs}ms`);
}
