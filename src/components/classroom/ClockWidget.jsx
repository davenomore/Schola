import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';

export default function ClockWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 120, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 340, height: 260 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 120, y: widget.y || 80 }, size: { width: 340, height: 260 } });

  const [time, setTime] = useState(new Date());
  const [showSeconds, setShowSeconds] = useState(true);
  const [is24Hour, setIs24Hour] = useState(true);
  const [viewMode, setViewMode] = useState('analog'); // 'digital' | 'analog'

  const contentRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 200 });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Responsive container observer
  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

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

  // Formatted strings
  const hoursRaw = time.getHours();
  const hours = is24Hour ? hoursRaw : (hoursRaw % 12 || 12);
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const ampm = !is24Hour ? (hoursRaw >= 12 ? 'DU' : 'DE') : '';

  const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
  const monthNames = [
    'január', 'február', 'március', 'április', 'május', 'június',
    'július', 'augusztus', 'szeptember', 'október', 'november', 'december'
  ];

  const dateString = `${time.getFullYear()}. ${monthNames[time.getMonth()]} ${time.getDate()}., ${dayNames[time.getDay()]}`;

  // Analog angles
  const secAngle = time.getSeconds() * 6;
  const minAngle = time.getMinutes() * 6 + time.getSeconds() * 0.1;
  const hourAngle = (time.getHours() % 12) * 30 + time.getMinutes() * 0.5;

  // Responsive calculations based on content area
  const contentWidth = dimensions.width || 300;
  const contentHeight = dimensions.height || 200;

  // Analog clock sizing: fills available space gracefully
  const clockDiameter = Math.max(120, Math.min(contentWidth - 32, contentHeight - 48));
  const analogDateFontSize = Math.max(11, Math.min(22, Math.round(clockDiameter * 0.052)));

  // Digital clock sizing: calculates max fit without wrapping
  const targetDigitalFontSize = Math.min(
    (contentWidth - 24) / (showSeconds ? 5.2 : 3.4),
    (contentHeight - 48) / 1.35
  );
  const digitalFontSize = Math.max(26, Math.min(180, Math.round(targetDigitalFontSize)));
  const digitalDateFontSize = Math.max(11, Math.min(24, Math.round(digitalFontSize * 0.24)));

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
      minWidth={220}
      minHeight={180}
      bounds="parent"
      dragHandleClassName="clock-drag-handle"
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
          className="clock-drag-handle"
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
              <span>PONTOS IDŐ</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* View Mode Toggle */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => setViewMode(viewMode === 'digital' ? 'analog' : 'digital')}
              title={viewMode === 'digital' ? 'Analóg óra nézet' : 'Digitális óra nézet'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {viewMode === 'digital' ? (
                  <circle cx="12" cy="12" r="9" />
                ) : (
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                )}
              </svg>
            </button>

            {/* Seconds toggle */}
            {viewMode === 'digital' && (
              <button
                type="button"
                className="rich-text-toolbar-btn"
                onClick={() => setShowSeconds(!showSeconds)}
                title={showSeconds ? 'Másodperc elrejtése' : 'Másodperc mutatása'}
                style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px' }}
              >
                :SS
              </button>
            )}

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

        {/* Content Area - Responsive Container */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {viewMode === 'digital' ? (
            /* Fully Responsive Digital View */
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  fontSize: `${digitalFontSize}px`,
                  fontWeight: 800,
                  letterSpacing: '-1.5px',
                  lineHeight: 1,
                  fontFamily: "'Inter', sans-serif",
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: `${Math.max(2, Math.round(digitalFontSize * 0.05))}px`
                }}
              >
                <span>{String(hours).padStart(2, '0')}:{minutes}</span>
                {showSeconds && (
                  <span style={{ fontSize: '0.45em', opacity: 0.5, fontWeight: 600, letterSpacing: '0px' }}>
                    :{seconds}
                  </span>
                )}
                {ampm && (
                  <span style={{ fontSize: '0.28em', fontWeight: 700, marginLeft: '6px', color: 'var(--text-secondary)' }}>
                    {ampm}
                  </span>
                )}
              </div>

              <div
                style={{
                  marginTop: `${Math.max(6, Math.round(digitalFontSize * 0.16))}px`,
                  fontSize: `${digitalDateFontSize}px`,
                  fontWeight: 600,
                  color: 'var(--text-secondary, #71717a)',
                  letterSpacing: '0.5px'
                }}
              >
                {dateString}
              </div>
            </div>
          ) : (
            /* Fully Responsive Analog View */
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: `${Math.max(6, Math.round(clockDiameter * 0.03))}px`
              }}
            >
              <div
                style={{
                  width: `${clockDiameter}px`,
                  height: `${clockDiameter}px`,
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'width 0.1s ease-out, height 0.1s ease-out'
                }}
              >
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Clock background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="47"
                    fill="var(--hover-bg, rgba(0,0,0,0.02))"
                    stroke="var(--panel-border, #e4e4e7)"
                    strokeWidth="2.5"
                  />

                  {/* 60 minute ticks */}
                  {Array.from({ length: 60 }).map((_, idx) => {
                    const deg = idx * 6;
                    const isHour = idx % 5 === 0;
                    const isQuarter = idx % 15 === 0;
                    return (
                      <line
                        key={idx}
                        x1="50"
                        y1="5"
                        x2="50"
                        y2={isQuarter ? "12" : isHour ? "10" : "7.5"}
                        stroke="var(--text-primary, #18181b)"
                        strokeWidth={isQuarter ? "2.2" : isHour ? "1.6" : "0.8"}
                        opacity={isQuarter ? "0.9" : isHour ? "0.6" : "0.22"}
                        transform={`rotate(${deg} 50 50)`}
                      />
                    );
                  })}

                  {/* Cardinal numbers (12, 3, 6, 9) */}
                  <text x="50" y="20" fontSize="7" fontWeight="800" fill="var(--text-primary)" textAnchor="middle">12</text>
                  <text x="82" y="52.5" fontSize="7" fontWeight="800" fill="var(--text-primary)" textAnchor="middle">3</text>
                  <text x="50" y="85" fontSize="7" fontWeight="800" fill="var(--text-primary)" textAnchor="middle">6</text>
                  <text x="18" y="52.5" fontSize="7" fontWeight="800" fill="var(--text-primary)" textAnchor="middle">9</text>

                  {/* Hour hand */}
                  <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="25"
                    stroke="var(--text-primary, #18181b)"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                    transform={`rotate(${hourAngle} 50 50)`}
                  />

                  {/* Minute hand */}
                  <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="14"
                    stroke="var(--text-primary, #18181b)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    transform={`rotate(${minAngle} 50 50)`}
                  />

                  {/* Second hand */}
                  <line
                    x1="50"
                    y1="55"
                    x2="50"
                    y2="11"
                    stroke="var(--theme-red, #cc0000)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    transform={`rotate(${secAngle} 50 50)`}
                  />

                  {/* Center pin hub */}
                  <circle cx="50" cy="50" r="3.5" fill="var(--theme-red, #cc0000)" />
                  <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
                </svg>
              </div>

              {/* Date string */}
              <div
                style={{
                  fontSize: `${analogDateFontSize}px`,
                  fontWeight: 600,
                  color: 'var(--text-secondary, #71717a)',
                  textAlign: 'center',
                  letterSpacing: '0.4px',
                  lineHeight: 1.2
                }}
              >
                {dateString}
              </div>
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
