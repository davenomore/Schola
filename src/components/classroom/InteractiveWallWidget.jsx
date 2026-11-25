import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { generateQRCode } from '../../utils/qrCode';
import { wallService } from '../../services/wallService';
import { API_BASE } from '../../config';

const COLOR_MAP = {
  yellow: { bg: '#fef08a', text: '#713f12', border: '#facc15', shadow: 'rgba(234, 179, 8, 0.25)' },
  pink: { bg: '#fbcfe8', text: '#831843', border: '#f472b6', shadow: 'rgba(236, 72, 153, 0.25)' },
  blue: { bg: '#bae6fd', text: '#0c4a6e', border: '#38bdf8', shadow: 'rgba(14, 165, 233, 0.25)' },
  green: { bg: '#bbf7d0', text: '#14532d', border: '#4ade80', shadow: 'rgba(34, 197, 94, 0.25)' },
  purple: { bg: '#e9d5ff', text: '#581c87', border: '#c084fc', shadow: 'rgba(168, 85, 247, 0.25)' },
  orange: { bg: '#fed7aa', text: '#7c2d12', border: '#fb923c', shadow: 'rgba(249, 115, 22, 0.25)' }
};

export default function InteractiveWallWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 100, y: widget.y || 60 });
  const [size, setSize] = useState({ width: 680, height: 480 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 100, y: widget.y || 60 }, size: { width: 680, height: 480 } });

  const [topic, setTopic] = useState('Gondolatok & Kérdések a mai óráról');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [topicDraft, setTopicDraft] = useState(topic);
  const [notes, setNotes] = useState([]);
  const [showQrPanel, setShowQrPanel] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick teacher add note
  const [showTeacherAdd, setShowTeacherAdd] = useState(false);
  const [teacherNoteText, setTeacherNoteText] = useState('');
  const [teacherColor, setTeacherColor] = useState('yellow');

  // Network IP auto-detection for mobile QR scanning
  const [networkIp, setNetworkIp] = useState(() => {
    return localStorage.getItem('schola_network_ip') || '';
  });
  const [useNetworkIp, setUseNetworkIp] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/network-ip`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.ip && data.ip !== 'localhost') {
          setNetworkIp(data.ip);
          localStorage.setItem('schola_network_ip', data.ip);
        }
      })
      .catch(() => {});
  }, []);

  const joinUrl = useMemo(() => {
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const host = (useNetworkIp && networkIp && isLocal) ? `${networkIp}${port}` : window.location.host;
    return `${protocol}//${host}${window.location.pathname}?join=wall`;
  }, [networkIp, useNetworkIp]);

  const qrMatrix = useMemo(() => {
    try {
      return generateQRCode(joinUrl, 'M');
    } catch {
      return null;
    }
  }, [joinUrl]);

  const loadWallData = async () => {
    try {
      const data = await wallService.getWall();
      if (data) {
        if (data.topic) setTopic(data.topic);
        if (data.notes) setNotes(data.notes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadWallData();
    const interval = setInterval(loadWallData, 2500);
    const handleLocalUpdate = () => loadWallData();
    window.addEventListener('schola_wall_updated', handleLocalUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('schola_wall_updated', handleLocalUpdate);
    };
  }, []);

  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDims.current = { position, size };
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 70 });
      setIsMaximized(true);
    } else {
      setPosition(prevDims.current.position);
      setSize(prevDims.current.size);
      setIsMaximized(false);
    }
  };

  const handleSaveTopic = async () => {
    if (!topicDraft.trim()) return;
    const updated = await wallService.setTopic(topicDraft.trim());
    setTopic(updated);
    setIsEditingTopic(false);
  };

  const handleLike = async (id) => {
    const updated = await wallService.likeNote(id);
    setNotes(updated);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Biztosan törlöd ezt a jegyzetet a faliújságról?')) {
      const updated = await wallService.deleteNote(id);
      setNotes(updated);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Biztosan törölni szeretnéd az összes beküldött jegyzetet a faliújságról?')) {
      const updated = await wallService.clearWall();
      setNotes(updated);
    }
  };

  const handleTeacherSubmitNote = async (e) => {
    e.preventDefault();
    if (!teacherNoteText.trim()) return;
    const updated = await wallService.addNote({
      author: 'Tanár',
      text: teacherNoteText.trim(),
      color: teacherColor
    });
    setNotes(updated);
    setTeacherNoteText('');
    setShowTeacherAdd(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // QR Code SVG dimensions
  const matrixSize = qrMatrix ? qrMatrix.length : 25;
  const quietZone = 2;
  const viewBoxSize = matrixSize + quietZone * 2;

  return (
    <Rnd
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
        updateWidgetBounds?.(widget.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, pos) => {
        const newW = parseInt(ref.style.width, 10);
        const newH = parseInt(ref.style.height, 10);
        setSize({ width: newW, height: newH });
        setPosition(pos);
        updateWidgetBounds?.(widget.id, { ...pos, width: newW, height: newH });
      }}
      minWidth={460}
      minHeight={340}
      bounds="parent"
      dragHandleClassName="widget-drag-handle"
      style={{ zIndex: isMaximized ? 99 : 25 }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--panel-bg, #ffffff)',
          color: 'var(--text-primary, #18181b)',
          borderRadius: isMaximized ? '0' : '10px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          border: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Drag Handle Top Bar */}
        <div
          className="widget-drag-handle"
          style={{
            padding: '10px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.03))',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <span style={{ color: '#e11d48', fontSize: '14px' }}>📋</span>
              <span>INTERAKTÍV FALIÚJSÁG (PADLET)</span>
              <span style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>
                {notes.length} jegyzet
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Toggle QR code */}
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowQrPanel(!showQrPanel)}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: showQrPanel ? 'rgba(225, 29, 72, 0.15)' : 'transparent',
                borderColor: showQrPanel ? '#e11d48' : 'var(--panel-border)'
              }}
              title="QR kód megjelenítése/elrejtése"
            >
              📱 QR Kód
            </button>

            {/* Teacher add note */}
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowTeacherAdd(!showTeacherAdd)}
              style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}
              title="Tanári jegyzet kitűzése"
            >
              + Jegyzet
            </button>

            {/* Clear all */}
            {notes.length > 0 && (
              <button
                type="button"
                className="btn-icon"
                onClick={handleClearAll}
                style={{ padding: '4px', color: 'var(--text-secondary)' }}
                title="Faliújság kiürítése"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            )}

            {/* Maximize */}
            <button
              type="button"
              className="btn-icon"
              onClick={toggleMaximize}
              title={isMaximized ? 'Visszaállítás' : 'Teljes méret'}
              style={{ padding: '4px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              onClick={() => removeWidget(widget.id)}
              className="btn-icon"
              style={{ color: '#ef4444', padding: '4px' }}
              title="Bezárás"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Topic Header Bar (Editable) */}
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {isEditingTopic ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <input
                type="text"
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                autoFocus
                placeholder="Írd be az órai kérdést vagy témát..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--panel-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTopic();
                  if (e.key === 'Escape') setIsEditingTopic(false);
                }}
              />
              <button onClick={handleSaveTopic} className="btn-outline" style={{ fontSize: '12px', padding: '6px 12px', color: '#10b981' }}>
                Mentés
              </button>
              <button onClick={() => setIsEditingTopic(false)} className="btn-outline" style={{ fontSize: '12px', padding: '6px 10px' }}>
                Mégse
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <div
                onClick={() => {
                  setTopicDraft(topic);
                  setIsEditingTopic(true);
                }}
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title="Kattints a téma szerkesztéséhez"
              >
                💡 {topic}
              </div>
              <button
                onClick={() => {
                  setTopicDraft(topic);
                  setIsEditingTopic(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px',
                  opacity: 0.6
                }}
                title="Téma szerkesztése"
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Quick Teacher Note Drawer */}
        {showTeacherAdd && (
          <form
            onSubmit={handleTeacherSubmitNote}
            style={{
              padding: '12px 16px',
              background: 'rgba(225, 29, 72, 0.05)',
              borderBottom: '1px solid var(--panel-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: '700' }}>Tanári Jegyzet Kitűzése:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {Object.keys(COLOR_MAP).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTeacherColor(key)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      backgroundColor: COLOR_MAP[key].bg,
                      border: teacherColor === key ? '2px solid #000' : '1px solid #ccc',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                required
                value={teacherNoteText}
                onChange={(e) => setTeacherNoteText(e.target.value)}
                placeholder="Pl. Figyeljetek a mértékegységekre a levezetésben!"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--panel-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#e11d48', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                Kitűzés
              </button>
            </div>
          </form>
        )}

        {/* Main Workspace Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Centered QR Code Card */}
          {showQrPanel && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 30,
                background: 'var(--panel-bg, #ffffff)',
                border: '1px solid var(--panel-border, #e4e4e7)',
                borderRadius: '16px',
                padding: '22px 28px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                maxWidth: '90%',
                backdropFilter: 'blur(8px)'
              }}
            >
              {/* Close button in top right of QR card */}
              <button
                type="button"
                onClick={() => setShowQrPanel(false)}
                className="btn-icon"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '4px',
                  borderRadius: '50%',
                  color: 'var(--text-secondary)'
                }}
                title="QR kód elrejtése"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>📱</span>
                <span>Csatlakozás a Faliújsághoz</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Szkenneld be telefonoddal a tábla közepén lévő QR-kódot!
              </div>

              {/* Large QR Code */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '14px',
                  borderRadius: '12px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}
              >
                {qrMatrix ? (
                  <svg
                    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                    style={{ width: '180px', height: '180px', display: 'block' }}
                  >
                    <rect width={viewBoxSize} height={viewBoxSize} fill="#ffffff" />
                    {qrMatrix.map((row, r) =>
                      row.map((isDark, c) => {
                        if (!isDark) return null;
                        return (
                          <rect
                            key={`${r}-${c}`}
                            x={c + quietZone}
                            y={r + quietZone}
                            width="1"
                            height="1"
                            fill="#000000"
                          />
                        );
                      })
                    )}
                  </svg>
                ) : (
                  <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    QR generálás...
                  </div>
                )}
              </div>

              {/* URL and Copy */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      background: 'var(--hover-bg, rgba(0,0,0,0.05))',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      maxWidth: '240px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {joinUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedLink ? '✓ Másolva' : '🔗 Másolás'}
                  </button>
                </div>

                {networkIp && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>● Wi-Fi: {networkIp}</span>
                    <button
                      type="button"
                      onClick={() => setUseNetworkIp(!useNetworkIp)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: '10px'
                      }}
                    >
                      {useNetworkIp ? '(váltás localhost-ra)' : '(váltás Wi-Fi IP-re)'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky Notes Corkboard / Canvas */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gridAutoRows: 'max-content',
              gap: '16px',
              alignContent: 'start'
            }}
          >
            {notes.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '240px',
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}
              >
                {!showQrPanel && (
                  <button
                    type="button"
                    onClick={() => setShowQrPanel(true)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      background: '#e11d48',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px'
                    }}
                  >
                    <span>📱 QR Kód Megnyitása a Tábla Közepén</span>
                  </button>
                )}
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📌</div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                  A faliújság még üres
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', maxWidth: '320px', lineHeight: 1.4 }}>
                  Kérd meg a diákokat, hogy olvassák be a QR-kódot a telefonjukkal és küldjék be a gondolataikat!
                </div>
              </div>
            ) : (
              notes.map((note, index) => {
                const colorConfig = COLOR_MAP[note.color] || COLOR_MAP.yellow;
                // slight rotation for organic post-it feel
                const rotation = (index % 5 - 2) * 1.2;
                return (
                  <div
                    key={note.id}
                    style={{
                      backgroundColor: colorConfig.bg,
                      color: colorConfig.text,
                      borderRadius: '4px',
                      padding: '14px',
                      boxShadow: `0 8px 18px ${colorConfig.shadow}, 0 2px 4px rgba(0,0,0,0.06)`,
                      borderTop: `4px solid ${colorConfig.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '140px',
                      transform: `rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.04) rotate(0deg)';
                      e.currentTarget.style.zIndex = 10;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = `rotate(${rotation}deg)`;
                      e.currentTarget.style.zIndex = 1;
                    }}
                  >
                    {/* Note header: Author & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '800', fontSize: '12px', letterSpacing: '0.3px' }}>
                        {note.author}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: colorConfig.text,
                          opacity: 0.5,
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex'
                        }}
                        title="Törlés"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>

                    {/* Note text */}
                    <div
                      style={{
                        fontSize: '13px',
                        lineHeight: '1.4',
                        fontWeight: '500',
                        wordBreak: 'break-word',
                        flex: 1
                      }}
                    >
                      {note.text}
                    </div>

                    {/* Footer: time & like */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '6px', borderTop: `1px solid rgba(0,0,0,0.08)` }}>
                      <span style={{ fontSize: '10px', opacity: 0.65 }}>
                        {note.timestamp}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLike(note.id)}
                        style={{
                          background: 'rgba(255,255,255,0.45)',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: colorConfig.text
                        }}
                        title="Szavazás / Tetszik"
                      >
                        <span>❤️</span>
                        <span>{note.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Rnd>
  );
}
