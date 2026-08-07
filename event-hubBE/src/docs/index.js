import { commonSchemas } from './common.docs.js';
import { userSchemas } from './user.docs.js';
import { venueSchemas } from './venue.docs.js';
import { eventSchemas } from './event.docs.js';
import { registrationSchemas } from './registration.docs.js';

export const schemas = {
  ...commonSchemas,
  ...userSchemas,
  ...venueSchemas,
  ...eventSchemas,
  ...registrationSchemas,
};
