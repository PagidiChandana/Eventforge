import React, { useEffect, useState } from 'react';
import { getMyStaffShifts, searchAttendeeForSupport, processQRCheckIn } from '../services/operationsService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Ticket as TicketIcon,
  FileText,
  User,
  Mail,
  Calendar,
  CreditCard,
  Clock,
  Layers,
  X,
  Building,
  QrCode
} from 'lucide-react';

/**
 * StaffSupport — Event Staff → Attendee Support Dashboard
 * Allows staff to look up attendee registrations by Name, Email, or Ticket Code (e.g., EF-7647-BC246F57).
 * Shows full registration status, ticket type, code, payment, check-in status, selected sessions,
 * and provides instant Check-In, View Ticket, and View Registration modal actions.
 */
export default function StaffSupport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [eventId, setEventId] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [checkingInId, setCheckingInId] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // { type: 'ticket' | 'registration', data: item }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyStaffShifts();
        const list = res.data || [];
        setShifts(list);
        const firstEvent = list[0]?.event?._id || list[0]?.event;
        if (firstEvent) setEventId(firstEvent.toString());
      } catch (err) {
        setError(err.message || 'Failed to load staff shifts.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    if (!eventId) {
      setError('Please select an event to perform operational checks.');
      return;
    }
    setSearching(true);
    setError(null);
    setSuccess(null);
    setHasSearched(true);
    try {
      const res = await searchAttendeeForSupport(eventId, query.trim());
      setResults(res.data || []);
    } catch (err) {
      setError(err.message || 'Attendee lookup failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async (item) => {
    const userId = item.attendee?._id || item.attendee;
    setCheckingInId(userId);
    setError(null);
    setSuccess(null);
    try {
      const res = await processQRCheckIn(
        item.qrToken || item.ticketCode || item.ticketNumber,
        eventId,
        item.ticketId,
        item.ticketCode || item.ticketNumber,
        item.attendee?._id || item.attendee
      );

      // Update card state in results array immediately
      setResults((prev) =>
        prev.map((r) => {
          const rId = r.attendee?._id || r.attendee;
          if (rId === userId) {
            return {
              ...r,
              isCheckedIn: true,
              checkedInAt: res.data?.checkedInAt || new Date().toISOString()
            };
          }
          return r;
        })
      );
      setSuccess(`Checked in ${item.attendee?.name || 'attendee'} successfully!`);
    } catch (err) {
      setError(err.message || 'Check-in failed.');
    } finally {
      setCheckingInId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading support tools..." />;

  const eventIds = [...new Map(shifts.map((s) => [(s.event?._id || s.event)?.toString?.(), s.event])).values()];
  const selectedEventObj = eventIds.find((ev) => (ev?._id || ev)?.toString() === eventId);
  const selectedEventName = selectedEventObj?.name || 'Selected Event';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.7))',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LifeBuoy style={{ width: '26px', height: '26px' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>
              Attendee Support & Verification
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
              Look up attendee registrations, verify ticket codes, check-in status, and manage on-site entry.
            </p>
          </div>
        </div>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}
      {success && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            padding: '14px 18px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 style={{ width: '18px', height: '18px' }} />
          {success}
        </div>
      )}

      {/* Controls Panel */}
      <div className="glass-panel" style={{ padding: '22px', borderRadius: '14px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Event Select Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Operational Event
            </label>
            <select
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setResults([]);
                setHasSearched(false);
              }}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#fff',
                borderRadius: '10px',
                padding: '11px 14px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="">Choose an assigned event…</option>
              {eventIds.map((ev) => (
                <option key={ev?._id || ev} value={ev?._id || ev}>
                  {ev?.name || 'Event'}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '260px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Search Attendee / Ticket Code
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#64748b'
                }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Name, Email, or Ticket Code (e.g. EF-7647-BC246F57)…"
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 42px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Submit Search Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              style={{
                backgroundColor: searching || !query.trim() ? '#475569' : '#6366f1',
                color: '#fff',
                border: 'none',
                padding: '11px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: searching || !query.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                height: '42px'
              }}
            >
              {searching ? 'Searching…' : 'Search Support'}
            </button>
          </div>
        </form>
      </div>

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {searching && <LoadingSpinner message="Searching attendee registration records..." />}

        {!searching && hasSearched && results.length === 0 && (
          <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
            <User style={{ width: '40px', height: '40px', color: '#475569', margin: '0 auto 12px auto' }} />
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No Attendees Found</h3>
            <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
              No attendee or ticket matching "<strong style={{ color: '#cbd5e1' }}>{query}</strong>" was found for {selectedEventName}.
            </p>
          </div>
        )}

        {!searching && !hasSearched && (
          <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            <LifeBuoy style={{ width: '40px', height: '40px', color: '#38bdf8', margin: '0 auto 12px auto', opacity: 0.6 }} />
            <h3 style={{ color: '#cbd5e1', fontSize: '16px', fontWeight: 600 }}>Ready for Operational Lookup</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Select an event and enter an attendee's name, email address, or ticket code above to inspect their status.
            </p>
          </div>
        )}

        {results.map((r, idx) => {
          const isRegistered = r.isRegistered;
          const status = r.registrationStatus || 'Not Registered';
          const isCheckedIn = r.isCheckedIn;

          return (
            <div
              key={r.registrationId || r.attendee?._id || idx}
              className="glass-card"
              style={{
                padding: '22px',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              {/* Card Top: User Info & Status Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 800,
                      border: '1px solid rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    {r.attendee?.name ? r.attendee.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {r.attendee?.name || 'Unknown Attendee'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>
                      <Mail style={{ width: '14px', height: '14px', color: '#64748b' }} />
                      <span>{r.attendee?.email || 'N/A'}</span>
                      {r.attendee?.organization && (
                        <>
                          <span style={{ color: '#475569' }}>•</span>
                          <Building style={{ width: '14px', height: '14px', color: '#64748b' }} />
                          <span>{r.attendee.organization}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {!isRegistered ? (
                    <span
                      style={{
                        backgroundColor: 'rgba(148, 163, 184, 0.15)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        color: '#cbd5e1',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      Not Registered for this Event
                    </span>
                  ) : status === 'Registered' || status === 'Approved' ? (
                    <span
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      Registered ✓
                    </span>
                  ) : status === 'Waitlisted' ? (
                    <span
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#fbbf24',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      Waitlisted
                    </span>
                  ) : status === 'Cancelled' ? (
                    <span
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      Cancelled
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        color: '#818cf8',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      {status}
                    </span>
                  )}
                </div>
              </div>

              {/* Data Grid: Registration & Ticket details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ticket Type</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                    {r.ticketCategory || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ticket Code</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '2px', fontFamily: 'monospace' }}>
                    {r.ticketCode || r.ticketNumber || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Registration Date</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginTop: '2px' }}>
                    {r.registrationDate
                      ? new Date(r.registrationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Payment Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginTop: '2px' }}>
                    {r.paymentStatus || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Check-in Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: isCheckedIn ? '#34d399' : '#fbbf24', marginTop: '2px' }}>
                    {isCheckedIn
                      ? `✅ Checked In ${r.checkedInAt ? `(${new Date(r.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}`
                      : '⏳ Not Checked In'}
                  </div>
                </div>
              </div>

              {/* Selected Sessions Section */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers style={{ width: '14px', height: '14px', color: '#818cf8' }} />
                  Selected Sessions ({r.selectedSessions?.length || 0})
                </div>
                {r.selectedSessions && r.selectedSessions.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {r.selectedSessions.map((s, sIdx) => (
                      <span
                        key={s._id || sIdx}
                        style={{
                          backgroundColor: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          color: '#a5b4fc',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {s.title} {s.roomName ? `(${s.roomName})` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, italic: true }}>
                    No specific sessions selected for this registration.
                  </p>
                )}
              </div>

              {/* Staff Action Buttons Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '14px',
                  alignItems: 'center'
                }}
              >
                {/* [Check In] Button — enabled only if registered, not already checked in, and event is currently ONGOING */}
                {isRegistered && (status === 'Registered' || status === 'Approved') && !isCheckedIn && (
                  <>
                    {r.isEventOngoing ? (
                      <button
                        onClick={() => handleCheckIn(r)}
                        disabled={checkingInId === (r.attendee?._id || r.attendee)}
                        style={{
                          backgroundColor: '#10b981',
                          color: '#fff',
                          border: 'none',
                          padding: '9px 18px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: checkingInId === (r.attendee?._id || r.attendee) ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                        {checkingInId === (r.attendee?._id || r.attendee) ? 'Processing…' : 'Check In'}
                      </button>
                    ) : (
                      <span
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Clock style={{ width: '14px', height: '14px' }} />
                        {r.eventTimingStatus === 'Upcoming'
                          ? 'Check-in opens when event starts'
                          : 'Check-in unavailable (Event Ended)'}
                      </span>
                    )}
                  </>
                )}

                {isCheckedIn && (
                  <span
                    style={{
                      color: '#34d399',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginRight: 'auto'
                    }}
                  >
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                    Check-in Complete
                  </span>
                )}

                {/* [View Ticket] Button */}
                {(r.ticketCode || r.ticketNumber || r.qrToken) && (
                  <button
                    onClick={() => setActiveModal({ type: 'ticket', data: r })}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <TicketIcon style={{ width: '15px', height: '15px' }} />
                    View Ticket
                  </button>
                )}

                {/* [View Registration] Button */}
                {isRegistered && (
                  <button
                    onClick={() => setActiveModal({ type: 'registration', data: r })}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#818cf8',
                      border: '1px solid rgba(129, 140, 248, 0.4)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText style={{ width: '15px', height: '15px' }} />
                    View Registration
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL: View Ticket Details --- */}
      {activeModal?.type === 'ticket' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '20px',
              padding: '24px',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <TicketIcon style={{ width: '22px', height: '22px', color: '#38bdf8' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Digital Ticket Pass</h2>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Event</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>{selectedEventName}</div>

              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '16px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Attendee</div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{activeModal.data.attendee?.name}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Category</div>
                  <div style={{ color: '#818cf8', fontWeight: 700 }}>{activeModal.data.ticketCategory || 'General'}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Ticket Code</div>
                  <div style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'monospace' }}>{activeModal.data.ticketCode || activeModal.data.ticketNumber}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Check-in Status</div>
                  <div style={{ color: activeModal.data.isCheckedIn ? '#34d399' : '#fbbf24', fontWeight: 700 }}>
                    {activeModal.data.isCheckedIn ? 'Checked In' : 'Valid Pass'}
                  </div>
                </div>
              </div>

              {activeModal.data.qrToken && (
                <div style={{ marginTop: '20px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <QrCode style={{ width: '48px', height: '48px', color: '#38bdf8', margin: '0 auto 6px auto' }} />
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    Token: {activeModal.data.qrToken}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  backgroundColor: '#334155',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: View Registration Details --- */}
      {activeModal?.type === 'registration' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              borderRadius: '20px',
              padding: '24px',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <FileText style={{ width: '22px', height: '22px', color: '#818cf8' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Registration Specification</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Registration ID</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>{activeModal.data.registrationId}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Status</div>
                  <div style={{ color: '#34d399', fontWeight: 700 }}>{activeModal.data.registrationStatus}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Ticket Code</div>
                  <div style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>{activeModal.data.ticketCode}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Payment Summary</div>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{activeModal.data.paymentStatus}</div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Selected Event Sessions</div>
                {activeModal.data.selectedSessions?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activeModal.data.selectedSessions.map((s, idx) => (
                      <div key={s._id || idx} style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: '8px', color: '#a5b4fc', fontSize: '12px' }}>
                        <strong>{s.title}</strong> {s.roomName ? `· Venue: ${s.roomName}` : ''}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '12px' }}>No session choices recorded.</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  backgroundColor: '#334155',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
