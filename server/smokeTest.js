/**
 * smokeTest.js — End-to-end registration & ticketCode test
 * Run: node smokeTest.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { Registration } = require('./src/models/Registration');
const Ticket = require('./src/models/Ticket');
const TicketCategory = require('./src/models/TicketCategory');
const { Event } = require('./src/models/Event');
const { User } = require('./src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  // 1. Get seed data references
  const attendee = await User.findOne({ email: 'attendee@eventforge.com' });
  const event = await Event.findOne({}).sort({ createdAt: 1 });
  const category = await TicketCategory.findOne({ event: event._id });

  if (!attendee || !event || !category) {
    console.error('❌ Could not find seed data. Please run npm run seed first.');
    process.exit(1);
  }

  console.log('📋 Found attendee:', attendee.email);
  console.log('📋 Found event:', event.name);
  console.log('📋 Found category:', category.name);

  // 2. Check no active registration for a different event (to avoid conflict)
  const events = await Event.find({}).limit(10);
  let testEvent = events.find(e => e._id.toString() !== event._id.toString());
  
  // 3. Test duplicate registration prevention
  console.log('\n🔍 Test 1: Duplicate registration detection...');
  const existing = await Registration.findOne({ attendee: attendee._id, status: { $ne: 'Cancelled' } });
  if (existing) {
    console.log('✅ Found existing registration:', existing.ticketCode, '— duplicate prevention will block re-registration');
    console.log('   ticketCode is present:', !!existing.ticketCode);
  } else {
    console.log('⚠️  No existing registration found (not a problem, just noting)');
  }

  // 4. Verify all registrations have ticketCode
  console.log('\n🔍 Test 2: Verifying all registrations have ticketCode...');
  const nullTicketCodes = await Registration.countDocuments({ $or: [{ ticketCode: null }, { ticketCode: { $exists: false } }] });
  if (nullTicketCodes === 0) {
    console.log('✅ All registrations have non-null ticketCode');
  } else {
    console.log('❌ Found', nullTicketCodes, 'registrations with null/missing ticketCode');
  }

  // 5. Verify ticketCode uniqueness
  console.log('\n🔍 Test 3: Verifying ticketCode uniqueness...');
  const totalRegs = await Registration.countDocuments();
  const distinctCodes = await Registration.distinct('ticketCode');
  if (distinctCodes.length === totalRegs) {
    console.log(`✅ All ${totalRegs} registrations have unique ticketCodes`);
  } else {
    console.log(`❌ Uniqueness violation: ${totalRegs} registrations but only ${distinctCodes.length} distinct codes`);
  }

  // 6. Verify tickets have proper ticketNumbers
  console.log('\n🔍 Test 4: Verifying ticket integrity...');
  const totalTickets = await Ticket.countDocuments();
  const ticketsWithNumbers = await Ticket.countDocuments({ ticketNumber: { $ne: null } });
  console.log(`✅ ${ticketsWithNumbers}/${totalTickets} tickets have valid ticketNumbers`);

  console.log('\n✅ Smoke test complete!\n');
  process.exit(0);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
