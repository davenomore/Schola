import React, { useState, useEffect, useMemo } from 'react';
import nameDays from '../utils/nameDays.json';
import { API_BASE } from '../config';

const HeadTeacher = ({ addNotification }) => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  
  const [classExams, setClassExams] = useState([]);
  const [loadingClassExams, setLoadingClassExams] = useState(false);
  const [scheduleSubjects, setScheduleSubjects] = useState([]);
  const [subjectSort, setSubjectSort] = useState('avg_desc');
  const [subjectSearch, setSubjectSearch] = useState('');

  const [gradesData, setGradesData] = useState(() => {
    try {
      const saved = localStorage.getItem('ekreta_grades');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [studentSort, setStudentSort] = useState('default');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [hoveredStudentId, setHoveredStudentId] = useState(null);
  const [studentGradesFilter, setStudentGradesFilter] = useState('all');
  const [modalTab, setModalTab] = useState('ertekelesek');
  const [modalView, setModalView] = useState('grid');

  const subjectsData = useMemo(() => {
    const ekretaGrades = gradesData || {};

    const baseSubjects = [
      { subject: 'Magatartás/Szorgalom', average: 5.00, icon: '⭐' },
      { subject: 'Irodalom', teachers: 'Gönczy-Szabó Gabriella', average: 4.10, icon: '📚' },
      { subject: 'Magyar nyelv', teachers: 'Gönczy-Szabó Gabriella', average: 3.85, icon: '📖' },
      { subject: 'Matematika', teachers: 'Kovácsné Murányi, Varga Dávid, Simon Tibor', average: 3.25, icon: '📐' },
      { subject: 'Történelem', teachers: 'Fenyvessy Gábor', average: 3.80, icon: '🏛️' },
      { subject: 'Fizika', teachers: 'Varga Dávid', average: 3.30, icon: '⚛️' },
      { subject: 'Angol nyelv', teachers: 'Novák Barbara Júlia stb.', average: 4.45, icon: '🇬🇧' },
      { subject: 'Szakmai angol', teachers: 'Novák Barbara Júlia stb.', average: 4.30, icon: '🗣️' },
      { subject: 'Német nyelv', teachers: 'Kiss Anikó', average: 4.10, icon: '🇩🇪' },
      { subject: 'Digitális kultúra', teachers: 'Ferencziné Galó Éva, Orávecz Katalin', average: 4.55, icon: '💻' },
      { subject: 'Testnevelés', teachers: 'Forray Edina', average: 4.60, icon: '🏃' },
      { subject: 'Osztályfőnöki', teachers: 'Varga Dávid', average: 4.90, icon: '🎓' },
      { subject: 'Adatbázis - kezelés I.', teachers: 'Tóth László, Répásiné, Ácsné Bokor K., Kuntyák D.', average: 4.25, icon: '🗄️' },
      { subject: 'Asztali alkalmazások fejlesztése', teachers: 'Kiss Renáta, Karácsony Dávid, Ácsné Bokor K., Kuntyák D., Tóth L.', average: 4.15, icon: '🖥️' },
      { subject: 'Docker', teachers: 'Garda Gyula, Berkes Dániel Krisztián', average: 4.30, icon: '🐳' },
      { subject: 'IKT projektmunka II.', teachers: 'Kiss Renáta, Berkes Dániel, Hamvas V., Kiss Ádin, Tetér Glik M., Péter G.', average: 4.50, icon: '🚀' },
      { subject: 'Webprogramozás', teachers: 'Kiss Ádin André, Ignácz Dominik, Kuntyák Dániel', average: 4.38, icon: '🌐' }
    ];

    // Ha az órarendből jött valós tantárgy és tanár lista, frissítjük a tanárokat
    let merged = baseSubjects.map(item => {
      const fromSchedule = scheduleSubjects.find(s => 
        s.subject.toLowerCase().includes(item.subject.toLowerCase()) || 
        item.subject.toLowerCase().includes(s.subject.toLowerCase())
      );
      return {
        ...item,
        teachers: (fromSchedule && fromSchedule.teachers) ? fromSchedule.teachers : item.teachers,
        lessonsCount: fromSchedule?.lessonsCount || item.lessonsCount
      };
    });

    // Ha van olyan tantárgy az órarendben, ami nincs a base listában, hozzáadjuk
    if (scheduleSubjects.length > 0) {
      scheduleSubjects.forEach(s => {
        const exists = merged.some(m => 
          m.subject.toLowerCase().includes(s.subject.toLowerCase()) || 
          s.subject.toLowerCase().includes(m.subject.toLowerCase())
        );
        if (!exists && s.subject) {
          merged.push({
            subject: s.subject,
            teachers: s.teachers || '',
            average: 4.00,
            icon: '📚'
          });
        }
      });
    }

    return merged.map(item => {
      const matchedKey = Object.keys(ekretaGrades).find(k => 
        k.toLowerCase().includes('11.a') && k.toLowerCase().includes(item.subject.toLowerCase())
      ) || Object.keys(ekretaGrades).find(k => k.toLowerCase().includes(item.subject.toLowerCase()));

      if (matchedKey && ekretaGrades[matchedKey]?.stats?.average > 0) {
        return {
          ...item,
          average: Number(ekretaGrades[matchedKey].stats.average.toFixed(2)),
          count: ekretaGrades[matchedKey].stats.count
        };
      }
      return item;
    });
  }, [scheduleSubjects, gradesData]);

  const overallClassAvg = useMemo(() => {
    if (subjectsData.length === 0) return '0.00';
    const sum = subjectsData.reduce((acc, s) => acc + s.average, 0);
    return (sum / subjectsData.length).toFixed(2);
  }, [subjectsData]);

  const bestSubject = useMemo(() => {
    return [...subjectsData].sort((a, b) => b.average - a.average)[0];
  }, [subjectsData]);

  const worstSubject = useMemo(() => {
    return [...subjectsData].sort((a, b) => a.average - b.average)[0];
  }, [subjectsData]);

  const filteredAndSortedSubjects = useMemo(() => {
    let list = [...subjectsData];
    if (subjectSearch.trim()) {
      const q = subjectSearch.toLowerCase().trim();
      list = list.filter(s => s.subject.toLowerCase().includes(q));
    }
    if (subjectSort === 'avg_desc') {
      list.sort((a, b) => b.average - a.average);
    } else if (subjectSort === 'avg_asc') {
      list.sort((a, b) => a.average - b.average);
    } else if (subjectSort === 'name') {
      list.sort((a, b) => a.subject.localeCompare(b.subject, 'hu'));
    }
    return list;
  }, [subjectsData, subjectSearch, subjectSort]);

  const getAvgColor = (avg) => {
    if (avg >= 4.5) return '#10b981';
    if (avg >= 3.8) return '#3b82f6';
    if (avg >= 3.0) return '#f59e0b';
    return '#ef4444';
  };

  const fetchClassList = async (isManual = false) => {
    setIsLoading(true);
    try {
      const url = isManual ? `${API_BASE}/api/my-class?refresh=true` : `${API_BASE}/api/my-class`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setStudents(data.data);
      }
      
      // Ha cache-ből jött és nem manuális kérés, a háttérben frissítjük a legújabb adatokkal
      if (data.fromCache && !isManual) {
        setSyncStatus('Szinkronizálás...');
        fetch(`${API_BASE}/api/my-class?refresh=true`)
          .then(res => res.json())
          .then(freshData => {
            if (freshData.success && freshData.data && freshData.data.length > 0) {
              setStudents(freshData.data);
              setSyncStatus('Naprakész');
              setTimeout(() => setSyncStatus(''), 3000);
            } else {
              setSyncStatus('');
            }
          })
          .catch(e => {
            console.error('Háttérfrissítés sikertelen:', e);
            setSyncStatus('');
          });
      } else if (isManual) {
        setSyncStatus('Naprakész');
        if (addNotification) addNotification('Osztálynévsor sikeresen frissítve a Krétából!', 'success', 'Kréta Szinkronizáció');
        setTimeout(() => setSyncStatus(''), 3000);
      }
    } catch (e) {
      console.error(e);
      if (isManual && addNotification) {
        addNotification('Nem sikerült frissíteni a névsort a Krétából.', 'error', 'Hiba');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/grades`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setGradesData(json.data);
          try {
            localStorage.setItem('ekreta_grades', JSON.stringify(json.data));
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Jegyek betöltése sikertelen:', e);
    }
  };

  useEffect(() => {
    fetchClassList();
    fetchClassExams();
    fetchGrades();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedStudent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getGradeMonth = (g) => {
    if (g.month && String(g.month).match(/^\d{2}$/)) return String(g.month);
    if (g.date) {
      const m = g.date.match(/\d{4}\.\s*(\d{2})\./);
      if (m) return m[1];
    }
    if (g.month) {
      const s = String(g.month).toLowerCase();
      if (s.includes('szept')) return '09';
      if (s.includes('okt')) return '10';
      if (s.includes('nov')) return '11';
      if (s.includes('dec')) return '12';
      if (s.includes('jan')) return '01';
      if (s.includes('feb')) return '02';
      if (s.includes('már') || s.includes('mar')) return '03';
      if (s.includes('ápr') || s.includes('apr')) return '04';
      if (s.includes('máj') || s.includes('maj')) return '05';
      if (s.includes('jún') || s.includes('jun')) return '06';
    }
    return null;
  };

  const getStudentGradesInfo = (studentName) => {
    if (!gradesData || !studentName) return { count: 0, avg: null, bySubject: {}, allGrades: [] };

    const seenIds = new Set();
    const allGrades = [];
    const bySubject = {};

    Object.entries(gradesData).forEach(([groupKey, group]) => {
      if (!group || !group.students) return;
      const sGrades = group.students[studentName];
      if (sGrades && Array.isArray(sGrades)) {
        let subj = group.subject || (groupKey.includes(' - ') ? groupKey.split(' - ')[1] : groupKey);
        subj = subj.replace(/\s*-\s*11\.?[a-zA-Z]?/g, '').trim();

        sGrades.forEach(g => {
          if (!g.id || !seenIds.has(g.id)) {
            if (g.id) seenIds.add(g.id);
            const val = g.numericValue || parseInt(g.value, 10);
            if (val >= 1 && val <= 5) {
              const gradeObj = {
                ...g,
                numericValue: val,
                subject: subj,
                month: getGradeMonth(g)
              };
              allGrades.push(gradeObj);
              if (!bySubject[subj]) bySubject[subj] = [];
              bySubject[subj].push(gradeObj);
            }
          }
        });
      }
    });

    let weightedSum = 0;
    let totalWeight = 0;
    allGrades.forEach(g => {
      const val = g.numericValue;
      const w = g.weight || 100;
      weightedSum += val * w;
      totalWeight += w;
    });

    const avg = totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : null;

    return { count: allGrades.length, avg, bySubject, allGrades };
  };

  const sortedStudents = useMemo(() => {
    let list = [...students];
    if (studentSort === 'default') {
      return list;
    }

    return list.sort((a, b) => {
      const aInfo = getStudentGradesInfo(a.name);
      const bInfo = getStudentGradesInfo(b.name);

      const aAvg = aInfo.avg !== null ? aInfo.avg : -1;
      const bAvg = bInfo.avg !== null ? bInfo.avg : -1;

      if (studentSort === 'avg_desc') {
        if (bAvg !== aAvg) return bAvg - aAvg;
        return a.name.localeCompare(b.name, 'hu');
      } else if (studentSort === 'avg_asc') {
        if (aAvg === -1 && bAvg !== -1) return 1;
        if (bAvg === -1 && aAvg !== -1) return -1;
        if (aAvg !== bAvg) return aAvg - bAvg;
        return a.name.localeCompare(b.name, 'hu');
      }
      return 0;
    });
  }, [students, studentSort, gradesData]);

  const fetchClassExams = async () => {
    setLoadingClassExams(true);
    try {
      const response = await fetch(`${API_BASE}/api/class-exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiUrl: 'https://bmszc-neumann.e-kreta.hu/api/CalendarApi/GetOrarendKereso?osztalyTanuloOrarendbenNemLatszik=True&tanarId=-1&osztalyCsoportId=353578&tanuloId=-1&teremId=-1&kellCsengetesiRendMegjelenites=true&csakOrarendiOra=false&kellTanoranKivuliFoglalkozasok=false&kellTevekenysegek=false&kellTanevRendje=true&szuresTanevRendjeAlapjan=false&kellOraTemaTooltip=true&start=' + new Date().toISOString().split('T')[0] + '&end=' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + '&_=1'
        })
      });
      const data = await response.json();
      if (data.success) {
        if (data.data) setClassExams(data.data);
        if (data.subjects && data.subjects.length > 0) setScheduleSubjects(data.subjects);
      }
    } catch (e) {
      console.error('Failed to fetch class exams:', e);
    } finally {
      setLoadingClassExams(false);
    }
  };

  const getUpcomingEvents = () => {
    const events = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    students.forEach(student => {
      // 1. Születésnap keresése a rawData-ban (pl. 2008. 10. 07.)
      const birthDateStr = student.rawData && student.rawData.length >= 4 ? student.rawData[3] : null;
      if (birthDateStr && birthDateStr.match(/\d{4}\.\s*\d{2}\.\s*\d{2}\./)) {
        const parts = birthDateStr.replace(/\./g, '').split(' ');
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        let nextBday = new Date(today.getFullYear(), month - 1, day);
        if (nextBday < today && nextBday.getTime() !== today.getTime()) {
           nextBday = new Date(today.getFullYear() + 1, month - 1, day);
        }

        const diffTime = nextBday - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
          let dateText = `${diffDays} nap múlva`;
          if (diffDays === 0) dateText = 'Ma';
          else if (diffDays === 1) dateText = 'Holnap';

          events.push({
            name: student.name,
            type: 'Születésnap',
            date: dateText,
            daysLeft: diffDays,
            icon: '🎂',
            color: '#ef4444'
          });
        }
      }

      // 2. Névnap keresése (Következő 30 napra)
      if (student.name) {
        const firstNames = student.name.split(' ').slice(1); // Keresztnevek kiszedése (Anna, stb.)
        for (let i = 0; i <= 30; i++) {
           const d = new Date(today);
           d.setDate(today.getDate() + i);
           
           const mm = String(d.getMonth() + 1).padStart(2, '0');
           const dd = String(d.getDate()).padStart(2, '0');
           
           const todaysNameDays = nameDays[mm] && nameDays[mm][dd] ? nameDays[mm][dd] : [];
           
           let hasNameDay = false;
           for (const n of firstNames) {
               if (todaysNameDays.includes(n)) {
                   hasNameDay = true;
                   break;
               }
           }
           
           if (hasNameDay) {
               let dateText = `${i} nap múlva`;
               if (i === 0) dateText = 'Ma';
               else if (i === 1) dateText = 'Holnap';
               
               events.push({
                   name: student.name,
                   type: 'Névnap',
                   date: dateText,
                   daysLeft: i,
                   icon: '🎉',
                   color: '#3b82f6'
               });
               break; // Egy diáknak elég a legközelebbi névnapját jelezni
           }
        }
      }
    });

    events.sort((a, b) => a.daysLeft - b.daysLeft);
    return events;
  };

  const upcomingEvents = getUpcomingEvents();

  const filteredUpcomingExams = [...classExams].filter(exam => {
     const examDate = new Date(exam.date);
     const today = new Date();
     today.setHours(0,0,0,0);
     return Math.round((examDate - today) / (1000 * 60 * 60 * 24)) >= 0;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* 1. Tanulók listája widget */}
        <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', height: '100%', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Osztálynévsor
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {syncStatus && (
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{syncStatus}</span>
              )}
              <button 
                onClick={() => fetchClassList(true)}
                disabled={isLoading}
                title="Osztálynévsor frissítése a Krétából"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                <svg 
                  width="15" 
                  height="15" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>
              <span style={{ background: 'var(--accent-color)', color: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {students.length} fő
              </span>
            </div>
          </div>
          {/* Rendezési sáv */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="16" y2="6"/><line x1="4" y1="12" x2="12" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>
              Rendezés:
            </span>
            <select
              value={studentSort}
              onChange={(e) => setStudentSort(e.target.value)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                borderRadius: '4px',
                background: 'var(--bg-card)',
                border: '1px solid var(--panel-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="default">Névsor (Kréta ABC)</option>
              <option value="avg_desc">Eredmény: Legjobb elöl</option>
              <option value="avg_asc">Eredmény: Leggyengébb elöl</option>
            </select>
          </div>

          <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
            {isLoading && students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Betöltés...</div>
            ) : sortedStudents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0, gap: '4px' }}>
                {sortedStudents.map((student, index) => {
                  const studentInfo = getStudentGradesInfo(student.name);
                  const isHovered = hoveredStudentId === (student.id || index);
                  const isSelected = selectedStudent?.name === student.name;
                  const rankBadgeBg = studentSort === 'avg_desc' && index === 0 ? '#f59e0b' : studentSort === 'avg_desc' && index === 1 ? '#94a3b8' : studentSort === 'avg_desc' && index === 2 ? '#d97706' : null;

                  return (
                    <div 
                      key={student.id || index} 
                      onClick={() => setSelectedStudent(student)}
                      onMouseEnter={() => setHoveredStudentId(student.id || index)}
                      onMouseLeave={() => setHoveredStudentId(null)}
                      style={{ 
                        flex: 1,
                        minHeight: '26px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        gap: '8px', 
                        padding: '0 10px', 
                        background: isSelected 
                          ? 'rgba(var(--accent-rgb, 59, 130, 246), 0.18)' 
                          : isHovered 
                            ? 'var(--bg-secondary)' 
                            : 'var(--bg-card)', 
                        borderRadius: '4px', 
                        border: isSelected 
                          ? '1px solid var(--accent-color)' 
                          : isHovered 
                            ? '1px solid var(--accent-color)' 
                            : '1px solid var(--panel-border)',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Kattints a diák jegyeinek megtekintéséhez"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          borderRadius: '50%', 
                          background: rankBadgeBg || (isSelected || isHovered ? 'var(--accent-color)' : 'var(--bg-secondary)'), 
                          color: rankBadgeBg ? '#111827' : (isSelected || isHovered ? 'var(--bg-color)' : 'var(--text-primary)'), 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}>
                          {index + 1}.
                        </div>
                        <div style={{ 
                          fontWeight: isSelected || isHovered ? '600' : '500', 
                          fontSize: 'clamp(11px, 1.5vh, 13px)', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: isSelected || isHovered ? 'var(--accent-color)' : 'inherit'
                        }}>
                          {student.name}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {studentInfo.avg !== null ? (
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            color: getAvgColor(studentInfo.avg),
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: 'var(--bg-secondary)',
                            border: `1px solid ${getAvgColor(studentInfo.avg)}33`
                          }}>
                            {studentInfo.avg.toFixed(2)}
                          </span>
                        ) : isHovered ? (
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>–</span>
                        ) : null}
                        
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isHovered || isSelected ? 0.9 : 0.25, transform: isHovered ? 'translateX(2px)' : 'none', transition: 'all 0.15s ease' }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div>Nincs megjeleníthető tanuló a névsorban.</div>
                <button
                  onClick={() => fetchClassList(true)}
                  disabled={isLoading}
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}
                >
                  {isLoading ? 'Lekérés folyamatban...' : 'Névsor lekérése a Krétából'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Oszlop: Tantárgyi Statisztika */}
        <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', height: '100%', minHeight: 0 }}>
          {/* Fejléc */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
              Tantárgyi Statisztika
            </h3>
            <span style={{ background: 'var(--accent-color)', color: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
              {subjectsData.length} tantárgy
            </span>
          </div>

          {/* Összesített mutatók felül */}
          <div style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '4px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Osztályátlag</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{overallClassAvg}</div>
              </div>
              
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Legjobb tárgy</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#10b981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {bestSubject ? `${bestSubject.subject.split(' ')[0]} (${bestSubject.average.toFixed(2)})` : '–'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Leggyengébb</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#f59e0b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {worstSubject ? `${worstSubject.subject.split(' ')[0]} (${worstSubject.average.toFixed(2)})` : '–'}
                </div>
              </div>
            </div>

            {/* Szűrő és kereső sáv */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Tantárgy keresése..."
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 26px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <select
                value={subjectSort}
                onChange={(e) => setSubjectSort(e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="avg_desc">Legjobb elöl</option>
                <option value="avg_asc">Leggyengébb elöl</option>
                <option value="name">ABC sorrend</option>
              </select>
            </div>
          </div>

          {/* Tantárgyak görgethető listája */}
          <div style={{ padding: '6px 16px 16px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredAndSortedSubjects.map((s, idx) => {
                const avgCol = getAvgColor(s.average);
                const percentWidth = Math.min(100, Math.max(0, (s.average / 5) * 100));
                return (
                  <div
                    key={s.subject || idx}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-card)',
                      borderRadius: '4px',
                      border: '1px solid var(--panel-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{ fontSize: '18px', flexShrink: 0, width: '26px', textAlign: 'center' }}>
                      {s.icon || '📚'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.subject}
                        </span>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: avgCol, flexShrink: 0, marginLeft: '8px' }}>
                          {s.average.toFixed(2)}
                        </span>
                      </div>
                      {s.teachers && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.teachers}
                        </div>
                      )}
                      <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percentWidth}%`,
                            height: '100%',
                            background: avgCol,
                            borderRadius: '2px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Oszlop: Ünnepek és Események + Bejelentett dolgozatok */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0 }}>
          
          {/* Ünnepek és Események widget */}
          <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Ünnepek és Események
              </h3>
              <span style={{ background: 'var(--accent-color)', color: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                {upcomingEvents.length} esemény
              </span>
            </div>
            <div style={{ padding: '12px 14px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--panel-border)', borderLeft: `4px solid ${event.color}` }}>
                    <div style={{ fontSize: '22px' }}>{event.icon}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{event.type} • <span style={{ color: event.color, fontWeight: 'bold' }}>{event.date}</span></div>
                    </div>
                    <button className="k-button" style={{ padding: '3px 8px', fontSize: '11px', background: 'transparent', border: '1px solid var(--panel-border)', flexShrink: 0, cursor: 'pointer' }}>Köszöntés</button>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-secondary)' }}>
                    A következő 30 napban nincs közelgő esemény.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bejelentett dolgozatok widget */}
          <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                Bejelentett dolgozatok
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Következő 30 nap</span>
            </div>
            <div style={{ padding: '0', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loadingClassExams ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>Betöltés...</div>
                ) : filteredUpcomingExams.length > 0 ? (
                  filteredUpcomingExams.map((exam, i) => {
                     const examDate = new Date(exam.date);
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     const diffTime = examDate - today;
                     const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                     let dateText = `${diffDays} nap múlva`;
                     if (diffDays === 0) dateText = 'Ma';
                     if (diffDays === 1) dateText = 'Holnap';

                     return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--panel-border)', borderLeft: '4px solid var(--accent-color)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{exam.subject}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{exam.topic || 'Nincs téma megadva'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: 'bold', marginTop: '3px' }}>{examDate.toLocaleDateString('hu-HU')} • {dateText}</div>
                          </div>
                        </div>
                     )
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Nincs bejelentett dolgozat a következő 30 napban.
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>

      </div>

      {/* Tanuló jegyei részletes Modal felugró ablak */}
      {selectedStudent && (() => {
        const studentInfo = getStudentGradesInfo(selectedStudent.name);
        
        // Adatok a Kréta rawData-ból
        const birthDate = selectedStudent.rawData && selectedStudent.rawData.length >= 5 ? selectedStudent.rawData[4] : null;
        const omId = selectedStudent.rawData && selectedStudent.rawData.length >= 6 ? selectedStudent.rawData[5] : null;

        const gradeBadgeStyles = {
          5: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.4)' },
          4: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.4)' },
          3: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' },
          2: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.4)' },
          1: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.4)' }
        };

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        studentInfo.allGrades.forEach(g => {
          if (distribution[g.numericValue] !== undefined) distribution[g.numericValue]++;
        });

        const modalSubjects = subjectsData.map(s => {
          const matchedSubjectKey = Object.keys(studentInfo.bySubject).find(k => 
            k.toLowerCase().includes(s.subject.toLowerCase()) || s.subject.toLowerCase().includes(k.toLowerCase())
          );
          const grades = matchedSubjectKey ? studentInfo.bySubject[matchedSubjectKey] : [];
          
          let subjWeightedSum = 0;
          let subjTotalWeight = 0;
          grades.forEach(g => {
            const w = g.weight || 100;
            subjWeightedSum += g.numericValue * w;
            subjTotalWeight += w;
          });
          const subjAvg = subjTotalWeight > 0 ? Number((subjWeightedSum / subjTotalWeight).toFixed(2)) : null;

          return {
            ...s,
            grades,
            subjAvg
          };
        });

        const filteredModalSubjects = studentGradesFilter === 'graded' 
          ? modalSubjects.filter(s => s.grades.length > 0)
          : modalSubjects;

        const MONTH_KEYS = ['09', '10', '11', '12', '01_I', 'I', '01_II', '02', '03', '04', '05', '06', 'II'];
        const MONTH_LABELS = {
          '09': '09',
          '10': '10',
          '11': '11',
          '12': '12',
          '01_I': '01/I',
          'I': 'I',
          '01_II': '01/II',
          '02': '02',
          '03': '03',
          '04': '04',
          '05': '05',
          '06': '06',
          'II': 'II'
        };

        // Havi átlagok számítása az alsó összegző sorhoz
        const monthlyAverages = {};
        MONTH_KEYS.forEach(mKey => {
          let sum = 0;
          let count = 0;
          studentInfo.allGrades.forEach(g => {
            const m = g.month || getGradeMonth(g);
            if (m === mKey) {
              sum += g.numericValue;
              count++;
            }
          });
          monthlyAverages[mKey] = count > 0 ? (sum / count).toFixed(2) : null;
        });

        const motherName = selectedStudent.rawData && selectedStudent.rawData.length >= 3 ? selectedStudent.rawData[2] : null;
        const birthPlace = selectedStudent.rawData && selectedStudent.rawData.length >= 4 ? selectedStudent.rawData[3] : null;
        const gender = selectedStudent.rawData && selectedStudent.rawData.length >= 7 ? selectedStudent.rawData[6] : null;
        const trainingName = selectedStudent.rawData && selectedStudent.rawData.length >= 9 ? selectedStudent.rawData[8] : null;

        return (
          <div 
            onClick={() => setSelectedStudent(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '960px',
                height: '88vh',
                maxHeight: '780px',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--panel-border)',
                borderRadius: '6px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Kréta stílusú címsor */}
              <div style={{
                background: 'linear-gradient(90deg, #1e3a5f 0%, #224a73 100%)',
                color: '#ffffff',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                userSelect: 'none',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Tanulói adatok [ {selectedStudent.name} {birthDate ? `- ${birthDate}` : ''} ]
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.85
                    }}
                    title="Bezárás (Esc)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Kétrészes elrendezés: Kréta oldalsó menü + Tartalmi felület */}
              <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                
                {/* Bal oldali Kréta navigáció */}
                <div style={{
                  width: '180px',
                  background: 'var(--bg-card)',
                  borderRight: '1px solid var(--panel-border)',
                  overflowY: 'auto',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {[
                    { id: 'alapadatok', label: 'Alapadatok' },
                    { id: 'ertekelesek', label: 'Értékelések', badge: studentInfo.count > 0 ? studentInfo.count : null },
                    { id: 'elerhetosegek', label: 'Elérhetőségek' },
                    { id: 'szulok', label: 'Szülők, képviselők' },
                    { id: 'jogviszony', label: 'Jogviszony' },
                    { id: 'tanugy', label: 'Tanügy' },
                    { id: 'szocialis', label: 'Szociális' },
                    { id: 'sni', label: 'SNI / BTMN' },
                    { id: 'mulasztasok', label: 'Mulasztások' },
                    { id: 'igazolasok', label: 'Igazolások' },
                    { id: 'orarend', label: 'Órarendi órái' },
                    { id: 'tantargyak', label: 'Tanult tantárgyak' }
                  ].map(tab => (
                    <div
                      key={tab.id}
                      onClick={() => setModalTab(tab.id)}
                      style={{
                        padding: '9px 14px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: modalTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                        background: modalTab === tab.id ? 'var(--accent-color)' : 'transparent',
                        fontWeight: modalTab === tab.id ? '600' : 'normal',
                        borderLeft: modalTab === tab.id ? '3px solid #60a5fa' : '3px solid transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span style={{ fontSize: '10px', background: modalTab === tab.id ? 'rgba(0,0,0,0.25)' : 'var(--bg-secondary)', padding: '1px 5px', borderRadius: '10px' }}>
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Jobb oldali tartalom */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', overflow: 'hidden' }}>
                  
                  {/* Felső információs sáv */}
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--panel-border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>TECHNIKUM - 11.A</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedStudent.name}
                        {studentInfo.avg && (
                          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: getAvgColor(studentInfo.avg) + '22', color: getAvgColor(studentInfo.avg), border: `1px solid ${getAvgColor(studentInfo.avg)}55` }}>
                            Átlag: {studentInfo.avg.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {modalTab === 'ertekelesek' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setModalView('grid')}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: '1px solid var(--panel-border)',
                            background: modalView === 'grid' ? 'var(--accent-color)' : 'transparent',
                            color: modalView === 'grid' ? 'var(--bg-color)' : 'var(--text-primary)',
                            fontWeight: modalView === 'grid' ? '600' : 'normal',
                            cursor: 'pointer'
                          }}
                        >
                          📋 Havi Értékelő Rács
                        </button>
                        <button
                          onClick={() => setModalView('cards')}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: '1px solid var(--panel-border)',
                            background: modalView === 'cards' ? 'var(--accent-color)' : 'transparent',
                            color: modalView === 'cards' ? 'var(--bg-color)' : 'var(--text-primary)',
                            fontWeight: modalView === 'cards' ? '600' : 'normal',
                            cursor: 'pointer'
                          }}
                        >
                          📝 Dolgozatok listája
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fő tartalom nézet szerint */}
                  {modalTab === 'alapadatok' ? (
                    <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                      <h3 style={{ fontSize: '14px', marginBottom: '14px', color: 'var(--accent-color)' }}>Diák Kréta törzslap adatai</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Teljes név</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{selectedStudent.name}</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Oktatási azonosító (OM)</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{omId || '–'}</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Születési idő és hely</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{birthDate || '–'} {birthPlace ? `(${birthPlace})` : ''}</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Anyja születési neve</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{motherName || '–'}</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Osztály</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>11.a</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Képzés típusa</div>
                          <div style={{ fontSize: '13px', marginTop: '2px' }}>{trainingName || 'Technikumi kerettanterv'}</div>
                        </div>
                      </div>
                    </div>
                  ) : modalTab === 'ertekelesek' && modalView === 'grid' ? (
                    /* 1. Kréta Havi Értékelő Rács (Pontosan mint a Kréta screenshoton) */
                    <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto', padding: '12px' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '11px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--panel-border)'
                      }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'center', width: '30px', borderRight: '1px solid var(--panel-border)' }}>#</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left', minWidth: '160px', borderRight: '1px solid var(--panel-border)' }}>Tantárgy</th>
                            {MONTH_KEYS.map(m => (
                              <th key={m} style={{ padding: '6px 4px', textAlign: 'center', width: '36px', borderRight: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                                {MONTH_LABELS[m]}
                              </th>
                            ))}
                            <th style={{ padding: '6px 6px', textAlign: 'center', width: '46px', borderRight: '1px solid var(--panel-border)' }}>Átlag</th>
                            <th style={{ padding: '6px 6px', textAlign: 'center', width: '48px' }}>Átlag (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalSubjects.map((s, idx) => {
                            // Havi jegyek csoportosítása
                            const gradesByMonth = {};
                            MONTH_KEYS.forEach(m => gradesByMonth[m] = []);
                            s.grades.forEach(g => {
                              const m = g.month || getGradeMonth(g);
                              if (gradesByMonth[m]) gradesByMonth[m].push(g);
                            });

                            return (
                              <tr 
                                key={s.subject || idx}
                                style={{
                                  borderBottom: '1px solid var(--panel-border)',
                                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                                }}
                              >
                                <td style={{ padding: '5px 4px', textAlign: 'center', color: 'var(--text-secondary)', borderRight: '1px solid var(--panel-border)' }}>
                                  {idx + 1}
                                </td>
                                <td style={{ padding: '5px 10px', fontWeight: '500', borderRight: '1px solid var(--panel-border)', whiteSpace: 'nowrap' }}>
                                  <span style={{ marginRight: '6px', opacity: 0.6 }}>{s.icon || '📚'}</span>
                                  {s.subject}
                                </td>

                                {MONTH_KEYS.map(m => {
                                  const cellGrades = gradesByMonth[m];
                                  return (
                                    <td 
                                      key={m} 
                                      style={{ 
                                        padding: '4px 2px', 
                                        textAlign: 'center', 
                                        borderRight: '1px solid var(--panel-border)',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      {cellGrades && cellGrades.length > 0 ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
                                          {cellGrades.map((g, gI) => (
                                            <span 
                                              key={gI}
                                              title={`${g.numericValue} - ${g.topic || 'Értékelés'} (${g.date || ''})`}
                                              style={{
                                                fontWeight: 'bold',
                                                fontSize: '12px',
                                                color: gradeBadgeStyles[g.numericValue]?.text || '#ffffff',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              {g.numericValue}
                                            </span>
                                          ))}
                                        </div>
                                      ) : s.subject.includes('Adatbázis') && m === '11' ? (
                                        <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                      ) : null}
                                    </td>
                                  );
                                })}

                                <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid var(--panel-border)', color: s.subjAvg ? getAvgColor(s.subjAvg) : 'inherit' }}>
                                  {s.subjAvg ? s.subjAvg.toFixed(2) : ''}
                                </td>
                                <td style={{ padding: '5px 4px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                  {s.subjAvg ? `${Math.round((s.subjAvg / 5) * 100)}%` : ''}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Érdemjegyek havi átlaga összegző sor */}
                          <tr style={{ background: 'var(--bg-secondary)', fontWeight: 'bold', borderTop: '2px solid var(--panel-border)' }}>
                            <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'left', borderRight: '1px solid var(--panel-border)' }}>
                              Érdemjegyek havi átlaga
                            </td>
                            {MONTH_KEYS.map(m => (
                              <td key={m} style={{ padding: '6px 2px', textAlign: 'center', borderRight: '1px solid var(--panel-border)', color: monthlyAverages[m] ? 'var(--accent-color)' : 'inherit' }}>
                                {monthlyAverages[m] || ''}
                              </td>
                            ))}
                            <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid var(--panel-border)', color: studentInfo.avg ? getAvgColor(studentInfo.avg) : 'inherit' }}>
                              {studentInfo.avg ? studentInfo.avg.toFixed(2) : ''}
                            </td>
                            <td style={{ padding: '6px 4px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                              {studentInfo.avg ? `${Math.round((studentInfo.avg / 5) * 100)}%` : ''}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* 2. Részletes kártyás dolgozat nézet */
                    <div style={{ padding: '16px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredModalSubjects.map((s, idx) => (
                        <div key={s.subject || idx} style={{ padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{s.icon || '📚'}</span>
                              <span style={{ fontWeight: '600' }}>{s.subject}</span>
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: s.subjAvg ? getAvgColor(s.subjAvg) : 'var(--text-secondary)' }}>
                              {s.subjAvg ? `Átlag: ${s.subjAvg.toFixed(2)}` : 'Nincs jegy'}
                            </span>
                          </div>

                          {s.grades.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--panel-border)' }}>
                              {s.grades.map((g, gIdx) => (
                                <div key={gIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: gradeBadgeStyles[g.numericValue]?.bg, color: gradeBadgeStyles[g.numericValue]?.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {g.numericValue}
                                  </span>
                                  <span style={{ fontSize: '11px' }}>{g.topic || 'Értékelés'}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>({g.date || ''})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kréta stílusú alsó Gombsor */}
                  <div style={{ padding: '10px 18px', borderTop: '1px solid var(--panel-border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      style={{
                        padding: '6px 18px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        background: 'transparent',
                        border: '1px solid var(--panel-border)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        letterSpacing: '0.5px'
                      }}
                    >
                      MÉGSE
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default HeadTeacher;
