import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  getEventById,
  deleteEvent,
  getSessionsByEvent, createSession, deleteSession,
  getPackagesByEvent, createPackage, deletePackage,
  getSponsorsByEvent, createSponsor, deleteSponsor,
  getAnnouncementsByEvent, createAnnouncement, deleteAnnouncement,
  getVenues, getSpeakers,
  getDeliverablesByEvent, updateDeliverableStatusByOrganizer
} from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { getMyRegistrations, getEventRegistrationsForOrganizer, updateRegistrationStatus, getTicketCategories, getCouponsByEvent, createTicketCategory, updateTicketCategory, deleteTicketCategory, createCoupon } from '../services/registrationService';
import { getStaffAssignments, getStaffDirectory, assignStaff, updateStaffAssignment, deleteStaffAssignment } from '../services/operationsService';
import { getOrganizerSpeakers, createDeliverable, createSpeakerForOrganizer, assignSpeakerToSession } from '../services/modulesService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import FeedbackModal from '../components/FeedbackModal';
import {
  Calendar, MapPin, Users, Edit, Trash2, Plus, Clock, Megaphone,
  Award, Briefcase, FileText, ArrowLeft, Shield, AlertCircle, Sparkles, Star,
  CheckCircle2, XCircle, Package, ExternalLink, Ticket, Tag, UserCheck
} from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab Data States
  const [sessions, setSessions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [updatingDeliverableId, setUpdatingDeliverableId] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [updatingRegistrationId, setUpdatingRegistrationId] = useState(null);
  const [regFilter, setRegFilter] = useState('All');
  const [ticketCategories, setTicketCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [staffAssignments, setStaffAssignments] = useState([]);

  // Modal States
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ name: '', description: '', price: 0, capacity: 100, saleStart: '', saleEnd: '' });
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'Percentage', discountValue: 0, usageLimit: 100, validFrom: '', validUntil: '' });
  const [staffForm, setStaffForm] = useState({ staffEmail: '', role: 'Check-in Staff', responsibilities: '' });
  const [availableStaff, setAvailableStaff] = useState([]);

  // Available options for session creation
  const [allVenues, setAllVenues] = useState([]);
  const [allSpeakers, setAllSpeakers] = useState([]);

  // Modal States
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [deliverableModalOpen, setDeliverableModalOpen] = useState(false);
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Form States
  const [sessionForm, setSessionForm] = useState({
    title: '', description: '', sessionType: 'Keynote', roomName: 'Auditorium Alpha',
    startTime: '', endTime: '', capacity: 100, speakers: []
  });

  const [packageForm, setPackageForm] = useState({
    name: '', description: '', price: 5000, quantityAvailable: 5, benefits: ''
  });

  const [sponsorForm, setSponsorForm] = useState({
    companyName: '', contactName: '', contactEmail: '', website: '', assignedPackage: ''
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '', message: '', targetAudience: 'All'
  });
  const [deliverableForm, setDeliverableForm] = useState({ sponsor: '', name: '', description: '', dueDate: '' });
  const [speakerForm, setSpeakerForm] = useState({ name: '', designation: '', company: '', contactEmail: '', sessionId: '' });

  const [actionError, setActionError] = useState(null);
  const [savingSession, setSavingSession] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // Matrix: event management (sessions, sponsors, packages, announcements, edit/delete)
  // is Organizer-only AND owned by that organizer. Admin has no event-management rights.
  const eventOrganizerId = event?.organizer?._id || event?.organizer;
  const currentUserId = user?.id || user?._id;
  const isEventOwner = user?.role === 'Event Organizer'
    && eventOrganizerId?.toString() === currentUserId?.toString();
  const isAttendeeRole = user?.role === 'Attendee';
  const eventSpeakers = [...new Map(
    sessions.flatMap((session) => (session.speakers || []).map((speaker) => [speaker._id, speaker]))
  ).values()];

  // Check if this attendee is already registered for this event
  useEffect(() => {
    if (!isAttendeeRole || !id) return;
    getMyRegistrations()
      .then((res) => {
        const regs = res.data || [];
        const active = regs.find(
          (r) => r.event && (r.event._id === id || r.event === id) && r.status !== 'Cancelled'
        );
        setAlreadyRegistered(!!active);
      })
      .catch(() => setAlreadyRegistered(false));
  }, [isAttendeeRole, id]);

  const fetchEventAndSubData = async () => {
    setLoading(true);
    setError(null);
    try {
      const eRes = await getEventById(id);
      setEvent(eRes.data);

      const [sRes, pRes, spRes, aRes, vRes, spkRes] = await Promise.all([
        getSessionsByEvent(id),
        getPackagesByEvent(id),
        getSponsorsByEvent(id),
        getAnnouncementsByEvent(id),
        getVenues(),
        getSpeakers()
      ]);

      setSessions(sRes.data || []);
      setPackages(pRes.data || []);
      setSponsors(spRes.data || []);
      setAnnouncements(aRes.data || []);
      setAllVenues(vRes.data || []);
      setAllSpeakers(spkRes.data || []);

      // Fetch deliverables and registrations only for organizers
      if (eRes.data && eRes.data.organizer) {
        const organizerId = eRes.data.organizer._id || eRes.data.organizer;
        const currentUserId = user?.id || user?._id;
        if (user?.role === 'Event Organizer' && organizerId?.toString() === currentUserId?.toString()) {
          getOrganizerSpeakers()
            .then((result) => setAllSpeakers(result.data?.speakers || []))
            .catch(() => {});
        }
        getDeliverablesByEvent(id).then(r => setDeliverables(r.data || [])).catch(() => {});
        getEventRegistrationsForOrganizer(id).then(r => setRegistrations(r.data || [])).catch(() => {});
        getTicketCategories(id).then(r => setTicketCategories(r.data || [])).catch(() => {});
        getCouponsByEvent(id).then(r => setCoupons(r.data || [])).catch(() => {});
        getStaffAssignments(id).then(r => setStaffAssignments(r.data || [])).catch(() => {});
        getStaffDirectory().then(r => setAvailableStaff(r.data || [])).catch(() => {});
      }
    } catch (err) {
      setError(err.message || 'Failed to load event information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndSubData();
  }, [id]);

  useEffect(() => {
    if (!event || !isEventOwner || searchParams.get('addSession') !== '1') return;
    setActiveTab('Sessions');
    setActionError(null);
    setSessionModalOpen(true);
  }, [event, isEventOwner, searchParams]);

  // Handlers for Session Creation with Conflict Catching
  const handleCreateSession = async (e) => {
    e.preventDefault();
    setActionError(null);
    const startTime = new Date(sessionForm.startTime);
    const endTime = new Date(sessionForm.endTime);
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      setActionError('Choose a valid start and end date/time.');
      return;
    }
    if (startTime >= endTime) {
      setActionError('Session start time must be before end time.');
      return;
    }
    if (!sessionForm.title.trim() || !sessionForm.roomName.trim()) {
      setActionError('Enter a session title and room.');
      return;
    }
    setSavingSession(true);
    try {
      const result = await createSession(id, {
        ...sessionForm,
        title: sessionForm.title.trim(),
        roomName: sessionForm.roomName.trim(),
        speakers: (sessionForm.speakers || []).filter(Boolean)
      });
      const createdSession = result?.data;
      if (!createdSession?._id) throw new Error('The server did not confirm that the session was saved. Please try again.');
      setSessions((current) => [...current, createdSession].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
      setSessionModalOpen(false);
      setSessionForm({ title: '', description: '', sessionType: 'Keynote', roomName: 'Auditorium Alpha', startTime: '', endTime: '', capacity: 100, speakers: [] });
      // The create response is authoritative; refresh in the background without
      // showing a false create failure if this follow-up read is temporarily unavailable.
      getSessionsByEvent(id).then((res) => setSessions(res.data || [])).catch(() => {});
    } catch (err) {
      setActionError(err.message || 'Could not create the session. Check the schedule and try again.');
    } finally {
      setSavingSession(false);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      const payload = {
        ...packageForm,
        benefits: packageForm.benefits ? packageForm.benefits.split(',').map(b => b.trim()) : []
      };
      await createPackage(id, payload);
      setPackageModalOpen(false);
      const res = await getPackagesByEvent(id);
      setPackages(res.data || []);
    } catch (err) {
      setActionError(err.message || 'Error creating package');
    }
  };

  const handleCreateEventSpeaker = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      const result = await createSpeakerForOrganizer({
        name: speakerForm.name,
        designation: speakerForm.designation,
        company: speakerForm.company,
        contactEmail: speakerForm.contactEmail
      });
      const speaker = result.data;
      if (speakerForm.sessionId && speaker?._id) {
        await assignSpeakerToSession(speakerForm.sessionId, speaker._id);
      }
      setSpeakerModalOpen(false);
      setSpeakerForm({ name: '', designation: '', company: '', contactEmail: '', sessionId: '' });
      const [sessionsRes, speakersRes] = await Promise.all([getSessionsByEvent(id), getOrganizerSpeakers()]);
      setSessions(sessionsRes.data || []);
      setAllSpeakers(speakersRes.data?.speakers || []);
    } catch (err) {
      setActionError(err.message || 'Could not add the speaker to this event.');
    }
  };

  const handleCreateSponsor = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      const payload = { ...sponsorForm };
      if (!payload.assignedPackage) delete payload.assignedPackage;
      await createSponsor(id, payload);
      setSponsorModalOpen(false);
      setSponsorForm({ companyName: '', contactName: '', contactEmail: '', website: '', assignedPackage: '' });
      const res = await getSponsorsByEvent(id);
      setSponsors(res.data || []);
    } catch (err) {
      setActionError(err.message || 'Error adding sponsor');
    }
  };

  const handleCreateDeliverable = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await createDeliverable({ ...deliverableForm, event: id, dueDate: deliverableForm.dueDate || undefined });
      setDeliverableModalOpen(false);
      setDeliverableForm({ sponsor: '', name: '', description: '', dueDate: '' });
      const res = await getDeliverablesByEvent(id);
      setDeliverables(res.data || []);
    } catch (err) {
      setActionError(err.message || 'Failed to assign deliverable.');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await createAnnouncement(id, announcementForm);
      setAnnouncementModalOpen(false);
      const res = await getAnnouncementsByEvent(id);
      setAnnouncements(res.data || []);
    } catch (err) {
      setActionError(err.message || 'Error posting announcement');
    }
  };

  const handleCreateTicketCategory = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await createTicketCategory(id, ticketForm);
      setTicketModalOpen(false);
      setTicketForm({ name: '', description: '', price: 0, capacity: 100, saleStart: '', saleEnd: '' });
      const res = await getTicketCategories(id);
      setTicketCategories(res.data || []);
    } catch (err) { setActionError(err.message || 'Error creating ticket category'); }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await createCoupon(id, couponForm);
      setCouponModalOpen(false);
      setCouponForm({ code: '', discountType: 'Percentage', discountValue: 0, usageLimit: 100, validFrom: '', validUntil: '' });
      const res = await getCouponsByEvent(id);
      setCoupons(res.data || []);
    } catch (err) { setActionError(err.message || 'Error creating coupon'); }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await assignStaff(id, staffForm);
      setStaffModalOpen(false);
      setStaffForm({ staffEmail: '', role: 'Check-in Staff', responsibilities: '' });
      const res = await getStaffAssignments(id);
      setStaffAssignments(res.data || []);
    } catch (err) { setActionError(err.message || 'Error assigning staff'); }
  };

  const handleUpdateStaffStatus = async (assignmentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Off Duty' : 'Active';
      await updateStaffAssignment(id, assignmentId, { status: newStatus });
      setStaffAssignments(prev => prev.map(s => s._id === assignmentId ? { ...s, status: newStatus } : s));
    } catch (err) { setActionError(err.message || 'Error updating staff status'); }
  };

  const handleDeleteStaff = async (assignmentId) => {
    try {
      await deleteStaffAssignment(id, assignmentId);
      setStaffAssignments(prev => prev.filter(s => s._id !== assignmentId));
    } catch (err) { setActionError(err.message || 'Error deleting staff assignment'); }
  };

  const handleToggleTicketActive = async (categoryId, currentStatus) => {
    try {
      await updateTicketCategory(id, categoryId, { isActive: !currentStatus });
      setTicketCategories(prev => prev.map(t => t._id === categoryId ? { ...t, isActive: !currentStatus } : t));
    } catch (err) { setActionError(err.message || 'Error updating ticket status'); }
  };

  const handleDeleteTicketCategory = async (categoryId) => {
    try {
      await deleteTicketCategory(id, categoryId);
      setTicketCategories(prev => prev.filter(t => t._id !== categoryId));
    } catch (err) { setActionError(err.message || 'Error deleting ticket category'); }
  };

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent(id);
      navigate('/events');
    } catch (err) {
      setError(err.message || 'Error deleting event');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSession(id, sessionId);
      setSessions(sessions.filter(s => s._id !== sessionId));
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading full event management workspace..." />;
  if (error || !event) return <AlertError message={error || 'Event not found'} />;

  // Matrix: AI Recommendations = Attendee only; management tabs stay visible for
  // browsing (View scope) but all mutation buttons are owner-gated above.
  const tabs = isAttendeeRole
    ? ['Overview', 'Venues', 'Sessions', 'Speakers', 'Sponsors', 'Packages', 'Announcements']
    : ['Overview', 'Venues', 'Sessions', 'Speakers', 'Sponsors', 'Packages', 'Announcements', ...(isEventOwner ? ['Event Team', 'Deliverables', 'Registrations', 'Tickets & Coupons', 'Staff'] : []), 'Operations'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner & Breadcrumbs */}
      <div>
        <button
          onClick={() => navigate('/events')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            marginBottom: '16px',
            fontSize: '14px'
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Back to Events Catalog
        </button>

        <div className="glass-panel" style={{ padding: '28px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {event.eventType}
                </span>
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                  {event.status}
                </span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                {event.name}
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '15px', maxWidth: '700px', lineHeight: '1.6' }}>
                {event.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Matrix: Feedback Submit = Attendee only */}
              {isAttendeeRole && (
                <button
                  onClick={() => setFeedbackModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <Star style={{ width: '15px', height: '15px' }} />
                  Leave Feedback
                </button>
              )}

              {isEventOwner && event.status !== 'Cancelled' && (
                <>
                  <Link
                    to={`/events/${id}/edit`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      textDecoration: 'none'
                    }}
                  >
                    <Edit style={{ width: '15px', height: '15px' }} />
                    Edit Event
                  </Link>

                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 style={{ width: '15px', height: '15px' }} />
                    Delete Event
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto', paddingBottom: '4px' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              backgroundColor: activeTab === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === tab ? '#fff' : '#94a3b8',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {actionError && !sessionModalOpen && <AlertError message={actionError} onClose={() => setActionError(null)} />}

      {activeTab === 'Event Team' && isEventOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <h2 style={{ color: '#fff', fontSize: '19px', fontWeight: 800 }}>Event team · {event.name}</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px' }}>Review the people and sponsor commitments assigned to this event. Use Manage to add or change assignments.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
            {[
              { title: 'Speakers', count: eventSpeakers.length, tab: 'Speakers', icon: Calendar, rows: eventSpeakers.map((speaker) => {
                const assignedSessions = sessions.filter((session) => (session.speakers || []).some((assigned) => (assigned._id || assigned).toString() === speaker._id.toString())).map((session) => session.title);
                return { primary: speaker.name, secondary: assignedSessions.length ? `Sessions: ${assignedSessions.join(', ')}` : 'No session assigned' };
              }) },
              { title: 'Staff', count: staffAssignments.length, tab: 'Staff', icon: UserCheck, rows: staffAssignments.map((member) => ({ primary: member.staffUser?.name || member.staffUser?.email || 'Staff member', secondary: `${member.role} · ${member.status}` })) },
              { title: 'Sponsorship packages', count: packages.length, tab: 'Packages', icon: Award, rows: packages.map((pkg) => ({ primary: pkg.name, secondary: `$${Number(pkg.price || 0).toLocaleString()} · ${pkg.quantityAvailable ?? '—'} available` })) },
              { title: 'Sponsors', count: sponsors.length, tab: 'Sponsors', icon: Briefcase, rows: sponsors.map((sponsor) => ({ primary: sponsor.companyName, secondary: `Package: ${sponsor.assignedPackage?.name || 'Not assigned'}` })) },
              { title: 'Sponsor deliverables', count: deliverables.length, tab: 'Deliverables', icon: Package, rows: deliverables.map((item) => ({ primary: item.name, secondary: `${item.sponsor?.companyName || 'Sponsor'} · ${item.status}${item.dueDate ? ` · Due ${new Date(item.dueDate).toLocaleDateString()}` : ''}` })) }
            ].map((group) => {
              const Icon = group.icon;
              return (
                <section key={group.title} className="glass-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '15px', fontWeight: 800 }}><Icon style={{ width: '17px', height: '17px', color: '#a5b4fc' }} />{group.title} <span style={{ color: '#94a3b8' }}>({group.count})</span></h3>
                    <button type="button" onClick={() => setActiveTab(group.tab)} style={{ border: '1px solid rgba(99,102,241,.35)', borderRadius: '7px', padding: '6px 9px', background: 'rgba(99,102,241,.12)', color: '#c7d2fe', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>Manage</button>
                  </div>
                  {group.rows.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{group.rows.map((row, index) => <div key={`${row.primary}-${index}`} style={{ padding: '9px 10px', background: 'rgba(15,23,42,.55)', borderRadius: '8px' }}><div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{row.primary}</div><div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>{row.secondary}</div></div>)}</div> : <p style={{ color: '#64748b', fontSize: '12px' }}>Nothing assigned yet.</p>}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar style={{ color: '#6366f1', width: '20px', height: '20px' }} />
              Schedule & Timing
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#cbd5e1' }}>
              <div>Start: <strong style={{ color: '#fff' }}>{new Date(event.startDate).toLocaleString()}</strong></div>
              <div>End: <strong style={{ color: '#fff' }}>{new Date(event.endDate).toLocaleString()}</strong></div>
              <div>Capacity: <strong style={{ color: '#fff' }}>{event.capacity} Attendees</strong></div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin style={{ color: '#06b6d4', width: '20px', height: '20px' }} />
              Location & Host
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#cbd5e1' }}>
              <div>Venue: <strong style={{ color: '#fff' }}>{event.venue ? event.venue.name : 'Unassigned Venue'}</strong></div>
              <div>City: <strong style={{ color: '#fff' }}>{event.venue ? event.venue.city : 'N/A'}</strong></div>
              <div>Organizer: <strong style={{ color: '#fff' }}>{event.organizer ? event.organizer.name : 'Admin'}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC REGISTRATION CTA (guests → login; attendees → register flow) */}
      {(activeTab === 'Overview') && (!user || isAttendeeRole) && (
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
              {alreadyRegistered
                ? '✅ You are registered for this event'
                : event.status === 'Registration Open' || event.status === 'Published' ? 'Registrations are open' : `Status: ${event.status}`}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              {alreadyRegistered
                ? 'Your ticket has been issued. View your digital pass below.'
                : user ? 'Secure your ticket, pick sessions, and get your QR pass.' : 'Sign in as an attendee to register and get your QR ticket.'}
            </div>
          </div>
          {alreadyRegistered ? (
            <button
              onClick={() => navigate('/attendee/tickets')}
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '11px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
            >
              View My Ticket →
            </button>
          ) : (
            <button
              onClick={() => navigate(user ? `/events/${id}/register` : '/login')}
              style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
            >
              {user ? 'Register for Event' : 'Login to Register'}
            </button>
          )}
        </div>
      )}

      {/* TAB 2: VENUES */}
      {activeTab === 'Venues' && (
        <div>
          {event.venue ? (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{event.venue.name}</h3>
              <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '16px' }}>{event.venue.address}, {event.venue.city}</p>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Max Capacity: {event.venue.capacity} delegates</div>
            </div>
          ) : (
            <EmptyState title="No Venue Linked" message="This event currently has no venue assigned." icon={MapPin} />
          )}
        </div>
      )}

      {/* TAB 3: SESSIONS */}
      {activeTab === 'Sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isEventOwner && event.status !== 'Cancelled' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setActionError(null); setSessionModalOpen(true); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#6366f1', color: '#fff', padding: '9px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus style={{ width: '16px', height: '16px' }} /> Add Session
              </button>
            </div>
          )}

          {sessions.length === 0 ? (
            <EmptyState title="No Sessions Scheduled" message="Click 'Add Session' to configure keynotes, breakouts, or workshops." icon={Clock} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {sessions.map(s => (
                <div key={s._id} className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{s.sessionType}</span>
                    {isEventOwner && event.status !== 'Cancelled' && (
                      <button onClick={() => handleDeleteSession(s._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 style={{ width: '15px', height: '15px' }} /></button>
                    )}
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{s.title}</h4>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>Room: <strong style={{ color: '#e2e8f0' }}>{s.roomName}</strong></div>
                  <div style={{ fontSize: '12px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock style={{ width: '14px', height: '14px' }} />
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SPEAKERS */}
      {activeTab === 'Speakers' && (
        <div>
          {isEventOwner && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '14px' }}>
              <button onClick={() => { setActionError(null); setSpeakerModalOpen(true); }} disabled={sessions.length === 0} style={{ backgroundColor: '#6366f1', color: '#fff', padding: '9px 14px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: sessions.length === 0 ? 'not-allowed' : 'pointer', opacity: sessions.length === 0 ? 0.5 : 1 }}>Add Speaker to Event</button>
              <Link to="/organizer/speakers" style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', padding: '9px 14px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>Manage Speakers</Link>
            </div>
          )}
          {eventSpeakers.length === 0 ? (
            <EmptyState title="No Speakers Assigned" message="Add speakers in Speaker Management, then assign them to sessions for this event." icon={Users} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {eventSpeakers.map(spk => (
                <div key={spk._id} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', fontWeight: 700 }}>
                    {spk.name.charAt(0)}
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{spk.name}</h4>
                  <div style={{ fontSize: '12px', color: '#06b6d4' }}>{spk.designation}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{spk.company}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    {sessions.filter((session) => session.speakers?.some((speaker) => speaker._id === spk._id)).map((session) => session.title).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SPONSORS */}
      {activeTab === 'Sponsors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isEventOwner && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSponsorModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#6366f1', color: '#fff', padding: '9px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus style={{ width: '16px', height: '16px' }} /> Add Sponsor
              </button>
            </div>
          )}

          {sponsors.length === 0 ? (
            <EmptyState title="No Corporate Sponsors" message="No sponsors registered for this event." icon={Briefcase} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {sponsors.map(sp => (
                <div key={sp._id} className="glass-card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{sp.companyName}</h4>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Contact: {sp.contactName} ({sp.contactEmail})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PACKAGES */}
      {activeTab === 'Packages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isEventOwner && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPackageModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#6366f1', color: '#fff', padding: '9px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus style={{ width: '16px', height: '16px' }} /> Create Package
              </button>
            </div>
          )}

          {packages.length === 0 ? (
            <EmptyState title="No Packages Configured" message="Add sponsorship tiers like Gold, Silver, or Platinum." icon={Award} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {packages.map(pkg => (
                <div key={pkg._id} className="glass-card" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{pkg.name}</h4>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', margin: '8px 0' }}>${pkg.price.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Available: {pkg.quantityAvailable} slots</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: ANNOUNCEMENTS */}
      {activeTab === 'Announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isEventOwner && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAnnouncementModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#6366f1', color: '#fff', padding: '9px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus style={{ width: '16px', height: '16px' }} /> Broadcast Announcement
              </button>
            </div>
          )}

          {announcements.length === 0 ? (
            <EmptyState title="No Announcements Broadcast" message="Broadcast updates to attendees, speakers, or staff." icon={Megaphone} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map(ann => (
                <div key={ann._id} className="glass-panel" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{ann.title}</h4>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(ann.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5' }}>{ann.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: DELIVERABLES (Organizer only) */}
      {activeTab === 'Deliverables' && isEventOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package style={{ width: '22px', height: '22px', color: '#818cf8' }} />
                Sponsor Deliverables
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                Review and approve deliverables submitted by sponsors for this event.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setDeliverableModalOpen(true)} disabled={sponsors.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: sponsors.length === 0 ? 'not-allowed' : 'pointer', opacity: sponsors.length === 0 ? 0.5 : 1 }}>
                <Plus style={{ width: '15px', height: '15px' }} /> Assign Deliverable
              </button>
              {(['Pending','Submitted','Approved','Rejected','In Progress']).map(s => (
                <span key={s} style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', backgroundColor:
                  s === 'Approved' ? 'rgba(16,185,129,0.15)' :
                  s === 'Rejected' ? 'rgba(239,68,68,0.15)' :
                  s === 'Submitted' ? 'rgba(99,102,241,0.15)' :
                  s === 'In Progress' ? 'rgba(251,191,36,0.15)' : 'rgba(100,116,139,0.15)',
                  color: s === 'Approved' ? '#34d399' : s === 'Rejected' ? '#f87171' : s === 'Submitted' ? '#818cf8' : s === 'In Progress' ? '#fbbf24' : '#94a3b8'
                }}>
                  {deliverables.filter(d => d.status === s).length} {s}
                </span>
              ))}
            </div>
          </div>

          {deliverables.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Package style={{ width: '44px', height: '44px', color: '#475569', margin: '0 auto 14px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>No Deliverables Yet</h4>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>Assign a deliverable to an event sponsor so they can submit the work and any supporting link.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {deliverables.map(d => {
                const statusColor = d.status === 'Approved' ? '#34d399' : d.status === 'Rejected' ? '#f87171' : d.status === 'Submitted' ? '#818cf8' : d.status === 'In Progress' ? '#fbbf24' : '#94a3b8';
                const statusBg = d.status === 'Approved' ? 'rgba(16,185,129,0.12)' : d.status === 'Rejected' ? 'rgba(239,68,68,0.12)' : d.status === 'Submitted' ? 'rgba(99,102,241,0.12)' : d.status === 'In Progress' ? 'rgba(251,191,36,0.12)' : 'rgba(100,116,139,0.12)';
                const isUpdating = updatingDeliverableId === d._id;

                const handleUpdateStatus = async (newStatus) => {
                  setUpdatingDeliverableId(d._id);
                  try {
                    const res = await updateDeliverableStatusByOrganizer(id, d._id, { status: newStatus });
                    setDeliverables(prev => prev.map(x => x._id === d._id ? { ...x, status: res.data.status } : x));
                  } catch (err) {
                    setActionError(err.message || 'Failed to update status.');
                  } finally {
                    setUpdatingDeliverableId(null);
                  }
                };

                return (
                  <div key={d._id} className="glass-card" style={{ padding: '20px 22px', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>{d.name}</h4>
                          <span style={{ backgroundColor: statusBg, color: statusColor, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{d.status}</span>
                          {d.package && <span style={{ backgroundColor: 'rgba(6,182,212,0.12)', color: '#38bdf8', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>{d.package.name}</span>}
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px 0' }}>{d.description || 'No description provided.'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                          <span><strong style={{ color: '#cbd5e1' }}>Sponsor:</strong> {d.sponsor?.companyName || 'N/A'}</span>
                          {d.sponsor?.contactEmail && <span>{d.sponsor.contactEmail}</span>}
                          {d.dueDate && <span><strong style={{ color: '#cbd5e1' }}>Due:</strong> {new Date(d.dueDate).toLocaleDateString()}</span>}
                        </div>
                        {d.notes && <p style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Notes: {d.notes}</p>}
                        {d.assetUrl && (
                          <a href={d.assetUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                            <ExternalLink style={{ width: '14px', height: '14px' }} /> View Submitted Asset
                          </a>
                        )}
                      </div>

                      {/* Action buttons — only show if not already Approved/Rejected */}
                      {d.status === 'Submitted' && (
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={() => handleUpdateStatus('Approved')}
                            disabled={isUpdating}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', fontWeight: 700, fontSize: '13px', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.6 : 1 }}
                          >
                            <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                            {isUpdating ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus('Rejected')}
                            disabled={isUpdating}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontWeight: 700, fontSize: '13px', cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.6 : 1 }}
                          >
                            <XCircle style={{ width: '15px', height: '15px' }} />
                            {isUpdating ? '…' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {/* Already decided badge */}
                      {(d.status === 'Approved' || d.status === 'Rejected') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: d.status === 'Approved' ? '#34d399' : '#f87171' }}>
                          {d.status === 'Approved' ? <CheckCircle2 style={{ width: '16px', height: '16px' }} /> : <XCircle style={{ width: '16px', height: '16px' }} />}
                          {d.status}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: REGISTRATIONS (Organizer only) */}
      {activeTab === 'Registrations' && isEventOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users style={{ width: '22px', height: '22px', color: '#10b981' }} />
                Attendee Registrations
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                Manage event registrations, approve attendees, and handle the waitlist.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['All', 'Pending', 'Approved', 'Waitlisted', 'Cancelled'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setRegFilter(filter)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: regFilter === filter ? '#10b981' : 'rgba(255,255,255,0.05)',
                    color: regFilter === filter ? '#fff' : '#94a3b8',
                    border: '1px solid',
                    borderColor: regFilter === filter ? '#10b981' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  {filter} ({filter === 'All' ? registrations.length : registrations.filter(r => r.status === filter).length})
                </button>
              ))}
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Users style={{ width: '44px', height: '44px', color: '#475569', margin: '0 auto 14px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>No Registrations Yet</h4>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>When attendees register for this event, they will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {registrations.filter(r => regFilter === 'All' || r.status === regFilter).map(reg => {
                const statusColor = reg.status === 'Approved' ? '#34d399' : reg.status === 'Rejected' ? '#f87171' : reg.status === 'Waitlisted' ? '#fbbf24' : reg.status === 'Cancelled' ? '#94a3b8' : '#818cf8';
                const statusBg = reg.status === 'Approved' ? 'rgba(16,185,129,0.12)' : reg.status === 'Rejected' ? 'rgba(239,68,68,0.12)' : reg.status === 'Waitlisted' ? 'rgba(251,191,36,0.12)' : reg.status === 'Cancelled' ? 'rgba(100,116,139,0.12)' : 'rgba(99,102,241,0.12)';
                const isUpdating = updatingRegistrationId === reg._id;

                const handleUpdateRegStatus = async (newStatus) => {
                  setUpdatingRegistrationId(reg._id);
                  try {
                    const res = await updateRegistrationStatus(reg._id, newStatus);
                    setRegistrations(prev => prev.map(x => x._id === reg._id ? { ...x, status: res.data.status, ticketCode: res.data.ticketCode } : x));
                  } catch (err) {
                    setActionError(err.response?.data?.message || err.message || 'Failed to update status.');
                  } finally {
                    setUpdatingRegistrationId(null);
                  }
                };

                return (
                  <div key={reg._id} className="glass-card" style={{ padding: '16px 20px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>{reg.attendee?.name || 'Unknown'}</h4>
                          <span style={{ backgroundColor: statusBg, color: statusColor, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{reg.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13px', color: '#94a3b8' }}>
                          <span>{reg.attendee?.email}</span>
                          {reg.attendee?.organization && <span><strong style={{ color: '#cbd5e1' }}>Org:</strong> {reg.attendee.organization}</span>}
                          <span><strong style={{ color: '#cbd5e1' }}>Ticket:</strong> {reg.ticketCategory?.name} (${reg.finalPrice})</span>
                          <span><strong style={{ color: '#cbd5e1' }}>Date:</strong> {new Date(reg.createdAt).toLocaleDateString()}</span>
                        </div>
                        {reg.ticketCode && (
                          <div style={{ marginTop: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                            Ticket #: {reg.ticketCode}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {reg.status === 'Pending' && (
                          <>
                            <button onClick={() => handleUpdateRegStatus('Approved')} disabled={isUpdating} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', fontWeight: 600, fontSize: '12px', cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
                              Approve
                            </button>
                            <button onClick={() => handleUpdateRegStatus('Rejected')} disabled={isUpdating} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontWeight: 600, fontSize: '12px', cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
                              Reject
                            </button>
                          </>
                        )}
                        {(reg.status === 'Approved' || reg.status === 'Waitlisted') && (
                          <button onClick={() => handleUpdateRegStatus('Cancelled')} disabled={isUpdating} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.4)', color: '#94a3b8', fontWeight: 600, fontSize: '12px', cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
                            Cancel Reg
                          </button>
                        )}
                        {reg.status === 'Cancelled' && (
                          <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>Cancelled</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {registrations.filter(r => regFilter === 'All' || r.status === regFilter).length === 0 && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  No registrations found for this filter.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: TICKETS & COUPONS (Organizer only) */}
      {activeTab === 'Tickets & Coupons' && isEventOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TICKET CATEGORIES SECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket style={{ color: '#10b981', width: '20px', height: '20px' }} />
                Ticket Tiers
              </h3>
              {event.status !== 'Cancelled' && (
                <button
                  onClick={() => setTicketModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#6366f1', color: '#fff', padding: '8px 14px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} /> Create Ticket
                </button>
              )}
            </div>
            
            {ticketCategories.length === 0 ? (
              <EmptyState title="No Ticket Tiers" message="Create General Admission, VIP, or Early-Bird tickets." icon={Ticket} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {ticketCategories.map(t => (
                  <div key={t._id} className="glass-card" style={{ padding: '20px', opacity: t.isActive ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{t.name}</h4>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: t.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: t.isActive ? '#10b981' : '#ef4444' }}>
                        {t.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', margin: '8px 0' }}>
                      ${t.price} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>/ ticket</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px', minHeight: '40px' }}>{t.description}</p>
                    
                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Capacity:</span> <span style={{ color: '#fff' }}>{t.capacity}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sold:</span> <span style={{ color: '#fff' }}>{t.soldCount}</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ width: `${Math.min(100, (t.soldCount / t.capacity) * 100)}%`, height: '100%', backgroundColor: '#38bdf8' }} />
                      </div>
                    </div>
                    
                    {event.status !== 'Cancelled' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleToggleTicketActive(t._id, t.isActive)} style={{ flex: 1, padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', cursor: 'pointer' }}>
                          {t.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDeleteTicketCategory(t._id)} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: 'none' }} />

          {/* COUPONS SECTION */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag style={{ color: '#f59e0b', width: '20px', height: '20px' }} />
                Discount Coupons
              </h3>
              {event.status !== 'Cancelled' && (
                <button
                  onClick={() => setCouponModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} /> New Coupon
                </button>
              )}
            </div>

            {coupons.length === 0 ? (
              <EmptyState title="No Active Coupons" message="Create promotional codes for special discounts." icon={Tag} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {coupons.map(c => (
                  <div key={c._id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, letterSpacing: '1px' }}>
                        {c.code}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                          {c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Used: {c.usedCount} / {c.usageLimit}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '12px', color: '#94a3b8' }}>
                      <span>Valid From: {c.validFrom ? new Date(c.validFrom).toLocaleDateString() : 'Always'}</span>
                      <span>Valid Until: {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: STAFF MANAGEMENT (Organizer only) */}
      {activeTab === 'Staff' && isEventOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck style={{ width: '22px', height: '22px', color: '#c084fc' }} />
                Event Staff Management
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                Assign Event Staff to check in attendees with the QR scanner or ticket lookup.
              </p>
            </div>
            {event.status !== 'Cancelled' && (
              <button
                onClick={() => setStaffModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#c084fc', color: '#fff', padding: '8px 14px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus style={{ width: '16px', height: '16px' }} /> Assign Staff
              </button>
            )}
          </div>

          {staffAssignments.length === 0 ? (
            <EmptyState title="No Check-in Staff Assigned" message="Assign an active Event Staff account to check in attendees for this event." icon={UserCheck} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {staffAssignments.map(staff => (
                <div key={staff._id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', opacity: staff.status === 'Active' ? 1 : 0.6 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                      {staff.staffUser?.name || 'Unknown User'}
                      </h4>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(192,132,252,0.15)', color: '#c084fc', fontWeight: 600 }}>
                        {staff.role}
                      </span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', backgroundColor: staff.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)', color: staff.status === 'Active' ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                        {staff.status}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                      <span><strong>Email:</strong> {staff.staffUser?.email}</span>
                      {staff.assignedVenue?.name && <span><strong>Area:</strong> {staff.assignedVenue.name}</span>}
                    </div>
                    
                    {staff.responsibilities && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                        "{staff.responsibilities}"
                      </p>
                    )}
                  </div>

                  {event.status !== 'Cancelled' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleUpdateStaffStatus(staff._id, staff.status)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', cursor: 'pointer' }}>
                        {staff.status === 'Active' ? 'Set Off Duty' : 'Activate'}
                      </button>
                      <button onClick={() => handleDeleteStaff(staff._id)} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: OPERATIONS */}
      {activeTab === 'Operations' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
            Event Operations & Permissions Overview
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
            Event ID: <strong style={{ color: '#fff' }}>{event._id}</strong><br />
            Event Slug: <strong style={{ color: '#fff' }}>{event.slug}</strong><br />
            Authorization Control: <strong style={{ color: '#6ee7b7' }}>Event-Scoped Access Active</strong>
          </p>
        </div>
      )}

      <Modal isOpen={sponsorModalOpen} onClose={() => setSponsorModalOpen(false)} title="Select Sponsor for Event">
        <form onSubmit={handleCreateSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {actionError && <AlertError message={actionError} onClose={() => setActionError(null)} />}
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Add an existing Sponsor account to this event. Their company profile will be linked to their account so they can enhance it in the Sponsor workspace.</p>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Company name *</label>
          <input required value={sponsorForm.companyName} onChange={e => setSponsorForm({ ...sponsorForm, companyName: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Sponsor account email *</label>
          <input type="email" required value={sponsorForm.contactEmail} onChange={e => setSponsorForm({ ...sponsorForm, contactEmail: e.target.value })} placeholder="Must match an active Sponsor account" style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Contact name</label>
          <input value={sponsorForm.contactName} onChange={e => setSponsorForm({ ...sponsorForm, contactName: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Sponsorship package</label>
          <select value={sponsorForm.assignedPackage} onChange={e => setSponsorForm({ ...sponsorForm, assignedPackage: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.8)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }}>
            <option value="">No package selected</option>
            {packages.map(pkg => <option key={pkg._id} value={pkg._id}>{pkg.name} · ${pkg.price}</option>)}
          </select>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Website</label>
          <input value={sponsorForm.website} onChange={e => setSponsorForm({ ...sponsorForm, website: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Add Sponsor to Event</button>
        </form>
      </Modal>

      <Modal isOpen={packageModalOpen} onClose={() => setPackageModalOpen(false)} title="Create Sponsorship Package">
        <form onSubmit={handleCreatePackage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {actionError && <AlertError message={actionError} onClose={() => setActionError(null)} />}
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Package name *</label>
          <input required value={packageForm.name} onChange={e => setPackageForm({ ...packageForm, name: e.target.value })} placeholder="Gold, Silver, or Platinum" style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Package description</label>
          <textarea rows={3} value={packageForm.description} onChange={e => setPackageForm({ ...packageForm, description: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Price *</label>
              <input type="number" required min="0" step="0.01" value={packageForm.price} onChange={e => setPackageForm({ ...packageForm, price: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Available slots *</label>
              <input type="number" required min="0" value={packageForm.quantityAvailable} onChange={e => setPackageForm({ ...packageForm, quantityAvailable: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
            </div>
          </div>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Benefits (comma separated)</label>
          <input value={packageForm.benefits} onChange={e => setPackageForm({ ...packageForm, benefits: e.target.value })} placeholder="Booth, logo placement, stage mention" style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Create Package</button>
        </form>
      </Modal>

      <Modal isOpen={speakerModalOpen} onClose={() => setSpeakerModalOpen(false)} title="Add Speaker to This Event">
        <form onSubmit={handleCreateEventSpeaker} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {actionError && <AlertError message={actionError} onClose={() => setActionError(null)} />}
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Speaker name *</label>
          <input required value={speakerForm.name} onChange={e => setSpeakerForm({ ...speakerForm, name: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Title</label>
              <input value={speakerForm.designation} onChange={e => setSpeakerForm({ ...speakerForm, designation: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Company</label>
              <input value={speakerForm.company} onChange={e => setSpeakerForm({ ...speakerForm, company: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
            </div>
          </div>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Email (optional)</label>
          <input type="email" value={speakerForm.contactEmail} onChange={e => setSpeakerForm({ ...speakerForm, contactEmail: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Assign to session *</label>
          <select required value={speakerForm.sessionId} onChange={e => setSpeakerForm({ ...speakerForm, sessionId: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.8)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }}>
            <option value="">Choose this event's session</option>
            {sessions.map(session => <option key={session._id} value={session._id}>{session.title} · {new Date(session.startTime).toLocaleString()}</option>)}
          </select>
          <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Add and Assign Speaker</button>
        </form>
      </Modal>

      <Modal isOpen={deliverableModalOpen} onClose={() => setDeliverableModalOpen(false)} title="Assign Sponsor Deliverable">
        <form onSubmit={handleCreateDeliverable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {actionError && <AlertError message={actionError} onClose={() => setActionError(null)} />}
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Selected event sponsor *</label>
          <select required value={deliverableForm.sponsor} onChange={e => setDeliverableForm({ ...deliverableForm, sponsor: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.8)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }}>
            <option value="">Choose sponsor</option>
            {sponsors.map(sp => <option key={sp._id} value={sp._id}>{sp.companyName}</option>)}
          </select>
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Deliverable *</label>
          <input required value={deliverableForm.name} onChange={e => setDeliverableForm({ ...deliverableForm, name: e.target.value })} placeholder="For example, event banner artwork" style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Instructions</label>
          <textarea value={deliverableForm.description} onChange={e => setDeliverableForm({ ...deliverableForm, description: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Due date</label>
          <input type="date" value={deliverableForm.dueDate} onChange={e => setDeliverableForm({ ...deliverableForm, dueDate: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', color: '#fff' }} />
          <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Assign Deliverable</button>
        </form>
      </Modal>

      {/* CREATE SESSION MODAL WITH CONFLICT CHECKING */}
      <Modal isOpen={sessionModalOpen} onClose={() => setSessionModalOpen(false)} title="Add Event Session">
        <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {actionError && <AlertError message={actionError} onClose={() => setActionError(null)} />}
          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Session Title *</label>
            <input type="text" required value={sessionForm.title} onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Session Type</label>
              <select value={sessionForm.sessionType} onChange={e => setSessionForm({ ...sessionForm, sessionType: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}>
                <option value="Keynote">Keynote</option>
                <option value="Workshop">Workshop</option>
                <option value="Breakout">Breakout</option>
                <option value="Panel">Panel</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Room / Venue *</label>
              <input type="text" required value={sessionForm.roomName} onChange={e => setSessionForm({ ...sessionForm, roomName: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Start Time *</label>
              <input type="datetime-local" required value={sessionForm.startTime} onChange={e => setSessionForm({ ...sessionForm, startTime: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>End Time *</label>
              <input type="datetime-local" required value={sessionForm.endTime} onChange={e => setSessionForm({ ...sessionForm, endTime: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Select Speaker</label>
            <select
              value={sessionForm.speakers[0] || ''}
              onChange={e => setSessionForm({ ...sessionForm, speakers: e.target.value ? [e.target.value] : [] })}
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}
            >
              <option value="">-- Choose Speaker (Optional) --</option>
              {allSpeakers.map(spk => (
                <option key={spk._id} value={spk._id}>{spk.name} ({spk.company})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setSessionModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={savingSession} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, cursor: savingSession ? 'wait' : 'pointer', opacity: savingSession ? 0.7 : 1 }}>{savingSession ? 'Creating…' : 'Create Session'}</button>
          </div>
        </form>
      </Modal>

      {/* CREATE ANNOUNCEMENT MODAL */}
      <Modal isOpen={announcementModalOpen} onClose={() => setAnnouncementModalOpen(false)} title="Broadcast Announcement">
        <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {actionError && <AlertError message={actionError} onClose={() => setActionError(null)} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Announcement Title *</label>
          </div>
          <input type="text" required value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />

          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Message Content *</label>
            <textarea required rows={4} value={announcementForm.message} onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setAnnouncementModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Broadcast</button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE EVENT MODAL */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteEvent}
        title="Delete Event?"
        message={`Are you sure you want to permanently delete "${event.name}"? This action cannot be undone and will delete all associated sessions, packages, and sponsors.`}
      />


      {/* FEEDBACK MODAL */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        eventId={id}
        eventName={event?.name}
      />

      {/* CREATE TICKET MODAL */}
      <Modal isOpen={ticketModalOpen} onClose={() => setTicketModalOpen(false)} title="Create Ticket Tier">
        <form onSubmit={handleCreateTicketCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Ticket Name *</label>
            <input type="text" required value={ticketForm.name} onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })} placeholder="e.g. Early Bird, VIP" style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Description</label>
            <textarea value={ticketForm.description} onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} rows={2} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Price ($) *</label>
              <input type="number" required min="0" step="0.01" value={ticketForm.price} onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Capacity *</label>
              <input type="number" required min="1" value={ticketForm.capacity} onChange={e => setTicketForm({ ...ticketForm, capacity: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Sale Start (Optional)</label>
              <input type="datetime-local" value={ticketForm.saleStart} onChange={e => setTicketForm({ ...ticketForm, saleStart: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Sale End (Optional)</label>
              <input type="datetime-local" value={ticketForm.saleEnd} onChange={e => setTicketForm({ ...ticketForm, saleEnd: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setTicketModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Create Ticket</button>
          </div>
        </form>
      </Modal>

      {/* CREATE COUPON MODAL */}
      <Modal isOpen={couponModalOpen} onClose={() => setCouponModalOpen(false)} title="Create Discount Coupon">
        <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Coupon Code *</label>
            <input type="text" required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER2026" style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Discount Type *</label>
              <select required value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}>
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Discount Value *</label>
              <input type="number" required min="1" max={couponForm.discountType === 'Percentage' ? "100" : undefined} value={couponForm.discountValue} onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Usage Limit (Total uses) *</label>
            <input type="number" required min="1" value={couponForm.usageLimit} onChange={e => setCouponForm({ ...couponForm, usageLimit: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Valid From (Optional)</label>
              <input type="datetime-local" value={couponForm.validFrom} onChange={e => setCouponForm({ ...couponForm, validFrom: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Valid Until (Optional)</label>
              <input type="datetime-local" value={couponForm.validUntil} onChange={e => setCouponForm({ ...couponForm, validUntil: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setCouponModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Create Coupon</button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN STAFF MODAL */}
      <Modal isOpen={staffModalOpen} onClose={() => setStaffModalOpen(false)} title="Assign Check-in Staff">
        <form onSubmit={handleAssignStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {actionError && <AlertError message={actionError} onClose={() => setActionError(null)} />}
          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Choose Event Staff *</label>
            <select required value={staffForm.staffEmail} onChange={e => setStaffForm({ ...staffForm, staffEmail: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}>
              <option value="">Select active staff</option>
              {availableStaff.map(staff => <option key={staff._id} value={staff.email}>{staff.name} ({staff.email})</option>)}
            </select>
            {availableStaff.length === 0 && <p style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>No active Event Staff accounts are available. Ask an admin to create a staff account first.</p>}
          </div>
          
          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Assignment *</label>
            <select required value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }}>
              <option value="Check-in Staff">Check-in attendees</option>
              <option value="Session Coordinator">Session Coordinator</option>
              <option value="Venue Coordinator">Venue Coordinator</option>
              <option value="Help Desk">Help Desk</option>
              <option value="Technical Support">Technical Support</option>
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Responsibilities (Optional)</label>
            <textarea value={staffForm.responsibilities} onChange={e => setStaffForm({ ...staffForm, responsibilities: e.target.value })} rows={2} placeholder="For example, scan attendee tickets at the main entrance" style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', fontSize: '14px' }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setStaffModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={availableStaff.length === 0} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#c084fc', color: '#fff', border: 'none', fontWeight: 600, cursor: availableStaff.length === 0 ? 'not-allowed' : 'pointer', opacity: availableStaff.length === 0 ? 0.5 : 1 }}>Assign Staff to Event</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventDetails;
