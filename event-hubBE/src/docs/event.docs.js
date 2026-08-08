export const eventSchemas = {
  Event: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '665f1c2e8f1b2c0012a3b458' },
      title: { type: 'string', example: 'Intro to Node.js' },
      description: {
        type: 'string',
        example: 'A hands-on introduction to building APIs with Node.js and Express.',
      },
      startsAt: { type: 'string', format: 'date-time' },
      price: { type: 'number', minimum: 0, example: 29.99 },
      venue: { type: 'string', description: 'Venue id', example: '665f1c2e8f1b2c0012a3b457' },
      organizer: { type: 'string', description: 'User id', example: '665f1c2e8f1b2c0012a3b456' },
      categories: { type: 'array', items: { type: 'string' }, example: ['tech', 'workshop'] },
      seatsTaken: {
        type: 'integer',
        description: 'Confirmed tickets claimed so far',
        example: 2,
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  EventDetail: {
    allOf: [
      { $ref: '#/components/schemas/Event' },
      {
        type: 'object',
        properties: {
          venue: { $ref: '#/components/schemas/Venue' },
          organizer: { $ref: '#/components/schemas/User' },
          capacity: {
            type: 'integer',
            description: "The venue's capacity — an event has no capacity of its own",
            example: 200,
          },
          seatsRemaining: { type: 'integer', example: 198 },
          myRegistration: {
            nullable: true,
            description:
              "The caller's own registration. Only present when the request is authenticated; null when signed in but not registered.",
            allOf: [{ $ref: '#/components/schemas/Registration' }],
          },
        },
      },
    ],
  },
  EventInput: {
    type: 'object',
    required: ['title', 'description', 'startsAt', 'price', 'venue'],
    properties: {
      title: { type: 'string', minLength: 3, example: 'Intro to Node.js' },
      description: {
        type: 'string',
        minLength: 10,
        example: 'A hands-on introduction to building APIs with Node.js and Express.',
      },
      startsAt: { type: 'string', format: 'date-time', example: '2026-09-01T18:00:00.000Z' },
      price: { type: 'number', minimum: 0, example: 29.99 },
      venue: { type: 'string', description: 'Venue id', example: '665f1c2e8f1b2c0012a3b457' },
      categories: { type: 'array', items: { type: 'string' }, example: ['tech', 'workshop'] },
    },
  },
  OrganizerEvent: {
    allOf: [
      { $ref: '#/components/schemas/Event' },
      {
        type: 'object',
        properties: {
          venue: { $ref: '#/components/schemas/Venue' },
          registrationCount: {
            type: 'integer',
            description: 'Confirmed registrations for this event',
            example: 2,
          },
          ticketsSold: { type: 'integer', example: 3 },
          remainingSeats: {
            type: 'integer',
            description: "The venue's capacity minus the tickets sold",
            example: 197,
          },
        },
      },
    ],
  },
  SearchHit: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '665f1c2e8f1b2c0012a3b458' },
      score: { type: 'number', nullable: true, example: 4.21 },
      title: { type: 'string', example: 'Intro to Node.js' },
      description: { type: 'string' },
      city: { type: 'string', nullable: true, example: 'San Francisco' },
      categories: { type: 'array', items: { type: 'string' } },
      startsAt: { type: 'string', format: 'date-time' },
      price: { type: 'number' },
      venueId: { type: 'string', nullable: true },
      venueName: { type: 'string', nullable: true, example: 'Grand Hall' },
      organizerId: { type: 'string', nullable: true },
      organizerName: { type: 'string', nullable: true, example: 'Grace Hopper' },
      highlight: {
        type: 'object',
        description: 'Matched fragments with the terms wrapped in <em> tags',
        additionalProperties: { type: 'array', items: { type: 'string' } },
        example: { title: ['Intro to <em>Node.js</em>'] },
      },
    },
  },
  SearchResults: {
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/SearchHit' } },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 3 },
      totalPages: { type: 'integer', example: 1 },
    },
  },
};
