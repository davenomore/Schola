import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Plus } from 'lucide-react';

const Timer = () => {
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [totalTime, setTotalTime] = useState(0); // in seconds, to calculate progress
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'digital' | 'visual'>('visual');
  
  // Ref for the interval to be able to clear it
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
    }
  }, [timeLeft, isRunning]);

  const addTime = (minutes: number) => {
    const additionalTarget = minutes * 60;
    if (!isRunning && timeLeft === 0) {
      // Starting fresh
      setTimeLeft(additionalTarget);
      setTotalTime(additionalTarget);
    } else {
      // Adding more time implies extending the target
      setTimeLeft(prev => prev + additionalTarget);
      setTotalTime(prev => prev + additionalTarget);
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
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progress logic
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  
  // Colors based on state
  const isFinished = totalTime > 0 && timeLeft === 0;
  const isWarning = timeLeft > 0 && timeLeft <= 60; // 1 minute or less warning

  let strokeColor = 'var(--accent-blue)';
  if (isFinished) {
    strokeColor = '#f85149'; // red when finished
  } else if (isWarning) {
    strokeColor = '#d29922'; // yellow warning
  } else if (!isRunning && timeLeft > 0) {
    strokeColor = 'var(--text-secondary)'; // gray when paused
  }

  // SVG parameters for Digital mode
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isFinished ? 0 : circumference - (progress / 100) * circumference;

  // Visual Mode parameters (Time Timer style)
  // Max 60 mins visual representation
  const visualMinutes = Math.min((timeLeft / 60), 60);
  const visualFraction = visualMinutes / 60;
  const pieRadius = 65; // For a strokeWidth of 130 and SVG size 280, it fills the inner part perfectly
  const pieCircumference = 2 * Math.PI * pieRadius;
  const pieDasharray = `${visualFraction * pieCircumference} ${pieCircumference}`;

  const renderVisualClockFace = () => {
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const isFive = i % 5 === 0;
      const angle = (i * 6 * Math.PI) / 180;
      // Center at 140, 140
      const x1 = 140 + Math.sin(angle) * (isFive ? 122 : 130);
      const y1 = 140 - Math.cos(angle) * (isFive ? 122 : 130);
      const x2 = 140 + Math.sin(angle) * 136;
      const y2 = 140 - Math.cos(angle) * 136;
      ticks.push(<line key={`tick-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth={isFive ? 3 : 1} />);
      
      if (isFive) {
        const textX = 140 + Math.sin(angle) * 105;
        const textY = 140 - Math.cos(angle) * 105;
        ticks.push(
          <text key={`text-${i}`} x={textX} y={textY} fill="#111" fontSize="16" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
            {i}
          </text>
        );
      }
    }
    return ticks;
  };

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', paddingBottom: '80px', boxSizing: 'border-box' }}>
      
      <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TimerIcon size={20} color="var(--accent-blue)" />
          <h2 style={{ margin: 0, fontSize: '18px' }}>Időzítő</h2>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-glass)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-glass)' }}>
          <button 
            onClick={() => setMode('visual')}
            style={{ 
              padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: mode === 'visual' ? 'var(--accent-blue)' : 'transparent',
              color: mode === 'visual' ? 'white' : 'var(--text-secondary)'
            }}
          >
            Klasszikus
          </button>
          <button 
            onClick={() => setMode('digital')}
            style={{ 
              padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: mode === 'digital' ? 'var(--accent-blue)' : 'transparent',
              color: mode === 'digital' ? 'white' : 'var(--text-secondary)'
            }}
          >
            Digitális
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '280px', height: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0 40px 0' }}>
        
        {mode === 'digital' && (
          <>
            <svg width="280" height="280" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx="140" cy="140" r={radius} fill="transparent" stroke="var(--bg-surface)" strokeWidth="12" />
              <circle
                cx="140" cy="140" r={radius} fill="transparent" stroke={strokeColor} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
              <div style={{ 
                fontFamily: 'monospace', fontSize: '56px', fontWeight: 'bold', 
                color: isFinished ? '#f85149' : 'white', textShadow: '0 4px 10px rgba(0,0,0,0.5)', letterSpacing: '-2px', lineHeight: 1
              }}>
                {formatTime(timeLeft)}
              </div>
              {isFinished && (
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f85149', marginTop: '10px', animation: 'pulse 1.5s infinite' }}>
                  Lejárt!
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'visual' && (
          <div style={{ 
            width: '280px', height: '280px', background: '#f8f9fa', borderRadius: '40px', 
            boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.3)', position: 'relative'
          }}>
            <svg width="280" height="280" style={{ position: 'absolute' }}>
              {/* Ticks and Numbers */}
              {renderVisualClockFace()}
            </svg>
            <svg width="280" height="280" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              {/* Red Wedge */}
              {timeLeft > 0 && (
                <circle
                  cx="140" cy="140" r={pieRadius} fill="transparent" stroke="#ea4335" strokeWidth="130"
                  strokeDasharray={pieDasharray}
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
              )}
              {/* Center dot */}
              <circle cx="140" cy="140" r="6" fill="#111" />
            </svg>
            {isFinished && (
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'rgba(234,67,53,0.9)', color: 'white', padding: '8px 16px', borderRadius: '12px',
                fontWeight: 'bold', fontSize: '18px', animation: 'pulse 1.5s infinite', zIndex: 10
              }}>
                Lejárt!
              </div>
            )}
            {/* Small digital readout floating at bottom edge */}
            <div style={{
              position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-surface-glass)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-glass)',
              padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)'
            }}>
              {formatTime(timeLeft)}
            </div>
          </div>
        )}

      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <button 
          onClick={resetTimer}
          className="glass-panel"
          style={{ width: '48px', height: '48px', borderRadius: '24px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', background: 'var(--bg-surface)' }}
        >
          <RotateCcw size={20} color="var(--text-secondary)" />
        </button>
        
        <button 
          onClick={toggleTimer}
          disabled={timeLeft === 0}
          className="btn-primary"
          style={{ 
            width: '64px', height: '64px', borderRadius: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0,
            background: isRunning ? 'var(--accent-green)' : (timeLeft === 0 ? 'var(--bg-surface)' : 'var(--accent-blue)'),
            boxShadow: isRunning ? '0 4px 15px rgba(35,134,54,0.4)' : (timeLeft === 0 ? 'none' : '0 4px 15px rgba(47,129,247,0.4)'),
            opacity: timeLeft === 0 ? 0.5 : 1
          }}
        >
          {isRunning ? <Pause size={28} fill="#fff" /> : <Play size={28} fill="#fff" style={{ marginLeft: '4px' }} />}
        </button>
      </div>

      {/* Quick Add Buttons */}
      <div style={{ width: '100%', maxWidth: '350px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>+ Idő Hozzáadása</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
          {[1, 3, 5, 10, 15].map(min => (
            <button
              key={min}
              onClick={() => addTime(min)}
              className="glass-panel"
              style={{
                flex: '1 0 calc(33.333% - 10px)',
                padding: '10px 0',
                borderRadius: '12px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-surface-glass)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'background 0.2s'
              }}
            >
              <Plus size={14} /> {min}p
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timer;
