import React, { useState, useEffect } from 'react';
import WidgetResizer from '../WidgetResizer';
import { MOCK_STUDENTS } from '../../../constants/dashboardConstants';

export default function RandomStudentWidget({
  widgetSettings,
  widgetPositions,
  widgetSizes,
  widgetHeights,
  changeWidgetWidth,
  changeWidgetHeight,
  handleDragStart,
  handleDragOver,
  handleDrop
}) {
  // Student classes
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('11.A');
  const [students, setStudents] = useState([]);
  const [excludedStudents, setExcludedStudents] = useState([]);
  const [excludeDrawn, setExcludeDrawn] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load groups from localStorage or fallback to MOCK_STUDENTS
  useEffect(() => {
    const savedGroupsStr = localStorage.getItem('ekreta_groups');
    if (savedGroupsStr) {
      try {
        const parsed = JSON.parse(savedGroupsStr);
        if (parsed && parsed.length > 0) {
          const classList = parsed.map((g) => ({
            id: g.id || g.name,
            name: g.name,
            students: g.students || []
          }));
          setClasses(classList);
          setSelectedClass(classList[0].id);
          setStudents(classList[0].students || []);
          return;
        }
      } catch (e) {
        console.warn('Error loading ekreta_groups:', e);
      }
    }

    // Default mock classes
    const defaultClasses = Object.keys(MOCK_STUDENTS).map((key) => ({
      id: key,
      name: `${key} Osztály`,
      students: MOCK_STUDENTS[key]
    }));
    setClasses(defaultClasses);
    setSelectedClass('11.A');
    setStudents(MOCK_STUDENTS['11.A'] || []);
  }, []);

  // When class changes
  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    const cls = classes.find((c) => c.id === classId);
    if (cls) {
      setStudents(cls.students || []);
      setExcludedStudents([]);
      setSelectedStudent(null);
    }
  };

  // Play click & winner chime
  const playClick = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {}
  };

  const playFanfare = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.09);
        osc.stop(audioCtx.currentTime + idx * 0.09 + 0.35);
      });
    } catch {}
  };

  // Sorsolás
  const spinWinner = () => {
    if (isRolling) return;
    const available = excludeDrawn
      ? students.filter((s) => !excludedStudents.includes(s))
      : students;
    const pool = available.length > 0 ? available : students;

    if (pool.length === 0) return;

    // Ha az összes el lett fogyasztva, újrakezdjük
    if (excludeDrawn && available.length === 0) {
      setExcludedStudents([]);
    }

    setIsRolling(true);
    let counter = 0;
    const totalSteps = 20;
    let delay = 45;

    const rollStep = () => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      setSelectedStudent(pool[randomIndex]);
      playClick();
      counter++;

      if (counter < totalSteps) {
        delay += 9; // Lassuló hatás mint a Classroomban
        setTimeout(rollStep, delay);
      } else {
        const finalWinner = pool[Math.floor(Math.random() * pool.length)];
        setSelectedStudent(finalWinner);
        setIsRolling(false);
        playFanfare();
        if (excludeDrawn) {
          setExcludedStudents((prev) => [...prev, finalWinner]);
        }
      }
    };

    rollStep();
  };

  const remainingCount = students.length - excludedStudents.length;
  const isCompact = widgetHeights.randomStudent === 1;

  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.randomStudent?.c || 1} / span ${widgetSizes.randomStudent}`,
        gridRow: `${widgetPositions.randomStudent?.r || 1} / span ${widgetHeights.randomStudent}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'randomStudent')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'randomStudent')}
    >
      <WidgetResizer
        widgetKey="randomStudent"
        w={widgetSizes.randomStudent}
        h={widgetHeights.randomStudent}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Fejléc: Egységes rövid cím bal felső sarokban + Hang és Reset vezérlők */}
        <div className="card-title">
          <span>Sorsolás</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {excludedStudents.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setExcludedStudents([]);
                  setSelectedStudent(null);
                }}
                title="Sorsolási kör újraindítása"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  borderRadius: '3px'
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--theme-red)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                ↺ Újra
              </button>
            )}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Hangjelzés bekapcsolva' : 'Hangjelzés némítva'}
              style={{
                background: 'transparent',
                border: 'none',
                color: soundEnabled ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: soundEnabled ? 0.9 : 0.4,
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {soundEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Osztályválasztó sáv */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px', flexShrink: 0, flexWrap: widgetSizes.randomStudent === 1 ? 'wrap' : 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: widgetSizes.randomStudent === 1 ? '1 1 auto' : 'none' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Osztály:</span>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--panel-border, #e4e4e7)',
                background: 'var(--panel-bg, #ffffff)',
                color: 'var(--text-primary, #18181b)',
                fontSize: '11px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                maxWidth: widgetSizes.randomStudent === 1 ? '90px' : '120px'
              }}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            <span>Maradt: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{excludeDrawn && remainingCount > 0 ? remainingCount : students.length}</strong>
            <span> / {students.length}</span>
          </div>
        </div>

        {/* Középső Sorsolási Mező (Winner Display) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isCompact ? '6px' : '10px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderRadius: '6px',
            border: '1px solid var(--panel-border, #e4e4e7)',
            marginBottom: '8px',
            minHeight: 0
          }}
        >
          {/* Avatar kör ikon (ha elfér a magasság) */}
          {!isCompact && (
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: selectedStudent ? 'var(--accent-color, #18181b)' : 'var(--panel-border, #e4e4e7)',
                color: 'var(--badge-color, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                transform: isRolling ? 'scale(1.1) rotate(6deg)' : 'scale(1)',
                flexShrink: 0
              }}
            >
              {selectedStudent ? selectedStudent.charAt(0) : '?'}
            </div>
          )}

          {/* Diák Neve */}
          <div
            style={{
              fontSize: isRolling ? '20px' : isCompact ? '18px' : '22px',
              fontWeight: 800,
              textAlign: 'center',
              color: selectedStudent ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              minHeight: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              wordBreak: 'break-word',
              padding: '0 6px',
              lineHeight: 1.2
            }}
          >
            {selectedStudent || 'Nincs kiválasztva'}
          </div>

          {/* Állapot szöveg */}
          {!isCompact && (
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {isRolling ? 'Sorsolás folyamatban...' : selectedStudent ? '🎯 Kiválasztott tanuló' : 'Kattints a Sorsolás gombra!'}
            </div>
          )}
        </div>

        {/* Alsó vezérlősáv: Sorsolás gomb és opció */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', flexShrink: 0 }}>
          <button
            type="button"
            onClick={spinWinner}
            disabled={isRolling || students.length === 0}
            style={{
              width: '100%',
              padding: isCompact ? '6px 12px' : '10px 16px',
              borderRadius: '4px',
              background: 'var(--accent-color, #18181b)',
              color: 'var(--badge-color, #ffffff)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: isRolling || students.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isRolling || students.length === 0 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <span>🎲</span>
            <span>{isRolling ? 'Sorsolás...' : 'Sorsolás'}</span>
          </button>

          {!isCompact && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none', margin: '0 auto' }}>
              <input
                type="checkbox"
                checked={excludeDrawn}
                onChange={(e) => setExcludeDrawn(e.target.checked)}
                style={{ accentColor: 'var(--accent-color, #18181b)', cursor: 'pointer' }}
              />
              <span>Csak egyszer sorsolható a körben</span>
            </label>
          )}
        </div>
      </div>
    </section>
  );
}
