import { User } from '../models/User.model.js';
import { hashPassword } from '../utils/password.js';

export const DEFAULT_PASSWORD = 'Password123!';

export async function seedUsers() {
  await User.deleteMany({});

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const [organizer, organizer2, attendee, attendee2, attendee3] = await User.create([
    { name: 'Grace Hopper', email: 'organizer@eventhub.dev', passwordHash, role: 'organizer' },
    { name: 'Dennis Ritchie', email: 'organizer2@eventhub.dev', passwordHash, role: 'organizer' },
    { name: 'Ada Lovelace', email: 'attendee@eventhub.dev', passwordHash, role: 'attendee' },
    { name: 'Linus Torvalds', email: 'attendee2@eventhub.dev', passwordHash, role: 'attendee' },
    { name: 'Margaret Hamilton', email: 'attendee3@eventhub.dev', passwordHash, role: 'attendee' },
  ]);

  console.log(`[seed] users: ${await User.countDocuments()}`);

  return { organizer, organizer2, attendee, attendee2, attendee3 };
}
