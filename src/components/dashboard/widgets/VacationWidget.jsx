import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function VacationWidget({
  vacation,
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
  if (!vacation) return null;

  const w = widgetSizes.vacation || 1;
  const h = widgetHeights.vacation || 1;
  const schoolDays = Math.max(1, Math.round(vacation.days * 5 / 7));
  const otherVacations = (vacation.allUpcoming || []).slice(1);
  const progressPercent = Math.min(100, Math.max(12, Math.round(((90 - vacation.days) / 90) * 100)));

  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.vacation?.c || 1} / span ${w}`,
        gridRow: `${widgetPositions.vacation?.r || 1} / span ${h}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'vacation')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'vacation')}
    >
      <WidgetResizer
        widgetKey="vacation"
        w={w}
        h={h}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
        <div className="card-title">
          <span>Vakáció</span>
          <span style={{ fontSize: '11px', textTransform: 'none', letterSpacing: 0, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {vacation.dateStr}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: (w === 1 && h >= 2) ? 'column' : 'row',
            alignItems: 'center',
            gap: (w === 1 && h >= 2) ? '12px' : '16px',
            flex: 1,
            minHeight: 0,
            width: '100%',
            justifyContent: (w === 1 && h >= 2) ? 'center' : 'space-between'
          }}
        >
          {/* Fő visszaszámláló elem - adaptív elrendezés */}
          <div
            style={{
              display: 'flex',
              flexDirection: (w === 1 && h >= 2) ? 'column' : 'row',
              alignItems: 'center',
              gap: (w === 1 && h >= 2) ? '10px' : '14px',
              flex: 1,
              minWidth: 0,
              width: '100%',
              textAlign: (w === 1 && h >= 2) ? 'center' : 'left'
            }}
          >
            <div
              style={{
                width: (w === 1 && h === 1) ? '54px' : '64px',
                height: (w === 1 && h === 1) ? '54px' : '64px',
                borderRadius: '12px',
                background: 'var(--accent-color)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
              }}
            >
              <div style={{ fontSize: (w === 1 && h === 1) ? '26px' : '30px', fontWeight: '800', lineHeight: 1 }}>
                {vacation.days}
              </div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, opacity: 0.9, marginTop: '2px' }}>
                Nap
              </div>
            </div>

            <div
              style={{
                minWidth: 0,
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: (w === 1 && h >= 2) ? 'center' : 'stretch',
                gap: '3px'
              }}
            >
              <div
                style={{
                  fontSize: (w === 1) ? '17px' : '20px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2
                }}
              >
                {vacation.name}
              </div>
              <div style={{ fontSize: (w === 1) ? '11px' : '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                ~{schoolDays} tanítási nap van hátra
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: (w === 1 && h >= 2) ? '140px' : '100%',
                  height: '6px',
                  background: 'var(--hover-bg)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginTop: '4px'
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'var(--accent-color)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* További szünetek listája, ha a widget szélesebb vagy extra magas */}
          {(w >= 2 || (w === 1 && h >= 3)) && otherVacations.length > 0 && (
            <div
              style={{
                flex: '0 0 auto',
                minWidth: (w === 1) ? '100%' : '150px',
                borderLeft: (w >= 2 && h === 1) ? '1px solid var(--panel-border)' : 'none',
                borderTop: (w === 1 && h >= 3) ? '1px solid var(--panel-border)' : 'none',
                paddingLeft: (w >= 2 && h === 1) ? '16px' : '0',
                paddingTop: (w === 1 && h >= 3) ? '10px' : '0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Következő szünetek
              </div>
              {otherVacations.slice(0, h >= 3 ? 3 : 2).map((v, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--hover-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, flexShrink: 0 }}>
                    {v.days} nap
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
