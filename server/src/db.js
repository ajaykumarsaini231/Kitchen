import mongoose from 'mongoose';
import { logger } from './logger.js';

/**
 * Connect to MongoDB. Returns the mongoose connection once ready.
 */
let listenersAttached = false;

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);

  // Attach connection listeners only once (connectDB may be called twice during
  // the Atlas -> in-memory fallback).
  if (!listenersAttached) {
    listenersAttached = true;
    mongoose.connection.on('connected', () => logger.info('[db] connected'));
    mongoose.connection.on('disconnected', () => logger.warn('[db] disconnected'));
    // Connection errors are handled by the connect() caller / fallback; only
    // surface them at debug to avoid noisy expected blips.
    mongoose.connection.on('error', (err) =>
      logger.debug({ err: err.message }, '[db] connection error')
    );
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
}
