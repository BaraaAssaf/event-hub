import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectMongo({ retries = 30, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri);
      console.log('[mongo] connected');
      return mongoose.connection;
    } catch (err) {
      console.warn(
        `[mongo] connection attempt ${attempt}/${retries} failed: ${err.message}`
      );
      if (attempt === retries) {
        throw new Error(`Could not connect to MongoDB after ${retries} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return undefined;
}

mongoose.connection.on('disconnected', () => {
  console.warn('[mongo] disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[mongo] error', err);
});
