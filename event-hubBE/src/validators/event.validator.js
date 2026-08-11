import { z } from 'zod';
import { objectId } from './common.validator.js';
import { REGISTRATION_STATUSES } from '../models/Registration.model.js';

const booleanish = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();

const futureDate = z.coerce.date().refine((value) => value.getTime() > Date.now(), {
  message: 'startsAt must be in the future',
});

const categoriesField = z.preprocess((value) => {
  if (value == null || value === '') return [];
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return value;
}, z.array(z.string().trim().min(1).max(50)).max(20));

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  startsAt: futureDate,
  price: z.coerce.number().min(0),
  venue: objectId,
  categories: categoriesField.default([]),
});

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    startsAt: futureDate.optional(),
    price: z.coerce.number().min(0).optional(),
    venue: objectId.optional(),
    categories: categoriesField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided');

export const listEventsQuerySchema = z.object({
  city: z.string().trim().min(1).optional(),
  upcoming: booleanish,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchEventsQuerySchema = z
  .object({
    q: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(['relevance', 'soonest', 'cheapest']).default('relevance'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((data) => !(data.from && data.to) || data.from <= data.to, {
    message: '"from" must be before "to"',
    path: ['from'],
  })
  .refine(
    (data) =>
      !(data.minPrice !== undefined && data.maxPrice !== undefined) ||
      data.minPrice <= data.maxPrice,
    { message: '"minPrice" must not exceed "maxPrice"', path: ['minPrice'] }
  );

export const registerForEventSchema = z.object({
  ticketCount: z.coerce.number().int().min(1).max(20).default(1),
});

export const listRegistrationsQuerySchema = z.object({
  status: z.enum(REGISTRATION_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
