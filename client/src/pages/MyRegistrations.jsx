import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRegistrations, cancelRegistration } from '../services/registrationService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import { Calendar, Ticket, MapPin, Clock, XCircle, Eye } from 'lucide-react';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [activeView, setActiveView] = useState('Active');

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyRegistrations();
      setRegistrations(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelRegistration(cancelTarget._id);
      await fetchRegistrations();
    } catch (err) {
      setError(err.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your event registrations..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>My Registrations</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
          Manage your active event registrations, waitlist status, and booking history
        </p>
      </div>

      {/* TABS */}
      {(() => {
        const now = new Date();
        const activeRegs = registrations.filter(r => r.status !== 'Cancelled' && (!r.event?.endDate || new Date(r.event.endDate) >= now));
        const historyRegs = registrations.filter(r => r.status === 'Cancelled' || (r.event?.endDate && new Date(r.event.endDate) < now));
        const displayedRegs = activeView === 'Active' ? activeRegs : historyRegs;

        return (
          <>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Active', 'History'].map(tab => (
                <button key={tab} onClick={() => setActiveView(tab)} style={{ padding: '10px 20px', border: 'none', backgroundColor: 'transparent', color: activeView === tab ? '#fff' : '#64748b', borderBottom: activeView === tab ? '2px solid #6366f1' : '2px solid transparent', fontWeight: activeView === tab ? 700 : 500, fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                  {tab} ({tab === 'Active' ? activeRegs.length : historyRegs.length})
                </button>
              ))}
            </div>

            {error && <AlertError message={error} onClose={() => setError(null)} />}

            {displayedRegs.length === 0 ? (
              <EmptyState
                title={activeView === 'Active' ? 'No Active Registrations' : 'No History Found'}
                message={activeView === 'Active' ? 'You have no active event registrations.' : 'Cancelled or past event registrations will appear here.'}
                icon={Calendar}
                action={
                  activeView === 'Active' ? (
                    <Link
                      to="/events"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#6366f1', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
                    >
                      Browse Events Catalog
                    </Link>
                  ) : null
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {displayedRegs.map(reg => (
                  <div key={reg._id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{
                          backgroundColor: reg.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : reg.status === 'Waitlisted' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: reg.status === 'Approved' ? '#6ee7b7' : reg.status === 'Waitlisted' ? '#fcd34d' : '#f87171',
                          padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                        }}>
                          {reg.status}
                        </span>
                        <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: 600 }}>
                          {reg.ticketCategory?.name} (${reg.finalPrice})
                        </span>
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{reg.event?.name}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8', flexWrap: 'wrap' }}>
                        <span><Calendar style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} /> {new Date(reg.event?.startDate).toLocaleDateString()}</span>
                        <span><MapPin style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} /> {reg.event?.venue?.name || 'Virtual'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {activeView === 'Active' && reg.status !== 'Cancelled' && (
                        <button
                          onClick={() => setCancelTarget(reg)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <XCircle style={{ width: '15px', height: '15px' }} /> Cancel Registration
                        </button>
                      )}
                      <Link
                        to={`/events/${reg.event?._id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                      >
                        <Eye style={{ width: '15px', height: '15px' }} /> View Event
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      <ConfirmModal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Registration?"
        message={`Are you sure you want to cancel your registration for "${cancelTarget?.event?.name}"? If you cancel an approved registration, your spot will be promoted to the next waitlisted attendee.`}
      />
    </div>
  );
};

export default MyRegistrations;
