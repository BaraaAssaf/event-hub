import { Event } from '../models/Event.model.js';

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(18, 0, 0, 0);
  return date;
}

const EXTRA_EVENT_TEMPLATES = [
  { title: 'React Patterns Night', description: 'Hooks, composition and performance patterns in modern React.', categories: ['tech', 'frontend'], price: 24.99 },
  { title: 'GraphQL Basics', description: 'Schemas, resolvers and client queries with Apollo.', categories: ['tech', 'api'], price: 19.99 },
  { title: 'Docker for Devs', description: 'Containers, Compose and local multi-service workflows.', categories: ['tech', 'devops'], price: 29.99 },
  { title: 'Kubernetes 101', description: 'Pods, services and deployments for first-time cluster users.', categories: ['tech', 'devops'], price: 39.99 },
  { title: 'TypeScript Deep Dive', description: 'Generics, utility types and strict-mode patterns.', categories: ['tech', 'workshop'], price: 34.99 },
  { title: 'Redis Caching Lab', description: 'Caching strategies, TTLs and pub/sub with Redis.', categories: ['tech', 'database'], price: 22.5 },
  { title: 'Postgres Tuning', description: 'Indexes, EXPLAIN plans and connection pooling.', categories: ['tech', 'database'], price: 27.99 },
  { title: 'API Security Clinic', description: 'Authn, authz, rate limits and common API threats.', categories: ['tech', 'security'], price: 44.99 },
  { title: 'OpenAPI Workshop', description: 'Design-first APIs with OpenAPI and generated clients.', categories: ['tech', 'api'], price: 18 },
  { title: 'WebSockets Live', description: 'Realtime chat, rooms and scaling socket servers.', categories: ['tech', 'workshop'], price: 21.99 },
  { title: 'CSS Layout Mastery', description: 'Flex, Grid and container queries for production UIs.', categories: ['tech', 'frontend'], price: 15 },
  { title: 'Accessibility Audit', description: 'WCAG checks, keyboard flows and screen-reader testing.', categories: ['tech', 'frontend'], price: 12.5 },
  { title: 'Product Design Jam', description: 'Rapid wireframes and critique sessions for PMs and designers.', categories: ['design', 'workshop'], price: 20 },
  { title: 'Figma Components', description: 'Design systems, variants and auto-layout tips.', categories: ['design'], price: 17.99 },
  { title: 'UX Research Roundtable', description: 'Interview scripts, affinity mapping and insights.', categories: ['design', 'research'], price: 0 },
  { title: 'Indie Maker Meetup', description: 'Ship stories, metrics and soft launches from indie builders.', categories: ['business', 'networking'], price: 0 },
  { title: 'SaaS Pricing Clinic', description: 'Packaging, free trials and conversion levers for SaaS.', categories: ['business'], price: 25 },
  { title: 'Investor Office Hours', description: 'Early-stage founders get live feedback on decks.', categories: ['business', 'networking'], price: 10 },
  { title: 'Marketing Analytics Lab', description: 'Funnel metrics, attribution and cohort analysis.', categories: ['business', 'marketing'], price: 28 },
  { title: 'Content Strategy Night', description: 'Editorial calendars and distribution playbooks.', categories: ['marketing'], price: 14.99 },
  { title: 'Acoustic Open Mic', description: 'Bring a song or poem and share the stage.', categories: ['music'], price: 8 },
  { title: 'Electronic Beats Night', description: 'Local DJs and live electronic sets downtown.', categories: ['music'], price: 18 },
  { title: 'Choir Showcase', description: 'Community choirs perform a short evening set.', categories: ['music'], price: 12 },
  { title: 'Film Club: Noir', description: 'Screening plus discussion of classic noir cinema.', categories: ['film', 'community'], price: 9 },
  { title: 'Documentary Night', description: 'Two short docs and a Q&A with the filmmakers.', categories: ['film'], price: 11 },
  { title: 'Comedy Open Mic', description: 'Stand-up slots for new and returning comics.', categories: ['comedy', 'community'], price: 10 },
  { title: 'Board Game Marathon', description: 'Tables for strategy, party and co-op games all evening.', categories: ['community', 'games'], price: 5 },
  { title: 'Chess Blitz Tournament', description: 'Rapid rounds with prizes for top boards.', categories: ['games', 'community'], price: 7.5 },
  { title: 'Photography Walk', description: 'Golden-hour street photography with peer critique.', categories: ['art', 'outdoors'], price: 0 },
  { title: 'Watercolor Studio', description: 'Guided watercolor session for beginners.', categories: ['art', 'workshop'], price: 22 },
  { title: 'Poetry Slam', description: 'Timed readings judged by the audience.', categories: ['community', 'art'], price: 6 },
  { title: 'Book Club: Sci-Fi', description: 'Monthly discussion of a classic science-fiction novel.', categories: ['community', 'books'], price: 0 },
  { title: 'Language Exchange Cafe', description: 'Practice conversation in mixed language groups.', categories: ['community', 'education'], price: 0 },
  { title: 'Career Mentorship Night', description: 'Speed mentorship with senior engineers and PMs.', categories: ['career', 'networking'], price: 0 },
  { title: 'Resume Review Lab', description: 'Peer and mentor critiques of resumes and LinkedIn.', categories: ['career'], price: 8 },
  { title: 'Interview Prep Dojo', description: 'Whiteboard practice and behavioral story drills.', categories: ['career', 'tech'], price: 16 },
  { title: 'Data Viz Workshop', description: 'Charts that tell a story with D3 and Vega-Lite.', categories: ['tech', 'data'], price: 26 },
  { title: 'Python for Data', description: 'Pandas, notebooks and tidy analysis workflows.', categories: ['tech', 'data'], price: 31 },
  { title: 'ML Model Ops Intro', description: 'Packaging, monitoring and rolling out ML models.', categories: ['tech', 'ml'], price: 42 },
  { title: 'Prompt Engineering Lab', description: 'Practical prompting patterns for product features.', categories: ['tech', 'ai'], price: 23 },
  { title: 'Observability Clinic', description: 'Logs, metrics and traces for healthier services.', categories: ['tech', 'devops'], price: 33 },
  { title: 'CI/CD Pipeline Night', description: 'GitHub Actions, caching and deploy gates.', categories: ['tech', 'devops'], price: 27 },
  { title: 'Mobile Flutter Intro', description: 'Widgets, state and shipping a first Flutter app.', categories: ['tech', 'mobile'], price: 24 },
  { title: 'iOS SwiftUI Lab', description: 'Declarative UI and navigation in SwiftUI.', categories: ['tech', 'mobile'], price: 29 },
  { title: 'Android Compose Night', description: 'Jetpack Compose layouts and theming.', categories: ['tech', 'mobile'], price: 28 },
  { title: 'Green Tech Meetup', description: 'Sustainability ideas for software and hardware teams.', categories: ['tech', 'community'], price: 0 },
  { title: 'Hackathon Kickoff', description: 'Form teams, pitch ideas and set weekend goals.', categories: ['tech', 'networking'], price: 0 },
  { title: 'Women in Tech Mixer', description: 'Networking and lightning talks from women leaders.', categories: ['community', 'networking'], price: 0 },
  { title: 'Founders Breakfast', description: 'Casual morning meetup for local founders.', categories: ['business', 'networking'], price: 12 },
];

export async function seedEvents({ organizer, organizer2 }, { grandHall, techPark, riverside, sunset }) {
  await Event.deleteMany({});

  const venues = [grandHall, techPark, riverside, sunset];
  const organizers = [organizer, organizer2];

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

  const extras = EXTRA_EVENT_TEMPLATES.map((template, index) => {
    const venue = venues[index % venues.length];
    const owner = organizers[index % organizers.length];
    return {
      title: template.title,
      description: template.description,
      startsAt: daysFromNow(2 + index),
      price: template.price,
      venue: venue._id,
      organizer: owner._id,
      categories: template.categories,
    };
  });

  await Event.insertMany(extras);

  console.log(`[seed] events: ${await Event.countDocuments()}`);

  return { nodeIntro, mongoAdvanced, esDeepDive, vueWorkshop, jazzNight, startupPitch };
}
