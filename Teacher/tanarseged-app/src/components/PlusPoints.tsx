import { useState, useEffect, useMemo } from 'react';
import { subscribeToUserData, saveUserData } from '../lib/db';
import { Star, Check } from 'lucide-react';
import { UserProfile } from '../types';

interface GroupData {
  id: string;
  name: string;
  subject?: string;
  students: string[];
}

interface PlusEntry {
  date: string;
}

interface StudentPlusData {
  student: string;
  groupId: string;
  pluses: PlusEntry[];
  gradedHistory: { date: string; count: number }[];
}

const SwipeablePlus = ({ date, onSwipe }: { date: string, onSwipe: () => void }) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    setStartX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX === null) return;
    const deltaX = e.clientX - startX;
    setOffsetX(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (startX === null) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (Math.abs(offsetX) > 40) {
      onSwipe();
    } else {
      setOffsetX(0);
    }
    setStartX(null);
  };

  const handlePointerCancel = () => {
    setOffsetX(0);
    setStartX(null);
  };

  return (
    <span
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        padding: '1px 6px', borderRadius: '4px',
        background: Math.abs(offsetX) > 40 ? 'rgba(248,81,73,0.3)' : 'rgba(210,153,34,0.1)',
        border: Math.abs(offsetX) > 40 ? '1px solid rgba(248,81,73,0.5)' : '1px solid rgba(210,153,34,0.25)',
        transform: `translateX(${offsetX}px)`,
        transition: startX === null ? 'transform 0.2s, background 0.2s, border 0.2s' : 'background 0.2s, border 0.2s',
        cursor: 'grab',
        display: 'inline-block',
        touchAction: 'pan-y', // Allow vertical scroll, block horizontal
        userSelect: 'none',
        opacity: Math.abs(offsetX) > 40 ? 0.7 : 1
      }}
      title="Húzd oldalra a törléshez"
    >
      ⭐ {date}
    </span>
  );
};

const PlusPoints = ({ profile }: { profile: UserProfile }) => {
  const threshold = profile?.plusPointThreshold || 3;
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [plusData, setPlusData] = useState<StudentPlusData[]>([]);

  useEffect(() => {
    const unsub1 = subscribeToUserData('teacher_groups', (data) => {
      setGroups(data || []);
      if (data && data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    });
    const unsub2 = subscribeToUserData('plus_points', (data) => {
      setPlusData(data || []);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const students = selectedGroup?.students || [];

  const getStudentData = (student: string): StudentPlusData => {
    return plusData.find(p => p.student === student && p.groupId === selectedGroupId) || {
      student, groupId: selectedGroupId, pluses: [], gradedHistory: []
    };
  };

  const addPlus = async (student: string) => {
    const existing = getStudentData(student);
    const updated: StudentPlusData = {
      ...existing,
      groupId: selectedGroupId,
      pluses: [...existing.pluses, { date: new Date().toISOString() }],
    };
    const newData = plusData.filter(p => !(p.student === student && p.groupId === selectedGroupId));
    newData.push(updated);
    await saveUserData('plus_points', newData);
  };

  const removePlus = async (student: string, plusIndex: number) => {
    const existing = getStudentData(student);
    const updated: StudentPlusData = {
      ...existing,
      pluses: existing.pluses.filter((_, i) => i !== plusIndex),
    };
    const newData = plusData.filter(p => !(p.student === student && p.groupId === selectedGroupId));
    if (updated.pluses.length > 0 || updated.gradedHistory.length > 0) {
      newData.push(updated);
    }
    await saveUserData('plus_points', newData);
  };

  const markGraded = async (student: string) => {
    const existing = getStudentData(student);
    const updated: StudentPlusData = {
      ...existing,
      pluses: [],
      gradedHistory: [...existing.gradedHistory, { date: new Date().toISOString(), count: existing.pluses.length }],
    };
    const newData = plusData.filter(p => !(p.student === student && p.groupId === selectedGroupId));
    newData.push(updated);
    await saveUserData('plus_points', newData);
  };

  const removeGradedEntry = async (student: string, index: number) => {
    const existing = getStudentData(student);
    const updated: StudentPlusData = {
      ...existing,
      gradedHistory: existing.gradedHistory.filter((_, i) => i !== index),
    };
    const newData = plusData.filter(p => !(p.student === student && p.groupId === selectedGroupId));
    if (updated.pluses.length > 0 || updated.gradedHistory.length > 0) {
      newData.push(updated);
    }
    await saveUserData('plus_points', newData);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  };

  // Rendezés: threshold+ pluszosak felül, utána pluszok száma szerint csökkenő
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const aData = getStudentData(a);
      const bData = getStudentData(b);
      if (aData.pluses.length >= threshold && bData.pluses.length < threshold) return -1;
      if (bData.pluses.length >= threshold && aData.pluses.length < threshold) return 1;
      return bData.pluses.length - aData.pluses.length;
    });
  }, [students, plusData, selectedGroupId, threshold]);

  const readyCount = students.filter(s => getStudentData(s).pluses.length >= threshold).length;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>

      {/* Fejléc */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star size={22} color="#d29922" fill="#d29922" /> Pluszpontok
        </h2>
        <select
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
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

      {/* Infó sáv */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
        <span className="glass-panel" style={{ padding: '6px 12px', borderRadius: '20px' }}>
          👥 Összesen: <strong>{students.length}</strong>
        </span>
        {readyCount > 0 && (
          <span className="glass-panel" style={{
            padding: '6px 12px', borderRadius: '20px',
            background: 'rgba(63,185,80,0.15)', border: '1px solid rgba(63,185,80,0.3)'
          }}>
            ⭐ Kigyűlt: <strong style={{ color: '#3fb950' }}>{readyCount}</strong>
          </span>
        )}
      </div>

      {/* Diákok listája */}
      {sortedStudents.length > 0 ? (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {sortedStudents.map((student, i) => {
            const data = getStudentData(student);
            const count = data.pluses.length;
            const isReady = count >= threshold;

            return (
              <div key={student} style={{
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
                borderBottom: i < sortedStudents.length - 1 ? '1px solid var(--border-glass)' : 'none',
                background: isReady ? 'rgba(63,185,80,0.08)' : 'transparent',
                transition: 'background 0.2s'
              }}>
                {/* Név és dátumok */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student}
                    </span>
                    {isReady && (
                      <span style={{
                        fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px',
                        background: '#238636', color: 'white', whiteSpace: 'nowrap'
                      }}>
                        KIGYŰLT!
                      </span>
                    )}
                  </div>
                  {count > 0 && (
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                      {data.pluses.map((p, j) => (
                        <SwipeablePlus 
                          key={j} 
                          date={formatDate(p.date)} 
                          onSwipe={() => removePlus(student, j)} 
                        />
                      ))}
                    </div>
                  )}
                  {data.gradedHistory.length > 0 && (
                    <div style={{ fontSize: '10px', color: '#3fb950', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Értékelve ({data.gradedHistory.length}×):</span>
                      {data.gradedHistory.map((h, j) => (
                        <span key={j} onClick={() => removeGradedEntry(student, j)} style={{
                          padding: '1px 5px', borderRadius: '4px', cursor: 'pointer',
                          background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.2)',
                          transition: 'all 0.15s'
                        }} title="Kattints a törléshez">
                          ✅ {formatDate(h.date)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plusz számláló */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '2px', minWidth: '50px', justifyContent: 'center'
                }}>
                  {[...Array(threshold)].map((_, idx) => (
                    <div key={idx} style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: idx < count ? '#d29922' : 'rgba(255,255,255,0.06)',
                      border: idx < count ? '1px solid #d29922' : '1px solid var(--border-glass)',
                      transition: 'all 0.2s'
                    }} />
                  ))}
                  {count > threshold && (
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#d29922', marginLeft: '2px' }}>+{count - threshold}</span>
                  )}
                </div>

                {/* Gombok */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* + gomb */}
                  <button onClick={() => addPlus(student)} style={{
                    width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                    background: 'rgba(210,153,34,0.15)', color: '#d29922',
                    fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}>
                    +
                  </button>

                  {/* Értékelve gomb (threshold+ esetén) */}
                  {isReady && (
                    <button onClick={() => markGraded(student)} style={{
                      width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                      background: 'rgba(63,185,80,0.2)', color: '#3fb950',
                      fontSize: '14px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s'
                    }} title="Értékelve – nullázás">
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Hozz létre egy csoportot a Csoportok oldalon!
        </div>
      )}
    </div>
  );
};

export default PlusPoints;
