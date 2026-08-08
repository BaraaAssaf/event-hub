import mongoose from 'mongoose';

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
   
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categories: { type: [String], default: [] },
    seatsTaken: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

eventSchema.index({ startsAt: 1 });
eventSchema.index({ venue: 1, startsAt: 1 });
eventSchema.index({ organizer: 1, startsAt: 1 });
eventSchema.index({ categories: 1 });

export const Event = mongoose.model('Event', eventSchema);
