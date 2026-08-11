import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectMongo } from '../src/config/db.js';
import { connectElasticsearch } from '../src/config/es.js';
import { ensureEventsIndex } from '../src/search/event.search.js';
import { User } from '../src/models/User.model.js';
import { Venue } from '../src/models/Venue.model.js';
import { Event } from '../src/models/Event.model.js';
import { Registration } from '../src/models/Registration.model.js';

let server;
let baseUrl;
const created = { users: [], venues: [], events: [] };

const unique = Date.now();
const emails = {
  organizer: `api.org.${unique}@eventhub.test`,
  otherOrganizer: `api.org2.${unique}@eventhub.test`,
  attendee: `api.att.${unique}@eventhub.test`,
  attendee2: `api.att2.${unique}@eventhub.test`,
};
const tokens = {};

async function api(method, path, { body, token } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function registerUser(email, role) {
  const res = await api('POST', '/api/auth/register', {
    body: { name: `Test ${role}`, email, password: 'Password123!', role },
  });
  expect(res.status).toBe(201);
  created.users.push(res.body.user._id);
  return res.body.token;
}

beforeAll(async () => {
  await connectMongo({ retries: 3 });
  if (await connectElasticsearch({ retries: 3 })) {
    await ensureEventsIndex();
  }

  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  tokens.organizer = await registerUser(emails.organizer, 'organizer');
  tokens.otherOrganizer = await registerUser(emails.otherOrganizer, 'organizer');
  tokens.attendee = await registerUser(emails.attendee, 'attendee');
  tokens.attendee2 = await registerUser(emails.attendee2, 'attendee');
});

afterAll(async () => {
  await Registration.deleteMany({ event: { $in: created.events } });
  await Event.deleteMany({ _id: { $in: created.events } });
  await Venue.deleteMany({ _id: { $in: created.venues } });
  await User.deleteMany({ _id: { $in: created.users } });
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

describe('auth', () => {
  test('login returns a token and never the password hash', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: emails.organizer, password: 'Password123!' },
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('bad credentials are 401, bad input is 400', async () => {
    const wrongPassword = await api('POST', '/api/auth/login', {
      body: { email: emails.organizer, password: 'wrong' },
    });
    expect(wrongPassword.status).toBe(401);

    const badInput = await api('POST', '/api/auth/register', {
      body: { name: 'X', email: 'nope', password: '123', role: 'wizard' },
    });
    expect(badInput.status).toBe(400);
    expect(badInput.body.error.code).toBe('BAD_REQUEST');
    expect(badInput.body.error.details.length).toBeGreaterThanOrEqual(3);
  });

  test('a missing token is 401', async () => {
    expect((await api('GET', '/api/auth/me')).status).toBe(401);
  });
});

describe('venues', () => {
  test('only organizers can create, and a malformed id is 400', async () => {
    expect(
      (
        await api('POST', '/api/venues', {
          token: tokens.attendee,
          body: { name: 'Nope', city: 'X', address: 'Y', capacity: 5 },
        })
      ).status
    ).toBe(403);

    expect((await api('GET', '/api/venues/not-an-id')).status).toBe(400);
  });
});

describe('events: the full ownership and capacity lifecycle', () => {
  let venueId;
  let eventId;
  let eventRes;

  beforeAll(async () => {
    const venueRes = await api('POST', '/api/venues', {
      token: tokens.organizer,
      body: { name: `Test Venue ${unique}`, city: 'Testville', address: '1 Test St', capacity: 2 },
    });
    expect(venueRes.status).toBe(201);
    venueId = venueRes.body.venue._id;
    created.venues.push(venueId);

    eventRes = await api('POST', '/api/events', {
      token: tokens.organizer,
      body: {
        title: `Concurrency Workshop ${unique}`,
        description: 'An event created by the API test suite to verify the rules.',
        startsAt: '2027-01-01T10:00:00Z',
        price: 25,
        venue: venueId,
        categories: ['tech'],
      },
    });
    expect(eventRes.status).toBe(201);
    eventId = eventRes.body.event._id;
    created.events.push(eventId);
  });

  test('an attendee cannot create an event', async () => {
    const res = await api('POST', '/api/events', {
      token: tokens.attendee,
      body: {
        title: 'Not allowed',
        description: 'This should never be created.',
        startsAt: '2027-01-01T10:00:00Z',
        price: 0,
        venue: venueId,
      },
    });
    expect(res.status).toBe(403);
  });

  test('capacity comes from the venue, not the event', () => {
    expect(eventRes.body.event.capacity).toBe(2);
    expect(eventRes.body.event.seatsRemaining).toBe(2);
  });

  test('the detail endpoint populates venue and organizer', async () => {
    const res = await api('GET', `/api/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.event.venue.name).toBe(`Test Venue ${unique}`);
    expect(res.body.event.organizer.name).toBeTruthy();
    expect(res.body.event.organizer.passwordHash).toBeUndefined();
    expect(res.body.event.categories).toEqual(['tech']);
    expect(res.body.event.myRegistration).toBeUndefined();
  });

  test('the detail endpoint reports the caller own registration', async () => {
    const before = await api('GET', `/api/events/${eventId}`, { token: tokens.attendee });
    expect(before.body.event.myRegistration).toBeNull();

    await api('POST', `/api/events/${eventId}/register`, {
      token: tokens.attendee,
      body: { ticketCount: 1 },
    });
    const after = await api('GET', `/api/events/${eventId}`, { token: tokens.attendee });
    expect(after.body.event.myRegistration?.status).toBe('confirmed');

    await api('DELETE', `/api/events/${eventId}/register`, { token: tokens.attendee });
  });

  test('another organizer cannot update or delete it', async () => {
    expect(
      (
        await api('PUT', `/api/events/${eventId}`, {
          token: tokens.otherOrganizer,
          body: { price: 1 },
        })
      ).status
    ).toBe(403);
    expect(
      (await api('DELETE', `/api/events/${eventId}`, { token: tokens.otherOrganizer })).status
    ).toBe(403);
  });

  test('the owner can update it', async () => {
    const res = await api('PUT', `/api/events/${eventId}`, {
      token: tokens.organizer,
      body: { price: 12.5 },
    });
    expect(res.status).toBe(200);
    expect(res.body.event.price).toBe(12.5);
    expect(res.body.event.categories).toEqual(['tech']);
  });

  test('rejects creating an event in the past', async () => {
    const res = await api('POST', '/api/events', {
      token: tokens.organizer,
      body: {
        title: 'Yesterday event',
        description: 'This start time is already in the past.',
        startsAt: new Date(Date.now() - 86_400_000).toISOString(),
        price: 0,
        venue: venueId,
      },
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/future/i);
  });

  test('the owner can add and replace categories', async () => {
    const added = await api('PUT', `/api/events/${eventId}`, {
      token: tokens.organizer,
      body: { categories: ['tech', 'workshop', 'tech'] },
    });
    expect(added.status).toBe(200);
    expect(added.body.event.categories).toEqual(['tech', 'workshop']);

    const replaced = await api('PUT', `/api/events/${eventId}`, {
      token: tokens.organizer,
      body: { categories: 'music, networking' },
    });
    expect(replaced.status).toBe(200);
    expect(replaced.body.event.categories).toEqual(['music', 'networking']);
  });

  test('a venue with upcoming events cannot be deleted', async () => {
    const res = await api('DELETE', `/api/venues/${venueId}`, { token: tokens.organizer });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/upcoming event/i);
  });

  test('registering is capped by the venue capacity', async () => {
    expect(
      (await api('POST', `/api/events/${eventId}/register`, { body: { ticketCount: 1 } })).status
    ).toBe(401);

    expect(
      (
        await api('POST', `/api/events/${eventId}/register`, {
          token: tokens.attendee,
          body: { ticketCount: 1 },
        })
      ).status
    ).toBe(201);

    expect(
      (
        await api('POST', `/api/events/${eventId}/register`, {
          token: tokens.attendee,
          body: { ticketCount: 1 },
        })
      ).status
    ).toBe(409);

    expect(
      (
        await api('POST', `/api/events/${eventId}/register`, {
          token: tokens.attendee2,
          body: { ticketCount: 1 },
        })
      ).status
    ).toBe(201);

    const full = await api('POST', `/api/events/${eventId}/register`, {
      token: tokens.organizer,
      body: { ticketCount: 1 },
    });
    expect(full.status).toBe(409);
    expect(full.body.error.message).toMatch(/sold out|seat/i);
  });

  test('only the owner can list attendees', async () => {
    expect(
      (await api('GET', `/api/events/${eventId}/attendees`, { token: tokens.otherOrganizer }))
        .status
    ).toBe(403);

    const res = await api('GET', `/api/events/${eventId}/attendees`, {
      token: tokens.organizer,
    });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items[0].user.email).toBeTruthy();
  });

  test('cancelling releases the seat', async () => {
    expect(
      (await api('DELETE', `/api/events/${eventId}/register`, { token: tokens.attendee })).status
    ).toBe(200);
    expect(
      (await api('DELETE', `/api/events/${eventId}/register`, { token: tokens.attendee })).status
    ).toBe(404);
    expect(
      (
        await api('POST', `/api/events/${eventId}/register`, {
          token: tokens.organizer,
          body: { ticketCount: 1 },
        })
      ).status
    ).toBe(201);
  });

  test('the organizer dashboard reports counts and remaining seats', async () => {
    const res = await api('GET', '/api/me/events', { token: tokens.organizer });
    expect(res.status).toBe(200);
    const row = res.body.items.find((item) => item._id === eventId);
    expect(row.registrationCount).toBe(2);
    expect(row.remainingSeats).toBe(0);

    expect((await api('GET', '/api/me/events', { token: tokens.attendee })).status).toBe(403);
  });

  test('my registrations include the event and its venue', async () => {
    const res = await api('GET', '/api/me/registrations', { token: tokens.attendee2 });
    expect(res.status).toBe(200);
    const row = res.body.items.find((item) => item.event?._id === eventId);
    expect(row).toBeTruthy();
    expect(row.event.venue.name).toBe(`Test Venue ${unique}`);
  });

  test('the event is searchable, with highlighting', async () => {
    const res = await api('GET', `/api/events/search?q=Concurrency`);
    expect(res.status).toBe(200);
    const hit = res.body.items.find((item) => item.id === eventId);
    expect(hit).toBeTruthy();
    expect(hit.city).toBe('Testville');
    expect(hit.highlight.title.join(' ')).toMatch(/<em>/);
  });

  test('search filters and sorting apply', async () => {
    const byCity = await api('GET', '/api/events/search?city=Testville');
    expect(byCity.body.total).toBeGreaterThanOrEqual(1);

    const byPrice = await api('GET', '/api/events/search?minPrice=1000');
    expect(byPrice.body.total).toBe(0);

    const bad = await api('GET', '/api/events/search?minPrice=100&maxPrice=1');
    expect(bad.status).toBe(400);

    const cheapest = await api('GET', '/api/events/search?sort=cheapest&limit=2');
    expect(cheapest.status).toBe(200);
    expect(cheapest.body.items.length).toBeLessThanOrEqual(2);
  });

  test('deleting the event removes its registrations and its search document', async () => {
    expect(
      (await api('DELETE', `/api/events/${eventId}`, { token: tokens.organizer })).status
    ).toBe(204);

    expect((await api('GET', `/api/events/${eventId}`)).status).toBe(404);
    expect(await Registration.countDocuments({ event: eventId })).toBe(0);

    const search = await api('GET', `/api/events/search?q=Concurrency`);
    expect(search.body.items.filter((item) => item.id === eventId)).toHaveLength(0);
  });

  test('the venue can be deleted once it has no events', async () => {
    expect(
      (await api('DELETE', `/api/venues/${venueId}`, { token: tokens.organizer })).status
    ).toBe(204);
  });
});

describe('stats', () => {
  test('top venues is ordered by confirmed registrations', async () => {
    const res = await api('GET', '/api/stats/top-venues');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(5);

    const counts = res.body.items.map((item) => item.registrations);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));

    if (res.body.items.length > 0) {
      expect(res.body.items[0].venue.name).toBeTruthy();
    }
  });
});

describe('errors', () => {
  test('unknown routes return the standard error shape', async () => {
    const res = await api('GET', '/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
