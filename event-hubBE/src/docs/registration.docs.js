import { REGISTRATION_STATUSES } from '../models/Registration.model.js';

export const registrationSchemas = {
  Registration: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '665f1c2e8f1b2c0012a3b459' },
      user: { type: 'string', description: 'User id', example: '665f1c2e8f1b2c0012a3b456' },
      event: { type: 'string', description: 'Event id', example: '665f1c2e8f1b2c0012a3b458' },
      status: { type: 'string', enum: REGISTRATION_STATUSES, example: 'confirmed' },
      ticketCount: { type: 'integer', minimum: 1, example: 1 },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  RegistrationInput: {
    type: 'object',
    properties: {
      ticketCount: { type: 'integer', minimum: 1, maximum: 20, default: 1, example: 1 },
    },
  },
  // GET /api/me/registrations returns the event (and its venue) inline.
  RegistrationWithEvent: {
    allOf: [
      { $ref: '#/components/schemas/Registration' },
      {
        type: 'object',
        properties: {
          event: { $ref: '#/components/schemas/EventDetail' },
        },
      },
    ],
  },
  // GET /api/events/{id}/attendees returns the registration with its user.
  Attendee: {
    allOf: [
      { $ref: '#/components/schemas/Registration' },
      {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string', example: 'Ada Lovelace' },
              email: { type: 'string', format: 'email', example: 'attendee@eventhub.dev' },
            },
          },
        },
      },
    ],
  },
};
