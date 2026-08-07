import { USER_ROLES } from '../models/User.model.js';

export const userSchemas = {
  User: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '665f1c2e8f1b2c0012a3b456' },
      name: { type: 'string', example: 'Grace Hopper' },
      email: { type: 'string', format: 'email', example: 'organizer@eventhub.dev' },
      role: { type: 'string', enum: USER_ROLES },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  RegisterInput: {
    type: 'object',
    required: ['name', 'email', 'password', 'role'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100, example: 'Grace Hopper' },
      email: { type: 'string', format: 'email', example: 'organizer@eventhub.dev' },
      password: { type: 'string', minLength: 6, maxLength: 72, example: 'Password123!' },
      role: { type: 'string', enum: USER_ROLES },
    },
  },
  LoginInput: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'organizer@eventhub.dev' },
      password: { type: 'string', example: 'Password123!' },
    },
  },
  AuthResponse: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/User' },
      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
    },
  },
};
