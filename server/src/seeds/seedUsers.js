const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, ROLES } = require('../models/User');

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding users...');

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

    const testUsers = [
      {
        name: 'Platform Admin User',
        email: 'admin@eventforge.com',
        passwordHash: defaultPasswordHash,
        role: ROLES.PLATFORM_ADMIN,
        organization: 'EventForge Operations'
      },
      {
        name: 'Event Organizer User',
        email: 'organizer@eventforge.com',
        passwordHash: defaultPasswordHash,
        role: ROLES.EVENT_ORGANIZER,
        organization: 'Apex Conferences Inc.'
      },
      {
        name: 'Event Staff User',
        email: 'staff@eventforge.com',
        passwordHash: defaultPasswordHash,
        role: ROLES.EVENT_STAFF,
        organization: 'Apex Conferences Inc.'
      },
      {
        name: 'Keynote Speaker User',
        email: 'speaker@eventforge.com',
        passwordHash: defaultPasswordHash,
        role: ROLES.SPEAKER,
        organization: 'Tech Innovations Lab',
        profileInfo: { title: 'Chief AI Researcher', bio: 'Expert in generative AI and system architectures.' }
      },
      {
        name: 'Corporate Attendee User',
        email: 'attendee@eventforge.com',
        passwordHash: defaultPasswordHash,
        role: ROLES.ATTENDEE,
        organization: 'Global Enterprises'
      },
      {
        name: 'Gold Sponsor Representative',
        email: 'sponsor@eventforge.com',
        passwordHash: defaultPasswordHash,
        role: ROLES.SPONSOR,
        organization: 'CloudScale Systems'
      }
    ];

    for (const u of testUsers) {
      await User.findOneAndUpdate(
        { email: u.email },
        { $setOnInsert: u },
        { upsert: true, new: true }
      );
      console.log(`Seeded/Verified user: ${u.email} [Role: ${u.role}]`);
    }

    console.log('✅ Seeding completed successfully. All 6 roles are available with password: Password123!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
