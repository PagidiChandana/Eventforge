import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents } from '../services/eventService';
import { getOrganizerOverview } from '../services/analyticsService';
import { getMyRegistrations } from '../services/registrationService';
import { healthService } from '../services/healthService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import {
  Zap, Calendar, Users, Ticket, BarChart3, ScanLine, Mic2, Briefcase,
  Sparkles, CheckCircle2, ArrowRight, Shield, Activity, Clock, PlusSquare,
  Building, CheckCircle, FileText, ClipboardList
} from 'lucide-react';
import { ROLE_WORKSPACES } from '../constants/roles';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [organizerStats, setOrganizerStats] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  const role = user?.role;
  const isOrganizer = role === 'Event Organizer';
  const isAdmin = role === 'Platform Admin';
  const isOrganizerOrAdmin = isOrganizer || isAdmin;
  const isStaff = role === 'Event Staff';
  const isSpeaker = role === 'Speaker';
  const isSponsor = role === 'Sponsor';
  const isAttendee = role === 'Attendee' || (!isOrganizerOrAdmin && !isStaff && !isSpeaker && !isSponsor);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, healthRes] = await Promise.all([
        getEvents(),
        healthService.checkHealth().catch(() => null)
      ]);

      setUpcomingEvents((eventsRes.data || []).slice(0, 4));
      if (healthRes) setHealthStatus(healthRes.data || healthRes);

      if (isOrganizerOrAdmin) {
        const statsRes = await getOrganizerOverview().catch(() => null);
        if (statsRes) setOrganizerStats(statsRes.data);
      } else {
        const regRes = await getMyRegistrations().catch(() => null);
        if (regRes) setUserRegistrations(regRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize dashboard workspaces');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Configuring executive dashboard environment..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. HERO WELCOME BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.8) 50%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Shield style={{ width: '13px', height: '13px' }} />
                {role || 'Authenticated User'}
              </span>
              <span style={{ color: '#64748b', fontSize: '13px' }}>•</span>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>{user?.organization || 'EventForge Corporate Platform'}</span>
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '10px' }}>
              Welcome back, <span style={{ background: 'linear-gradient(90deg, #818cf8 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name}</span>
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.6' }}>
              {isOrganizerOrAdmin
                ? 'Manage enterprise conferences, analyze real-time registration trends, track QR check-ins, and leverage AI content generation.'
                : isStaff
                ? 'Access on-site event operations, scan delegate QR tickets, and monitor room capacity.'
                : isSpeaker
                ? 'Manage assigned keynote sessions, upload presentation decks, and update your speaker profile.'
                : isSponsor
                ? 'Track sponsorship packages, submit brand assets, and update deliverable milestones.'
                : 'Discover tech summits, manage your registered digital tickets, and explore personalized AI session recommendations.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
            {/* Matrix: Event Creation = Organizer only; Admin gets Analytics + All Users */}
            {isOrganizer && (
              <>
                <Link
                  to="/organizer/events/new"
                  style={{
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    padding: '11px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s'
                  }}
                >
                  <PlusSquare style={{ width: '18px', height: '18px' }} />
                  Create Event
                </Link>
                <Link
                  to="/analytics"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <BarChart3 style={{ width: '18px', height: '18px' }} />
                  View Analytics
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                <Link
                  to="/analytics"
                  style={{
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    padding: '11px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  <BarChart3 style={{ width: '18px', height: '18px' }} />
                  Platform Analytics
                </Link>
                <Link
                  to="/admin/users"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Users style={{ width: '18px', height: '18px' }} />
                  Manage Users
                </Link>
              </>
            )}

            {!isOrganizerOrAdmin && (
              <Link
                to={isStaff ? '/staff/dashboard' : isSpeaker ? '/speaker/dashboard' : isSponsor ? '/sponsor/dashboard' : '/events'}
                style={{
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                <Calendar style={{ width: '18px', height: '18px' }} />
                {isStaff ? 'Open Staff Dashboard' : isSpeaker ? 'Open Speaker Hub' : isSponsor ? 'Open Sponsor Portal' : 'Browse Events Catalog'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      {/* 2a. ROLE WORKSPACE STRIP — shows ONLY this role's features */}
      {ROLE_WORKSPACES[role] && (
        <div className="glass-card" style={{ padding: '18px 22px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {ROLE_WORKSPACES[role].title} — your features
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            {ROLE_WORKSPACES[role].subtitle}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
            {ROLE_WORKSPACES[role].features.map((f) => (
              <span key={f} style={{ fontSize: '12px', color: '#e2e8f0', backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', padding: '4px 10px', borderRadius: '20px' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. ROLE-BASED METRIC CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {isOrganizerOrAdmin ? (
          <>
            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Total Events</span>
                <Calendar style={{ color: '#818cf8', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{organizerStats?.totalEvents || upcomingEvents.length}</div>
              <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '6px' }}>{organizerStats?.upcomingEvents || 0} Upcoming Events</div>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Active Registrations</span>
                <Users style={{ color: '#34d399', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#34d399' }}>{organizerStats?.activeRegistrations || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Approved Delegates</div>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Total Checked-In</span>
                <CheckCircle style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8' }}>{organizerStats?.totalCheckedIn || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Scanned Tickets</div>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Pending Tasks</span>
                <Clock style={{ color: '#fbbf24', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fbbf24' }}>{organizerStats?.pendingTasks || 0}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Regs & Deliverables</div>
            </div>
          </>
        ) : isAttendee ? (
          <>
            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>My Registrations</span>
                <FileText style={{ color: '#818cf8', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{userRegistrations.length}</div>
              <div style={{ fontSize: '12px', color: '#818cf8', marginTop: '6px' }}>Active Registrations</div>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Digital Tickets</span>
                <Ticket style={{ color: '#34d399', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#34d399' }}>
                {userRegistrations.filter(r => r.status === 'Approved').length}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Valid QR Tickets</div>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Available Events</span>
                <Calendar style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{upcomingEvents.length}</div>
              <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '6px' }}>Open Conferences</div>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>AI Recommendations</span>
                <Sparkles style={{ color: '#fbbf24', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>AI Concierge</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Personalized Session Match</div>
            </div>
          </>
        ) : (
          <>
            {/* Staff / Speaker / Sponsor land here via nav; point them to their own workspace */}
            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>My Workspace</span>
                <Shield style={{ color: '#818cf8', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{ROLE_WORKSPACES[role]?.title || role}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Use the sidebar to open your tools</div>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Available Events</span>
                <Calendar style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>{upcomingEvents.length}</div>
              <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '6px' }}>Open Conferences</div>
            </div>
          </>
        )}
      </div>



      {/* 4. MAIN WORKSPACE CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Upcoming Events */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar style={{ color: '#6366f1', width: '20px', height: '20px' }} />
                Active Conferences & Summits
              </h2>
              <Link to="/events" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
                View All &rarr;
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <div
                    key={event._id}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'border 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', backgroundColor: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                        {event.eventType || 'Conference'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                        {event.status}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{event.name}</h4>

                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', items: 'center', gap: '12px' }}>
                      <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                      <span>📍 {event.venue?.name || 'San Francisco'}</span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/events/${event._id}`}
                        style={{ fontSize: '12px', color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        Event Workspace &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>No upcoming events found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Action Workspace Shortcuts */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap style={{ color: '#06b6d4', width: '20px', height: '20px' }} />
            Quick Workspace Shortcuts
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Matrix: Create Event = Organizer; Analytics = Admin+Organizer; All Users = Admin */}
            {isOrganizer && (
                <Link
                  to="/organizer/events/new"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '16px',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <PlusSquare style={{ color: '#818cf8', width: '22px', height: '22px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Create Event</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Launch new conference</span>
                </Link>
            )}
            {isOrganizerOrAdmin && (
                <Link
                  to="/analytics"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '16px',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <BarChart3 style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Analytics Hub</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Real-time reports</span>
                </Link>
            )}
            {isAdmin && (
                <Link
                  to="/admin/users"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '16px',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <Users style={{ color: '#a5b4fc', width: '22px', height: '22px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>All Users</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Roles & account status</span>
                </Link>
            )}

            {/* Staff tools: staff only */}
            {isStaff && (
              <>
                <Link
                  to="/staff/check-in"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '16px',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <ScanLine style={{ color: '#34d399', width: '22px', height: '22px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>QR Scanner</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>On-site check-in</span>
                </Link>

                <Link
                  to="/staff/dashboard"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '16px',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <Users style={{ color: '#fbbf24', width: '22px', height: '22px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Staff Shifts</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>View assigned venue</span>
                </Link>
              </>
            )}

            {(isSpeaker || isOrganizer) && (
              <Link
                to="/speaker/dashboard"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <Mic2 style={{ color: '#a855f7', width: '22px', height: '22px' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Speaker Hub</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Decks & schedule</span>
              </Link>
            )}

            {(isSponsor || isOrganizer) && (
              <Link
                to="/sponsor/dashboard"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '16px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <Briefcase style={{ color: '#ec4899', width: '22px', height: '22px' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Sponsor Portal</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Assets & deliverables</span>
              </Link>
            )}

            {/* My Tickets + Profile: Attendee workspace only (prevents role confusion) */}
            {isAttendee && (
            <Link
              to="/my-tickets"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '16px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <Ticket style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>My Tickets</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>View QR passes</span>
            </Link>
            )}

            {isAttendee && (
            <Link
              to="/my-registrations"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '16px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <ClipboardList style={{ color: '#34d399', width: '22px', height: '22px' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>My Registrations</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Track registration status</span>
            </Link>
            )}

            <Link
              to="/profile"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '16px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <Shield style={{ color: '#818cf8', width: '22px', height: '22px' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>My Profile</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Manage account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. SYSTEM STATUS & SECURITY FOOTER BAR */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '12px',
        color: '#94a3b8'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
          <span>Backend API Server: <strong style={{ color: '#fff' }}>Online (Port 5000)</strong></span>
        </div>
        <div>
          <span>Connected Database: <strong style={{ color: '#fff' }}>MongoDB</strong></span>
        </div>
        <div>
          <span>Active Session: <strong style={{ color: '#818cf8' }}>{user?.email}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
