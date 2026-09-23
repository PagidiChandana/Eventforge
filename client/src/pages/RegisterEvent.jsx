import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById } from '../services/eventService';
import { getTicketCategories, validateCoupon, registerForEvent } from '../services/registrationService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { Ticket, CheckCircle, Tag, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';

const RegisterEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eRes, cRes] = await Promise.all([
          getEventById(eventId),
          getTicketCategories(eventId)
        ]);

        setEvent(eRes.data);
        const cats = cRes.data || [];
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load event registration details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedCategory) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCoupon(eventId, couponCode, selectedCategory.price);
      setCouponResult(res.data);
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon.');
      setCouponResult(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedCategory) {
      setError('Please select a ticket category.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ticketCategoryId: selectedCategory._id,
        couponCode: couponResult?.valid ? couponCode : undefined
      };

      const res = await registerForEvent(eventId, payload);
      if (res.data.ticket) {
        navigate(`/tickets/${res.data.ticket._id}`);
      } else {
        navigate('/attendee/registrations');
      }
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      // Handle duplicate registration — show a friendly state
      if (err.status === 409 || msg.toLowerCase().includes('already registered')) {
        setError('You are already registered for this event. Head to My Tickets to view your pass.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Preparing registration portal..." />;
  if (error || !event) return <AlertError message={error || 'Event not found'} />;

  const finalPrice = couponResult?.valid ? couponResult.finalPrice : selectedCategory?.price || 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(`/events/${eventId}`)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}
      >
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        Back to Event Details
      </button>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
          <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
            Official Event Registration
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginTop: '8px', marginBottom: '4px' }}>
            {event.name}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {new Date(event.startDate).toLocaleDateString()} • {event.venue?.name || 'Virtual'}
          </p>
        </div>

        {error && <AlertError message={error} onClose={() => setError(null)} />}

        {/* Step 1: Select Ticket Category */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket style={{ color: '#6366f1', width: '20px', height: '20px' }} />
            1. Select Ticket Tier
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', color: '#94a3b8' }}>
                <p>No ticket categories available for this event yet.</p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>Please check back later or contact the organizer.</p>
              </div>
            ) : (
              categories.map(cat => {
                const isSelected = selectedCategory?._id === cat._id;
                const isSoldOut = cat.soldCount >= cat.capacity;

                return (
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    key={cat._id}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCouponResult(null);
                      setCouponError(null);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      color: 'inherit',
                      font: 'inherit',
                      padding: '16px 20px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                      border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{cat.name}</h4>
                        {isSoldOut && (
                          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            Waitlist Mode
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>{cat.description}</p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
                        ${cat.price}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {isSoldOut ? 'Sold Out (Waitlist Available)' : `${cat.capacity - cat.soldCount} spots left`}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Step 2: Promo / Coupon Code */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag style={{ color: '#06b6d4', width: '20px', height: '20px' }} />
              2. Apply Coupon Code (Optional)
            </h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['SAVE20', 'EARLY10', 'EARLY2026'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setCouponCode(code);
                    if (selectedCategory) {
                      validateCoupon(eventId, code, selectedCategory.price)
                        .then(res => setCouponResult(res.data))
                        .catch(err => setCouponError(err.message));
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#a5b4fc',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="e.g. SUMMIT20"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: '10px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                textTransform: 'uppercase'
              }}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={validatingCoupon || !couponCode.trim()}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {validatingCoupon ? 'Checking...' : 'Apply'}
            </button>
          </div>

          {couponResult?.valid && (
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle style={{ width: '16px', height: '16px' }} />
              Coupon Applied! Discount: -${couponResult.discountAmount}
            </div>
          )}

          {couponError && (
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#f87171' }}>
              {couponError}
            </div>
          )}
        </div>

        {/* Step 3: Order Summary & Confirmation */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>
            <span>Ticket Tier ({selectedCategory?.name}):</span>
            <span>${selectedCategory?.price || 0}</span>
          </div>
          {couponResult?.valid && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6ee7b7' }}>
              <span>Coupon ({couponCode}):</span>
              <span>-${couponResult.discountAmount}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: '#fff' }}>
            <span>Total Payable:</span>
            <span style={{ color: '#10b981' }}>${finalPrice}</span>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={submitting || !selectedCategory}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            backgroundColor: '#6366f1',
            border: 'none',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'background-color 0.2s ease'
          }}
        >
          {submitting ? 'Processing Registration...' : selectedCategory?.soldCount >= selectedCategory?.capacity ? 'Confirm Waitlist Spot' : `Complete Registration ($${finalPrice})`}
        </button>
      </div>
    </div>
  );
};

export default RegisterEvent;
