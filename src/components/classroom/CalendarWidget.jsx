import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';

export default function CalendarWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 160, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 340, height: 380 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 160, y: widget.y || 80 }, size: { width: 340, height: 380 } });

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);

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

  const monthNames = [
    'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
  ];

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Calendar matrix calculation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // First day of month (0 = Sun, 1 = Mon...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Monday as start (0 = Mon, ..., 6 = Sun)
  const startDay = (firstDayIndex + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Prev month padding
  for (let i = startDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      month: month - 1,
      year,
      isCurrentMonth: false
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      month,
      year,
      isCurrentMonth: true
    });
  }

  // Next month padding to fill grid
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      day: i,
      month: month + 1,
      year,
      isCurrentMonth: false
    });
  }

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
      minHeight={320}
      bounds="parent"
      dragHandleClassName="calendar-drag-handle"
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
          className="calendar-drag-handle"
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>NAPTÁR</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Go to Today button */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={goToday}
              title="Ugrás a mai napra"
              style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px' }}
            >
              MA
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
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
          {/* Month Navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.3px' }}>
              {monthNames[month]} <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{year}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  background: 'var(--hover-bg, rgba(0,0,0,0.04))',
                  border: '1px solid var(--panel-border, #e4e4e7)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: 'inherit'
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={nextMonth}
                style={{
                  background: 'var(--hover-bg, rgba(0,0,0,0.04))',
                  border: '1px solid var(--panel-border, #e4e4e7)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: 'inherit'
                }}
              >
                ›
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '6px' }}>
            {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((d, idx) => (
              <div
                key={d}
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: idx >= 5 ? 'var(--theme-red, #cc0000)' : 'var(--text-secondary, #71717a)',
                  textTransform: 'uppercase'
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', gap: '2px' }}>
            {calendarDays.map((item, idx) => {
              const isToday =
                item.isCurrentMonth &&
                item.day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              const isSelected =
                selectedDate &&
                item.day === selectedDate.getDate() &&
                item.month === selectedDate.getMonth() &&
                item.year === selectedDate.getFullYear();

              return (
                <div
                  key={idx}
                  onClick={() => {
                    const d = new Date(item.year, item.month, item.day);
                    setSelectedDate(d);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: isToday ? 800 : 500,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: !item.isCurrentMonth
                      ? 'var(--panel-border, #a1a1aa)'
                      : isToday
                      ? 'var(--badge-color, #ffffff)'
                      : isSelected
                      ? 'var(--text-primary)'
                      : 'inherit',
                    background: isToday
                      ? 'var(--accent-color, #18181b)'
                      : isSelected
                      ? 'var(--hover-bg, rgba(0,0,0,0.06))'
                      : 'transparent',
                    border: isSelected && !isToday ? '1px solid var(--accent-color, #18181b)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.day}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Rnd>
  );
}
