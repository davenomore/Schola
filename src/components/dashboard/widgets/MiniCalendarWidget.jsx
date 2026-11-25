import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function MiniCalendarWidget({
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
  const today = new Date();
  const monthName = today.toLocaleString('hu-HU', { month: 'long' }).toUpperCase();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.miniCalendar?.c || 1} / span ${widgetSizes.miniCalendar}`,
        gridRow: `${widgetPositions.miniCalendar?.r || 1} / span ${widgetHeights.miniCalendar}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'miniCalendar')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'miniCalendar')}
    >
      <WidgetResizer
        widgetKey="miniCalendar"
        w={widgetSizes.miniCalendar}
        h={widgetHeights.miniCalendar}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title">
          <span>Naptár</span>
          <span style={{ color: 'var(--theme-red)', fontWeight: 'bold' }}>{monthName}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minHeight: 0 }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(0, 1fr)', gap: '2px', textAlign: 'center', minHeight: 0 }}>
            {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map((wd, i) => (
              <div key={i} style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {wd}
              </div>
            ))}
            {days.map((day, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, height: '100%', position: 'relative' }}>
                {day && (
                  <div
                    style={{
                      width: day === today.getDate() ? '26px' : 'auto',
                      height: day === today.getDate() ? '26px' : 'auto',
                      minWidth: day === today.getDate() ? '26px' : 'auto',
                      minHeight: day === today.getDate() ? '26px' : 'auto',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: day === today.getDate() ? '700' : '500',
                      fontSize: '11px',
                      lineHeight: 1,
                      margin: 'auto',
                      color: day === today.getDate() ? '#fff' : 'var(--text-primary)',
                      background: day === today.getDate() ? 'var(--theme-red)' : 'transparent',
                      borderRadius: '50%',
                      boxShadow: day === today.getDate() ? '0 2px 5px rgba(204, 0, 0, 0.25)' : 'none'
                    }}
                  >
                    {day}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
