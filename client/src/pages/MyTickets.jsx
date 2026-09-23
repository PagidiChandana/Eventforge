import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyTickets } from '../services/registrationService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import EmptyState from '../components/EmptyState';
import { Ticket, Calendar, QrCode, Eye } from 'lucide-react';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMyTickets();
        setTickets(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load tickets.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) return <LoadingSpinner message="Fetching your digital event passes..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>My Tickets & Passes</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
          Access your digital entry passes and QR verification codes
        </p>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      {tickets.length === 0 ? (
        <EmptyState
          title="No Active Tickets"
          message="You currently have no issued digital tickets."
          icon={Ticket}
          action={
            <Link
              to="/events"
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
              Find Events
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {tickets.map(t => (
            <div key={t._id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    {t.ticketCategory?.name}
                  </span>
                  <span style={{ backgroundColor: t.status === 'Valid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: t.status === 'Valid' ? '#6ee7b7' : '#f87171', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    {t.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  {t.event?.name}
                </h3>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  <Calendar style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                  {new Date(t.event?.startDate).toLocaleDateString()}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  {t.ticketNumber}
                </div>

                <Link
                  to={`/tickets/${t._id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <QrCode style={{ width: '15px', height: '15px' }} />
                  View Pass
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
