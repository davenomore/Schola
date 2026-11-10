import React, { useState, useEffect, useRef, useMemo } from 'react';

const TeacherTools = () => {
  const [activeTool, setActiveTool] = useState('randomizer');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('visual');

  // Randomizer State
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [randomStudent, setRandomStudent] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [answerRecords, setAnswerRecords] = useState([]);
  const answerRecordsRef = useRef([]);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const canvasRef = useRef(null);
  const spinningRef = useRef(false);
  const animFrameRef = useRef(0);

  // Team Generator State
  const [teams, setTeams] = useState([]);
  const [teamSize, setTeamSize] = useState(3);

  // Grade Calculator State
  const [maxScore, setMaxScore] = useState(50);
  const [thresholds, setThresholds] = useState([
    { grade: 5, label: 'Jeles', percent: 85, color: '#3fb950' },
    { grade: 4, label: 'Jó', percent: 70, color: '#58a6ff' },
    { grade: 3, label: 'Közepes', percent: 55, color: '#d29922' },
    { grade: 2, label: 'Elégséges', percent: 40, color: '#f0883e' },
  ]);
  const [roundDirection, setRoundDirection] = useState('down');
  const [savedConfigs, setSavedConfigs] = useState(() => {
    try {
      const stored = localStorage.getItem('grade_thresholds');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });
  const [configName, setConfigName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  // Theme observer for canvas and dynamic styling
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Load groups from localStorage
    const savedGroupsStr = localStorage.getItem('ekreta_groups');
    if (savedGroupsStr) {
      try {
        const parsed = JSON.parse(savedGroupsStr);
        setGroups(parsed);
        if (parsed.length > 0) {
          setSelectedGroup(parsed[0].id);
        }
      } catch (e) {
        console.error('Hiba a csoportok betöltésekor:', e);
      }
    }

    // Load answer records
    const savedAnswersStr = localStorage.getItem('ekreta_answer_records');
    if (savedAnswersStr) {
      try {
        const parsed = JSON.parse(savedAnswersStr);
        setAnswerRecords(parsed);
        answerRecordsRef.current = parsed;
      } catch(e) {
        console.error('Hiba a felelet napló betöltésekor:', e);
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
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
      setTimeLeft(prev => prev + seconds);
      setTotalTime(prev => prev + seconds);
    }
  };

  const addTime = (minutes) => {
    addTimeSeconds(minutes * 60);
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

  // Canvas drawing effect
  useEffect(() => {
    if (activeTool !== 'randomizer') return;
    const canvas = canvasRef.current;
    
    const selectedGroupObj = groups.find(g => g.id === selectedGroup);
    const activeStudents = selectedGroupObj?.students?.filter(student => 
      !answerRecords.some(r => r.student === student && r.groupId === selectedGroup)
    ) || [];

    if (!canvas || activeStudents.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 1200;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 24;
    const sliceAngle = (2 * Math.PI) / activeStudents.length;
    const rotRad = (rotation * Math.PI) / 180;

    ctx.clearRect(0, 0, size, size);

    // Outer frame (thick border)
    ctx.beginPath();
    ctx.arc(center, center, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? '#141416' : '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = isDark ? '#27272a' : '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.stroke();

    activeStudents.forEach((student, i) => {
      const startAngle = rotRad + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      
      let bgColor;
      let textColor;
      if (isDark) {
        bgColor = i % 2 === 0 ? '#b91c1c' : '#1e2025';
        if (activeStudents.length % 2 !== 0 && i === activeStudents.length - 1) {
          bgColor = '#111215'; // Prevent same colors touching
        }
        textColor = (bgColor === '#1e2025') ? '#f4f4f5' : '#ffffff';
      } else {
        bgColor = i % 2 === 0 ? '#dc2626' : '#ffffff';
        if (activeStudents.length % 2 !== 0 && i === activeStudents.length - 1) {
          bgColor = '#18181b'; // Prevent same colors touching
        }
        textColor = (bgColor === '#ffffff') ? '#18181b' : '#ffffff';
      }

      // Slice (Solid Color)
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = bgColor;
      ctx.fill();
      
      // Thin separator line
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text radially
      const midAngle = startAngle + sliceAngle / 2;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(midAngle);

      // Determine base font size based on slice count
      let baseFontSize = 38;
      if (activeStudents.length > 25) baseFontSize = 20;
      else if (activeStudents.length > 18) baseFontSize = 24;
      else if (activeStudents.length > 12) baseFontSize = 30;

      ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif`;

      const textStartX = 65;
      const maxAvailableWidth = radius - textStartX - 30;

      // Scale down font if name is too long so full name fits
      let fontSize = baseFontSize;
      while (ctx.measureText(student).width > maxAvailableWidth && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif`;
      }

      let displayName = student;
      if (ctx.measureText(displayName).width > maxAvailableWidth) {
        while (displayName.length > 3 && ctx.measureText(displayName + '…').width > maxAvailableWidth) {
          displayName = displayName.slice(0, -1);
        }
        displayName = displayName + '…';
      }

      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayName, textStartX, 0);

      ctx.restore();
    });

    // Center hub with border and inner accent dot
    ctx.beginPath();
    ctx.arc(center, center, 36, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? '#18181b' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = isDark ? '#3f3f46' : '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 14, 0, 2 * Math.PI);
    ctx.fillStyle = isDark ? '#ef4444' : '#dc2626';
    ctx.fill();
  }, [activeTool, selectedGroup, groups, answerRecords, rotation, isDark]);

  const spinWheel = () => {
    const selectedGroupObj = groups.find(g => g.id === selectedGroup);
    const activeStudents = selectedGroupObj?.students?.filter(student => 
      !answerRecords.some(r => r.student === student && r.groupId === selectedGroup)
    ) || [];

    if (isSpinning || spinningRef.current || activeStudents.length === 0) return;
    
    spinningRef.current = true;
    setIsSpinning(true);
    setShowResult(false);
    setRandomStudent(null);

    const totalRotation = 1800 + Math.random() * 1800;
    const startTime = Date.now();
    const duration = 4000;
    const startRotation = rotation;
    const studentsAtSpin = [...activeStudents];

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + totalRotation * eased;
      setRotation(currentRotation);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        const finalAngle = (360 - (currentRotation % 360)) % 360;
        const sliceAngle = 360 / studentsAtSpin.length;
        const winnerIndex = Math.floor(finalAngle / sliceAngle) % studentsAtSpin.length;
        setRandomStudent(studentsAtSpin[winnerIndex]);
        setIsSpinning(false);
        spinningRef.current = false;
        setShowResult(true);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  const markAsAnswered = (student, groupId) => {
    const currentRecords = answerRecordsRef.current;
    const newRecord = {
      student,
      groupId,
      date: new Date().toISOString(),
    };
    const updated = currentRecords.filter(r => !(r.student === student && r.groupId === groupId));
    updated.push(newRecord);
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    localStorage.setItem('ekreta_answer_records', JSON.stringify(updated));
    setShowResult(false);
    setRandomStudent(null);
  };

  const setGrade = (student, groupId, grade) => {
    const currentRecords = answerRecordsRef.current;
    const updated = currentRecords.map(r => {
      if (r.student === student && r.groupId === groupId) {
        return { ...r, grade };
      }
      return r;
    });
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    localStorage.setItem('ekreta_answer_records', JSON.stringify(updated));
  };

  const restoreStudent = (student, groupId) => {
    const currentRecords = answerRecordsRef.current;
    const updated = currentRecords.filter(r => !(r.student === student && r.groupId === groupId));
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    localStorage.setItem('ekreta_answer_records', JSON.stringify(updated));
  };

  const restoreAll = (groupId) => {
    const currentRecords = answerRecordsRef.current;
    const updated = currentRecords.filter(r => r.groupId !== groupId);
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    localStorage.setItem('ekreta_answer_records', JSON.stringify(updated));
  };

  // Team generator logic
  const generateTeams = () => {
    const group = groups.find(g => g.id === selectedGroup);
    if (!group || !group.students || group.students.length === 0) {
      alert('Ebben a csoportban nincsenek diákok!');
      return;
    }

    const shuffled = [...group.students].sort(() => 0.5 - Math.random());
    const newTeams = [];
    
    // Split into chunks of teamSize
    for (let i = 0; i < shuffled.length; i += teamSize) {
      newTeams.push(shuffled.slice(i, i + teamSize));
    }
    
    setTeams(newTeams);
  };

  // Grade calculation logic
  const calculatePoints = (percent) => {
    const raw = (maxScore * percent) / 100;
    if (roundDirection === 'down') return Math.floor(raw);
    if (roundDirection === 'up') return Math.ceil(raw);
    if (roundDirection === 'math') return Math.round(raw);
    return Number(raw.toFixed(1)); // 'none'
  };

  const saveConfig = () => {
    if (!configName.trim()) return;
    const newConfig = {
      name: configName.trim(),
      thresholds: thresholds.map(t => ({ ...t })),
    };
    const updated = [...savedConfigs, newConfig];
    setSavedConfigs(updated);
    localStorage.setItem('grade_thresholds', JSON.stringify(updated));
    setConfigName('');
    setShowSaveModal(false);
  };

  const loadConfig = (config) => {
    setThresholds(config.thresholds.map(t => ({ ...t })));
    setShowLoadMenu(false);
  };

  const deleteConfig = (index) => {
    const updated = savedConfigs.filter((_, i) => i !== index);
    setSavedConfigs(updated);
    localStorage.setItem('grade_thresholds', JSON.stringify(updated));
  };

  const calculateGradeBounds = () => {
    const bounds = [];
    let currentMax = maxScore;
    
    for (const t of thresholds) {
      const minPoint = calculatePoints(t.percent);
      bounds.push({
        ...t,
        min: minPoint,
        max: currentMax,
        display: `${minPoint} - ${currentMax}`
      });
      currentMax = minPoint - 0.5; // Next bound max is slightly below
      if (roundDirection !== 'none') {
        currentMax = minPoint - 1;
      }
    }
    
    // Fail grade (1)
    bounds.push({
      grade: 1,
      label: 'Elégtelen',
      percent: 0,
      color: '#f85149',
      min: 0,
      max: currentMax,
      display: `0 - ${currentMax}`
    });
    
    return bounds;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      
      {/* Eszközválasztó / Almenü fül */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px', flexShrink: 0 }}>
        <div style={{
          display: 'inline-flex',
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          borderRadius: '8px',
          padding: '3px',
          gap: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <button 
            style={{ 
              cursor: 'pointer', border: 'none',
              background: activeTool === 'randomizer' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'randomizer' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: activeTool === 'randomizer' ? '600' : '500',
              padding: '6px 14px', borderRadius: '6px',
              transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onClick={() => setActiveTool('randomizer')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
              <path d="m16 8-8 8"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            Feleltető (Randomizer)
          </button>
          <button 
            style={{ 
              cursor: 'pointer', border: 'none',
              background: activeTool === 'timer' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'timer' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: activeTool === 'timer' ? '600' : '500',
              padding: '6px 14px', borderRadius: '6px',
              transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onClick={() => setActiveTool('timer')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Időzítő
          </button>
          <button 
            style={{ 
              cursor: 'pointer', border: 'none',
              background: activeTool === 'teams' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'teams' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: activeTool === 'teams' ? '600' : '500',
              padding: '6px 14px', borderRadius: '6px',
              transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onClick={() => setActiveTool('teams')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Csapatgenerátor
          </button>
          <button 
            style={{ 
              cursor: 'pointer', border: 'none',
              background: activeTool === 'grades' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'grades' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: activeTool === 'grades' ? '600' : '500',
              padding: '6px 14px', borderRadius: '6px',
              transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onClick={() => setActiveTool('grades')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Ponthatárok
          </button>
        </div>
      </div>

      <div className="card glass-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
        
        {/* TIMER */}
        {activeTool === 'timer' && (() => {
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

          const visualMinutes = Math.min((timeLeft / 60), 60);
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
              ticks.push(<line key={`tick-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-secondary)" strokeWidth={isFive ? 3 : 1} />);
              
              if (isFive) {
                const textX = 140 + Math.sin(angle) * 102;
                const textY = 140 - Math.cos(angle) * 102;
                ticks.push(
                  <text key={`text-${i}`} x={textX} y={textY} fill="var(--text-primary)" fontSize="15" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                    {i}
                  </text>
                );
              }
            }
            return ticks;
          };

          return (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              height: '100%', 
              width: '100%',
              padding: '8px 16px 12px 16px', 
              boxSizing: 'border-box'
            }}>
              {/* Fejléc: Cím és üzemmódváltó */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '640px', flexShrink: 0 }}>
                <h2 className="card-title" style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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

              {/* Óra felület - Dinamikusan kitölti a magasságot */}
              <div style={{ 
                position: 'relative', 
                width: 'min(46vh, 440px)', 
                height: 'min(46vh, 440px)', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                margin: '8px 0',
                flexShrink: 0
              }}>
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
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      background: 'var(--hover-bg)', 
                      borderRadius: '36px', 
                      boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', 
                      position: 'relative',
                      border: '1px solid var(--panel-border)',
                      overflow: 'hidden'
                    }}>
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
                        <div style={{ 
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
                        }}>
                          Lejárt az idő!
                        </div>
                      )}
                    </div>
                    
                    {/* Digitális időkijelzés a klasszikus óra alatt */}
                    <div style={{ 
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
                    }}>
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                )}
              </div>

              {/* Fő vezérlő gombok (Visszaállítás és Indítás/Szünet) */}
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
                    background: isRunning ? '#dc2626' : (timeLeft === 0 ? 'var(--text-secondary)' : 'var(--text-primary)'), 
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

              {/* Idő hozzáadása opciók - szellős, arányos alsó blokk */}
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
                  ].map(item => (
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
        })()}

        {/* RANDOMIZER (Szerencsekerék) */}
        {activeTool === 'randomizer' && (() => {
          const selectedGroupObj = groups.find(g => g.id === selectedGroup);
          
          const activeStudents = selectedGroupObj?.students?.filter(student => 
            !answerRecords.some(r => r.student === student && r.groupId === selectedGroup)
          ) || [];

          const answeredStudents = answerRecords
            .filter(r => r.groupId === selectedGroup)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const daysAgo = (iso) => {
            const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
            if (days === 0) return 'ma';
            if (days === 1) return 'tegnap';
            return `${days} napja`;
          };

          const gradeColor = (g) => {
            if (!g) return 'var(--text-secondary)';
            if (g >= 5) return '#3fb950';
            if (g >= 4) return '#58a6ff';
            if (g >= 3) return '#d29922';
            if (g >= 2) return '#f0883e';
            return '#cc0000';
          };

          return (
            <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: 0, gap: '24px', alignItems: 'stretch' }}>
              
              {/* Bal oldal: A kerék */}
              <div style={{ 
                flex: 1, 
                minWidth: 0, 
                minHeight: 0, 
                height: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                position: 'relative',
                overflow: 'hidden'
              }}>
                {activeStudents.length > 0 ? (
                  <div style={{ 
                    position: 'relative',
                    height: '100%',
                    maxHeight: '100%',
                    aspectRatio: '1 / 1',
                    maxWidth: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Megújult, finomított mutató tű */}
                    <div style={{
                      position: 'absolute', 
                      right: '-4px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      filter: 'drop-shadow(-2px 0 4px rgba(0,0,0,0.25))',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12L20 4V20L4 12Z" fill={isDark ? '#ef4444' : '#dc2626'} stroke={isDark ? '#18181b' : '#ffffff'} strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <canvas
                      ref={canvasRef}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        cursor: isSpinning ? 'wait' : 'pointer',
                        display: 'block'
                      }}
                      onClick={spinWheel}
                    />
                  </div>
                ) : selectedGroupObj ? (
                  <div style={{ padding: '40px 32px', textAlign: 'center', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', borderRadius: '8px', width: '100%', maxWidth: '480px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Mindenki felelt!</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                      Ebben a csoportban már minden tanuló sorra került.
                    </div>
                    <button onClick={() => restoreAll(selectedGroup)} className="btn-primary" style={{ padding: '12px 24px', fontSize: '14px', width: 'auto' }}>
                      Mindenki visszarakása
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '40px 32px', textAlign: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--panel-border)', borderRadius: '8px', fontSize: '16px', width: '100%', maxWidth: '480px' }}>
                    Válassz egy csoportot a sorsoláshoz!
                  </div>
                )}
              </div>

              {/* Jobb oldal: Vezérlők és Feleltek névsora */}
              <div style={{ 
                width: '380px', 
                maxWidth: '420px',
                flexShrink: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                height: '100%', 
                minHeight: 0, 
                overflow: 'hidden' 
              }}>
                
                {/* Rögzített felső vezérlő modul */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      Választott csoport
                    </label>
                    <select 
                      className="input-field" 
                      value={selectedGroup} 
                      onChange={(e) => { setSelectedGroup(e.target.value); setShowResult(false); setRandomStudent(null); }}
                      style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '6px' }}
                    >
                      {groups.length === 0 ? (
                        <option value="">Nincs szinkronizált csoport</option>
                      ) : (
                        groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>
                        ))
                      )}
                    </select>
                  </div>

                  {activeStudents.length > 0 && (
                    <button 
                      className="btn-primary" 
                      style={{ 
                        fontSize: '15px', 
                        padding: '12px 20px', 
                        fontWeight: '600', 
                        letterSpacing: '1px', 
                        textTransform: 'uppercase',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: 0
                      }}
                      onClick={spinWheel}
                      disabled={isSpinning || !selectedGroup}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                      </svg>
                      {isSpinning ? 'Pörög a kerék...' : 'Pörgetés!'}
                    </button>
                  )}

                  {showResult && randomStudent && (
                    <div style={{
                      padding: '16px', 
                      textAlign: 'center',
                      border: `2px solid ${isDark ? '#ef4444' : '#dc2626'}`, 
                      background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.05)', 
                      borderRadius: '8px', 
                      animation: 'fadeIn 0.3s ease-out'
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.8px' }}>
                        A kiválasztott tanuló:
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '14px', wordBreak: 'break-word' }}>
                        {randomStudent}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => markAsAnswered(randomStudent, selectedGroup)} className="btn-primary" style={{ background: '#10b981', border: 'none', flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '4px', marginTop: 0 }}>
                          Felelt – Levétel
                        </button>
                        <button onClick={() => { setShowResult(false); setRandomStudent(null); }} className="btn-outline" style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '4px' }}>
                          Mégse
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Statisztikai számlálók */}
                  <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                    <div style={{ flex: 1, padding: '10px 8px', background: 'var(--hover-bg)', borderRadius: '6px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px', letterSpacing: '0.5px' }}>Aktív</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{activeStudents.length}</div>
                    </div>
                    <div style={{ flex: 1, padding: '10px 8px', background: 'var(--hover-bg)', borderRadius: '6px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px', letterSpacing: '0.5px' }}>Felelt</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: answeredStudents.length > 0 ? (isDark ? '#ef4444' : '#dc2626') : 'var(--text-primary)' }}>{answeredStudents.length}</div>
                    </div>
                    {selectedGroupObj && (
                      <div style={{ flex: 1, padding: '10px 8px', background: 'var(--hover-bg)', borderRadius: '6px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', marginBottom: '2px', letterSpacing: '0.5px' }}>Összes</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedGroupObj.students.length}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feleltek névsora: a nevek sosem rövidülnek, szépen kiférnek, önállóan görgethető */}
                {answeredStudents.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Feleltek ({answeredStudents.length})
                      </div>
                      <button onClick={() => restoreAll(selectedGroup)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}>
                        Mind visszarak
                      </button>
                    </div>
                    
                    <div style={{ 
                      flex: 1, 
                      minHeight: 0, 
                      overflowY: 'auto', 
                      border: '1px solid var(--panel-border)', 
                      borderRadius: '6px',
                      background: 'var(--panel-bg)'
                    }}>
                      {answeredStudents.map((record, i) => (
                        <div key={`${record.student}-${record.date}-${i}`} style={{
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          borderBottom: i < answeredStudents.length - 1 ? '1px solid var(--panel-border)' : 'none',
                          background: i % 2 === 0 ? 'var(--hover-bg)' : 'transparent',
                          transition: 'background-color 0.15s'
                        }}>
                          {/* Felső sor: Teljes tanuló név és visszarakás gomb */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.3' }}>
                              {record.student}
                            </span>
                            <button 
                              onClick={() => restoreStudent(record.student, selectedGroup)} 
                              className="btn-outline" 
                              style={{ 
                                padding: '3px 8px', 
                                fontSize: '11px', 
                                whiteSpace: 'nowrap', 
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0
                              }}
                              title="Visszahelyezés a sorsolókerékre"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                              </svg>
                              Visszarak
                            </button>
                          </div>

                          {/* Alsó sor: Eltelt idő és érdemjegy választó gombok */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {daysAgo(record.date)}
                            </span>

                            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginRight: '3px' }}>Jegy:</span>
                              {[1, 2, 3, 4, 5].map(g => {
                                const isSelected = record.grade === g;
                                return (
                                  <button 
                                    key={g} 
                                    onClick={() => setGrade(record.student, selectedGroup, g)} 
                                    style={{
                                      width: '24px', 
                                      height: '24px', 
                                      borderRadius: '4px', 
                                      border: isSelected ? `1.5px solid ${gradeColor(g)}` : '1px solid var(--panel-border)',
                                      fontSize: '11px', 
                                      fontWeight: '700', 
                                      cursor: 'pointer',
                                      background: isSelected ? gradeColor(g) : 'transparent',
                                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                      transition: 'all 0.15s ease',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0
                                    }}
                                  >
                                    {g}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TEAM GENERATOR */}
        {activeTool === 'teams' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 8px', height: '100%', overflowY: 'auto' }}>
            <h2 className="card-title">Csapatgenerátor</h2>
            
            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <label className="input-label">Válassz osztályt/csoportot:</label>
                <select 
                  className="input-field" 
                  value={selectedGroup} 
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  {groups.length === 0 ? (
                    <option value="">Nincs szinkronizált csoport</option>
                  ) : (
                    groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>
                    ))
                  )}
                </select>
              </div>
              
              <div style={{ width: '150px' }}>
                <label className="input-label">Csapatlétszám:</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value) || 2)}
                  min="2"
                  max="10"
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  className="btn-primary" 
                  onClick={generateTeams}
                  disabled={!selectedGroup}
                >
                  Generálás
                </button>
              </div>
            </div>

            {teams.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '40px' }}>
                {teams.map((team, index) => (
                  <div key={index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: '12px' }}>
                      {index + 1}. Csapat
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {team.map((student, sIdx) => (
                        <li key={sIdx} style={{ fontSize: '14px' }}>{student}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GRADE CALCULATOR */}
        {activeTool === 'grades' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 8px', height: '100%', overflowY: 'auto' }}>
            <h2 className="card-title">Ponthatár Kalkulátor</h2>
            
            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ width: '150px' }}>
                <label className="input-label">Max pontszám:</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={maxScore}
                  onChange={(e) => setMaxScore(parseFloat(e.target.value) || 0)}
                  min="1"
                />
              </div>
              
              <div style={{ width: '200px' }}>
                <label className="input-label">Kerekítés:</label>
                <select 
                  className="input-field"
                  value={roundDirection}
                  onChange={(e) => setRoundDirection(e.target.value)}
                >
                  <option value="down">Lefelé (pl. 42.8 → 42)</option>
                  <option value="up">Felfelé (pl. 42.2 → 43)</option>
                  <option value="math">Matematikai</option>
                  <option value="none">Nincs (törtek engedélyezése)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', maxWidth: '600px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Százalékos határok
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowLoadMenu(!showLoadMenu)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  {showLoadMenu ? 'Mentettek elrejtése' : 'Betöltés'}
                </button>
                <button onClick={() => setShowSaveModal(!showSaveModal)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Mentés
                </button>
              </div>
            </div>

            {showSaveModal && (
              <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginTop: '16px', maxWidth: '600px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text"
                  placeholder="Eloszlás neve (pl. Szigorú dolgozat)"
                  className="input-field"
                  style={{ flex: 1 }}
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveConfig()}
                />
                <button onClick={saveConfig} className="btn-primary">Mentés</button>
                <button onClick={() => setShowSaveModal(false)} className="btn-outline">Mégse</button>
              </div>
            )}

            {showLoadMenu && (
              <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginTop: '16px', maxWidth: '600px' }}>
                {savedConfigs.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>Nincs mentett eloszlás.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {savedConfigs.map((config, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)' }}>
                        <button onClick={() => loadConfig(config)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 'bold' }}>
                          {config.name}
                        </button>
                        <span style={{ fontSize: '12px', color: 'var(--accent-color)' }}>
                          {config.thresholds.map(t => t.percent).join(' - ')}%
                        </span>
                        <button onClick={() => deleteConfig(i)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '12px', color: '#f85149', borderColor: 'transparent' }}>
                          Törlés
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--panel-border)' }}>
                <div>Érdemjegy</div>
                <div>Százalék</div>
                <div>Pontszám</div>
              </div>
              
              {calculateGradeBounds().map(bound => (
                <div key={bound.grade} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 2fr', 
                  gap: '16px', 
                  alignItems: 'center',
                  background: 'var(--hover-bg)',
                  border: '1px solid var(--panel-border)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${bound.color}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', 
                      borderRadius: '50%', 
                      background: `${bound.color}20`, 
                      color: bound.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '18px'
                    }}>
                      {bound.grade}
                    </div>
                    <span style={{ fontWeight: '500' }}>{bound.label}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {bound.grade !== 1 ? (
                      <input 
                        type="number"
                        className="input-field"
                        style={{ width: '70px', padding: '6px' }}
                        value={bound.percent}
                        onChange={(e) => {
                          const newPercent = parseFloat(e.target.value) || 0;
                          setThresholds(thresholds.map(t => t.grade === bound.grade ? { ...t, percent: newPercent } : t));
                        }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>&lt; {thresholds[3].percent}%</span>
                    )}
                    {bound.grade !== 1 && <span>%</span>}
                  </div>
                  
                  <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {bound.display}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherTools;
