const mongoose = require('mongoose');

const ROLES = {
  PLATFORM_ADMIN: 'Platform Admin',
  EVENT_ORGANIZER: 'Event Organizer',
  EVENT_STAFF: 'Event Staff',
  SPEAKER: 'Speaker',
  ATTENDEE: 'Attendee',
  SPONSOR: 'Sponsor'
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: '{VALUE} is not a valid user role'
      },
      default: ROLES.ATTENDEE
    },
    organization: {
      type: String,
      trim: true,
      default: ''
    },
    profileInfo: {
      bio: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
      phoneNumber: { type: String, default: '' },
      title: { type: String, default: '' },
      interests: [{ type: String, trim: true }]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Method to return user representation without passwordHash
userSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.passwordHash;
  return userObj;
};

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES };
