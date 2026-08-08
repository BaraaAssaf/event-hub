import { Event } from '../models/Event.model.js';

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(18, 0, 0, 0);
  return date;
}

export async function seedEvents({ organizer, organizer2 }, { grandHall, techPark, riverside, sunset }) {
  await Event.deleteMany({});

  const [nodeIntro, mongoAdvanced, esDeepDive, vueWorkshop, jazzNight, startupPitch] =
    await Event.create([
      {
        title: 'Intro to Node.js',
        description: 'A hands-on introduction to building APIs with Node.js and Express.',
        startsAt: daysFromNow(7),
        price: 0,
        venue: grandHall._id,
        organizer: organizer._id,
        categories: ['tech', 'workshop'],
      },
      {
        title: 'Advanced MongoDB',
        description: 'Aggregation pipelines, transactions and indexing strategies for production.',
        startsAt: daysFromNow(14),
        price: 49.99,
        venue: techPark._id,
        organizer: organizer._id,
        categories: ['tech', 'database'],
      },
      {
        title: 'Elasticsearch Deep Dive',
        description: 'Full text search, relevance tuning and aggregations with Elasticsearch.',
        startsAt: daysFromNow(21),
        price: 29.99,
        venue: riverside._id,
        organizer: organizer._id,
        categories: ['tech', 'search'],
      },
      {
        title: 'Vue 3 Workshop',
        description: 'Composition API, Pinia and Vue Router from the ground up.',
        startsAt: daysFromNow(10),
        price: 19.99,
        venue: sunset._id,
        organizer: organizer._id,
        categories: ['tech', 'frontend'],
      },
      {
        title: 'Jazz Night',
        description: 'An evening of live jazz in the heart of the city.',
        startsAt: daysFromNow(5),
        price: 15,
        venue: grandHall._id,
        organizer: organizer2._id,
        categories: ['music'],
      },
      {
        title: 'Startup Pitch Meetup',
        description: 'Local founders pitch their startups to a panel of investors.',
        startsAt: daysFromNow(3),
        price: 0,
        venue: techPark._id,
        organizer: organizer2._id,
        categories: ['business', 'networking'],
      },
    ]);

  console.log(`[seed] events: ${await Event.countDocuments()}`);

  return { nodeIntro, mongoAdvanced, esDeepDive, vueWorkshop, jazzNight, startupPitch };
}
