import React, { useState, useMemo } from 'react';
import MathText from '../ui/MathText';
import { exportQuizResultsToCsv, analyzeMisconceptionsWithAi } from '../../services/quizArenaService';

export default function QuizReportModal({ isOpen, onClose, quiz, players = [], answersHistory = {}, addNotification }) {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'ai-diagnosis' | 'students'
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  // Részletes kérdésenkénti statisztika kiszámítása
  const questionStats = useMemo(() => {
    return questions.map((q, idx) => {
      const responses = answersHistory?.[idx] || [];
      const total = responses.length;
      const correct = responses.filter(r => r.isCorrect).length;
      const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Opciók megoszlása
      const optionCounts = {};
      (q.options || []).forEach(opt => {
        optionCounts[opt.id] = responses.filter(r => r.optionId === opt.id).length;
      });

      return {
        ...q,
        index: idx + 1,
        total,
        correct,
        successRate,
        optionCounts
      };
    });
  }, [questions, answersHistory]);

  // Összesített osztálymutatók
  const overallStats = useMemo(() => {
    const totalPossible = players.length * questions.length;
    let totalCorrect = 0;
    let totalResponses = 0;

    questionStats.forEach(qs => {
      totalCorrect += qs.correct;
      totalResponses += qs.total;
    });

    const averageScore = players.length > 0
      ? Math.round(players.reduce((sum, p) => sum + (p.score || 0), 0) / players.length)
      : 0;

    const classAverageRate = totalResponses > 0
      ? Math.round((totalCorrect / totalResponses) * 100)
      : 0;

    // Legjobb és legnehezebb kérdés
    const sortedBySuccess = [...questionStats].filter(q => q.total > 0).sort((a, b) => b.successRate - a.successRate);
    const easiestQ = sortedBySuccess[0] || null;
    const hardestQ = sortedBySuccess[sortedBySuccess.length - 1] || null;

    return {
      totalParticipants: players.length,
      averageScore,
      classAverageRate,
      easiestQ,
      hardestQ
    };
  }, [players, questions, questionStats]);

  // Rendezett tanulói rangsor
  const sortedStudents = useMemo(() => {
    return [...players].sort((a, b) => (b.score || 0) - (a.score || 0)).map((p, idx) => {
      let correctCount = 0;
      let totalTime = 0;
      let answeredCount = 0;

      questions.forEach((q, qIdx) => {
        const resp = (answersHistory?.[qIdx] || []).find(r => r.playerId === p.id);
        if (resp) {
          answeredCount++;
          if (resp.isCorrect) correctCount++;
          totalTime += (resp.responseTimeMs || 0);
        }
      });

      const avgTimeSec = answeredCount > 0 ? ((totalTime / answeredCount) / 1000).toFixed(1) : '-';

      return {
        ...p,
        rank: idx + 1,
        correctCount,
        avgTimeSec
      };
    });
  }, [players, questions, answersHistory]);

  // AI Típushiba elemzés indítása
  const handleRunAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    try {
      const result = await analyzeMisconceptionsWithAi({
        quizTitle: quiz?.title || 'Schola Kvíz',
        questions,
        players,
        answersHistory
      });
      setAiReport(result);
      if (addNotification) addNotification('AI Típushiba-diagnózis elkészült!', 'success');
    } catch (err) {
      if (addNotification) addNotification('AI Hiba: ' + err.message, 'error');
      else alert('AI Hiba: ' + err.message);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // CSV Export letöltés
  const handleExportCsv = () => {
    exportQuizResultsToCsv({
      quiz,
      players,
      answersHistory
    });
    if (addNotification) addNotification('Excel / CSV riport sikeresen letöltve!', 'success');
  };

  // Nyomtatás / PDF export
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="quiz-report-backdrop" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div className="quiz-report-modal" style={{
        background: 'var(--panel-bg, #ffffff)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '960px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 30px 70px rgba(0,0,0,0.3)',
        border: '1px solid var(--panel-border)',
        overflow: 'hidden'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>📊</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
                Tanári Elemző Riport & Típushiba-detektor
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {quiz?.title || 'Kvíz'} • {players.length} tanuló • {questions.length} kérdés
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportCsv}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #1368ce',
                background: 'rgba(19, 104, 206, 0.08)',
                color: '#1368ce',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📥</span>
              <span>Excel / CSV</span>
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--panel-border)',
                background: 'var(--panel-bg)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🖨️</span>
              <span>Nyomtatás / PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* KPI OVERVIEW TILES */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '16px 28px',
          borderBottom: '1px solid var(--panel-border)',
          background: 'rgba(0,0,0,0.01)'
        }}>
          <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Résztvevők</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#1368ce', marginTop: '2px' }}>{overallStats.totalParticipants} diák</div>
          </div>
          <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Osztályátlag</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: overallStats.classAverageRate >= 60 ? '#26890c' : '#e21b3c', marginTop: '2px' }}>
              {overallStats.classAverageRate}%
            </div>
          </div>
          <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Átlagpontszám</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffa602', marginTop: '2px' }}>{overallStats.averageScore} pont</div>
          </div>
          <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Legnehezebb kérdés</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#e21b3c', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {overallStats.hardestQ ? `${overallStats.hardestQ.index}. kérdés (${overallStats.hardestQ.successRate}%)` : 'Nincs adat'}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 28px 0', borderBottom: '1px solid var(--panel-border)' }}>
          <button
            onClick={() => setActiveTab('questions')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'questions' ? '3px solid #1368ce' : '3px solid transparent',
              color: activeTab === 'questions' ? '#1368ce' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📈 Kérdések & Hőtérkép ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('ai-diagnosis')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'ai-diagnosis' ? '3px solid #e21b3c' : '3px solid transparent',
              color: activeTab === 'ai-diagnosis' ? '#e21b3c' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🤖</span>
            <span>Katedra AI Típushiba-detektor</span>
            <span style={{ fontSize: '10px', background: '#e21b3c', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>AI</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'students' ? '3px solid #26890c' : '3px solid transparent',
              color: activeTab === 'students' ? '#26890c' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            👥 Tanulói Eredmények ({players.length})
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* 1. KÉRDÉSEK & HŐTÉRKÉP TAB */}
          {activeTab === 'questions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {questionStats.map((qs) => {
                const isHard = qs.successRate < 50 && qs.total > 0;
                return (
                  <div
                    key={qs.id}
                    style={{
                      background: 'var(--panel-bg)',
                      border: isHard ? '1.5px solid rgba(226, 27, 60, 0.4)' : '1px solid var(--panel-border)',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                        <span style={{
                          background: isHard ? '#e21b3c' : '#1368ce',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}>
                          {qs.index}. Kérdés
                        </span>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          <MathText text={qs.question} />
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 900,
                          color: qs.successRate >= 60 ? '#26890c' : '#e21b3c'
                        }}>
                          {qs.successRate}%
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {qs.correct} / {qs.total} helyes
                        </div>
                      </div>
                    </div>

                    {/* Sikerességi progress bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                      <div style={{ width: `${qs.successRate}%`, height: '100%', background: qs.successRate >= 60 ? '#26890c' : '#e21b3c', transition: 'width 0.5s ease' }} />
                    </div>

                    {/* Opciók eloszlása vagy helyes válasz */}
                    {qs.type === 'numeric' ? (
                      <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <span>🔢 Helyes érték:</span>
                        <strong style={{ color: '#26890c', fontSize: '14px' }}>
                          <MathText text={String(qs.correctAnswer)} /> {qs.unit || ''}
                        </strong>
                        {qs.tolerance > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>(±{qs.tolerance})</span>}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: qs.type === 'true-false' ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)', gap: '10px' }}>
                        {(qs.options || []).map((opt) => {
                          const isCorrect = opt.id === qs.correctOptionId;
                          const pickCount = qs.optionCounts[opt.id] || 0;
                          const pickPct = qs.total > 0 ? Math.round((pickCount / qs.total) * 100) : 0;
                          return (
                            <div
                              key={opt.id}
                              style={{
                                background: isCorrect ? 'rgba(38, 137, 12, 0.08)' : 'rgba(0,0,0,0.02)',
                                border: isCorrect ? '1.5px solid #26890c' : '1px solid var(--panel-border)',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: isCorrect ? '#26890c' : 'var(--text-secondary)' }}>
                                  {isCorrect ? '✓' : opt.shape || '●'}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: isCorrect ? 700 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <MathText text={opt.text} />
                                </span>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: isCorrect ? '#26890c' : 'var(--text-secondary)', flexShrink: 0 }}>
                                {pickCount} diák ({pickPct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. KATEDRA AI TÍPUSHIBÁK & DIAGNÓZIS TAB */}
          {activeTab === 'ai-diagnosis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(226, 27, 60, 0.08), rgba(19, 104, 206, 0.08))',
                border: '1px solid rgba(226, 27, 60, 0.25)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Pedagógiai Típushiba-Elemző & Módszertani Javaslatok
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    A Gemini AI automatikusan megvizsgálja a leginkább elrontott kérdéseket, a diákok által választott téves opciókat, és feltárja a mögöttes elméleti vagy számítási tévhiteket.
                  </p>
                </div>

                <button
                  onClick={handleRunAiAnalysis}
                  disabled={isAiAnalyzing}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #e21b3c, #1368ce)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: isAiAnalyzing ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(226, 27, 60, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isAiAnalyzing ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite' }}>⚡</span>
                      <span>Elemzés készítése...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>{aiReport ? 'Újraelemzés futtatása' : 'AI Elemzés Indítása'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Elemzés eredménye */}
              {aiReport ? (
                <div style={{
                  background: 'var(--panel-bg)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    <MathText text={aiReport} />
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '2px dashed var(--panel-border)',
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔍</div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800 }}>Még nem futtattál AI diagnózist</h4>
                  <p style={{ margin: 0, fontSize: '13px', maxWidth: '440px', marginInline: 'auto' }}>
                    Kattints a fenti gombra! A rendszer azonnal kiértékeli a diákok válaszait és összefoglalja a legfontosabb módszertani teendőket.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. TANULÓI EREDMÉNYEK TAB */}
          {activeTab === 'students' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 12px', width: '60px' }}>Helyezés</th>
                    <th style={{ padding: '10px 12px' }}>Tanuló neve</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Pontszám</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Helyes válaszok</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Átl. válaszidő</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((st) => (
                    <tr
                      key={st.id}
                      style={{
                        borderBottom: '1px solid var(--panel-border)',
                        background: st.rank === 1 ? 'rgba(255, 166, 2, 0.08)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 800 }}>
                        {st.rank === 1 ? '🥇 1.' : st.rank === 2 ? '🥈 2.' : st.rank === 3 ? '🥉 3.' : `${st.rank}.`}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {st.name}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 900, color: '#1368ce' }}>
                        {st.score} pont
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '12px',
                          background: st.correctCount === questions.length ? 'rgba(38,137,12,0.1)' : 'rgba(0,0,0,0.04)',
                          color: st.correctCount === questions.length ? '#26890c' : 'var(--text-primary)'
                        }}>
                          {st.correctCount} / {questions.length} ({questions.length > 0 ? Math.round((st.correctCount / questions.length) * 100) : 0}%)
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {st.avgTimeSec} mp
                      </td>
                    </tr>
                  ))}
                  {sortedStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Még nincsenek tanulói eredmények ebben a munkamenetben.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
