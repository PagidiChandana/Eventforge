require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';
mongoose.connect(MONGO_URI).then(async () => {
  const { User } = require('./src/models/User');
  const attendee = await User.findOne({ email: 'attendee@eventforge.com' });
  console.log('Attendee found:', !!attendee, attendee ? attendee.email : 'N/A');
  
  const { Registration } = require('./src/models/Registration');
  const count = await Registration.countDocuments();
  
  // Check for null ticketCodes
  const col = mongoose.connection.db.collection('registrations');
  const nullCount = await col.countDocuments({ ticketCode: null });
  const missingCount = await col.countDocuments({ ticketCode: { $exists: false } });
  
  console.log('Total registrations:', count);
  console.log('Null ticketCode:', nullCount);
  console.log('Missing ticketCode field:', missingCount);
  
  const distinctCodes = await Registration.distinct('ticketCode');
  console.log('Distinct ticketCodes:', distinctCodes.length);
  
  if (nullCount === 0 && missingCount === 0 && distinctCodes.length === count) {
    console.log('\nALL CHECKS PASSED - registrations are clean!');
  } else {
    console.log('\nSome issues found!');
  }
  
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
