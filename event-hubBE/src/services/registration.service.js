import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';
import { Venue } from '../models/Venue.model.js';
import { Registration } from '../models/Registration.model.js';
import { ApiError } from '../utils/ApiError.js';

const DUPLICATE_KEY = 11000;

export async function registerForEvent({ userId, eventId, ticketCount }) {
  const session = await mongoose.startSession();
  let registration;

  try {
    await session.withTransaction(async () => {
      const event = await Event.findById(eventId).session(session);
      if (!event) {
        throw ApiError.notFound('Event not found');
      }

      const venue = await Venue.findById(event.venue).session(session);
      if (!venue) {
        throw ApiError.notFound('The venue for this event no longer exists');
      }

      const existing = await Registration.findOne({
        user: userId,
        event: eventId,
      }).session(session);

      if (existing && existing.status === 'confirmed') {
        throw ApiError.conflict('You are already registered for this event');
      }

      const claimed = await Event.findOneAndUpdate(
        { _id: eventId, seatsTaken: { $lte: venue.capacity - ticketCount } },
        { $inc: { seatsTaken: ticketCount } },
        { new: true, session }
      );

      if (!claimed) {
        const remaining = Math.max(venue.capacity - event.seatsTaken, 0);
        throw ApiError.conflict(
          remaining === 0
            ? `This event is sold out (venue capacity ${venue.capacity}).`
            : `Only ${remaining} seat(s) left at this venue, but ${ticketCount} were requested.`,
          { details: { capacity: venue.capacity, seatsRemaining: remaining } }
        );
      }

      if (existing) {

        existing.status = 'confirmed';
        existing.ticketCount = ticketCount;
        await existing.save({ session });
        registration = existing;
      } else {
        const [created] = await Registration.create(
          [{ user: userId, event: eventId, status: 'confirmed', ticketCount }],
          { session }
        );
        registration = created;
      }
    });
  } catch (err) {

    if (err?.code === DUPLICATE_KEY) {
      throw ApiError.conflict('You are already registered for this event');
    }
    throw err;
  } finally {
    await session.endSession();
  }

  return registration;
}

export async function cancelRegistration({ userId, eventId }) {
  const session = await mongoose.startSession();
  let registration;

  try {
    await session.withTransaction(async () => {
      const existing = await Registration.findOne({
        user: userId,
        event: eventId,
      }).session(session);

      if (!existing || existing.status === 'cancelled') {
        throw ApiError.notFound('You are not registered for this event');
      }

      const released = existing.ticketCount;
      existing.status = 'cancelled';
      await existing.save({ session });

      const result = await Event.updateOne(
        { _id: eventId, seatsTaken: { $gte: released } },
        { $inc: { seatsTaken: -released } },
        { session }
      );

      if (result.matchedCount === 0) {
        await Event.updateOne({ _id: eventId }, { $set: { seatsTaken: 0 } }, { session });
      }

      registration = existing;
    });
  } finally {
    await session.endSession();
  }

  return registration;
}

export async function listMyRegistrations(userId, { page, limit, status }) {
  const filter = { user: userId };
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Registration.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'event',
        populate: [
          { path: 'venue' },
          { path: 'organizer', select: 'name email role' },
        ],
      }),
    Registration.countDocuments(filter),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}
