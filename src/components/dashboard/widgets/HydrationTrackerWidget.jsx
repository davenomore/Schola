import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function HydrationTrackerWidget({
  hydrationProgress,
  setHydrationProgress,
  liveScheduleInfo,
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
  const hydrationPct = Math.min(
    Math.round((hydrationProgress.amount / widgetSettings.hydrationTarget) * 100),
    100
  );
  const hydroRadius = 60;
  const hydroStroke = 8;
  const hydroNormRadius = hydroRadius - hydroStroke / 2;
  const hydroCircumference = hydroNormRadius * 2 * Math.PI;
  const hydroDashoffset = hydroCircumference - (hydrationPct / 100) * hydroCircumference;

  const showWarning =
    liveScheduleInfo?.breakTime && hydrationProgress.amount < widgetSettings.hydrationTarget;

  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.hydrationTracker?.c || 1} / span ${widgetSizes.hydrationTracker}`,
        gridRow: `${widgetPositions.hydrationTracker?.r || 1} / span ${widgetHeights.hydrationTracker}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'hydrationTracker')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'hydrationTracker')}
    >
      <WidgetResizer
        widgetKey="hydrationTracker"
        w={widgetSizes.hydrationTracker}
        h={widgetHeights.hydrationTracker}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title">Folyadék</div>

        <div style={{ flex: 1, display: 'flex', flexDirection: widgetSizes.hydrationTracker === 1 ? 'column' : 'row', gap: '10px', minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0, height: '100%', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1, minHeight: '80px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 120 120" style={{ height: '100%', maxHeight: '115px', width: '100%' }}>
                <circle stroke="rgba(128,128,128,0.2)" fill="transparent" strokeWidth={hydroStroke} r={hydroNormRadius} cx="60" cy="60" />
                <circle
                  stroke="var(--theme-red)"
                  fill="transparent"
                  strokeWidth={hydroStroke}
                  strokeDasharray={hydroCircumference + ' ' + hydroCircumference}
                  style={{ strokeDashoffset: hydroDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                  strokeLinecap="round"
                  r={hydroNormRadius}
                  cx="60"
                  cy="60"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="55" fill="var(--text-primary)" fontSize="24" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                  {hydrationPct}%
                </text>
                <text x="60" y="75" fill="var(--text-secondary)" fontSize="12" textAnchor="middle" alignmentBaseline="middle">
                  {hydrationProgress.amount} / {widgetSettings.hydrationTarget}
                </text>
              </svg>
            </div>
            {showWarning && (
              <div style={{ color: 'var(--theme-red)', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', marginTop: '2px', animation: 'pulse 2s infinite', flexShrink: 0 }}>
                💧 Szünet van, igyál!
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: widgetSizes.hydrationTracker === 1 ? 'row' : 'column', gap: '6px', justifyContent: 'center', flexShrink: 0, width: widgetSizes.hydrationTracker === 1 ? '100%' : '64px', height: widgetSizes.hydrationTracker === 1 ? '32px' : '100%', minHeight: 0 }}>
            <div
              onClick={() => setHydrationProgress({ ...hydrationProgress, amount: hydrationProgress.amount + 250 })}
              style={{ width: '100%', flex: 1, height: '100%', maxHeight: '32px', minHeight: 0, borderRadius: '4px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all 0.2s', overflow: 'hidden' }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--theme-red)';
                e.currentTarget.style.color = 'var(--theme-red)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--panel-border)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              title="Pohár (250ml)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}>
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>25</span>
            </div>
            <div
              onClick={() => setHydrationProgress({ ...hydrationProgress, amount: hydrationProgress.amount + 500 })}
              style={{ width: '100%', flex: 1, height: '100%', maxHeight: '32px', minHeight: 0, borderRadius: '4px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all 0.2s', overflow: 'hidden' }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--theme-red)';
                e.currentTarget.style.color = 'var(--theme-red)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--panel-border)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              title="Kulacs (500ml)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', flexShrink: 0 }}>
                <rect width="8" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M10 2h4" />
                <path d="M12 2v6" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>50</span>
            </div>
            <div
              onClick={() => setHydrationProgress({ ...hydrationProgress, amount: 0 })}
              style={{ width: widgetSizes.hydrationTracker === 1 ? '32px' : '100%', flex: widgetSizes.hydrationTracker === 1 ? 'none' : 1, height: '100%', maxHeight: '32px', minHeight: 0, borderRadius: '4px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0, overflow: 'hidden' }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--danger)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--danger)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--panel-border)';
              }}
              title="Törlés"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
