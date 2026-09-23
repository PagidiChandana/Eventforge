import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getHomeForRole } from '../constants/roles';

const Unauthorized = () => {
  const { user } = useAuth();
  const home = getHomeForRole(user?.role);
  return (
    <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '60px auto', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '40px 30px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <ShieldAlert style={{ width: '36px', height: '36px' }} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
          403 - Access Denied
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
          You are not authorized to access this page. Each role in EventForge has its own
          workspace — you have been kept in yours. If you believe this is an error, please
          contact your Event Organizer or Platform Administrator.
        </p>
        <Link
          to={home}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#6366f1',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Back to My Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
