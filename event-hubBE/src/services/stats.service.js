import mongoose from 'mongoose';
import { Event } from '../models/Event.model.js';
import { Registration } from '../models/Registration.model.js';

const { ObjectId } = mongoose.Types;


export async function topVenues(limit = 5) {
  return Registration.aggregate([
    { $match: { status: 'confirmed' } },
    {
      $lookup: {
        from: 'events',
        localField: 'event',
        foreignField: '_id',
        as: 'event',
      },
    },
    { $unwind: '$event' },
    {
      $group: {
        _id: '$event.venue',
        registrations: { $sum: 1 },
        tickets: { $sum: '$ticketCount' },
        events: { $addToSet: '$event._id' },
      },
    },
    { $sort: { registrations: -1, tickets: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'venues',
        localField: '_id',
        foreignField: '_id',
        as: 'venue',
      },
    },
    { $unwind: '$venue' },
    {
      $project: {
        _id: 0,
        venue: {
          _id: '$venue._id',
          name: '$venue.name',
          city: '$venue.city',
          capacity: '$venue.capacity',
        },
        registrations: 1,
        tickets: 1,
        eventCount: { $size: '$events' },
      },
    },
  ]);
}


export async function organizerEvents(organizerId) {
  return Event.aggregate([
    { $match: { organizer: new ObjectId(String(organizerId)) } },
    {
      $lookup: {
        from: 'venues',
        localField: 'venue',
        foreignField: '_id',
        as: 'venue',
      },
    },
    { $unwind: '$venue' },
    {
      $lookup: {
        from: 'registrations',
        let: { eventId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$event', '$$eventId'] }, { $eq: ['$status', 'confirmed'] }],
              },
            },
          },
          {
            $group: {
              _id: null,
              registrationCount: { $sum: 1 },
              ticketsSold: { $sum: '$ticketCount' },
            },
          },
        ],
        as: 'stats',
      },
    },
    {
      $addFields: {
        registrationCount: { $ifNull: [{ $arrayElemAt: ['$stats.registrationCount', 0] }, 0] },
        ticketsSold: { $ifNull: [{ $arrayElemAt: ['$stats.ticketsSold', 0] }, 0] },
      },
    },
    {
      $addFields: {
        remainingSeats: { $subtract: ['$venue.capacity', '$ticketsSold'] },
      },
    },
    {
      $project: {
        stats: 0,
        __v: 0,
        'venue.__v': 0,
      },
    },
    { $sort: { startsAt: 1 } },
  ]);
}
