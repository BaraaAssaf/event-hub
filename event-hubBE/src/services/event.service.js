import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';
import { Venue } from '../models/Venue.model.js';
import { Registration } from '../models/Registration.model.js';
import { ApiError } from '../utils/ApiError.js';
import { indexEvent, removeEventFromIndex } from '../search/event.search.js';

const ORGANIZER_FIELDS = 'name email role';

function withSeatInfo(event) {
  const plain = event.toJSON ? event.toJSON() : event;
  const capacity = plain.venue?.capacity;
  return {
    ...plain,
    capacity: capacity ?? null,
    seatsRemaining: typeof capacity === 'number' ? capacity - (plain.seatsTaken ?? 0) : null,
  };
}

export async function listEvents({ page, limit, city, upcoming }) {
  const filter = {};
  if (upcoming) filter.startsAt = { $gte: new Date() };

  if (city) {
    const venueIds = await Venue.find({ city }).distinct('_id');
    filter.venue = { $in: venueIds };
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .sort({ startsAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('venue')
      .populate('organizer', ORGANIZER_FIELDS),
    Event.countDocuments(filter),
  ]);

  return {
    items: events.map(withSeatInfo),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getEventById(eventId, userId) {
  const event = await Event.findById(eventId)
    .populate('venue')
    .populate('organizer', ORGANIZER_FIELDS);

  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const result = withSeatInfo(event);

  if (userId) {
    const registration = await Registration.findOne({ user: userId, event: eventId });
    result.myRegistration = registration ?? null;
  }

  return result;
}

async function loadOwnedEvent(eventId, userId) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }
  if (String(event.organizer) !== String(userId)) {
    throw ApiError.forbidden('You can only modify events you organize');
  }
  return event;
}

export async function createEvent(data, organizerId) {
  const venue = await Venue.findById(data.venue);
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }

  const event = await Event.create({ ...data, organizer: organizerId });
  await event.populate([{ path: 'venue' }, { path: 'organizer', select: ORGANIZER_FIELDS }]);

  await indexEvent(event);
  return withSeatInfo(event);
}

export async function updateEvent(eventId, data, userId) {
  const event = await loadOwnedEvent(eventId, userId);

  if (data.venue && String(data.venue) !== String(event.venue)) {
    const venue = await Venue.findById(data.venue);
    if (!venue) {
      throw ApiError.notFound('Venue not found');
    }
    if (venue.capacity < event.seatsTaken) {
      throw ApiError.conflict(
        `Cannot move this event to a venue with capacity ${venue.capacity}: ` +
          `${event.seatsTaken} seat(s) are already taken.`
      );
    }
  }

  Object.assign(event, data);
  await event.save();
  await event.populate([{ path: 'venue' }, { path: 'organizer', select: ORGANIZER_FIELDS }]);

  await indexEvent(event);
  return withSeatInfo(event);
}

export async function deleteEvent(eventId, userId) {
  const event = await loadOwnedEvent(eventId, userId);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Registration.deleteMany({ event: event._id }, { session });
      await Event.deleteOne({ _id: event._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  await removeEventFromIndex(event._id);
}

export async function listAttendees(eventId, userId, { page, limit }) {
  await loadOwnedEvent(eventId, userId);

  const filter = { event: eventId, status: 'confirmed' };
  const [items, total] = await Promise.all([
    Registration.find(filter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email'),
    Registration.countDocuments(filter),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}
