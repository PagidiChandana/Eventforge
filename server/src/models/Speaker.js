const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true
    },
    bio: {
      type: String,
      default: ''
    },
    designation: {
      type: String,
      trim: true,
      default: ''
    },
    company: {
      type: String,
      trim: true,
      default: ''
    },
    expertise: [{ type: String }],
    availability: {
      note: { type: String, default: '' },
      unavailableDates: [{ type: Date }]
    },
    profileImage: {
      type: String,
      default: ''
    },
    contactEmail: {
      type: String,
      trim: true,
      default: ''
    },
    socialLinks: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      website: { type: String, default: '' }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    organizers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Speaker', speakerSchema);
