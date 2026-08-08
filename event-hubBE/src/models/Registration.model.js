import mongoose from 'mongoose';

const { Schema } = mongoose;

export const REGISTRATION_STATUSES = ['confirmed', 'cancelled'];

const registrationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: REGISTRATION_STATUSES, default: 'confirmed' },
    ticketCount: { type: Number, default: 1, min: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

registrationSchema.index({ user: 1, event: 1 }, { unique: true });

registrationSchema.index({ event: 1, status: 1 });

export const Registration = mongoose.model('Registration', registrationSchema);
