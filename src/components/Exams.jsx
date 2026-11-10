import React, { useState, useEffect, useRef } from 'react';
import { getExamDeadlineInfo, DEFAULT_VACATIONS } from '../utils/schoolHolidays';
import { API_BASE } from '../config';

const COLUMNS = [
  { id: 'planned', title: 'Tervezett (Összeállítás)', color: 'var(--accent-color)' },
  { id: 'written', title: 'Megíratva (Javításra vár)', color: '#ef4444' },
  { id: 'graded', title: 'Kijavítva', color: '#3b82f6' },
  { id: 'closed', title: 'Lezárva (Naplózva)', color: '#10b981' }
];

const generateExamId = (exam) => {
  const dateClean = (exam.date || '').replace(/\s+/g, '_');
  const lessonClean = exam.lessonNumber ? `_ora_${exam.lessonNumber}` : '';
  const classClean = (exam.className || '').replace(/\s+/g, '_');
  const subjectClean = (exam.subject || '').replace(/\s+/g, '_');
  const topicClean = (exam.topic || '').replace(/\s+/g, '_');
  return `${dateClean}${lessonClean}_${classClean}_${subjectClean}_${topicClean}`;
};

const Exams = ({ addNotification, vacationDates: propVacations }) => {
  const [exams, setExams] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const dragItem = useRef();
  const dragNode = useRef();

  const [vacationDates, setVacationDates] = useState(() => {
    if (propVacations) return propVacations;
    try {
      const saved = localStorage.getItem('ekreta_vacations');
      return saved ? JSON.parse(saved) : DEFAULT_VACATIONS;
    } catch {
      return DEFAULT_VACATIONS;
    }
  });

  useEffect(() => {
    if (propVacations) {
      setVacationDates(propVacations);
    }
  }, [propVacations]);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualExam, setManualExam] = useState({ date: '', subject: '', className: '', topic: '', type: 'Röpdolgozat' });
  const [groups, setGroups] = useState([]);

  // Kréta szinkronizáció
  const fetchKreta = async () => {
    setIsLoading(true);
    setSyncStatus('Adatok letöltése a Krétából...');
    try {
      const response = await fetch(`${API_BASE}/api/exams`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setSyncStatus('Feldolgozás...');
        setExams(prev => {
          const newExams = { ...prev };
          data.data.forEach(fetchedExam => {
            const uniqueId = generateExamId(fetchedExam);
            const legacyId = `${fetchedExam.date}_${fetchedExam.className}_${fetchedExam.subject}`.replace(/\s+/g, '_');

            // 1. Ha már létezik ezzel az új, részletes egyedi azonosítóval
            if (newExams[uniqueId]) {
              newExams[uniqueId] = {
                ...fetchedExam,
                id: uniqueId,
                status: newExams[uniqueId].status || 'planned'
              };
              return;
            }

            // 2. Régi kulcs migrációja: ha a legacyId létezik a korábbi állapotban
            let inheritedStatus = 'planned';
            if (newExams[legacyId]) {
              if (!newExams[legacyId].topic || newExams[legacyId].topic === fetchedExam.topic) {
                inheritedStatus = newExams[legacyId].status || 'planned';
                delete newExams[legacyId]; // Töröljük a régi hiányos kulcsot
              }
            }

            newExams[uniqueId] = {
              id: uniqueId,
              date: fetchedExam.date,
              dayOfWeek: fetchedExam.dayOfWeek,
              lessonNumber: fetchedExam.lessonNumber,
              subject: fetchedExam.subject,
              className: fetchedExam.className,
              type: fetchedExam.type,
              topic: fetchedExam.topic,
              status: inheritedStatus
            };
          });

          // 3. Biztonsági tisztítás: ha bármelyik legacyId még fennmaradt, takarítsuk el
          data.data.forEach(fetchedExam => {
            const legacyId = `${fetchedExam.date}_${fetchedExam.className}_${fetchedExam.subject}`.replace(/\s+/g, '_');
            if (newExams[legacyId]) {
              delete newExams[legacyId];
            }
          });

          return newExams;
        });
        
        setSyncStatus('');
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('Hiba a letöltéskor.');
      setTimeout(() => setSyncStatus(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Csoportok lekérése a legördülőhöz
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/groups`);
        const data = await response.json();
        if (data.success && data.data) {
          setGroups(data.data.map(g => ({
            value: g.className || g.name || g,
            subject: g.subject || '',
            label: g.className && g.subject ? `${g.className} - ${g.subject}` : (g.name && g.subject ? `${g.name} - ${g.subject}` : (g.className || g.name || g))
          })));
        }
      } catch (e) {
        console.error('Hiba a csoportok lekérésekor', e);
      }
    };
    fetchGroups();

    // Load local storage data
    const saved = localStorage.getItem('ekreta_exams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Töröljük a korábban cache-elt más tanárok által kiírt dolgozatokat
        const filtered = Object.fromEntries(
           Object.entries(parsed).filter(([id, exam]) => !id.startsWith('class_') && !exam.className.includes('(Más tanár)'))
        );
        setExams(filtered);
      } catch (e) {
        console.error('Hiba az elmentett dolgozatok betöltésekor', e);
      }
    }

    // Automatikus szinkronizáció indítása
    fetchKreta();
  }, []);

  // Save to local storage whenever exams change
  useEffect(() => {
    if (Object.keys(exams).length > 0) {
      localStorage.setItem('ekreta_exams', JSON.stringify(exams));
    }
  }, [exams]);

  // Automatikus státusz léptetés idő alapján
  useEffect(() => {
    let hasChanges = false;
    const newExams = { ...exams };
    const ma = new Date();
    ma.setHours(0, 0, 0, 0);

    Object.values(newExams).forEach(exam => {
      if (!exam.date) return;
      // Dátum konvertálása: "2026. 10. 08." -> Date objektum
      const dateParts = exam.date.replace(/\./g, '').split(' ');
      if (dateParts.length >= 3) {
        const examDate = new Date(dateParts[0], parseInt(dateParts[1]) - 1, dateParts[2]);
        
        // Ha aznap van, vagy már elmúlt, és még Tervezett státuszban van
        if (examDate <= ma && exam.status === 'planned') {
          newExams[exam.id].status = 'written'; // Auto átmozgatás Megíratva állapotba
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setExams(newExams);
    }
  }, [exams]);

  const handleAddManualExam = (e) => {
    e.preventDefault();
    if (!manualExam.className || !manualExam.subject) return;

    // Magyar formátumú dátum generálása (YYYY. MM. DD.)
    const dateObj = manualExam.date ? new Date(manualExam.date) : new Date();
    const formattedDate = `${dateObj.getFullYear()}. ${(dateObj.getMonth() + 1).toString().padStart(2, '0')}. ${dateObj.getDate().toString().padStart(2, '0')}.`;
    
    const uniqueId = `manual_${Date.now()}`;
    setExams(prev => ({
      ...prev,
      [uniqueId]: {
        id: uniqueId,
        date: formattedDate,
        dayOfWeek: '',
        lessonNumber: '',
        subject: manualExam.subject,
        className: manualExam.className,
        type: manualExam.type,
        topic: manualExam.topic,
        status: 'planned'
      }
    }));
    setShowManualForm(false);
    setManualExam({ date: '', subject: '', className: '', topic: '', type: 'Röpdolgozat' });
  };

  const handleDragStart = (e, params) => {
    dragItem.current = params;
    dragNode.current = e.target;
    dragNode.current.addEventListener('dragend', handleDragEnd);
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnter = (e, targetStatus) => {
    if (dragNode.current && dragNode.current !== e.target) {
      e.preventDefault();
      // Opcionális: Vizuális jelzés, ahogy áthúzzák
    }
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    if (dragItem.current && dragItem.current.status !== status) {
      const examId = dragItem.current.id;
      setExams(prev => ({
        ...prev,
        [examId]: {
          ...prev[examId],
          status: status
        }
      }));
    }
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    dragItem.current = null;
    dragNode.current.removeEventListener('dragend', handleDragEnd);
    dragNode.current = null;
  };

  const deleteExam = (id) => {
    if(window.confirm('Biztosan törlöd ezt a bejegyzést? (Krétából nem törlődik, csak innen)')) {
       setExams(prev => {
          const newState = {...prev};
          delete newState[id];
          return newState;
       });
    }
  }

  // Típus alapján szín
  const getTypeColor = (type) => {
    if (!type) return '#6b7280';
    if (type.toLowerCase().includes('témazáró')) return '#ef4444';
    if (type.toLowerCase().includes('röpdolgozat')) return '#f59e0b';
    if (type.toLowerCase().includes('beszámoló')) return '#3b82f6';
    if (type.toLowerCase().includes('gyakorlati')) return '#10b981';
    return '#8b5cf6';
  };

  // 15 munkanapos határidő számolása (a hétvégék, az állami ünnepek és az iskolai szünetek NEM számítanak bele!)
  const getDeadlineInfo = (examDateStr, status) => {
    return getExamDeadlineInfo(examDateStr, status, vacationDates);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Dolgozat Radar</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Kövesd nyomon a papírmunkát az összeállítástól a kiosztásig</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {syncStatus && <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{syncStatus}</span>}
          <button 
            onClick={() => fetchKreta()} 
            disabled={isLoading}
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
            title="Dolgozatok frissítése a Krétából"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            {isLoading ? 'Szinkronizálás...' : 'Szinkronizálás'}
          </button>
          <button 
            onClick={() => setShowManualForm(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Új Manuális Felvitel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, overflowX: 'hidden', paddingBottom: '16px' }}>
        {COLUMNS.map(column => (
          <div 
            key={column.id} 
            className="glass-panel card"
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              borderRadius: '4px',
              borderTop: `4px solid ${column.color}`,
              background: 'var(--bg-secondary)',
              height: '100%',
              minHeight: '400px'
            }}
            onDragEnter={(e) => handleDragEnter(e, column.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>{column.title}</span>
              <span style={{ background: 'var(--accent-color)', color: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                {Object.values(exams).filter(e => e.status === column.id).length}
              </span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.values(exams)
                .filter(exam => exam.status === column.id)
                .sort((a, b) => {
                  // Dátum szerinti rendezés (ha van)
                  if (!a.date || !b.date) return 0;
                  return a.date.localeCompare(b.date);
                })
                .map(exam => (
                  <div 
                    key={exam.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { id: exam.id, status: exam.status })}
                    style={{ 
                      background: 'var(--bg-card)', 
                      padding: '12px', 
                      borderRadius: '4px', 
                      border: '1px solid var(--panel-border)',
                      cursor: 'grab',
                      position: 'relative'
                    }}
                    className="group"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: `${getTypeColor(exam.type)}20`, color: getTypeColor(exam.type) }}>
                        {exam.type || 'Dolgozat'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {exam.date} {exam.lessonNumber ? `• ${exam.lessonNumber}. óra` : ''}
                        </span>
                        <button 
                           onClick={() => deleteExam(exam.id)}
                           className="delete-exam-btn"
                           style={{ opacity: 0.5, transition: 'opacity 0.2s', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                           title="Törlés a tábláról"
                           onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#ef4444'; }}
                           onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                    
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{exam.className} • {exam.subject}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{exam.topic}</p>
                    
                    {/* Határidő kijelzése a 'written' oszlopban (15 munkanap, szünetek levonásával) */}
                    {(() => {
                      const deadline = getDeadlineInfo(exam.date, exam.status);
                      if (!deadline) return null;
                      
                      const isWarning = deadline.isWarning;
                      const isLate = deadline.isLate;
                      
                      return (
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '6px 8px', 
                          borderRadius: '4px', 
                          background: isLate ? 'rgba(239, 68, 68, 0.1)' : isWarning ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-card)',
                          border: `1px solid ${isLate ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--panel-border)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontWeight: isWarning || isLate ? 'bold' : 'normal',
                          color: isLate ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--text-secondary)',
                          fontSize: '11px'
                        }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            {isLate 
                              ? `Késésben: ${Math.abs(deadline.workDaysLeft)} munkanapja (Határidő: ${deadline.dateStr})` 
                              : deadline.isToday
                              ? `Határidő ma lejár! (${deadline.dateStr})`
                              : `Határidő: ${deadline.workDaysLeft} munkanap múlva (${deadline.dateStr})`
                            }
                          </div>

                          {deadline.skippedVacations && deadline.skippedVacations.length > 0 && (
                            <div style={{ 
                              fontSize: '10px', 
                              color: 'var(--accent-color)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              opacity: 0.95,
                              fontWeight: '500'
                            }}>
                              <span>🏖️ Levonva: {deadline.skippedVacations.join(', ')} (szünet nem számít)</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {/* Delete button volt itt */}
                  </div>
                ))}
                
                {Object.values(exams).filter(exam => exam.status === column.id).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', opacity: 0.5 }}>
                    Húzz ide kártyákat
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    {showManualForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ background: 'var(--panel-bg)', padding: '24px', borderRadius: '0px', width: '400px', maxWidth: '90%', border: '1px solid var(--panel-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-primary)' }}>Manuális Dolgozat / Számonkérés</h3>
            <form onSubmit={handleAddManualExam} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Osztály / Csoport*</label>
                {groups.length > 0 ? (
                  <select required value={manualExam.className} onChange={e => {
                      const selectedGroup = groups.find(g => g.value === e.target.value);
                      setManualExam({...manualExam, className: e.target.value, subject: selectedGroup && selectedGroup.subject ? selectedGroup.subject : manualExam.subject});
                  }} className="k-input" style={{ width: '100%', boxSizing: 'border-box', borderRadius: '0' }}>
                    <option value="" disabled>Válassz osztályt/csoportot...</option>
                    {groups.map((g, i) => (
                      <option key={i} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                ) : (
                  <input required type="text" value={manualExam.className} onChange={e => setManualExam({...manualExam, className: e.target.value})} className="k-input" placeholder="Pl. 10.A" style={{ width: '100%', boxSizing: 'border-box', borderRadius: '0' }} />
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tantárgy*</label>
                {groups.filter(g => g.subject).length > 0 ? (
                  <select required value={manualExam.subject} onChange={e => setManualExam({...manualExam, subject: e.target.value})} className="k-input" style={{ width: '100%', boxSizing: 'border-box', borderRadius: '0' }}>
                    <option value="" disabled>Válassz tantárgyat...</option>
                    {[...new Set(groups.map(g => g.subject).filter(Boolean))].map((subj, i) => (
                      <option key={i} value={subj}>{subj}</option>
                    ))}
                  </select>
                ) : (
                  <input required type="text" value={manualExam.subject} onChange={e => setManualExam({...manualExam, subject: e.target.value})} className="k-input" placeholder="Pl. Történelem" style={{ width: '100%', boxSizing: 'border-box', borderRadius: '0' }} />
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Típus</label>
                <select value={manualExam.type} onChange={e => setManualExam({...manualExam, type: e.target.value})} className="k-input" style={{ width: '100%', boxSizing: 'border-box', borderRadius: '0' }}>
                  <option value="Röpdolgozat">Röpdolgozat</option>
                  <option value="Témazáró dolgozat">Témazáró dolgozat</option>
                  <option value="Beszámoló">Beszámoló</option>
                  <option value="Gyakorlati feladat">Gyakorlati feladat</option>
                  <option value="Projektmunka">Projektmunka</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Téma</label>
                <input type="text" value={manualExam.topic} onChange={e => setManualExam({...manualExam, topic: e.target.value})} className="k-input" placeholder="Pl. Az első világháború" style={{ width: '100%', boxSizing: 'border-box', borderRadius: '0' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dátum</label>
                <input type="date" value={manualExam.date} onChange={e => setManualExam({...manualExam, date: e.target.value})} className="k-input" style={{ width: '100%', boxSizing: 'border-box', borderRadius: '0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowManualForm(false)} className="k-button" style={{ background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', borderRadius: '0' }}>Mégse</button>
                <button type="submit" className="k-button primary" style={{ borderRadius: '0' }}>Hozzáadás</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
