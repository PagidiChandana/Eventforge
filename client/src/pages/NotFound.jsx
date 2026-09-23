import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '500px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '40px' }}>
        <AlertCircle style={{ width: '64px', height: '64px', color: '#ef4444', margin: '0 auto 20px auto', display: 'block' }} />
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>404 - Page Not Found</h1>
        <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '28px', lineHeight: '1.6' }}>
          The page or resource you requested does not exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#6366f1',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          <Home style={{ width: '18px', height: '18px' }} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
