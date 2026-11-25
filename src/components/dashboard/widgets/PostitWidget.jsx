import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function PostitWidget({
  postit,
  setPostit,
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
        gridColumn: `${widgetPositions.postit?.c || 1} / span ${widgetSizes.postit}`,
        gridRow: `${widgetPositions.postit?.r || 1} / span ${widgetHeights.postit}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        background: 'var(--accent-color)',
        color: '#fff'
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'postit')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'postit')}
    >
      <WidgetResizer
        widgetKey="postit"
        w={widgetSizes.postit}
        h={widgetHeights.postit}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Jegyzet
        </div>
        <textarea
          value={postit}
          onChange={(e) => setPostit(e.target.value)}
          style={{ width: '100%', flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
          placeholder="Írj ide valami fontosat..."
        />
      </div>
    </section>
  );
}
