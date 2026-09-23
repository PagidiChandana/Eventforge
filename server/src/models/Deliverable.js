const mongoose = require('mongoose');

const DELIVERABLE_STATUSES = [
  'Pending',
  'In Progress',
  'Submitted',
  'Approved',
  'Completed',
  'Rejected'
];

const deliverableSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sponsor',
      required: [true, 'Sponsor ID is required']
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SponsorshipPackage'
    },
    name: {
      type: String,
      required: [true, 'Deliverable name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date
    },
    status: {
      type: String,
      enum: DELIVERABLE_STATUSES,
      default: 'Pending'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completionDate: {
      type: Date
    },
    notes: {
      type: String,
      default: ''
    },
    assetUrl: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const Deliverable = mongoose.model('Deliverable', deliverableSchema);

module.exports = { Deliverable, DELIVERABLE_STATUSES };
