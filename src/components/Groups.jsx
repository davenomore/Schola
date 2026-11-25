import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../config';

const GRADE_COLORS = {
  5: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  4: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  3: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  2: { bg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)' },
  1: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
};

export default function Groups({ addNotification }) {
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('ekreta_groups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [gradesData, setGradesData] = useState(() => {
    try {
      const saved = localStorage.getItem('ekreta_grades');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    const saved = localStorage.getItem('ekreta_selected_group_id');
    return saved || '';
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('all'); // all, failing, excellent
  const [studentSort, setStudentSort] = useState('name'); // name, avg_desc, avg_asc
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Témák / Dolgozatok statisztikái és szűrés
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [viewMode, setViewMode] = useState('students'); // 'students' | 'topics'
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [topicStudentFilter, setTopicStudentFilter] = useState('all'); // 'all', 'written', 'missing'

  // Group modal form states
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormSubject, setGroupFormSubject] = useState('');
  const [groupFormStudents, setGroupFormStudents] = useState('');

  // Add Grade modal states
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState('');
  const [gradeValue, setGradeValue] = useState(5);
  const [gradeWeight, setGradeWeight] = useState(100);
  const [gradeType, setGradeType] = useState('Témazáró dolgozat');
  const [gradeTopic, setGradeTopic] = useState('');
  const [gradeDate, setGradeDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Load Groups and Grades from server
  const syncWithKreta = async (manual = false) => {
    setIsSyncing(true);
    try {
      // 1. Csoportok lekérése
      const groupsUrl = manual ? `${API_BASE}/api/groups?refresh=true` : `${API_BASE}/api/groups`;
      const groupsRes = await fetch(groupsUrl);
      const groupsJson = await groupsRes.json();
      if (groupsJson.success && Array.isArray(groupsJson.data) && groupsJson.data.length > 0) {
        const newGroups = groupsJson.data.map(g => ({
          id: g.id,
          name: g.className,
          subject: g.subject,
          students: g.students || []
        }));
        setGroups(current => {
          const manualGroups = current.filter(g => !String(g.id).includes(' - '));
          const merged = [...manualGroups, ...newGroups];
          localStorage.setItem('ekreta_groups', JSON.stringify(merged));
          return merged;
        });
      }

      // 2. Jegyek lekérése
      const gradesUrl = manual ? `${API_BASE}/api/grades?refresh=true` : `${API_BASE}/api/grades`;
      try {
        const gradesRes = await fetch(gradesUrl);
        if (gradesRes.ok) {
          const gradesJson = await gradesRes.json();
          if (gradesJson.success && gradesJson.data && Object.keys(gradesJson.data).length > 0) {
            setGradesData(gradesJson.data);
            localStorage.setItem('ekreta_grades', JSON.stringify(gradesJson.data));
          }
        }
      } catch (e) {
        console.warn('Jegyek lekérése figyelmeztetés:', e.message);
      }

      if (manual && addNotification) {
        addNotification('A csoportok és jegyek sikeresen frissítve a Krétából!', 'success', 'Kréta Szinkronizáció');
      }
    } catch (err) {
      console.error('Szinkronizációs hiba:', err);
      if (manual && addNotification) {
        addNotification('Nem sikerült a szinkronizálás a Krétával.', 'error', 'Hiba');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncWithKreta(false);
  }, []);

  // Kiválasztott csoport alapértelmezése és mentése
  useEffect(() => {
    if (groups.length > 0 && (!selectedGroupId || !groups.find(g => g.id === selectedGroupId))) {
      setSelectedGroupId(groups[0].id);
      localStorage.setItem('ekreta_selected_group_id', groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const handleSelectGroup = (id) => {
    setSelectedGroupId(id);
    setSelectedTopic('all');
    setExpandedTopic(null);
    setTopicStudentFilter('all');
    localStorage.setItem('ekreta_selected_group_id', id);
  };

  // Csoport jegyadatok keresése (pontos és fuzzy illesztéssel)
  const getGroupGradeData = (group) => {
    if (!group || !gradesData) return null;
    const directKey = group.id;
    const compositeKey = `${group.name} - ${group.subject}`.trim();
    if (gradesData[directKey]) return gradesData[directKey];
    if (gradesData[compositeKey]) return gradesData[compositeKey];
    if (gradesData[group.name]) return gradesData[group.name];

    const cleanName = (group.name || '').toLowerCase().trim();
    const foundKey = Object.keys(gradesData).find(k => {
      const lk = k.toLowerCase().trim();
      return lk === cleanName || lk.startsWith(cleanName) || cleanName.startsWith(lk);
    });
    return foundKey ? gradesData[foundKey] : null;
  };

  // Aktív csoport
  const activeGroup = useMemo(() => {
    return groups.find(g => g.id === selectedGroupId) || groups[0] || null;
  }, [groups, selectedGroupId]);

  const activeGroupGrades = useMemo(() => {
    return getGroupGradeData(activeGroup);
  }, [activeGroup, gradesData]);

  // Statisztikák számítása az aktív csoporthoz
  const computedStats = useMemo(() => {
    if (!activeGroup) return null;

    // Ha a Kréta cache-ben már benne van a szerver oldalon számolt statisztika:
    if (activeGroupGrades?.stats && activeGroupGrades.stats.count > 0) {
      return {
        ...activeGroupGrades.stats,
        studentCount: activeGroup.students?.length || 0
      };
    }

    const students = activeGroup.students || [];
    const gradeObj = activeGroupGrades?.students || {};

    let totalWeightedSum = 0;
    let totalWeight = 0;
    const allNumericGrades = [];
    let failingCount = 0;
    let excellentCount = 0;
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    students.forEach(sName => {
      const sGrades = gradeObj[sName] || [];
      let sWeighted = 0;
      let sWeight = 0;

      sGrades.forEach(g => {
        const val = g.numericValue || parseInt(g.value, 10);
        if (val >= 1 && val <= 5) {
          const w = g.weight || 100;
          sWeighted += val * w;
          sWeight += w;
          dist[val] = (dist[val] || 0) + 1;
          allNumericGrades.push(val);
        }
      });

      if (sWeight > 0) {
        const sAvg = sWeighted / sWeight;
        totalWeightedSum += sWeighted;
        totalWeight += sWeight;
        if (sAvg < 2.0) failingCount++;
        if (sAvg >= 4.5) excellentCount++;
      }
    });

    const totalCount = allNumericGrades.length;
    const avg = totalWeight > 0 ? (totalWeightedSum / totalWeight) : 0;

    let median = 0;
    if (totalCount > 0) {
      const sorted = [...allNumericGrades].sort((a, b) => a - b);
      const mid = Math.floor(totalCount / 2);
      median = totalCount % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2);
    }

    return {
      average: avg > 0 ? Number(avg.toFixed(2)) : null,
      median: median > 0 ? Number(median.toFixed(2)) : null,
      count: totalCount,
      failingCount,
      excellentCount,
      distribution: dist,
      studentCount: students.length
    };
  }, [activeGroup, activeGroupGrades]);

  // Cím / Téma kinyerése egységesen
  const getGradeTopicTitle = (g) => {
    if (g.topic && typeof g.topic === 'string' && g.topic.trim() && g.topic.trim() !== '-') {
      return g.topic.trim();
    }
    if (g.type && typeof g.type === 'string' && g.type.trim() && g.type.trim() !== '-') {
      return g.type.trim();
    }
    return 'Egyéb értékelés';
  };

  // Azonos címen szerzett jegyek csoportosítása és statisztikái
  const computedTopics = useMemo(() => {
    if (!activeGroup) return [];
    const students = activeGroup.students || [];
    const gradeObj = activeGroupGrades?.students || {};

    const map = {};

    students.forEach(sName => {
      const sGrades = gradeObj[sName] || [];
      sGrades.forEach(g => {
        const val = g.numericValue || parseInt(g.value, 10);
        if (val >= 1 && val <= 5) {
          const title = getGradeTopicTitle(g);
          if (!map[title]) {
            map[title] = {
              title,
              type: g.type || 'Értékelés',
              weight: g.weight || 100,
              dates: new Set(),
              grades: [],
              studentsMap: {},
              distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              weightedSum: 0
            };
          }
          if (g.date) map[title].dates.add(g.date);
          if (g.weight && g.weight > map[title].weight) map[title].weight = g.weight;

          map[title].distribution[val] = (map[title].distribution[val] || 0) + 1;
          const entry = {
            student: sName,
            value: val,
            numericValue: val,
            weight: g.weight || 100,
            date: g.date,
            type: g.type,
            id: g.id
          };
          map[title].grades.push(entry);
          map[title].studentsMap[sName] = entry;
          map[title].weightedSum += val;
        }
      });
    });

    const topicList = Object.values(map).map(t => {
      const count = t.grades.length;
      const avg = count > 0 ? Number((t.weightedSum / count).toFixed(2)) : 0;

      const sortedVals = t.grades.map(x => x.value).sort((a, b) => a - b);
      const mid = Math.floor(sortedVals.length / 2);
      const median = sortedVals.length > 0
        ? (sortedVals.length % 2 !== 0 ? sortedVals[mid] : Number(((sortedVals[mid - 1] + sortedVals[mid]) / 2).toFixed(1)))
        : 0;

      const failingCount = t.distribution[1] || 0;
      const excellentCount = t.distribution[5] || 0;
      const datesArr = Array.from(t.dates).filter(Boolean);
      const missingStudents = students.filter(s => !t.studentsMap[s]);

      return {
        title: t.title,
        type: t.type,
        weight: t.weight,
        dates: datesArr,
        dateStr: datesArr.length > 0 ? datesArr.sort().reverse().join(', ') : '–',
        count,
        totalStudents: students.length,
        missingCount: missingStudents.length,
        missingStudents,
        participationRate: students.length > 0 ? Math.round((count / students.length) * 100) : 0,
        average: avg,
        median,
        distribution: t.distribution,
        failingCount,
        failingPercent: count > 0 ? Math.round((failingCount / count) * 100) : 0,
        excellentCount,
        excellentPercent: count > 0 ? Math.round((excellentCount / count) * 100) : 0,
        grades: t.grades,
        studentsMap: t.studentsMap
      };
    });

    // Rendezés dátum szerint vagy darabszám szerint
    topicList.sort((a, b) => {
      const dateA = a.dates[0] || '';
      const dateB = b.dates[0] || '';
      if (dateA && dateB) return dateB.localeCompare(dateA);
      return b.count - a.count;
    });

    return topicList;
  }, [activeGroup, activeGroupGrades]);

  const activeTopicObj = useMemo(() => {
    if (selectedTopic === 'all') return null;
    return computedTopics.find(t => t.title === selectedTopic) || null;
  }, [computedTopics, selectedTopic]);

  const topicStatsSummary = useMemo(() => {
    if (!computedTopics || computedTopics.length === 0) return null;
    let best = computedTopics[0];
    let worst = computedTopics[0];
    let totalPart = 0;

    computedTopics.forEach(t => {
      if (t.average > best.average) best = t;
      if (t.average < worst.average) worst = t;
      totalPart += t.participationRate;
    });

    return {
      best,
      worst,
      avgParticipation: Math.round(totalPart / computedTopics.length)
    };
  }, [computedTopics]);

  // A bal oldali panelen aktuálisan megjelenítendő statisztika (vagy teljes csoport, vagy kiválasztott téma)
  const displayedStats = useMemo(() => {
    if (selectedTopic !== 'all' && activeTopicObj) {
      return {
        isTopic: true,
        title: activeTopicObj.title,
        label: 'Téma Átlaga',
        average: activeTopicObj.average,
        median: activeTopicObj.median,
        count: activeTopicObj.count,
        totalStudents: activeTopicObj.totalStudents,
        subCountLabel: `${activeTopicObj.participationRate}% részvétel`,
        failingCount: activeTopicObj.failingCount,
        excellentCount: activeTopicObj.excellentCount,
        distribution: activeTopicObj.distribution,
        dateStr: activeTopicObj.dateStr,
        type: activeTopicObj.type,
        weight: activeTopicObj.weight,
        missingCount: activeTopicObj.missingCount
      };
    }

    return {
      isTopic: false,
      title: activeGroup ? `${activeGroup.name} - ${activeGroup.subject}` : '',
      label: 'Csoportátlag',
      average: computedStats?.average ?? null,
      median: computedStats?.median ?? null,
      count: computedStats?.count || 0,
      totalStudents: activeGroup?.students?.length || 0,
      subCountLabel: null,
      failingCount: computedStats?.failingCount || 0,
      excellentCount: computedStats?.excellentCount || 0,
      distribution: computedStats?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      dateStr: null,
      type: null,
      weight: null,
      missingCount: 0
    };
  }, [selectedTopic, activeTopicObj, computedStats, activeGroup]);

  // Feldolgozott diáklista jegyekkel és egyéni átlaggal
  const processedStudents = useMemo(() => {
    if (!activeGroup) return [];
    const students = activeGroup.students || [];
    const gradeObj = activeGroupGrades?.students || {};

    const list = students.map((sName, index) => {
      const sGrades = gradeObj[sName] || [];
      let sWeighted = 0;
      let sWeight = 0;

      sGrades.forEach(g => {
        const val = g.numericValue || parseInt(g.value, 10);
        if (val >= 1 && val <= 5) {
          const w = g.weight || 100;
          sWeighted += val * w;
          sWeight += w;
        }
      });

      const avg = sWeight > 0 ? Number((sWeighted / sWeight).toFixed(2)) : null;
      const topicGrade = activeTopicObj ? activeTopicObj.studentsMap[sName] || null : null;

      return {
        index: index + 1,
        name: sName,
        grades: sGrades,
        topicGrade,
        average: avg,
        isFailing: avg !== null && avg < 2.0,
        isExcellent: avg !== null && avg >= 4.5
      };
    });

    // Szűrés
    const filtered = list.filter(item => {
      if (selectedTopic !== 'all' && activeTopicObj) {
        if (topicStudentFilter === 'written' && !item.topicGrade) return false;
        if (topicStudentFilter === 'missing' && item.topicGrade) return false;
      }
      if (studentFilter === 'failing' && !item.isFailing) return false;
      if (studentFilter === 'excellent' && !item.isExcellent) return false;
      if (studentSearch.trim()) {
        return item.name.toLowerCase().includes(studentSearch.toLowerCase().trim());
      }
      return true;
    });

    // Rendezés
    if (studentSort === 'avg_desc') {
      filtered.sort((a, b) => (b.average || 0) - (a.average || 0));
    } else if (studentSort === 'avg_asc') {
      filtered.sort((a, b) => (a.average || 99) - (b.average || 99));
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'hu'));
    }

    return filtered;
  }, [activeGroup, activeGroupGrades, activeTopicObj, selectedTopic, topicStudentFilter, studentSearch, studentFilter, studentSort]);

  const handleCopyTopicResults = (topic) => {
    if (!topic) return;
    const lines = [
      `=== ${activeGroup?.name || ''} (${activeGroup?.subject || ''}) - ${topic.title} ===`,
      `Dátum: ${topic.dateStr} | Típus: ${topic.type} (${topic.weight}%)`,
      `Átlag: ${topic.average.toFixed(2)} | Medián: ${topic.median} | Részvétel: ${topic.count} / ${topic.totalStudents} diák (${topic.participationRate}%)`,
      `Megoszlás: 5-ös: ${topic.distribution[5] || 0} db | 4-es: ${topic.distribution[4] || 0} db | 3-as: ${topic.distribution[3] || 0} db | 2-es: ${topic.distribution[2] || 0} db | 1-es: ${topic.distribution[1] || 0} db`,
    ];
    if (topic.missingStudents && topic.missingStudents.length > 0) {
      lines.push(`Nem írt / Hiányzott (${topic.missingStudents.length} fő): ${topic.missingStudents.join(', ')}`);
    }
    navigator.clipboard.writeText(lines.join('\n'));
    if (addNotification) {
      addNotification(`A(z) "${topic.title}" statisztikája vágólapra másolva!`, 'success', 'Másolás');
    }
  };

  // Új csoport mentése
  const handleSaveGroup = () => {
    if (!groupFormName.trim() || !groupFormSubject.trim()) return;
    const studentsArray = groupFormStudents.split('\n').map(s => s.trim()).filter(Boolean);

    if (editingGroupId) {
      const updated = groups.map(g => g.id === editingGroupId ? {
        ...g,
        name: groupFormName.trim(),
        subject: groupFormSubject.trim(),
        students: studentsArray
      } : g);
      setGroups(updated);
      localStorage.setItem('ekreta_groups', JSON.stringify(updated));
    } else {
      const newGroup = {
        id: `manual_${Date.now()}`,
        name: groupFormName.trim(),
        subject: groupFormSubject.trim(),
        students: studentsArray
      };
      const updated = [...groups, newGroup];
      setGroups(updated);
      localStorage.setItem('ekreta_groups', JSON.stringify(updated));
      setSelectedGroupId(newGroup.id);
    }
    setIsGroupFormOpen(false);
  };

  const handleDeleteGroup = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Biztosan törlöd ezt a csoportot?')) {
      const updated = groups.filter(g => g.id !== id);
      setGroups(updated);
      localStorage.setItem('ekreta_groups', JSON.stringify(updated));
      if (selectedGroupId === id && updated.length > 0) {
        setSelectedGroupId(updated[0].id);
      }
    }
  };

  const handleCopyStudents = () => {
    if (!activeGroup?.students || activeGroup.students.length === 0) return;
    navigator.clipboard.writeText(activeGroup.students.join('\n'));
    setCopiedId(activeGroup.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Új jegy mentése
  const handleAddGradeSubmit = async () => {
    if (!targetStudent || !activeGroup) return;

    const newGrade = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      value: Number(gradeValue),
      numericValue: Number(gradeValue),
      weight: Number(gradeWeight),
      type: gradeType,
      topic: gradeTopic.trim() || 'Értékelés',
      date: gradeDate
    };

    const gKey = activeGroup.id;
    const updatedGrades = { ...gradesData };
    if (!updatedGrades[gKey]) {
      updatedGrades[gKey] = {
        className: activeGroup.name,
        subject: activeGroup.subject,
        students: {}
      };
    }
    if (!updatedGrades[gKey].students[targetStudent]) {
      updatedGrades[gKey].students[targetStudent] = [];
    }
    updatedGrades[gKey].students[targetStudent].push(newGrade);

    setGradesData(updatedGrades);
    localStorage.setItem('ekreta_grades', JSON.stringify(updatedGrades));

    try {
      fetch(`${API_BASE}/api/add-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: targetStudent,
          grade: gradeValue,
          subject: activeGroup.subject,
          type: gradeType
        })
      }).catch(err => console.log('Backend add-grade válasz:', err));
    } catch (e) {}

    if (addNotification) {
      addNotification(`Jegy (${gradeValue}) sikeresen rögzítve: ${targetStudent}`, 'success', 'Jegybeírás');
    }

    setIsGradeModalOpen(false);
    setGradeTopic('');
  };

  return (
    <section className="card glass-panel animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: 0, borderRadius: '6px', overflow: 'hidden' }}>
      
      {/* ======================================================== */}
      {/* FELSŐ FEJLÉC SÁV                                         */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--panel-border)', background: 'var(--panel-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
            Napló
          </h2>
          <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)' }}>
            {groups.length} csoport • {groups.reduce((acc, g) => acc + (g.students?.length || 0), 0)} diák
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => syncWithKreta(true)}
            disabled={isSyncing}
            className="btn-outline"
            style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '4px' }}
            title="Adatok frissítése közvetlenül a Krétából"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {isSyncing ? 'Szinkronizálás...' : 'Kréta Frissítés'}
          </button>

          <button
            onClick={() => {
              setEditingGroupId(null);
              setGroupFormName('');
              setGroupFormSubject('');
              setGroupFormStudents('');
              setIsGroupFormOpen(true);
            }}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', width: 'auto', marginTop: 0, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Új csoport
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MASTER-DETAIL OSZTÁS: Bal oldalon Csoportválasztó +      */}
      {/* Statisztikák, Jobb oldalon tágas Névsor & Jegyek         */}
      {/* ======================================================== */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        
        {/* ======================================================== */}
        {/* BAL OSZLOP: Csoport legördülő + Részletes Statisztikák  */}
        {/* ======================================================== */}
        <div style={{ width: '330px', minWidth: '300px', maxWidth: '360px', borderRight: '1px solid var(--panel-border)', background: 'var(--panel-bg)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px', gap: '14px' }}>
          
          {/* CSOPORT LEGÖRDÜLŐ VÁLASZTÓ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
              Kiválasztott csoport
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedGroupId}
                onChange={e => handleSelectGroup(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--text-primary)',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: '700',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '14px',
                  paddingRight: '32px'
                }}
              >
                {groups.map(g => {
                  const gGrade = getGroupGradeData(g);
                  const avgStr = gGrade?.stats?.average ? ` • ${gGrade.stats.average.toFixed(2)}` : '';
                  return (
                    <option key={g.id} value={g.id}>
                      {g.name} - {g.subject} ({g.students?.length || 0} fő){avgStr}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Csoport alatti gyors infó sor */}
            {activeGroup && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                <span>
                  <strong>{activeGroup.students?.length || 0}</strong> diák • {activeGroup.subject}
                </span>
                <button
                  onClick={handleCopyStudents}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px', padding: 0, textDecoration: 'underline' }}
                  title="Diákok névsorának másolása"
                >
                  {copiedId === activeGroup.id ? '✓ Másolva' : 'Névsor másolása'}
                </button>
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'var(--panel-border)' }} />

          {/* STATISZTIKÁK KÖZVETLENÜL A CSOPORT ALATT */}
          {activeGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* ======================================================== */}
              {/* 1. TELJES CSOPORT ÖSSZESÍTETT STATISZTIKÁJA (MINDIG LÁTHATÓ) */}
              {/* ======================================================== */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
                  Összes Jegy Statisztikája
                </div>

                {/* Csoportátlag kiemelt kártya */}
                <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--panel-border)', background: 'var(--hover-bg)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
                    Csoportátlag
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '26px', fontWeight: '900', color: computedStats?.average ? (computedStats.average >= 4.0 ? '#10b981' : computedStats.average < 2.5 ? '#ef4444' : 'var(--text-primary)') : 'var(--text-secondary)' }}>
                      {computedStats?.average ? computedStats.average.toFixed(2) : '–'}
                    </span>
                    {computedStats?.median && (
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Medián: {computedStats.median}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3 Gyors KPI mutató kártya */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div className="glass-panel" style={{ padding: '10px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Jegyek</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {computedStats?.count || 0}
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '10px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', textAlign: 'center', background: (computedStats?.failingCount || 0) > 0 ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: (computedStats?.failingCount || 0) > 0 ? '#ef4444' : 'var(--text-secondary)' }}>&lt; 2.0</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: (computedStats?.failingCount || 0) > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '2px' }}>
                      {computedStats?.failingCount || 0}
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '10px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', textAlign: 'center', background: (computedStats?.excellentCount || 0) > 0 ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: (computedStats?.excellentCount || 0) > 0 ? '#10b981' : 'var(--text-secondary)' }}>≥ 4.5</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: (computedStats?.excellentCount || 0) > 0 ? '#10b981' : 'var(--text-primary)', marginTop: '2px' }}>
                      {computedStats?.excellentCount || 0}
                    </div>
                  </div>
                </div>

                {/* Függőleges hisztogram az összes jegyre */}
                <div className="glass-panel" style={{ padding: '14px 12px 12px 12px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
                      Jegyek Megoszlása (1–5)
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {computedStats?.count || 0} db jegy
                    </span>
                  </div>

                  {(() => {
                    const counts = [1, 2, 3, 4, 5].map(n => computedStats?.distribution?.[n] || 0);
                    const maxCount = Math.max(...counts, 1);
                    const total = computedStats?.count || 0;
                    const gradeLabels = { 1: '1-es', 2: '2-es', 3: '3-as', 4: '4-es', 5: '5-ös' };

                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '115px', gap: '8px', padding: '0 4px' }}>
                        {[1, 2, 3, 4, 5].map(num => {
                          const count = computedStats?.distribution?.[num] || 0;
                          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                          const barHeightPercent = count > 0 ? Math.max(12, Math.round((count / maxCount) * 100)) : 0;
                          const col = GRADE_COLORS[num];

                          return (
                            <div key={num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                              <div style={{ textAlign: 'center', marginBottom: '6px', minHeight: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.1 }}>
                                  {count > 0 ? `${count} db` : '0'}
                                </span>
                                <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-secondary)', lineHeight: 1 }}>
                                  {count > 0 ? `(${percent}%)` : '–'}
                                </span>
                              </div>

                              <div style={{ width: '100%', maxWidth: '32px', height: '55px', background: 'var(--hover-bg)', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                                <div style={{ width: '100%', height: `${barHeightPercent}%`, background: col.text, borderRadius: '2px 2px 0 0', transition: 'height 0.4s ease' }} />
                              </div>

                              <div style={{ marginTop: '6px', textAlign: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: '800', color: col.text }}>
                                  {gradeLabels[num]}
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

              <div style={{ height: '1px', background: 'var(--panel-border)', margin: '2px 0' }} />

              {/* ======================================================== */}
              {/* 2. RÉSZLETES / TÉMA SZERINTI STATISZTIKA (ALATTA KIVÁLASZTHATÓ) */}
              {/* ======================================================== */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
                    Dolgozat / Téma Részletezése
                  </label>
                  {selectedTopic !== 'all' && (
                    <button
                      onClick={() => {
                        setSelectedTopic('all');
                        setTopicStudentFilter('all');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '10px', textDecoration: 'underline', padding: 0, fontWeight: '700' }}
                    >
                      ✕ Törlés
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedTopic}
                    onChange={e => {
                      setSelectedTopic(e.target.value);
                      setTopicStudentFilter('all');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: selectedTopic !== 'all' ? '1.5px solid var(--text-primary)' : '1px solid var(--panel-border)',
                      backgroundColor: selectedTopic !== 'all' ? 'var(--hover-bg)' : 'var(--bg-color)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: '700',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '13px',
                      paddingRight: '28px'
                    }}
                  >
                    <option value="all">-- Válassz dolgozatot a részletekhez --</option>
                    {computedTopics.map(t => (
                      <option key={t.title} value={t.title}>
                        {t.title} (átl: {t.average.toFixed(2)} • {t.count} fő)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ha van kiválasztott téma, mutassa az adott dolgozat statisztikáját közvetlenül keret nélkül */}
                {selectedTopic !== 'all' && activeTopicObj && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    {/* Kiemelt Téma Átlag kártya */}
                    <div className="glass-panel" style={{ padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--panel-border)', background: 'var(--hover-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
                          Téma Átlaga
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {activeTopicObj.dateStr}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {activeTopicObj.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '26px', fontWeight: '900', color: activeTopicObj.average >= 4.0 ? '#10b981' : activeTopicObj.average < 2.5 ? '#ef4444' : 'var(--text-primary)' }}>
                          {activeTopicObj.average.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          Medián: {activeTopicObj.median}
                        </span>
                      </div>
                    </div>

                    {/* 3 KPI mutató a témához */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div className="glass-panel" style={{ padding: '10px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Részvétel</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {activeTopicObj.count}/{activeTopicObj.totalStudents}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                          {activeTopicObj.participationRate}%
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '10px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', textAlign: 'center', background: activeTopicObj.failingCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: activeTopicObj.failingCount > 0 ? '#ef4444' : 'var(--text-secondary)' }}>&lt; 2.0 (1-es)</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: activeTopicObj.failingCount > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '2px' }}>
                          {activeTopicObj.failingCount} db
                        </div>
                        <div style={{ fontSize: '9px', color: activeTopicObj.failingCount > 0 ? '#ef4444' : 'var(--text-secondary)', marginTop: '1px' }}>
                          {activeTopicObj.failingPercent}%
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '10px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', textAlign: 'center', background: activeTopicObj.excellentCount > 0 ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: activeTopicObj.excellentCount > 0 ? '#10b981' : 'var(--text-secondary)' }}>5-ös (Jeles)</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: activeTopicObj.excellentCount > 0 ? '#10b981' : 'var(--text-primary)', marginTop: '2px' }}>
                          {activeTopicObj.excellentCount} db
                        </div>
                        <div style={{ fontSize: '9px', color: activeTopicObj.excellentCount > 0 ? '#10b981' : 'var(--text-secondary)', marginTop: '1px' }}>
                          {activeTopicObj.excellentPercent}%
                        </div>
                      </div>
                    </div>

                    {/* Függőleges hisztogram ehhez a témához */}
                    <div className="glass-panel" style={{ padding: '14px 12px 12px 12px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
                          Téma Jegyoszlása (1–5)
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          {activeTopicObj.count} db jegy
                        </span>
                      </div>

                      {(() => {
                        const counts = [1, 2, 3, 4, 5].map(n => activeTopicObj.distribution[n] || 0);
                        const maxCount = Math.max(...counts, 1);
                        const total = activeTopicObj.count || 0;
                        const gradeLabels = { 1: '1-es', 2: '2-es', 3: '3-as', 4: '4-es', 5: '5-ös' };

                        return (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '115px', gap: '8px', padding: '0 4px' }}>
                            {[1, 2, 3, 4, 5].map(num => {
                              const count = activeTopicObj.distribution[num] || 0;
                              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                              const barHeightPercent = count > 0 ? Math.max(12, Math.round((count / maxCount) * 100)) : 0;
                              const col = GRADE_COLORS[num];

                              return (
                                <div key={num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                  <div style={{ textAlign: 'center', marginBottom: '6px', minHeight: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.1 }}>
                                      {count > 0 ? `${count} db` : '0'}
                                    </span>
                                    <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-secondary)', lineHeight: 1 }}>
                                      {count > 0 ? `(${percent}%)` : '–'}
                                    </span>
                                  </div>

                                  <div style={{ width: '100%', maxWidth: '32px', height: '55px', background: 'var(--hover-bg)', borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                                    <div style={{ width: '100%', height: `${barHeightPercent}%`, background: col.text, borderRadius: '2px 2px 0 0', transition: 'height 0.4s ease' }} />
                                  </div>

                                  <div style={{ marginTop: '6px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: col.text }}>
                                      {gradeLabels[num]}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Névsor szűrés gombok ehhez a témához */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Névsor szűrése a jobb oldalon:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => setTopicStudentFilter('all')}
                          style={{
                            flex: 1,
                            padding: '5px',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: topicStudentFilter === 'all' ? 'var(--text-primary)' : 'var(--panel-border)',
                            background: topicStudentFilter === 'all' ? 'var(--text-primary)' : 'transparent',
                            color: topicStudentFilter === 'all' ? 'var(--bg-color)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                          }}
                        >
                          Mind ({activeTopicObj.totalStudents})
                        </button>
                        <button
                          onClick={() => setTopicStudentFilter('written')}
                          style={{
                            flex: 1,
                            padding: '5px',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: topicStudentFilter === 'written' ? '#10b981' : 'var(--panel-border)',
                            background: topicStudentFilter === 'written' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            color: topicStudentFilter === 'written' ? '#10b981' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                          }}
                        >
                          Írták ({activeTopicObj.count})
                        </button>
                        <button
                          onClick={() => setTopicStudentFilter('missing')}
                          style={{
                            flex: 1,
                            padding: '5px',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: topicStudentFilter === 'missing' ? '#ef4444' : 'var(--panel-border)',
                            background: topicStudentFilter === 'missing' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                            color: topicStudentFilter === 'missing' ? '#ef4444' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '11px'
                          }}
                        >
                          Nem írták ({activeTopicObj.missingCount})
                        </button>
                      </div>
                    </div>

                    {/* Hiányzók listája gyors infó */}
                    {activeTopicObj.missingStudents && activeTopicObj.missingStudents.length > 0 && (
                      <div style={{ fontSize: '10px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.06)', padding: '6px 8px', borderRadius: '4px', border: '1px dashed rgba(239, 68, 68, 0.25)' }}>
                        <strong>Hiányzó diákok ({activeTopicObj.missingCount} fő):</strong>
                        <div style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>
                          {activeTopicObj.missingStudents.join(', ')}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Manuális csoport műveletek */}
              {String(activeGroup.id).startsWith('manual_') && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={(e) => handleDeleteGroup(activeGroup.id, e)}
                    className="btn-outline"
                    style={{ flex: 1, padding: '4px 8px', fontSize: '10px', color: 'var(--danger)', borderRadius: '4px' }}
                  >
                    Csoport törlése
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>
              Nincs kiválasztott csoport.
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* JOBB OLDAL: TELJES SZÉLESSÉGŰ NÉVSOR ÉS JEGYEK TÁBLÁZAT */}
        {/* ======================================================== */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', overflowY: 'auto' }}>
          {activeGroup ? (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Fejléc sáv: Csoport infó, Keresés, Szűrők, Rendezés, Nézetváltó és Új jegy egyetlen logikus sorban */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)' }}>
                {/* Bal / Középső blokk: Csoport infó és (diák nézetben) keresés, szűrés, rendezés */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <h1 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {activeGroup.name}
                    </h1>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)', whiteSpace: 'nowrap' }}>
                      {activeGroup.subject}
                    </span>
                    {viewMode === 'topics' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        • {activeGroup.students?.length || 0} diák
                      </span>
                    )}
                  </div>

                  {viewMode === 'students' && (
                    <>
                      {/* Diák keresőmező */}
                      <div style={{ position: 'relative', width: '180px', minWidth: '130px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}>
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                          type="text"
                          placeholder="Diák keresése..."
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          style={{ padding: '5px 8px 5px 28px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', fontSize: '11px', width: '100%', outline: 'none' }}
                        />
                      </div>

                      {/* Aktív témaszűrés jelző pill */}
                      {selectedTopic !== 'all' && activeTopicObj && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--hover-bg)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--text-primary)', fontSize: '11px', fontWeight: '700' }}>
                          <span style={{ color: 'var(--text-primary)' }}>🎯 {activeTopicObj.title}</span>
                          <button
                            onClick={() => {
                              setSelectedTopic('all');
                              setTopicStudentFilter('all');
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: '12px', lineHeight: 1 }}
                            title="Témaszűrés törlése"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Általános szűrő gombok */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => setStudentFilter('all')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid',
                            borderColor: studentFilter === 'all' ? 'var(--text-primary)' : 'var(--panel-border)',
                            background: studentFilter === 'all' ? 'var(--text-primary)' : 'transparent',
                            color: studentFilter === 'all' ? 'var(--bg-color)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Mind ({activeGroup.students?.length || 0})
                        </button>
                        <button
                          onClick={() => setStudentFilter(studentFilter === 'failing' ? 'all' : 'failing')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid',
                            borderColor: studentFilter === 'failing' ? '#ef4444' : 'var(--panel-border)',
                            background: studentFilter === 'failing' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                            color: studentFilter === 'failing' ? '#ef4444' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Bukásra állók ({computedStats?.failingCount || 0})
                        </button>
                        <button
                          onClick={() => setStudentFilter(studentFilter === 'excellent' ? 'all' : 'excellent')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px solid',
                            borderColor: studentFilter === 'excellent' ? '#10b981' : 'var(--panel-border)',
                            background: studentFilter === 'excellent' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            color: studentFilter === 'excellent' ? '#10b981' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Kiválók ({computedStats?.excellentCount || 0})
                        </button>
                      </div>

                      {/* Rendezés választó */}
                      <select
                        value={studentSort}
                        onChange={e => setStudentSort(e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: '500', outline: 'none' }}
                      >
                        <option value="name">Név szerint (A-Z)</option>
                        <option value="avg_desc">Legjobb átlag elöl</option>
                        <option value="avg_asc">Leggyengébb átlag elöl</option>
                      </select>
                    </>
                  )}
                </div>

                {/* Jobb oldali blokk: Nézetváltó és Új jegy gomb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'var(--hover-bg)', padding: '2px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                    <button
                      onClick={() => setViewMode('students')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        background: viewMode === 'students' ? 'var(--text-primary)' : 'transparent',
                        color: viewMode === 'students' ? 'var(--bg-color)' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      👥 Diákok névsora
                    </button>
                    <button
                      onClick={() => setViewMode('topics')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        background: viewMode === 'topics' ? 'var(--text-primary)' : 'transparent',
                        color: viewMode === 'topics' ? 'var(--bg-color)' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📋 Témák ({computedTopics.length})
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setTargetStudent(activeGroup.students?.[0] || '');
                      setIsGradeModalOpen(true);
                    }}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', width: 'auto', marginTop: 0, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Új jegy
                  </button>
                </div>
              </div>

              {/* ======================================================= */}
              {/* 1. NÉZET: TÉMÁK & DOLGOZATOK ELEMZÉSE                    */}
              {/* ======================================================= */}
              {viewMode === 'topics' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Felső KPI összefoglaló a témákhoz */}
                  {topicStatsSummary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      <div className="glass-panel" style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Összes Téma</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                          {computedTopics.length} db
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {computedStats?.count || 0} rögzített jegy
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#10b981' }}>Legjobb Dolgozat</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                          {topicStatsSummary.best.average.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {topicStatsSummary.best.title}
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#f97316' }}>Legnehezebb Dolgozat</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#f97316', marginTop: '4px' }}>
                          {topicStatsSummary.worst.average.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {topicStatsSummary.worst.title}
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Átlagos Részvétel</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                          {topicStatsSummary.avgParticipation}%
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          dolgozatonkénti arány
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dolgozatok / Témák részletes kártyái */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {computedTopics.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        Ebben a csoportban még nem találhatók értékelési témák.
                      </div>
                    ) : (
                      computedTopics.map(topic => {
                        const isExpanded = expandedTopic === topic.title;
                        const avgColor = topic.average >= 4.0 ? '#10b981' : topic.average < 2.5 ? '#ef4444' : 'var(--text-primary)';
                        const counts = [1, 2, 3, 4, 5].map(n => topic.distribution[n] || 0);
                        const maxC = Math.max(...counts, 1);
                        const gradeLabels = { 1: '1-es', 2: '2-es', 3: '3-as', 4: '4-es', 5: '5-ös' };

                        return (
                          <div
                            key={topic.title}
                            className="glass-panel"
                            style={{
                              borderRadius: '6px',
                              border: '1px solid var(--panel-border)',
                              padding: '16px',
                              background: 'var(--panel-bg)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            {/* Kártya fejléc: Cím, típus, súly, dátum és gombok */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                  {topic.title}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  <span style={{ padding: '2px 6px', borderRadius: '3px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', fontWeight: '600' }}>
                                    {topic.type}
                                  </span>
                                  {topic.weight === 200 ? (
                                    <span style={{ padding: '2px 6px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: '700' }}>
                                      200% Témazáró
                                    </span>
                                  ) : (
                                    <span>{topic.weight}% súly</span>
                                  )}
                                  <span>•</span>
                                  <span>Dátum: <strong>{topic.dateStr}</strong></span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setSelectedTopic(topic.title);
                                    setViewMode('students');
                                  }}
                                  className="btn-outline"
                                  style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '4px' }}
                                  title="Megnyitás és szűrés a névsorban"
                                >
                                  🔍 Szűrés a névsorban
                                </button>
                                <button
                                  onClick={() => handleCopyTopicResults(topic)}
                                  className="btn-outline"
                                  style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '4px' }}
                                  title="Statisztika másolása vágólapra"
                                >
                                  📋 Másolás
                                </button>
                                <button
                                  onClick={() => setExpandedTopic(isExpanded ? null : topic.title)}
                                  className="btn-outline"
                                  style={{ padding: '5px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '4px' }}
                                >
                                  {isExpanded ? '▲ Diákok elrejtése' : '▼ Diákok listája'}
                                </button>
                              </div>
                            </div>

                            {/* Fő statisztikák & Mini hisztogram sáv */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--hover-bg)', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
                              
                              {/* Értékek */}
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Téma Átlaga</div>
                                  <div style={{ fontSize: '24px', fontWeight: '900', color: avgColor, marginTop: '2px' }}>
                                    {topic.average.toFixed(2)}
                                  </div>
                                </div>

                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Medián</div>
                                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {topic.median}
                                  </div>
                                </div>

                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Részvétel</div>
                                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '6px' }}>
                                    {topic.count} / {topic.totalStudents} diák ({topic.participationRate}%)
                                  </div>
                                </div>

                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Bukás / Jeles</div>
                                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '7px' }}>
                                    <span style={{ color: topic.failingCount > 0 ? '#ef4444' : 'inherit' }}>{topic.failingCount} db 1-es</span> • <span style={{ color: topic.excellentCount > 0 ? '#10b981' : 'inherit' }}>{topic.excellentCount} db 5-ös</span>
                                  </div>
                                </div>
                              </div>

                              {/* Mini függőleges oszlopdiagram ehhez a témához */}
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '65px' }}>
                                {[1, 2, 3, 4, 5].map(num => {
                                  const c = topic.distribution[num] || 0;
                                  const pct = topic.count > 0 ? Math.round((c / topic.count) * 100) : 0;
                                  const h = c > 0 ? Math.max(16, Math.round((c / maxC) * 100)) : 0;
                                  const col = GRADE_COLORS[num];
                                  return (
                                    <div key={num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '28px' }}>
                                      <span style={{ fontSize: '9px', fontWeight: '700', color: c > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1 }}>
                                        {c}
                                      </span>
                                      <div style={{ width: '100%', height: '36px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                                        <div style={{ width: '100%', height: `${h}%`, background: col.text, borderRadius: '2px 2px 0 0' }} />
                                      </div>
                                      <span style={{ fontSize: '9px', fontWeight: '700', color: col.text }}>
                                        {gradeLabels[num]}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Lenyíló diákok szerinti bontás */}
                            {isExpanded && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--panel-border)' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-secondary)' }}>
                                  Eredmények diákok szerint csoportosítva:
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {[5, 4, 3, 2, 1].map(gradeVal => {
                                    const matchingGrades = topic.grades.filter(g => g.value === gradeVal);
                                    if (matchingGrades.length === 0) return null;
                                    const col = GRADE_COLORS[gradeVal];

                                    return (
                                      <div key={gradeVal} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        <span style={{ width: '48px', fontSize: '11px', fontWeight: '800', color: col.text, paddingTop: '3px' }}>
                                          {gradeVal}-ös ({matchingGrades.length})
                                        </span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                                          {matchingGrades.map(g => (
                                            <span
                                              key={g.student}
                                              style={{
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                background: col.bg,
                                                color: col.text,
                                                border: `1px solid ${col.border}`,
                                                fontSize: '11px',
                                                fontWeight: '600'
                                              }}
                                            >
                                              {g.student}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Hiányzó diákok */}
                                  {topic.missingStudents && topic.missingStudents.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
                                      <span style={{ width: '48px', fontSize: '11px', fontWeight: '700', color: '#ef4444', paddingTop: '3px' }}>
                                        Nem írt ({topic.missingStudents.length})
                                      </span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                                        {topic.missingStudents.map(sName => (
                                          <span
                                            key={sName}
                                            style={{
                                              padding: '3px 8px',
                                              borderRadius: '4px',
                                              background: 'rgba(239, 68, 68, 0.08)',
                                              color: 'var(--text-secondary)',
                                              border: '1px dashed rgba(239, 68, 68, 0.3)',
                                              fontSize: '11px'
                                            }}
                                          >
                                            {sName}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              ) : (

                /* ======================================================= */
                /* 2. NÉZET: DIÁKOK NÉVSORA ÉS JEGYEK                     */
                /* ======================================================= */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* TÁBLÁZATOS NÉVSOR ÉS JEGYEK LISTÁJA - TÁGAS ELRENDEZÉSBEN */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {processedStudents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Nincs a szűrésnek megfelelő diák a névsorban.
                      </div>
                    ) : (
                      processedStudents.map(student => (
                        <div
                          key={student.name}
                          className="glass-panel"
                          style={{
                            padding: '12px 16px',
                            borderRadius: '6px',
                            background: student.isFailing ? 'rgba(239, 68, 68, 0.04)' : 'var(--panel-bg)',
                            border: student.isFailing ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--panel-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            transition: 'border-color 0.15s ease'
                          }}
                        >
                          {/* Diák sorszáma és Neve */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '220px', minWidth: '180px', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '22px', textAlign: 'right', fontWeight: '600' }}>
                              {student.index}.
                            </span>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                                {student.name}
                              </div>
                              {student.isFailing && (
                                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase' }}>
                                  Figyelmeztetés
                                </span>
                              )}
                              {student.isExcellent && (
                                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>
                                  Kiváló tanuló
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Jegyek megjelenítése: ha konkrét téma van kiválasztva, annak az eredménye, egyébként összes jegy */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                            {selectedTopic !== 'all' ? (
                              student.topicGrade ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '34px',
                                      height: '34px',
                                      borderRadius: '6px',
                                      background: GRADE_COLORS[student.topicGrade.numericValue]?.bg || 'var(--hover-bg)',
                                      color: GRADE_COLORS[student.topicGrade.numericValue]?.text || 'var(--text-primary)',
                                      border: `1.5px solid ${GRADE_COLORS[student.topicGrade.numericValue]?.border || 'var(--panel-border)'}`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: '900',
                                      fontSize: '16px'
                                    }}
                                  >
                                    {student.topicGrade.numericValue}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                      {student.topicGrade.type || 'Értékelés'} ({student.topicGrade.weight}%)
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                      Dátum: {student.topicGrade.date || '–'}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: '#ef4444',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    border: '1px dashed rgba(239, 68, 68, 0.3)',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                                    Nem írt / Hiányzott
                                  </span>
                                  <button
                                    onClick={() => {
                                      setTargetStudent(student.name);
                                      setGradeTopic(selectedTopic);
                                      if (activeTopicObj?.type) setGradeType(activeTopicObj.type);
                                      if (activeTopicObj?.weight) setGradeWeight(activeTopicObj.weight);
                                      setIsGradeModalOpen(true);
                                    }}
                                    className="btn-outline"
                                    style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px' }}
                                    title="Pótdolgozat vagy hiányzó jegy rögzítése"
                                  >
                                    + Jegy pótlása
                                  </button>
                                </div>
                              )
                            ) : (
                              student.grades && student.grades.length > 0 ? (
                                student.grades.map((g, gIdx) => {
                                  const num = g.numericValue || parseInt(g.value, 10);
                                  const col = GRADE_COLORS[num] || { bg: 'var(--hover-bg)', text: 'var(--text-primary)', border: 'var(--panel-border)' };
                                  const isDouble = g.weight === 200 || g.weight === '200%';
                                  const topicTitle = getGradeTopicTitle(g);

                                  return (
                                    <div
                                      key={g.id || gIdx}
                                      onClick={() => setSelectedTopic(topicTitle)}
                                      title={`${topicTitle} (${g.type || 'Értékelés'})${g.date ? ` • ${g.date}` : ''}${isDouble ? ' [200% TZ]' : ''} - Kattints a téma statisztikájához!`}
                                      style={{
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '5px',
                                        background: col.bg,
                                        color: col.text,
                                        border: `1px solid ${col.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '800',
                                        fontSize: '13px',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s ease'
                                      }}
                                    >
                                      {num}
                                      {isDouble && (
                                        <span
                                          style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            width: '9px',
                                            height: '9px',
                                            borderRadius: '50%',
                                            background: '#cc0000',
                                            border: '1.5px solid var(--panel-bg)'
                                          }}
                                          title="Témazáró / Dupla súly (200%)"
                                        />
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Még nincs beírt jegy
                                </span>
                              )
                            )}
                          </div>

                          {/* Diák Átlaga és Gyors Művelet */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Összátlag</div>
                              <span style={{
                                fontSize: '15px',
                                fontWeight: '800',
                                color: student.average ? (student.average >= 4.5 ? '#10b981' : student.average < 2.0 ? '#ef4444' : 'var(--text-primary)') : 'var(--text-secondary)'
                              }}>
                                {student.average ? student.average.toFixed(2) : '–'}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setTargetStudent(student.name);
                                if (selectedTopic !== 'all' && activeTopicObj) {
                                  setGradeTopic(selectedTopic);
                                  if (activeTopicObj.type) setGradeType(activeTopicObj.type);
                                  if (activeTopicObj.weight) setGradeWeight(activeTopicObj.weight);
                                }
                                setIsGradeModalOpen(true);
                              }}
                              className="btn-outline"
                              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '4px' }}
                              title="Jegy beírása ehhez a diákhoz"
                            >
                              + Jegy
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Válassz ki egy csoportot a legördülőből.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* JEGYBEÍRÁS MODÁLIS ABLAK                                  */}
      {/* ======================================================== */}
      {isGradeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '20px', borderRadius: '6px', border: '1px solid var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--panel-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>
                Új Értékelés Beírása
              </h3>
              <button onClick={() => setIsGradeModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tanuló</label>
              <select
                value={targetStudent}
                onChange={e => setTargetStudent(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                {(activeGroup?.students || []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Érdemjegy kiválasztása (1-5 gombok) */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Érdemjegy</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[5, 4, 3, 2, 1].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGradeValue(num)}
                    style={{
                      padding: '10px 0',
                      borderRadius: '4px',
                      fontSize: '16px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      border: gradeValue === num ? '2px solid var(--text-primary)' : '1px solid var(--panel-border)',
                      background: gradeValue === num ? GRADE_COLORS[num].bg : 'var(--bg-color)',
                      color: GRADE_COLORS[num].text
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Súlyozás</label>
                <select
                  value={gradeWeight}
                  onChange={e => setGradeWeight(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value={100}>100% (Normál)</option>
                  <option value={200}>200% (Dupla - TZ)</option>
                  <option value={50}>50% (Fél - Röpdolgozat)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Típus</label>
                <select
                  value={gradeType}
                  onChange={e => setGradeType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="Témazáró dolgozat">Témazáró dolgozat</option>
                  <option value="Dolgozat">Dolgozat</option>
                  <option value="Órai munka">Órai munka</option>
                  <option value="Szóbeli felelet">Szóbeli felelet</option>
                  <option value="Házi feladat">Házi feladat</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Téma / Megjegyzés</label>
              <input
                type="text"
                placeholder="Pl. Függvények és egyenletek"
                value={gradeTopic}
                onChange={e => setGradeTopic(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Dátum</label>
              <input
                type="date"
                value={gradeDate}
                onChange={e => setGradeDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="btn-outline" onClick={() => setIsGradeModalOpen(false)}>Mégse</button>
              <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={handleAddGradeSubmit}>Jegy Rögzítése</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CSOPORT SZERKESZTÉSE / LÉTREHOZÁSA MODAL                 */}
      {/* ======================================================== */}
      {isGroupFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '20px', borderRadius: '6px', border: '1px solid var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--panel-bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>
                {editingGroupId ? 'Csoport Szerkesztése' : 'Új Csoport Létrehozása'}
              </h3>
              <button onClick={() => setIsGroupFormOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Csoport neve</label>
              <input
                placeholder="Pl. 10.c MAT1"
                value={groupFormName}
                onChange={e => setGroupFormName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tantárgy</label>
              <input
                placeholder="Pl. Matematika"
                value={groupFormSubject}
                onChange={e => setGroupFormSubject(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Diákok névsora (soronként 1 név)</label>
              <textarea
                placeholder="Diákok nevei..."
                value={groupFormStudents}
                onChange={e => setGroupFormStudents(e.target.value)}
                style={{ width: '100%', minHeight: '120px', padding: '10px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '12px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button className="btn-outline" onClick={() => setIsGroupFormOpen(false)}>Mégse</button>
              <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={handleSaveGroup}>Mentés</button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
