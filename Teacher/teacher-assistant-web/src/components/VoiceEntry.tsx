import { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle2, X, Sparkles } from 'lucide-react';
import type { Group } from './Groups';
import type { ScanResult } from './Scanner';
import { parseDictation } from '../lib/gemini';
import { saveUserData, subscribeToUserData, getUserData } from '../lib/db';

const VoiceEntry = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [testTopic, setTestTopic] = useState('');
  const [isRetake, setIsRetake] = useState(false);
  const [testType, setTestType] = useState('Dolgozat');
  const [testWeight, setTestWeight] = useState('100%');
  const [testMaxScore, setTestMaxScore] = useState<number>(50);
  const [groupTodos, setGroupTodos] = useState<Record<string, any[]>>({});

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [transcriptToProcess, setTranscriptToProcess] = useState('');
  
  const [pendingResults, setPendingResults] = useState<ScanResult[]>([]);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const unsubGroups = subscribeToUserData('teacher_groups', (data) => {
      const g = data || [];
      setGroups(g);
      setSelectedGroupId(current => current ? current : (g.length > 0 ? g[0].id : ''));
    });

    const unsubTodos = subscribeToUserData('teacher_todos', (data) => {
      setGroupTodos(data || {});
    });

    // Initializing Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
       const recognition = new SpeechRecognition();
       recognition.continuous = false; // one sentence at a time
       recognition.interimResults = true;
       recognition.lang = 'hu-HU';
       
       recognition.onresult = (event: any) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
          transcriptRef.current = current;
       };
       
       recognition.onend = () => {
          setIsListening(false);
          if (transcriptRef.current.trim()) {
             setTranscriptToProcess(transcriptRef.current);
          }
       };

       recognition.onerror = (event: any) => {
          console.error("Speech Error:", event.error);
          setIsListening(false);
       };

       recognitionRef.current = recognition;
    }

    return () => {
      unsubGroups();
      unsubTodos();
    };
  }, []);

  const toggleListening = () => {
    if (!testTopic.trim() || !selectedGroupId) {
       alert("⚠️ Kérlek először adj meg egy témát és válaszd ki a csoportot a képernyő tetején!");
       return;
    }

    if (isListening) {
        recognitionRef.current?.stop();
    } else {
        setTranscript('');
        transcriptRef.current = '';
        try {
            recognitionRef.current?.start();
            setIsListening(true);
        } catch(err) {
            console.error("Could not start recognition:", err);
            alert("A mikrofonhoz való hozzáférés megtagadva vagy nem támogatott ezen az eszközön!");
        }
    }
  };

  useEffect(() => {
    if (transcriptToProcess) {
      processDictation(transcriptToProcess);
      setTranscriptToProcess('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptToProcess]);

  const processDictation = async (text: string) => {
     setIsProcessing(true);
     try {
       const group = groups.find(g => g.id === selectedGroupId);
       const parsedResults = await parseDictation(text, group?.students || []);
       
       const newScans: ScanResult[] = parsedResults.map((p: any) => {
         let finalName = p.name || "Ismeretlen diák";
         
         // Strict fuzzy finding to ensure the exact roster name is returned
         if (group && group.students.length > 0) {
           const query = finalName.toLowerCase();
           let bestMatch = group.students[0]; // fallback default
           let bestScore = -1;

           for (const student of group.students) {
             const studentLower = student.toLowerCase();
             let score = 0;
             
             if (studentLower === query) {
               bestMatch = student;
               bestScore = Infinity;
               break;
             }
             
             // Token matches (valuable!)
              const queryParts = query.split(/\s+/);
              const studentParts = studentLower.split(/\s+/);
             
             queryParts.forEach((qPart: string) => {
                if (qPart.length < 2) return;
                if (studentParts.some(sPart => sPart.includes(qPart) || qPart.includes(sPart))) {
                  score += 15;
                }
             });
             
             // Basic character overlap to break ties
             const sharedChars = [...new Set(studentLower)].filter(c => query.includes(c)).length;
             score += sharedChars;

             if (score > bestScore) {
                bestScore = score;
                bestMatch = student;
             }
           }
           
           finalName = bestMatch;
         }

         const gResult = Number(p.grade) || 0;
         return {
           id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
           groupId: selectedGroupId,
           name: finalName,
           maxScore: testMaxScore,
           score: p.score !== undefined ? Number(p.score) : Math.round((gResult / 5) * testMaxScore),
           grade: gResult,
           testTopic: isRetake ? `${testTopic.trim()} - pót/javító` : testTopic.trim(),
           testType: testType,
           testWeight: testWeight
         };
       });
       
       if (newScans.length === 0) {
          alert("Az AI nem talált diák-illetve jegy párosítást ebben a mondatban.");
       } else {
          setPendingResults(prev => [...prev, ...newScans]); // Add to review board
       }
     } catch (err: any) {
       alert("Hiba történt a feldolgozáskor: " + err.message);
     } finally {
       setIsProcessing(false);
       transcriptRef.current = '';
     }
  };

  const approveAll = async () => {
      const existing = (await getUserData('scanned_tests')) || [];
      const combined = [...existing, ...pendingResults];
      await saveUserData('scanned_tests', combined);
      setPendingResults([]);
      setTranscript('');
  };

  const cancelResult = (idToRemove: string) => {
      setPendingResults(prev => prev.filter(p => p.id !== idToRemove));
  };

  const hasMissingAttrs = !testTopic.trim() || !selectedGroupId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      
      {/* HEADER SECTION */}
      <div style={{ padding: '20px 20px 10px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0, zIndex: 10 }}>
         <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mic size={24} color="var(--accent-purple)" />
            Hangos Jegybevitel
         </h2>
         
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
                placeholder="Dolgozat témája (pl. Órai aktivitás)"
                value={testTopic}
                onChange={e => setTestTopic(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: !testTopic.trim() ? '1px solid #f85149' : '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', boxSizing: 'border-box', outline: 'none' }}
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', paddingTop: '40px' }}>
         
         {/* MICROPHONE BUTTON */}
         <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px' }}>
            {isListening && (
               <div style={{ position: 'absolute', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(163, 113, 247, 0.3)', animation: 'pulse-ring 1.5s infinite' }} />
            )}
            
            <button 
               onClick={toggleListening}
               disabled={isProcessing || hasMissingAttrs}
               style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: isListening ? '#a371f7' : '#161b22',
                  border: isListening ? 'none' : '2px solid var(--accent-purple)',
                  color: 'white',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  cursor: (isProcessing || hasMissingAttrs) ? 'not-allowed' : 'pointer',
                  zIndex: 2,
                  boxShadow: isListening ? '0 0 30px rgba(163, 113, 247, 0.6)' : 'none',
                  opacity: (isProcessing || hasMissingAttrs) ? 0.4 : 1,
                  transition: 'all 0.3s'
               }}
            >
               {isProcessing ? <Sparkles size={40} className="spinning-sparkle" /> : <Mic size={40} color={isListening ? "white" : "var(--accent-purple)"} />}
            </button>
         </div>

         {/* TRANSCRIPT TEXT */}
         <div style={{ minHeight: '60px', width: '100%', textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-glass)', fontStyle: transcript ? 'normal' : 'italic', color: transcript ? 'white' : 'var(--text-secondary)' }}>
            {isProcessing ? "AI feldolgozás..." : transcript ? transcript : (hasMissingAttrs ? "Töltsd ki az adatokat a beszédhez!" : "Kattints a mikrofonra és dictáld be az eredményeket...")}
         </div>

         {/* PENDING RESULTS PANEL */}
         {pendingResults.length > 0 && (
            <div style={{ width: '100%', marginTop: '30px' }}>
               <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  Értelmezett Eredmények 
                  <span style={{ background: 'var(--accent-purple)', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{pendingResults.length} diák</span>
               </h3>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingResults.map((res) => (
                      <div key={res.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px' }}>
                         <div>
                            <strong style={{ fontSize: '16px', color: 'var(--accent-blue)', display: 'block' }}>{res.name}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{res.grade === 0 ? 'Nincs jegy' : 'Jegyet kapott'}</span>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: res.grade === 0 ? 'var(--text-secondary)' : 'var(--accent-green)' }}>{res.grade === 0 ? 'N/A' : res.grade}</span>
                            <button onClick={() => cancelResult(res.id)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
                         </div>
                      </div>
                  ))}
               </div>

               <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingBottom: '90px' }}>
                  <button onClick={() => setPendingResults([])} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#21262d', color: '#f85149', border: '1px solid #30363d', cursor: 'pointer', fontWeight: 'bold' }}>
                     Mégse
                  </button>
                  <button onClick={approveAll} className="btn-primary" style={{ flex: 2, padding: '14px', borderRadius: '12px', background: 'var(--accent-purple)', border: 'none', cursor: 'pointer' }}>
                     Mentés a Listába <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                  </button>
               </div>
            </div>
         )}
      </div>
      
      <style>{`
        @keyframes pulse-ring {
           0% { transform: scale(0.8); opacity: 0.8; }
           100% { transform: scale(1.4); opacity: 0; }
        }
        .spinning-sparkle { animation: pulse-spin 2s ease-in-out infinite; }
        @keyframes pulse-spin { 
           0% { transform: scale(1) rotate(0deg); opacity: 1; } 
           50% { transform: scale(1.2) rotate(180deg); opacity: 0.7; }
           100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default VoiceEntry;
