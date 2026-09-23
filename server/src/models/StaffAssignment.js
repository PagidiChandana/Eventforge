const mongoose = require('mongoose');

const STAFF_ROLES = [
  'Check-in Staff',
  'Session Coordinator',
  'Venue Coordinator',
  'Help Desk',
  'Technical Support'
];

const staffAssignmentSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    staffUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff user is required']
    },
    role: {
      type: String,
      enum: STAFF_ROLES,
      default: 'Check-in Staff'
    },
    assignedVenue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue'
    },
    responsibilities: {
      type: String,
      default: ''
    },
    shiftStart: {
      type: Date
    },
    shiftEnd: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'On Break', 'Off Duty'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

staffAssignmentSchema.index({ event: 1, staffUser: 1 }, { unique: true });

const StaffAssignment = mongoose.model('StaffAssignment', staffAssignmentSchema);

module.exports = { StaffAssignment, STAFF_ROLES };
