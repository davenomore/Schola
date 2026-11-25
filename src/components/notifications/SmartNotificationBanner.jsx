import React from 'react';

export default function SmartNotificationBanner({
  notification,
  onAction,
  onDismiss,
  onOpenDrawer
}) {
  if (!notification) return null;

  const priorityConfigs = {
    urgent: {
      accent: 'var(--danger, #cc0000)',
      badgeBg: 'rgba(204, 0, 0, 0.08)',
      badgeBorder: 'rgba(204, 0, 0, 0.25)',
      badgeText: 'var(--danger, #cc0000)',
      iconBg: 'rgba(204, 0, 0, 0.08)',
      iconColor: 'var(--danger, #cc0000)'
    },
    warning: {
      accent: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      badgeBorder: 'rgba(245, 158, 11, 0.25)',
      badgeText: '#d97706',
      iconBg: 'rgba(245, 158, 11, 0.1)',
      iconColor: '#d97706'
    },
    suggestion: {
      accent: '#8b5cf6',
      badgeBg: 'rgba(139, 92, 246, 0.1)',
      badgeBorder: 'rgba(139, 92, 246, 0.25)',
      badgeText: '#7c3aed',
      iconBg: 'rgba(139, 92, 246, 0.1)',
      iconColor: '#7c3aed'
    },
    info: {
      accent: '#3b82f6',
      badgeBg: 'rgba(59, 130, 246, 0.1)',
      badgeBorder: 'rgba(59, 130, 246, 0.25)',
      badgeText: '#2563eb',
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6'
    }
  };

  const theme = priorityConfigs[notification.priority] || priorityConfigs.info;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        marginBottom: '12px',
        padding: '10px 16px',
        borderRadius: '6px',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        borderLeft: `4px solid ${theme.accent}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {/* Indicator icon */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: theme.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.iconColor,
            flexShrink: 0
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.badge && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: theme.badgeBg,
                  color: theme.badgeText,
                  border: `1px solid ${theme.badgeBorder}`,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase'
                }}
              >
                {notification.badge}
              </span>
            )}
            <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
              {notification.title}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {notification.message}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {notification.actionLabel && (
          <button
            onClick={() => onAction(notification)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--panel-bg)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'opacity 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <span>{notification.actionLabel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        )}

        {onOpenDrawer && (
          <button
            onClick={onOpenDrawer}
            title="Összes értesítés megnyitása"
            className="sidebar-toggle"
            style={{
              width: '30px',
              height: '30px',
              padding: 0,
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid var(--panel-border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
        )}

        <button
          onClick={() => onDismiss(notification.id)}
          title="Elrejtés"
          className="sidebar-toggle"
          style={{
            width: '30px',
            height: '30px',
            padding: 0,
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
