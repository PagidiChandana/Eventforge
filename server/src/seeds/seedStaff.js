const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Event } = require('../models/Event');
const Venue = require('../models/Venue');
const { StaffAssignment } = require('../models/StaffAssignment');

const seedStaffData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding staff operational data...');

    const staffUser = await User.findOne({ email: 'staff@eventforge.com' });
    const event = await Event.findOne({ slug: 'global-ai-and-cloud-summit-2026' });
    const venue = await Venue.findOne({ name: 'TechConvention Center Grand Hall' });

    if (!staffUser || !event) {
      console.error('Run seedUsers.js and seedEvents.js first!');
      process.exit(1);
    }

    const assignment = await StaffAssignment.findOneAndUpdate(
      { event: event._id, staffUser: staffUser._id },
      {
        event: event._id,
        staffUser: staffUser._id,
        role: 'Check-in Staff',
        assignedVenue: venue ? venue._id : null,
        responsibilities: 'Main Entrance QR Code Scanner & Badge Dispenser',
        shiftStart: event.startDate,
        shiftEnd: event.endDate,
        status: 'Active'
      },
      { upsert: true, new: true }
    );

    console.log(`Seeded Staff Assignment: ${staffUser.email} assigned to ${event.name} [Role: ${assignment.role}]`);
    console.log('✅ Phase 5 Staff Operational Seed ready!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding staff data:', err);
    process.exit(1);
  }
};

seedStaffData();
