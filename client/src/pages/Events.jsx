import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvents } from '../services/eventService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import EmptyState from '../components/EmptyState';
import { Calendar, MapPin, Users, Search, Filter, Plus, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchEventsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvents();
      setEvents(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load events list from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Matrix: Event Creation = Organizer only
  const isOrganizer = user && user.role === 'Event Organizer';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>Corporate Events Catalog</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Explore active conferences, workshops, exhibitions, and executive seminars
          </p>
        </div>

        {isOrganizer && (
          <Link
            to="/organizer/events/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#6366f1',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            Create Event
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0 12px' }}>
          <Search style={{ color: '#64748b', width: '18px', height: '18px' }} />
          <input
            type="text"
            placeholder="Search events by name or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'none', border: 'none', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter style={{ color: '#64748b', width: '18px', height: '18px' }} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f1f5f9',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Categories</option>
            <option value="General">General</option>
            <option value="Technology">Technology</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="DevOps">DevOps</option>
          </select>
        </div>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner message="Fetching corporate events from database..." />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No Events Found"
          message="There are currently no events matching your criteria."
          icon={Calendar}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredEvents.map(event => (
            <div key={event._id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <span style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {event.eventType}
                  </span>
                  <span style={{
                    backgroundColor: event.status === 'Registration Open' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: event.status === 'Registration Open' ? '#6ee7b7' : '#fcd34d',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {event.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  {event.name}
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {event.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                  <Calendar style={{ width: '16px', height: '16px', color: '#6366f1' }} />
                  <span>{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                  <MapPin style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
                  <span>{event.venue ? `${event.venue.name} (${event.venue.city})` : 'Virtual Event'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
                  <Users style={{ width: '16px', height: '16px', color: '#10b981' }} />
                  <span>Capacity: {event.capacity} Attendees</span>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    to={`/events/${event._id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#fff',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    <Eye style={{ width: '15px', height: '15px' }} />
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
