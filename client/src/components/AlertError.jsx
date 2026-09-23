import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const AlertError = ({ type = 'error', message, details = [], onClose }) => {
  if (!message) return null;

  const typeStyles = {
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#fca5a5', icon: <AlertTriangle style={{ color: '#ef4444', width: '20px', height: '20px', flexShrink: 0 }} /> },
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7', icon: <CheckCircle style={{ color: '#10b981', width: '20px', height: '20px', flexShrink: 0 }} /> },
    info: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', text: '#67e8f9', icon: <Info style={{ color: '#06b6d4', width: '20px', height: '20px', flexShrink: 0 }} /> }
  };

  const current = typeStyles[type] || typeStyles.error;

  return (
    <div style={{
      backgroundColor: current.bg,
      border: `1px solid ${current.border}`,
      color: current.text,
      padding: '14px 18px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      margin: '12px 0',
      position: 'relative'
    }}>
      {current.icon}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>{message}</div>
        {details && details.length > 0 && (
          <ul style={{ marginTop: '6px', paddingLeft: '20px', fontSize: '13px', opacity: 0.9 }}>
            {details.map((err, idx) => (
              <li key={idx}>{err.message || err}</li>
            ))}
          </ul>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', opacity: 0.7 }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>
      )}
    </div>
  );
};

export default AlertError;
