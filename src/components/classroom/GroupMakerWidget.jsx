import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { MOCK_STUDENTS } from '../../constants/dashboardConstants';

const TEAM_COLORS = [
  '#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#e11d48', '#4f46e5'
];

export default function GroupMakerWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 180, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 500, height: 460 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 180, y: widget.y || 80 }, size: { width: 500, height: 460 } });

  // Class & students
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('11.A');
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);

  // Mode: 'byCount' (X csapat) or 'bySize' (X fő / csapat)
  const [mode, setMode] = useState('byCount');
  const [countValue, setCountValue] = useState(3);
  const [copied, setCopied] = useState(false);

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

    const defaultClasses = Object.keys(MOCK_STUDENTS).map((key) => ({
      id: key,
      name: `${key} Osztály`,
      students: MOCK_STUDENTS[key]
    }));
    setClasses(defaultClasses);
    setSelectedClass('11.A');
    setStudents(MOCK_STUDENTS['11.A']);
  }, []);

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    const cls = classes.find((c) => c.id === classId);
    if (cls) {
      setStudents(cls.students || []);
      setTeams([]);
    }
  };

  // Generate teams
  const generateTeams = () => {
    if (!students || students.length === 0) return;
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const generated = [];

    if (mode === 'byCount') {
      const numTeams = Math.max(2, Math.min(countValue, students.length));
      for (let i = 0; i < numTeams; i++) {
        generated.push([]);
      }
      shuffled.forEach((student, index) => {
        generated[index % numTeams].push(student);
      });
    } else {
      // bySize
      const teamSize = Math.max(2, countValue);
      for (let i = 0; i < shuffled.length; i += teamSize) {
        generated.push(shuffled.slice(i, i + teamSize));
      }
    }

    setTeams(generated);
  };

  // Copy teams to clipboard
  const handleCopyTeams = () => {
    if (teams.length === 0) return;
    const text = teams
      .map((t, idx) => `${idx + 1}. Csapat:\n${t.map((s) => `  • ${s}`).join('\n')}`)
      .join('\n\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
      minWidth={360}
      minHeight={360}
      bounds="parent"
      dragHandleClassName="group-maker-drag-handle"
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
          className="group-maker-drag-handle"
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
            {/* Multi-Person Team Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>CSOPORTALKOTÓ</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {teams.length > 0 && (
              <button
                type="button"
                className="btn-outline"
                onClick={handleCopyTeams}
                style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px' }}
              >
                {copied ? '✓ Másolva' : 'Másolás'}
              </button>
            )}

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

        {/* Controls Toolbar */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--hover-bg, rgba(0,0,0,0.01))'
          }}
        >
          {/* Class Select */}
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
                  {c.name} ({c.students?.length || 0} fő)
                </option>
              ))}
            </select>
          </div>

          {/* Mode & Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', background: 'var(--hover-bg, #f4f4f5)', padding: '2px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
              <button
                type="button"
                onClick={() => setMode('byCount')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: mode === 'byCount' ? 'var(--panel-bg, #ffffff)' : 'transparent',
                  color: mode === 'byCount' ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)'
                }}
              >
                Csapatok száma
              </button>
              <button
                type="button"
                onClick={() => setMode('bySize')}
                style={{
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: mode === 'bySize' ? 'var(--panel-bg, #ffffff)' : 'transparent',
                  color: mode === 'bySize' ? 'var(--text-primary, #18181b)' : 'var(--text-secondary, #71717a)'
                }}
              >
                Fő / csapat
              </button>
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setCountValue((v) => Math.max(2, v - 1))}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--panel-bg)',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                –
              </button>
              <span style={{ minWidth: '22px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
                {countValue}
              </span>
              <button
                type="button"
                onClick={() => setCountValue((v) => Math.min(12, v + 1))}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--panel-bg)',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={generateTeams}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              background: 'var(--accent-color, #18181b)',
              color: 'var(--badge-color, #ffffff)',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚡</span>
            <span>Generálás</span>
          </button>
        </div>

        {/* Teams Output Grid */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {teams.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.45,
                gap: '8px'
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>
                Kattints a "Generálás" gombra a véletlenszerű csoportok létrehozásához!
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {teams.map((team, tIdx) => {
                const teamColor = TEAM_COLORS[tIdx % TEAM_COLORS.length];
                return (
                  <div
                    key={tIdx}
                    style={{
                      borderRadius: '6px',
                      border: '1px solid var(--panel-border, #e4e4e7)',
                      background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Team Header */}
                    <div
                      style={{
                        padding: '6px 10px',
                        background: 'var(--panel-bg, #ffffff)',
                        borderBottom: '1px solid var(--panel-border, #e4e4e7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '11px', letterSpacing: '0.5px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: teamColor }} />
                        <span>{tIdx + 1}. Csapat</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary, #71717a)' }}>
                        {team.length} fő
                      </span>
                    </div>

                    {/* Member List */}
                    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {team.map((member, mIdx) => (
                        <div
                          key={mIdx}
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          <span style={{ color: teamColor, fontSize: '10px' }}>•</span>
                          <span>{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
