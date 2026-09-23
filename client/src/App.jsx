import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { getHomeForRole } from './constants/roles';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import EventForm from './pages/EventForm';
import RegisterEvent from './pages/RegisterEvent';
import MyRegistrations from './pages/MyRegistrations';
import MyTickets from './pages/MyTickets';
import DigitalTicket from './pages/DigitalTicket';
import QRScanner from './pages/QRScanner';
import StaffDashboard from './pages/StaffDashboard';
import StaffEvents from './pages/StaffEvents';
import StaffAttendance from './pages/StaffAttendance';
import StaffSupport from './pages/StaffSupport';
import EventOperationsDashboard from './pages/EventOperationsDashboard';
import SpeakerDashboard from './pages/SpeakerDashboard';
import SponsorDashboard from './pages/SponsorDashboard';
import SponsorAnalytics from './pages/SponsorAnalytics';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AttendeeDashboard from './pages/AttendeeDashboard';
import AttendeeSchedule from './pages/AttendeeSchedule';
import AttendeeFeedback from './pages/AttendeeFeedback';
import AnnouncementsCenter from './pages/AnnouncementsCenter';
import OrganizerEvents from './pages/OrganizerEvents';
import OrganizerSpeakers from './pages/OrganizerSpeakers';
import AdminUsers from './pages/AdminUsers';
import AdminOrganizations from './pages/AdminOrganizations';
import Subscriptions from './pages/Subscriptions';
import AdminPolicy from './pages/AdminPolicy';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const ADMIN = 'Platform Admin';
const ORG = 'Event Organizer';
const STAFF = 'Event Staff';
const SPEAKER = 'Speaker';
const ATTENDEE = 'Attendee';
const SPONSOR = 'Sponsor';

// Public landing: guests browse events, members go to their own home
const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={getHomeForRole(user?.role)} replace />;
  return <Navigate to="/events" replace />;
};

// /dashboard is the exec home for Admin/Organizer; everyone else goes to their own home
const DashboardGate = () => {
  const { user } = useAuth();
  if (user?.role === ADMIN || user?.role === ORG) return <Dashboard />;
  return <Navigate to={getHomeForRole(user?.role)} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />

    <Route element={<AppLayout />}>
      {/* ── Public (unauthenticated discovery per spec §8) ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetails />} />

      {/* ── Home hub ── */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardGate /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* ── Platform Admin (/admin/*) ── */}
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={[ADMIN]}><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[ADMIN]}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/organizations" element={<ProtectedRoute allowedRoles={[ADMIN]}><AdminOrganizations /></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={[ADMIN]}><Subscriptions /></ProtectedRoute>} />
      <Route path="/admin/policy" element={<ProtectedRoute allowedRoles={[ADMIN]}><AdminPolicy /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute allowedRoles={[ADMIN, ORG]}><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute allowedRoles={[ADMIN, ORG]}><Subscriptions /></ProtectedRoute>} />

      {/* ── Event Organizer (/organizer/*) ── */}
      <Route path="/organizer/events/new" element={<ProtectedRoute allowedRoles={[ORG]}><EventForm /></ProtectedRoute>} />
      <Route path="/organizer/events" element={<ProtectedRoute allowedRoles={[ORG]}><OrganizerEvents /></ProtectedRoute>} />
      <Route path="/organizer/speakers" element={<ProtectedRoute allowedRoles={[ORG]}><OrganizerSpeakers /></ProtectedRoute>} />
      <Route path="/organizer/analytics" element={<ProtectedRoute allowedRoles={[ORG]}><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/organizer/subscriptions" element={<ProtectedRoute allowedRoles={[ORG]}><Subscriptions /></ProtectedRoute>} />
      <Route path="/events/new" element={<ProtectedRoute allowedRoles={[ORG]}><Navigate to="/organizer/events/new" replace /></ProtectedRoute>} />
      <Route path="/events/:id/edit" element={<ProtectedRoute allowedRoles={[ORG]}><EventForm /></ProtectedRoute>} />
      <Route
        path="/events/:eventId/operations"
        element={<ProtectedRoute allowedRoles={[ORG]}><EventOperationsDashboard /></ProtectedRoute>}
      />
      {/* Attendee registration entry (Attendee only) */}
      <Route
        path="/events/:eventId/register"
        element={<ProtectedRoute allowedRoles={[ATTENDEE]}><RegisterEvent /></ProtectedRoute>}
      />

      {/* ── Event Staff (/staff/*, staff ONLY) ── */}
      <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={[STAFF]}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/staff/check-in" element={<ProtectedRoute allowedRoles={[STAFF]}><QRScanner /></ProtectedRoute>} />
      <Route path="/staff/events" element={<ProtectedRoute allowedRoles={[STAFF]}><StaffEvents /></ProtectedRoute>} />
      <Route path="/staff/attendance" element={<ProtectedRoute allowedRoles={[STAFF]}><StaffAttendance /></ProtectedRoute>} />
      <Route path="/staff/support" element={<ProtectedRoute allowedRoles={[STAFF]}><StaffSupport /></ProtectedRoute>} />
      <Route path="/operations/staff-dashboard" element={<ProtectedRoute allowedRoles={[STAFF]}><Navigate to="/staff/dashboard" replace /></ProtectedRoute>} />
      <Route path="/operations/scanner" element={<ProtectedRoute allowedRoles={[STAFF]}><Navigate to="/staff/check-in" replace /></ProtectedRoute>} />

      {/* ── Speaker (/speaker/*, speaker ONLY) ── */}
      <Route path="/speaker/dashboard" element={<ProtectedRoute allowedRoles={[SPEAKER]}><SpeakerDashboard /></ProtectedRoute>} />
      <Route path="/speaker/sessions" element={<ProtectedRoute allowedRoles={[SPEAKER]}><SpeakerDashboard initialTab="Sessions" /></ProtectedRoute>} />
      <Route path="/speaker/availability" element={<ProtectedRoute allowedRoles={[SPEAKER]}><SpeakerDashboard initialTab="Availability" /></ProtectedRoute>} />
      <Route path="/speaker/materials" element={<ProtectedRoute allowedRoles={[SPEAKER]}><SpeakerDashboard initialTab="Materials" /></ProtectedRoute>} />
      <Route path="/speaker/announcements" element={<ProtectedRoute allowedRoles={[SPEAKER]}><SpeakerDashboard initialTab="Announcements" /></ProtectedRoute>} />
      <Route path="/speaker/feedback" element={<ProtectedRoute allowedRoles={[SPEAKER]}><SpeakerDashboard initialTab="Feedback" /></ProtectedRoute>} />

      {/* ── Attendee (/attendee/*, attendee ONLY) ── */}
      <Route path="/attendee" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><AttendeeDashboard /></ProtectedRoute>} />
      <Route path="/attendee/registrations" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><MyRegistrations /></ProtectedRoute>} />
      <Route path="/attendee/tickets" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><MyTickets /></ProtectedRoute>} />
      <Route path="/attendee/schedule" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><AttendeeSchedule /></ProtectedRoute>} />
      <Route path="/attendee/announcements" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><AnnouncementsCenter /></ProtectedRoute>} />
      <Route path="/attendee/feedback" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><AttendeeFeedback /></ProtectedRoute>} />
      <Route path="/tickets/:ticketId" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><DigitalTicket /></ProtectedRoute>} />
      <Route path="/my-registrations" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><Navigate to="/attendee/registrations" replace /></ProtectedRoute>} />
      <Route path="/my-tickets" element={<ProtectedRoute allowedRoles={[ATTENDEE]}><Navigate to="/attendee/tickets" replace /></ProtectedRoute>} />

      {/* ── Sponsor (/sponsor/*, sponsor ONLY) ── */}
      <Route path="/sponsor/dashboard" element={<ProtectedRoute allowedRoles={[SPONSOR]}><SponsorDashboard /></ProtectedRoute>} />
      <Route path="/sponsor/packages" element={<ProtectedRoute allowedRoles={[SPONSOR]}><SponsorDashboard initialTab="Packages" /></ProtectedRoute>} />
      <Route path="/sponsor/assets" element={<ProtectedRoute allowedRoles={[SPONSOR]}><SponsorDashboard initialTab="Brand Assets" /></ProtectedRoute>} />
      <Route path="/sponsor/deliverables" element={<ProtectedRoute allowedRoles={[SPONSOR]}><SponsorDashboard initialTab="Deliverables" /></ProtectedRoute>} />
      <Route path="/sponsor/announcements" element={<ProtectedRoute allowedRoles={[SPONSOR]}><AnnouncementsCenter /></ProtectedRoute>} />
      <Route path="/sponsor/analytics" element={<ProtectedRoute allowedRoles={[SPONSOR]}><SponsorAnalytics /></ProtectedRoute>} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
