import React, { useState, useEffect } from 'react';

export default function TeacherTimer({ isDark }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('visual');

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsRunning(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const addTimeSeconds = (seconds) => {
    if (!isRunning && timeLeft === 0) {
      setTimeLeft(seconds);
      setTotalTime(seconds);
    } else {
      setTimeLeft((prev) => prev + seconds);
      setTotalTime((prev) => prev + seconds);
    }
  };

  const toggleTimer = () => {
    if (timeLeft > 0) {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setTotalTime(0);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const isFinished = totalTime > 0 && timeLeft === 0;
  const isWarning = timeLeft > 0 && timeLeft <= 60;

  let strokeColor = isDark ? '#ef4444' : '#dc2626';
  if (isFinished) strokeColor = '#f85149';
  else if (isWarning) strokeColor = '#d29922';
  else if (!isRunning && timeLeft > 0) strokeColor = 'var(--text-secondary)';

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isFinished ? 0 : circumference - (progress / 100) * circumference;

  const visualMinutes = Math.min(timeLeft / 60, 60);
  const visualFraction = visualMinutes / 60;
  const pieRadius = 45;
  const pieCircumference = 2 * Math.PI * pieRadius;
  const pieDasharray = `${visualFraction * pieCircumference} ${pieCircumference}`;

  const renderVisualClockFace = () => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const isFive = i % 5 === 0;
      const angle = (i * 6 * Math.PI) / 180;
      const x1 = 140 + Math.sin(angle) * (isFive ? 120 : 128);
      const y1 = 140 - Math.cos(angle) * (isFive ? 120 : 128);
      const x2 = 140 + Math.sin(angle) * 136;
      const y2 = 140 - Math.cos(angle) * 136;
      ticks.push(
        <line
          key={`tick-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="var(--text-secondary)"
          strokeWidth={isFive ? 3 : 1}
        />
      );

      if (isFive) {
        const textX = 140 + Math.sin(angle) * 102;
        const textY = 140 - Math.cos(angle) * 102;
        ticks.push(
          <text
            key={`text-${i}`}
            x={textX}
            y={textY}
            fill="var(--text-primary)"
            fontSize="15"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {i}
          </text>
        );
      }
    }
    return ticks;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        width: '100%',
        padding: '8px 16px 12px 16px',
        boxSizing: 'border-box'
      }}
    >
      {/* Fejléc: Cím és üzemmódváltó */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '640px', flexShrink: 0 }}>
        <h2 className="card-title" style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Időzítő
        </h2>
        <div style={{ display: 'flex', background: 'var(--hover-bg)', borderRadius: '8px', padding: '3px', border: '1px solid var(--panel-border)' }}>
          <button
            onClick={() => setTimerMode('visual')}
            style={{
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: timerMode === 'visual' ? 'var(--text-primary)' : 'transparent',
              color: timerMode === 'visual' ? 'var(--bg-color)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Klasszikus
          </button>
          <button
            onClick={() => setTimerMode('digital')}
            style={{
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: timerMode === 'digital' ? 'var(--text-primary)' : 'transparent',
              color: timerMode === 'digital' ? 'var(--bg-color)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Digitális
          </button>
        </div>
      </div>

      {/* Óra felület */}
      <div
        style={{
          position: 'relative',
          width: 'min(46vh, 440px)',
          height: 'min(46vh, 440px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '8px 0',
          flexShrink: 0
        }}
      >
        {timerMode === 'digital' && (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%', position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx="140" cy="140" r={radius} fill="transparent" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} strokeWidth="14" />
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="transparent"
                stroke={strokeColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 'min(10vw, 68px)', fontWeight: 'bold', color: isFinished ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-2px', lineHeight: 1 }}>
                {formatTime(timeLeft)}
              </div>
              {isFinished ? (
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginTop: '10px' }}>Lejárt az idő!</div>
              ) : totalTime > 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: '500' }}>
                  Összesen: {formatTime(totalTime)}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {timerMode === 'visual' && (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--hover-bg)',
                borderRadius: '36px',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                position: 'relative',
                border: '1px solid var(--panel-border)',
                overflow: 'hidden'
              }}
            >
              <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                {renderVisualClockFace()}
              </svg>
              <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                {timeLeft > 0 && (
                  <circle
                    cx="140"
                    cy="140"
                    r={pieRadius}
                    fill="transparent"
                    stroke={isDark ? '#ef4444' : '#dc2626'}
                    strokeWidth="90"
                    strokeDasharray={pieDasharray}
                    style={{ transition: 'stroke-dasharray 1s linear' }}
                  />
                )}
                <circle cx="140" cy="140" r="7" fill="var(--text-primary)" />
              </svg>

              {isFinished && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(220, 38, 38, 0.95)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    zIndex: 10,
                    boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)'
                  }}
                >
                  Lejárt az idő!
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '12px',
                background: 'var(--panel-bg)',
                color: isFinished ? '#ef4444' : 'var(--text-primary)',
                padding: '4px 18px',
                borderRadius: '10px',
                fontSize: '20px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                border: '1px solid var(--panel-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                letterSpacing: '1px'
              }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        )}
      </div>

      {/* Fő vezérlő gombok */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={resetTimer}
          className="btn-outline"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            transition: 'all 0.15s ease'
          }}
          title="Visszaállítás"
        >
          ↺
        </button>
        <button
          onClick={toggleTimer}
          disabled={timeLeft === 0}
          className="btn-primary"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '28px',
            background: isRunning ? '#dc2626' : timeLeft === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
            color: 'var(--bg-color)',
            border: 'none',
            opacity: timeLeft === 0 ? 0.4 : 1,
            boxShadow: isRunning ? '0 4px 14px rgba(220, 38, 38, 0.35)' : '0 4px 14px rgba(0,0,0,0.15)',
            cursor: timeLeft === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            marginTop: 0
          }}
          title={isRunning ? 'Szünet' : 'Indítás'}
        >
          {isRunning ? '⏸' : '▶'}
        </button>
      </div>

      {/* Idő hozzáadása opciók */}
      <div style={{ width: '100%', maxWidth: '640px', flexShrink: 0 }}>
        <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          + Idő hozzáadása
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {[
            { label: '+30mp', sec: 30 },
            { label: '+1p', sec: 60 },
            { label: '+2p', sec: 120 },
            { label: '+3p', sec: 180 },
            { label: '+5p', sec: 300 },
            { label: '+10p', sec: 600 },
            { label: '+15p', sec: 900 },
            { label: '+45p (óra)', sec: 2700 }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => addTimeSeconds(item.sec)}
              className="btn-outline"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '6px',
                background: 'var(--hover-bg)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
