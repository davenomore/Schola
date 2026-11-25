import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { generateQRCode } from '../../utils/qrCode';
import { pollService } from '../../services/pollService';
import { API_BASE } from '../../config';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLOR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const PRESETS = [
  {
    title: 'Tananyag megértése',
    type: 'choice',
    question: 'Mennyire érthető számodra a mai tananyag?',
    options: [
      { id: 'opt-1', text: 'Teljesen világos és érthető', votes: 0, color: '#10b981' },
      { id: 'opt-2', text: 'Nagyjából értem, de még gyakorolni kell', votes: 0, color: '#3b82f6' },
      { id: 'opt-3', text: 'Van pár pont, amit át kell ismételnünk', votes: 0, color: '#f59e0b' },
      { id: 'opt-4', text: 'Nem értem, segítségre van szükségem', votes: 0, color: '#ef4444' }
    ]
  },
  {
    title: '3 perces Kilépőkártya (Exit Ticket)',
    type: 'exit-ticket',
    question: 'Mit tanultál ma? Mi maradt még homályos? (3 perces reflexió)',
    options: []
  },
  {
    title: 'Interaktív Kvízverseny',
    type: 'quiz',
    question: 'Melyik állítás helyes az alábbiak közül?',
    options: [
      { id: 'opt-1', text: 'Ez a helyes válasz', votes: 0, color: '#10b981', isCorrect: true },
      { id: 'opt-2', text: 'Első hibás opció', votes: 0, color: '#ef4444', isCorrect: false },
      { id: 'opt-3', text: 'Második hibás opció', votes: 0, color: '#3b82f6', isCorrect: false },
      { id: 'opt-4', text: 'Harmadik hibás opció', votes: 0, color: '#f59e0b', isCorrect: false }
    ],
    correctOptionId: 'opt-1'
  },
  {
    title: 'Szófelhő ötletbörze',
    type: 'wordcloud',
    question: 'Milyen szavak jutnak eszedbe a mai témakörről?',
    options: []
  },
  {
    title: 'Kilépő értékelés (1-5)',
    type: 'rating',
    question: 'Értékeld a mai órai munkádat és felkészültségedet!',
    options: []
  },
  {
    title: 'Igen / Nem gyors szavazás',
    type: 'choice',
    question: 'Egyetértesz az elhangzott állítással?',
    options: [
      { id: 'opt-1', text: 'Igen / Igaz', votes: 0, color: '#10b981' },
      { id: 'opt-2', text: 'Nem / Hamis', votes: 0, color: '#ef4444' }
    ]
  }
];

export default function MentimeterWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 90, y: widget.y || 50 });
  const [size, setSize] = useState({ width: 680, height: 490 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 90, y: widget.y || 50 }, size: { width: 680, height: 490 } });

  const [poll, setPoll] = useState(null);
  const [showQr, setShowQr] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New poll modal state
  const [newQuestion, setNewQuestion] = useState('');
  const [newType, setNewType] = useState('choice');
  const [newOptions, setNewOptions] = useState([
    { text: 'A opció', color: COLOR_PALETTE[0] },
    { text: 'B opció', color: COLOR_PALETTE[1] }
  ]);

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
    return `${protocol}//${host}${window.location.pathname}?join=poll`;
  }, [networkIp, useNetworkIp]);

  const qrMatrix = useMemo(() => {
    try {
      return generateQRCode(joinUrl, 'M');
    } catch {
      return null;
    }
  }, [joinUrl]);

  const loadPoll = async () => {
    try {
      const data = await pollService.getPoll();
      if (data) setPoll(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPoll();
    const interval = setInterval(loadPoll, 2000);
    const handleLocal = () => loadPoll();
    window.addEventListener('schola_poll_updated', handleLocal);
    return () => {
      clearInterval(interval);
      window.removeEventListener('schola_poll_updated', handleLocal);
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

  const handleToggleOpen = async () => {
    const updated = await pollService.togglePoll();
    setPoll(updated);
  };

  const handleResetVotes = async () => {
    if (window.confirm('Biztosan nullázod a leadott szavazatokat?')) {
      const updated = await pollService.resetVotes();
      setPoll(updated);
    }
  };

  const handleToggleResults = async () => {
    const updated = await pollService.toggleResults();
    setPoll(updated);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const formattedOptions = newType === 'choice'
      ? newOptions.map((opt, i) => ({
          id: `opt-${Date.now()}-${i}`,
          text: opt.text.trim(),
          votes: 0,
          color: opt.color || COLOR_PALETTE[i % COLOR_PALETTE.length]
        }))
      : [];

    const created = await pollService.createPoll({
      question: newQuestion.trim(),
      type: newType,
      options: formattedOptions
    });
    setPoll(created);
    setShowCreateModal(false);
    setNewQuestion('');
  };

  const handleApplyPreset = (preset) => {
    setNewQuestion(preset.question);
    setNewType(preset.type);
    setNewOptions(preset.options.map(o => ({ text: o.text, color: o.color })));
  };

  // Compute total votes
  const totalVotes = useMemo(() => {
    if (!poll) return 0;
    if (poll.type === 'choice') {
      return (poll.options || []).reduce((acc, curr) => acc + (curr.votes || 0), 0);
    }
    if (poll.type === 'wordcloud') {
      return (poll.words || []).reduce((acc, curr) => acc + (curr.count || 0), 0);
    }
    if (poll.type === 'rating') {
      return poll.ratings?.count || 0;
    }
    return 0;
  }, [poll]);

  // QR dimensions
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
      minWidth={480}
      minHeight={360}
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
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Top Drag Handle */}
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
              <span style={{ color: '#3b82f6', fontSize: '14px' }}>📊</span>
              <span>MENTIMETER - ÉLŐ SZAVAZÁS</span>
              <span style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '1px 7px', borderRadius: '4px', fontSize: '10px' }}>
                {totalVotes} szavazat
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Toggle QR code */}
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowQr(!showQr)}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: showQr ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                borderColor: showQr ? '#3b82f6' : 'var(--panel-border)'
              }}
              title="QR kód megjelenítése a tábla közepén"
            >
              📱 QR Kód
            </button>

            {/* Toggle Voting Open/Closed */}
            <button
              type="button"
              className="btn-outline"
              onClick={handleToggleOpen}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                color: poll?.isOpen ? '#10b981' : '#ef4444'
              }}
              title={poll?.isOpen ? 'Szavazás lezárása' : 'Szavazás megnyitása'}
            >
              {poll?.isOpen ? '🟢 Nyitva' : '🔴 Lezárva'}
            </button>

            {/* New Question */}
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowCreateModal(true)}
              style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}
              title="Új kérdés indítása"
            >
              + Új kérdés
            </button>

            {/* Reset */}
            <button
              type="button"
              className="btn-icon"
              onClick={handleResetVotes}
              style={{ padding: '4px' }}
              title="Szavazatok törlése"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

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

        {/* Question Banner */}
        <div
          style={{
            padding: '12px 18px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: '#3b82f6', marginBottom: '2px' }}>
              {poll?.type === 'choice' && 'Többválasztós szavazás'}
              {poll?.type === 'wordcloud' && 'Élő Szófelhő'}
              {poll?.type === 'rating' && 'Értékelő skála (1-5)'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {poll?.question}
            </div>
          </div>

          <button
            type="button"
            className="btn-outline"
            onClick={handleToggleResults}
            style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}
          >
            {poll?.showResults ? '👁️ Eredmények elrejtése' : '👁️ Eredmények mutatása'}
          </button>
        </div>

        {/* Main Workspace with Center QR and Live Visualizations */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Centered QR Code Overlay when active */}
          {showQr && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 35,
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
              <button
                type="button"
                onClick={() => setShowQr(false)}
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
                <span style={{ fontSize: '18px' }}>📊</span>
                <span>Szavazz a telefonoddal!</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Szkenneld be a tábla közepén lévő QR-kódot a szavazáshoz!
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

          {/* Results Display Area */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {!poll?.showResults ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔒</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Az eredmények rejtve vannak
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  A szavazatok gyűlnek a háttérben. Kattints a fejlécben lévő "Eredmények mutatása" gombra a felfedéshez!
                </div>
              </div>
            ) : (
              <>
                {/* 1. CHOICE & QUIZ VISUALIZATION */}
                {(poll?.type === 'choice' || poll?.type === 'quiz') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '640px', width: '100%', margin: '0 auto' }}>
                    {(poll.options || []).map((opt, idx) => {
                      const count = opt.votes || 0;
                      const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      const isCorrect = poll.type === 'quiz' && (opt.id === poll.correctOptionId || opt.isCorrect);

                      return (
                        <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '600' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  backgroundColor: isCorrect ? '#10b981' : (opt.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]),
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '800'
                                }}
                              >
                                {LETTERS[idx] || idx + 1}
                              </span>
                              <span>{opt.text}</span>
                              {isCorrect && (
                                <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: '8px', border: '1px solid #10b981' }}>
                                  ✓ Helyes
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                              <span>{count} szavazat</span>
                              <span style={{ fontWeight: '800', color: isCorrect ? '#10b981' : 'var(--text-primary)', minWidth: '40px', textAlign: 'right' }}>
                                {percent}%
                              </span>
                            </div>
                          </div>

                          {/* Progress bar container */}
                          <div
                            style={{
                              height: '24px',
                              borderRadius: '8px',
                              background: 'var(--hover-bg, rgba(0,0,0,0.06))',
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${percent}%`,
                                backgroundColor: isCorrect ? '#10b981' : (opt.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]),
                                borderRadius: '8px',
                                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: `0 0 14px ${isCorrect ? '#10b981' : opt.color}44`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Quiz Leaderboard */}
                    {poll.type === 'quiz' && (poll.quizScores || []).length > 0 && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                        border: '1px solid var(--panel-border)',
                        borderRadius: '10px'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🏆 Élő Ranglista
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {[...poll.quizScores].sort((a,b) => (b.points||0) - (a.points||0)).slice(0, 5).map((score, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 8px', background: 'var(--panel-bg)', borderRadius: '6px' }}>
                              <span style={{ fontWeight: 600 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`} {score.studentName}</span>
                              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{score.points} pont</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. EXIT TICKET VISUALIZATION */}
                {poll?.type === 'exit-ticket' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px', background: 'var(--hover-bg, rgba(0,0,0,0.02))', borderRadius: '10px', border: '1px solid var(--panel-border)' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{(poll.exitTickets || []).length}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Leadott reflexió</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>
                          {poll.exitTickets?.length > 0 ? (poll.exitTickets.reduce((a,c) => a + (c.q3||0), 0) / poll.exitTickets.length).toFixed(1) : '5.0'} / 5
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Átlagos órai hangulat</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '12px', background: 'var(--hover-bg, rgba(0,0,0,0.02))', borderRadius: '10px', border: '1px solid var(--panel-border)', maxHeight: '240px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>💡 Megértett gondolatok</div>
                        {(poll.exitTickets || []).map((t, i) => (
                          <div key={i} style={{ fontSize: '11px', padding: '6px 8px', background: 'var(--panel-bg)', borderRadius: '6px', marginBottom: '6px', border: '1px solid var(--panel-border)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.studentName}</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{t.q1}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ padding: '12px', background: 'var(--hover-bg, rgba(0,0,0,0.02))', borderRadius: '10px', border: '1px solid var(--panel-border)', maxHeight: '240px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>❓ Homályos pontok</div>
                        {(poll.exitTickets || []).map((t, i) => (
                          <div key={i} style={{ fontSize: '11px', padding: '6px 8px', background: 'var(--panel-bg)', borderRadius: '6px', marginBottom: '6px', border: '1px solid var(--panel-border)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.studentName}</div>
                            <div style={{ color: t.q2 ? 'var(--text-secondary)' : '#a1a1aa' }}>{t.q2 || 'Minden tiszta volt.'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. WORD CLOUD VISUALIZATION */}
                {poll?.type === 'wordcloud' && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '16px 24px',
                      padding: '24px',
                      minHeight: '220px'
                    }}
                  >
                    {(poll.words || []).length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Még nem érkezett be szó a felhőbe. Szkenneld be a QR-kódot és írj be egy szót!
                      </div>
                    ) : (
                      poll.words.map((w, i) => {
                        const maxCount = Math.max(...poll.words.map(x => x.count), 1);
                        const weight = w.count / maxCount;
                        const fontSize = Math.max(14, Math.min(42, Math.round(14 + weight * 28)));
                        const color = COLOR_PALETTE[i % COLOR_PALETTE.length];

                        return (
                          <span
                            key={w.text + i}
                            style={{
                              fontSize: `${fontSize}px`,
                              fontWeight: weight > 0.5 ? '800' : '600',
                              color: color,
                              textShadow: weight > 0.6 ? `0 0 20px ${color}55` : 'none',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              background: `${color}11`,
                              border: `1px solid ${color}33`,
                              transition: 'all 0.3s ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {w.text}
                            <span style={{ fontSize: '10px', opacity: 0.6, verticalAlign: 'super' }}>
                              {w.count}
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 3. RATING SCALE VISUALIZATION */}
                {poll?.type === 'rating' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', fontWeight: '900', color: '#fbbf24', lineHeight: 1 }}>
                        {poll.ratings?.count > 0 ? (poll.ratings.sum / poll.ratings.count).toFixed(1) : '0.0'}
                        <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}> / 5.0</span>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Átlagos értékelés ({poll.ratings?.count || 0} szavazat alapján)
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div
                          key={s}
                          style={{
                            fontSize: '28px',
                            color: poll.ratings?.count > 0 && Math.round(poll.ratings.sum / poll.ratings.count) >= s ? '#fbbf24' : 'rgba(255,255,255,0.2)'
                          }}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal: Create / Select New Poll */}
        {showCreateModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              className="glass-panel"
              style={{
                background: 'var(--panel-bg, #ffffff)',
                border: '1px solid var(--panel-border)',
                borderRadius: '14px',
                padding: '20px',
                maxWidth: '480px',
                width: '100%',
                maxHeight: '90%',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Új Szavazás Indítása</h3>
                <button onClick={() => setShowCreateModal(false)} className="btn-icon">✕</button>
              </div>

              {/* Presets */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Gyors Sablonok:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="btn-outline"
                      style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Kérdés szövege:
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Írd be a kérdést..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Típus:
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="choice">Többválasztós (Choice / Bar Chart)</option>
                    <option value="wordcloud">Élő Szófelhő (Word Cloud)</option>
                    <option value="rating">Értékelő skála (1-5 Csillag)</option>
                  </select>
                </div>

                {newType === 'choice' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Válaszlehetőségek:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {newOptions.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', width: '18px' }}>{LETTERS[i]}</span>
                          <input
                            type="text"
                            required
                            value={opt.text}
                            onChange={(e) => {
                              const updated = [...newOptions];
                              updated[i].text = e.target.value;
                              setNewOptions(updated);
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--panel-border)',
                              background: 'var(--panel-bg)',
                              color: 'var(--text-primary)',
                              fontSize: '12px'
                            }}
                          />
                          {newOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))}
                              className="btn-icon"
                              style={{ color: '#ef4444' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {newOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setNewOptions([...newOptions, { text: `Opció ${LETTERS[newOptions.length] || ''}`, color: COLOR_PALETTE[newOptions.length % COLOR_PALETTE.length] }])}
                        style={{ marginTop: '8px', fontSize: '11px', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        + További opció hozzáadása
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline">
                    Mégse
                  </button>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                    Szavazás Indítása 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Rnd>
  );
}
