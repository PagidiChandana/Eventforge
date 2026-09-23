const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Event } = require('../models/Event');
const Sponsor = require('../models/Sponsor');
const SponsorshipPackage = require('../models/SponsorshipPackage');
const { Deliverable } = require('../models/Deliverable');

const seedModulesData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding Speaker & Sponsor modules...');

    const sponsorUser = await User.findOne({ email: 'sponsor@eventforge.com' });
    const event = await Event.findOne({ slug: 'global-ai-and-cloud-summit-2026' });
    const sponsor = await Sponsor.findOne({ companyName: 'CloudScale Technologies' });
    const goldPkg = await SponsorshipPackage.findOne({ name: 'Gold Event Sponsor' });

    if (!event || !sponsor) {
      console.error('Run previous seed scripts first!');
      process.exit(1);
    }

    // Link sponsor contact user if needed
    if (sponsorUser && !sponsor.user) {
      sponsor.contactEmail = sponsorUser.email;
      await sponsor.save();
    }

    // Seed Sample Deliverables
    const d1 = await Deliverable.findOneAndUpdate(
      { sponsor: sponsor._id, name: 'High-Res Logo for Main Stage Backdrop' },
      {
        event: event._id,
        sponsor: sponsor._id,
        package: goldPkg ? goldPkg._id : null,
        name: 'High-Res Logo for Main Stage Backdrop',
        description: 'Provide SVG/PNG vector logo for rendering on 4K main stage LED screens.',
        dueDate: new Date(event.startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: 'Submitted',
        notes: 'Asset submitted by sponsor. Pending organizer approval.'
      },
      { upsert: true, new: true }
    );

    const d2 = await Deliverable.findOneAndUpdate(
      { sponsor: sponsor._id, name: 'Booth Location Selection' },
      {
        event: event._id,
        sponsor: sponsor._id,
        package: goldPkg ? goldPkg._id : null,
        name: 'Booth Location Selection',
        description: 'Confirm Expo Hall Booth #A12 configuration and power setup.',
        dueDate: new Date(event.startDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        status: 'Approved',
        completionDate: new Date(),
        notes: 'Booth A12 locked in by event operations team.'
      },
      { upsert: true, new: true }
    );

    console.log(`Seeded Deliverables: ${d1.name}, ${d2.name}`);
    console.log('✅ Phase 6 Speaker & Sponsor Module Seed ready!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding modules data:', err);
    process.exit(1);
  }
};

seedModulesData();
