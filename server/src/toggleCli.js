import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { Dish } from './models/Dish.js';

// Match index.js DNS handling so Atlas SRV lookups work behind strict resolvers.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
} catch {
  /* non-fatal */
}

/**
 * CLI: flip a dish's isPublished directly in the database, bypassing the API.
 * This is a genuine out-of-band change — run it while the dashboard is open
 * and watch it react live (the server's change stream broadcasts it).
 *
 *   npm run toggle -- <dishId>
 *
 * Requires MONGODB_URI to point at the SAME database the server uses. (The
 * in-memory dev DB lives inside the server process and can't be reached from
 * a separate CLI, so set MONGODB_URI / use Atlas for this demo.)
 */
async function run() {
  const dishId = process.argv[2];
  if (!dishId) {
    console.error('Usage: npm run toggle -- <dishId>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      'MONGODB_URI is not set. Point it at the same DB the server uses ' +
        '(e.g. your Atlas URI) so this CLI and the server share data.'
    );
    process.exit(1);
  }

  await connectDB(uri);
  const updated = await Dish.findOneAndUpdate(
    { dishId },
    [{ $set: { isPublished: { $not: '$isPublished' } } }],
    { new: true }
  );

  if (!updated) {
    console.error(`Dish "${dishId}" not found.`);
  } else {
    console.log(
      `[toggle] dish ${dishId} -> isPublished=${updated.isPublished} ` +
        `(direct DB write; the open dashboard should react live)`
    );
  }

  await mongoose.disconnect();
  process.exit(updated ? 0 : 1);
}

run().catch((err) => {
  console.error('[toggle] failed:', err);
  process.exit(1);
});
