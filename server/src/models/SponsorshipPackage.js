const mongoose = require('mongoose');

const sponsorshipPackageSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Package price is required'],
      min: 0
    },
    benefits: [{ type: String }],
    quantityAvailable: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SponsorshipPackage', sponsorshipPackageSchema);
