import React, { useState } from 'react';
import { submitFeedback } from '../services/analyticsService';

/**
 * FeedbackModal — Premium redesign with proper layout, star rating, and styled buttons.
 * Uses 100% inline styles to guarantee rendering regardless of CSS framework state.
 */
export default function FeedbackModal({ isOpen, onClose, eventId, eventName, sessionId = null, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
  const ratingColors = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#10b981' };

  const displayRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitFeedback(eventId, { sessionId, rating, comment });
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSubmitted(false);
        setRating(5);
        setComment('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please ensure you are registered for this event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Event Feedback"
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)'
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
              ⭐ Submit Feedback
            </h3>
            <p style={{ fontSize: '13px', color: '#a5b4fc', margin: '4px 0 0 0', fontWeight: 500 }}>
              {eventName || 'Event Review'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close feedback modal"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', width: '34px', height: '34px', borderRadius: '8px',
              fontSize: '18px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Error Banner */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px', padding: '12px 14px', marginBottom: '20px',
              fontSize: '13px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: '52px', marginBottom: '12px' }}>🎉</div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
                Thank You for Your Feedback!
              </h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                Your response has been submitted to the event organizers.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Star Rating */}
              <div>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 700, color: '#a5b4fc',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px'
                }}>
                  Overall Rating *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      style={{
                        background: 'none', border: 'none', padding: '4px',
                        fontSize: '32px', cursor: 'pointer', lineHeight: 1,
                        transition: 'transform 0.15s ease',
                        transform: displayRating >= star ? 'scale(1.1)' : 'scale(1)',
                        color: displayRating >= star ? (ratingColors[displayRating] || '#f59e0b') : 'rgba(255,255,255,0.15)'
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{
                    marginLeft: '8px', fontSize: '13px', fontWeight: 700,
                    color: ratingColors[displayRating] || '#f59e0b',
                    minWidth: '90px'
                  }}>
                    {ratingLabels[displayRating]}
                  </span>
                </div>
                {/* Rating dots progress */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                      key={dot}
                      style={{
                        height: '4px', flex: 1, borderRadius: '2px',
                        backgroundColor: displayRating >= dot
                          ? (ratingColors[displayRating] || '#f59e0b')
                          : 'rgba(255,255,255,0.1)',
                        transition: 'background-color 0.2s ease'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label
                  htmlFor="feedback-comment"
                  style={{
                    display: 'block', fontSize: '12px', fontWeight: 700, color: '#a5b4fc',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'
                  }}
                >
                  Comments & Suggestions <span style={{ color: '#475569', fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience, what you loved, or suggestions for improvement…"
                  style={{
                    width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px', color: '#f1f5f9', fontSize: '14px',
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                    transition: 'border-color 0.2s ease', lineHeight: '1.6'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 20px', borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.target.style.color = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.06)';
                    e.target.style.color = '#94a3b8';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="feedback-submit-btn"
                  disabled={loading}
                  style={{
                    padding: '10px 24px', borderRadius: '10px',
                    background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Submitting…
                    </>
                  ) : (
                    '✓ Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
