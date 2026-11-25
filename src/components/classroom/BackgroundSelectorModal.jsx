import React, { useState, useEffect, useRef } from 'react';
import { SOLID_BGS, GRADIENT_BGS, AMBIENT_PATTERNS } from '../../constants/dashboardConstants';

export default function BackgroundSelectorModal({
  isOpen,
  onClose,
  classroomBg,
  onSelectBg,
  isToolbarCollapsed
}) {
  const [activeTab, setActiveTab] = useState('ambient'); // 'ambient' | 'gradient' | 'solid'
  const modalRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        // Check if the click was on the toggle button
        const isToggleBtn = e.target.closest('[data-bg-toggle="true"]');
        if (!isToggleBtn) {
          onClose();
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allBgs = [...AMBIENT_PATTERNS, ...GRADIENT_BGS, ...SOLID_BGS];
  const currentObj = allBgs.find((b) => b.value === classroomBg);

  return (
    <div
      ref={modalRef}
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: isToolbarCollapsed ? '24px' : '96px',
        right: '24px',
        width: '460px',
        maxWidth: 'calc(100vw - 48px)',
        maxHeight: '530px',
        background: 'var(--panel-bg, #ffffff)',
        color: 'var(--text-primary, #18181b)',
        borderRadius: '8px',
        boxShadow: '0 20px 48px -8px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)',
        border: '1px solid var(--panel-border, #e4e4e7)',
        zIndex: 160,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--hover-bg, rgba(0,0,0,0.02))',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ opacity: 0.5, display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>TANTEREM HÁTTEREK</span>
          </div>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="rich-text-toolbar-btn"
          title="Bezárás"
          style={{ color: 'var(--theme-red, #cc0000)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Current Active Indicator Pill */}
      {currentObj && (
        <div
          style={{
            padding: '7px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.015))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary, #71717a)' }}>Aktuális háttér:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{currentObj.label}</strong>
          </div>
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              background: currentObj.value,
              border: '1px solid rgba(128,128,128,0.4)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          />
        </div>
      )}

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '8px 12px 6px 12px',
          gap: '6px',
          background: 'var(--hover-bg, rgba(0,0,0,0.01))'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('ambient')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '4px',
            border: activeTab === 'ambient' ? '1px solid var(--panel-border)' : '1px solid transparent',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            background: activeTab === 'ambient' ? 'var(--panel-bg, #ffffff)' : 'transparent',
            color: activeTab === 'ambient' ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)',
            boxShadow: activeTab === 'ambient' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          🌌 Ambient ({AMBIENT_PATTERNS.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gradient')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '4px',
            border: activeTab === 'gradient' ? '1px solid var(--panel-border)' : '1px solid transparent',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            background: activeTab === 'gradient' ? 'var(--panel-bg, #ffffff)' : 'transparent',
            color: activeTab === 'gradient' ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)',
            boxShadow: activeTab === 'gradient' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          🌈 Színátmenet ({GRADIENT_BGS.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('solid')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: '4px',
            border: activeTab === 'solid' ? '1px solid var(--panel-border)' : '1px solid transparent',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
            background: activeTab === 'solid' ? 'var(--panel-bg, #ffffff)' : 'transparent',
            color: activeTab === 'solid' ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)',
            boxShadow: activeTab === 'solid' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          🎨 Egyszínű ({SOLID_BGS.length})
        </button>
      </div>

      {/* Grid of Background Choices */}
      <div
        style={{
          flex: 1,
          padding: '12px 14px 16px 14px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: activeTab === 'ambient' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '8px'
        }}
      >
        {(activeTab === 'ambient'
          ? AMBIENT_PATTERNS
          : activeTab === 'gradient'
          ? GRADIENT_BGS
          : SOLID_BGS
        ).map((bg) => {
          const isSelected = classroomBg === bg.value;
          return (
            <div
              key={bg.label}
              onClick={() => {
                onSelectBg(bg.value);
              }}
              style={{
                borderRadius: '6px',
                border: isSelected
                  ? '2px solid var(--theme-red, #cc0000)'
                  : '1px solid var(--panel-border, #e4e4e7)',
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(204,0,0,0.2), 0 4px 12px rgba(0,0,0,0.12)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.15s ease',
                transform: isSelected ? 'scale(1.02)' : 'none'
              }}
            >
              {/* Visual Preview Box */}
              <div
                style={{
                  height: activeTab === 'ambient' ? '68px' : '48px',
                  width: '100%',
                  background: bg.value,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)'
                }}
              >
                {bg.icon && (
                  <span
                    style={{
                      fontSize: '18px',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
                    }}
                  >
                    {bg.icon}
                  </span>
                )}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'var(--theme-red, #cc0000)',
                      color: '#ffffff',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>

              {/* Label */}
              <div
                style={{
                  padding: '6px 8px',
                  background: 'var(--panel-bg, #ffffff)',
                  fontSize: '10px',
                  fontWeight: isSelected ? 700 : 500,
                  letterSpacing: '0.4px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'var(--text-primary, #18181b)'
                }}
              >
                {bg.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
