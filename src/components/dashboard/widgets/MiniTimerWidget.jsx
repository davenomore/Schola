import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function MiniTimerWidget({
  miniTimerLeft,
  setMiniTimerLeft,
  miniTimerRunning,
  setMiniTimerRunning,
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
  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.miniTimer?.c || 1} / span ${widgetSizes.miniTimer}`,
        gridRow: `${widgetPositions.miniTimer?.r || 1} / span ${widgetHeights.miniTimer}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'miniTimer')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'miniTimer')}
    >
      <WidgetResizer
        widgetKey="miniTimer"
        w={widgetSizes.miniTimer}
        h={widgetHeights.miniTimer}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title">Időzítő</div>
        <div
          style={{
            display: 'flex',
            flexDirection: widgetHeights.miniTimer === 1 && widgetSizes.miniTimer >= 2 ? 'row' : 'column',
            alignItems: 'center',
            margin: 'auto',
            gap: widgetHeights.miniTimer === 1 && widgetSizes.miniTimer >= 2 ? '16px' : '0'
          }}
        >
          <div
            style={{
              fontSize: widgetHeights.miniTimer === 1 && widgetSizes.miniTimer === 1 ? '24px' : '32px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: miniTimerLeft === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
              lineHeight: 1,
              marginBottom: widgetHeights.miniTimer === 1 && widgetSizes.miniTimer >= 2 ? '0' : '8px',
              letterSpacing: '2px'
            }}
          >
            {Math.floor(miniTimerLeft / 60).toString().padStart(2, '0')}:{(miniTimerLeft % 60).toString().padStart(2, '0')}
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
            <button className="btn-outline" style={{ width: widgetSizes.miniTimer === 1 ? '32px' : '42px', height: '30px', margin: 0, padding: 0, fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} onClick={() => setMiniTimerLeft(p => p + 300)}>+5P</button>
            <button className="btn-outline" style={{ width: widgetSizes.miniTimer === 1 ? '32px' : '42px', height: '30px', margin: 0, padding: 0, fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }} onClick={() => setMiniTimerLeft(p => p + 600)}>+10P</button>
            <button
              className="btn-outline"
              style={{ width: widgetSizes.miniTimer === 1 ? '32px' : '42px', height: '30px', margin: 0, padding: 0, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
              title="Egyéni idő"
              onClick={() => {
                const val = window.prompt("Add meg a percet:", "15");
                if (val && !isNaN(val)) setMiniTimerLeft(parseInt(val, 10) * 60);
              }}
            >
              ✎
            </button>
            <button
              className="btn-primary"
              style={{ width: widgetSizes.miniTimer === 1 ? '32px' : '42px', height: '30px', margin: 0, padding: 0, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
              onClick={() => setMiniTimerRunning(!miniTimerRunning)}
            >
              {miniTimerRunning ? '⏸' : '▶'}
            </button>
            <button
              className="btn-outline"
              style={{ width: widgetSizes.miniTimer === 1 ? '32px' : '42px', height: '30px', margin: 0, padding: 0, fontSize: '12px', color: 'var(--theme-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
              onClick={() => {
                setMiniTimerRunning(false);
                setMiniTimerLeft(0);
              }}
            >
              ◼
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
