const mongoose = require('mongoose');

const EVENT_TYPES = [
  'Conference',
  'Workshop',
  'Exhibition',
  'Seminar',
  'Corporate Meeting',
  'Networking Event'
];

const EVENT_STATUSES = [
  'Draft',
  'Published',
  'Registration Open',
  'Registration Closed',
  'Ongoing',
  'Completed',
  'Cancelled'
];

const eventSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
    },
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Event description is required']
    },
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      default: 'Conference'
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    registrationStart: {
      type: Date
    },
    registrationEnd: {
      type: Date
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    capacity: {
      type: Number,
      required: [true, 'Event capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: 'Draft'
    },
    bannerUrl: {
      type: String,
      default: ''
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contactEmail: {
      type: String,
      trim: true
    },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

// Slug auto-generation & uniqueness
eventSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = { Event, EVENT_TYPES, EVENT_STATUSES };
