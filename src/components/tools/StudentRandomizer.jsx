import React, { useState, useEffect, useRef } from 'react';

export default function StudentRandomizer({ isDark }) {
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
      } catch (e) {
        console.error('Hiba a felelet napló betöltésekor:', e);
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const selectedGroupObj = groups.find((g) => g.id === selectedGroup);
    const activeStudents =
      selectedGroupObj?.students?.filter(
        (student) => !answerRecords.some((r) => r.student === student && r.groupId === selectedGroup)
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
        textColor = bgColor === '#1e2025' ? '#f4f4f5' : '#ffffff';
      } else {
        bgColor = i % 2 === 0 ? '#dc2626' : '#ffffff';
        if (activeStudents.length % 2 !== 0 && i === activeStudents.length - 1) {
          bgColor = '#18181b'; // Prevent same colors touching
        }
        textColor = bgColor === '#ffffff' ? '#18181b' : '#ffffff';
      }

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

      let baseFontSize = 38;
      if (activeStudents.length > 25) baseFontSize = 20;
      else if (activeStudents.length > 18) baseFontSize = 24;
      else if (activeStudents.length > 12) baseFontSize = 30;

      ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif`;

      const textStartX = 65;
      const maxAvailableWidth = radius - textStartX - 30;

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
  }, [selectedGroup, groups, answerRecords, rotation, isDark]);

  const spinWheel = () => {
    const selectedGroupObj = groups.find((g) => g.id === selectedGroup);
    const activeStudents =
      selectedGroupObj?.students?.filter(
        (student) => !answerRecords.some((r) => r.student === student && r.groupId === selectedGroup)
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
      date: new Date().toISOString()
    };
    const updated = currentRecords.filter((r) => !(r.student === student && r.groupId === groupId));
    updated.push(newRecord);
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    localStorage.setItem('ekreta_answer_records', JSON.stringify(updated));
    setShowResult(false);
    setRandomStudent(null);
  };

  const setGrade = (student, groupId, grade) => {
    const currentRecords = answerRecordsRef.current;
    const updated = currentRecords.map((r) => {
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
    const updated = currentRecords.filter((r) => !(r.student === student && r.groupId === groupId));
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    localStorage.setItem('ekreta_answer_records', JSON.stringify(updated));
  };

  const restoreAll = (groupId) => {
    const currentRecords = answerRecordsRef.current;
    const updated = currentRecords.filter((r) => r.groupId !== groupId);
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    localStorage.setItem('ekreta_answer_records', JSON.stringify(updated));
  };

  const selectedGroupObj = groups.find((g) => g.id === selectedGroup);
  const activeStudents =
    selectedGroupObj?.students?.filter(
      (student) => !answerRecords.some((r) => r.student === student && r.groupId === selectedGroup)
    ) || [];

  const answeredStudents = answerRecords
    .filter((r) => r.groupId === selectedGroup)
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
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {activeStudents.length > 0 ? (
          <div
            style={{
              position: 'relative',
              height: '100%',
              maxHeight: '100%',
              aspectRatio: '1 / 1',
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Mutató tű */}
            <div
              style={{
                position: 'absolute',
                right: '-4px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                filter: 'drop-shadow(-2px 0 4px rgba(0,0,0,0.25))',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
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
      <div
        style={{
          width: '380px',
          maxWidth: '420px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Rögzített felső vezérlő modul */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Választott csoport
            </label>
            <select
              className="input-field"
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setShowResult(false);
                setRandomStudent(null);
              }}
              style={{ fontSize: '14px', padding: '10px 12px', borderRadius: '6px' }}
            >
              {groups.length === 0 ? (
                <option value="">Nincs szinkronizált csoport</option>
              ) : (
                groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.subject})
                  </option>
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
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              {isSpinning ? 'Pörög a kerék...' : 'Pörgetés!'}
            </button>
          )}

          {showResult && randomStudent && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                border: `2px solid ${isDark ? '#ef4444' : '#dc2626'}`,
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.05)',
                borderRadius: '8px',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.8px' }}>
                A kiválasztott tanuló:
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '14px', wordBreak: 'break-word' }}>
                {randomStudent}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={() => markAsAnswered(randomStudent, selectedGroup)}
                  className="btn-primary"
                  style={{ background: '#10b981', border: 'none', flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '4px', marginTop: 0 }}
                >
                  Felelt – Levétel
                </button>
                <button
                  onClick={() => {
                    setShowResult(false);
                    setRandomStudent(null);
                  }}
                  className="btn-outline"
                  style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '4px' }}
                >
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

        {/* Feleltek névsora */}
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

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                border: '1px solid var(--panel-border)',
                borderRadius: '6px',
                background: 'var(--panel-bg)'
              }}
            >
              {answeredStudents.map((record, i) => (
                <div
                  key={`${record.student}-${record.date}-${i}`}
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    borderBottom: i < answeredStudents.length - 1 ? '1px solid var(--panel-border)' : 'none',
                    background: i % 2 === 0 ? 'var(--hover-bg)' : 'transparent',
                    transition: 'background-color 0.15s'
                  }}
                >
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
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                      Visszarak
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {daysAgo(record.date)}
                    </span>

                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginRight: '3px' }}>Jegy:</span>
                      {[1, 2, 3, 4, 5].map((g) => {
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
}
