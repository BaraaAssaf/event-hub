import mongoose from 'mongoose';
import { connectMongo } from '../config/db.js';
import { connectElasticsearch } from '../config/es.js';
import { Event } from '../models/Event.model.js';
import '../models/Venue.model.js';
import '../models/User.model.js';
import { recreateEventsIndex, bulkIndexEvents } from './event.search.js';

const BATCH_SIZE = 500;


async function run() {
  await connectMongo();

  const esReady = await connectElasticsearch({ retries: 5 });
  if (!esReady) {
    console.error('[reindex] Elasticsearch is unreachable — nothing was reindexed');
    process.exit(1);
  }

  console.log('[reindex] recreating index with the explicit mapping...');
  await recreateEventsIndex();

  const total = await Event.countDocuments();
  let indexed = 0;

  for (let skip = 0; skip < total; skip += BATCH_SIZE) {
    const events = await Event.find()
      .sort({ _id: 1 })
      .skip(skip)
      .limit(BATCH_SIZE)
      .populate('venue')
      .populate('organizer');

    indexed += await bulkIndexEvents(events);
    console.log(`[reindex] indexed ${indexed}/${total}`);
  }

  console.log(`[reindex] done — ${indexed} event(s) indexed`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[reindex] failed', err);
  process.exit(1);
});
