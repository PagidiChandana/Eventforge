const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    contactName: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    logoUrl: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    assignedPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SponsorshipPackage'
    },
    deliverables: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sponsor', sponsorSchema);
