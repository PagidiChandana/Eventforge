const mongoose = require('mongoose');

const sessionAttendanceSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    checkedInAt: {
      type: Date,
      default: Date.now
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

sessionAttendanceSchema.index({ session: 1, attendee: 1 }, { unique: true });

module.exports = mongoose.model('SessionAttendance', sessionAttendanceSchema);
