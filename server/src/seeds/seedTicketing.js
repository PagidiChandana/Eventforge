const mongoose = require('mongoose');
const { Event } = require('../models/Event');
const TicketCategory = require('../models/TicketCategory');
const Coupon = require('../models/Coupon');

const seedRegistrationData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding ticketing data...');

    const event = await Event.findOne({ slug: 'global-ai-and-cloud-summit-2026' });
    if (!event) {
      console.error('Run seedEvents.js first!');
      process.exit(1);
    }

    // 1. Create Ticket Categories
    const cat1 = await TicketCategory.findOneAndUpdate(
      { event: event._id, name: 'Early Bird Pass' },
      {
        event: event._id,
        name: 'Early Bird Pass',
        description: 'Discounted delegate pass including full keynote access and virtual recording access.',
        price: 199,
        capacity: 50,
        soldCount: 0,
        isActive: true
      },
      { upsert: true, new: true }
    );

    const cat2 = await TicketCategory.findOneAndUpdate(
      { event: event._id, name: 'Standard Conference Pass' },
      {
        event: event._id,
        name: 'Standard Conference Pass',
        description: 'Full 3-day access to all keynotes, breakout sessions, expo floor, and networking lunch.',
        price: 399,
        capacity: 500,
        soldCount: 0,
        isActive: true
      },
      { upsert: true, new: true }
    );

    const cat3 = await TicketCategory.findOneAndUpdate(
      { event: event._id, name: 'VIP Executive Pass' },
      {
        event: event._id,
        name: 'VIP Executive Pass',
        description: 'VIP front-row seating, exclusive networking lounge access, speaker dinner, and 1-on-1 Q&A.',
        price: 899,
        capacity: 25,
        soldCount: 0,
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log(`Seeded Categories: ${cat1.name}, ${cat2.name}, ${cat3.name}`);

    // 2. Create Coupons
    const coupon1 = await Coupon.findOneAndUpdate(
      { event: event._id, code: 'SUMMIT20' },
      {
        event: event._id,
        code: 'SUMMIT20',
        discountType: 'Percentage',
        discountValue: 20,
        usageLimit: 100,
        usedCount: 0,
        isActive: true
      },
      { upsert: true, new: true }
    );

    const coupon2 = await Coupon.findOneAndUpdate(
      { event: event._id, code: 'VIP50OFF' },
      {
        event: event._id,
        code: 'VIP50OFF',
        discountType: 'Fixed',
        discountValue: 50,
        usageLimit: 50,
        usedCount: 0,
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log(`Seeded Coupons: ${coupon1.code}, ${coupon2.code}`);
    console.log('✅ Ticketing & Registration seed data ready!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding ticketing data:', err);
    process.exit(1);
  }
};

seedRegistrationData();
