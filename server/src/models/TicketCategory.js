const mongoose = require('mongoose');

const ticketCategorySchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required']
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    capacity: {
      type: Number,
      required: [true, 'Category capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0
    },
    saleStart: {
      type: Date
    },
    saleEnd: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TicketCategory', ticketCategorySchema);
