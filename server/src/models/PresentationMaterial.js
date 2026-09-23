const mongoose = require('mongoose');

const presentationMaterialSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session ID is required']
    },
    speaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Speaker',
      required: [true, 'Speaker ID is required']
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    fileType: {
      type: String,
      default: 'PDF'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
      default: 'Submitted'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PresentationMaterial', presentationMaterialSchema);
