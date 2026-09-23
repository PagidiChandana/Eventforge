const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['Percentage', 'Fixed'],
      required: true,
      default: 'Percentage'
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 0
    },
    usageLimit: {
      type: Number,
      default: 100,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

couponSchema.index({ event: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
