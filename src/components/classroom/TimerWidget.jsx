import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';

export default function TimerWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 160, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 350, height: 380 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 160, y: widget.y || 80 }, size: { width: 350, height: 380 } });

  // Mode: 'timer' (countdown) | 'stopwatch' (countup)
  const [mode, setMode] = useState('timer');
  const [totalSeconds, setTotalSeconds] = useState(300); // Default 5 mins
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Stopwatch state
  const [stopwatchMs, setStopwatchMs] = useState(0);

  const intervalRef = useRef(null);

  // Sound gong
  const playGong = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.8);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.8);
      });
    } catch {}
  };

  // Timer loop
  useEffect(() => {
    if (isRunning) {
      if (mode === 'timer') {
        intervalRef.current = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(intervalRef.current);
              setIsRunning(false);
              playGong();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Stopwatch: 100ms ticks
        const start = Date.now() - stopwatchMs;
        intervalRef.current = setInterval(() => {
          setStopwatchMs(Date.now() - start);
        }, 100);
      }
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

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

  const handleSetPreset = (mins) => {
    setIsRunning(false);
    setTotalSeconds(mins * 60);
    setRemainingSeconds(mins * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'timer') {
      setRemainingSeconds(totalSeconds);
    } else {
      setStopwatchMs(0);
    }
  };

  // Format timer
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Format stopwatch
  const formatStopwatch = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths}`;
  };

  // Ring progress
  const progress = mode === 'timer' && totalSeconds > 0
    ? remainingSeconds / totalSeconds
    : 1;
  const strokeDashoffset = 283 * (1 - progress);

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
      minWidth={300}
      minHeight={340}
      bounds="parent"
      dragHandleClassName="timer-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 85 : 25 }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--panel-bg, #ffffff)',
          color: 'var(--text-primary, #18181b)',
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          border: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          className="timer-drag-handle"
          style={{
            padding: '8px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            cursor: 'grab'
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{mode === 'timer' ? 'IDŐZÍTŐ' : 'STOPPER'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Mode switch */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => {
                setIsRunning(false);
                setMode(mode === 'timer' ? 'stopwatch' : 'timer');
              }}
              title={mode === 'timer' ? 'Váltás stopperre' : 'Váltás visszaszámlálóra'}
              style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px' }}
            >
              {mode === 'timer' ? '⏱ STOPPER' : '⏳ IDŐZÍTŐ'}
            </button>

            {/* Sound toggle */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Hangjelzés bekapcsolva' : 'Hangjelzés némítva'}
              style={{ opacity: soundEnabled ? 0.9 : 0.4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {soundEnabled ? (
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                ) : (
                  <>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>
            </button>

            {/* Maximize */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={toggleMaximize}
              title={isMaximized ? 'Visszaállítás' : 'Teljes méret'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
              style={{ color: 'var(--theme-red, #cc0000)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Circular Display */}
          <div style={{ position: 'relative', width: '170px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--panel-border, #e4e4e7)"
                strokeWidth="5"
              />
              {/* Active Ring */}
              {mode === 'timer' && (
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={remainingSeconds <= 10 && remainingSeconds > 0 ? 'var(--theme-red, #cc0000)' : 'var(--accent-color, #18181b)'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                />
              )}
            </svg>

            {/* Big Digits */}
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div
                style={{
                  fontSize: mode === 'timer' ? '38px' : '32px',
                  fontWeight: 800,
                  letterSpacing: '-1px',
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1,
                  color: mode === 'timer' && remainingSeconds <= 10 && remainingSeconds > 0 ? 'var(--theme-red, #cc0000)' : 'inherit'
                }}
              >
                {mode === 'timer' ? formatTimer(remainingSeconds) : formatStopwatch(stopwatchMs)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                {mode === 'timer' ? (isRunning ? 'Folyamatban' : remainingSeconds === 0 ? 'LEJÁRT!' : 'Megállítva') : 'Stopperóra'}
              </div>
            </div>
          </div>

          {/* Quick presets for timer */}
          {mode === 'timer' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[1, 3, 5, 10, 15, 20].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSetPreset(m)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border, #e4e4e7)',
                    background: totalSeconds === m * 60 ? 'var(--hover-bg, rgba(0,0,0,0.06))' : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {m}p
                </button>
              ))}
            </div>
          )}

          {/* Main Controls: Start / Pause / Reset */}
          <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '4px',
                background: isRunning ? 'var(--hover-bg, rgba(0,0,0,0.06))' : 'var(--accent-color, #18181b)',
                color: isRunning ? 'var(--text-primary)' : 'var(--badge-color, #ffffff)',
                border: isRunning ? '1px solid var(--panel-border)' : 'none',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isRunning ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {isRunning ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <span>Szünet</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Indítás</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-outline"
              onClick={handleReset}
              title="Visszaállítás"
              style={{
                padding: '10px 14px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Újra
            </button>
          </div>
        </div>
      </div>
    </Rnd>
  );
}
