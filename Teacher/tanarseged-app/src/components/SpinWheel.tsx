import { useState, useEffect, useRef, useMemo } from 'react';
import { subscribeToUserData, saveUserData } from '../lib/db';

interface GroupData {
  id: string;
  name: string;
  subject?: string;
  students: string[];
}

interface AnswerRecord {
  student: string;
  groupId: string;
  date: string;
  grade?: number;
}

const COLORS = [
  '#3fb950', '#58a6ff', '#a371f7', '#f0883e', '#d29922',
  '#f85149', '#56d4dd', '#db61a2', '#7ee787', '#79c0ff',
  '#d2a8ff', '#ffa657', '#e3b341', '#ff7b72', '#a5d6ff', '#ffbedd',
];

const SpinWheel = () => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const answerRecordsRef = useRef<AnswerRecord[]>([]);

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinningRef = useRef(false);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const unsub1 = subscribeToUserData('teacher_groups', (data) => {
      setGroups(data || []);
      if (data && data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    });
    const unsub2 = subscribeToUserData('answer_records', (data) => {
      const records = data || [];
      setAnswerRecords(records);
      answerRecordsRef.current = records;
    });
    return () => {
      unsub1();
      unsub2();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // Aktív diákok (akik NEM szerepelnek a felelt listán ebben a csoportban)
  const activeStudents = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.students.filter(student => {
      return !answerRecords.some(r => r.student === student && r.groupId === selectedGroupId);
    });
  }, [selectedGroup, answerRecords, selectedGroupId]);

  // Felelt diákok
  const answeredStudents = useMemo(() => {
    return answerRecords
      .filter(r => r.groupId === selectedGroupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [answerRecords, selectedGroupId]);

  // Canvas rajzolás — nevek SUGÁR IRÁNYBA
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeStudents.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 320;
    
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = center - 8;
    const sliceAngle = (2 * Math.PI) / activeStudents.length;
    const rotRad = (rotation * Math.PI) / 180;

    ctx.clearRect(0, 0, size, size);

    // Külső keret
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    activeStudents.forEach((student, i) => {
      const startAngle = rotRad + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const color = COLORS[i % COLORS.length];

      // Szelet rajzolás
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color + '33';
      ctx.fill();
      ctx.strokeStyle = color + '88';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Név — SUGÁR IRÁNYBA (a szelet közepénél, kifelé futó szöveg)
      const midAngle = startAngle + sliceAngle / 2;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(midAngle);

      // Szöveg pozíció a sugár mentén
      const fontSize = activeStudents.length > 20 ? 8 : activeStudents.length > 12 ? 10 : 12;
      ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const maxLen = activeStudents.length > 15 ? 10 : 16;
      const displayName = student.length > maxLen ? student.slice(0, maxLen - 1) + '…' : student;
      ctx.fillText(displayName, 32, 0); // 32px-től indul (a középső kör után)

      ctx.restore();
    });

    // Középső kör
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', center, center);
  }, [activeStudents, rotation]);

  // Pörgetés
  const spin = () => {
    if (spinning || spinningRef.current || activeStudents.length === 0) return;
    spinningRef.current = true;
    setSpinning(true);
    setShowResult(false);
    setWinner(null);

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
        setWinner(studentsAtSpin[winnerIndex]);
        setSpinning(false);
        spinningRef.current = false;
        setShowResult(true);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Diák megjelölése feleltként
  const markAsAnswered = async (student: string) => {
    const currentRecords = answerRecordsRef.current;
    const newRecord: AnswerRecord = {
      student,
      groupId: selectedGroupId,
      date: new Date().toISOString(),
    };
    const updated = currentRecords.filter(r => !(r.student === student && r.groupId === selectedGroupId));
    updated.push(newRecord);
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    await saveUserData('answer_records', updated);
    setShowResult(false);
    setWinner(null);
  };

  // Jegy beírása
  const setGrade = async (student: string, grade: number) => {
    const currentRecords = answerRecordsRef.current;
    const updated = currentRecords.map(r => {
      if (r.student === student && r.groupId === selectedGroupId) {
        return { ...r, grade };
      }
      return r;
    });
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    await saveUserData('answer_records', updated);
  };

  // Diák visszarakása
  const restoreStudent = async (student: string) => {
    const currentRecords = answerRecordsRef.current;
    const updated = currentRecords.filter(r => !(r.student === student && r.groupId === selectedGroupId));
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    await saveUserData('answer_records', updated);
  };

  // Összes visszarakása
  const restoreAll = async () => {
    const currentRecords = answerRecordsRef.current;
    const updated = currentRecords.filter(r => r.groupId !== selectedGroupId);
    answerRecordsRef.current = updated;
    setAnswerRecords(updated);
    await saveUserData('answer_records', updated);
  };

  const daysAgo = (iso: string) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'ma';
    if (days === 1) return 'tegnap';
    return `${days} napja`;
  };

  const gradeColor = (g?: number) => {
    if (!g) return 'var(--text-secondary)';
    if (g >= 5) return '#3fb950';
    if (g >= 4) return '#58a6ff';
    if (g >= 3) return '#d29922';
    if (g >= 2) return '#f0883e';
    return '#f85149';
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '100px' }}>

      {/* Fejléc + Csoportválasztó */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>🎡 Szerencsekerék</h2>
        <select
          value={selectedGroupId}
          onChange={e => { setSelectedGroupId(e.target.value); setShowResult(false); setWinner(null); }}
          style={{
            padding: '8px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            border: '1px solid var(--border-glass)', background: 'var(--bg-color)',
            color: 'var(--text-primary)', outline: 'none'
          }}
        >
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}{g.subject ? ` — ${g.subject}` : ''}</option>
          ))}
        </select>
      </div>

      {/* Kerék */}
      {activeStudents.length > 0 ? (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* Mutató nyíl (jobbra mutat, 0 fok = 3 óra irány) */}
          <div style={{
            position: 'absolute', right: '-2px', top: '50%', transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '12px solid transparent', borderBottom: '12px solid transparent',
            borderRight: '20px solid #f85149',
            zIndex: 5, filter: 'drop-shadow(-2px 0 6px rgba(248,81,73,0.5))'
          }} />
          <canvas
            ref={canvasRef}
            style={{ width: '320px', height: '320px', maxWidth: '100%', cursor: spinning ? 'wait' : 'pointer' }}
            onClick={spin}
          />
        </div>
      ) : selectedGroup ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Mindenki felelt!</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Ebben a csoportban már mindenki sorra került.
          </div>
          <button onClick={restoreAll} style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600,
            background: 'var(--accent-purple)', color: 'white', cursor: 'pointer'
          }}>
            ♻️ Mindenki visszarakása
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Hozz létre egy csoportot a Csoportok oldalon!
        </div>
      )}

      {/* Pörgetés gomb */}
      {activeStudents.length > 0 && (
        <button onClick={spin} disabled={spinning} style={{
          padding: '14px', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: 'bold',
          background: spinning ? '#30363d' : 'linear-gradient(135deg, #58a6ff, #a371f7)',
          color: 'white', cursor: spinning ? 'wait' : 'pointer',
          boxShadow: spinning ? 'none' : '0 4px 16px rgba(88,166,255,0.3)',
          transition: 'all 0.3s'
        }}>
          {spinning ? '🎡 Pörög...' : '🎰 Pörgetés!'}
        </button>
      )}

      {/* Eredmény */}
      {showResult && winner && (
        <div className="glass-panel" style={{
          padding: '20px', textAlign: 'center',
          border: '1px solid #3fb950', animation: 'slide-up 0.3s ease-out'
        }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>A kiválasztott:</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3fb950', marginBottom: '16px' }}>
            🎯 {winner}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => markAsAnswered(winner)} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600,
              background: '#238636', color: 'white', cursor: 'pointer'
            }}>
              ✅ Felelt – Eltávolítás
            </button>
            <button onClick={() => { setShowResult(false); setWinner(null); }} style={{
              padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-glass)',
              background: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}>
              ❌ Mégse
            </button>
          </div>
        </div>
      )}

      {/* Állapot */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
        <span className="glass-panel" style={{ padding: '6px 12px', borderRadius: '20px' }}>
          🟢 Aktív: <strong>{activeStudents.length}</strong>
        </span>
        <span className="glass-panel" style={{ padding: '6px 12px', borderRadius: '20px' }}>
          ✅ Felelt: <strong>{answeredStudents.length}</strong>
        </span>
        {selectedGroup && (
          <span className="glass-panel" style={{ padding: '6px 12px', borderRadius: '20px' }}>
            👥 Összesen: <strong>{selectedGroup.students.length}</strong>
          </span>
        )}
      </div>

      {/* Felelt diákok listája + jegy beírás */}
      {answeredStudents.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Feleltek ({answeredStudents.length})
            </div>
            <button onClick={restoreAll} style={{
              padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)',
              background: 'transparent', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer'
            }}>
              ♻️ Mind visszarak
            </button>
          </div>
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            {answeredStudents.map((record, i) => (
              <div key={`${record.student}-${record.date}-${i}`} style={{
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: i < answeredStudents.length - 1 ? '1px solid var(--border-glass)' : 'none',
                gap: '8px'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.student}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {daysAgo(record.date)}
                  </div>
                </div>

                {/* Jegy választó */}
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[1, 2, 3, 4, 5].map(g => (
                    <button key={g} onClick={() => setGrade(record.student, g)} style={{
                      width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                      fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
                      background: record.grade === g ? gradeColor(g) + '33' : 'transparent',
                      color: record.grade === g ? gradeColor(g) : 'var(--text-secondary)',
                      outline: record.grade === g ? `2px solid ${gradeColor(g)}` : '1px solid var(--border-glass)',
                      transition: 'all 0.15s'
                    }}>
                      {g}
                    </button>
                  ))}
                </div>

                <button onClick={() => restoreStudent(record.student)} style={{
                  padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}>
                  ♻️
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SpinWheel;
