import { commonSchemas } from './common.docs.js';
import { userSchemas } from './user.docs.js';
import { venueSchemas } from './venue.docs.js';
import { eventSchemas } from './event.docs.js';
import { registrationSchemas } from './registration.docs.js';
import { statsSchemas } from './stats.docs.js';

export const schemas = {
  ...commonSchemas,
  ...userSchemas,
  ...venueSchemas,
  ...eventSchemas,
  ...registrationSchemas,
  ...statsSchemas,
};
