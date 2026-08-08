import { z } from 'zod';
import mongoose from 'mongoose';

export const objectId = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Must be a valid id');

export const idParamSchema = z.object({ id: objectId });
