/**
 * fixIndexes.js — One-time migration to fix the ticketCode index on registrations
 * Run: node fixIndexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const col = mongoose.connection.db.collection('registrations');

  // 1. Drop old ticketCode_1 index (which allowed null = single null value)
  try {
    await col.dropIndex('ticketCode_1');
    console.log('✅ Dropped old ticketCode_1 index');
  } catch (e) {
    console.log('⚠️  ticketCode_1 index not found or already dropped:', e.message);
  }

  // 2. Remove any registrations that have null/undefined ticketCode (bad seed data)
  const del = await col.deleteMany({ ticketCode: { $in: [null, undefined] } });
  console.log(`✅ Deleted ${del.deletedCount} registration(s) with null ticketCode`);

  // Also remove registrations where ticketCode field doesn't exist
  const del2 = await col.deleteMany({ ticketCode: { $exists: false } });
  console.log(`✅ Deleted ${del2.deletedCount} registration(s) missing ticketCode field`);

  // 3. Verify remaining
  const count = await col.countDocuments();
  console.log(`📋 Remaining registrations: ${count}`);

  const indexes = await col.indexes();
  console.log('Current indexes:', indexes.map(i => i.name));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
