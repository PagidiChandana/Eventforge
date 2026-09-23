const mongoose = require('mongoose');

const brandAssetSchema = new mongoose.Schema(
  {
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sponsor',
      required: true
    },
    assetType: {
      type: String,
      enum: ['Logo', 'Banner', 'Promotional Document', 'Brand Guidelines'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BrandAsset', brandAssetSchema);
