const mongoose = require('mongoose');
const { User, ROLES } = require('../models/User');
const { Event } = require('../models/Event');
const Venue = require('../models/Venue');
const Session = require('../models/Session');
const Speaker = require('../models/Speaker');
const Sponsor = require('../models/Sponsor');
const SponsorshipPackage = require('../models/SponsorshipPackage');
const Announcement = require('../models/Announcement');
const Organization = require('../models/Organization');

const seedEventsAndEntities = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding events & core entities...');

    // Fetch organizer user & speaker user
    const organizer = await User.findOne({ email: 'organizer@eventforge.com' });
    const admin = await User.findOne({ email: 'admin@eventforge.com' });
    const speakerUser = await User.findOne({ email: 'speaker@eventforge.com' });

    if (!organizer || !admin) {
      console.error('Run seedUsers.js first to create base accounts!');
      process.exit(1);
    }

    // 1. Create Organization
    const org = await Organization.findOneAndUpdate(
      { name: 'Apex Global Conferences' },
      {
        name: 'Apex Global Conferences',
        description: 'Leading organizer of tech summits & corporate expos.',
        website: 'https://apexconferences.com',
        owner: organizer._id
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Organization: ${org.name}`);

    // 2. Create Venue
    const venue = await Venue.findOneAndUpdate(
      { name: 'TechConvention Center Grand Hall' },
      {
        name: 'TechConvention Center Grand Hall',
        address: '100 Innovation Way, Suite 500',
        city: 'San Francisco',
        capacity: 1500,
        rooms: [
          { name: 'Auditorium Alpha', capacity: 800, floor: '1st Floor', facilities: ['Projector', 'AV System', 'Stage'] },
          { name: 'Workshop Room 101', capacity: 150, floor: '2nd Floor', facilities: ['Whiteboard', 'Fast Wi-Fi'] }
        ],
        facilities: ['Catering', 'VIP Lounge', 'High-speed Fiber Internet', 'Parking'],
        contactInfo: { phone: '+1-415-555-0199', email: 'venue@techconvention.com' },
        createdBy: organizer._id
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Venue: ${venue.name}`);

    // 3. Create Sample Events
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const endNextMonth = new Date(nextMonth.getTime() + 3 * 24 * 60 * 60 * 1000);

    const event1 = await Event.findOneAndUpdate(
      { slug: 'global-ai-and-cloud-summit-2026' },
      {
        organization: org._id,
        name: 'Global AI & Cloud Summit 2026',
        slug: 'global-ai-and-cloud-summit-2026',
        description: 'The premier annual conference bringing together world experts in artificial intelligence, cloud infrastructure, and enterprise DevOps.',
        eventType: 'Conference',
        category: 'Technology',
        startDate: nextMonth,
        endDate: endNextMonth,
        registrationStart: now,
        registrationEnd: nextMonth,
        venue: venue._id,
        capacity: 1200,
        status: 'Registration Open',
        organizer: organizer._id,
        contactEmail: 'summit@apexconferences.com',
        tags: ['AI', 'Cloud', 'DevOps', 'Innovation']
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Event: ${event1.name}`);

    // 4. Create Speaker
    const speaker = await Speaker.findOneAndUpdate(
      { name: 'Dr. Elena Rostova' },
      {
        user: speakerUser ? speakerUser._id : null,
        name: 'Dr. Elena Rostova',
        designation: 'Chief AI Architect',
        company: 'NeuralMatrix Labs',
        bio: 'Pioneer in distributed deep learning networks and large language model optimization.',
        expertise: ['Machine Learning', 'Neural Networks', 'Distributed Systems'],
        contactEmail: 'elena@neuralmatrix.io',
        socialLinks: { linkedin: 'https://linkedin.com/in/elenarostova', twitter: 'https://twitter.com/elena_ai' },
        createdBy: organizer._id
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Speaker: ${speaker.name}`);

    // 5. Create Sessions
    const sessStart1 = new Date(nextMonth.getTime() + 9 * 3600 * 1000); // 9:00 AM
    const sessEnd1 = new Date(nextMonth.getTime() + 10 * 3600 * 1000 + 30 * 60 * 1000); // 10:30 AM

    const session1 = await Session.findOneAndUpdate(
      { title: 'Keynote: The Future of Autonomous Neural Architectures' },
      {
        event: event1._id,
        title: 'Keynote: The Future of Autonomous Neural Architectures',
        description: 'Explore the breakthrough trends in self-optimizing neural networks and enterprise deployment models.',
        sessionType: 'Keynote',
        speakers: [speaker._id],
        roomName: 'Auditorium Alpha',
        startTime: sessStart1,
        endTime: sessEnd1,
        capacity: 800,
        category: 'AI Trends',
        tags: ['Keynote', 'AI']
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Session: ${session1.title}`);

    // 6. Create Sponsorship Package
    const goldPkg = await SponsorshipPackage.findOneAndUpdate(
      { name: 'Gold Event Sponsor' },
      {
        event: event1._id,
        name: 'Gold Event Sponsor',
        description: 'Includes premium booth location, 5 VIP delegate passes, and logo placement on keynotes.',
        price: 15000,
        benefits: ['Dedicated Expo Booth', '5 VIP Passes', 'Logo on Main Stage Screens', 'Email Announcement Blast'],
        quantityAvailable: 3
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Package: ${goldPkg.name}`);

    // 7. Create Sponsor
    const sponsor = await Sponsor.findOneAndUpdate(
      { companyName: 'CloudScale Technologies' },
      {
        event: event1._id,
        companyName: 'CloudScale Technologies',
        contactName: 'Marcus Vance',
        contactEmail: 'marcus@cloudscale.com',
        description: 'Next-generation auto-scaling cloud compute infrastructure.',
        website: 'https://cloudscale.com',
        assignedPackage: goldPkg._id,
        deliverables: ['Booth Installed', 'Passes Issued', 'Logo Approved']
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Sponsor: ${sponsor.companyName}`);

    // 8. Create Announcement
    const ann = await Announcement.findOneAndUpdate(
      { title: 'Early Bird Registration Extended!' },
      {
        event: event1._id,
        title: 'Early Bird Registration Extended!',
        message: 'Great news! Due to overwhelming demand, early bird pricing has been extended for another 7 days.',
        targetAudience: 'All',
        createdBy: organizer._id
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded Announcement: ${ann.title}`);

    console.log('✅ Phase 3 seed data successfully populated!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Phase 3 data:', err);
    process.exit(1);
  }
};

seedEventsAndEntities();
