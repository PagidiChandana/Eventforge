const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  floor: { type: String, default: '' },
  facilities: [{ type: String }]
});

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Venue capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    rooms: [roomSchema],
    facilities: [{ type: String }],
    contactInfo: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', venueSchema);
