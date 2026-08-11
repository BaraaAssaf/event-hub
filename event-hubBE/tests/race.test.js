import mongoose from 'mongoose';
import { connectMongo } from '../src/config/db.js';
import { User } from '../src/models/User.model.js';
import { Venue } from '../src/models/Venue.model.js';
import { Event } from '../src/models/Event.model.js';
import { Registration } from '../src/models/Registration.model.js';
import { registerForEvent, cancelRegistration } from '../src/services/registration.service.js';
import { hashPassword } from '../src/utils/password.js';

const SEATS = 3;
const CONTENDERS = 12;

let venue;
let event;
let users = [];

beforeAll(async () => {
  await connectMongo({ retries: 3 });

  venue = await Venue.create({
    name: 'Race Test Venue',
    city: 'Testville',
    address: '1 Race St',
    capacity: SEATS,
  });

  event = await Event.create({
    title: 'Race Test Event',
    description: 'Used to prove the last-seat race condition is handled.',
    startsAt: new Date(Date.now() + 86_400_000),
    price: 0,
    venue: venue._id,
    organizer: (await User.findOne({ role: 'organizer' }))._id,
  });

  const passwordHash = await hashPassword('Password123!');
  users = await User.create(
    Array.from({ length: CONTENDERS }, (unused, i) => ({
      name: `Racer ${i}`,
      email: `racer${i}.${Date.now()}@eventhub.test`,
      passwordHash,
      role: 'attendee',
    }))
  );
});

afterAll(async () => {
  await Registration.deleteMany({ event: event._id });
  await Event.deleteOne({ _id: event._id });
  await Venue.deleteOne({ _id: venue._id });
  await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
  await mongoose.disconnect();
});

describe('registration race conditions', () => {
  test(`${CONTENDERS} people race for ${SEATS} seats — exactly ${SEATS} win`, async () => {
    const results = await Promise.allSettled(
      users.map((user) =>
        registerForEvent({ userId: user._id, eventId: event._id, ticketCount: 1 })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const rejectedWith409 = results.filter(
      (r) => r.status === 'rejected' && r.reason.statusCode === 409
    ).length;

    const confirmed = await Registration.countDocuments({
      event: event._id,
      status: 'confirmed',
    });
    const { seatsTaken } = await Event.findById(event._id);

    expect(succeeded).toBe(SEATS);
    expect(rejectedWith409).toBe(CONTENDERS - SEATS);
    expect(confirmed).toBe(SEATS);
    expect(seatsTaken).toBe(SEATS);
  });

  test('cancelling releases a seat for the next person', async () => {
    const winner = await Registration.findOne({ event: event._id, status: 'confirmed' });
    await cancelRegistration({ userId: winner.user, eventId: event._id });

    const stillHoldingSeats = new Set(
      (await Registration.find({ event: event._id, status: 'confirmed' }).distinct('user')).map(
        String
      )
    );
    const candidate = users.find((user) => !stillHoldingSeats.has(String(user._id)));
    expect(candidate).toBeTruthy();

    await registerForEvent({ userId: candidate._id, eventId: event._id, ticketCount: 1 });

    const confirmed = await Registration.countDocuments({
      event: event._id,
      status: 'confirmed',
    });
    expect(confirmed).toBe(SEATS);
  });

  test('the same person cannot register twice', async () => {
    const existing = await Registration.findOne({ event: event._id, status: 'confirmed' });

    await expect(
      registerForEvent({ userId: existing.user, eventId: event._id, ticketCount: 1 })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
