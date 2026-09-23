const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    ticketCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TicketCategory',
      required: true
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true
    },
    qrToken: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['Valid', 'Used', 'Cancelled'],
      default: 'Valid'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
