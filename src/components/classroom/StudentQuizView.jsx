import React, { useState, useEffect, useRef } from 'react';
import { quizArenaService } from '../../services/quizArenaService';
import MathText from '../ui/MathText';

export default function StudentQuizView() {
  const [session, setSession] = useState(null);
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('schola_quiz_player_id') || '');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('schola_quiz_player_name') || '');
  const [pinInput, setPinInput] = useState(() => {
    const urlPin = new URLSearchParams(window.location.search).get('pin');
    return urlPin || '';
  });

  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Answering state
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(20);
  const [numericInput, setNumericInput] = useState('');

  const prevQuestionIndex = useRef(-1);

  // Poll state every 1.5s
  useEffect(() => {
    let interval = null;

    const checkState = async () => {
      const state = await quizArenaService.getState('student');
      if (state && state.id) {
        setSession(state);

        // Ha a diák még nem lépett be és nincs beírva PIN, automatikusan kitöltjük az aktív játék PIN-jét (pl. állandó QR kód esetén)
        if (!hasJoined && state.pin) {
          setPinInput(prev => (prev && prev.trim().length > 0) ? prev : state.pin);
        }

        // Ha új kérdés indult
        if (state.status === 'question' && state.currentQuestionIndex !== prevQuestionIndex.current) {
          prevQuestionIndex.current = state.currentQuestionIndex;
          setSelectedOptionId(null);
          setNumericInput('');
          setHasAnswered(false);
          setAnswerResult(null);
          setQuestionStartTime(Date.now());
          setTimeLeft(state.timeLimit || 20);
        }

        // Ha a játékos már benne van
        if (playerId && state.players) {
          const me = state.players.find(p => p.id === playerId || p.name.toLowerCase() === playerName.toLowerCase());
          if (me) {
            setHasJoined(true);
            if (me.answered && !hasAnswered) {
              setHasAnswered(true);
            }
          }
        }
      }
    };

    checkState();
    interval = setInterval(checkState, 1500);
    return () => clearInterval(interval);
  }, [playerId, playerName, hasAnswered]);

  // Countdown timer during question
  useEffect(() => {
    if (session?.status !== 'question' || hasAnswered) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [session?.status, hasAnswered]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setJoinError('Kérlek adj meg egy nevet!');
      return;
    }
    setJoinError('');
    setIsJoining(true);

    try {
      const res = await quizArenaService.joinSession({
        name: playerName.trim(),
        pin: pinInput.trim()
      });

      if (res && res.success) {
        setPlayerId(res.playerId);
        localStorage.setItem('schola_quiz_player_id', res.playerId);
        localStorage.setItem('schola_quiz_player_name', playerName.trim());
        setHasJoined(true);
      } else {
        setJoinError(res?.message || 'Sikertelen csatlakozás. Ellenőrizd a PIN-kódot!');
      }
    } catch (err) {
      setJoinError('Hálózati hiba: ' + err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleAnswer = async (optionId, numericAnswer = null) => {
    if (hasAnswered || session?.status !== 'question') return;
    const responseTimeMs = Math.max(200, Date.now() - questionStartTime);
    setSelectedOptionId(optionId);
    setHasAnswered(true);

    try {
      const res = await quizArenaService.submitAnswer({
        playerId,
        optionId,
        numericAnswer,
        responseTimeMs
      });
      if (res && res.success) {
        setAnswerResult(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentQ = session?.currentQuestion;
  const myPlayer = session?.players?.find(p => p.id === playerId || p.name.toLowerCase() === playerName.toLowerCase());

  // Rank calculation
  const myRank = (() => {
    if (!session?.players || !playerId) return 1;
    const sorted = [...session.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const idx = sorted.findIndex(p => p.id === playerId || p.name.toLowerCase() === playerName.toLowerCase());
    return idx >= 0 ? idx + 1 : 1;
  })();

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#3b0764', // Dark purple arena theme
        backgroundImage: 'radial-gradient(circle at 50% 10%, #682ab8 0%, #30106b 100%)',
        color: '#ffffff',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        
        {/* TOP BRAND BAR */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '2px',
            textShadow: '0 4px 12px rgba(0,0,0,0.4)',
            color: '#fff'
          }}>
            SCHOLA <span style={{ color: '#ffa602' }}>!</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Kvíz Aréna
          </div>
        </div>

        {/* 1. JOIN SCREEN */}
        {!hasJoined ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px 24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            color: '#18181b'
          }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, textAlign: 'center' }}>
              Csatlakozás a játékhoz
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#71717a', textAlign: 'center' }}>
              Add meg a kivetítőn látható PIN-t és a beceneved!
            </p>

            {joinError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px',
                textAlign: 'center'
              }}>
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#71717a', marginBottom: '4px' }}>
                  Játék PIN:
                </label>
                <input
                  type="text"
                  placeholder="Pl. 582914"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '2px solid #e4e4e7',
                    fontSize: '16px',
                    fontWeight: 700,
                    textAlign: 'center',
                    letterSpacing: '2px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#71717a', marginBottom: '4px' }}>
                  Beceneved:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Pl. Peti, Anna..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '2px solid #e4e4e7',
                    fontSize: '16px',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isJoining}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#333333',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: isJoining ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  marginTop: '8px'
                }}
              >
                {isJoining ? 'Csatlakozás...' : 'Belépés!'}
              </button>
            </form>
          </div>
        ) : session?.status === 'lobby' ? (
          /* 2. LOBBY WAITING SCREEN */
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '20px',
            padding: '36px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '14px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px 0' }}>
              Bent vagy a játékban!
            </h2>
            <div style={{
              display: 'inline-block',
              padding: '8px 20px',
              borderRadius: '20px',
              background: '#ffa602',
              color: '#000',
              fontWeight: 800,
              fontSize: '18px',
              margin: '12px 0 20px'
            }}>
              {playerName}
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0 }}>
              Figyeld a tanári kivetítőt!<br />A kvíz hamarosan elindul...
            </p>
          </div>
        ) : session?.status === 'question' ? (
          /* 3. ACTIVE QUESTION ANSWERING SCREEN (4 ARENA BLOCKS) */
          <div>
            {/* Timer and Question Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              padding: '0 4px'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffa602' }}>
                {(session?.currentQuestionIndex || 0) + 1}. kérdés / {session?.totalQuestions || 1}
              </span>
              <span style={{
                background: timeLeft <= 5 ? '#e21b3c' : 'rgba(255,255,255,0.2)',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '14px'
              }}>
                ⏱️ {timeLeft} mp
              </span>
            </div>

            {/* Question Text Box on mobile */}
            <div style={{
              background: '#ffffff',
              color: '#18181b',
              borderRadius: '14px',
              padding: '16px 18px',
              fontSize: (currentQ?.question?.length || 0) > 80 ? '14px' : '16px',
              fontWeight: 700,
              marginBottom: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              lineHeight: 1.4,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}>
              <MathText text={currentQ?.question || 'Kérdés...'} />
            </div>

            {hasAnswered ? (
              /* Already answered, waiting */
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800 }}>
                  Válaszod elküldve!
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  Várakozás az idő lejártára vagy a többiekre...
                </p>
              </div>
            ) : currentQ?.type === 'true-false' ? (
              /* A) TRUE / FALSE TOUCH BUTTONS */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <button
                  onClick={() => handleAnswer('opt-true')}
                  style={{
                    minHeight: '140px',
                    borderRadius: '18px',
                    border: 'none',
                    background: '#26890c',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(38, 137, 12, 0.4)',
                    gap: '10px',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <span style={{ fontSize: '44px', lineHeight: 1 }}>✓</span>
                  <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '1px' }}>IGAZ</span>
                </button>

                <button
                  onClick={() => handleAnswer('opt-false')}
                  style={{
                    minHeight: '140px',
                    borderRadius: '18px',
                    border: 'none',
                    background: '#e21b3c',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(226, 27, 60, 0.4)',
                    gap: '10px',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <span style={{ fontSize: '44px', lineHeight: 1 }}>✗</span>
                  <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '1px' }}>HAMIS</span>
                </button>
              </div>
            ) : currentQ?.type === 'numeric' ? (
              /* B) NUMERIC CALCULATION INPUT & KEYPAD */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!numericInput.trim()) return;
                  const parsed = parseFloat(numericInput.replace(',', '.'));
                  if (isNaN(parsed)) return;
                  handleAnswer(null, parsed);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)'
                }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={numericInput}
                    onChange={(e) => setNumericInput(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '32px',
                      fontWeight: 900,
                      textAlign: 'center',
                      outline: 'none',
                      letterSpacing: '1px'
                    }}
                  />
                  {currentQ?.unit && (
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffa602', marginLeft: '8px', flexShrink: 0 }}>
                      {currentQ.unit}
                    </span>
                  )}
                </div>

                {/* Quick numeric buttons for phone touch screens */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', ','].map(char => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => setNumericInput(prev => {
                        if (char === '-' && prev.length > 0) return prev;
                        if (char === ',' && (prev.includes(',') || prev.includes('.'))) return prev;
                        return prev + char;
                      })}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: '22px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {char}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNumericInput(prev => prev.slice(0, -1))}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#fca5a5',
                      fontWeight: 800,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    ⌫ Törlés
                  </button>
                  <button
                    type="submit"
                    disabled={!numericInput.trim()}
                    style={{
                      flex: 2,
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: numericInput.trim() ? '#26890c' : 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '16px',
                      cursor: numericInput.trim() ? 'pointer' : 'not-allowed',
                      boxShadow: numericInput.trim() ? '0 6px 20px rgba(38,137,12,0.4)' : 'none'
                    }}
                  >
                    VÁLASZ BEKÜLDÉSE ➔
                  </button>
                </div>
              </form>
            ) : (
              /* C) 4 BIG ARENA TOUCH BLOCKS (Multiple choice) */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {(currentQ?.options || []).map((opt) => {
                  const len = opt.text?.length || 0;
                  const fontSize = len > 55 ? '12px' : len > 30 ? '13px' : '15px';
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(opt.id)}
                      style={{
                        minHeight: '115px',
                        height: 'auto',
                        borderRadius: '16px',
                        border: 'none',
                        background: opt.color || '#3b82f6',
                        color: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '14px 10px',
                        cursor: 'pointer',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                        transition: 'transform 0.1s ease',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      <span style={{ fontSize: '28px', marginBottom: '4px', flexShrink: 0 }}>{opt.shape || '▲'}</span>
                      <span style={{ fontSize, fontWeight: 700, lineHeight: 1.3, width: '100%' }}>
                        <MathText text={opt.text} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (session?.status === 'reveal' || session?.status === 'leaderboard') ? (
          /* 4. REVEAL / LEADERBOARD FEEDBACK SCREEN */
          <div style={{
            background: answerResult?.isCorrect ? '#26890c' : '#e21b3c',
            borderRadius: '20px',
            padding: '36px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            color: '#fff'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>
              {answerResult?.isCorrect ? '🎉' : '❌'}
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 6px 0' }}>
              {answerResult?.isCorrect ? 'HELYES VÁLASZ!' : 'SAJNOS TÉVES!'}
            </h2>
            {answerResult?.isCorrect && (
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#ffa602', margin: '10px 0' }}>
                +{answerResult?.points || 0} pont!
              </div>
            )}
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '12px',
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-around',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Összpontszám</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{myPlayer?.score || 0}</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Helyezésed</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{myRank}. hely</div>
              </div>
            </div>
          </div>
        ) : session?.status === 'podium' ? (
          /* 5. FINAL PODIUM / WINNER SCREEN */
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '36px 24px',
            textAlign: 'center',
            color: '#18181b',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '10px' }}>
              {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎖️'}
            </div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 900 }}>
              Kvíz Befejezve!
            </h2>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#71717a', marginBottom: '14px' }}>
              {myRank}. helyezett lettél!
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 900,
              color: '#46178f',
              margin: '10px 0 20px'
            }}>
              {myPlayer?.score || 0} pont
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>
              Köszönjük a részvételt! Figyeld a táblát a végső dobogós helyezettekért!
            </p>
          </div>
        ) : null}

        {/* BOTTOM USER STATUS */}
        {hasJoined && (
          <div style={{
            marginTop: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.25)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px'
          }}>
            <span style={{ fontWeight: 700 }}>👤 {playerName}</span>
            <span style={{ color: '#ffa602', fontWeight: 800 }}>⭐ {myPlayer?.score || 0} pont</span>
          </div>
        )}

      </div>
    </div>
  );
}
