import React from 'react';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({ title = 'No items found', message = 'There are no records available to display.', icon: Icon = FolderOpen, action }) => {
  return (
    <div className="glass-card animate-fade-in" style={{
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '20px 0'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        color: '#818cf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <Icon style={{ width: '28px', height: '28px' }} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{title}</h3>
      <p style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '380px', marginBottom: action ? '20px' : '0' }}>
        {message}
      </p>
      {action}
    </div>
  );
};

export default EmptyState;
