import { z } from 'zod';
import { USER_ROLES } from '../models/User.model.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: `role must be one of: ${USER_ROLES.join(', ')}` }),
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
