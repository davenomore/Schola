import React from 'react';

export default function ToastContainer({ notifications }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 9999 }}>
      {notifications.map(notif => {
        let icon = (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
        let color = '#3b82f6';

        if (notif.type === 'error') {
          icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          );
          color = '#ef4444';
        } else if (notif.type === 'warning') {
          icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          );
          color = '#f59e0b';
        } else if (notif.type === 'success') {
          icon = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          );
          color = '#10b981';
        }

        return (
          <div
            key={notif.id}
            className="glass-panel"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              borderLeft: `4px solid ${color}`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              minWidth: '280px',
              maxWidth: '350px',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <div style={{ marginTop: '2px' }}>{icon}</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                {notif.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {notif.message}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
