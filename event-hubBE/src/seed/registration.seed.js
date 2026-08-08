import { Registration } from '../models/Registration.model.js';
import { Event } from '../models/Event.model.js';

export async function seedRegistrations(
  { attendee, attendee2, attendee3 },
  { nodeIntro, mongoAdvanced, esDeepDive, vueWorkshop, jazzNight, startupPitch }
) {
  await Registration.deleteMany({});

  const registrations = await Registration.create([
    { user: attendee._id, event: nodeIntro._id, status: 'confirmed', ticketCount: 1 },
    { user: attendee._id, event: mongoAdvanced._id, status: 'confirmed', ticketCount: 1 },
    { user: attendee._id, event: esDeepDive._id, status: 'confirmed', ticketCount: 1 },

    { user: attendee._id, event: jazzNight._id, status: 'cancelled', ticketCount: 1 },

    { user: attendee2._id, event: nodeIntro._id, status: 'confirmed', ticketCount: 1 },
    { user: attendee2._id, event: vueWorkshop._id, status: 'confirmed', ticketCount: 1 },
    { user: attendee2._id, event: jazzNight._id, status: 'confirmed', ticketCount: 2 },

    { user: attendee3._id, event: mongoAdvanced._id, status: 'confirmed', ticketCount: 1 },
    { user: attendee3._id, event: jazzNight._id, status: 'confirmed', ticketCount: 1 },
    { user: attendee3._id, event: startupPitch._id, status: 'confirmed', ticketCount: 1 },
  ]);


  const seatTotals = await Registration.aggregate([
    { $match: { status: 'confirmed' } },
    { $group: { _id: '$event', seatsTaken: { $sum: '$ticketCount' } } },
  ]);

  await Event.updateMany({}, { $set: { seatsTaken: 0 } });
  await Promise.all(
    seatTotals.map(({ _id, seatsTaken }) =>
      Event.updateOne({ _id }, { $set: { seatsTaken } })
    )
  );

  console.log(`[seed] registrations: ${await Registration.countDocuments()}`);

  return registrations;
}
