// Central role registry — single source of truth for role-based visibility.
// Keeps each role's features isolated so users only see their own workspace.

export const ROLES = {
  PLATFORM_ADMIN: 'Platform Admin',
  EVENT_ORGANIZER: 'Event Organizer',
  EVENT_STAFF: 'Event Staff',
  SPEAKER: 'Speaker',
  ATTENDEE: 'Attendee',
  SPONSOR: 'Sponsor',
};

export const ALL_ROLES = Object.values(ROLES);

// Where each role lands after login / logo click / unauthorized redirect.
// Each role opens ONLY its own workspace.
export const ROLE_HOMES = {
  [ROLES.PLATFORM_ADMIN]: '/dashboard',
  [ROLES.EVENT_ORGANIZER]: '/dashboard',
  [ROLES.EVENT_STAFF]: '/staff/dashboard',
  [ROLES.SPEAKER]: '/speaker/dashboard',
  [ROLES.SPONSOR]: '/sponsor/dashboard',
  [ROLES.ATTENDEE]: '/attendee',
};

export const getHomeForRole = (role) => ROLE_HOMES[role] || '/dashboard';

// Human-readable workspace summary shown on /dashboard so each role
// immediately sees ONLY its own feature set.
export const ROLE_WORKSPACES = {
  [ROLES.PLATFORM_ADMIN]: {
    title: 'Platform Administration',
    subtitle: 'Users, organizations, subscriptions and platform analytics.',
    features: ['All users & roles', 'Organizations', 'Subscriptions & plans', 'Platform analytics'],
  },
  [ROLES.EVENT_ORGANIZER]: {
    title: 'Organizer Workspace',
    subtitle: 'Create events, manage sessions, tickets, staff, sponsors.',
    features: ['Create & publish events', 'Sessions, speakers & venues', 'Tickets, coupons & registrations', 'Analytics & announcements'],
  },
  [ROLES.EVENT_STAFF]: {
    title: 'Staff Operations',
    subtitle: 'On-ground check-in, attendance and task execution.',
    features: ['Assigned shifts & tasks', 'QR ticket check-in', 'Session attendance', 'Report venue issues'],
  },
  [ROLES.SPEAKER]: {
    title: 'Speaker Hub',
    subtitle: 'Sessions, availability, decks and feedback.',
    features: ['Assigned sessions & rooms', 'Availability & conflicts', 'Upload presentations', 'View session feedback'],
  },
  [ROLES.SPONSOR]: {
    title: 'Sponsor Portal',
    subtitle: 'Packages, brand assets and deliverables.',
    features: ['Package & benefits', 'Upload logos & banners', 'Track deliverables & deadlines', 'Event & booth info'],
  },
  [ROLES.ATTENDEE]: {
    title: 'Attendee Hub',
    subtitle: 'Discover, register, check in and give feedback.',
    features: ['Browse & register events', 'Tickets with QR code', 'Personal schedule & AI picks', 'Rate sessions & events'],
  },
};
