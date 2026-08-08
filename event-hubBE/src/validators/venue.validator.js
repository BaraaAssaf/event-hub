import { z } from 'zod';

const locationSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
});

export const createVenueSchema = z.object({
  name: z.string().trim().min(2).max(200),
  city: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(300),
  capacity: z.coerce.number().int().min(1),
  location: locationSchema.optional(),
});

export const updateVenueSchema = createVenueSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided'
);

export const listVenuesQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
