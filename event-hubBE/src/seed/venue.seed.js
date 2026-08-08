import { Venue } from '../models/Venue.model.js';

export async function seedVenues() {
  await Venue.deleteMany({});

  const [grandHall, techPark, riverside, sunset] = await Venue.create([
    {
      name: 'Grand Hall',
      city: 'San Francisco',
      address: '100 Market St',
      capacity: 200,
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
    },
    {
      name: 'Tech Park Arena',
      city: 'Austin',
      address: '500 Congress Ave',
      capacity: 500,
      location: { type: 'Point', coordinates: [-97.7431, 30.2672] },
    },
    {
      name: 'Riverside Center',
      city: 'New York',
      address: '10 Riverside Dr',
      capacity: 50,
      location: { type: 'Point', coordinates: [-73.9712, 40.7831] },
    },
    {
      name: 'Sunset Pavilion',
      city: 'Los Angeles',
      address: '250 Sunset Blvd',
      capacity: 100,
      location: { type: 'Point', coordinates: [-118.2437, 34.0522] },
    },
  ]);

  console.log(`[seed] venues: ${await Venue.countDocuments()}`);

  return { grandHall, techPark, riverside, sunset };
}
