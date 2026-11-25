import React, { useState, useEffect, useMemo } from 'react';
import { generateQRCode } from '../../utils/qrCode';
import { pollService } from '../../services/pollService';
import { geminiService } from '../../services/geminiService';
import ApiKeyModal from '../ai/ApiKeyModal';
import MathText from '../ui/MathText';
import { API_BASE } from '../../config';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLOR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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

export default function MentimeterTool({ addNotification }) {
  const [poll, setPoll] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => geminiService.hasApiKey());
  const [copiedLink, setCopiedLink] = useState(false);

  // New poll modal state
  const [newQuestion, setNewQuestion] = useState('');
  const [newType, setNewType] = useState('choice');
  const [newCorrectOptionId, setNewCorrectOptionId] = useState('opt-1');
  const [newOptions, setNewOptions] = useState([
    { text: 'A opció', color: COLOR_PALETTE[0] },
    { text: 'B opció', color: COLOR_PALETTE[1] }
  ]);

  // AI Quiz Generator state
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

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
      console.error('Failed to load poll:', err);
    }
  };

  useEffect(() => {
    loadPoll();
    const interval = setInterval(loadPoll, 2500);

    const onUpdate = (e) => {
      if (e.detail) setPoll(e.detail);
    };
    window.addEventListener('schola_poll_updated', onUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('schola_poll_updated', onUpdate);
    };
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(joinUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleToggleActive = async () => {
    if (!poll) return;
    try {
      const updated = await pollService.toggleActive(!poll.isOpen);
      setPoll(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleResults = async () => {
    if (!poll) return;
    try {
      const updated = await pollService.toggleShowResults(!poll.showResults);
      setPoll(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetVotes = async () => {
    if (!window.confirm('Biztosan törölni szeretnéd a leadott szavazatokat és eredményeket?')) return;
    try {
      const updated = await pollService.resetVotes();
      setPoll(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPreset = (preset) => {
    setNewQuestion(preset.question);
    setNewType(preset.type);
    if (preset.options.length > 0) {
      setNewOptions(preset.options.map(o => ({ text: o.text, color: o.color, isCorrect: o.isCorrect })));
      if (preset.correctOptionId) {
        setNewCorrectOptionId(preset.correctOptionId);
      }
    } else {
      setNewOptions([]);
    }
  };

  const handleAddOption = () => {
    if (newOptions.length >= 8) return;
    setNewOptions([
      ...newOptions,
      { text: `${LETTERS[newOptions.length]} opció`, color: COLOR_PALETTE[newOptions.length % COLOR_PALETTE.length] }
    ]);
  };

  const handleRemoveOption = (index) => {
    if (newOptions.length <= 2) return;
    setNewOptions(newOptions.filter((_, i) => i !== index));
  };

  const handleOptionTextChange = (index, text) => {
    const updated = [...newOptions];
    updated[index].text = text;
    setNewOptions(updated);
  };

  // AI Quiz Generator invocation
  const handleGenerateAiQuiz = async () => {
    if (!aiTopicInput.trim()) {
      if (addNotification) addNotification('Kérlek add meg a témakört az AI kvíz generáláshoz!', 'error');
      else alert('Kérlek add meg a témakört az AI kvíz generáláshoz!');
      return;
    }

    if (!geminiService.hasApiKey()) {
      setShowApiKeyModal(true);
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const quiz = await pollService.generateQuiz({ topic: aiTopicInput.trim() });
      if (quiz) {
        setNewQuestion(quiz.question);
        setNewType('quiz');
        setNewCorrectOptionId(quiz.correctOptionId || 'opt-1');
        setNewOptions(quiz.options.map(o => ({
          text: o.text,
          color: o.color,
          isCorrect: o.id === quiz.correctOptionId || o.isCorrect
        })));
        if (addNotification) addNotification('AI kvízkérdés sikeresen előállítva!', 'success');
      }
    } catch (err) {
      if (addNotification) addNotification('Hiba történt az AI kvíz generálása közben: ' + err.message, 'error');
      else alert('Hiba történt az AI kvíz generálása közben: ' + err.message);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const payload = {
      question: newQuestion.trim(),
      type: newType,
      correctOptionId: newType === 'quiz' ? newCorrectOptionId : null,
      options: (newType === 'choice' || newType === 'quiz')
        ? newOptions.filter(o => o.text.trim()).map((o, idx) => ({
            id: `opt-${idx + 1}`,
            text: o.text.trim(),
            votes: 0,
            color: o.color || COLOR_PALETTE[idx % COLOR_PALETTE.length],
            isCorrect: (newType === 'quiz' && `opt-${idx + 1}` === newCorrectOptionId)
          }))
        : []
    };

    try {
      const res = await pollService.createPoll(payload);
      setPoll(res);
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Stats calculation
  const totalVotes = useMemo(() => {
    if (!poll) return 0;
    if (poll.type === 'choice' || poll.type === 'quiz') {
      return (poll.options || []).reduce((sum, opt) => sum + (opt.votes || 0), 0);
    }
    if (poll.type === 'wordcloud') {
      return (poll.words || []).reduce((sum, w) => sum + (w.count || 0), 0);
    }
    if (poll.type === 'rating') {
      return (poll.ratings?.count || 0);
    }
    if (poll.type === 'exit-ticket') {
      return (poll.exitTickets || []).length;
    }
    return 0;
  }, [poll]);

  const ratingAvg = useMemo(() => {
    if (!poll) return 0;
    if (poll.type === 'rating' && poll.ratings?.count > 0) {
      return (poll.ratings.sum / poll.ratings.count).toFixed(1);
    }
    if (poll.type === 'exit-ticket' && poll.exitTickets?.length > 0) {
      const sum = poll.exitTickets.reduce((acc, t) => acc + (t.q3 || 0), 0);
      return (sum / poll.exitTickets.length).toFixed(1);
    }
    return 0;
  }, [poll]);

  const maxVotes = useMemo(() => {
    if (!poll || !poll.options) return 1;
    return Math.max(...poll.options.map(o => o.votes || 0), 1);
  }, [poll]);

  const wordCloudWords = useMemo(() => {
    if (!poll || poll.type !== 'wordcloud' || !poll.words) return [];
    const maxCount = Math.max(...poll.words.map(w => w.count || 1), 1);
    return poll.words.map((w, idx) => {
      const scale = 0.85 + (w.count / maxCount) * 1.35;
      return {
        ...w,
        fontSize: `${Math.round(scale * 16)}px`,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
      };
    });
  }, [poll]);

  // Quiz Leaderboard
  const sortedQuizScores = useMemo(() => {
    if (!poll || poll.type !== 'quiz' || !poll.quizScores) return [];
    return [...poll.quizScores].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [poll]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      background: 'var(--panel-bg, #ffffff)',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Top Header Bar */}
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid var(--panel-border, #e4e4e7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--hover-bg, rgba(0,0,0,0.02))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: poll?.type === 'quiz' ? 'linear-gradient(135deg, #ef4444, #f59e0b)' : poll?.type === 'exit-ticket' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            {poll?.type === 'quiz' ? '⚡' : poll?.type === 'exit-ticket' ? '🎫' : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                <MathText text={poll?.question || 'Élő Szavazás & Kvíz'} />
              </h2>
              {poll?.isOpen ? (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                  Nyitva
                </span>
              ) : (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  Lezárva
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {poll?.type === 'choice' && 'Feleletválasztós kérdés'}
              {poll?.type === 'quiz' && 'Élő Kvízverseny pontozással'}
              {poll?.type === 'exit-ticket' && '3 perces óra végi kilépőkártya'}
              {poll?.type === 'wordcloud' && 'Interaktív szófelhő'}
              {poll?.type === 'rating' && '1-5 csillagos értékelés'}
              {' • '}
              <strong style={{ color: 'var(--text-primary)' }}>{totalVotes}</strong> válasz érkezett
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowQrModal(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--panel-border)',
              background: 'var(--panel-bg)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="QR-kód kivetítése"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            QR-kód diákoknak
          </button>

          <button
            onClick={handleToggleResults}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--panel-border)',
              background: 'var(--panel-bg)',
              color: poll?.showResults ? 'var(--text-primary)' : '#f59e0b',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {poll?.showResults ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                Eredmények láthatók
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                Eredmények rejtve
              </>
            )}
          </button>

          <button
            onClick={handleToggleActive}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--panel-border)',
              background: poll?.isOpen ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              color: poll?.isOpen ? '#ef4444' : '#10b981',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {poll?.isOpen ? 'Lezárás' : 'Megnyitás'}
          </button>

          <button
            onClick={handleResetVotes}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--panel-border)',
              background: 'var(--panel-bg)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Eredmények nullázása"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
          </button>

          <button
            onClick={() => {
              setNewQuestion(poll?.question || '');
              setNewType(poll?.type || 'choice');
              if (poll?.options?.length > 0) {
                setNewOptions(poll.options.map(o => ({ text: o.text, color: o.color, isCorrect: o.isCorrect })));
                setNewCorrectOptionId(poll.correctOptionId || 'opt-1');
              }
              setShowCreateModal(true);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#3b82f6',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Új szavazás / Kvíz
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: (!poll?.showResults || totalVotes === 0) ? 'center' : 'flex-start'
      }}>
        {!poll ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            Szavazás betöltése...
          </div>
        ) : !poll.showResults ? (
          /* Results Hidden Screen */
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            maxWidth: '520px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderRadius: '16px',
            border: '2px dashed var(--panel-border)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Az eredmények rejtve vannak
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              A diákok folyamatosan adják le a válaszokat anélkül, hogy látnák egymás eredményeit.
              Eddig <strong>{totalVotes}</strong> válasz érkezett.
            </p>
            <button
              onClick={handleToggleResults}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              Eredmények megmutatása a táblán
            </button>
          </div>
        ) : totalVotes === 0 ? (
          /* No votes yet */
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            maxWidth: '520px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderRadius: '16px',
            border: '2px dashed var(--panel-border)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {poll.type === 'quiz' ? '⚡' : poll.type === 'exit-ticket' ? '🎫' : '📊'}
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Várakozás a diákok válaszaira...
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Nyisd meg a QR-kódot a diákoknak a beolvasáshoz vagy másold ki a közvetlen hivatkozást.
            </p>
            <button
              onClick={() => setShowQrModal(true)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              QR-Kód kivetítése most
            </button>
          </div>
        ) : (
          /* Active Results Display */
          <div style={{ width: '100%', maxWidth: '850px' }}>
            {/* Multiple Choice OR Quiz Mode */}
            {(poll.type === 'choice' || poll.type === 'quiz') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(poll.options || []).map((opt, idx) => {
                  const votes = opt.votes || 0;
                  const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  const isTop = votes === maxVotes && votes > 0;
                  const isCorrectAnswer = (poll.type === 'quiz') && (opt.id === poll.correctOptionId || opt.isCorrect);

                  return (
                    <div
                      key={opt.id || idx}
                      style={{
                        background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                        border: isCorrectAnswer ? '2px solid #10b981' : isTop ? `2px solid ${opt.color || '#3b82f6'}` : '1px solid var(--panel-border)',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Bar Fill Background */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${percent}%`,
                          background: isCorrectAnswer ? '#10b981' : (opt.color || '#3b82f6'),
                          opacity: 0.15,
                          borderRadius: '8px',
                          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            background: isCorrectAnswer ? '#10b981' : (opt.color || '#3b82f6'),
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {LETTERS[idx] || (idx + 1)}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            <MathText text={opt.text} />
                          </span>
                          {isCorrectAnswer && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              border: '1px solid #10b981'
                            }}>
                              ✓ Helyes válasz
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {votes} szavazat
                          </span>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: isCorrectAnswer ? '#10b981' : (opt.color || '#3b82f6'),
                            minWidth: '46px',
                            textAlign: 'right'
                          }}>
                            {percent}%
                          </span>
                        </div>
                      </div>

                      {/* Small line bar */}
                      <div style={{
                        height: '6px',
                        background: 'rgba(0,0,0,0.06)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        zIndex: 1
                      }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: isCorrectAnswer ? '#10b981' : (opt.color || '#3b82f6'),
                            borderRadius: '3px',
                            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Quiz Leaderboard Display */}
                {poll.type === 'quiz' && sortedQuizScores.length > 0 && (
                  <div style={{
                    marginTop: '24px',
                    background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '16px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🏆 Élő Kvíz Ranglista (Leaderboard)
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {sortedQuizScores.length} játékos
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {sortedQuizScores.map((score, idx) => {
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'var(--panel-bg)',
                              borderRadius: '8px',
                              border: idx === 0 ? '1.5px solid #f59e0b' : '1px solid var(--panel-border)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '16px', fontWeight: 800, width: '28px' }}>{medal}</span>
                              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                                {score.studentName}
                              </span>
                              {score.isCorrect ? (
                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>✓ Helyes</span>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#ef4444' }}>✕ Téves</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {(score.responseTimeMs / 1000).toFixed(1)} mp
                              </span>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b' }}>
                                {score.points} pont
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exit Ticket Dashboard View */}
            {poll.type === 'exit-ticket' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Stats Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  padding: '18px 24px',
                  background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '16px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>
                      {(poll.exitTickets || []).length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Leadott Kilépőkártya</div>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>
                      {ratingAvg} / 5
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Átlagos órai hangulat</div>
                  </div>
                </div>

                {/* 2-Column Feedback Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {/* Column 1: Megértett gondolatok */}
                  <div style={{
                    background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      💡 Legfontosabb megértett gondolatok
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                      {(poll.exitTickets || []).map((t, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'var(--panel-bg)',
                            border: '1px solid var(--panel-border)',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{t.studentName}</span>
                            <span style={{ color: '#f59e0b' }}>{'★'.repeat(t.q3 || 5)}</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {t.q1 || 'Nem adott meg választ.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Homályos pontok */}
                  <div style={{
                    background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ❓ Még homályos pontok / kérdések
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                      {(poll.exitTickets || []).map((t, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'var(--panel-bg)',
                            border: '1px solid var(--panel-border)',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {t.studentName}
                          </div>
                          <div style={{ color: t.q2 ? 'var(--text-secondary)' : '#a1a1aa', fontStyle: t.q2 ? 'normal' : 'italic', lineHeight: 1.4 }}>
                            {t.q2 || 'Minden tiszta volt, nincs kérdés.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Word Cloud */}
            {poll.type === 'wordcloud' && (
              <div style={{
                background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                borderRadius: '16px',
                border: '1px solid var(--panel-border)',
                padding: '32px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                minHeight: '260px'
              }}>
                {wordCloudWords.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: item.fontSize,
                      color: item.color,
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: 'var(--panel-bg)',
                      border: `1px solid ${item.color}30`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {item.text}
                    {item.count > 1 && (
                      <span style={{
                        fontSize: '10px',
                        background: item.color,
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '1px 6px',
                        fontWeight: 700
                      }}>
                        {item.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Rating Display */}
            {poll.type === 'rating' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                  border: '1px solid var(--panel-border)',
                  padding: '24px 36px',
                  borderRadius: '16px',
                  width: '100%',
                  justifyContent: 'center'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                      {ratingAvg}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Átlagos értékelés (5-ből)
                    </div>
                  </div>
                  <div style={{ width: '1px', height: '60px', background: 'var(--panel-border)' }} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{
                          fontSize: '32px',
                          color: star <= Math.round(Number(ratingAvg)) ? '#f59e0b' : 'var(--panel-border)'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Centered QR Code Popover Modal */}
      {showQrModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--panel-bg, #ffffff)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid var(--panel-border)',
            padding: '28px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>

            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📱</div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Csatlakozás a feladathoz
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Szkenneld be telefonoddal a QR-kódot a szavazáshoz / kvízhez!
            </p>

            <div style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              display: 'inline-block',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              marginBottom: '16px'
            }}>
              {qrMatrix ? (
                <svg width="220" height="220" viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                  {qrMatrix.map((row, r) =>
                    row.map((cell, c) => (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width="1"
                        height="1"
                        fill={cell ? '#000000' : '#ffffff'}
                      />
                    ))
                  )}
                </svg>
              ) : (
                <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  QR generálása...
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                readOnly
                value={joinUrl}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--hover-bg, rgba(0,0,0,0.03))',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: copiedLink ? '#10b981' : '#3b82f6',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {copiedLink ? 'Másolva!' : 'Másolás'}
              </button>
            </div>

            {networkIp && (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useNetworkIp}
                  onChange={(e) => setUseNetworkIp(e.target.checked)}
                />
                Helyi Wi-Fi IP ({networkIp}) használata telefonos szkenneléshez
              </label>
            )}
          </div>
        </div>
      )}

      {/* Create New Poll / Quiz Modal */}
      {showCreateModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--panel-bg, #ffffff)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid var(--panel-border)',
            padding: '24px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Új Szavazás vagy Kvíz Létrehozása
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* AI Quiz Generator Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08))',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>✨ Kvíz generálása AI-val témakörből:</span>
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(true)}
                  style={{
                    background: hasApiKey ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: hasApiKey ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
                    color: hasApiKey ? '#3b82f6' : '#ef4444',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {hasApiKey ? '🔑 API Kulcs ✓' : '⚠️ API Kulcs megadása'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Pl. Másodfokú egyenlet diszkriminánsa, Newton II. törvénye..."
                  value={aiTopicInput}
                  onChange={(e) => setAiTopicInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
                <button
                  type="button"
                  disabled={isGeneratingQuiz}
                  onClick={handleGenerateAiQuiz}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: isGeneratingQuiz ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isGeneratingQuiz ? 'Generálás...' : 'Kvíz készítése'}
                </button>
              </div>
            </div>

            {/* Presets */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Gyors sablonok:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Kérdés vagy téma:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Mennyire érthető számodra a mai tananyag?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Típus:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setNewType('choice')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '6px',
                      border: newType === 'choice' ? '2px solid #3b82f6' : '1px solid var(--panel-border)',
                      background: newType === 'choice' ? 'rgba(59, 130, 246, 0.08)' : 'var(--panel-bg)',
                      color: newType === 'choice' ? '#3b82f6' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    📊 Választós
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('quiz')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '6px',
                      border: newType === 'quiz' ? '2px solid #ef4444' : '1px solid var(--panel-border)',
                      background: newType === 'quiz' ? 'rgba(239, 68, 68, 0.08)' : 'var(--panel-bg)',
                      color: newType === 'quiz' ? '#ef4444' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ Kvíz (Pontozásos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('exit-ticket')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '6px',
                      border: newType === 'exit-ticket' ? '2px solid #10b981' : '1px solid var(--panel-border)',
                      background: newType === 'exit-ticket' ? 'rgba(16, 185, 129, 0.08)' : 'var(--panel-bg)',
                      color: newType === 'exit-ticket' ? '#10b981' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    🎫 Kilépőkártya
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('wordcloud')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '6px',
                      border: newType === 'wordcloud' ? '2px solid #3b82f6' : '1px solid var(--panel-border)',
                      background: newType === 'wordcloud' ? 'rgba(59, 130, 246, 0.08)' : 'var(--panel-bg)',
                      color: newType === 'wordcloud' ? '#3b82f6' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    ☁️ Szófelhő
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('rating')}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '6px',
                      border: newType === 'rating' ? '2px solid #3b82f6' : '1px solid var(--panel-border)',
                      background: newType === 'rating' ? 'rgba(59, 130, 246, 0.08)' : 'var(--panel-bg)',
                      color: newType === 'rating' ? '#3b82f6' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    ⭐ Értékelés
                  </button>
                </div>
              </div>

              {/* Options for Choice or Quiz type */}
              {(newType === 'choice' || newType === 'quiz') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Válaszlehetőségek {newType === 'quiz' && '(Jelöld meg a helyes választ!)'}:
                    </label>
                  </div>
                  {newOptions.map((opt, idx) => {
                    const optId = `opt-${idx + 1}`;
                    const isSelectedAsCorrect = (newCorrectOptionId === optId);

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          background: isSelectedAsCorrect && newType === 'quiz' ? '#10b981' : (opt.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]),
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {LETTERS[idx]}
                        </span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: isSelectedAsCorrect && newType === 'quiz' ? '2px solid #10b981' : '1px solid var(--panel-border)',
                            background: 'var(--panel-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                          }}
                        />
                        {newType === 'quiz' && (
                          <button
                            type="button"
                            onClick={() => setNewCorrectOptionId(optId)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: isSelectedAsCorrect ? '#10b981' : 'var(--hover-bg, rgba(0,0,0,0.05))',
                              color: isSelectedAsCorrect ? '#fff' : 'var(--text-secondary)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Kattints a helyes válasz kijelöléséhez"
                          >
                            {isSelectedAsCorrect ? '✓ Helyes' : 'Helyes?'}
                          </button>
                        )}
                        {newOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            style={{
                              padding: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {newOptions.length < 8 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px dashed var(--panel-border)',
                        background: 'transparent',
                        color: '#3b82f6',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '4px'
                      }}
                    >
                      + Új opció hozzáadása
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  Indítás
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={(key) => {
          setHasApiKey(Boolean(key));
        }}
        addNotification={addNotification}
        title="Google Gemini API Kulcs Beállítása"
        subtitle="Az AI Kvíz és Katedra funkciók használatához szükséges"
      />
    </div>
  );
}
