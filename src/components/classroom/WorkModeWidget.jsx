import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';

const THEMES = [
  { label: 'Schola Katedra (Alapértelmezett)', isDefault: true, bg: 'var(--panel-bg, #ffffff)', circleBg: 'var(--panel-bg, #ffffff)', textColor: 'var(--text-primary, #18181b)' },
  { label: 'Ibolya / Lila', isDefault: false, bg: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #6b21a8 100%)', circleBg: '#fdfbf9', textColor: '#ffffff' },
  { label: 'Királykék', isDefault: false, bg: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1e40af 100%)', circleBg: '#f8fafc', textColor: '#ffffff' },
  { label: 'Smaragdzöld', isDefault: false, bg: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #047857 100%)', circleBg: '#f0fdf4', textColor: '#ffffff' },
  { label: 'Naplemente Borostyán', isDefault: false, bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)', circleBg: '#fffbeb', textColor: '#ffffff' },
  { label: 'Sötét Tábla', isDefault: false, bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #020617 100%)', circleBg: '#1e293b', textColor: '#ffffff' }
];

const WORK_MODES = [
  {
    id: 'silence',
    title: 'CSEND',
    english: 'SILENCE',
    subtitle: 'Néma, önálló koncentráció',
    icon: (size = 46, strokeWidth = 2.2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    )
  },
  {
    id: 'whisper',
    title: 'SUTTOGÁS',
    english: 'WHISPER',
    subtitle: 'Halk, csendes megbeszélés',
    icon: (size = 46, strokeWidth = 2.2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="13" y2="13" />
      </svg>
    )
  },
  {
    id: 'ask_neighbor',
    title: 'KÉRDEZD A TÁRSAD',
    english: 'ASK NEIGHBOR',
    subtitle: 'Páros munka és segítségnyújtás',
    icon: (size = 46, strokeWidth = 2.2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  },
  {
    id: 'group_work',
    title: 'CSOPORTMUNKA',
    english: 'GROUP WORK',
    subtitle: 'Közös feladatmegoldás és vita',
    icon: (size = 46, strokeWidth = 2.2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    id: 'independent',
    title: 'ÖNÁLLÓ MUNKA',
    english: 'INDEPENDENT',
    subtitle: 'Egyéni írásbeli feladat',
    icon: (size = 46, strokeWidth = 2.2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    )
  }
];

export default function WorkModeWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 160, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 330, height: 460 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 160, y: widget.y || 80 }, size: { width: 330, height: 460 } });

  const [activeModeIndex, setActiveModeIndex] = useState(0);
  const [theme, setTheme] = useState(THEMES[0]);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState('hu'); // 'hu' | 'en'

  // Gentle classroom chime sound when switching modes
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.12); // G5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {
      // AudioContext unavailable
    }
  };

  const changeMode = (index) => {
    const validIdx = (index + WORK_MODES.length) % WORK_MODES.length;
    setActiveModeIndex(validIdx);
    playChime();
  };

  const currentMode = WORK_MODES[activeModeIndex];

  // Toggle maximize
  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDims.current = { position, size };
      setPosition({ x: 30, y: 30 });
      setSize({ width: 'calc(100% - 60px)', height: 'calc(100% - 90px)' });
      setIsMaximized(true);
    } else {
      setPosition(prevDims.current.position);
      setSize(prevDims.current.size);
      setIsMaximized(false);
    }
  };

  const isScholaTheme = theme.isDefault;

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
        updateWidgetBounds?.(widget.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, pos) => {
        const newW = ref.offsetWidth;
        const newH = ref.offsetHeight;
        setSize({ width: newW, height: newH });
        setPosition(pos);
        updateWidgetBounds?.(widget.id, { ...pos, width: newW, height: newH });
      }}
      minWidth={280}
      minHeight={380}
      bounds="parent"
      dragHandleClassName="work-mode-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 85 : 25 }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          background: theme.bg,
          color: isScholaTheme ? 'var(--text-primary, #18181b)' : theme.textColor,
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          border: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          transition: 'background 0.25s ease'
        }}
      >
        {/* Top Header */}
        <div
          className="work-mode-drag-handle"
          style={{
            padding: '8px 12px',
            background: isScholaTheme ? 'var(--hover-bg, rgba(0,0,0,0.02))' : 'rgba(0,0,0,0.1)',
            borderBottom: isScholaTheme ? '1px solid var(--panel-border, #e4e4e7)' : '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            cursor: 'grab',
            zIndex: 10
          }}
        >
          {/* 6 dots grip handle */}
          <div
            title="Mozgatás"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              opacity: 0.6,
              cursor: 'grab'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </div>

          {/* Center Navigation Arrows: < > */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => changeMode(activeModeIndex - 1)}
              title="Előző munkamód"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.75
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.75 }}>
              Munkamód
            </span>
            <button
              type="button"
              onClick={() => changeMode(activeModeIndex + 1)}
              title="Következő munkamód"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.75
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Right Action Icons: Sound, Language, Palette, Maximize, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Chime sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Hangjelzés bekapcsolva' : 'Hangjelzés némítva'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '4px',
                opacity: soundEnabled ? 0.85 : 0.35,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {soundEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>

            {/* Language toggle: HU / EN */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'hu' ? 'en' : 'hu')}
              title="Nyelv váltása (Magyar / Angol)"
              style={{
                background: isScholaTheme ? 'var(--hover-bg, rgba(0,0,0,0.06))' : 'rgba(255,255,255,0.2)',
                border: '1px solid var(--panel-border, rgba(0,0,0,0.1))',
                color: 'inherit',
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700
              }}
            >
              {language.toUpperCase()}
            </button>

            {/* Palette */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title="Színtéma választása"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '4px',
                  opacity: 0.75,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              </button>

              {showThemeMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '6px',
                    background: 'var(--panel-bg, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    borderRadius: '6px',
                    border: '1px solid var(--panel-border, #e4e4e7)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    padding: '6px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    minWidth: '170px'
                  }}
                >
                  {THEMES.map((t) => (
                    <div
                      key={t.label}
                      onClick={() => {
                        setTheme(t);
                        setShowThemeMenu(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        background: theme.label === t.label ? 'var(--hover-bg, #f1f5f9)' : 'transparent'
                      }}
                    >
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: t.bg, border: '1px solid var(--panel-border)' }} />
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maximize / Restore */}
            <button
              type="button"
              onClick={toggleMaximize}
              title={isMaximized ? 'Visszaállítás' : 'Teljes méret'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '4px',
                opacity: 0.75,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {isMaximized ? (
                  <>
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                ) : (
                  <>
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                )}
              </svg>
            </button>

            {/* Close */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => removeWidget(widget.id)}
              title="Bezárás"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--theme-red, #cc0000)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Center: Large Work Mode Badge Circle */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            position: 'relative'
          }}
        >
          {/* Main Circle Badge */}
          <div
            style={{
              width: 'min(230px, 66vw, 44vh)',
              height: 'min(230px, 66vw, 44vh)',
              borderRadius: '50%',
              background: isScholaTheme ? 'var(--hover-bg, rgba(0,0,0,0.02))' : theme.circleBg,
              color: isScholaTheme ? 'var(--text-primary, #18181b)' : (theme.circleBg === '#1e293b' ? '#f8fafc' : '#0f172a'),
              border: isScholaTheme ? '2px solid var(--panel-border, #e4e4e7)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.25s ease'
            }}
          >
            {/* Faint watermark outline icon in background */}
            <div
              style={{
                position: 'absolute',
                opacity: 0.05,
                transform: 'scale(3.2) rotate(-6deg)',
                pointerEvents: 'none'
              }}
            >
              {currentMode.icon(64, 1.5)}
            </div>

            {/* Foreground Icon */}
            <div
              key={currentMode.id}
              style={{
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
                transform: 'scale(1.15)',
                animation: 'scaleIn 0.2s ease'
              }}
            >
              {currentMode.icon(54, 2.2)}
            </div>

            {/* Title Label */}
            <div
              style={{
                zIndex: 2,
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '2.5px',
                textAlign: 'center',
                textTransform: 'uppercase',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {language === 'hu' ? currentMode.title : currentMode.english}
            </div>

            {/* Subtitle / Explanation */}
            <div
              style={{
                zIndex: 2,
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-secondary, #71717a)',
                marginTop: '4px',
                textAlign: 'center',
                padding: '0 16px'
              }}
            >
              {currentMode.subtitle}
            </div>
          </div>
        </div>

        {/* Bottom Selector Dock / Pill Bar */}
        <div
          style={{
            padding: '14px 18px 20px 18px',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              background: isScholaTheme ? 'var(--hover-bg, rgba(0,0,0,0.03))' : 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '8px',
              padding: '5px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--panel-border, #e4e4e7)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}
          >
            {WORK_MODES.map((mode, index) => {
              const isActive = index === activeModeIndex;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => changeMode(index)}
                  title={`${mode.title} (${mode.subtitle})`}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '6px',
                    border: isActive ? '1px solid var(--panel-border, #e4e4e7)' : '1px solid transparent',
                    background: isActive ? 'var(--panel-bg, #ffffff)' : 'transparent',
                    color: isActive ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ transform: isActive ? 'scale(1.05)' : 'scale(0.95)' }}>
                    {mode.icon(20, 2)}
                  </div>

                  {/* Active Indicator Dot under the button */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '3px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'var(--theme-red, #cc0000)'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Rnd>
  );
}
