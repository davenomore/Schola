import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function DigitalClockWidget({
  currentTime,
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
  const now = currentTime || new Date();
  const timeString = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const secString = now.toLocaleTimeString('hu-HU', { second: '2-digit' });

  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.digitalClock?.c || 1} / span ${widgetSizes.digitalClock}`,
        gridRow: `${widgetPositions.digitalClock?.r || 1} / span ${widgetHeights.digitalClock}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'digitalClock')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'digitalClock')}
    >
      <WidgetResizer
        widgetKey="digitalClock"
        w={widgetSizes.digitalClock}
        h={widgetHeights.digitalClock}
        editMode={widgetSettings.editMode}
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
          width: '100%'
        }}
      >
        <div className="card-title">Idő</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <div
              className="compact-value-h"
              style={{
                fontSize: widgetHeights.digitalClock === 1 || widgetSizes.digitalClock === 1 ? '30px' : '48px',
                fontWeight: '800',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                color: 'var(--text-primary)',
                lineHeight: 1
              }}
            >
              {timeString}
            </div>
            <div
              className="compact-hide-h"
              style={{
                fontSize: widgetHeights.digitalClock === 1 || widgetSizes.digitalClock === 1 ? '13px' : '20px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                color: 'var(--accent-color)',
                opacity: 0.8
              }}
            >
              {secString}
            </div>
          </div>
          {widgetHeights.digitalClock >= 2 && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '6px', textTransform: 'capitalize' }}>
              {now.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', weekday: 'short' })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
