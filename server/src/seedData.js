import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Dish } from './models/Dish.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Upsert all dishes from data/dishes.json. Idempotent (keyed by dishId).
 * Assumes mongoose is already connected.
 */
export async function seedFromFile() {
  const raw = await readFile(join(__dirname, 'data', 'dishes.json'), 'utf-8');
  const dishes = JSON.parse(raw);

  const ops = dishes.map((d) => ({
    updateOne: {
      filter: { dishId: String(d.dishId) },
      update: {
        $set: {
          dishId: String(d.dishId),
          dishName: d.dishName,
          imageUrl: d.imageUrl ?? '',
          description: d.description ?? '',
          isPublished: Boolean(d.isPublished),
          price: Number(d.price) || 0,
        },
      },
      upsert: true,
    },
  }));

  const result = await Dish.bulkWrite(ops);
  const total = await Dish.countDocuments();
  return { upserted: result.upsertedCount, modified: result.modifiedCount, total };
}

/**
 * Seed only if the collection is empty (used on server startup).
 */
export async function ensureSeeded() {
  const count = await Dish.countDocuments();
  if (count === 0) {
    const r = await seedFromFile();
    console.log(`[seed] auto-seeded ${r.total} dishes`);
  } else {
    console.log(`[seed] collection already has ${count} dishes, skipping`);
  }
}
