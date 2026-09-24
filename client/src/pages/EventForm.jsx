import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEvent, updateEvent, getEventById, getVenues, getOrganizations } from '../services/eventService';
import { getStaffDirectory } from '../services/operationsService';
import AlertError from '../components/AlertError';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, MapPin, Building, ArrowLeft, Save, Sparkles } from 'lucide-react';

const EventForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const getDefaultDateTime = (daysAhead = 7, hour = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'Conference',
    category: 'General',
    startDate: getDefaultDateTime(7, 9),
    endDate: getDefaultDateTime(7, 17),
    registrationStart: getDefaultDateTime(0, 9),
    registrationEnd: getDefaultDateTime(6, 23),
    venue: '',
    organization: '',
    capacity: 500,
    status: 'Draft',
    contactEmail: '',
    tags: ''
  });

  const [venues, setVenues] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [checkInStaffEmail, setCheckInStaffEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState(null);
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [vRes, oRes, staffRes] = await Promise.all([
          getVenues(),
          getOrganizations(),
          isEdit ? Promise.resolve({ data: [] }) : getStaffDirectory()
        ]);
        setVenues(vRes.data || []);
        setOrganizations(oRes.data || []);
        setStaffDirectory(staffRes.data || []);

        if (isEdit) {
          const eRes = await getEventById(id);
          const ev = eRes.data;
          setFormData({
            name: ev.name || '',
            description: ev.description || '',
            eventType: ev.eventType || 'Conference',
            category: ev.category || 'General',
            startDate: ev.startDate ? ev.startDate.substring(0, 16) : '',
            endDate: ev.endDate ? ev.endDate.substring(0, 16) : '',
            registrationStart: ev.registrationStart ? ev.registrationStart.substring(0, 16) : '',
            registrationEnd: ev.registrationEnd ? ev.registrationEnd.substring(0, 16) : '',
            venue: ev.venue ? (ev.venue._id || ev.venue) : '',
            organization: ev.organization ? (ev.organization._id || ev.organization) : '',
            capacity: ev.capacity || 500,
            status: ev.status || 'Draft',
            contactEmail: ev.contactEmail || '',
            tags: ev.tags ? ev.tags.join(', ') : ''
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load form metadata');
      } finally {
        setFetching(false);
      }
    };

    loadInitialData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('Event start date must be before end date.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        ...(!isEdit ? { checkInStaffEmail } : {}),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      if (!isEdit && !checkInStaffEmail) {
        setError('Select an Event Staff member to handle this event’s check-ins.');
        setLoading(false);
        return;
      }

      if (!payload.venue) delete payload.venue;
      if (!payload.organization) delete payload.organization;

      if (isEdit) {
        await updateEvent(id, payload);
        navigate(`/events/${id}`);
      } else {
        const res = await createEvent(payload);
        navigate(`/events/${res.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Error saving event');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LoadingSpinner message="Loading event details..." />;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '14px'
        }}
      >
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        Back
      </button>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          {isEdit ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
          Fill in details for your corporate event or conference
        </p>

        {error && <AlertError message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Event Title *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Global Tech & AI Summit 2026"
              style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                Description *
              </label>
            </div>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a comprehensive summary of the event agenda, topics, and expectations..."
              style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Event Type
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              >
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Exhibition">Exhibition</option>
                <option value="Seminar">Seminar</option>
                <option value="Corporate Meeting">Corporate Meeting</option>
                <option value="Networking Event">Networking Event</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Registration Open">Registration Open</option>
                <option value="Registration Closed">Registration Closed</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Capacity (Attendees) *
              </label>
              <input
                type="number"
                name="capacity"
                required
                min={1}
                value={formData.capacity}
                onChange={handleChange}
                style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Event Start Date & Time *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '8px',
                  color: '#fff',
                  colorScheme: 'dark',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Event End Date & Time *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                required
                value={formData.endDate}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '8px',
                  color: '#fff',
                  colorScheme: 'dark',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Registration Opens Date & Time
              </label>
              <input
                type="datetime-local"
                name="registrationStart"
                value={formData.registrationStart}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  colorScheme: 'dark',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Registration Closes Date & Time
              </label>
              <input
                type="datetime-local"
                name="registrationEnd"
                value={formData.registrationEnd}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  colorScheme: 'dark',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Venue Location
              </label>
              <select
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              >
                <option value="">-- Select Venue (Optional) --</option>
                {venues.map(v => (
                  <option key={v._id} value={v._id}>{v.name} ({v.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Host Organization
              </label>
              <select
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              >
                <option value="">-- Select Organization (Optional) --</option>
                {organizations.map(o => (
                  <option key={o._id} value={o._id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="events@company.com"
                style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="AI, Cloud, Keynotes"
                style={{ width: '100%', padding: '11px 14px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          {!isEdit && (
            <div style={{ padding: '18px', borderRadius: '10px', border: '1px solid rgba(6,182,212,.25)', background: 'rgba(6,182,212,.06)' }}>
              <label htmlFor="check-in-staff" style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '7px' }}>
                Event check-in staff *
              </label>
              <select
                id="check-in-staff"
                required
                value={checkInStaffEmail}
                onChange={(e) => setCheckInStaffEmail(e.target.value)}
                disabled={staffDirectory.length === 0}
                style={{ width: '100%', padding: '11px 14px', backgroundColor: '#0f172a', border: '1px solid rgba(6,182,212,.35)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
              >
                <option value="">Select active staff member</option>
                {staffDirectory.map((staff) => <option key={staff._id} value={staff.email}>{staff.name} ({staff.email})</option>)}
              </select>
              <p style={{ color: staffDirectory.length ? '#94a3b8' : '#fbbf24', fontSize: '12px', marginTop: '7px' }}>
                {staffDirectory.length
                  ? 'This staff member will be assigned to this event and can verify its attendee tickets.'
                  : 'No active Event Staff accounts are available. Ask a Platform Admin to create a staff account before creating this event.'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: '11px 20px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!isEdit && staffDirectory.length === 0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 24px',
                borderRadius: '8px',
                backgroundColor: '#6366f1',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading || (!isEdit && staffDirectory.length === 0) ? 'not-allowed' : 'pointer',
                opacity: loading || (!isEdit && staffDirectory.length === 0) ? 0.7 : 1
              }}
            >
              <Save style={{ width: '16px', height: '16px' }} />
              {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default EventForm;
