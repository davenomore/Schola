import React, { useState, useEffect, useMemo } from 'react';
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

export default function InteractiveWallTool() {
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

  const matrixSize = qrMatrix ? qrMatrix.length : 25;
  const quietZone = 2;
  const viewBoxSize = matrixSize + quietZone * 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Top action bar */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--hover-bg, rgba(0,0,0,0.02))',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {isEditingTopic ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              value={topicDraft}
              onChange={(e) => setTopicDraft(e.target.value)}
              autoFocus
              placeholder="Írd be az órai témát vagy feladványt..."
              style={{
                flex: 1,
                padding: '8px 12px',
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
            <button onClick={handleSaveTopic} className="btn-outline" style={{ fontSize: '12px', padding: '8px 14px', color: '#10b981' }}>
              Mentés
            </button>
            <button onClick={() => setIsEditingTopic(false)} className="btn-outline" style={{ fontSize: '12px', padding: '8px 12px' }}>
              Mégse
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <div
              onClick={() => {
                setTopicDraft(topic);
                setIsEditingTopic(true);
              }}
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              title="Kattints a téma szerkesztéséhez"
            >
              <span>💡 {topic}</span>
              <span style={{ fontSize: '12px', opacity: 0.6 }}>✏️</span>
            </div>
            <span style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#e11d48', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
              {notes.length} jegyzet
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setShowQrPanel(!showQrPanel)}
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: showQrPanel ? 'rgba(225, 29, 72, 0.15)' : 'transparent',
              borderColor: showQrPanel ? '#e11d48' : 'var(--panel-border)'
            }}
          >
            📱 QR Kód {showQrPanel ? 'elrejtése' : 'mutatása'}
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={() => setShowTeacherAdd(!showTeacherAdd)}
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}
          >
            + Tanári Jegyzet
          </button>

          {notes.length > 0 && (
            <button
              type="button"
              className="btn-outline"
              onClick={handleClearAll}
              style={{ fontSize: '12px', padding: '6px 12px', color: '#ef4444' }}
              title="Faliújság kiürítése"
            >
              Összes törlése
            </button>
          )}
        </div>
      </div>

      {/* Teacher Note Drawer */}
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
            <span style={{ fontSize: '12px', fontWeight: '700' }}>Tanári instrukció kitűzése a faliújságra:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {Object.keys(COLOR_MAP).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTeacherColor(key)}
                  style={{
                    width: '22px',
                    height: '22px',
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
              placeholder="Pl. Írjátok le 1-1 mondatban a mai téma legfontosabb tanulságát!"
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

      {/* Main Board Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
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
              padding: '24px 32px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
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

            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '20px' }}>📱</span>
              <span>Csatlakozás a Faliújsághoz</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Szkenneld be telefonoddal a tábla közepén lévő QR-kódot!
            </div>

            {/* Large QR Code */}
            <div
              style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              {qrMatrix ? (
                <svg
                  viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                  style={{ width: '200px', height: '200px', display: 'block' }}
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
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  QR generálás...
                </div>
              )}
            </div>

            {/* URL and Copy */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    background: 'var(--hover-bg, rgba(0,0,0,0.05))',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    maxWidth: '260px',
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
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {copiedLink ? '✓ Másolva' : '🔗 Link Másolása'}
                </button>
              </div>

              {networkIp && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>● Wi-Fi Hálózat: {networkIp}</span>
                  <button
                    type="button"
                    onClick={() => setUseNetworkIp(!useNetworkIp)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {useNetworkIp ? '(váltás localhost-ra)' : '(váltás Wi-Fi IP-re)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sticky Notes Wall */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gridAutoRows: 'max-content',
            gap: '18px',
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
                height: '280px',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}
            >
              {!showQrPanel && (
                <button
                  type="button"
                  onClick={() => setShowQrPanel(true)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    background: '#e11d48',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px'
                  }}
                >
                  <span>📱 QR Kód Megnyitása a Tábla Közepén</span>
                </button>
              )}
              <div style={{ fontSize: '42px', marginBottom: '10px' }}>📌</div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>
                A faliújság még üres
              </div>
              <div style={{ fontSize: '13px', marginTop: '6px', maxWidth: '360px', lineHeight: 1.5 }}>
                Kérd meg a diákokat, hogy olvassák be a QR-kódot a telefonjukkal, és küldjék be a válaszaikat vagy kérdéseiket!
              </div>
            </div>
          ) : (
            notes.map((note, index) => {
              const colorConfig = COLOR_MAP[note.color] || COLOR_MAP.yellow;
              const rotation = (index % 5 - 2) * 1.2;
              return (
                <div
                  key={note.id}
                  style={{
                    backgroundColor: colorConfig.bg,
                    color: colorConfig.text,
                    borderRadius: '6px',
                    padding: '16px',
                    boxShadow: `0 8px 20px ${colorConfig.shadow}, 0 2px 4px rgba(0,0,0,0.06)`,
                    borderTop: `5px solid ${colorConfig.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '150px',
                    transform: `rotate(${rotation}deg)`,
                    transition: 'all 0.15s ease',
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px' }}>
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  <div style={{ fontSize: '13.5px', lineHeight: '1.45', fontWeight: '500', wordBreak: 'break-word', flex: 1 }}>
                    {note.text}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: `1px solid rgba(0,0,0,0.08)` }}>
                    <span style={{ fontSize: '11px', opacity: 0.65 }}>
                      {note.timestamp}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLike(note.id)}
                      style={{
                        background: 'rgba(255,255,255,0.45)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
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
  );
}
