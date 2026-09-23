const mongoose = require('mongoose');

const REGISTRATION_STATUSES = ['Pending', 'Approved', 'Rejected', 'Waitlisted', 'Cancelled'];

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attendee ID is required']
    },
    ticketCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TicketCategory',
      required: [true, 'Ticket category is required']
    },
    status: {
      type: String,
      enum: REGISTRATION_STATUSES,
      default: 'Approved'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    selectedSessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session'
      }
    ],
    ticketCode: {
      type: String,
      required: [true, 'Ticket code is required'],
      unique: true,
      trim: true
    }
  },
  { timestamps: true }
);

registrationSchema.index({ event: 1, attendee: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = { Registration, REGISTRATION_STATUSES };
