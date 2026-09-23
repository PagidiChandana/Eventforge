const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required']
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Attendees', 'Speakers', 'Sponsors', 'Staff', 'ALL', 'ATTENDEES', 'SPEAKERS', 'SPONSORS', 'STAFF'],
      default: 'All'
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
