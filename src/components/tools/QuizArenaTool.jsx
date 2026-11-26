import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateQRCode } from '../../utils/qrCode';
import { quizArenaService } from '../../services/quizArenaService';
import { geminiService } from '../../services/geminiService';
import ApiKeyModal from '../ai/ApiKeyModal';
import QuizReportModal from './QuizReportModal';
import MathText from '../ui/MathText';
import { API_BASE } from '../../config';

const ARENA_COLORS = ['#e21b3c', '#1368ce', '#ffa602', '#26890c'];
const ARENA_SHAPES = ['▲', '◆', '●', '■'];

// Segédfüggvény DOCX fájlok kliensoldali szövegkinyeréséhez böngészőben
async function extractDocxText(arrayBuffer) {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    let offset = 0;
    while (offset < bytes.length - 30) {
      if (view.getUint32(offset, true) === 0x04034b50) {
        const compression = view.getUint16(offset + 8, true);
        const compressedSize = view.getUint32(offset + 18, true);
        const fileNameLength = view.getUint16(offset + 26, true);
        const extraLength = view.getUint16(offset + 28, true);
        const fileNameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLength);
        const fileName = new TextDecoder().decode(fileNameBytes);
        const dataOffset = offset + 30 + fileNameLength + extraLength;

        if (fileName === 'word/document.xml') {
          const compressedData = bytes.subarray(dataOffset, dataOffset + compressedSize);
          let xml = '';
          if (compression === 0) {
            xml = new TextDecoder().decode(compressedData);
          } else if (compression === 8 && typeof DecompressionStream !== 'undefined') {
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter();
            writer.write(compressedData);
            writer.close();
            const decompressed = await new Response(ds.readable).arrayBuffer();
            xml = new TextDecoder().decode(decompressed);
          }
          if (xml) {
            return xml
              .replace(/<\/w:p>/gi, '\n')
              .replace(/<w:tab[^>]*\/>/gi, '\t')
              .replace(/<[^>]+>/g, '')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/[ \t]+/g, ' ')
              .trim();
          }
        }
        offset = dataOffset + (compressedSize > 0 ? compressedSize : 1);
      } else {
        offset++;
      }
    }
  } catch (err) {
    console.warn('DOCX kicsomagolás figyelmeztetés:', err);
  }
  return null;
}

export default function QuizArenaTool({ addNotification }) {
  const [quizzes, setQuizzes] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [viewMode, setViewMode] = useState('library'); // 'library' | 'live' | 'editor'

  // Editor state
  const [editingQuiz, setEditingQuiz] = useState(null);

  // AI Generator Modal & API Key Settings
  const [showAiModal, setShowAiModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => geminiService.hasApiKey());
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(3);
  const [aiSubject, setAiSubject] = useState('Matematika');
  const [aiQuestionTypes, setAiQuestionTypes] = useState(['multiple-choice', 'true-false', 'numeric']);
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Document-based generation state
  const [aiSourceMode, setAiSourceMode] = useState('topic'); // 'topic' | 'document'
  const [aiDocumentTab, setAiDocumentTab] = useState('upload'); // 'upload' | 'paste'
  const [aiDocumentFile, setAiDocumentFile] = useState(null); // { name, type, size, base64, text }
  const [aiDocumentText, setAiDocumentText] = useState('');
  const [aiFileReading, setAiFileReading] = useState(false);
  const fileInputRef = useRef(null);

  // QR & Network IP
  const [networkIp, setNetworkIp] = useState(() => localStorage.getItem('schola_network_ip') || '');
  const [useNetworkIp, setUseNetworkIp] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Question Timer
  const [timeLeft, setTimeLeft] = useState(20);

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
    const pinParam = activeSession?.pin ? `&pin=${activeSession.pin}` : '';
    return `${protocol}//${host}${window.location.pathname}?join=quiz${pinParam}`;
  }, [networkIp, useNetworkIp, activeSession?.pin]);

  const qrMatrix = useMemo(() => {
    try {
      return generateQRCode(joinUrl, 'M');
    } catch {
      return null;
    }
  }, [joinUrl]);

  // Load saved quizzes
  const loadQuizzes = async () => {
    const data = await quizArenaService.getSavedQuizzes();
    setQuizzes(data || []);
  };

  // Poll live game state
  const loadState = async () => {
    const state = await quizArenaService.getState('teacher');
    if (state && state.id) {
      setActiveSession(state);
      if (state.status !== 'lobby' && viewMode === 'library' && state.playersCount > 0) {
        // If an active game is running, switch to live view
      }
    }
  };

  useEffect(() => {
    loadQuizzes();
    loadState();
    const interval = setInterval(loadState, 1500);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (activeSession?.status !== 'question') return;
    const limit = activeSession?.timeLimit || 20;
    setTimeLeft(limit);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // auto reveal when time expires
          quizArenaService.revealAnswer().then(loadState);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession?.status, activeSession?.currentQuestionIndex]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(joinUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // 1. Start a quiz session (puts into Lobby)
  const handleLaunchQuiz = async (quiz) => {
    const session = await quizArenaService.initSession(quiz);
    if (session) {
      setActiveSession(session);
      setViewMode('live');
    }
  };

  // 2. Open editor for manual override / editing
  const handleEditQuiz = (quiz) => {
    // Clone quiz
    const cloned = JSON.parse(JSON.stringify(quiz));
    setEditingQuiz(cloned);
    setViewMode('editor');
  };

  // 3. Create new blank quiz
  const handleCreateNewQuiz = () => {
    const newQ = {
      id: 'quiz-' + Date.now(),
      title: 'Új Kvíz',
      subject: 'Általános',
      grade: '10. évfolyam',
      questions: [
        {
          id: 'q-1',
          question: '1. Kérdés szövege...',
          timeLimit: 20,
          correctOptionId: 'opt-1',
          options: [
            { id: 'opt-1', text: 'Helyes válasz', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Második opció', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Harmadik opció', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Negyedik opció', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ]
        }
      ]
    };
    setEditingQuiz(newQ);
    setViewMode('editor');
  };

  // 4. Save edited quiz
  const handleSaveEditedQuiz = async (e) => {
    e.preventDefault();
    if (!editingQuiz.title.trim()) return;
    await quizArenaService.saveQuiz(editingQuiz);
    await loadQuizzes();
    setViewMode('library');
  };

  // 5. Delete quiz
  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a kvízt a könyvtárból?')) return;
    await quizArenaService.deleteQuiz(id);
    await loadQuizzes();
  };

  // File formatting and reading helpers for Document Quiz
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('A kiválasztott fájl túl nagy! Kérlek válassz 25 MB-nál kisebb dokumentumot.');
      return;
    }

    setAiFileReading(true);
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const mimeType = file.type || (isPdf ? 'application/pdf' : 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const base64 = dataUrl.split(',')[1];
      setAiDocumentFile({
        name: file.name,
        type: mimeType,
        size: file.size,
        base64
      });
      setAiFileReading(false);
      if (!aiTopic) {
        setAiTopic(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.onerror = () => {
      alert('Nem sikerült beolvasni a dokumentumfájlt.');
      setAiFileReading(false);
    };
    reader.readAsDataURL(file);
  };

  // 6. AI Generate Quiz (Témakör vagy Dokumentum alapján)
  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (aiSourceMode === 'topic' && !aiTopic.trim()) return;
    if (aiSourceMode === 'document') {
      const hasContent = (aiDocumentTab === 'upload' && aiDocumentFile?.base64) ||
                         (aiDocumentTab === 'paste' && aiDocumentText.trim().length > 0);
      if (!hasContent) {
        alert('Kérlek tölts fel egy érvényes forrásdokumentumot (PDF, Kép, Fájl) vagy másold be a tananyag szövegét!');
        return;
      }
    }

    if (!geminiService.hasApiKey()) {
      setShowApiKeyModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const isDoc = aiSourceMode === 'document';
      // Ha fájlfeltöltés van, a dokumentumot közvetlenül adjuk át az AI-nak
      const effectiveDocFile = (isDoc && aiDocumentTab === 'upload') ? aiDocumentFile : null;
      const effectiveDocText = (isDoc && aiDocumentTab === 'paste') ? aiDocumentText.trim() : '';
      const count = Math.max(1, Math.min(30, Number(aiQuestionCount) || 5));

      const generated = await quizArenaService.generateAiQuiz({
        topic: aiTopic.trim(),
        questionCount: count,
        subject: aiSubject,
        questionTypes: aiQuestionTypes,
        sourceMode: aiSourceMode,
        documentText: effectiveDocText,
        documentFile: effectiveDocFile
      });
      if (generated) {
        setShowAiModal(false);
        // Open generated quiz in editor immediately so teacher can review & override!
        setEditingQuiz(generated);
        setViewMode('editor');
        if (addNotification) addNotification(`A(z) "${generated.title}" kvíz sikeresen elkészült!`, 'success');
      }
    } catch (err) {
      if (addNotification) addNotification('AI generálási hiba: ' + err.message, 'error');
      else alert('AI generálási hiba: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Live game controls
  const handleStartGame = async () => {
    const res = await quizArenaService.startSession();
    if (res) setActiveSession(res);
  };

  const handleRevealAnswer = async () => {
    const res = await quizArenaService.revealAnswer();
    if (res) setActiveSession(res);
  };

  const handleShowLeaderboard = async () => {
    const res = await quizArenaService.showLeaderboard();
    if (res) setActiveSession(res);
  };

  const handleNextQuestion = async () => {
    const res = await quizArenaService.nextQuestion();
    if (res) setActiveSession(res);
  };

  const handleResetGame = async () => {
    if (!window.confirm('Biztosan visszaállítod a kvízt a lobby állapotba?')) return;
    const res = await quizArenaService.resetSession();
    if (res) setActiveSession(res);
  };

  const currentQ = activeSession?.currentQuestion;
  const sortedPlayers = useMemo(() => {
    if (!activeSession?.players) return [];
    return [...activeSession.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [activeSession?.players]);

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
        borderBottom: '1px solid var(--panel-border)',
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
            background: 'linear-gradient(135deg, #e21b3c, #1368ce)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 900,
            boxShadow: '0 4px 12px rgba(226, 27, 60, 0.3)'
          }}>
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                SCHOLA KVÍZ ARÉNA (Interaktív élő vetélkedő)
              </h2>
              {activeSession && activeSession.status !== 'lobby' && activeSession.status !== 'podium' && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(226, 27, 60, 0.15)',
                  color: '#e21b3c',
                  border: '1px solid #e21b3c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e21b3c', animation: 'pulse 1.5s infinite' }} />
                  Élő meccs folyamatban (PIN: {activeSession.pin})
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Versenyjáték diákoknak valós idejű pontozással, kérdésről kérdésre haladással és dobogóval
            </div>
          </div>
        </div>

        {/* View Switcher Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setViewMode('library')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: viewMode === 'library' ? '1.5px solid #1368ce' : '1px solid var(--panel-border)',
              background: viewMode === 'library' ? 'rgba(19, 104, 206, 0.1)' : 'var(--panel-bg)',
              color: viewMode === 'library' ? '#1368ce' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📚 Kvízkönyvtár ({quizzes.length})
          </button>

          {activeSession && (
            <button
              onClick={() => setViewMode('live')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: viewMode === 'live' ? '1.5px solid #26890c' : '1px solid var(--panel-border)',
                background: viewMode === 'live' ? 'rgba(38, 137, 12, 0.1)' : 'var(--panel-bg)',
                color: viewMode === 'live' ? '#26890c' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🎮 Élő Játékmenet {activeSession.playersCount > 0 && `(${activeSession.playersCount} diák)`}
            </button>
          )}

          {activeSession && (
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1.5px solid #8b5cf6',
                background: 'rgba(139, 92, 246, 0.1)',
                color: '#8b5cf6',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>📊</span>
              <span>Riport & Export</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!geminiService.hasApiKey()) {
                setShowApiKeyModal(true);
              } else {
                setShowAiModal(true);
              }
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, #e21b3c, #ffa602)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(226, 27, 60, 0.3)'
            }}
          >
            <span>✨ AI Kvíz Generálás</span>
          </button>

          <button
            onClick={() => setShowApiKeyModal(true)}
            title={hasApiKey ? `Gemini API kulcs beállítva (${geminiService.getModel()}) - Kattints a módosításhoz` : 'Gemini API kulcs beállítása'}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: hasApiKey ? '1px solid var(--panel-border)' : '1px solid #ef4444',
              background: hasApiKey ? 'var(--panel-bg)' : 'rgba(239, 68, 68, 0.1)',
              color: hasApiKey ? 'var(--text-secondary)' : '#ef4444',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>🔑</span>
            <span>{hasApiKey ? 'API Kulcs' : 'Kulcs megadása'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          1. KVÍZKÖNYVTÁR NÉZET (LIBRARY)
         ======================================================== */}
      {viewMode === 'library' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Elmentett Kvízek Könyvtára
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Válaszd ki a kvízt a tanórai indításhoz, vagy szerkeszd át a kérdéseket indítás előtt!
              </p>
            </div>
            <button
              onClick={handleCreateNewQuiz}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--panel-border)',
                background: 'var(--panel-bg)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              + Kézi Kvíz Létrehozása
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                style={{
                  background: 'var(--panel-bg)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: 'rgba(19, 104, 206, 0.1)',
                      color: '#1368ce'
                    }}>
                      {quiz.subject || 'Tantárgy'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {quiz.questions?.length || 0} kérdés
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {quiz.title}
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px' }}>
                    {quiz.grade ? `Évfolyam: ${quiz.grade}` : 'Kvízkérdéssor'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--panel-border)', paddingTop: '14px' }}>
                  <button
                    onClick={() => handleLaunchQuiz(quiz)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#26890c',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(38, 137, 12, 0.3)'
                    }}
                  >
                    <span>▶️ Indítás</span>
                  </button>
                  <button
                    onClick={() => handleEditQuiz(quiz)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Kérdések szerkesztése és felülbírálása"
                  >
                    ✏️ Szerkesztés
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: 'transparent',
                      color: '#e21b3c',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Törlés"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          2. KVÍZ SZERKESZTŐ & FELÜLBÍRÁLÁS (EDITOR)
         ======================================================== */}
      {viewMode === 'editor' && editingQuiz && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
          <form onSubmit={handleSaveEditedQuiz} style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Kvíz Szerkesztése & Felülbírálása</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Itt bármelyik kérdést, választ és helyes megoldást közvetlenül módosíthatod!
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('library')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
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
                    background: '#1368ce',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(19, 104, 206, 0.3)'
                  }}
                >
                  Mentés a Könyvtárba
                </button>
              </div>
            </div>

            {/* Quiz Title & Subject Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Kvíz Címe:</label>
                <input
                  type="text"
                  required
                  value={editingQuiz.title}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Tantárgy:</label>
                <input
                  type="text"
                  value={editingQuiz.subject || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, subject: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Évfolyam:</label>
                <input
                  type="text"
                  value={editingQuiz.grade || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, grade: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editingQuiz.questions.map((q, qIdx) => (
                <div
                  key={q.id || qIdx}
                  style={{
                    background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '12px',
                    padding: '18px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: '#1368ce' }}>
                        {qIdx + 1}. Kérdés
                      </span>

                      {/* Kérdéstípus választó */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--panel-bg)', padding: '2px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...editingQuiz.questions];
                            updated[qIdx] = {
                              ...updated[qIdx],
                              type: 'multiple-choice',
                              correctOptionId: updated[qIdx].correctOptionId || 'opt-1',
                              options: (updated[qIdx].options?.length >= 4 ? updated[qIdx].options : [
                                { id: 'opt-1', text: '1. opció', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
                                { id: 'opt-2', text: '2. opció', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
                                { id: 'opt-3', text: '3. opció', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
                                { id: 'opt-4', text: '4. opció', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
                              ])
                            };
                            setEditingQuiz({ ...editingQuiz, questions: updated });
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: (!q.type || q.type === 'multiple-choice') ? '#1368ce' : 'transparent',
                            color: (!q.type || q.type === 'multiple-choice') ? '#fff' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🔠 4-válaszos
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...editingQuiz.questions];
                            updated[qIdx] = {
                              ...updated[qIdx],
                              type: 'true-false',
                              correctOptionId: (updated[qIdx].correctOptionId === 'opt-false' ? 'opt-false' : 'opt-true'),
                              options: [
                                { id: 'opt-true', text: 'Igaz', color: '#26890c', shape: '✓' },
                                { id: 'opt-false', text: 'Hamis', color: '#e21b3c', shape: '✗' }
                              ]
                            };
                            setEditingQuiz({ ...editingQuiz, questions: updated });
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: q.type === 'true-false' ? '#26890c' : 'transparent',
                            color: q.type === 'true-false' ? '#fff' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ⚖️ Igaz / Hamis
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...editingQuiz.questions];
                            updated[qIdx] = {
                              ...updated[qIdx],
                              type: 'numeric',
                              correctAnswer: updated[qIdx].correctAnswer ?? 0,
                              tolerance: updated[qIdx].tolerance ?? 0,
                              unit: updated[qIdx].unit ?? '',
                              options: []
                            };
                            setEditingQuiz({ ...editingQuiz, questions: updated });
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: q.type === 'numeric' ? '#ffa602' : 'transparent',
                            color: q.type === 'numeric' ? '#000' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🔢 Számolásos
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Időkorlát:</label>
                      <select
                        value={q.timeLimit || 20}
                        onChange={(e) => {
                          const updated = [...editingQuiz.questions];
                          updated[qIdx].timeLimit = Number(e.target.value);
                          setEditingQuiz({ ...editingQuiz, questions: updated });
                        }}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)' }}
                      >
                        <option value={10}>10 mp</option>
                        <option value={20}>20 mp</option>
                        <option value={30}>30 mp</option>
                        <option value={60}>60 mp</option>
                      </select>
                      {editingQuiz.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingQuiz.questions.filter((_, i) => i !== qIdx);
                            setEditingQuiz({ ...editingQuiz, questions: updated });
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#e21b3c', cursor: 'pointer', padding: '4px' }}
                        >
                          ✕ Törlés
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Kérdés szerkesztése & élő LaTeX előnézet */}
                  <div style={{ marginBottom: '14px' }}>
                    <textarea
                      rows={2}
                      required
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...editingQuiz.questions];
                        updated[qIdx].question = e.target.value;
                        setEditingQuiz({ ...editingQuiz, questions: updated });
                      }}
                      placeholder="Írd ide a kérdést (LaTeX képletek: $...$)..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: 'var(--panel-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        wordBreak: 'break-word'
                      }}
                    />
                    {/[\$\\_\^]/.test(q.question || '') && (
                      <div style={{
                        fontSize: '13px',
                        color: '#1368ce',
                        background: 'rgba(19, 104, 206, 0.08)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        marginTop: '4px',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                      }}>
                        Kérdés előnézete: <MathText text={q.question} />
                      </div>
                    )}
                  </div>

                  {/* Kérdéstípusnak megfelelő válasz-szerkesztő felület */}
                  {q.type === 'true-false' ? (
                    /* A) IGAZ / HAMIS VÁLASZTÓ */
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div
                        onClick={() => {
                          const updated = [...editingQuiz.questions];
                          updated[qIdx].correctOptionId = 'opt-true';
                          setEditingQuiz({ ...editingQuiz, questions: updated });
                        }}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '10px',
                          background: 'var(--panel-bg)',
                          border: q.correctOptionId === 'opt-true' ? '2px solid #26890c' : '1px solid var(--panel-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: q.correctOptionId === 'opt-true' ? '0 2px 10px rgba(38,137,12,0.2)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '24px', color: '#26890c', fontWeight: 900 }}>✓</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '15px' }}>IGAZ állítás</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>A diákoknak az IGAZ gombot kell választaniuk</div>
                          </div>
                        </div>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: q.correctOptionId === 'opt-true' ? '#26890c' : 'var(--hover-bg, rgba(0,0,0,0.06))',
                          color: q.correctOptionId === 'opt-true' ? '#fff' : 'var(--text-secondary)'
                        }}>
                          {q.correctOptionId === 'opt-true' ? '✓ Helyes megoldás' : 'Kijelölés'}
                        </span>
                      </div>

                      <div
                        onClick={() => {
                          const updated = [...editingQuiz.questions];
                          updated[qIdx].correctOptionId = 'opt-false';
                          setEditingQuiz({ ...editingQuiz, questions: updated });
                        }}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '10px',
                          background: 'var(--panel-bg)',
                          border: q.correctOptionId === 'opt-false' ? '2px solid #e21b3c' : '1px solid var(--panel-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: q.correctOptionId === 'opt-false' ? '0 2px 10px rgba(226,27,60,0.2)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '24px', color: '#e21b3c', fontWeight: 900 }}>✗</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '15px' }}>HAMIS állítás</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>A diákoknak a HAMIS gombot kell választaniuk</div>
                          </div>
                        </div>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: q.correctOptionId === 'opt-false' ? '#e21b3c' : 'var(--hover-bg, rgba(0,0,0,0.06))',
                          color: q.correctOptionId === 'opt-false' ? '#fff' : 'var(--text-secondary)'
                        }}>
                          {q.correctOptionId === 'opt-false' ? '✓ Helyes megoldás' : 'Kijelölés'}
                        </span>
                      </div>
                    </div>
                  ) : q.type === 'numeric' ? (
                    /* B) NUMERIKUS / SZÁMOLÁSOS BEÁLLÍTÁS */
                    <div style={{
                      background: 'var(--panel-bg)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr',
                      gap: '14px',
                      alignItems: 'center'
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#1368ce' }}>
                          🎯 Helyes számérték:
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={q.correctAnswer ?? 0}
                          onChange={(e) => {
                            const updated = [...editingQuiz.questions];
                            updated[qIdx].correctAnswer = parseFloat(e.target.value) || 0;
                            setEditingQuiz({ ...editingQuiz, questions: updated });
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #1368ce',
                            background: 'var(--panel-bg)',
                            color: 'var(--text-primary)',
                            fontWeight: 800,
                            fontSize: '15px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                          📏 Megengedett tolerancia (± eltérés):
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={q.tolerance ?? 0}
                          onChange={(e) => {
                            const updated = [...editingQuiz.questions];
                            updated[qIdx].tolerance = parseFloat(e.target.value) || 0;
                            setEditingQuiz({ ...editingQuiz, questions: updated });
                          }}
                          placeholder="0 (pontos érték)"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--panel-border)',
                            background: 'var(--panel-bg)',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                          🏷️ Mértékegység felirat (opcionális):
                        </label>
                        <input
                          type="text"
                          value={q.unit || ''}
                          onChange={(e) => {
                            const updated = [...editingQuiz.questions];
                            updated[qIdx].unit = e.target.value;
                            setEditingQuiz({ ...editingQuiz, questions: updated });
                          }}
                          placeholder="pl. cm², m/s, kg, %"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--panel-border)',
                            background: 'var(--panel-bg)',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* C) 4 FELELETVÁLASZTÓS OPCIÓ */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {(q.options || []).map((opt, oIdx) => {
                        const isCorrect = (q.correctOptionId === opt.id);
                        return (
                          <div
                            key={opt.id || oIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: 'var(--panel-bg)',
                              border: isCorrect ? '2px solid #26890c' : '1px solid var(--panel-border)',
                              boxShadow: isCorrect ? '0 2px 8px rgba(38, 137, 12, 0.15)' : 'none'
                            }}
                          >
                            <span style={{ fontSize: '20px', color: opt.color || ARENA_COLORS[oIdx], marginTop: '2px', flexShrink: 0 }}>
                              {opt.shape || ARENA_SHAPES[oIdx]}
                            </span>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <textarea
                                rows={2}
                                required
                                value={opt.text}
                                onChange={(e) => {
                                  const updated = [...editingQuiz.questions];
                                  updated[qIdx].options[oIdx].text = e.target.value;
                                  setEditingQuiz({ ...editingQuiz, questions: updated });
                                }}
                                placeholder="Válasz szövege ($...$)..."
                                style={{
                                  width: '100%',
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--text-primary)',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  outline: 'none',
                                  resize: 'none',
                                  lineHeight: 1.35,
                                  fontFamily: 'inherit',
                                  wordBreak: 'break-word',
                                  padding: 0
                                }}
                              />
                              {/[\$\\_\^]/.test(opt.text || '') && (
                                <div style={{
                                  fontSize: '12px',
                                  color: '#3b82f6',
                                  background: 'rgba(59, 130, 246, 0.08)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }}>
                                  <MathText text={opt.text} />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...editingQuiz.questions];
                                updated[qIdx].correctOptionId = opt.id;
                                setEditingQuiz({ ...editingQuiz, questions: updated });
                              }}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                border: 'none',
                                background: isCorrect ? '#26890c' : 'var(--hover-bg, rgba(0,0,0,0.06))',
                                color: isCorrect ? '#fff' : 'var(--text-secondary)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                alignSelf: 'center'
                              }}
                            >
                              {isCorrect ? '✓ Helyes' : 'Helyes?'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const newQObj = {
                    id: 'q-' + Date.now(),
                    question: 'Új kérdés...',
                    timeLimit: 20,
                    correctOptionId: 'opt-1',
                    options: [
                      { id: 'opt-1', text: 'Első válasz (Helyes)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
                      { id: 'opt-2', text: 'Második válasz', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
                      { id: 'opt-3', text: 'Harmadik válasz', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
                      { id: 'opt-4', text: 'Negyedik válasz', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
                    ]
                  };
                  setEditingQuiz({
                    ...editingQuiz,
                    questions: [...editingQuiz.questions, newQObj]
                  });
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px dashed var(--panel-border)',
                  background: 'transparent',
                  color: '#1368ce',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                + Új Kérdés Hozzáadása a Kvízhez
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          3. ÉLŐ JÁTÉKMENET KONTROLLER (LIVE ARENA)
         ======================================================== */}
      {viewMode === 'live' && activeSession && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* A) LOBBY PHASE */}
          {activeSession.status === 'lobby' && (
            <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(70, 23, 143, 0.08), rgba(226, 27, 60, 0.08))',
                border: '2px solid rgba(70, 23, 143, 0.2)',
                borderRadius: '24px',
                padding: '36px',
                maxWidth: '680px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 16px 40px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: '#46178f', marginBottom: '8px' }}>
                  Csatlakozz a telefonoddal!
                </div>
                
                {/* BIG PIN BADGE */}
                <div style={{
                  display: 'inline-block',
                  background: '#18181b',
                  color: '#ffffff',
                  padding: '12px 36px',
                  borderRadius: '16px',
                  fontSize: '44px',
                  fontWeight: 900,
                  letterSpacing: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  marginBottom: '20px'
                }}>
                  PIN: {activeSession.pin}
                </div>

                {/* QR CODE DISPLAY */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'inline-block',
                    background: '#ffffff',
                    padding: '16px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                  }}>
                    {qrMatrix ? (
                      <svg width="200" height="200" viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
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
                      <div>QR Kód generálása...</div>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Webcím: <strong>{joinUrl}</strong>
                    <button
                      onClick={handleCopyLink}
                      style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', cursor: 'pointer', fontSize: '11px' }}
                    >
                      {copiedLink ? 'Másolva!' : 'Link másolása'}
                    </button>
                  </div>
                </div>

                {/* PLAYERS IN LOBBY */}
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Csatlakozott játékosok ({activeSession.playersCount} diák):
                  </div>
                  {activeSession.playersCount === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                      Várakozás a diákok csatlakozására...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                      {activeSession.players.map(p => (
                        <span
                          key={p.id}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '20px',
                            background: '#18181b',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          👤 {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* START BUTTON */}
                <button
                  onClick={handleStartGame}
                  disabled={activeSession.playersCount === 0}
                  style={{
                    padding: '16px 48px',
                    borderRadius: '14px',
                    border: 'none',
                    background: activeSession.playersCount > 0 ? '#26890c' : '#a1a1aa',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    cursor: activeSession.playersCount > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: '0 8px 24px rgba(38, 137, 12, 0.4)'
                  }}
                >
                  ▶️ JÁTÉK INDÍTÁSA!
                </button>
              </div>
            </div>
          )}

          {/* B) ACTIVE QUESTION PHASE */}
          {activeSession.status === 'question' && (
            <div style={{ flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', maxWidth: '960px', width: '100%', margin: '0 auto' }}>
              {/* Question header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1368ce' }}>
                  {activeSession.currentQuestionIndex + 1} / {activeSession.totalQuestions}. Kérdés
                </span>
                <span style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: timeLeft <= 5 ? '#e21b3c' : '#18181b',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '18px'
                }}>
                  ⏱️ {timeLeft} mp
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>
                  Válaszolt: {activeSession.answeredCount} / {activeSession.playersCount}
                </span>
              </div>

              {/* Big Question Card */}
              <div style={{
                background: 'var(--panel-bg)',
                border: '2px solid var(--panel-border)',
                borderRadius: '16px',
                padding: '24px 28px',
                fontSize: (currentQ?.question?.length || 0) > 90 ? '19px' : '23px',
                fontWeight: 800,
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                marginBottom: '20px',
                lineHeight: 1.4,
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}>
                <MathText text={currentQ?.question} />
              </div>

              {/* Kérdés blokkok / interakció a kérdéstípustól függően */}
              {currentQ?.type === 'true-false' ? (
                /* A) IGAZ / HAMIS ÉLŐ KIJELZŐ */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, minHeight: '200px' }}>
                  <div style={{
                    background: '#26890c',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    boxShadow: '0 8px 24px rgba(38, 137, 12, 0.3)'
                  }}>
                    <span style={{ fontSize: '48px', fontWeight: 900 }}>✓</span>
                    <span style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '2px' }}>IGAZ</span>
                  </div>

                  <div style={{
                    background: '#e21b3c',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    boxShadow: '0 8px 24px rgba(226, 27, 60, 0.3)'
                  }}>
                    <span style={{ fontSize: '48px', fontWeight: 900 }}>✗</span>
                    <span style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '2px' }}>HAMIS</span>
                  </div>
                </div>
              ) : currentQ?.type === 'numeric' ? (
                /* B) NUMERIKUS / SZÁMÍTÁSOS ÉLŐ KIJELZŐ */
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,166,2,0.12), rgba(19,104,206,0.08))',
                  border: '2px dashed #ffa602',
                  borderRadius: '20px',
                  padding: '36px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  flex: 1,
                  minHeight: '200px'
                }}>
                  <div style={{ fontSize: '52px', marginBottom: '12px' }}>🔢 ⌨️</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 900 }}>
                    Számításos / Numerikus Feladat
                  </h3>
                  <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-secondary)' }}>
                    A diákok közvetlenül a telefonjukon gépelik be a pontos számértéket {currentQ?.unit ? `(${currentQ.unit})` : ''}!
                  </p>
                </div>
              ) : (
                /* C) 4 SZÍNES BLOKK (FELELETVÁLASZTÓ) */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, minHeight: '220px' }}>
                  {(currentQ?.options || []).map((opt) => {
                    const len = opt.text?.length || 0;
                    const fontSize = len > 75 ? '15px' : len > 40 ? '17px' : '19px';
                    return (
                      <div
                        key={opt.id}
                        style={{
                          background: opt.color || '#1368ce',
                          color: '#ffffff',
                          borderRadius: '16px',
                          padding: '18px 22px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                          minHeight: '96px',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere'
                        }}
                      >
                        <span style={{ fontSize: '32px', fontWeight: 900, flexShrink: 0 }}>{opt.shape}</span>
                        <span style={{ fontSize, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>
                          <MathText text={opt.text} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Teacher action bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={handleRevealAnswer}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#18181b',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Eredmények Felfedése ➔
                </button>
              </div>
            </div>
          )}

          {/* C) REVEAL ANSWER PHASE */}
          {activeSession.status === 'reveal' && (
            <div style={{ flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', maxWidth: '960px', width: '100%', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#26890c', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Helyes Válasz
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: (currentQ?.question?.length || 0) > 90 ? '19px' : '23px', fontWeight: 800, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  <MathText text={currentQ?.question} />
                </h3>
              </div>

              {/* Megoldás megjelenítése kérdéstípus szerint */}
              {currentQ?.type === 'true-false' ? (
                /* A) IGAZ / HAMIS MEGOLDÁS KIJELZÉSE */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, minHeight: '200px' }}>
                  <div style={{
                    background: '#26890c',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    fontSize: '28px',
                    fontWeight: 900,
                    opacity: currentQ.correctOptionId === 'opt-true' ? 1 : 0.3,
                    border: currentQ.correctOptionId === 'opt-true' ? '4px solid #ffffff' : 'none',
                    boxShadow: currentQ.correctOptionId === 'opt-true' ? '0 12px 32px rgba(38,137,12,0.4)' : 'none',
                    transform: currentQ.correctOptionId === 'opt-true' ? 'scale(1.03)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontSize: '48px' }}>✓</span>
                    <span style={{ letterSpacing: '2px' }}>IGAZ</span>
                    {currentQ.correctOptionId === 'opt-true' && (
                      <span style={{ fontSize: '24px', background: 'rgba(255,255,255,0.3)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✓
                      </span>
                    )}
                  </div>

                  <div style={{
                    background: '#e21b3c',
                    color: '#ffffff',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    fontSize: '28px',
                    fontWeight: 900,
                    opacity: currentQ.correctOptionId === 'opt-false' ? 1 : 0.3,
                    border: currentQ.correctOptionId === 'opt-false' ? '4px solid #ffffff' : 'none',
                    boxShadow: currentQ.correctOptionId === 'opt-false' ? '0 12px 32px rgba(226,27,60,0.4)' : 'none',
                    transform: currentQ.correctOptionId === 'opt-false' ? 'scale(1.03)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontSize: '48px' }}>✗</span>
                    <span style={{ letterSpacing: '2px' }}>HAMIS</span>
                    {currentQ.correctOptionId === 'opt-false' && (
                      <span style={{ fontSize: '24px', background: 'rgba(255,255,255,0.3)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              ) : currentQ?.type === 'numeric' ? (
                /* B) NUMERIKUS / SZÁMÍTÁSOS MEGOLDÁS KIJELZÉSE */
                <div style={{
                  background: 'rgba(38, 137, 12, 0.1)',
                  border: '3px solid #26890c',
                  borderRadius: '20px',
                  padding: '36px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  flex: 1,
                  minHeight: '200px'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#26890c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                    ✓ HELYES MEGOLDÁS
                  </div>
                  <div style={{ fontSize: '52px', fontWeight: 900, color: '#26890c', margin: '6px 0 12px' }}>
                    {currentQ.correctAnswer} {currentQ.unit || ''}
                  </div>
                  {Number(currentQ.tolerance) > 0 && (
                    <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Elfogadott intervallum: <strong>[{currentQ.correctAnswer - currentQ.tolerance} ... {currentQ.correctAnswer + currentQ.tolerance}]</strong> (±{currentQ.tolerance} {currentQ.unit || ''})
                    </div>
                  )}
                </div>
              ) : (
                /* C) 4 SZÍNES BLOKK KIEMELT MEGOLDÁSSAL */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, minHeight: '220px' }}>
                  {(currentQ?.options || []).map((opt) => {
                    const isCorrect = (opt.id === currentQ.correctOptionId);
                    const len = opt.text?.length || 0;
                    const fontSize = len > 75 ? '15px' : len > 40 ? '17px' : '19px';
                    return (
                      <div
                        key={opt.id}
                        style={{
                          background: opt.color || '#1368ce',
                          color: '#ffffff',
                          borderRadius: '16px',
                          padding: '18px 22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          opacity: isCorrect ? 1 : 0.35,
                          transform: isCorrect ? 'scale(1.02)' : 'none',
                          border: isCorrect ? '4px solid #ffffff' : 'none',
                          boxShadow: isCorrect ? '0 12px 32px rgba(38, 137, 12, 0.4)' : 'none',
                          transition: 'all 0.3s ease',
                          minHeight: '96px',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <span style={{ fontSize: '32px', fontWeight: 900, flexShrink: 0 }}>{opt.shape}</span>
                          <span style={{ fontSize, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>
                            <MathText text={opt.text} />
                          </span>
                        </div>
                        {isCorrect && (
                          <span style={{ fontSize: '28px', background: 'rgba(255,255,255,0.3)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={handleShowLeaderboard}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#ffa602',
                    color: '#000000',
                    fontWeight: 900,
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255, 166, 2, 0.4)'
                  }}
                >
                  🏆 Ranglista Megtekintése ➔
                </button>
              </div>
            </div>
          )}

          {/* D) LEADERBOARD PHASE */}
          {activeSession.status === 'leaderboard' && (
            <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ maxWidth: '640px', width: '100%', background: 'var(--panel-bg)', borderRadius: '20px', border: '1px solid var(--panel-border)', padding: '28px', boxShadow: '0 16px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏆 Ranglista (Top Játékosok)
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Kérdés: {activeSession.currentQuestionIndex + 1} / {activeSession.totalQuestions}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {sortedPlayers.slice(0, 5).map((player, idx) => (
                    <div
                      key={player.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: idx === 0 ? 'rgba(255, 166, 2, 0.15)' : 'var(--hover-bg, rgba(0,0,0,0.02))',
                        border: idx === 0 ? '2px solid #ffa602' : '1px solid var(--panel-border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, width: '32px' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 800 }}>
                          {player.name}
                        </span>
                        {player.streak >= 2 && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#e21b3c', color: '#fff' }}>
                            🔥 {player.streak} széria
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: '#1368ce' }}>
                        {player.score} pont
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={handleNextQuestion}
                    style={{
                      padding: '14px 32px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#1368ce',
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '15px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(19, 104, 206, 0.3)'
                    }}
                  >
                    {activeSession.currentQuestionIndex < activeSession.totalQuestions - 1
                      ? 'Következő Kérdés ➔'
                      : 'Végeredmény (Dobogó) 🎉'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* E) PODIUM PHASE (WINNERS CELEBRATION) */}
          {activeSession.status === 'podium' && (
            <div style={{ flex: 1, padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                maxWidth: '720px',
                width: '100%',
                background: 'radial-gradient(circle at 50% 10%, rgba(255,166,2,0.15) 0%, var(--panel-bg) 70%)',
                borderRadius: '24px',
                border: '2px solid rgba(255,166,2,0.3)',
                padding: '40px 24px',
                textAlign: 'center',
                boxShadow: '0 24px 60px rgba(0,0,0,0.15)'
              }}>
                <div style={{ fontSize: '56px', marginBottom: '8px' }}>🎉 🏆 🎉</div>
                <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                  Gratulálunk a Győzteseknek!
                </h2>
                <p style={{ margin: '0 0 32px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  A kvíz befejeződött. Íme a mai óra dobogós helyezettjei:
                </p>

                {/* 3 PODIUM COLUMNS */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', marginBottom: '40px', height: '260px' }}>
                  {/* 2nd Place */}
                  {sortedPlayers[1] && (
                    <div style={{ flex: 1, maxWidth: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '6px' }}>🥈</div>
                      <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>{sortedPlayers[1].name}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1368ce', marginBottom: '8px' }}>{sortedPlayers[1].score} pont</div>
                      <div style={{ width: '100%', height: '140px', background: 'linear-gradient(to top, #94a3b8, #cbd5e1)', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: '#475569' }}>
                        2
                      </div>
                    </div>
                  )}

                  {/* 1st Place (Highest) */}
                  {sortedPlayers[0] && (
                    <div style={{ flex: 1, maxWidth: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: '42px', marginBottom: '6px' }}>🥇</div>
                      <div style={{ fontWeight: 900, fontSize: '17px', color: '#ffa602', marginBottom: '4px' }}>{sortedPlayers[0].name}</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffa602', marginBottom: '8px' }}>{sortedPlayers[0].score} pont</div>
                      <div style={{ width: '100%', height: '190px', background: 'linear-gradient(to top, #f59e0b, #fde68a)', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 900, color: '#b45309', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)' }}>
                        1
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {sortedPlayers[2] && (
                    <div style={{ flex: 1, maxWidth: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '6px' }}>🥉</div>
                      <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px' }}>{sortedPlayers[2].name}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginBottom: '8px' }}>{sortedPlayers[2].score} pont</div>
                      <div style={{ width: '100%', height: '100px', background: 'linear-gradient(to top, #b45309, #fed7aa)', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: '#7c2d12' }}>
                        3
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowReportModal(true)}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #1368ce, #46178f)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(19, 104, 206, 0.4)'
                    }}
                  >
                    <span>📊</span>
                    <span>Részletes Elemző Riport & Export</span>
                  </button>
                  <button
                    onClick={handleResetGame}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Újraindítás a Lobbyba
                  </button>
                  <button
                    onClick={() => setViewMode('library')}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#18181b',
                      color: '#fff',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    📚 Vissza a Könyvtárhoz
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4. AI GENERATOR MODAL (Témakör vagy Dokumentum alapján)
         ======================================================== */}
      {showAiModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--panel-bg, #ffffff)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
            border: '1px solid var(--panel-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Kvíz Generálása AI-val</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>

            {/* API Key Status / Warning */}
            {!hasApiKey ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ef4444', lineHeight: 1.4 }}>
                  <span style={{ fontSize: '18px' }}>⚠️</span>
                  <span><strong>Nincs megadva API kulcs!</strong> Az AI kvízhez be kell állítani a Google Gemini API kulcsot.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(true)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🔑 Beállítás
                </button>
              </div>
            ) : (
              <div style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#22c55e', fontSize: '14px' }}>✓</span>
                  <span>Gemini AI aktív: <strong>{geminiService.getModel()}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Módosítás
                </button>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setAiSourceMode('topic')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: aiSourceMode === 'topic' ? '2px solid #1368ce' : '1px solid var(--panel-border)',
                  background: aiSourceMode === 'topic' ? 'rgba(19, 104, 206, 0.08)' : 'var(--panel-bg)',
                  color: aiSourceMode === 'topic' ? '#1368ce' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🎯</span>
                <span>Témakör szerint</span>
              </button>
              <button
                type="button"
                onClick={() => setAiSourceMode('document')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: aiSourceMode === 'document' ? '2px solid #e21b3c' : '1px solid var(--panel-border)',
                  background: aiSourceMode === 'document' ? 'rgba(226, 27, 60, 0.08)' : 'var(--panel-bg)',
                  color: aiSourceMode === 'document' ? '#e21b3c' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>📄</span>
                <span>Dokumentum alapján</span>
                <span style={{ fontSize: '10px', background: '#e21b3c', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>ÚJ</span>
              </button>
            </div>

            <form onSubmit={handleAiGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {aiSourceMode === 'topic' ? (
                /* 1. TÉMAKÖR ALAPÚ BEVITEL */
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Tanítási témakör vagy téma:
                  </label>
                  <input
                    type="text"
                    required={aiSourceMode === 'topic'}
                    placeholder="Pl. Másodfokú egyenlet diszkriminánsa, Fénytörés, Mohácsi csata..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Az AI azonnal összeállítja a teljes 4-válaszos kvízkérdéssort, amit indítás előtt szerkeszthetsz.
                  </div>
                </div>
              ) : (
                /* 2. DOKUMENTUM / TANANYAG ALAPÚ BEVITEL */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>
                      Forrásdokumentum vagy Tananyag:
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setAiDocumentTab('upload')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: aiDocumentTab === 'upload' ? 'rgba(226, 27, 60, 0.15)' : 'transparent',
                          color: aiDocumentTab === 'upload' ? '#e21b3c' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📂 Fájl feltöltése
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiDocumentTab('paste')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: aiDocumentTab === 'paste' ? 'rgba(226, 27, 60, 0.15)' : 'transparent',
                          color: aiDocumentTab === 'paste' ? '#e21b3c' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📝 Szöveg beillesztése
                      </button>
                    </div>
                  </div>

                  {aiDocumentTab === 'upload' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.docx"
                        style={{ display: 'none' }}
                      />

                      {!aiDocumentFile ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            border: '2px dashed var(--panel-border)',
                            borderRadius: '12px',
                            padding: '24px 16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: 'rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📄</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {aiFileReading ? 'Fájl beolvasása folyamatban...' : 'Kattints ide vagy húzd ide a dokumentumot'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Támogatott: <strong>PDF</strong>, kép/fotó (PNG, JPG), Word (DOCX) vagy jegyzet (TXT, MD) (max. 25 MB)
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(38, 137, 12, 0.08)',
                          border: '1.5px solid rgba(38, 137, 12, 0.3)',
                          borderRadius: '12px',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '28px', flexShrink: 0 }}>
                                {aiDocumentFile.type?.includes('pdf') ? '📕' : aiDocumentFile.type?.includes('image') ? '🖼️' : '📄'}
                              </span>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {aiDocumentFile.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#26890c', fontWeight: 700 }}>
                                  ✓ Eredeti dokumentum csatolva ({formatFileSize(aiDocumentFile.size)})
                                </div>
                              </div>
                            </div>
                            <div style={{
                              padding: '6px 10px',
                              background: 'rgba(255,255,255,0.7)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: '#1e3a8a',
                              lineHeight: 1.4,
                              border: '1px solid rgba(0,0,0,0.06)'
                            }}>
                              📄 <strong>Közvetlen dokumentum átadás:</strong> Az AI a teljes eredeti dokumentumfájlból (oldalak, szöveg, ábrák, táblázatok, képletek) dolgozik.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAiDocumentFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#ef4444',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ✕ Eltávolítás
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        rows={5}
                        placeholder="Másold be ide a tankönyvi fejezetet, tananyagot, cikk részletét vagy az óravázlatot..."
                        value={aiDocumentText}
                        onChange={(e) => setAiDocumentText(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--panel-border)',
                          background: 'var(--panel-bg)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          lineHeight: 1.5,
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {aiDocumentText.length > 0 ? `${aiDocumentText.length.toLocaleString()} karakter` : 'Legalább pár mondat vagy bekezdés ajánlott'}
                      </div>
                    </div>
                  )}

                  {/* Opcionális fókusz mező dokumentumhoz */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Kiemelt fókusz / tanári megjegyzés (opcionális):
                    </label>
                    <input
                      type="text"
                      placeholder="Pl. Csak a 2. tétel levezetésére kérdezz rá, vagy Számításos feladatok..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: 'var(--panel-bg)',
                        color: 'var(--text-primary)',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Kérdések száma és Tantárgy */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>
                      Kérdések száma:
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      (1 – 30 db)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={aiQuestionCount}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                        setAiQuestionCount(val);
                      }}
                      onBlur={() => {
                        if (!aiQuestionCount || aiQuestionCount < 1) setAiQuestionCount(3);
                        else if (aiQuestionCount > 30) setAiQuestionCount(30);
                      }}
                      placeholder="db"
                      style={{
                        width: '72px',
                        padding: '10px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: 'var(--panel-bg)',
                        color: 'var(--text-primary)',
                        fontWeight: 800,
                        fontSize: '15px',
                        textAlign: 'center'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {[3, 5, 8, 10, 15].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setAiQuestionCount(cnt)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: Number(aiQuestionCount) === cnt ? '1.5px solid #1368ce' : '1px solid var(--panel-border)',
                            background: Number(aiQuestionCount) === cnt ? 'rgba(19, 104, 206, 0.12)' : 'var(--panel-bg)',
                            color: Number(aiQuestionCount) === cnt ? '#1368ce' : 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {cnt} db
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Tantárgy:
                  </label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="Fizika">Fizika</option>
                    <option value="Történelem">Történelem</option>
                    <option value="Irodalom">Irodalom / Magyar</option>
                    <option value="Természettudomány">Biológia / Kémia</option>
                    <option value="Általános">Általános műveltség</option>
                  </select>
                </div>
              </div>

              {/* Kérdéstípusok bejelölése (Többválasztós jelölőnégyzetek) */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Kérdéstípusok bejelölése (válaszd ki a kívánt típusokat):
                  </label>
                  <button
                    type="button"
                    onClick={() => setAiQuestionTypes(['multiple-choice', 'true-false', 'numeric'])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1368ce',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Mindhárom kijelölése
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    {
                      id: 'multiple-choice',
                      title: '4-válaszos',
                      subtitle: 'Klasszikus A, B, C, D',
                      icon: '🔠',
                      color: '#1368ce'
                    },
                    {
                      id: 'true-false',
                      title: 'Igaz / Hamis',
                      subtitle: '2 gombos eldöntendő',
                      icon: '⚖️',
                      color: '#26890c'
                    },
                    {
                      id: 'numeric',
                      title: 'Számolásos',
                      subtitle: 'Diák által beírt szám',
                      icon: '🔢',
                      color: '#ffa602'
                    }
                  ].map(item => {
                    const isSelected = aiQuestionTypes.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setAiQuestionTypes(prev => {
                            const list = Array.isArray(prev) ? prev : ['multiple-choice', 'true-false', 'numeric'];
                            if (list.includes(item.id)) {
                              if (list.length === 1) return list; // Legalább 1 típus maradjon kijelölve
                              return list.filter(t => t !== item.id);
                            } else {
                              return [...list, item.id];
                            }
                          });
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: isSelected ? `2px solid ${item.color}` : '1.5px solid var(--panel-border)',
                          background: isSelected ? `${item.color}15` : 'var(--panel-bg)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                          boxShadow: isSelected ? `0 2px 10px ${item.color}25` : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '22px' }}>{item.icon}</span>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: isSelected ? `2px solid ${item.color}` : '1.5px solid var(--panel-border)',
                            background: isSelected ? item.color : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 900
                          }}>
                            {isSelected ? '✓' : ''}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: isSelected ? (item.color === '#ffa602' ? 'var(--text-primary)' : item.color) : 'var(--text-primary)', marginTop: '2px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.25 }}>
                          {item.subtitle}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gombok */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--panel-bg)',
                    cursor: 'pointer'
                  }}
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || (aiSourceMode === 'topic' && !aiTopic.trim()) || (aiSourceMode === 'document' && !aiDocumentFile && !aiDocumentText.trim())}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isGenerating
                      ? '#71717a'
                      : (aiSourceMode === 'document' ? 'linear-gradient(135deg, #e21b3c, #1368ce)' : 'linear-gradient(135deg, #e21b3c, #ffa602)'),
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: isGenerating ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isGenerating ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</span>
                      <span>Kvíz összeállítása a forrásból...</span>
                    </>
                  ) : (
                    <span>{aiSourceMode === 'document' ? '📄 Kvíz Készítése Dokumentumból' : '✨ Kvíz Generálása & Felülbírálás'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          5. GEMINI API KULCS BEÁLLÍTÁSI MODAL ABLAK
         ======================================================== */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={(key) => {
          setHasApiKey(Boolean(key));
          if (key) {
            setShowAiModal(true);
          }
        }}
        addNotification={addNotification}
        title="Google Gemini API Kulcs Beállítása"
        subtitle="Az intelligens AI Kvíz funkcióhoz szükséges"
      />

      {/* ========================================================
          6. TANÁRI ELEMZŐ RIPORT & TÍPUSHIBÁK MODAL
         ======================================================== */}
      <QuizReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        quiz={activeSession?.quiz || editingQuiz}
        players={activeSession?.players || []}
        answersHistory={activeSession?.answersHistory || {}}
        addNotification={addNotification}
      />
    </div>
  );
}
