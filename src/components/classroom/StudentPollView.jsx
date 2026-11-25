import React, { useState, useEffect } from 'react';
import { pollService } from '../../services/pollService';
import MathText from '../ui/MathText';

export default function StudentPollView() {
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inputs
  const [wordInput, setWordInput] = useState('');
  const [studentName, setStudentName] = useState(() => localStorage.getItem('schola_student_name') || '');
  
  // Quiz state
  const [quizStartTime, setQuizStartTime] = useState(Date.now());
  const [quizResult, setQuizResult] = useState(null);

  // Exit ticket state
  const [ticketQ1, setTicketQ1] = useState('');
  const [ticketQ2, setTicketQ2] = useState('');
  const [ticketQ3, setTicketQ3] = useState(5);

  const loadPoll = async () => {
    try {
      const data = await pollService.getPoll();
      if (data) {
        setPoll(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPoll();
    setQuizStartTime(Date.now());
    const interval = setInterval(loadPoll, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSaveName = (name) => {
    setStudentName(name);
    localStorage.setItem('schola_student_name', name);
  };

  const handleVoteChoice = async (optionId) => {
    if (!poll?.isOpen || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await pollService.submitVote({ optionId });
      setPoll(updated);
      setHasVoted(true);
    } catch (err) {
      alert('Hiba történt a szavazás során: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteQuiz = async (optionId) => {
    if (!poll?.isOpen || isSubmitting) return;
    setIsSubmitting(true);
    const responseTimeMs = Math.max(500, Date.now() - quizStartTime);
    const nameToUse = studentName.trim() || 'Névtelen Diák';
    
    try {
      const updated = await pollService.submitVote({
        optionId,
        quizAnswer: {
          studentName: nameToUse,
          optionId,
          responseTimeMs
        }
      });
      setPoll(updated);
      const isCorrect = optionId === poll.correctOptionId || poll.options?.find(o => o.id === optionId)?.isCorrect;
      const points = isCorrect ? Math.max(200, Math.round(1000 - (responseTimeMs / 30000) * 800)) : 0;
      setQuizResult({ isCorrect, points, chosenOptionId: optionId });
      setHasVoted(true);
    } catch (err) {
      alert('Hiba történt: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteWord = async (e) => {
    e.preventDefault();
    if (!wordInput.trim() || !poll?.isOpen || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await pollService.submitVote({ word: wordInput.trim() });
      setPoll(updated);
      setWordInput('');
      setHasVoted(true);
    } catch (err) {
      alert('Hiba történt: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteRating = async (ratingVal) => {
    if (!poll?.isOpen || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await pollService.submitVote({ rating: ratingVal });
      setPoll(updated);
      setHasVoted(true);
    } catch (err) {
      alert('Hiba történt: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteExitTicket = async (e) => {
    e.preventDefault();
    if (!poll?.isOpen || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await pollService.submitVote({
        exitTicket: {
          studentName: studentName.trim() || 'Anonim Diák',
          q1: ticketQ1.trim(),
          q2: ticketQ2.trim(),
          q3: ticketQ3
        }
      });
      setPoll(updated);
      setHasVoted(true);
    } catch (err) {
      alert('Hiba történt a beküldés során: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        color: '#f4f4f5',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              {poll?.type === 'quiz' ? '⚡' : poll?.type === 'exit-ticket' ? '🎫' : '📊'}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '1.5px' }}>
                {poll?.type === 'quiz' ? 'SCHOLA KVÍZ' : poll?.type === 'exit-ticket' ? 'KILÉPŐKÁRTYA' : 'SCHOLA POLL'}
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                {poll?.type === 'quiz' ? 'Élő Kvíz Versenymód' : poll?.type === 'exit-ticket' ? '3 Perces Óra Végi Reflexió' : 'Élő Osztálytermi Szavazás'}
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '12px',
              background: poll?.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: poll?.isOpen ? '#34d399' : '#f87171',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: poll?.isOpen ? '#34d399' : '#f87171' }} />
            {poll?.isOpen ? 'Nyitva' : 'Lezárva'}
          </span>
        </div>

        {/* Optional Student Name Bar */}
        {(poll?.type === 'quiz' || poll?.type === 'exit-ticket') && !hasVoted && (
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Add meg a neved vagy monogramod..."
              value={studentName}
              onChange={(e) => handleSaveName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: '13px'
              }}
            />
          </div>
        )}

        {/* Question Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.12))',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            marginBottom: '20px'
          }}
        >
          <div style={{ fontSize: '11px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
            {poll?.type === 'exit-ticket' ? 'Óra Végi Értékelés' : 'Kérdés'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px', color: '#fff', lineHeight: 1.35, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <MathText text={poll?.question || 'Kérdés betöltése...'} />
          </div>
        </div>

        {/* Closed voting message */}
        {!poll?.isOpen && (
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              textAlign: 'center',
              marginBottom: '16px'
            }}
          >
            🔒 A szavazást / kvízt a tanár lezárta. Figyeld a kivetítőt az eredményekért!
          </div>
        )}

        {/* Has Voted Confirmation */}
        {hasVoted ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '28px 20px',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            {quizResult ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                  {quizResult.isCorrect ? '🎉' : '❌'}
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, color: quizResult.isCorrect ? '#10b981' : '#ef4444' }}>
                  {quizResult.isCorrect ? 'Helyes válasz!' : 'Sajnos nem talált!'}
                </h3>
                {quizResult.isCorrect && (
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', margin: '10px 0' }}>
                    +{quizResult.points} pont!
                  </div>
                )}
                <p style={{ fontSize: '13px', color: '#a1a1aa' }}>
                  Figyeld a táblát a pontszámokért és a következő kérdésért!
                </p>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    fontSize: '28px'
                  }}
                >
                  ✓
                </div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: '#fff' }}>
                  {poll?.type === 'exit-ticket' ? 'Kilépőkártya sikeresen rögzítve!' : 'Köszönjük a szavazatodat!'}
                </h3>
                <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '8px', lineHeight: 1.4 }}>
                  {poll?.type === 'exit-ticket'
                    ? 'A válaszaid megérkeztek a tanári táblára. Köszönjük a mai órai figyelmedet!'
                    : 'A válaszod rögzítésre került. Figyeld a kivetítőt, az eredmények élőben frissülnek a táblán!'}
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setHasVoted(false);
                setQuizResult(null);
                setQuizStartTime(Date.now());
              }}
              style={{
                marginTop: '18px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Válasz módosítása / Újra
            </button>
          </div>
        ) : (
          /* Active Voting Modes */
          <div>
            {/* Multiple Choice Mode */}
            {poll?.type === 'choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(poll.options || []).map((opt, idx) => (
                  <button
                    key={opt.id || idx}
                    disabled={!poll.isOpen || isSubmitting}
                    onClick={() => handleVoteChoice(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1.5px solid ${opt.color || '#3b82f6'}`,
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: poll.isOpen ? 'pointer' : 'not-allowed',
                      opacity: poll.isOpen ? 1 : 0.6,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: opt.color || '#3b82f6',
                        color: '#fff',
                        fontWeight: '800',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {LETTERS[idx] || (idx + 1)}
                    </span>
                    <span style={{ flex: 1, lineHeight: 1.35, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      <MathText text={opt.text} />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Quiz Mode (Live Arena) */}
            {poll?.type === 'quiz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#93c5fd', marginBottom: '4px' }}>
                  ⚡ Minél gyorsabban válaszolsz helyesen, annál több pontot kapsz!
                </div>
                {(poll.options || []).map((opt, idx) => (
                  <button
                    key={opt.id || idx}
                    disabled={!poll.isOpen || isSubmitting}
                    onClick={() => handleVoteQuiz(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 18px',
                      borderRadius: '12px',
                      background: opt.color || '#3b82f6',
                      border: 'none',
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: '700',
                      textAlign: 'left',
                      cursor: poll.isOpen ? 'pointer' : 'not-allowed',
                      opacity: poll.isOpen ? 1 : 0.6,
                      boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                      transition: 'transform 0.1s ease',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.25)',
                        color: '#fff',
                        fontWeight: '800',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {LETTERS[idx] || (idx + 1)}
                    </span>
                    <span style={{ flex: 1, lineHeight: 1.35, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      <MathText text={opt.text} />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Exit Ticket Mode (3 Questions) */}
            {poll?.type === 'exit-ticket' && (
              <form onSubmit={handleVoteExitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#93c5fd', marginBottom: '6px' }}>
                    1. Mi volt a legfontosabb gondolat, amit ma megértettél?
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Írd ide a saját szavaiddal a legfontosabb tanulságot..."
                    value={ticketQ1}
                    onChange={(e) => setTicketQ1(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#fca5a5', marginBottom: '6px' }}>
                    2. Mi maradt még homályos vagy nehezen érthető?
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Kérdés, képlet vagy részlet, amire még vissza kell térnünk..."
                    value={ticketQ2}
                    onChange={(e) => setTicketQ2(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#fcd34d', marginBottom: '8px' }}>
                    3. Milyen hangulatban távozol a mai óráról? ({ticketQ3}/5)
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setTicketQ3(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '32px',
                          color: star <= ticketQ3 ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!poll.isOpen || isSubmitting}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: poll.isOpen ? 'pointer' : 'not-allowed',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                    marginTop: '6px'
                  }}
                >
                  Kilépőkártya Beküldése
                </button>
              </form>
            )}

            {/* Word Cloud Mode */}
            {poll?.type === 'wordcloud' && (
              <form onSubmit={handleVoteWord} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  maxLength={40}
                  required
                  placeholder="Írj be egy szót vagy rövid kifejezést..."
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                />
                <button
                  type="submit"
                  disabled={!poll.isOpen || isSubmitting || !wordInput.trim()}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#3b82f6',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: (poll.isOpen && wordInput.trim()) ? 'pointer' : 'not-allowed',
                    opacity: (poll.isOpen && wordInput.trim()) ? 1 : 0.6,
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  Szó beküldése a felhőbe
                </button>
              </form>
            )}

            {/* Rating Mode */}
            {poll?.type === 'rating' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={!poll.isOpen || isSubmitting}
                      onClick={() => handleVoteRating(star)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '44px',
                        color: '#f59e0b',
                        cursor: poll.isOpen ? 'pointer' : 'not-allowed',
                        padding: '4px',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '13px', color: '#a1a1aa' }}>
                  Kattints a megfelelő csillagra az értékelés leadásához (1 = leggyengébb, 5 = kiváló)
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
