export const statsSchemas = {
  TopVenue: {
    type: 'object',
    properties: {
      venue: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c2e8f1b2c0012a3b457' },
          name: { type: 'string', example: 'Grand Hall' },
          city: { type: 'string', example: 'San Francisco' },
          capacity: { type: 'integer', example: 200 },
        },
      },
      registrations: {
        type: 'integer',
        description: 'Confirmed registrations across every event at this venue',
        example: 4,
      },
      tickets: { type: 'integer', description: 'Confirmed tickets', example: 5 },
      eventCount: { type: 'integer', example: 2 },
    },
  },
};
