import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function SmartNotificationWidget({
  notification,
  onAction,
  onDismiss,
  onOpenDrawer,
  onRefresh,
  isChecking = false,
  totalNotificationsCount = 1,
  widgetSettings,
  widgetPositions,
  widgetSizes,
  widgetHeights,
  changeWidgetWidth,
  changeWidgetHeight,
  handleDragStart,
  handleDragOver,
  handleDrop
}) {
  const isEditMode = widgetSettings?.editMode;

  const w = widgetSizes?.smartNotification || 2;
  const h = widgetHeights?.smartNotification || 1;
  const pos = widgetPositions?.smartNotification || { c: 3, r: 1 };

  // -------------------------------------------------------------
  // ESET A: Van aktív értesítés (pl. Sürgős dolgozat javítás)
  // -------------------------------------------------------------
  if (notification || isEditMode) {
    const currentNotif = notification || {
      id: 'sample_alert',
      priority: 'urgent',
      badge: 'SÜRGŐS HATÁRIDŐ',
      title: 'Matematika (Csoport) javítás',
      message: 'A dolgozat javítási határideje lejárt! Kattints a Dolgozat Radar megnyitásához.',
      actionLabel: 'Dolgozat Radar'
    };

    const isUrgent = currentNotif.priority === 'urgent';
    const borderColor = isUrgent ? 'var(--danger, #cc0000)' : '#f59e0b';
    const badgeColor = isUrgent ? 'var(--danger, #cc0000)' : '#d97706';
    const badgeBg = isUrgent ? 'rgba(204, 0, 0, 0.08)' : 'rgba(245, 158, 11, 0.1)';
    const badgeBorder = isUrgent ? 'rgba(204, 0, 0, 0.25)' : 'rgba(245, 158, 11, 0.25)';

    return (
      <section
        className="card glass-panel animate-fade-in"
        style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gridColumn: `${pos.c || 3} / span ${w}`,
          gridRow: `${pos.r || 1} / span ${h}`,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 2,
          border: `1.5px solid ${borderColor}`,
          boxShadow: isUrgent ? '0 2px 10px rgba(204, 0, 0, 0.12)' : '0 2px 10px rgba(245, 158, 11, 0.1)',
          background: 'var(--panel-bg)'
        }}
        draggable={isEditMode}
        onDragStart={(e) => handleDragStart && handleDragStart(e, 'smartNotification')}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop && handleDrop(e, 'smartNotification')}
      >
        <WidgetResizer
          widgetKey="smartNotification"
          w={w}
          h={h}
          editMode={isEditMode}
          changeWidgetWidth={changeWidgetWidth}
          changeWidgetHeight={changeWidgetHeight}
        />

        <div
          className="widget-content-wrapper"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            justifyContent: h === 1 ? 'center' : 'space-between'
          }}
        >
          {/* Header sor */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: h === 1 ? '4px' : '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
              {/* Piros pulzáló csengő ikon */}
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  backgroundColor: badgeBg,
                  color: borderColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </div>

              {/* Sürgősségi badge */}
              {currentNotif.badge && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentNotif.badge}
                </span>
              )}

              {totalNotificationsCount > 1 && onOpenDrawer && (
                <button
                  onClick={onOpenDrawer}
                  title="További értesítések megtekintése"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0 4px',
                    textDecoration: 'underline'
                  }}
                >
                  +{totalNotificationsCount - 1} több
                </button>
              )}
            </div>

            {/* Jobb oldali gombok: Újraellenőrzés, Fiók, Bezárás */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isChecking}
                  title="Teendők újraellenőrzése / lekérése"
                  className="btn-icon"
                  style={{
                    padding: '3px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: isChecking ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: isChecking ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <svg
                    className={isChecking ? 'spin-animation' : ''}
                    width="12"
                    height="12"
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

              {onOpenDrawer && (
                <button
                  onClick={onOpenDrawer}
                  title="Értesítési fiók megnyitása"
                  className="btn-icon"
                  style={{
                    padding: '3px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </button>
              )}

              {onDismiss && (
                <button
                  onClick={() => onDismiss(currentNotif.id)}
                  title="Csempe elrejtése"
                  className="btn-icon"
                  style={{
                    padding: '3px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Középső szöveges tartalom */}
          <div style={{ minWidth: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                fontWeight: '700',
                fontSize: h === 1 && w === 1 ? '11px' : '13px',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentNotif.title}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: h === 1 ? 1 : 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.3
              }}
            >
              {currentNotif.message}
            </div>
          </div>

          {/* Akció gomb (Dolgozat Radar ->) */}
          {currentNotif.actionLabel && (
            <div style={{ marginTop: h === 1 ? '4px' : '8px', display: 'flex', justifyContent: 'flex-start' }}>
              <button
                onClick={() => onAction && onAction(currentNotif)}
                style={{
                  width: h >= 2 ? '100%' : 'auto',
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--panel-bg)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'opacity 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <span>{currentNotif.actionLabel}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // ESET B: Nincs aktív teendő -> Nyugodt állapot gombbal az újraellenőrzésre
  // -------------------------------------------------------------
  return (
    <section
      className="card glass-panel animate-fade-in"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${pos.c || 3} / span ${w}`,
        gridRow: `${pos.r || 1} / span ${h}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
        border: '1px solid var(--panel-border)',
        background: 'var(--panel-bg)'
      }}
      draggable={isEditMode}
      onDragStart={(e) => handleDragStart && handleDragStart(e, 'smartNotification')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop && handleDrop(e, 'smartNotification')}
    >
      <WidgetResizer
        widgetKey="smartNotification"
        w={w}
        h={h}
        editMode={isEditMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />

      <div
        className="widget-content-wrapper"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          justifyContent: 'space-between'
        }}
      >
        {/* Fejléc */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: h === 1 ? '4px' : '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Teendők & Határidők
            </span>
          </div>

          {/* Újraellenőrzés gomb ikon */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isChecking}
              title="Teendők újraellenőrzése / lekérése"
              className="btn-icon"
              style={{
                padding: '3px',
                width: '22px',
                height: '22px',
                borderRadius: '4px',
                background: 'transparent',
                border: 'none',
                color: isChecking ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: isChecking ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg
                className={isChecking ? 'spin-animation' : ''}
                width="12"
                height="12"
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
        </div>

        {/* Törzs */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>
            Minden naprakész!
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Nincs elmaradt dolgozatjavítás vagy határidő.
          </div>
        </div>

        {/* Újra lekérés gomb */}
        <div style={{ marginTop: h === 1 ? '4px' : '6px', display: 'flex' }}>
          <button
            onClick={onRefresh}
            disabled={isChecking}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: '1px solid var(--panel-border)',
              backgroundColor: 'var(--hover-bg)',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: '500',
              cursor: isChecking ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              width: h >= 2 ? '100%' : 'auto',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => !isChecking && (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
            onMouseLeave={(e) => !isChecking && (e.currentTarget.style.borderColor = 'var(--panel-border)')}
          >
            <svg
              className={isChecking ? 'spin-animation' : ''}
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{isChecking ? 'Lekérés folyamatban...' : 'Teendők lekérése'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
