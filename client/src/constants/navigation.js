// Role-driven navigation — single source of truth for sidebars.
// Each role sees ONLY its own workspace items. Backend requireRole is authoritative.
import { ROLES, getHomeForRole } from './roles';

export const NAV = {
  [ROLES.PLATFORM_ADMIN]: [
    { to: getHomeForRole(ROLES.PLATFORM_ADMIN), icon: 'LayoutDashboard', label: 'Home' },
    { to: '/events', icon: 'Calendar', label: 'Events Catalog' },
    { to: '/admin/policy', icon: 'Shield', label: 'Global Policies' },
    { to: '/admin/analytics', icon: 'BarChart3', label: 'Analytics' },
    { to: '/admin/users', icon: 'Users', label: 'All Users' },
    { to: '/admin/organizations', icon: 'Building2', label: 'Organizations' },
    { to: '/admin/subscriptions', icon: 'CreditCard', label: 'Subscriptions' },
  ],
  [ROLES.EVENT_ORGANIZER]: [
    { to: getHomeForRole(ROLES.EVENT_ORGANIZER), icon: 'LayoutDashboard', label: 'Home' },
    { to: '/events', icon: 'Calendar', label: 'Events Catalog' },
    { to: '/organizer/events/new', icon: 'PlusSquare', label: 'Create Event' },
    { to: '/organizer/events', icon: 'Briefcase', label: 'My Events' },
    { to: '/organizer/speakers', icon: 'Mic2', label: 'Speakers' },
    { to: '/organizer/analytics', icon: 'BarChart3', label: 'Analytics' },
    { to: '/organizer/subscriptions', icon: 'CreditCard', label: 'Subscriptions' },
  ],
  [ROLES.EVENT_STAFF]: [
    { to: getHomeForRole(ROLES.EVENT_STAFF), icon: 'LayoutDashboard', label: 'Home' },
    { to: '/staff/events', icon: 'Calendar', label: 'My Events' },
    { to: '/staff/check-in', icon: 'ScanLine', label: 'Check-in' },
    { to: '/staff/attendance', icon: 'UserCheck', label: 'Session Attendance' },
    { to: '/staff/events', icon: 'MapPin', label: 'Venue Operations', hash: 'venues' },
    { to: '/staff/support', icon: 'LifeBuoy', label: 'Attendee Support' },
    { to: '/staff/dashboard', icon: 'ClipboardList', label: 'Tasks' },
  ],
  [ROLES.SPEAKER]: [
    { to: getHomeForRole(ROLES.SPEAKER), icon: 'LayoutDashboard', label: 'Home' },
    { to: '/events', icon: 'Calendar', label: 'Events Catalog' },
    { to: '/speaker/dashboard', icon: 'Mic2', label: 'Speaker Hub' },
    { to: '/speaker/sessions', icon: 'Clock', label: 'My Sessions' },
    { to: '/speaker/availability', icon: 'CalendarCheck', label: 'Availability' },
    { to: '/speaker/materials', icon: 'FolderOpen', label: 'Presentation Materials' },
    { to: '/speaker/announcements', icon: 'Megaphone', label: 'Announcements' },
    { to: '/speaker/feedback', icon: 'Star', label: 'Feedback' },
  ],
  [ROLES.ATTENDEE]: [
    { to: getHomeForRole(ROLES.ATTENDEE), icon: 'LayoutDashboard', label: 'Home' },
    { to: '/events', icon: 'Calendar', label: 'Events Catalog' },
    { to: '/attendee/registrations', icon: 'ClipboardList', label: 'My Registrations' },
    { to: '/attendee/tickets', icon: 'Ticket', label: 'My Tickets' },
    { to: '/attendee/schedule', icon: 'Clock', label: 'My Schedule' },
    { to: '/attendee/announcements', icon: 'Megaphone', label: 'Announcements' },
    { to: '/attendee/feedback', icon: 'Star', label: 'Feedback' },
  ],
  [ROLES.SPONSOR]: [
    { to: getHomeForRole(ROLES.SPONSOR), icon: 'LayoutDashboard', label: 'Home' },
    { to: '/events', icon: 'Calendar', label: 'Events Catalog' },
    { to: '/sponsor/dashboard', icon: 'Briefcase', label: 'My Sponsorships' },
    { to: '/sponsor/packages', icon: 'Package', label: 'Sponsorship Packages' },
    { to: '/sponsor/assets', icon: 'Image', label: 'Brand Assets' },
    { to: '/sponsor/deliverables', icon: 'CheckSquare', label: 'Deliverables' },
    { to: '/sponsor/announcements', icon: 'Megaphone', label: 'Announcements' },
    { to: '/sponsor/analytics', icon: 'BarChart3', label: 'Analytics' },
  ],
};

export const getNavForRole = (role) => NAV[role] || NAV[ROLES.ATTENDEE];
