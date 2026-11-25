import React, { useState } from 'react';
import WidgetResizer from '../WidgetResizer';

function BookmarkFavicon({ url, title }) {
  const [loadError, setLoadError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const hostname = React.useMemo(() => {
    try {
      const u = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      return new URL(u).hostname;
    } catch {
      return '';
    }
  }, [url]);

  if (!hostname || loadError) {
    return (
      <div className="bookmark-icon">
        {title ? title.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  const faviconSrc = useFallback
    ? `https://icons.duckduckgo.com/ip3/${hostname}.ico`
    : `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

  return (
    <div className="bookmark-icon bookmark-icon-favicon">
      <img
        src={faviconSrc}
        alt={title || ''}
        className="bookmark-favicon-img"
        loading="lazy"
        onError={() => {
          if (!useFallback) {
            setUseFallback(true);
          } else {
            setLoadError(true);
          }
        }}
      />
    </div>
  );
}

export default function BookmarksWidget({
  bookmarks,
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
        gridColumn: `${Math.min(widgetPositions.bookmarks?.c || 1, Math.max(1, 7 - widgetSizes.bookmarks))} / span ${widgetSizes.bookmarks}`,
        gridRow: `${widgetPositions.bookmarks?.r || 1} / span ${widgetHeights.bookmarks}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'bookmarks')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'bookmarks')}
    >
      <WidgetResizer
        widgetKey="bookmarks"
        w={widgetSizes.bookmarks}
        h={widgetHeights.bookmarks}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title">Könyvjelzők</div>
        <div className={`bookmarks-grid ${widgetSizes.bookmarks === 1 ? 'is-col-1' : ''} ${widgetHeights.bookmarks === 1 ? 'is-row-1' : ''}`}>
          {bookmarks.slice(0, 5).map((bm, i) => (
            <a
              key={i}
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bookmark-item"
              title={bm.title}
            >
              <BookmarkFavicon url={bm.url} title={bm.title} />
              <span className="bookmark-title">{bm.title}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
