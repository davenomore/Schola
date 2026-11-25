import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import QuizArenaTool from '../tools/QuizArenaTool';

export default function QuizArenaWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 100, y: widget.y || 40 });
  const [size, setSize] = useState({ width: widget.width || 760, height: widget.height || 600 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({
    position: { x: widget.x || 100, y: widget.y || 40 },
    size: { width: widget.width || 760, height: widget.height || 600 }
  });

  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDims.current = { position, size };
      setPosition({ x: 20, y: 20 });
      setSize({ width: 'calc(100% - 40px)', height: 'calc(100% - 80px)' });
      setIsMaximized(true);
    } else {
      setPosition(prevDims.current.position);
      setSize(prevDims.current.size);
      setIsMaximized(false);
    }
  };

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
      minWidth={480}
      minHeight={400}
      bounds="parent"
      dragHandleClassName="quiz-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 99 : 30 }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--panel-bg, #ffffff)',
          color: 'var(--text-primary, #18181b)',
          borderRadius: isMaximized ? '0' : '8px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header Bar */}
        <div
          className="quiz-drag-handle"
          style={{
            padding: '8px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            cursor: isMaximized ? 'default' : 'grab'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <span style={{ color: '#e21b3c', fontSize: '14px' }}>⚡</span>
              <span>KVÍZ ARÉNA</span>
              <span style={{ background: 'rgba(226, 27, 60, 0.12)', color: '#e21b3c', padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                ÉLŐ VETÉLKEDŐ
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Maximize Toggle */}
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

            {/* Close Button */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => removeWidget(widget.id)}
              style={{ color: '#ef4444' }}
              title="Bezárás"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <QuizArenaTool />
        </div>
      </div>
    </Rnd>
  );
}
