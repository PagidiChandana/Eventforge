import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEventOperationsOverview, searchAttendeeForSupport } from '../services/operationsService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import EmptyState from '../components/EmptyState';
import { Users, UserCheck, Clock, Search, Shield, Activity, BarChart2 } from 'lucide-react';

const EventOperationsDashboard = () => {
  const { eventId } = useParams();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Support Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEventOperationsOverview(eventId);
      setOverview(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load operations metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [eventId]);

  const handleSupportSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await searchAttendeeForSupport(eventId, searchQuery.trim());
      setSearchResults(res.data || []);
    } catch (err) {
      setError(err.message || 'Attendee lookup failed.');
    } finally {
      setSearching(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading live operational metrics..." />;
  if (error || !overview) return <AlertError message={error || 'Event operational overview unavailable.'} />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>
          Event Operations Dashboard
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
          Live gate check-ins, registration throughput, staff assignments, and attendee support for <strong style={{ color: '#06b6d4' }}>{overview.event?.name}</strong>
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Approved Registrations</span>
            <Users style={{ color: '#6366f1', width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{overview.totalRegistered}</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Checked In Delegates</span>
            <UserCheck style={{ color: '#10b981', width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>{overview.totalCheckedIn}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{overview.checkInPercentage}% Throughput</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Awaiting Check-in</span>
            <Clock style={{ color: '#f59e0b', width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fcd34d' }}>{overview.notCheckedIn}</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Waitlisted</span>
            <Activity style={{ color: '#ef4444', width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{overview.totalWaitlisted}</div>
        </div>
      </div>

      {/* Attendee Support Lookup Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search style={{ color: '#06b6d4', width: '20px', height: '20px' }} />
          Help Desk Attendee & Registration Support Lookup
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
          Search attendee by name or email to check ticket status, QR token, and gate check-in record
        </p>

        <form onSubmit={handleSupportSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search attendee name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={searching}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: '#06b6d4',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {searching ? 'Searching...' : 'Search Delegate'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {searchResults.map(res => (
              <div key={res.registrationId} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>{res.attendee?.name} ({res.attendee?.email})</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Tier: <span style={{ color: '#818cf8' }}>{res.ticketCategory}</span> | Ticket #: <span style={{ color: '#06b6d4' }}>{res.ticketNumber}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: res.isCheckedIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: res.isCheckedIn ? '#6ee7b7' : '#fcd34d',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {res.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventOperationsDashboard;
