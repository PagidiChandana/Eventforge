import React from 'react';
import { Zap, Shield } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeForRole } from '../constants/roles';

const AUTH_ROUTES = ['/login', '/register', '/unauthorized'];

const Header = ({ onToggleSidebar }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'rgba(9, 13, 22, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Left: toggle + logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {!isAuthPage && (
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s'
            }}
            title="Toggle Navigation"
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <Link to={isAuthenticated ? getHomeForRole(user?.role) : '/login'} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
          }}>
            <Zap style={{ width: '20px', height: '20px' }} />
          </div>
          <span style={{ fontSize: '19px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Event<span style={{ color: '#06b6d4' }}>Forge</span>
          </span>
        </Link>
      </div>

      {/* Right: current role badge only (no switcher, no logout here) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated && user ? (
          <>
            <div style={{
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              padding: '4px 11px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}>
              <Shield style={{ width: '12px', height: '12px' }} />
              {user.role}
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            {location.pathname !== '/login' && (
              <Link
                to="/login"
                style={{
                  color: '#94a3b8',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'color 0.15s'
                }}
              >
                Sign in
              </Link>
            )}
            {location.pathname !== '/register' && (
              <Link
                to="/register"
                style={{
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                }}
              >
                Get started
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
