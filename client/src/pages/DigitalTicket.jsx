import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById } from '../services/registrationService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { Ticket, Calendar, MapPin, User, ArrowLeft, Download, ShieldCheck, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const DigitalTicket = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handlePrint = () => window.print();

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getTicketById(ticketId);
        setTicket(res.data);
      } catch (err) {
        setError(err.message || 'Could not retrieve ticket details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (loading) return <LoadingSpinner message="Generating digital pass..." />;
  if (error || !ticket) return <AlertError message={error || 'Ticket not found.'} />;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; color: #000 !important; } }`}</style>
      <button
        className="no-print"
        onClick={() => navigate('/my-tickets')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}
      >
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        Back to My Tickets
      </button>

      <div className="glass-panel" style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
        {/* Ticket Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255, 255, 255, 0.15)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#06b6d4', fontWeight: 700 }}>
              Official Delegate Pass
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
              {ticket.event?.name}
            </h1>
          </div>
          <span style={{
            backgroundColor: ticket.status === 'Valid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: ticket.status === 'Valid' ? '#6ee7b7' : '#f87171',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 700
          }}>
            {ticket.status} Pass
          </span>
        </div>

        {/* Ticket Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Attendee Name</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{ticket.attendee?.name}</div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{ticket.attendee?.email}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Ticket Tier</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#818cf8' }}>{ticket.ticketCategory?.name}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Date & Schedule</div>
            <div style={{ fontSize: '14px', color: '#fff' }}>{new Date(ticket.event?.startDate).toLocaleDateString()}</div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Venue Location</div>
            <div style={{ fontSize: '14px', color: '#fff' }}>{ticket.event?.venue?.name || 'Virtual'} ({ticket.event?.venue?.city || 'Online'})</div>
          </div>
        </div>

        {/* Digital QR Pass Box */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          color: '#0f172a',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{
              width: '240px',
              minHeight: '250px',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
              padding: '16px'
            }}>
              <QRCodeCanvas value={ticket.qrToken} size={210} level="M" includeMargin />
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', letterSpacing: '0.5px' }}>SECURE EVENT SCAN</span>
            </div>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '1.5px', color: '#0f172a' }}>
            {ticket.ticketNumber}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Present this QR token at event entrance check-in counter
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck style={{ width: '16px', height: '16px', color: '#10b981' }} />
          Cryptographically Signed Digital Pass • EventForge Security Layer
        </div>

        <button
          className="no-print"
          onClick={handlePrint}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            backgroundColor: '#6366f1', color: '#fff', padding: '12px 24px',
            borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '14px',
            cursor: 'pointer', width: '100%', marginTop: '16px'
          }}
        >
          <Printer style={{ width: '18px', height: '18px' }} />
          Download / Print Ticket
        </button>
      </div>
    </div>
  );
};

export default DigitalTicket;
