const geoPoint = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['Point'], example: 'Point' },
    coordinates: {
      type: 'array',
      items: { type: 'number' },
      description: '[longitude, latitude]',
      example: [-122.4194, 37.7749],
    },
  },
};

export const venueSchemas = {
  Venue: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '665f1c2e8f1b2c0012a3b457' },
      name: { type: 'string', example: 'Grand Hall' },
      city: { type: 'string', example: 'San Francisco' },
      address: { type: 'string', example: '100 Market St' },
      capacity: { type: 'integer', minimum: 1, example: 200 },
      location: geoPoint,
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  VenueInput: {
    type: 'object',
    required: ['name', 'city', 'address', 'capacity'],
    properties: {
      name: { type: 'string', example: 'Grand Hall' },
      city: { type: 'string', example: 'San Francisco' },
      address: { type: 'string', example: '100 Market St' },
      capacity: { type: 'integer', minimum: 1, example: 200 },
      location: geoPoint,
    },
  },
};
