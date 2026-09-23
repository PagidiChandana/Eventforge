'use strict';
/**
 * seed.js
 * Database seed script populating realistic corporate demo data for EventForge.
 * Run with: npm run seed or node src/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { User, ROLES } = require('./models/User');
const Organization = require('./models/Organization');
const Venue = require('./models/Venue');
const { Event } = require('./models/Event');
const TicketCategory = require('./models/TicketCategory');
const Session = require('./models/Session');
const Speaker = require('./models/Speaker');
const SponsorshipPackage = require('./models/SponsorshipPackage');
const Sponsor = require('./models/Sponsor');
const { Registration } = require('./models/Registration');
const Ticket = require('./models/Ticket');
const { StaffAssignment } = require('./models/StaffAssignment');
const { Feedback } = require('./models/Feedback');
const Coupon = require('./models/Coupon');
const { Deliverable } = require('./models/Deliverable');
const BrandAsset = require('./models/BrandAsset');
const Announcement = require('./models/Announcement');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const { Subscription } = require('./models/Subscription');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';

async function seedDatabase() {
  console.log('🌱 Connecting to MongoDB for seeding...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  console.log('🧹 Clearing existing database records...');
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Venue.deleteMany({}),
    Event.deleteMany({}),
    TicketCategory.deleteMany({}),
    Session.deleteMany({}),
    Speaker.deleteMany({}),
    SponsorshipPackage.deleteMany({}),
    Sponsor.deleteMany({}),
    Registration.deleteMany({}),
    Ticket.deleteMany({}),
    StaffAssignment.deleteMany({}),
    Feedback.deleteMany({}),
    Coupon.deleteMany({}),
    Deliverable.deleteMany({}),
    BrandAsset.deleteMany({}),
    Announcement.deleteMany({}),
    SubscriptionPlan.deleteMany({}),
    Subscription.deleteMany({})
  ]);
  console.log('✅ Database cleared.');

  console.log('👤 Creating demo accounts...');
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Demo accounts (.com and .dev domain aliases)
  const accountsData = [
    { name: 'Alexandra Vance (Admin)', email: 'admin@eventforge.com', role: ROLES.PLATFORM_ADMIN, org: 'EventForge Platform HQ', title: 'Chief Technology Officer' },
    { name: 'Alexandra Vance (Admin)', email: 'admin@eventforge.dev', role: ROLES.PLATFORM_ADMIN, org: 'EventForge Platform HQ', title: 'Chief Technology Officer' },
    { name: 'Marcus Sterling (Organizer)', email: 'organizer@eventforge.com', role: ROLES.EVENT_ORGANIZER, org: 'Quantum Cloud Systems', title: 'Head of Events' },
    { name: 'Marcus Sterling (Organizer)', email: 'organizer@eventforge.dev', role: ROLES.EVENT_ORGANIZER, org: 'Quantum Cloud Systems', title: 'Head of Events' },
    { name: 'Elena Rostova (Staff)', email: 'staff@eventforge.com', role: ROLES.EVENT_STAFF, org: 'Quantum Cloud Systems', title: 'Operations Coordinator' },
    { name: 'Elena Rostova (Staff)', email: 'staff@eventforge.dev', role: ROLES.EVENT_STAFF, org: 'Quantum Cloud Systems', title: 'Operations Coordinator' },
    { name: 'Dr. Aris Thorne (Speaker)', email: 'speaker@eventforge.com', role: ROLES.SPEAKER, org: 'Apex AI Labs', title: 'VP of AI Research' },
    { name: 'Dr. Aris Thorne (Speaker)', email: 'speaker@eventforge.dev', role: ROLES.SPEAKER, org: 'Apex AI Labs', title: 'VP of AI Research' },
    { name: 'Sarah Chen (Attendee)', email: 'attendee@eventforge.com', role: ROLES.ATTENDEE, org: 'Nexus Financial Tech', title: 'Principal Software Architect' },
    { name: 'Sarah Chen (Attendee)', email: 'attendee@eventforge.dev', role: ROLES.ATTENDEE, org: 'Nexus Financial Tech', title: 'Principal Software Architect' },
    { name: 'David Miller (Sponsor)', email: 'sponsor@eventforge.com', role: ROLES.SPONSOR, org: 'Apex Technologies', title: 'Director of Strategic Partnerships' },
    { name: 'David Miller (Sponsor)', email: 'sponsor@eventforge.dev', role: ROLES.SPONSOR, org: 'Apex Technologies', title: 'Director of Strategic Partnerships' }
  ];

  const createdUsers = {};
  for (const acc of accountsData) {
    const u = await User.create({
      name: acc.name,
      email: acc.email,
      passwordHash: defaultPasswordHash,
      role: acc.role,
      organization: acc.org,
      profileInfo: {
        bio: `${acc.title} at ${acc.org}`,
        title: acc.title,
        interests: ['AI', 'Cloud', 'Kubernetes', 'Architecture', 'Security']
      }
    });
    createdUsers[acc.email] = u;
  }

  const adminUser = createdUsers['admin@eventforge.com'];
  const organizerUser = createdUsers['organizer@eventforge.com'];
  const staffUser = createdUsers['staff@eventforge.com'];
  const speakerUser = createdUsers['speaker@eventforge.com'];
  const attendeeUser = createdUsers['attendee@eventforge.com'];
  const sponsorUser = createdUsers['sponsor@eventforge.com'];

  console.log('🏢 Creating Organization & Venues...');
  const org = await Organization.create({
    name: 'Quantum Cloud Systems',
    description: 'Leading provider of enterprise cloud management and AI orchestration platforms.',
    website: 'https://quantumcloud.example.com',
    owner: adminUser._id
  });

  const venue1 = await Venue.create({
    name: 'San Francisco Tech & Convention Center',
    address: '742 Howard Street',
    city: 'San Francisco',
    capacity: 1500,
    contactPerson: 'Venue Manager',
    contactPhone: '+1-415-555-0199',
    createdBy: organizerUser._id
  });

  const venue2 = await Venue.create({
    name: 'Grand Horizon Convention Palace',
    address: '100 Exhibition Blvd',
    city: 'San Jose',
    capacity: 3000,
    contactPerson: 'Event Operations Office',
    contactPhone: '+1-408-555-0188',
    createdBy: organizerUser._id
  });

  console.log('📅 Creating Events (Ongoing, Ended & Upcoming)...');
  // 1. ONGOING EVENT (Live right now for staff check-in testing)
  const eventOngoing = await Event.create({
    name: 'TechForge LIVE Operational Conference 2026',
    description: 'Real-time live conference active today for on-site gate check-in, live session streaming, and interactive attendee support.',
    eventType: 'Conference',
    category: 'Technology',
    startDate: new Date(Date.now() - 2 * 3600 * 1000), // Started 2 hours ago today
    endDate: new Date(Date.now() + 8 * 3600 * 1000), // Ends 8 hours from now today
    registrationStart: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    registrationEnd: new Date(Date.now() + 4 * 3600 * 1000),
    venue: venue1._id,
    organizer: organizerUser._id,
    organization: org._id,
    capacity: 600,
    status: 'Ongoing',
    contactEmail: 'live@techforge.example.com',
    tags: ['Live', 'Checkin', 'AI', 'Cloud']
  });

  // 2. UPCOMING EVENT (7 days away)
  const event1 = await Event.create({
    name: 'Global AI & Cloud Summit 2026',
    description: 'The premier corporate conference for AI architects, cloud engineers, and technology leaders building next-generation enterprise applications.',
    eventType: 'Conference',
    category: 'Technology',
    startDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 9 * 24 * 3600 * 1000),
    registrationStart: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    registrationEnd: new Date(Date.now() + 6 * 24 * 3600 * 1000),
    venue: venue1._id,
    organizer: organizerUser._id,
    organization: org._id,
    capacity: 500,
    status: 'Registration Open',
    contactEmail: 'summit-support@quantumcloud.example.com',
    tags: ['AI', 'Cloud', 'Kubernetes', 'Microservices', 'Security']
  });

  // 3. UPCOMING EVENT 2 (30 days away)
  const event2 = await Event.create({
    name: 'Enterprise Microservices & DevOps Expo',
    description: 'Deep-dive technical workshop on zero-downtime deployments, service mesh telemetry, and container security.',
    eventType: 'Workshop',
    category: 'Engineering',
    startDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    endDate: new Date(Date.now() + 31 * 24 * 3600 * 1000),
    registrationStart: new Date(),
    registrationEnd: new Date(Date.now() + 29 * 24 * 3600 * 1000),
    venue: venue2._id,
    organizer: organizerUser._id,
    organization: org._id,
    capacity: 250,
    status: 'Published',
    contactEmail: 'devops-expo@quantumcloud.example.com',
    tags: ['DevOps', 'Microservices', 'Docker', 'Kubernetes']
  });

  // 4. ENDED / COMPLETED EVENT (14 days ago in past)
  const eventEnded = await Event.create({
    name: 'Global Cloud Architecture Forum 2025 (Ended)',
    description: 'Completed annual developer forum on multi-cloud infrastructure, cost optimization, and resilience testing.',
    eventType: 'Conference',
    category: 'Architecture',
    startDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
    endDate: new Date(Date.now() - 14 * 24 * 3600 * 1000),
    registrationStart: new Date(Date.now() - 45 * 24 * 3600 * 1000),
    registrationEnd: new Date(Date.now() - 16 * 24 * 3600 * 1000),
    venue: venue2._id,
    organizer: organizerUser._id,
    organization: org._id,
    capacity: 400,
    status: 'Completed',
    contactEmail: 'past-forum@quantumcloud.example.com',
    tags: ['Cloud', 'Architecture', 'Legacy']
  });

  console.log('🎟️ Creating Ticket Categories & Coupons...');
  const catVIP = await TicketCategory.create({
    event: event1._id,
    name: 'VIP Executive Pass',
    description: 'All-access pass including keynote seating, VIP lounge networking, and speaker dinner.',
    price: 299,
    capacity: 100,
    soldCount: 1,
    saleStart: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    saleEnd: new Date(Date.now() + 6 * 24 * 3600 * 1000),
    isActive: true
  });

  const catStandard = await TicketCategory.create({
    event: event1._id,
    name: 'Standard Conference Pass',
    description: 'Access to main track sessions, exhibition hall, and lunch buffet.',
    price: 149,
    capacity: 400,
    soldCount: 0,
    saleStart: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    saleEnd: new Date(Date.now() + 6 * 24 * 3600 * 1000),
    isActive: true
  });

  const coupon = await Coupon.create({
    event: event1._id,
    code: 'EARLY2026',
    discountType: 'Percentage',
    discountValue: 20,
    validFrom: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    maxUses: 100,
    usedCount: 1,
    isActive: true
  });

  await Coupon.create({
    event: event1._id,
    code: 'SAVE20',
    discountType: 'Percentage',
    discountValue: 20,
    validFrom: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    maxUses: 200,
    usedCount: 0,
    isActive: true
  });

  await Coupon.create({
    event: event1._id,
    code: 'EARLY10',
    discountType: 'Percentage',
    discountValue: 10,
    validFrom: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    maxUses: 200,
    usedCount: 0,
    isActive: true
  });

  console.log('🎤 Creating Speaker Profile & Sessions...');
  const speakerProfile = await Speaker.create({
    user: speakerUser._id,
    name: speakerUser.name,
    designation: 'VP of AI Research',
    company: 'Apex AI Labs',
    bio: 'Dr. Aris Thorne is a globally recognized AI research scientist specializing in enterprise LLM orchestration and zero-trust neural network architectures.',
    expertise: ['AI', 'Deep Learning', 'Autonomous Agents'],
    contactEmail: speakerUser.email,
    createdBy: organizerUser._id
  });

  const session1 = await Session.create({
    event: event1._id,
    title: 'Keynote: The Future of Autonomous Enterprise AI Systems',
    description: 'An architectural deep-dive into multi-agent GenAI orchestration, real-time telemetry, and enterprise safety guardrails.',
    sessionType: 'Keynote',
    roomName: 'Grand Auditorium Alpha',
    location: 'Hall A - Main Stage',
    startTime: new Date(event1.startDate.getTime() + 9 * 3600 * 1000),
    endTime: new Date(event1.startDate.getTime() + 10.5 * 3600 * 1000),
    capacity: 500,
    attendeeCount: 1,
    speakers: [speakerProfile._id],
    status: 'Scheduled',
    track: 'AI & Intelligence',
    tags: ['AI', 'GenAI', 'Architecture']
  });

  const session2 = await Session.create({
    event: event1._id,
    title: 'Building Zero-Downtime Microservices with Kubernetes',
    description: 'Best practices for automated canary deployments, service mesh routing, and distributed tracing at scale.',
    sessionType: 'Breakout',
    roomName: 'Room 204 B',
    location: '2nd Floor West',
    startTime: new Date(event1.startDate.getTime() + 11 * 3600 * 1000),
    endTime: new Date(event1.startDate.getTime() + 12.5 * 3600 * 1000),
    capacity: 150,
    attendeeCount: 1,
    status: 'Scheduled',
    track: 'Cloud & Infrastructure',
    tags: ['Kubernetes', 'Cloud', 'Microservices']
  });

  console.log('💼 Creating Sponsorship Packages, Sponsor & Deliverables...');
  const pkgPlatinum = await SponsorshipPackage.create({
    event: event1._id,
    name: 'Platinum Keynote Sponsor',
    price: 15000,
    quantityAvailable: 3,
    benefits: ['Keynote stage branding', 'Exhibition booth (20x20)', '10 VIP Passes', 'Logo on all promotional banners']
  });

  const sponsor = await Sponsor.create({
    event: event1._id,
    user: sponsorUser._id,
    companyName: 'Apex Technologies',
    contactName: sponsorUser.name,
    contactEmail: sponsorUser.email,
    assignedPackage: pkgPlatinum._id,
    status: 'Confirmed',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    description: 'Leading provider of cloud security and AI infrastructure solutions.'
  });

  await Deliverable.create({
    sponsor: sponsor._id,
    event: event1._id,
    package: pkgPlatinum._id,
    name: 'High-Resolution Brand Logo & Vector Graphic',
    description: 'Submit SVG / EPS vector logo for high-definition stage backdrop printing.',
    dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    status: 'Approved'
  });

  await Deliverable.create({
    sponsor: sponsor._id,
    event: event1._id,
    package: pkgPlatinum._id,
    name: 'Exhibition Booth Layout & Power Requirements',
    description: 'Confirm 20x20 booth electrical load and ethernet line requirements.',
    dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    status: 'In Progress'
  });

  await BrandAsset.create({
    sponsor: sponsor._id,
    assetType: 'Logo',
    title: 'Apex Tech Vector Logo',
    fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    uploadedBy: sponsorUser._id
  });

  const seedTicketCode = `EF-${event1._id.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  console.log('📋 Creating Attendee Registration & Digital Ticket...');
  const registration = await Registration.create({
    event: event1._id,
    attendee: attendeeUser._id,
    ticketCategory: catVIP._id,
    ticket: null,
    status: 'Approved',
    registrationDate: new Date(),
    coupon: coupon._id,
    finalPrice: 239.2, // $299 - 20%
    selectedSessions: [session1._id, session2._id],
    ticketCode: seedTicketCode
  });

  const qrToken = `TK-${event1._id.toString().slice(-4)}-${attendeeUser._id.toString().slice(-4)}-${Date.now()}`;

  const ticket = await Ticket.create({
    registration: registration._id,
    attendee: attendeeUser._id,
    event: event1._id,
    ticketCategory: catVIP._id,
    ticketNumber: seedTicketCode,
    qrToken,
    status: 'Valid',
    issuedAt: new Date()
  });

  registration.ticket = ticket._id;
  await registration.save();

  console.log('👮 Creating Staff Shift Assignments...');
  // Ongoing event shift assignment for staff
  await StaffAssignment.create({
    event: eventOngoing._id,
    staffUser: staffUser._id,
    role: 'Check-in Staff',
    assignedVenue: venue1._id,
    responsibilities: 'Gate QR Code Verification & Live Attendee Check-In',
    shiftStart: new Date(Date.now() - 3 * 3600 * 1000),
    shiftEnd: new Date(Date.now() + 9 * 3600 * 1000),
    status: 'Active'
  });

  // Upcoming event shift assignment
  await StaffAssignment.create({
    event: event1._id,
    staffUser: staffUser._id,
    role: 'Check-in Staff',
    assignedVenue: venue1._id,
    responsibilities: 'Main Hall QR Code Scanning & VIP Lounge Access Validation',
    shiftStart: new Date(event1.startDate.getTime() + 8 * 3600 * 1000),
    shiftEnd: new Date(event1.startDate.getTime() + 18 * 3600 * 1000),
    status: 'Active'
  });

  // Ended event shift assignment
  await StaffAssignment.create({
    event: eventEnded._id,
    staffUser: staffUser._id,
    role: 'Venue Coordinator',
    assignedVenue: venue2._id,
    responsibilities: 'Historical Operations Shift (Event Ended)',
    shiftStart: new Date(eventEnded.startDate.getTime()),
    shiftEnd: new Date(eventEnded.endDate.getTime()),
    status: 'Off Duty'
  });

  // Create ticket category & registration for ongoing event
  const catOngoing = await TicketCategory.create({
    event: eventOngoing._id,
    name: 'All-Access Pass',
    description: 'Full live event entry',
    price: 199,
    capacity: 300,
    soldCount: 1,
    isActive: true
  });

  const ongoingTicketCode = `EF-LIVE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const regOngoing = await Registration.create({
    event: eventOngoing._id,
    attendee: attendeeUser._id,
    ticketCategory: catOngoing._id,
    status: 'Approved',
    registrationDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    finalPrice: 199,
    ticketCode: ongoingTicketCode
  });

  await Ticket.create({
    registration: regOngoing._id,
    attendee: attendeeUser._id,
    event: eventOngoing._id,
    ticketCategory: catOngoing._id,
    ticketNumber: ongoingTicketCode,
    qrToken: `TK-LIVE-${attendeeUser._id.toString().slice(-4)}-${Date.now()}`,
    status: 'Valid',
    issuedAt: new Date()
  });

  console.log('⭐ Creating Feedback & Announcements...');
  await Feedback.create({
    attendee: attendeeUser._id,
    event: event1._id,
    session: session1._id,
    rating: 5,
    comment: 'Outstanding keynote presentation by Dr. Thorne! Great insights on scaling production GenAI applications.'
  });

  await Announcement.create({
    event: event1._id,
    title: 'Keynote Speaker Schedule Confirmed',
    message: 'We are thrilled to announce Dr. Aris Thorne will be delivering the opening keynote at 9:00 AM in Hall A!',
    targetAudience: 'All',
    createdBy: organizerUser._id
  });

  console.log('💳 Creating Subscription Plans...');
  const starterPlan = await SubscriptionPlan.create({
    name: 'Starter',
    price: 0,
    billingCycle: 'Monthly',
    limits: { maxEvents: 2, maxAttendeesPerEvent: 200, storageGB: 5 },
    features: ['Up to 2 events', 'QR check-in', 'Basic analytics'],
    isActive: true,
    createdBy: adminUser._id
  });
  const proPlan = await SubscriptionPlan.create({
    name: 'Professional',
    price: 499,
    billingCycle: 'Monthly',
    limits: { maxEvents: 20, maxAttendeesPerEvent: 2000, storageGB: 100 },
    features: ['Up to 20 events', 'AI content generation', 'AI recommendations', 'Sponsor portal', 'Advanced analytics'],
    isActive: true,
    createdBy: adminUser._id
  });
  await SubscriptionPlan.create({
    name: 'Enterprise',
    price: 4999,
    billingCycle: 'Yearly',
    limits: { maxEvents: 200, maxAttendeesPerEvent: 20000, storageGB: 1000 },
    features: ['Unlimited-scale events', 'Dedicated support', 'Custom branding', 'All AI capabilities'],
    isActive: true,
    createdBy: adminUser._id
  });

  await Subscription.create({
    organization: org._id,
    plan: proPlan._id,
    status: 'Active',
    endDate: new Date(Date.now() + 360 * 24 * 3600 * 1000),
    createdBy: adminUser._id
  });

  console.log('\n✅ SEED COMPLETE! Real corporate demo environment successfully created.\n');
  console.log('========================================================================');
  console.log('DEMO ACCOUNTS (Password for all: password123)');
  console.log('========================================================================');
  console.log('1. Platform Admin:     admin@eventforge.com');
  console.log('2. Event Organizer:    organizer@eventforge.com');
  console.log('3. Event Staff:        staff@eventforge.com');
  console.log('4. Speaker:            speaker@eventforge.com');
  console.log('5. Attendee:           attendee@eventforge.com');
  console.log('6. Sponsor:            sponsor@eventforge.com');
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
