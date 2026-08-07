import mongoose from 'mongoose';
import { connectMongo } from '../config/db.js';
import { seedUsers, DEFAULT_PASSWORD } from './user.seed.js';
import { seedVenues } from './venue.seed.js';
import { seedEvents } from './event.seed.js';
import { seedRegistrations } from './registration.seed.js';


async function run() {
  await connectMongo();

  const users = await seedUsers();
  const venues = await seedVenues();
  const events = await seedEvents(users, venues);
  await seedRegistrations(users, events);

  console.log('\n[seed] done.\n');
  console.log(`Password for every account below: ${DEFAULT_PASSWORD}\n`);
  console.log('  organizer : organizer@eventhub.dev   (owns Intro to Node.js, Advanced MongoDB, Elasticsearch Deep Dive, Vue 3 Workshop)');
  console.log('  organizer : organizer2@eventhub.dev  (owns Jazz Night, Startup Pitch Meetup — use to test cross-owner 403s)');
  console.log('  attendee  : attendee@eventhub.dev');
  console.log('  attendee  : attendee2@eventhub.dev');
  console.log('  attendee  : attendee3@eventhub.dev');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
