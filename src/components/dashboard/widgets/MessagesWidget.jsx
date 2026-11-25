import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function MessagesWidget({
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
        gridColumn: `${widgetPositions.messages?.c || 1} / span ${widgetSizes.messages}`,
        gridRow: `${widgetPositions.messages?.r || 1} / span ${widgetHeights.messages}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'messages')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'messages')}
    >
      <WidgetResizer
        widgetKey="messages"
        w={widgetSizes.messages}
        h={widgetHeights.messages}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title">
          <span>Üzenetek</span>
          <span className="badge">2</span>
        </div>

        <div className="message-list" style={{ flex: 1, overflow: 'auto' }}>
          <div className="message-item">
            <div className="message-header">
              <span className="message-sender" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                Kovács István (Igazgató)
              </span>
              <span className="message-time">10 P</span>
            </div>
            <div className="message-preview">
              Tisztelt Kollégák! A holnapi értekezlet időpontja 14:00-ra módosult...
            </div>
          </div>
        </div>
        <button
          className="all-msgs-btn"
          onClick={() => setActiveTab && setActiveTab('üzenetek')}
        >
          Összes üzenet megtekintése
        </button>
      </div>
    </section>
  );
}
