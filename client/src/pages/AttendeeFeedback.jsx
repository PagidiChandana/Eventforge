import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyFeedback } from '../services/analyticsService';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertError from '../components/AlertError';
import { Star } from 'lucide-react';

export default function AttendeeFeedback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMyFeedback();
        setItems(res.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading your feedback..." />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Star style={{ width: '24px', height: '24px', color: '#fbbf24' }} /> My Feedback
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
          Ratings and comments you submitted. To rate a session, open its event → Leave Feedback.
        </p>
      </div>

      {error && <AlertError message={error} onClose={() => setError(null)} />}

      {items.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>No feedback submitted yet</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Attend sessions, then share your rating. <Link to="/events" style={{ color: '#38bdf8' }}>Browse events</Link>
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((f) => (
            <div key={f._id} className="glass-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  {f.session?.title || f.event?.name || 'Event'}
                </span>
                <span style={{ color: '#fbbf24', fontSize: '14px' }}>{'★'.repeat(f.rating || 0)}{'☆'.repeat(5 - (f.rating || 0))}</span>
              </div>
              {f.comment && <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '8px', fontStyle: 'italic' }}>"{f.comment}"</p>}
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                {f.event?.name}{f.createdAt ? ` · ${new Date(f.createdAt).toLocaleString()}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
