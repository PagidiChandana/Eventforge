import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ForgeBot from '../components/ForgeBot';

// Pages where the sidebar should NOT appear
const AUTH_ROUTES = ['/login', '/register', '/unauthorized'];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const [notice, setNotice] = useState(null);

  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  // Cross-page unauthorized notice (set by ProtectedRoute redirects)
  useEffect(() => {
    if (location.state?.notice) {
      setNotice(location.state.notice);
      window.history.replaceState({}, document.title);
      const t = setTimeout(() => setNotice(null), 6000);
      return () => clearTimeout(t);
    }
  }, [location]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#090d16' }}>
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} hideNav={isAuthPage} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Hide sidebar on auth pages */}
        {!isAuthPage && <Sidebar isOpen={sidebarOpen} />}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isAuthPage ? '48px 24px' : '32px',
            minWidth: 0
          }}
        >
          <div style={{ maxWidth: isAuthPage ? '100%' : '1400px', margin: '0 auto', width: '100%' }}>
            {notice && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <span>⛔ {notice}</span>
                <button
                  onClick={() => setNotice(null)}
                  style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
                >
                  ×
                </button>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
      {!isAuthPage && <ForgeBot />}
    </div>
  );
};

export default AppLayout;
