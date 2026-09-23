const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    sessionType: {
      type: String,
      default: 'Keynote'
    },
    speakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Speaker'
      }
    ],
    roomName: {
      type: String,
      required: [true, 'Room or venue name is required'],
      trim: true
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    capacity: {
      type: Number,
      default: 100,
      min: 1
    },
    category: {
      type: String,
      default: 'General'
    },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
