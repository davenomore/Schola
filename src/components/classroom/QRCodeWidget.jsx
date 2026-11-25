import React, { useState, useMemo, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { generateQRCode } from '../../utils/qrCode';

const COLOR_PRESETS = [
  { label: 'Klasszikus Katedra', fg: 'var(--text-primary, #18181b)', bg: 'var(--panel-bg, #ffffff)' },
  { label: 'Sötét Tábla', fg: '#38bdf8', bg: '#0f172a' },
  { label: 'Királykék', fg: '#1d4ed8', bg: '#eff6ff' },
  { label: 'Smaragdzöld', fg: '#047857', bg: '#ecfdf5' },
  { label: 'Katedra Piros', fg: '#cc0000', bg: '#fef2f2' },
  { label: 'Bíbor', fg: '#7c3aed', bg: '#f5f3ff' }
];

const PRESETS = [
  { name: 'Kvíz Aréna', url: 'http://localhost:5173/?join=quiz', icon: '⭐' },
  { name: 'Quizlet Live', url: 'https://quizlet.com/live', icon: '🧠' },
  { name: 'Mentimeter', url: 'https://menti.com', icon: '📊' },
  { name: 'Google Kérdőív', url: 'https://forms.google.com', icon: '📋' },
  { name: 'e-Kréta', url: 'https://ekreta.hu', icon: '📚' }
];

export default function QRCodeWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 120, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 560, height: 460 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 120, y: widget.y || 80 }, size: { width: 560, height: 460 } });

  // Mode: 'url' | 'wifi' | 'text'
  const [mode, setMode] = useState('url');

  // Input states
  const [urlInput, setUrlInput] = useState('https://menti.com');
  const [textInput, setTextInput] = useState('Üdvözöllek az órán!');
  const [wifiSsid, setWifiSsid] = useState('Iskola_Diak_WiFi');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');

  // Customization
  const [qrLabel, setQrLabel] = useState('Szkenneld be a telefonoddal!');
  const [colorPreset, setColorPreset] = useState(COLOR_PRESETS[0]);
  const [dotStyle, setDotStyle] = useState('rounded'); // 'rounded' | 'square'
  const [copied, setCopied] = useState(false);
  const [largePreview, setLargePreview] = useState(false);

  // Compute final text to encode
  const finalQrText = useMemo(() => {
    if (mode === 'url') {
      let trimmed = urlInput.trim();
      if (!trimmed) return 'https://menti.com';
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = 'https://' + trimmed;
      }
      return trimmed;
    }
    if (mode === 'wifi') {
      const ssid = wifiSsid.trim() || 'WiFi';
      const enc = wifiEncryption;
      const pass = wifiPassword;
      return `WIFI:S:${ssid};T:${enc};P:${pass};;`;
    }
    return textInput.trim() || ' ';
  }, [mode, urlInput, textInput, wifiSsid, wifiPassword, wifiEncryption]);

  // Generate QR matrix
  const qrMatrix = useMemo(() => {
    try {
      return generateQRCode(finalQrText);
    } catch {
      return generateQRCode('https://menti.com');
    }
  }, [finalQrText]);

  // Copy link
  const handleCopy = () => {
    navigator.clipboard.writeText(finalQrText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download high-resolution PNG
  const handleDownloadPng = () => {
    if (!qrMatrix || qrMatrix.length === 0) return;
    const canvas = document.createElement('canvas');
    const matrixSize = qrMatrix.length;
    const margin = 3;
    const totalModules = matrixSize + 2 * margin;
    const modulePixel = 24;
    canvas.width = totalModules * modulePixel;
    canvas.height = totalModules * modulePixel + (qrLabel ? 60 : 0);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = colorPreset.bg.startsWith('var') ? '#ffffff' : colorPreset.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR modules
    ctx.fillStyle = colorPreset.fg.startsWith('var') ? '#18181b' : colorPreset.fg;
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (qrMatrix[r][c]) {
          const x = (c + margin) * modulePixel;
          const y = (r + margin) * modulePixel;
          if (dotStyle === 'rounded') {
            const radius = modulePixel * 0.35;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, modulePixel - 2, modulePixel - 2, radius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, modulePixel, modulePixel);
          }
        }
      }
    }

    // Optional Label text
    if (qrLabel) {
      ctx.fillStyle = colorPreset.fg.startsWith('var') ? '#18181b' : colorPreset.fg;
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(qrLabel, canvas.width / 2, totalModules * modulePixel + 38);
    }

    const link = document.createElement('a');
    link.download = `qr-kod-${mode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Toggle maximize
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

  const matrixSize = qrMatrix.length;
  const margin = 2;
  const viewBoxSize = matrixSize + 2 * margin;

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
      minWidth={460}
      minHeight={360}
      bounds="parent"
      dragHandleClassName="qr-widget-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 80 : 25 }}
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
          overflow: 'hidden'
        }}
      >
        {/* Top Header & Drag Handle */}
        <div
          className="qr-widget-drag-handle"
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
            {/* 6 dots grip */}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>QR KÓD GENERÁTOR</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Quick Copy Link */}
            <button
              type="button"
              className="btn-outline"
              title="Tartalom másolása"
              onClick={handleCopy}
              style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px' }}
            >
              {copied ? '✓ Másolva' : 'Másolás'}
            </button>

            {/* Maximize / Restore */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              title={isMaximized ? 'Visszaállítás' : 'Teljes méret'}
              onClick={toggleMaximize}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
              title="Bezárás"
              onClick={() => removeWidget(widget.id)}
              style={{ color: 'var(--theme-red, #cc0000)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Panel: Form & Controls */}
          <div
            style={{
              flex: 1.15,
              padding: '16px 18px',
              borderRight: '1px solid var(--panel-border, #e4e4e7)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Mode Selector Tabs */}
            <div style={{ display: 'flex', background: 'var(--hover-bg, #f4f4f5)', padding: '3px', borderRadius: '6px', border: '1px solid var(--panel-border, #e4e4e7)', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setMode('url')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: mode === 'url' ? '1px solid var(--panel-border)' : '1px solid transparent',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  background: mode === 'url' ? 'var(--panel-bg, #ffffff)' : 'transparent',
                  color: mode === 'url' ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)',
                  transition: 'all 0.15s'
                }}
              >
                🌐 Weboldal
              </button>
              <button
                type="button"
                onClick={() => setMode('wifi')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: mode === 'wifi' ? '1px solid var(--panel-border)' : '1px solid transparent',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  background: mode === 'wifi' ? 'var(--panel-bg, #ffffff)' : 'transparent',
                  color: mode === 'wifi' ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)',
                  transition: 'all 0.15s'
                }}
              >
                📶 Wi-Fi
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: mode === 'text' ? '1px solid var(--panel-border)' : '1px solid transparent',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  background: mode === 'text' ? 'var(--panel-bg, #ffffff)' : 'transparent',
                  color: mode === 'text' ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)',
                  transition: 'all 0.15s'
                }}
              >
                📝 Szöveg
              </button>
            </div>

            {/* Mode: URL */}
            {mode === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Hivatkozás (URL)
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--panel-border, #e4e4e7)',
                      background: 'var(--panel-bg, #ffffff)',
                      color: 'var(--text-primary, #18181b)',
                      fontSize: '13px',
                      marginTop: '4px',
                      outline: 'none',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  />
                </div>

                {/* Presets */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Gyakori Tanórai Sablonok
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setUrlInput(p.url)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '4px',
                          border: urlInput === p.url ? '1px solid var(--theme-red, #cc0000)' : '1px solid var(--panel-border, #e4e4e7)',
                          background: urlInput === p.url ? 'var(--hover-bg, rgba(204,0,0,0.06))' : 'var(--panel-bg, #ffffff)',
                          color: urlInput === p.url ? 'var(--theme-red, #cc0000)' : 'var(--text-primary, #18181b)',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode: Wi-Fi */}
            {mode === 'wifi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Wi-Fi Neve (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Hálózat neve"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--panel-border, #e4e4e7)',
                      background: 'var(--panel-bg, #ffffff)',
                      color: 'var(--text-primary, #18181b)',
                      fontSize: '13px',
                      marginTop: '4px',
                      outline: 'none',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Jelszó
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Wi-Fi jelszó (opcionális)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--panel-border, #e4e4e7)',
                      background: 'var(--panel-bg, #ffffff)',
                      color: 'var(--text-primary, #18181b)',
                      fontSize: '13px',
                      marginTop: '4px',
                      outline: 'none',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #71717a)', lineHeight: 1.4 }}>
                  💡 A diákok telefonjukkal beolvasva automatikusan felcsatlakoznak a tantermi Wi-Fi-re jelszó bepötyögése nélkül.
                </div>
              </div>
            )}

            {/* Mode: Free text */}
            {mode === 'text' && (
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Szöveges Tartalom / Feladvány
                </label>
                <textarea
                  rows={3}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Írj be tetszőleges szöveget..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border, #e4e4e7)',
                    background: 'var(--panel-bg, #ffffff)',
                    color: 'var(--text-primary, #18181b)',
                    fontSize: '13px',
                    marginTop: '4px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: "'Inter', sans-serif"
                  }}
                />
              </div>
            )}

            {/* Bottom options: Label & Style */}
            <div style={{ borderTop: '1px solid var(--panel-border, #e4e4e7)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Felirat a QR kód alatt
                </label>
                <input
                  type="text"
                  value={qrLabel}
                  onChange={(e) => setQrLabel(e.target.value)}
                  placeholder="Pl. Szkenneld be a feladathoz!"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border, #e4e4e7)',
                    background: 'var(--panel-bg, #ffffff)',
                    color: 'var(--text-primary, #18181b)',
                    fontSize: '12px',
                    marginTop: '4px',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif"
                  }}
                />
              </div>

              {/* Color preset swatches */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Színvilág
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {COLOR_PRESETS.map((cp) => (
                    <button
                      key={cp.label}
                      type="button"
                      title={cp.label}
                      onClick={() => setColorPreset(cp)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: cp.fg.startsWith('var') ? 'var(--text-primary)' : cp.fg,
                        border: colorPreset.label === cp.label ? '2px solid var(--theme-red, #cc0000)' : '1px solid var(--panel-border, rgba(0,0,0,0.15))',
                        boxShadow: colorPreset.label === cp.label ? '0 0 0 2px rgba(204,0,0,0.2)' : 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Dot shape toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Pöttyök Formája:
                </span>
                <button
                  type="button"
                  onClick={() => setDotStyle(dotStyle === 'rounded' ? 'square' : 'rounded')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border, #e4e4e7)',
                    background: 'transparent',
                    color: 'var(--text-primary, #18181b)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 500
                  }}
                >
                  {dotStyle === 'rounded' ? '● Lekerekített' : '■ Szögletes'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Live QR Code Preview */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              background: 'var(--hover-bg, rgba(0,0,0,0.01))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {/* QR Card Container */}
            <div
              className="glass-panel"
              style={{
                background: colorPreset.bg,
                padding: '14px',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                border: '1px solid var(--panel-border, #e4e4e7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '92%',
                maxHeight: '85%'
              }}
            >
              {/* Scalable SVG QR Code */}
              <svg
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                style={{
                  width: largePreview ? '280px' : '180px',
                  height: largePreview ? '280px' : '180px',
                  maxWidth: '100%',
                  display: 'block',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Background */}
                <rect x="0" y="0" width={viewBoxSize} height={viewBoxSize} fill={colorPreset.bg.startsWith('var') ? '#ffffff' : colorPreset.bg} rx={1} />
                {/* QR Modules */}
                {qrMatrix.map((row, r) =>
                  row.map((isDark, c) => {
                    if (!isDark) return null;
                    const fillCol = colorPreset.fg.startsWith('var') ? '#18181b' : colorPreset.fg;
                    return dotStyle === 'rounded' ? (
                      <rect
                        key={`${r}-${c}`}
                        x={c + margin + 0.08}
                        y={r + margin + 0.08}
                        width={0.84}
                        height={0.84}
                        rx={0.28}
                        ry={0.28}
                        fill={fillCol}
                      />
                    ) : (
                      <rect
                        key={`${r}-${c}`}
                        x={c + margin}
                        y={r + margin}
                        width={1}
                        height={1}
                        fill={fillCol}
                      />
                    );
                  })
                )}
              </svg>

              {/* QR Label */}
              {qrLabel && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: colorPreset.fg.startsWith('var') ? 'var(--text-primary)' : colorPreset.fg,
                    textAlign: 'center',
                    maxWidth: '220px',
                    wordBreak: 'break-word',
                    letterSpacing: '0.5px'
                  }}
                >
                  {qrLabel}
                </div>
              )}
            </div>

            {/* Action Buttons underneath */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleDownloadPng}
                title="Letöltés PNG képként nyomtatáshoz"
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  background: 'var(--accent-color, #18181b)',
                  color: 'var(--badge-color, #ffffff)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Letöltés PNG</span>
              </button>

              <button
                type="button"
                className="btn-outline"
                onClick={() => setLargePreview(!largePreview)}
                title={largePreview ? 'Normál méret' : 'Nagyítás a táblán'}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  {largePreview ? <line x1="8" y1="11" x2="14" y2="11" /> : <line x1="11" y1="8" x2="11" y2="14" />}
                </svg>
                <span>{largePreview ? 'Kisebb' : 'Nagyobb'}</span>
              </button>

              {mode === 'url' && (
                <a
                  href={finalQrText}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>Megnyitás</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Rnd>
  );
}
