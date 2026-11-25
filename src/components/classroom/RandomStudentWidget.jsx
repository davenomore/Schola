import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { MOCK_STUDENTS } from '../../constants/dashboardConstants';

export default function RandomStudentWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 140, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 380, height: 440 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 140, y: widget.y || 80 }, size: { width: 380, height: 440 } });

  // Student classes
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('11.A');
  const [students, setStudents] = useState([]);
  const [excludedStudents, setExcludedStudents] = useState([]);
  const [excludeDrawn, setExcludeDrawn] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [customNamesInput, setCustomNamesInput] = useState('');
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
          setStudents(classList[0].students);
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
    setStudents(MOCK_STUDENTS['11.A']);
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

    setIsRolling(true);
    let counter = 0;
    const totalSteps = 22;
    let delay = 45;

    const rollStep = () => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      setSelectedStudent(pool[randomIndex]);
      playClick();
      counter++;

      if (counter < totalSteps) {
        delay += 9; // Slow down effect
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

  // Toggle maximize
  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDims.current = { position, size };
      setPosition({ x: 30, y: 30 });
      setSize({ width: 'calc(100% - 60px)', height: 'calc(100% - 90px)' });
      setIsMaximized(true);
    } else {
      setPosition(prevDims.current.position);
      setSize(prevDims.current.size);
      setIsMaximized(false);
    }
  };

  // Custom names modal save
  const handleSaveCustomNames = () => {
    const lines = customNamesInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 0) {
      const customClass = { id: 'custom', name: 'Egyéni lista', students: lines };
      setClasses((prev) => [customClass, ...prev.filter((c) => c.id !== 'custom')]);
      setSelectedClass('custom');
      setStudents(lines);
      setExcludedStudents([]);
      setSelectedStudent(null);
    }
    setShowEditModal(false);
  };

  const remainingCount = students.length - excludedStudents.length;

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
        updateWidgetBounds?.(widget.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, pos) => {
        const newW = ref.offsetWidth;
        const newH = ref.offsetHeight;
        setSize({ width: newW, height: newH });
        setPosition(pos);
        updateWidgetBounds?.(widget.id, { ...pos, width: newW, height: newH });
      }}
      minWidth={300}
      minHeight={360}
      bounds="parent"
      dragHandleClassName="student-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 85 : 25 }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--panel-bg, #ffffff)',
          color: 'var(--text-primary, #18181b)',
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          border: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          className="student-drag-handle"
          style={{
            padding: '8px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
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
            {/* Single Person Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>VÉLETLEN DIÁK</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Sound toggle */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Hangjelzés bekapcsolva' : 'Hangjelzés némítva'}
              style={{ opacity: soundEnabled ? 0.9 : 0.4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            {/* Edit students list */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => {
                setCustomNamesInput(students.join('\n'));
                setShowEditModal(true);
              }}
              title="Nevek szerkesztése"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            {/* Maximize */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={toggleMaximize}
              title={isMaximized ? 'Visszaállítás' : 'Teljes méret'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
              className="rich-text-toolbar-btn"
              onClick={() => removeWidget(widget.id)}
              title="Bezárás"
              style={{ color: 'var(--theme-red, #cc0000)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Class selector */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Osztály:
              </span>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--panel-border, #e4e4e7)',
                  background: 'var(--panel-bg, #ffffff)',
                  color: 'var(--text-primary, #18181b)',
                  fontSize: '11px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #71717a)' }}>
              <span>{excludeDrawn ? 'Még nem sorsolt: ' : 'Összesen: '}</span>
              <strong style={{ color: 'var(--text-primary)' }}>{excludeDrawn && remainingCount > 0 ? remainingCount : students.length}</strong>
              <span> / {students.length}</span>
            </div>
          </div>

          {/* Option: Exclude drawn students */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-secondary, #71717a)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={excludeDrawn}
                onChange={(e) => setExcludeDrawn(e.target.checked)}
                style={{ accentColor: 'var(--accent-color, #18181b)', cursor: 'pointer' }}
              />
              <span>Csak egyszer sorsolható diák a körben</span>
            </label>
          </div>

          {/* Winner Display Card */}
          <div
            style={{
              width: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '14px 0',
              padding: '20px',
              borderRadius: '8px',
              background: 'var(--hover-bg, rgba(0,0,0,0.02))',
              border: '1px solid var(--panel-border, #e4e4e7)',
              position: 'relative'
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: selectedStudent ? 'var(--accent-color, #18181b)' : 'var(--panel-border, #e4e4e7)',
                color: 'var(--badge-color, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                transform: isRolling ? 'scale(1.1) rotate(6deg)' : 'scale(1)'
              }}
            >
              {selectedStudent ? selectedStudent.charAt(0) : '?'}
            </div>

            {/* Student Name */}
            <div
              style={{
                fontSize: isRolling ? '22px' : '26px',
                fontWeight: 800,
                textAlign: 'center',
                letterSpacing: '-0.5px',
                color: selectedStudent ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)',
                transition: 'all 0.15s ease',
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                wordBreak: 'break-word',
                padding: '0 10px'
              }}
            >
              {selectedStudent || 'Készenlét...'}
            </div>

            {/* Subtitle / Status */}
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #71717a)', marginTop: '6px' }}>
              {isRolling ? 'Sorsolás folyamatban...' : selectedStudent ? '🎯 Kiválasztott tanuló' : 'Kattints a Sorsolás gombra!'}
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={spinWinner}
              disabled={isRolling || students.length === 0}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '4px',
                background: 'var(--accent-color, #18181b)',
                color: 'var(--badge-color, #ffffff)',
                border: 'none',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: isRolling || students.length === 0 ? 'not-allowed' : 'pointer',
                opacity: isRolling || students.length === 0 ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <span>🎲</span>
              <span>{isRolling ? 'Sorsolás...' : 'Sorsolás'}</span>
            </button>

            {excludedStudents.length > 0 && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setExcludedStudents([]);
                  setSelectedStudent(null);
                }}
                title="Visszaállítás az összes diákra"
                style={{
                  padding: '11px 14px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                Újra
              </button>
            )}
          </div>
        </div>

        {/* Edit Students Modal */}
        {showEditModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--panel-bg, #ffffff)',
              zIndex: 50,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Diákok névsora (soronként 1 név)
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>
            <textarea
              rows={8}
              value={customNamesInput}
              onChange={(e) => setCustomNamesInput(e.target.value)}
              placeholder="Kovács Anna&#10;Nagy Péter&#10;Kiss Dávid..."
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid var(--panel-border, #e4e4e7)',
                background: 'var(--panel-bg, #ffffff)',
                color: 'var(--text-primary, #18181b)',
                fontSize: '13px',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                resize: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleSaveCustomNames}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  background: 'var(--accent-color, #18181b)',
                  color: 'var(--badge-color, #ffffff)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                Mentés és Sorsolás
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowEditModal(false)}
                style={{ padding: '8px 12px', borderRadius: '4px' }}
              >
                Mégse
              </button>
            </div>
          </div>
        )}
      </div>
    </Rnd>
  );
}
