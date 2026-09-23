import React from 'react';

const LoadingSpinner = ({ label, message, fullScreen = false }) => {
  const text = label || message || 'Loading...';

  const spinnerContent = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '32px'
    }}>
      {/* Animated logo ring */}
      <div style={{ position: 'relative', width: '52px', height: '52px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.15)'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#6366f1',
          borderRightColor: '#06b6d4',
          animation: 'ef-spin 0.9s linear infinite'
        }} />
        <div style={{
          position: 'absolute',
          inset: '10px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))'
        }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600, marginBottom: '4px' }}>
          EventForge
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>{text}</div>
      </div>
      <style>{`
        @keyframes ef-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ef-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        flexDirection: 'column',
        gap: '0'
      }}>
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
