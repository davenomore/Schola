import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config';

// BMSZC Neumann János hivatalos csengetési rend
export const BELL_TIMES = {
  0: { start: '06:40', end: '07:25', label: '06:40 - 07:25' },
  1: { start: '07:30', end: '08:15', label: '07:30 - 08:15' },
  2: { start: '08:25', end: '09:10', label: '08:25 - 09:10' },
  3: { start: '09:20', end: '10:05', label: '09:20 - 10:05' },
  4: { start: '10:20', end: '11:05', label: '10:20 - 11:05' },
  5: { start: '11:15', end: '12:00', label: '11:15 - 12:00' },
  6: { start: '12:20', end: '13:05', label: '12:20 - 13:05' },
  7: { start: '13:25', end: '14:10', label: '13:25 - 14:10' },
  8: { start: '14:20', end: '15:05', label: '14:20 - 15:05' },
  9: { start: '15:10', end: '15:55', label: '15:10 - 15:55' },
  10: { start: '16:00', end: '16:40', label: '16:00 - 16:40' },
  11: { start: '16:50', end: '17:30', label: '16:50 - 17:30' },
  12: { start: '17:40', end: '18:20', label: '17:40 - 18:20' }
};

export const DAY_NAMES = {
  1: { short: 'H', full: 'Hétfő' },
  2: { short: 'K', full: 'Kedd' },
  3: { short: 'Sze', full: 'Szerda' },
  4: { short: 'Cs', full: 'Csütörtök' },
  5: { short: 'P', full: 'Péntek' }
};

// Tantárgyankénti témák & színek (tiszta pasztell háttér és kontrasztos, elegáns feliratok)
export const getSubjectColor = (subject = '') => {
  const s = subject.toLowerCase();
  if (s.includes('lyukas')) return { bg: '#ffffff', text: '#71717a', border: '#e4e4e7', accent: '#71717a' };
  if (s.includes('matek') || s.includes('matematika')) return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', accent: '#2563eb' };
  if (s.includes('fizika')) return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', accent: '#9333ea' };
  if (s.includes('érettségi') || s.includes('előkészítő')) return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5', accent: '#ea580c' };
  if (s.includes('osztályfőnöki') || s.includes('ofő')) return { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8', accent: '#db2777' };
  if (s.includes('tehetség') || s.includes('okleveles')) return { bg: '#fffbeb', text: '#b45309', border: '#fde68a', accent: '#d97706' };
  if (s.includes('felzárkóz') || s.includes('korrepetálás')) return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', accent: '#059669' };
  if (s.includes('irodalom') || s.includes('magyar') || s.includes('nyelvtan')) return { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4', accent: '#0d9488' };
  if (s.includes('történelem')) return { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5', accent: '#ea580c' };
  if (s.includes('angol') || s.includes('német') || s.includes('nyelv')) return { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', accent: '#4f46e5' };
  if (s.includes('szoftver') || s.includes('programoz') || s.includes('fejlesztés')) return { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', accent: '#0284c7' };
  if (s.includes('hálózat') || s.includes('adatbázis') || s.includes('digitális')) return { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc', accent: '#0891b2' };
  if (s.includes('testnevelés') || s.includes('tesi')) return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', accent: '#16a34a' };
  return { bg: '#ffffff', text: '#18181b', border: '#e4e4e7', accent: '#2563eb' };
};

// Hivatalos tanári órarend (Varga Dávid - Kréta alapján 100% pontos)
export const OFFICIAL_TEACHER_SCHEDULE = {
  1: [
    { id: 101, hourNumber: 1, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '07:30', duration: '07:30 - 08:15', type: 'Lyukasóra' },
    { id: 102, hourNumber: 2, subject: 'Matematika', details: '11_MK1', room: '225', time: '08:25', duration: '08:25 - 09:10', type: 'Tanóra' },
    { id: 103, hourNumber: 3, subject: 'Matematika', details: '11_MK1', room: '110', time: '09:20', duration: '09:20 - 10:05', type: 'Tanóra' },
    { id: 104, hourNumber: 4, subject: 'Matematika', details: '11_MK1', room: '110', time: '10:20', duration: '10:20 - 11:05', type: 'Tanóra' },
    { id: 105, hourNumber: 5, subject: 'Matematika', details: '11_MK1', room: '110', time: '11:15', duration: '11:15 - 12:00', type: 'Tanóra' },
    { id: 106, hourNumber: 6, subject: 'osztályfőnöki', details: '11.A', room: '225', time: '12:20', duration: '12:20 - 13:05', type: 'Tanóra' },
    { id: 107, hourNumber: 7, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '13:25', duration: '13:25 - 14:10', type: 'Lyukasóra' },
    { id: 108, hourNumber: 8, subject: 'Érettségi előkészítő', details: '4_fizika_12', room: '046', time: '14:20', duration: '14:20 - 15:05', type: 'Foglalkozás' }
  ],
  2: [
    { id: 201, hourNumber: 1, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '07:30', duration: '07:30 - 08:15', type: 'Lyukasóra' },
    { id: 202, hourNumber: 2, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '08:25', duration: '08:25 - 09:10', type: 'Lyukasóra' },
    { id: 203, hourNumber: 3, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '09:20', duration: '09:20 - 10:05', type: 'Lyukasóra' },
    { id: 204, hourNumber: 4, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '10:20', duration: '10:20 - 11:05', type: 'Lyukasóra' },
    { id: 205, hourNumber: 5, subject: 'Matematika', details: '10.c MAT1', room: '005', time: '11:15', duration: '11:15 - 12:00', type: 'Tanóra' },
    { id: 206, hourNumber: 6, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '12:20', duration: '12:20 - 13:05', type: 'Lyukasóra' },
    { id: 207, hourNumber: 7, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '13:25', duration: '13:25 - 14:10', type: 'Lyukasóra' },
    { id: 208, hourNumber: 8, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '14:20', duration: '14:20 - 15:05', type: 'Lyukasóra' },
    { id: 209, hourNumber: 9, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '15:10', duration: '15:10 - 15:55', type: 'Lyukasóra' },
    { id: 210, hourNumber: 10, subject: 'tehetséggondozás', details: 't_okleveles_10', room: 'gt1-online', time: '16:00', duration: '16:00 - 16:40', type: 'Foglalkozás' },
    { id: 211, hourNumber: 11, subject: 'tehetséggondozás', details: 't_okleveles_10', room: 'gt1-online', time: '16:50', duration: '16:50 - 17:30', type: 'Foglalkozás' }
  ],
  3: [
    { id: 301, hourNumber: 1, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '07:30', duration: '07:30 - 08:15', type: 'Lyukasóra' },
    { id: 302, hourNumber: 2, subject: 'Matematika', details: '11_MK1', room: '225', time: '08:25', duration: '08:25 - 09:10', type: 'Tanóra' },
    { id: 303, hourNumber: 3, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '09:20', duration: '09:20 - 10:05', type: 'Lyukasóra' },
    { id: 304, hourNumber: 4, subject: 'Fizika', details: '11.b', room: '046', time: '10:20', duration: '10:20 - 11:05', type: 'Tanóra' },
    { id: 305, hourNumber: 5, subject: 'Érettségi előkészítő', details: '11_fiz1', room: '046', time: '11:15', duration: '11:15 - 12:00', type: 'Foglalkozás' },
    { id: 306, hourNumber: 6, subject: 'Fizika', details: '11.c', room: '110', time: '12:20', duration: '12:20 - 13:05', type: 'Tanóra' },
    { id: 307, hourNumber: 7, subject: 'Fizika', details: '11.a', room: '225', time: '13:25', duration: '13:25 - 14:10', type: 'Tanóra' }
  ],
  4: [
    { id: 401, hourNumber: 1, subject: 'Matematika', details: '11_MK1', room: '225', time: '07:30', duration: '07:30 - 08:15', type: 'Tanóra' },
    { id: 402, hourNumber: 2, subject: 'Matematika', details: '11_MK1', room: '225', time: '08:25', duration: '08:25 - 09:10', type: 'Tanóra' },
    { id: 403, hourNumber: 3, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '09:20', duration: '09:20 - 10:05', type: 'Lyukasóra' },
    { id: 404, hourNumber: 4, subject: 'Matematika', details: '11_MK1', room: '233', time: '10:20', duration: '10:20 - 11:05', type: 'Tanóra' },
    { id: 405, hourNumber: 5, subject: 'Matematika', details: '11_MK1', room: '233', time: '11:15', duration: '11:15 - 12:00', type: 'Tanóra' },
    { id: 406, hourNumber: 6, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '12:20', duration: '12:20 - 13:05', type: 'Lyukasóra' },
    { id: 407, hourNumber: 7, subject: 'Matematika', details: '10.c MAT1', room: '110', time: '13:25', duration: '13:25 - 14:10', type: 'Tanóra' }
  ],
  5: [
    { id: 501, hourNumber: 1, subject: 'Fizika', details: '11.b', room: '046', time: '07:30', duration: '07:30 - 08:15', type: 'Tanóra' },
    { id: 502, hourNumber: 2, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '08:25', duration: '08:25 - 09:10', type: 'Lyukasóra' },
    { id: 503, hourNumber: 3, subject: 'Matematika', details: '11_MK1', room: '225', time: '09:20', duration: '09:20 - 10:05', type: 'Tanóra' },
    { id: 504, hourNumber: 4, subject: 'Matematika', details: '11_MK1', room: '043', time: '10:20', duration: '10:20 - 11:05', type: 'Tanóra' },
    { id: 505, hourNumber: 5, subject: 'Lyukasóra', details: 'Tanári felkészülés', room: '-', time: '11:15', duration: '11:15 - 12:00', type: 'Lyukasóra' },
    { id: 506, hourNumber: 6, subject: 'Fizika', details: '11.a', room: '225', time: '12:20', duration: '12:20 - 13:05', type: 'Tanóra' },
    { id: 507, hourNumber: 7, subject: 'Fizika', details: '11.c', room: '110', time: '13:25', duration: '13:25 - 14:10', type: 'Tanóra' }
  ]
};

export default function Timetable({ setActiveTab, addNotification, currentTime: propCurrentTime }) {
  const [currentTime, setCurrentTime] = useState(propCurrentTime || new Date());
  const [activeScope, setActiveScope] = useState('teacher'); // 'teacher' | 'class'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'daily'
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d : 1;
  });

  const [scheduleData, setScheduleData] = useState(() => {
    if (activeScope === 'teacher') {
      try {
        const saved = localStorage.getItem('schola_cached_schedule_teacher_v4');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed[1] && parsed[1].length > 0) return parsed;
        }
      } catch {}
      return OFFICIAL_TEACHER_SCHEDULE;
    }
    try {
      const saved = localStorage.getItem(`schola_cached_schedule_${activeScope}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { 1: [], 2: [], 3: [], 4: [], 5: [] };
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Filters & display options
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [showFreePeriods, setShowFreePeriods] = useState(false);
  const [hourRangeMode, setHourRangeMode] = useState('all'); // 'all' (1-11) | 'core' (1-7)
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Modals
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedLessonDay, setSelectedLessonDay] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLessonForm, setNewLessonForm] = useState({
    day: 1,
    hourNumber: 1,
    subject: '',
    details: '',
    room: '',
    type: 'Tanóra'
  });

  // Jegyzetek tárolása localStorage-ban (kulcs: `${scope}_d${day}_h${hour}_${subject}`)
  const [lessonNotes, setLessonNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('schola_timetable_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateLessonNote = (key, data) => {
    setLessonNotes(prev => {
      const updated = { ...prev, [key]: { ...(prev[key] || {}), ...data, updatedAt: new Date().toISOString() } };
      try {
        localStorage.setItem('schola_timetable_notes', JSON.stringify(updated));
      } catch (e) {
        console.error('Hiba a jegyzet mentésekor:', e);
      }
      return updated;
    });
    if (addNotification) addNotification('Órajegyzet sikeresen mentve!', 'success', 'Órarend');
  };

  useEffect(() => {
    if (!propCurrentTime) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    } else {
      setCurrentTime(propCurrentTime);
    }
  }, [propCurrentTime]);

  const loadTimetable = async (refresh = false) => {
    if (refresh) setSyncing(true);
    else setLoading(true);

    try {
      const isClass = activeScope === 'class';
      const endpoint = `${API_BASE}/api/timetable/all?isClass=${isClass}${refresh ? '&refresh=true' : ''}`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.success && data.data) {
        const formatted = {};
        for (let d = 1; d <= 5; d++) {
          const dayEntry = data.data[d];
          const list = Array.isArray(dayEntry) ? dayEntry : (dayEntry?.list || []);
          formatted[d] = list.length > 0 ? list : (isClass ? [] : (OFFICIAL_TEACHER_SCHEDULE[d] || []));
        }
        setScheduleData(formatted);
        try {
          localStorage.setItem(`schola_cached_schedule_${isClass ? 'class' : 'teacher_v4'}`, JSON.stringify(formatted));
        } catch {}
        setLastSyncTime(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }));
        if (refresh && addNotification) {
          addNotification('Órarend sikeresen frissítve a Kréta rendszerből!', 'success', 'Kréta Szinkron');
        }
      } else {
        await loadDaysIndividually(isClass, refresh);
      }
    } catch (err) {
      console.warn('Nem sikerült az órarendet egyben lekérni, próbálkozás naponként:', err);
      try {
        await loadDaysIndividually(activeScope === 'class', refresh);
      } catch (e) {
        console.error('Kritikus hiba az órarend betöltésekor:', e);
        if (addNotification) addNotification('Nem sikerült betölteni az órarendet.', 'error', 'Hiba');
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const loadDaysIndividually = async (isClass, refresh) => {
    const promises = [1, 2, 3, 4, 5].map(async (dayIdx) => {
      const url = `${API_BASE}${isClass ? '/api/class-timetable' : '/api/timetable'}?day=${dayIdx}${refresh ? '&refresh=true' : ''}`;
      try {
        const res = await fetch(url);
        const json = await res.json();
        return { day: dayIdx, list: json.data?.list || json.data || [] };
      } catch {
        return { day: dayIdx, list: [] };
      }
    });

    const results = await Promise.all(promises);
    const formatted = {};
    results.forEach(r => {
      formatted[r.day] = (r.list && r.list.length > 0) ? r.list : (!isClass ? (OFFICIAL_TEACHER_SCHEDULE[r.day] || []) : []);
    });
    setScheduleData(formatted);
    setLastSyncTime(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }));
  };

  useEffect(() => {
    loadTimetable(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScope]);

  const weekInfo = useMemo(() => {
    const now = new Date();
    const target = new Date(now.getTime() + weekOffset * 7 * 86400000);
    const day = target.getDay();
    const diff = target.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(target.setDate(diff));

    const days = [1, 2, 3, 4, 5].map((dIdx, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        dayIndex: dIdx,
        name: DAY_NAMES[dIdx].short,
        fullName: DAY_NAMES[dIdx].full,
        date: d.getDate(),
        fullDateString: d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
        isToday: weekOffset === 0 && now.getDay() === dIdx
      };
    });

    const startOfYear = new Date(monday.getFullYear(), 0, 1);
    const pastDays = (monday - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
    const weekType = weekNumber % 2 === 0 ? 'B' : 'A';
    const monthName = monday.toLocaleString('hu-HU', { month: 'long' });
    const year = monday.getFullYear();

    return {
      days,
      title: `${year}. ${monthName} • ${weekNumber}. hét (${weekType} hét)`,
      weekNumber,
      weekType,
      isCurrentWeek: weekOffset === 0
    };
  }, [weekOffset]);

  const liveClassStatus = useMemo(() => {
    if (!weekInfo.isCurrentWeek) return null;
    const todayDay = currentTime.getDay();
    if (todayDay < 1 || todayDay > 5) return { status: 'weekend', label: 'Hétvége van' };

    const todayLessons = (scheduleData[todayDay] || []).filter(o => !o.subject?.toLowerCase().includes('lyukas'));
    if (todayLessons.length === 0) return { status: 'free_day', label: 'Nincs tanóra mára' };

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const currentSeconds = currentMinutes * 60 + currentTime.getSeconds();

    for (let i = 0; i < todayLessons.length; i++) {
      const lesson = todayLessons[i];
      if (!lesson.duration || !lesson.duration.includes('-')) continue;
      const [startStr, endStr] = lesson.duration.split(' - ');
      const startMin = parseInt(startStr.split(':')[0]) * 60 + parseInt(startStr.split(':')[1]);
      const endMin = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        const totalDurationSec = (endMin - startMin) * 60;
        const elapsedSec = currentSeconds - (startMin * 60);
        const remainingMin = endMin - currentMinutes;
        const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSec / totalDurationSec) * 100)));

        return {
          status: 'in_class',
          lesson,
          remainingMin,
          progressPercent,
          label: `${lesson.hourNumber}. óra: ${lesson.subject} (${lesson.room}) • ${remainingMin} perc van hátra`
        };
      }

      if (currentMinutes < startMin) {
        const minsUntil = startMin - currentMinutes;
        return {
          status: 'break',
          nextLesson: lesson,
          minsUntil,
          label: `Szünet • Következik: ${lesson.hourNumber}. óra ${lesson.subject} (${minsUntil}p)`
        };
      }
    }

    return { status: 'after_school', label: 'A mai tanítási nap véget ért' };
  }, [scheduleData, weekInfo.isCurrentWeek, currentTime]);

  const availableFilters = useMemo(() => {
    const subjects = new Set();
    const groups = new Set();

    Object.values(scheduleData).forEach(list => {
      (list || []).forEach(item => {
        if (item.subject && !item.subject.toLowerCase().includes('lyukas')) {
          subjects.add(item.subject);
        }
        if (item.details && !item.details.toLowerCase().includes('tanári')) {
          groups.add(item.details);
        }
      });
    });

    return {
      subjects: Array.from(subjects).sort(),
      groups: Array.from(groups).sort()
    };
  }, [scheduleData]);

  const statistics = useMemo(() => {
    let totalClasses = 0;
    let freePeriods = 0;
    const subjectCounts = {};
    const rooms = new Set();
    const classes = new Set();

    Object.values(scheduleData).forEach(list => {
      (list || []).forEach(item => {
        if (item.subject?.toLowerCase().includes('lyukas')) {
          freePeriods++;
        } else if (item.subject) {
          totalClasses++;
          subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
          if (item.room && item.room !== '-') rooms.add(item.room);
          if (item.details && item.details !== '-') classes.add(item.details);
        }
      });
    });

    const subjectBreakdown = Object.entries(subjectCounts).map(([subj, count]) => ({
      subject: subj,
      count,
      percent: Math.round((count / (totalClasses || 1)) * 100)
    })).sort((a, b) => b.count - a.count);

    return {
      totalClasses,
      freePeriods,
      uniqueSubjectsCount: Object.keys(subjectCounts).length,
      roomsCount: rooms.size,
      classesCount: classes.size,
      subjectBreakdown
    };
  }, [scheduleData]);

  const isLessonVisible = (lesson) => {
    if (!lesson) return false;
    const isFree = lesson.subject?.toLowerCase().includes('lyukas');
    if (!showFreePeriods && isFree) return false;

    if (filterSubject !== 'all' && lesson.subject !== filterSubject && !isFree) return false;
    if (filterGroup !== 'all' && lesson.details !== filterGroup && !isFree) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = lesson.subject?.toLowerCase().includes(q);
      const matchDetails = lesson.details?.toLowerCase().includes(q);
      const matchRoom = lesson.room?.toLowerCase().includes(q);
      if (!matchSubject && !matchDetails && !matchRoom) return false;
    }

    return true;
  };

  const exportToICalendar = () => {
    try {
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Schola//BMSZC Neumann Órarend//HU',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:Schola - ${activeScope === 'class' ? '11.A Osztály' : 'Varga Dávid'} Órarend`
      ];

      weekInfo.days.forEach(dayObj => {
        const dayIdx = dayObj.dayIndex;
        const lessons = scheduleData[dayIdx] || [];

        lessons.forEach(l => {
          if (l.subject?.toLowerCase().includes('lyukas')) return;
          if (!l.duration || !l.duration.includes('-')) return;

          const [startStr, endStr] = l.duration.split(' - ');
          const [startH, startM] = startStr.split(':').map(Number);
          const [endH, endM] = endStr.split(':').map(Number);

          const eventDate = new Date();
          eventDate.setDate(eventDate.getDate() + (weekOffset * 7));
          const currentDay = eventDate.getDay();
          const diff = eventDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + (dayIdx - 1);
          eventDate.setDate(diff);

          const formatICSDate = (d, h, m) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hour = String(h).padStart(2, '0');
            const minute = String(m).padStart(2, '0');
            return `${year}${month}${day}T${hour}${minute}00`;
          };

          const dtStart = formatICSDate(eventDate, startH, startM);
          const dtEnd = formatICSDate(eventDate, endH, endM);
          const uid = `schola_${dayIdx}_${l.hourNumber}_${l.subject}_${Date.now()}@schola.edu`;

          icsContent.push('BEGIN:VEVENT');
          icsContent.push(`UID:${uid}`);
          icsContent.push(`SUMMARY:${l.subject} (${l.details || ''})`);
          icsContent.push(`LOCATION:${l.room || 'BMSZC Neumann'}`);
          icsContent.push(`DESCRIPTION:${l.hourNumber}. óra • Schola Órarend`);
          icsContent.push(`DTSTART:${dtStart}`);
          icsContent.push(`DTEND:${dtEnd}`);
          icsContent.push('STATUS:CONFIRMED');
          icsContent.push('END:VEVENT');
        });
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `schola_orarend_${activeScope}_het_${weekInfo.weekNumber}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (addNotification) {
        addNotification('Naptár (.ics) fájl sikeresen letöltve! Importálható Google / Apple naptárba.', 'success', 'Exportálás');
      }
    } catch (err) {
      console.error('Hiba az iCal export során:', err);
      if (addNotification) addNotification('Nem sikerült az exportálás.', 'error', 'Export Hiba');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddCustomLesson = (e) => {
    e.preventDefault();
    if (!newLessonForm.subject) return;

    const day = parseInt(newLessonForm.day);
    const hour = parseInt(newLessonForm.hourNumber);
    const timeSpan = BELL_TIMES[hour]?.label || `${hour}. óra`;

    const newObj = {
      id: `custom_${Date.now()}`,
      hourNumber: hour,
      subject: newLessonForm.subject,
      details: newLessonForm.details || (activeScope === 'class' ? '11.A' : 'Saját óra'),
      room: newLessonForm.room || '201',
      time: timeSpan.split(' - ')[0],
      duration: timeSpan,
      isActive: false,
      isCustom: true
    };

    setScheduleData(prev => {
      const dayList = [...(prev[day] || [])];
      const existingIdx = dayList.findIndex(o => o.hourNumber === hour);
      if (existingIdx >= 0) {
        dayList[existingIdx] = newObj;
      } else {
        dayList.push(newObj);
        dayList.sort((a, b) => a.hourNumber - b.hourNumber);
      }
      return { ...prev, [day]: dayList };
    });

    setShowAddModal(false);
    setNewLessonForm({ day: 1, hourNumber: 1, subject: '', details: '', room: '', type: 'Tanóra' });
    if (addNotification) addNotification('Óra sikeresen hozzáadva az órarendhez!', 'success', 'Óra felvétele');
  };

  const handleDeleteCustomLesson = (day, lessonId) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(o => o.id !== lessonId)
    }));
    setSelectedLesson(null);
    if (addNotification) addNotification('Óra eltávolítva.', 'info', 'Órarend');
  };

  // Dinamikus óraszámok kiválasztása
  const hourRows = useMemo(() => {
    if (hourRangeMode === 'core') {
      return [1, 2, 3, 4, 5, 6, 7];
    }
    let max = 7;
    Object.values(scheduleData).forEach(list => {
      (list || []).forEach(l => {
        if (l.hourNumber && l.hourNumber > max) max = l.hourNumber;
      });
    });
    const maxHour = Math.min(11, Math.max(7, max));
    const rows = [];
    for (let h = 1; h <= maxHour; h++) {
      rows.push(h);
    }
    return rows;
  }, [scheduleData, hourRangeMode]);

  return (
    <div className="timetable-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '6px', overflow: 'hidden' }}>
      
      {/* EGYESÍTETT, RENDEZETT KOMPAKT FEJLÉC - TISZTA FEHÉR HÁTTÉR ÉS KERET */}
      <div className="timetable-header" style={{ background: '#ffffff', border: '1px solid #ffffff', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', borderRadius: '6px', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: 0 }}>
        
        {/* 1. SOR: Fő vezérlősáv */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', gap: '12px', minHeight: '40px' }}>
          
          {/* Bal oldal: Cím, Hatókör és Élő állapot jelvény */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '15px', letterSpacing: '0.5px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>ÓRAREND</span>
            </div>

            {/* Hatókör választó: Tanári vs Osztály */}
            <div style={{ display: 'flex', background: '#f8fafc', padding: '2px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setActiveScope('teacher')}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: activeScope === 'teacher' ? '600' : '400',
                  background: activeScope === 'teacher' ? 'var(--accent-color)' : 'transparent',
                  color: activeScope === 'teacher' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Saját Órarend
              </button>
              <button 
                onClick={() => setActiveScope('class')}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: activeScope === 'class' ? '600' : '400',
                  background: activeScope === 'class' ? 'var(--accent-color)' : 'transparent',
                  color: activeScope === 'class' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                11.A Osztály
              </button>
            </div>

            {/* Élő állapot kompakt kapszula */}
            {liveClassStatus && weekInfo.isCurrentWeek && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  background: liveClassStatus.status === 'in_class' ? 'rgba(204, 0, 0, 0.08)' : '#f8fafc',
                  border: `1px solid ${liveClassStatus.status === 'in_class' ? 'var(--theme-red)' : '#e2e8f0'}`,
                  color: liveClassStatus.status === 'in_class' ? 'var(--theme-red)' : 'var(--text-secondary)'
                }}
                title={liveClassStatus.label}
              >
                <span style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: liveClassStatus.status === 'in_class' ? 'var(--theme-red)' : '#3b82f6',
                  boxShadow: liveClassStatus.status === 'in_class' ? '0 0 6px var(--theme-red)' : 'none'
                }} />
                <span>{liveClassStatus.label}</span>
              </div>
            )}
          </div>

          {/* Közép: Hétléptető */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
            <button 
              className="btn-icon" 
              onClick={() => setWeekOffset(prev => prev - 1)}
              title="Előző hét"
              style={{ padding: '4px' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            
            <span style={{ fontSize: '11.5px', fontWeight: '600', padding: '0 6px', minWidth: '190px', textAlign: 'center' }}>
              {weekInfo.title}
            </span>

            <button 
              className="btn-icon" 
              onClick={() => setWeekOffset(prev => prev + 1)}
              title="Következő hét"
              style={{ padding: '4px' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>

            {weekOffset !== 0 && (
              <button 
                onClick={() => setWeekOffset(0)}
                style={{
                  background: 'none',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--text-primary)',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  marginLeft: '2px'
                }}
              >
                Ma
              </button>
            )}
          </div>

          {/* Jobb oldal: Nézetváltó és Akciógombok */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            
            {/* Nézetváltó */}
            <div style={{ display: 'flex', background: '#f8fafc', padding: '2px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setViewMode('grid')}
                title="Heti rács nézet"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: viewMode === 'grid' ? '600' : '400',
                  background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Rács
              </button>
              <button 
                onClick={() => setViewMode('daily')}
                title="Napi részletes nézet"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: viewMode === 'daily' ? '600' : '400',
                  background: viewMode === 'daily' ? '#ffffff' : 'transparent',
                  color: viewMode === 'daily' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'daily' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Napok
              </button>
            </div>

            {/* Kréta Szink */}
            <button 
              onClick={() => loadTimetable(true)}
              disabled={syncing}
              className="btn-icon"
              title="Kréta szinkronizáció"
              style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', border: '1px solid #e2e8f0', background: '#ffffff' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>{syncing ? 'Szinkron...' : 'Kréta Szink'}</span>
            </button>

            {/* Naptár export (.ics) */}
            <button 
              onClick={exportToICalendar}
              className="btn-icon"
              title="Letöltés naptárfájlként (.ics)"
              style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', border: '1px solid #e2e8f0', background: '#ffffff' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Naptár</span>
            </button>

            {/* Új óra */}
            <button 
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: '600',
                background: 'var(--accent-color)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Új óra
            </button>

            {/* Statisztika gomb */}
            <button 
              onClick={() => setShowStatsModal(true)}
              className="btn-icon"
              title="Heti statisztikák"
              style={{ padding: '6px', border: '1px solid #e2e8f0', background: '#ffffff' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </button>

            {/* Nyomtatás */}
            <button 
              onClick={handlePrint}
              className="btn-icon"
              title="Nyomtatás"
              style={{ padding: '6px', border: '1px solid #e2e8f0', background: '#ffffff' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
          </div>
        </div>

        {/* 2. SOR: Integrált szűrősáv és kereső (magasság: ~32px) - TISZTA FEHÉR HÁTTÉR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 14px', borderTop: '1px solid #f1f5f9', background: '#ffffff', gap: '10px' }}>
          
          {/* Bal: Szűrők */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tantárgy */}
            <select 
              value={filterSubject} 
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                borderRadius: '3px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                height: '24px'
              }}
            >
              <option value="all">Minden tantárgy ({availableFilters.subjects.length})</option>
              {availableFilters.subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Osztály */}
            <select 
              value={filterGroup} 
              onChange={(e) => setFilterGroup(e.target.value)}
              style={{
                padding: '2px 6px',
                fontSize: '11px',
                borderRadius: '3px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                height: '24px'
              }}
            >
              <option value="all">Minden osztály/csoport ({availableFilters.groups.length})</option>
              {availableFilters.groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Lyukasóra kapcsoló */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={showFreePeriods} 
                onChange={(e) => setShowFreePeriods(e.target.checked)}
                style={{ accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
              Lyukasórák
            </label>

            <span style={{ color: '#e2e8f0', margin: '0 2px' }}>|</span>

            {/* Óraszám tartomány kapcsoló (1-7. vs 1-11.) */}
            <div style={{ display: 'flex', background: '#f8fafc', padding: '1px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setHourRangeMode('all')}
                style={{
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: hourRangeMode === 'all' ? '600' : '400',
                  background: hourRangeMode === 'all' ? 'var(--accent-color)' : 'transparent',
                  color: hourRangeMode === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
                title="Minden óra megjelenítése (1-11.)"
              >
                1-11. óra
              </button>
              <button
                onClick={() => setHourRangeMode('core')}
                style={{
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: hourRangeMode === 'core' ? '600' : '400',
                  background: hourRangeMode === 'core' ? 'var(--accent-color)' : 'transparent',
                  color: hourRangeMode === 'core' ? 'var(--bg-color)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer'
                }}
                title="Csak a délelőtti alaptantárgyak (1-7. óra)"
              >
                1-7. óra
              </button>
            </div>
          </div>

          {/* Jobb: Keresés és szinkron idő */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '170px' }}>
              <input 
                type="text" 
                placeholder="Keresés..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '2px 8px 2px 22px',
                  fontSize: '11px',
                  borderRadius: '3px',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--panel-bg)',
                  color: 'var(--text-primary)',
                  height: '24px',
                  boxSizing: 'border-box'
                }}
              />
              <svg 
                width="11" 
                height="11" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px' }}
                >
                  ×
                </button>
              )}
            </div>

            {lastSyncTime && (
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Szinkron: {lastSyncTime}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FŐ ÓRAREND TARTALOM (GÖRGETÉS NÉLKÜLI TELJES KITÖLTÉS) */}
      <div style={{ flex: 1, minHeight: 0, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', color: 'var(--text-secondary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span style={{ fontSize: '12px' }}>Órarend betöltése...</span>
          </div>
        ) : viewMode === 'grid' ? (
          
          /* HETI MÁTRIX NÉZET - TISZTA FEHÉR ALAP ÉS FEHÉR KERET, MEGNÖVELT BETŰMÉRETEK */
          <div 
            className="timetable-grid-wrapper" 
            style={{ 
              flex: 1, 
              height: '100%', 
              minHeight: 0, 
              borderRadius: '6px', 
              overflow: 'hidden', 
              display: 'grid',
              gridTemplateColumns: '58px repeat(5, minmax(0, 1fr))',
              gridTemplateRows: `32px repeat(${hourRows.length}, minmax(0, 1fr))`,
              gap: '2px',
              background: '#ffffff',
              border: '1px solid #ffffff',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* Fejléc: ÓRA oszlopcímke */}
            <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f0f0f2' }}>
              ÓRA
            </div>

            {/* Fejléc: 5 nap (Hétfő - Péntek) */}
            {weekInfo.days.map(d => (
              <div 
                key={`header-${d.dayIndex}`}
                style={{ 
                  background: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0 10px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  color: d.isToday ? 'var(--theme-red)' : 'var(--text-primary)',
                  borderBottom: '1px solid #f0f0f2',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>{d.fullName}</span>
                  {d.isToday && (
                    <span style={{ fontSize: '9px', background: 'rgba(204, 0, 0, 0.08)', color: 'var(--theme-red)', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase' }}>
                      MA
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11.5px', opacity: 0.7, fontWeight: '500', whiteSpace: 'nowrap' }}>{d.fullDateString}</span>
              </div>
            ))}

            {/* Sorok: Óraszám és 5 nap cellái minden órára */}
            {hourRows.map(hour => {
              const bell = BELL_TIMES[hour] || { label: '' };

              return (
                <React.Fragment key={`row-${hour}`}>
                  {/* Óraszám és kezdési idő */}
                  <div style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px', overflow: 'hidden', borderRight: '1px solid #f0f0f2' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                      {hour}.
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', fontWeight: '500', lineHeight: 1.1, marginTop: '2px' }}>
                      {bell.start || ''}
                    </div>
                  </div>

                  {/* 5 nap adott órájának cellája */}
                  {weekInfo.days.map(d => {
                    const dayLessons = scheduleData[d.dayIndex] || [];
                    const lesson = dayLessons.find(l => l.hourNumber === hour);
                    const isVisible = isLessonVisible(lesson);
                    const isLiveNow = d.isToday && lesson && liveClassStatus?.status === 'in_class' && liveClassStatus.lesson?.hourNumber === hour;
                    const colors = lesson ? getSubjectColor(lesson.subject) : null;
                    const noteKey = lesson ? `${activeScope}_d${d.dayIndex}_h${hour}_${lesson.subject}` : '';
                    const hasNote = noteKey && lessonNotes[noteKey]?.note;
                    const isFree = lesson?.subject?.toLowerCase().includes('lyukas');

                    return (
                      <div 
                        key={`cell-${d.dayIndex}-${hour}`}
                        style={{
                          background: isLiveNow ? '#fef2f2' : '#ffffff',
                          padding: '2px',
                          overflow: 'hidden',
                          height: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        {lesson && isVisible ? (
                          <div 
                            onClick={() => {
                              setSelectedLesson(lesson);
                              setSelectedLessonDay(d.dayIndex);
                            }}
                            style={{
                              background: colors.bg,
                              border: `1.5px solid ${isLiveNow ? 'var(--theme-red)' : colors.border}`,
                              borderRadius: '4px',
                              padding: '3px 7px',
                              height: '100%',
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              overflow: 'hidden',
                              boxShadow: isLiveNow ? '0 0 10px rgba(204, 0, 0, 0.25)' : 'none'
                            }}
                            className="timetable-cell-card"
                          >
                            {isLiveNow && (
                              <div style={{ position: 'absolute', top: '2px', right: '4px', background: 'var(--theme-red)', color: '#fff', fontSize: '8px', fontWeight: 'bold', padding: '0 4px', borderRadius: '2px', textTransform: 'uppercase' }}>
                                Zajlik
                              </div>
                            )}

                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                <h4 style={{ 
                                  fontSize: isFree ? '12px' : '13.5px', 
                                  fontWeight: '700', 
                                  color: colors.text, 
                                  margin: 0, 
                                  whiteSpace: 'nowrap', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  lineHeight: 1.2 
                                }}>
                                  {lesson.subject}
                                </h4>
                                {hasNote && (
                                  <span title="Jegyzet van fűzve hozzá" style={{ fontSize: '11px', flexShrink: 0 }}>📝</span>
                                )}
                              </div>

                              <div style={{ 
                                fontSize: '11.5px', 
                                color: 'var(--text-secondary)', 
                                fontWeight: '500',
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                lineHeight: 1.2, 
                                marginTop: '2px' 
                              }}>
                                {lesson.details}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                              <span style={{ 
                                fontSize: '11px', 
                                fontWeight: '700', 
                                padding: '1px 6px', 
                                borderRadius: '3px', 
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: '#ffffff',
                                color: 'var(--text-primary)',
                                height: '17px',
                                lineHeight: '17px',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}>
                                {lesson.room || '-'}
                              </span>

                              {lesson.isCustom && (
                                <span style={{ fontSize: '9px', opacity: 0.7, fontWeight: '500' }}>manuális</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setNewLessonForm({
                                day: d.dayIndex,
                                hourNumber: hour,
                                subject: '',
                                details: activeScope === 'class' ? '11.A' : '',
                                room: '',
                                type: 'Tanóra'
                              });
                              setShowAddModal(true);
                            }}
                            style={{
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'transparent',
                              borderRadius: '4px',
                              border: '1px dashed #f0f0f2',
                              background: '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.color = 'transparent';
                              e.currentTarget.style.borderColor = '#f0f0f2';
                            }}
                            title={`${d.fullName} ${hour}. óra - Kattints új óra felvételéhez`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>

        ) : (

          /* NAPI RÉSZLETES NÉZET - TISZTA FEHÉR ALAP ÉS KERET */
          <div className="timetable-daily-view" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '780px', margin: '0 auto', width: '100%', height: '100%', overflowY: 'auto', padding: '4px' }}>
            
            {/* Napválasztó fülek */}
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {weekInfo.days.map(d => {
                const dayLessons = (scheduleData[d.dayIndex] || []).filter(l => !l.subject?.toLowerCase().includes('lyukas'));
                const isActive = selectedDay === d.dayIndex;
                return (
                  <button 
                    key={d.dayIndex}
                    onClick={() => setSelectedDay(d.dayIndex)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: `1px solid ${isActive ? 'var(--accent-color)' : '#e2e8f0'}`,
                      background: isActive ? '#ffffff' : '#f8fafc',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500', color: d.isToday ? 'var(--theme-red)' : 'var(--text-primary)' }}>
                        {d.fullName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {d.fullDateString}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500' }}>
                      {dayLessons.length} óra
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Kiválasztott nap óralistája */}
            <div style={{ padding: '14px', borderRadius: '6px', flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>
                    {DAY_NAMES[selectedDay]?.full} – Órarend
                  </h3>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    {weekInfo.days.find(d => d.dayIndex === selectedDay)?.fullDateString} • {activeScope === 'class' ? '11.A Osztály' : 'Varga Dávid'}
                  </span>
                </div>

                <button 
                  onClick={() => {
                    setNewLessonForm({ day: selectedDay, hourNumber: 1, subject: '', details: '', room: '', type: 'Tanóra' });
                    setShowAddModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Óra rögzítése
                </button>
              </div>

              {(() => {
                const dayLessons = (scheduleData[selectedDay] || []).filter(isLessonVisible);
                if (dayLessons.length === 0) {
                  return (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Nincs megjeleníthető tanóra erre a napra.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dayLessons.map(lesson => {
                      const colors = getSubjectColor(lesson.subject);
                      const isLiveNow = weekInfo.isCurrentWeek && selectedDay === currentTime.getDay() && liveClassStatus?.status === 'in_class' && liveClassStatus.lesson?.hourNumber === lesson.hourNumber;
                      const noteKey = `${activeScope}_d${selectedDay}_h${lesson.hourNumber}_${lesson.subject}`;
                      const noteObj = lessonNotes[noteKey];

                      return (
                        <div 
                          key={lesson.id || `${lesson.hourNumber}-${lesson.subject}`}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setSelectedLessonDay(selectedDay);
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '76px 1fr auto',
                            alignItems: 'center',
                            padding: '10px 14px',
                            background: isLiveNow ? '#fef2f2' : colors.bg,
                            border: `1.5px solid ${isLiveNow ? 'var(--theme-red)' : colors.border}`,
                            borderLeft: `4px solid ${isLiveNow ? 'var(--theme-red)' : colors.accent}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: '700' }}>{lesson.hourNumber}. óra</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>{lesson.duration}</div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: colors.text }}>
                                {lesson.subject}
                              </span>
                              {isLiveNow && (
                                <span style={{ background: 'var(--theme-red)', color: '#fff', fontSize: '8px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '2px', textTransform: 'uppercase' }}>
                                  Zajlik
                                </span>
                              )}
                              {noteObj?.note && (
                                <span style={{ fontSize: '11px' }} title="Jegyzet">📝</span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '2px' }}>
                              {lesson.details}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ padding: '3px 10px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '3px', fontSize: '11.5px', fontWeight: '700', background: '#ffffff', color: 'var(--text-primary)' }}>
                              {lesson.room || '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* RÉSZLETES ÓRA MODÁL */}
      {selectedLesson && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setSelectedLesson(null)}
        >
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '6px',
              padding: '20px',
              background: 'var(--panel-bg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedLesson(null)}
              className="btn-icon"
              style={{ position: 'absolute', top: '14px', right: '14px', padding: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {(() => {
              const colors = getSubjectColor(selectedLesson.subject);
              const noteKey = `${activeScope}_d${selectedLessonDay || 1}_h${selectedLesson.hourNumber}_${selectedLesson.subject}`;
              const currentNote = lessonNotes[noteKey] || {};

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                      {selectedLesson.hourNumber}. ÓRA
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {selectedLesson.duration} • {DAY_NAMES[selectedLessonDay]?.full}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, margin: '4px 0 2px 0' }}>
                    {selectedLesson.subject}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    {selectedLesson.details} • Terem: <strong>{selectedLesson.room || '-'}</strong>
                  </div>

                  {/* Gyors ugrások */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    <button 
                      onClick={() => { setSelectedLesson(null); if (setActiveTab) setActiveTab('classroomscreen'); }}
                      style={{ padding: '8px 10px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontSize: '11px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      <div>
                        <div>Classroom Screen</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>Kivetítés</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => { setSelectedLesson(null); if (setActiveTab) setActiveTab('katedra-ai'); }}
                      style={{ padding: '8px 10px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontSize: '11px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                      <div>
                        <div>Katedra AI</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>Óraterv készítés</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => { setSelectedLesson(null); if (setActiveTab) setActiveTab('csoportok'); }}
                      style={{ padding: '8px 10px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontSize: '11px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                      <div>
                        <div>Csoport & Diákok</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>Névsor megnyitása</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => { setSelectedLesson(null); if (setActiveTab) setActiveTab('dolgozatok'); }}
                      style={{ padding: '8px 10px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontSize: '11px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                      <div>
                        <div>Dolgozat Radar</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>Számonkérések</div>
                      </div>
                    </button>
                  </div>

                  {/* Tanári Órajegyzet */}
                  <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: '600' }}>
                        📝 Órajegyzet & Teendők
                      </label>
                      <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>Automatikus mentés</span>
                    </div>

                    <textarea 
                      placeholder="Írj feljegyzést az órához..."
                      defaultValue={currentNote.note || ''}
                      onChange={(e) => updateLessonNote(noteKey, { note: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid var(--panel-border)',
                        background: 'var(--panel-bg)',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {['Dolgozat', 'Kísérlet', 'Gyakorlás', 'Házi ellenőrzés'].map(tag => {
                        const tags = currentNote.tags || [];
                        const isSelected = tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const newTags = isSelected ? tags.filter(t => t !== tag) : [...tags, tag];
                              updateLessonNote(noteKey, { tags: newTags });
                            }}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              border: `1px solid ${isSelected ? 'var(--accent-color)' : 'var(--panel-border)'}`,
                              background: isSelected ? 'var(--accent-color)' : 'transparent',
                              color: isSelected ? 'var(--bg-color)' : 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedLesson.isCustom && (
                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--panel-border)', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteCustomLesson(selectedLessonDay, selectedLesson.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Óra törlése
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* STATISZTIKA MODÁL */}
      {showStatsModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setShowStatsModal(false)}
        >
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              borderRadius: '6px',
              padding: '20px',
              background: 'var(--panel-bg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowStatsModal(false)}
              className="btn-icon"
              style={{ position: 'absolute', top: '14px', right: '14px', padding: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>
              Heti Órarendi Statisztika
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--hover-bg)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Tanórák</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>{statistics.totalClasses}</div>
              </div>
              <div style={{ background: 'var(--hover-bg)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Lyukasórák</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px', color: 'var(--text-secondary)' }}>{statistics.freePeriods}</div>
              </div>
              <div style={{ background: 'var(--hover-bg)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Tantárgyak</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>{statistics.uniqueSubjectsCount}</div>
              </div>
              <div style={{ background: 'var(--hover-bg)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Osztályok</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>{statistics.classesCount}</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Tantárgyi eloszlás:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {statistics.subjectBreakdown.map(item => {
                const colors = getSubjectColor(item.subject);
                return (
                  <div 
                    key={item.subject}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: '500'
                    }}
                  >
                    <span>{item.subject}</span>
                    <span style={{ fontWeight: 'bold' }}>{item.count} óra ({item.percent}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ÚJ ÓRA MODÁL */}
      {showAddModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              borderRadius: '6px',
              padding: '20px',
              background: 'var(--panel-bg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="btn-icon"
              style={{ position: 'absolute', top: '14px', right: '14px', padding: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>
              Új Óra Felvétele
            </h3>

            <form onSubmit={handleAddCustomLesson} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Nap</label>
                  <select 
                    value={newLessonForm.day}
                    onChange={(e) => setNewLessonForm(prev => ({ ...prev, day: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)' }}
                  >
                    {[1, 2, 3, 4, 5].map(d => (
                      <option key={d} value={d}>{DAY_NAMES[d].full}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Óraszám</label>
                  <select 
                    value={newLessonForm.hourNumber}
                    onChange={(e) => setNewLessonForm(prev => ({ ...prev, hourNumber: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                      <option key={h} value={h}>{h}. óra ({BELL_TIMES[h]?.label || ''})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tantárgy neve</label>
                <input 
                  type="text" 
                  required
                  placeholder="pl. Matematika..."
                  value={newLessonForm.subject}
                  onChange={(e) => setNewLessonForm(prev => ({ ...prev, subject: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Osztály</label>
                  <input 
                    type="text" 
                    placeholder="pl. 11.A..."
                    value={newLessonForm.details}
                    onChange={(e) => setNewLessonForm(prev => ({ ...prev, details: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Terem</label>
                  <input 
                    type="text" 
                    placeholder="pl. 201..."
                    value={newLessonForm.room}
                    onChange={(e) => setNewLessonForm(prev => ({ ...prev, room: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--panel-border)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Mégse
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '500', background: 'var(--accent-color)', color: 'var(--bg-color)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Mentés
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nyomtatási és stílus optimalizációk */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .timetable-cell-card:hover {
          filter: brightness(1.05);
          border-color: var(--accent-color) !important;
        }

        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .sidebar, .timetable-header, .btn-icon, select, input {
            display: none !important;
          }
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          .timetable-container {
            height: 100vh !important;
          }
          .timetable-grid-wrapper {
            border: 1px solid #000 !important;
            background: #fff !important;
          }
          .timetable-table th, .timetable-table td {
            border: 1px solid #666 !important;
            color: #000 !important;
            background: #fff !important;
          }
          .timetable-cell-card {
            border: 1px solid #888 !important;
            background: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
}
