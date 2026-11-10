import { useState, useEffect, useMemo } from 'react';
import type { Group } from './Groups';
import type { ScanResult } from './Scanner';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveUserData, subscribeToUserData, getUserData } from '../lib/db';

const ManualEntry = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [testTopic, setTestTopic] = useState('');
  const [isRetake, setIsRetake] = useState(false);
  const [testType, setTestType] = useState('Dolgozat');
  const [testWeight, setTestWeight] = useState('100%');
  const [testMaxScore, setTestMaxScore] = useState<number>(50);

  const [archivedSessions, setArchivedSessions] = useState<any[]>([]);
  const [groupTodos, setGroupTodos] = useState<Record<string, any[]>>({});
  
  const [feedbackState, setFeedbackState] = useState<{name: string, grade: number} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubGroups = subscribeToUserData('teacher_groups', (data) => {
      const g = data || [];
      setGroups(g);
      setSelectedGroupId(current => current ? current : (g.length > 0 ? g[0].id : ''));
    });

    const unsubArchived = subscribeToUserData('archived_sessions', (data) => {
      setArchivedSessions(data || []);
    });

    const unsubTodos = subscribeToUserData('teacher_todos', (data) => {
      setGroupTodos(data || {});
    });

    return () => {
      unsubGroups();
      unsubArchived();
      unsubTodos();
    };
  }, []);

  const activeGroup = useMemo(() => {
    return groups.find(g => g.id === selectedGroupId);
  }, [groups, selectedGroupId]);

  // Kiszámolja a diák korábbi teljesítményét az archívumból a screenshotnak megfelelően
  const getStudentStats = (name: string) => {
    const grades: {grade: number, date: string}[] = [];
    archivedSessions.forEach(s => {
       const scan = s.scans.find((x:any) => x.name === name);
       if (scan && scan.grade) {
          grades.push({ grade: scan.grade, date: new Date(s.date).toLocaleDateString('hu-HU', {month: '2-digit', day: '2-digit', year: 'numeric'}) });
       }
    });
    
    if (grades.length === 0) return { count: 0, avg: '-', last: '-' };
    const avg = (grades.reduce((acc, curr) => acc + curr.grade, 0) / grades.length).toFixed(2);
    const last = grades[grades.length - 1]; // chronological normally
    return {
       count: grades.length,
       avg,
       last: `${last.grade} (${last.date})`
    };
  };

  const handleGradeTap = (studentName: string, grade: number) => {
    if (!testTopic.trim() || !selectedGroupId) {
       alert("⚠️ Kérlek először adj meg egy témát és válaszd ki a csoportot a képernyő tetején!");
       window.scrollTo({ top: 0, behavior: 'smooth' });
       return;
    }

    const scanResult: ScanResult = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      groupId: selectedGroupId,
      name: studentName,
      maxScore: testMaxScore,
      score: Math.round((grade / 5) * testMaxScore),
      grade: grade,
      testTopic: isRetake ? `${testTopic.trim()} - pót/javító` : testTopic.trim(),
      testType: testType,
      testWeight: testWeight
    };

    getUserData('scanned_tests').then(existingData => {
       const existing = existingData || [];
       // Filter out if user already manually clicked this student in this session
       const filtered = existing.filter((s: ScanResult) => s.name !== studentName);
       filtered.push(scanResult);
       saveUserData('scanned_tests', filtered);
    });

    // Tap feedback
    setFeedbackState({ name: studentName, grade });
    setTimeout(() => {
        if (feedbackState?.name === studentName) setFeedbackState(null);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      
      {/* HEADER / METADATA SECTION */}
      <div style={{ padding: '20px 20px 10px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0, zIndex: 10 }}>
         <h2 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Manuális Jegybevitel</h2>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select 
              value={selectedGroupId} 
              onChange={e => setSelectedGroupId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: !selectedGroupId ? '1px solid #f85149' : '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none' }}
            >
              <option value="">Válassz csoportot...</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} - {g.subject}</option>
              ))}
            </select>
            
            {(() => {
                const activeTodos = (groupTodos[selectedGroupId] || []).filter((t: any) => !t.completed);
                return activeTodos.length > 0 ? (
                  <div style={{ padding: '12px', marginTop: '8px', backgroundColor: 'rgba(163, 113, 247, 0.1)', borderLeft: '3px solid var(--accent-purple)', borderRadius: '4px', fontSize: '13px', color: '#c5a3ff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        <span style={{ fontSize: '16px' }}>📋</span> Aktív Teendők:
                     </div>
                     <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {activeTodos.map((todo: any) => (
                           <li key={todo.id}>
                              {todo.text} {todo.date && <span style={{ opacity: 0.7, fontSize: '11px', marginLeft: '6px' }}>({todo.date})</span>}
                           </li>
                        ))}
                     </ul>
                  </div>
                ) : null;
            })()}
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Dolgozat témája (pl. Órai Munka)"
                value={testTopic}
                onChange={e => setTestTopic(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: testTopic.trim() ? '1px solid var(--border-glass)' : '1px solid #f85149', background: 'var(--bg-color)', color: 'white', boxSizing: 'border-box', outline: 'none' }}
              />
              <button 
                onClick={() => setIsRetake(!isRetake)}
                title="Pót vagy Javító dolgozat jelölése"
                style={{ 
                   padding: '0 16px', borderRadius: '8px', 
                   background: isRetake ? 'var(--accent-purple)' : 'var(--bg-color)', 
                   border: isRetake ? 'none' : '1px solid var(--border-glass)', 
                   color: 'white', fontWeight: 'bold', cursor: 'pointer',
                   transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                P/J
              </button>
            </div>
            
            <select 
              value={testType} 
              onChange={e => setTestType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none', marginBottom: '8px' }}
            >
              <option value="Dolgozat">Dolgozat</option>
              <option value="Írásbeli témazáró dolgozat">Írásbeli témazáró dolgozat</option>
              <option value="Írásbeli röpdolgozat">Írásbeli röpdolgozat</option>
              <option value="Szóbeli felelet">Szóbeli felelet</option>
              <option value="Órai munka">Órai munka</option>
              <option value="Házi feladat">Házi feladat</option>
              <option value="Beszámoló">Beszámoló</option>
              <option value="Projektmunka">Projektmunka</option>
            </select>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white' }}>
                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>Súlyzó:</span>
                 <select 
                   value={testWeight} 
                   onChange={e => setTestWeight(e.target.value)}
                   style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '14px', padding: '10px 0', cursor: 'pointer', appearance: 'none' }}
                 >
                   <option value="50%">50%</option>
                   <option value="100%">100%</option>
                   <option value="150%">150%</option>
                   <option value="200%">200%</option>
                 </select>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white' }}>
                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>Max:</span>
                 <input 
                   type="number" 
                   value={testMaxScore}
                   onChange={e => setTestMaxScore(Number(e.target.value))}
                   style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '15px' }}
                 />
              </div>
            </div>
         </div>
      </div>

      {/* STUDENT CARDS LIST */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }}>
         {!activeGroup ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20px' }}>Válassz csoportot a diákokhoz...</div>
         ) : (
            activeGroup.students.map(studentName => {
               const stats = getStudentStats(studentName);
               const isRecentlyGraded = feedbackState?.name === studentName;
               const gradedValue = isRecentlyGraded ? feedbackState.grade : null;

               return (
                  <div key={studentName} className="glass-panel" style={{ 
                     borderRadius: '12px',
                     overflow: 'hidden',
                     display: 'flex',
                     flexDirection: 'column',
                     border: isRecentlyGraded ? '1px solid var(--accent-green)' : '1px solid var(--border-glass)',
                     boxShadow: isRecentlyGraded ? '0 0 15px rgba(63,185,80,0.3)' : 'none',
                     transition: 'all 0.2s ease'
                  }}>
                     {/* Kártya Fejléc */}
                     <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-glass)' }}>
                        <h3 style={{ margin: 0, color: 'var(--accent-blue)', fontSize: '18px', fontWeight: '600' }}>{studentName}</h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                           <span>Értékelések: <strong style={{ color: 'white' }}>{stats.count}</strong></span>
                           <span style={{ opacity: 0.3 }}>|</span>
                           <span>Átlag: <strong style={{ color: 'white' }}>{stats.avg}</strong></span>
                           <span style={{ opacity: 0.3 }}>|</span>
                           <span>Utolsó: <strong style={{ color: 'white' }}>{stats.last}</strong></span>
                        </div>
                     </div>
                     
                     {/* 1-5 Gombok Vagy Viszajelzés */}
                     {isRecentlyGraded ? (
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-green)', fontWeight: 'bold', gap: '8px', background: 'rgba(63,185,80,0.1)' }}>
                           <CheckCircle2 size={24} /> {gradedValue}-ös sikeresen mentve a Listába!
                        </div>
                     ) : (
                        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                           {[1, 2, 3, 4, 5].map(grade => (
                              <button 
                                 key={grade} 
                                 onClick={() => handleGradeTap(studentName, grade)}
                                 style={{ 
                                    width: '45px', height: '45px', 
                                    borderRadius: '50%', 
                                    border: '1px solid var(--border-color)', 
                                    background: 'var(--bg-surface)', 
                                    color: 'white', 
                                    fontSize: '20px', 
                                    fontWeight: 'bold',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                                    opacity: (!testTopic.trim() || !selectedGroupId) ? 0.3 : 1,
                                    transition: 'all 0.2s'
                                 }}
                              >
                                 {grade}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               );
            })
         )}
         
         {activeGroup && testTopic && (
            <button className="btn-secondary" onClick={() => navigate('/list')} style={{ marginTop: '20px', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--accent-blue)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(47,129,247,0.3)' }}>
               Irán a Feldolgozó Lista fül <ChevronRight size={20} />
            </button>
         )}
      </div>

    </div>
  );
};

export default ManualEntry;
