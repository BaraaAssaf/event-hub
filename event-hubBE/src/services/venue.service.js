import { Venue } from '../models/Venue.model.js';
import { Event } from '../models/Event.model.js';
import { ApiError } from '../utils/ApiError.js';

export async function listVenues({ city, page, limit }) {
  const filter = city ? { city } : {};
  const [items, total] = await Promise.all([
    Venue.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Venue.countDocuments(filter),
  ]);

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getVenueById(venueId) {
  const venue = await Venue.findById(venueId);
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }
  return venue;
}

export async function createVenue(data) {
  return Venue.create(data);
}

export async function updateVenue(venueId, data) {
  const venue = await Venue.findByIdAndUpdate(venueId, data, {
    new: true,
    runValidators: true,
  });
  if (!venue) {
    throw ApiError.notFound('Venue not found');
  }
  return venue;
}


export async function deleteVenue(venueId) {
  const venue = await getVenueById(venueId);

  const upcomingCount = await Event.countDocuments({
    venue: venue._id,
    startsAt: { $gte: new Date() },
  });

  if (upcomingCount > 0) {
    throw ApiError.conflict(
      `Cannot delete this venue: it still hosts ${upcomingCount} upcoming event(s). ` +
        'Delete or move those events first.',
      { details: { upcomingEvents: upcomingCount } }
    );
  }

  await venue.deleteOne();
}
