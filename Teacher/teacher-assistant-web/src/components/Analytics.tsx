import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import type { ScanResult } from './Scanner';
import type { Group } from './Groups';
import { saveUserData, subscribeToUserData } from '../lib/db';

interface ArchivedTestSession {
  id: string;
  groupId: string;
  date: string;
  topic: string;
  type: string;
  scans: ScanResult[];
}

const Analytics = () => {
  const [sessions, setSessions] = useState<ArchivedTestSession[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'session' | 'student'>('session');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  
  // For Editing Scans
  const [editingScanId, setEditingScanId] = useState<string | null>(null);
  const [editedGrade, setEditedGrade] = useState<number>(1);
  const [editedScore, setEditedScore] = useState<number>(0);

  useEffect(() => {
    const unsubSessions = subscribeToUserData('archived_sessions', (data) => {
       setSessions(data || []);
    });
    const unsubGroups = subscribeToUserData('teacher_groups', (data) => {
       setGroups(data || []);
    });
    return () => {
       unsubSessions();
       unsubGroups();
    };
  }, []);

  const groupSessions = useMemo(() => {
    if (!selectedGroupId) return [];
    return sessions.filter(s => s.groupId === selectedGroupId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, selectedGroupId]);

  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId);
  }, [sessions, selectedSessionId]);

  const studentHistory = useMemo(() => {
    if (!selectedGroupId || !selectedStudentName) return [];
    const history: any[] = [];
    
    const sortedSessions = [...groupSessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedSessions.forEach(s => {
       const scan = s.scans.find(scan => scan.name === selectedStudentName);
       if (scan) {
          history.push({
             topic: s.topic,
             date: new Date(s.date).toLocaleDateString(),
             grade: scan.grade,
             score: scan.score,
             maxScore: scan.maxScore
          });
       }
    });
    return history;
  }, [groupSessions, selectedStudentName, selectedGroupId]);

  const uniqueStudentsInGroup = useMemo(() => {
    const students = new Set<string>();
    groupSessions.forEach(s => s.scans.forEach(scan => students.add(scan.name)));
    return Array.from(students).sort();
  }, [groupSessions]);

  const { avg, stdDev, distData } = useMemo(() => {
    if (!currentSession || currentSession.scans.length === 0) return { avg: 0, stdDev: 0, distData: [] };
    
    let sum = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    currentSession.scans.forEach(s => {
       sum += s.grade;
       if (s.grade >= 1 && s.grade <= 5) distribution[s.grade as keyof typeof distribution]++;
    });
    
    const mean = sum / currentSession.scans.length;
    
    let varianceSum = 0;
    currentSession.scans.forEach(s => {
       varianceSum += Math.pow(s.grade - mean, 2);
    });
    const standardDeviation = Math.sqrt(varianceSum / currentSession.scans.length);
    
    const chartData = [
       { grade: '1-es', count: distribution[1] },
       { grade: '2-es', count: distribution[2] },
       { grade: '3-as', count: distribution[3] },
       { grade: '4-es', count: distribution[4] },
       { grade: '5-ös', count: distribution[5] }
    ];

    return { avg: mean, stdDev: standardDeviation, distData: chartData };
  }, [currentSession]);

  const handleSaveEdit = (scanId: string) => {
    const updatedSessions = sessions.map(s => {
      if (s.id === selectedSessionId) {
        const newScans = s.scans.map(scan => scan.id === scanId ? { ...scan, grade: editedGrade, score: editedScore } : scan);
        return { ...s, scans: newScans };
      }
      return s;
    });
    setSessions(updatedSessions);
    saveUserData('archived_sessions', updatedSessions);
    setEditingScanId(null);
  };
  
  const handleDeleteSession = () => {
     if (confirm("Biztosan törlöd ezt a teljes dolgozat archívumot?")) {
        const updatedSessions = sessions.filter(s => s.id !== selectedSessionId);
        setSessions(updatedSessions);
        saveUserData('archived_sessions', updatedSessions);
        setSelectedSessionId('');
     }
  };

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', position: 'relative' }}>
      <h2 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Statisztika és Archívum</h2>
      
      {/* Csoport választó kártyák */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {groups.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)', padding: '20px', background: 'var(--bg-surface-glass)', borderRadius: 'var(--radius-md)' }}>
            Nincsenek létrehozott csoportok.
          </div>
        ) : (
          groups.map(group => {
            const isSelected = selectedGroupId === group.id;
            return (
              <div 
                key={group.id} 
                className="glass-panel" 
                style={{ padding: '10px 14px', cursor: 'pointer', transition: 'all 0.2s ease', border: isSelected ? '1px solid var(--accent-blue)' : undefined, background: isSelected ? 'rgba(88, 166, 255, 0.1)' : undefined, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => { setSelectedGroupId(isSelected ? '' : group.id); setSelectedSessionId(''); setSelectedStudentName(''); }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{group.name}</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{group.subject} • {group.students.length} diák</span>
                </div>
                {isSelected && <CheckCircle2 size={20} color="var(--accent-blue)" />}
              </div>
            );
          })
        )}
      </div>

      {/* Statisztikai tartalom a kártyák ALATT */}
      {selectedGroupId && (
        <div style={{ animation: 'fadeIn 0.3s ease-out', paddingBottom: '70px' }}>
          {groupSessions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>Még nincs archivált dolgozat ebben a csoportban!</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button 
                   onClick={() => setViewMode('session')} 
                   style={{ flex: 1, padding: '10px', borderRadius: '8px', border: viewMode === 'session' ? '1px solid transparent' : '1px solid var(--border-glass)', background: viewMode === 'session' ? 'var(--accent-blue)' : 'var(--bg-surface)', color: 'white', cursor: 'pointer', transition: 'all 0.2s', fontWeight: viewMode === 'session' ? 'bold' : 'normal' }}
                >Dolgozatok</button>
                <button 
                   onClick={() => setViewMode('student')} 
                   style={{ flex: 1, padding: '10px', borderRadius: '8px', border: viewMode === 'student' ? '1px solid transparent' : '1px solid var(--border-glass)', background: viewMode === 'student' ? 'var(--accent-blue)' : 'var(--bg-surface)', color: 'white', cursor: 'pointer', transition: 'all 0.2s', fontWeight: viewMode === 'student' ? 'bold' : 'normal' }}
                >Diákok Fejlődése</button>
              </div>
              
              {viewMode === 'session' && (
                 <div style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Konkrét Dolgozat kiválasztása:</label>
                   <select 
                     value={selectedSessionId} 
                     onChange={e => setSelectedSessionId(e.target.value)}
                     style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'white', outline: 'none' }}
                   >
                     <option value="">Válassz dolgozatot...</option>
                     {groupSessions.map(s => (
                       <option key={s.id} value={s.id}>
                          {new Date(s.date).toLocaleDateString()} - {s.topic} ({s.scans.length} fő)
                       </option>
                     ))}
                   </select>
                 </div>
              )}

              {viewMode === 'student' && (
                 <div style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Diák kiválasztása:</label>
                   <select 
                     value={selectedStudentName} 
                     onChange={e => setSelectedStudentName(e.target.value)}
                     style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'white', outline: 'none' }}
                   >
                     <option value="">Válassz diákot...</option>
                     {uniqueStudentsInGroup.map(name => (
                       <option key={name} value={name}>{name}</option>
                     ))}
                   </select>
                 </div>
              )}

              {/* SESSION mód */}
              {viewMode === 'session' && currentSession && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>{currentSession.topic} Eredményei</h3>
                    <button onClick={handleDeleteSession} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                       <Trash2 size={16} /> Törlés
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div className="glass-panel" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Csoportátlag</div>
                       <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{avg.toFixed(2)}</div>
                    </div>
                    <div className="glass-panel" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Szórás (M)</div>
                       <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{stdDev.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="glass-panel" style={{ padding: '12px', marginBottom: '16px', height: '180px' }}>
                     <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textAlign: 'center' }}>Jegyek Eloszlása</h4>
                     <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={distData}>
                           <XAxis dataKey="grade" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                           <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                           <Bar dataKey="count" fill="var(--accent-green)" radius={[4,4,0,0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>

                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Diákok ({currentSession.scans.length}) és Javítás</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                     {currentSession.scans.map(scan => (
                         <div key={scan.id} className="glass-panel" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                               <strong style={{ fontSize: '15px', display: 'block' }}>{scan.name}</strong>
                               {editingScanId === scan.id ? (
                                   <input type="number" max={scan.maxScore} value={editedScore} onChange={e => setEditedScore(Number(e.target.value))} style={{ width: '60px', marginTop: '4px', padding: '4px', background: 'var(--bg-color)', color: 'white', border: '1px solid gray', borderRadius: '4px' }}/>
                               ) : (
                                   <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Pont: {scan.score}/{scan.maxScore}</span>
                               )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                               {editingScanId === scan.id ? (
                                  <>
                                     <select value={editedGrade} onChange={e => setEditedGrade(Number(e.target.value))} style={{ padding: '4px', background: 'var(--bg-color)', color: 'white', border: '1px solid gray', borderRadius: '4px' }}>
                                       {[1,2,3,4,5].map(g => <option key={g} value={g}>{g}</option>)}
                                     </select>
                                     <button onClick={() => handleSaveEdit(scan.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer' }}><CheckCircle2 size={20} /></button>
                                  </>
                               ) : (
                                  <>
                                     <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{scan.grade}</span>
                                     <button 
                                        onClick={() => { setEditingScanId(scan.id); setEditedGrade(scan.grade); setEditedScore(scan.score); }}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                     >
                                       <Edit2 size={18} />
                                     </button>
                                  </>
                               )}
                            </div>
                         </div>
                     ))}
                  </div>
                </div>
              )}

              {/* STUDENT mód */}
              {viewMode === 'student' && selectedStudentName && studentHistory.length > 0 && (
                 <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '16px' }}>{selectedStudentName} Eredményei</h3>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                       <div className="glass-panel" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Összes Jegy</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{studentHistory.length}</div>
                       </div>
                       <div className="glass-panel" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Átlag</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>
                             {(studentHistory.reduce((acc, val) => acc + val.grade, 0) / studentHistory.length).toFixed(2)}
                          </div>
                       </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '12px', marginBottom: '16px', height: '180px' }}>
                       <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textAlign: 'center' }}>Fejlődési Vonal diagram</h4>
                       <ResponsiveContainer width="100%" height="80%">
                          <LineChart data={studentHistory}>
                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                             <XAxis dataKey="topic" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                             <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                             <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                              <Line type="monotone" dataKey="grade" stroke="#a371f7" strokeWidth={3} dot={{ r: 6, fill: '#a371f7', stroke: '#0d1117', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#a371f7', stroke: '#ffffff', strokeWidth: 2 }} />
                           </LineChart>
                        </ResponsiveContainer>
                     </div>
                    
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Előzmények</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                       {studentHistory.map((h, i) => (
                           <div key={i} className="glass-panel" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                 <strong style={{ fontSize: '15px', display: 'block' }}>{h.topic}</strong>
                                 <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{h.date} - {h.score}/{h.maxScore}p</span>
                              </div>
                              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{h.grade}</span>
                           </div>
                       ))}
                    </div>
                 </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
