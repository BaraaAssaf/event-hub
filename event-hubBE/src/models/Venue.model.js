import mongoose from 'mongoose';

const { Schema } = mongoose;

const pointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, 
  },
  { _id: false }
);

const venueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    location: { type: pointSchema, default: undefined },
  },
  { timestamps: true }
);

venueSchema.index({ city: 1 });
venueSchema.index({ location: '2dsphere' });

export const Venue = mongoose.model('Venue', venueSchema);
