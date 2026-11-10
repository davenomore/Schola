import React, { useState, useEffect } from 'react';
import nameDays from '../utils/nameDays.json';
import { API_BASE } from '../config';

const HeadTeacher = ({ addNotification }) => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  
  const [classSchedule, setClassSchedule] = useState([]);
  const [classScheduleDay, setClassScheduleDay] = useState('');
  const [loadingClassSchedule, setLoadingClassSchedule] = useState(false);
  const [classExams, setClassExams] = useState([]);
  const [loadingClassExams, setLoadingClassExams] = useState(false);

  const fetchClassList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/my-class`);
      const data = await response.json();
      if (data.success && data.data) {
        setStudents(data.data);
      }
      
      // Ha cache-ből jött, háttérben lekérjük a frisset
      if (data.fromCache) {
        setSyncStatus('Szinkronizálás folyamatban...');
        fetch(`${API_BASE}/api/my-class?refresh=true`)
          .then(res => res.json())
          .then(freshData => {
            if (freshData.success && freshData.data) {
              setStudents(freshData.data);
              setSyncStatus('Naprakész');
              setTimeout(() => setSyncStatus(''), 3000);
            }
          })
          .catch(e => {
            console.error('Háttérfrissítés sikertelen:', e);
            setSyncStatus('');
          });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassSchedule = async () => {
    setLoadingClassSchedule(true);
    try {
      const response = await fetch(`${API_BASE}/api/class-timetable`);
      const data = await response.json();
      if (data.success && data.data && data.data.list) {
         setClassSchedule(data.data.list);
         setClassScheduleDay(data.data.day);
      }
      if (data.fromCache) {
          fetch(`${API_BASE}/api/class-timetable?refresh=true`)
             .then(res => res.json())
             .then(freshData => {
                 if (freshData.success && freshData.data && freshData.data.list) {
                    setClassSchedule(freshData.data.list);
                    setClassScheduleDay(freshData.data.day);
                    if (addNotification) addNotification('Az osztály órarendje frissítve lett a háttérben!', 'success', 'Kréta Szinkronizáció');
                 }
             })
             .catch(e => {
                console.error(e);
                if (addNotification) addNotification('Nem sikerült frissíteni az órarendet. Lehet, hogy lejárt a munkamenet.', 'error', 'Szinkronizációs hiba');
             });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClassSchedule(false);
    }
  };

  useEffect(() => {
    fetchClassList();
    fetchClassSchedule();
    fetchClassExams();
  }, []);

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
      if (data.success && data.data) {
        setClassExams(data.data);
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, max-content) 1fr 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* 1. Tanulók listája widget */}
        <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', height: '100%' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Osztálynévsor
            </h3>
            <span style={{ background: 'var(--accent-color)', color: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {students.length} fő
            </span>
          </div>
          <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
            {isLoading && students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Betöltés...</div>
            ) : students.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {students.map((student, index) => (
                  <div key={student.id || index} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', flexShrink: 0 }}>
                      {index + 1}.
                    </div>
                    <div style={{ fontWeight: '500', fontSize: 'clamp(10px, 1.5vh, 13px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {student.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Nincs megjeleníthető tanuló. (A szerver a "Tanított Tanulók" nézetből szedi le az adatot).</div>
            )}
          </div>
        </div>

        {/* 2. Oszlop: Statisztika és Osztály Órarend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', minHeight: 0 }}>
          
          {/* Statisztika widget */}
          <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                Statisztika
              </h3>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jelenlegi osztályátlag</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-color)' }}>4.23</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Legjobb tantárgy</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Angol (4.6)</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Leggyengébb</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Matek (3.4)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Osztály Órarend widget */}
          <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Osztály Órarend
            </h3>
            {classScheduleDay && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{classScheduleDay}</span>}
          </div>
          <div style={{ padding: '0', flex: 1, overflowY: 'auto' }}>
            <div className="schedule-list" style={{ padding: '12px' }}>
              {loadingClassSchedule && classSchedule.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Betöltés...</div>
              ) : classSchedule.length > 0 ? (
                classSchedule.map((ora) => (
                  <div key={ora.id} className={`schedule-item ${ora.isActive ? 'active' : ''}`} style={{ padding: '8px 12px', minHeight: '52px' }}>
                    <div className="time" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{ora.hourNumber}. óra</span>
                      {ora.duration && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', fontSize: '10px', fontWeight: '400', letterSpacing: '0px', color: 'var(--text-secondary)' }}>
                          <span>{ora.duration.split(' - ')[0]}</span>
                          <span>{ora.duration.split(' - ')[1]}</span>
                        </div>
                      )}
                    </div>
                    <div className="class-info" style={{ gap: '2px', paddingLeft: '8px' }}>
                      <h4 style={{ fontSize: '14px', margin: 0 }}>{ora.subject}</h4>
                      <p style={{ fontSize: '12px', margin: 0 }}>{ora.details}</p>
                    </div>
                    <div className="room-badge" style={{ fontSize: '11px', padding: '2px 6px' }}>{ora.room}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nincs megjeleníthető óra. (A szerver próbálja letölteni a Kréta Osztály Órarend nézetből).</div>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* 3. Oszlop: Ünnepek és Osztály Dolgozatai */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', minHeight: 0 }}>
          
          {/* Ünnepek és események widget */}
          <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Ünnepek és Események
              </h3>
            </div>
            <div style={{ padding: '16px', maxHeight: '250px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingEvents.length > 0 ? upcomingEvents.map((event, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)', borderLeft: `4px solid ${event.color}` }}>
                    <div style={{ fontSize: '24px' }}>{event.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{event.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{event.type} • <span style={{ color: event.color, fontWeight: 'bold' }}>{event.date}</span></div>
                    </div>
                    <button className="k-button" style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: '1px solid var(--panel-border)' }}>Köszöntés</button>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    A következő 30 napban nincs közelgő esemény.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Osztály Dolgozatai widget */}
          <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                Bejelentett dolgozatok
              </h3>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Következő 30 nap</span>
            </div>
            <div style={{ padding: '0', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loadingClassExams ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Betöltés...</div>
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
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-card)', padding: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)', borderLeft: '4px solid var(--accent-color)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{exam.subject}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{exam.topic || 'Nincs téma megadva'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 'bold', marginTop: '4px' }}>{examDate.toLocaleDateString('hu-HU')} • {dateText}</div>
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
    </div>
  );
};

export default HeadTeacher;
