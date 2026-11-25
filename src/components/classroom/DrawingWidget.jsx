import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';

export default function DrawingWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 160, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 440, height: 380 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 160, y: widget.y || 80 }, size: { width: 440, height: 380 } });

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [color, setColor] = useState('#18181b');
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const historyRef = useRef([]);

  // Resize canvas according to container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Save existing image before resize
    const dataUrl = canvas.toDataURL();
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }, [size, isMaximized]);

  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDims.current = { position, size };
      setPosition({ x: 30, y: 30 });
      setSize({ width: 'calc(100% - 60px)', height: 'calc(100% - 90px)' });
      setIsMaximized(true);
    } else {
      setPosition(prevDims.current.position);
      setSize(prevDims.current.size);
      setIsMaximized(false);
    }
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas.toDataURL());
    if (historyRef.current.length > 20) historyRef.current.shift();
  };

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveHistory();
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Composite onto white background for export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const eCtx = exportCanvas.getContext('2d');
    eCtx.fillStyle = '#ffffff';
    eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    eCtx.drawImage(canvas, 0, 0);

    const a = document.createElement('a');
    a.href = exportCanvas.toDataURL('image/png');
    a.download = `rajz-${Date.now()}.png`;
    a.click();
  };

  // Drawing event handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveHistory();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    isDrawingRef.current = false;
  };

  const colors = [
    { label: 'Fekete', val: '#18181b' },
    { label: 'Kék', val: '#2563eb' },
    { label: 'Piros', val: '#dc2626' },
    { label: 'Zöld', val: '#16a34a' },
    { label: 'Sárga', val: '#eab308' }
  ];

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
      minWidth={320}
      minHeight={260}
      bounds="parent"
      dragHandleClassName="draw-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 85 : 25 }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--panel-bg, #ffffff)',
          color: 'var(--text-primary, #18181b)',
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          border: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          className="draw-drag-handle"
          style={{
            padding: '8px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            cursor: 'grab'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
              <span>RAJTÁBLA</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Download */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={handleDownload}
              title="Letöltés képként (PNG)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>

            {/* Maximize */}
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

            {/* Close */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => removeWidget(widget.id)}
              title="Bezárás"
              style={{ color: 'var(--theme-red, #cc0000)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Drawing Toolbar */}
        <div
          style={{
            padding: '6px 12px',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            background: 'var(--hover-bg, rgba(0,0,0,0.01))'
          }}
        >
          {/* Colors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {colors.map((c) => (
              <button
                key={c.val}
                type="button"
                onClick={() => {
                  setColor(c.val);
                  setIsEraser(false);
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: c.val,
                  border: !isEraser && color === c.val ? '2px solid #3b82f6' : '1px solid rgba(128,128,128,0.3)',
                  cursor: 'pointer',
                  transform: !isEraser && color === c.val ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s ease'
                }}
                title={c.label}
              />
            ))}

            {/* Eraser */}
            <button
              type="button"
              onClick={() => setIsEraser(!isEraser)}
              className="rich-text-toolbar-btn"
              title="Radír"
              style={{
                marginLeft: '4px',
                background: isEraser ? 'var(--hover-bg, rgba(0,0,0,0.08))' : 'transparent',
                border: isEraser ? '1px solid var(--accent-color)' : '1px solid transparent'
              }}
            >
              🧹
            </button>
          </div>

          {/* Stroke Width & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setBrushSize(w)}
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  border: brushSize === w ? '1px solid var(--accent-color)' : '1px solid var(--panel-border)',
                  background: brushSize === w ? 'var(--hover-bg)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={`${w}px vastagság`}
              >
                <div style={{ width: `${w * 2}px`, height: `${w * 2}px`, borderRadius: '50%', background: 'currentColor' }} />
              </button>
            ))}

            <div style={{ width: '1px', height: '18px', background: 'var(--panel-border)' }} />

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              className="rich-text-toolbar-btn"
              title="Visszavonás"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>

            {/* Clear */}
            <button
              type="button"
              onClick={handleClear}
              className="rich-text-toolbar-btn"
              title="Tábla törlése"
              style={{ color: 'var(--theme-red, #cc0000)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Canvas Area (White Paper) */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#ffffff',
            cursor: isEraser ? 'cell' : 'crosshair',
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>
    </Rnd>
  );
}
