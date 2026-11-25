import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function QuickActionsWidget({
  widgetSettings,
  widgetPositions,
  widgetSizes,
  widgetHeights,
  changeWidgetWidth,
  changeWidgetHeight,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setActiveTab
}) {
  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.quickActions?.c || 1} / span ${widgetSizes.quickActions}`,
        gridRow: `${widgetPositions.quickActions?.r || 1} / span ${widgetHeights.quickActions}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'quickActions')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'quickActions')}
    >
      <WidgetResizer
        widgetKey="quickActions"
        w={widgetSizes.quickActions}
        h={widgetHeights.quickActions}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title">Műveletek</div>
        <div style={{ display: 'grid', gridTemplateColumns: widgetSizes.quickActions === 1 ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '8px', flex: 1, minHeight: 0 }}>
          <button
            className="quick-actions-btn"
            style={{ fontSize: '11px', padding: '6px', height: '100%', display: 'flex', flexDirection: widgetHeights.quickActions === 1 && widgetSizes.quickActions > 1 ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(128,128,128,0.2)', background: 'var(--hover-bg)' }}
            onClick={() => setActiveTab && setActiveTab('üzenetek')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>Új üzenet</span>
          </button>
          <button
            className="quick-actions-btn"
            style={{ fontSize: '11px', padding: '6px', height: '100%', display: 'flex', flexDirection: widgetHeights.quickActions === 1 && widgetSizes.quickActions > 1 ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(128,128,128,0.2)', background: 'var(--hover-bg)' }}
            onClick={() => setActiveTab && setActiveTab('osztalyfonok')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>Igazolás</span>
          </button>
          <button
            className="quick-actions-btn"
            style={{ fontSize: '11px', padding: '6px', height: '100%', display: 'flex', flexDirection: widgetHeights.quickActions === 1 && widgetSizes.quickActions > 1 ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(128,128,128,0.2)', background: 'var(--hover-bg)' }}
            onClick={() => setActiveTab && setActiveTab('csoportok')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><rect x="4" y="4" width="16" height="16" /><line x1="4" y1="9" x2="20" y2="9" /><line x1="9" y1="4" x2="9" y2="20" /></svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>Jegybeírás</span>
          </button>
          <button
            className="quick-actions-btn"
            style={{ fontSize: '11px', padding: '6px', height: '100%', display: 'flex', flexDirection: widgetHeights.quickActions === 1 && widgetSizes.quickActions > 1 ? 'row' : 'column', justifyContent: 'center', alignItems: 'center', gap: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(128,128,128,0.2)', background: 'var(--hover-bg)' }}
            onClick={() => setActiveTab && setActiveTab('órarend')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>Jelenlét</span>
          </button>
        </div>
      </div>
    </section>
  );
}
