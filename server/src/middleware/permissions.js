'use strict';
/**
 * permissions.js
 * Single source of truth for the EventForge role × feature matrix.
 *
 * Matrix (✅ = full, View/Own/Limited = scoped, — = denied):
 * | Feature             | Admin | Organizer | Staff | Speaker | Attendee | Sponsor |
 * | Dashboard           | ✅    | ✅        | ✅    | ✅      | ✅       | ✅      |
 * | User Management     | ✅    | —         | —     | —       | —        | —       |
 * | Organization Mgmt   | ✅    | —         | —     | —       | —        | —       |
 * | Subscription Mgmt   | ✅    | ✅        | —     | —       | —        | —       |
 * | Event Creation      | —     | ✅        | —     | —       | —        | —       |
 * | Venue Management    | —     | ✅        | ✅    | View    | View     | View    |
 * | Session Management  | —     | ✅        | —     | Assigned| Select   | —       |
 * | Speaker Management  | —     | ✅        | —     | Own     | View     | —       |
 * | Sponsor Management  | —     | ✅        | —     | —       | —        | Own     |
 * | Ticket Management   | —     | ✅        | —     | —       | Own      | —       |
 * | Registration Mgmt   | —     | ✅        | —     | —       | Own      | —       |
 * | QR Check-in         | —     | View      | ✅    | —       | Own QR   | —       |
 * | Session Attendance  | View  | View      | ✅    | View    | Own      | —       |
 * | Staff Management    | —     | ✅        | Own   | —       | —        | —       |
 * | Announcements       | Global| Event     | Receive| Receive| Receive  | Receive |
 * | AI Content Gen      | —     | ✅        | —     | Limited | —        | —       |
 * | AI Recommendations  | —     | —         | —     | —       | ✅       | —       |
 * | Analytics           |Platform| Event    | Ops   | Session | Personal | Sponsor |
 * | Feedback            | —     | View      | —     | View    | Submit   | —       |
 * | Sponsor Deliverables| —     | Manage    | —     | —       | —        | ✅      |
 * | Brand Assets        | —     | Manage    | —     | —       | —        | ✅      |
 */

const { ROLES } = require('../models/User');

const ADMIN = ROLES.PLATFORM_ADMIN;
const ORGANIZER = ROLES.EVENT_ORGANIZER;
const STAFF = ROLES.EVENT_STAFF;
const SPEAKER = ROLES.SPEAKER;
const ATTENDEE = ROLES.ATTENDEE;
const SPONSOR = ROLES.SPONSOR;

const PERMS = {
  // Full management (create / edit / delete)
  EVENT_MANAGE: [ORGANIZER],
  VENUE_MANAGE: [ORGANIZER, STAFF],
  SESSION_MANAGE: [ORGANIZER],
  SPEAKER_MANAGE: [ORGANIZER],
  SPONSOR_MANAGE: [ORGANIZER],
  TICKET_MANAGE: [ORGANIZER],
  REGISTRATION_MANAGE: [ORGANIZER],
  STAFF_MANAGE: [ORGANIZER],
  DELIVERABLE_MANAGE: [ORGANIZER],

  // Platform administration
  USER_MANAGE: [ADMIN],
  ORG_MANAGE: [ADMIN],
  SUBSCRIPTION_MANAGE: [ADMIN, ORGANIZER],

  // Operations (perform vs view)
  CHECKIN_PERFORM: [STAFF],
  ATTENDANCE_MARK: [STAFF],

  // Personal / own-scope (attendee + role owners)
  REGISTER_SELF: [ATTENDEE],
  TICKET_SELF: [ATTENDEE],
  FEEDBACK_SUBMIT: [ATTENDEE],
  AI_RECOMMEND: [ATTENDEE],

  // Hub owners (+ organizer manages, admin oversees where matrix allows)
  SPEAKER_SELF: [ORGANIZER, SPEAKER],
  SPONSOR_SELF: [ORGANIZER, SPONSOR],

  // Strict single-role scopes (separation of concerns):
  // Speaker Hub profile/sessions/materials belong ONLY to the Speaker.
  // Organizers manage speakers via dedicated /organizer/* endpoints instead.
  SPEAKER_ONLY: [SPEAKER],
  SPONSOR_ONLY: [SPONSOR],
  ORGANIZER_ONLY: [ORGANIZER],
  ATTENDEE_ONLY: [ATTENDEE],
  ADMIN_ONLY: [ADMIN],

  // Read scopes
  ANALYTICS_FULL: [ADMIN, ORGANIZER],
  FEEDBACK_VIEW: [ORGANIZER, SPEAKER],
  AI_CONTENT: [ORGANIZER],
  AI_CONTENT_SPEAKER: [ORGANIZER, SPEAKER],

  // Staff personal scope
  STAFF_SELF: [STAFF],
};

module.exports = { PERMS, ADMIN, ORGANIZER, STAFF, SPEAKER, ATTENDEE, SPONSOR };
