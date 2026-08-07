import swaggerJsdoc from 'swagger-jsdoc';
import { schemas } from '../docs/index.js';

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'EventHub API',
    version: '1.0.0',
    description:
      'A small events platform: organizers publish events at venues, people register to attend, and everything is searchable.',
  },
  servers: [{ url: '/api', description: 'Relative to wherever the API is hosted' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas,
  },
  security: [],
};

const options = {
  definition,
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
