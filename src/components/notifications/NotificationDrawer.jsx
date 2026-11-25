import React, { useState, useEffect } from 'react';
import { requestDesktopNotificationPermission, sendDesktopNotification } from '../../services/smartNotificationEngine';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onDismiss,
  onSnooze,
  onAction,
  onClearAll,
  onRefresh,
  isChecking = false
}) {
  const [filter, setFilter] = useState('all');
  const [notificationPermission, setNotificationPermission] = useState(() => {
    return (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'denied';
  });

  const handleEnableDesktopNotifications = async () => {
    const res = await requestDesktopNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      sendDesktopNotification('Schola Intelligens Értesítések', {
        body: 'Az asztali böngészős értesítések sikeresen bekapcsolva!'
      });
    }
  };

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'exam') return n.category === 'exam';
    if (filter === 'ai') return n.category === 'ai';
    if (filter === 'wellbeing') return n.category === 'wellbeing' || n.category === 'celebration';
    return true;
  });

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          accent: 'var(--danger, #cc0000)',
          badgeBg: 'rgba(204, 0, 0, 0.08)',
          badgeBorder: 'rgba(204, 0, 0, 0.25)',
          badgeText: 'var(--danger, #cc0000)'
        };
      case 'warning':
        return {
          accent: '#f59e0b',
          badgeBg: 'rgba(245, 158, 11, 0.1)',
          badgeBorder: 'rgba(245, 158, 11, 0.25)',
          badgeText: '#d97706'
        };
      case 'suggestion':
        return {
          accent: '#8b5cf6',
          badgeBg: 'rgba(139, 92, 246, 0.1)',
          badgeBorder: 'rgba(139, 92, 246, 0.25)',
          badgeText: '#7c3aed'
        };
      case 'info':
      default:
        return {
          accent: '#3b82f6',
          badgeBg: 'rgba(59, 130, 246, 0.1)',
          badgeBorder: 'rgba(59, 130, 246, 0.25)',
          badgeText: '#2563eb'
        };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '420px',
          maxWidth: '92vw',
          height: '100%',
          borderRadius: '0',
          borderLeft: '1px solid var(--panel-border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
          background: 'var(--panel-bg)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--hover-bg)',
                border: '1px solid var(--panel-border)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
                Intelligens Értesítések
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Smart Notification Engine (SNE)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isChecking}
                className="btn-icon"
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  border: '1px solid var(--panel-border)',
                  background: 'transparent',
                  color: isChecking ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: isChecking ? 'wait' : 'pointer'
                }}
                title="Teendők újraellenőrzése"
              >
                <svg
                  className={isChecking ? 'spin-animation' : ''}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                padding: '6px',
                borderRadius: '8px',
                border: '1px solid var(--panel-border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="Bezárás"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '12px 16px',
            gap: '8px',
            borderBottom: '1px solid var(--panel-border)',
            background: 'var(--hover-bg)',
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'all', label: `Összes (${notifications.length})` },
            { id: 'exam', label: 'Dolgozatok' },
            { id: 'ai', label: 'Katedra AI' },
            { id: 'wellbeing', label: 'Jóllét & Névnap' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: filter === tab.id ? '600' : '400',
                borderRadius: '6px',
                border: filter === tab.id ? '1px solid var(--text-primary)' : '1px solid var(--panel-border)',
                background: filter === tab.id ? 'var(--text-primary)' : 'var(--panel-bg)',
                color: filter === tab.id ? 'var(--panel-bg)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop Web Notifications Permission Bar */}
        <div style={{
          padding: '10px 16px',
          background: 'var(--hover-bg, rgba(0,0,0,0.02))',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔔</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {notificationPermission === 'granted' ? 'Asztali értesítések aktívak' : 'Asztali értesítések kérése'}
            </span>
          </div>
          {notificationPermission !== 'granted' ? (
            <button
              onClick={handleEnableDesktopNotifications}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--panel-border)',
                background: 'var(--accent-color)',
                color: 'var(--bg-color)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Bekapcsolás
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>✓ Engedélyezve</span>
          )}
        </div>

        {/* Notification List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '240px',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: '24px'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                Minden rendben!
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Jelenleg nincs új intézkedést igénylő intelligens értesítés.
              </div>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isChecking}
                  style={{
                    marginTop: '16px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--panel-border)',
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: isChecking ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg
                    className={isChecking ? 'spin-animation' : ''}
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>{isChecking ? 'Lekérés folyamatban...' : 'Teendők újraellenőrzése'}</span>
                </button>
              )}
            </div>
          ) : (
            filtered.map((item) => {
              const style = getPriorityStyle(item.priority);
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--panel-bg)',
                    border: '1px solid var(--panel-border)',
                    borderLeft: `4px solid ${style.accent}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative'
                  }}
                >
                  {/* Top line badge & close */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700',
                        letterSpacing: '0.4px',
                        backgroundColor: style.badgeBg,
                        border: `1px solid ${style.badgeBorder}`,
                        color: style.badgeText,
                        textTransform: 'uppercase'
                      }}
                    >
                      {item.badge}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => onSnooze(item.id)}
                        title="Elhalasztás 2 órával"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </button>
                      <button
                        onClick={() => onDismiss(item.id)}
                        title="Elrejtés"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '4px'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Title & message */}
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                      {item.message}
                    </div>
                  </div>

                  {/* Action button */}
                  {item.actionLabel && (
                    <button
                      onClick={() => onAction(item)}
                      style={{
                        marginTop: '4px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--panel-border)',
                        background: 'var(--hover-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--panel-border)')}
                    >
                      <span>{item.actionLabel}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--panel-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--hover-bg)'
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {notifications.length} aktív javaslat
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isChecking}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isChecking ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    cursor: isChecking ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <svg
                    className={isChecking ? 'spin-animation' : ''}
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>{isChecking ? 'Lekérés...' : 'Újraellenőrzés'}</span>
                </button>
              )}
              <button
                onClick={onClearAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Összes elrejtése
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
