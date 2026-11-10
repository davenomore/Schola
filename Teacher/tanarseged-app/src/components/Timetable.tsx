import { useState, useEffect } from 'react';
import { FileText, X, Check, Clock, ChevronLeft, ChevronRight, CalendarDays, Calendar } from 'lucide-react';
import type { TimetableEntry } from '../utils/currentClassHelper';
import { PERIODS } from '../utils/currentClassHelper';
import { saveUserData, subscribeToUserData } from '../lib/db';

const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
const DAYS_SHORT = ['Hé', 'Ke', 'Sz', 'Cs', 'Pé'];

// ==============================================
// A felhasználó (Varga Dávid) előre kitöltött órarendje
// ==============================================
const DEFAULT_TIMETABLE: TimetableEntry[] = [
  // Hétfő (1)
  { day: 1, period: 4, subject: 'mat', className: '9.c', room: '120', groupCode: 'MAT1' },
  { day: 1, period: 5, subject: 'fiz', className: '11.d', room: '125', groupCode: '' },
  // Kedd (2)
  { day: 2, period: 1, subject: 'mat', className: '13.c', room: '35', groupCode: '13_ME' },
  { day: 2, period: 2, subject: 'mat', className: '13.c', room: '35', groupCode: '13_ME' },
  { day: 2, period: 5, subject: 'mat', className: '10.a', room: '225', groupCode: 'CS2' },
  { day: 2, period: 6, subject: 'mat', className: '10.a', room: '225', groupCode: 'CS1' },
  { day: 2, period: 7, subject: 'mat', className: '9.c', room: '121', groupCode: 'MAT1' },
  // Szerda (3)
  { day: 3, period: 2, subject: 'mat', className: '10.a', room: '225', groupCode: 'CS2' },
  { day: 3, period: 3, subject: 'mat', className: '10.a', room: '225', groupCode: 'CS1' },
  // Csütörtök (4)
  { day: 4, period: 1, subject: 'mat', className: '10.a', room: '225', groupCode: 'CS2' },
  { day: 4, period: 2, subject: 'mat', className: '10.a', room: '225', groupCode: 'CS1' },
  { day: 4, period: 3, subject: 'mat', className: '9.c', room: '225', groupCode: 'MAT1' },
  { day: 4, period: 6, subject: 'fiz', className: '11.d', room: '125', groupCode: '' },
  { day: 4, period: 7, subject: 'fiz', className: '10.a', room: '225', groupCode: '' },
  { day: 4, period: 8, subject: 'of', className: '10.a', room: '225', groupCode: '' },
  // Péntek (5)
  { day: 5, period: 1, subject: 'mat', className: '10.a', room: '225', groupCode: 'CS2' },
  { day: 5, period: 3, subject: 'mat', className: '13.c', room: '113', groupCode: '13_ME' },
  { day: 5, period: 4, subject: 'mat', className: '9.c', room: '121', groupCode: 'MAT1' },
  { day: 5, period: 6, subject: 'fiz', className: '10.a', room: '225', groupCode: '' },
  { day: 5, period: 7, subject: 'mat', className: '10.a', room: '225', groupCode: 'CS1' },
];

const subjectColors: Record<string, string> = {
  mat: '#58a6ff',
  fiz: '#f0883e',
  of: '#a371f7',
};

const Timetable = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [importText, setImportText] = useState('');
  const [isImportMode, setIsImportMode] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay(); // 0=Vas, 1=Hét...6=Szo
    return d >= 1 && d <= 5 ? d : 1;
  });
  
  // Modal for editing
  const [editingCell, setEditingCell] = useState<{ day: number, period: number } | null>(null);
  const [editForm, setEditForm] = useState({ subject: '', className: '', room: '', groupCode: '' });

  useEffect(() => {
    const unsub = subscribeToUserData('teacher_timetable_v2', (data) => {
      if (data && data.length > 0) {
        setTimetable(data);
      } else {
        setTimetable(DEFAULT_TIMETABLE);
        saveUserData('teacher_timetable_v2', DEFAULT_TIMETABLE);
      }
    });

    return unsub;
  }, []);

  const saveTimetable = (newTimetable: TimetableEntry[]) => {
    setTimetable(newTimetable);
    // V2-be mentsük a konzisztencia érdekében
    saveUserData('teacher_timetable_v2', newTimetable);
  };

  const handleImport = () => {
    try {
      if (!importText.trim()) return;
      const lines = importText.split('\n');
      const newEntries: TimetableEntry[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(';');
        if (parts.length >= 4) {
          const day = parseInt(parts[0].trim());
          const period = parseInt(parts[1].trim());
          if (!isNaN(day) && !isNaN(period) && day >= 1 && day <= 5 && period >= 1 && period <= 10) {
            newEntries.push({
              day, period,
              subject: parts[2].trim(),
              className: parts[3].trim(),
              room: parts[4] ? parts[4].trim() : '',
              groupCode: parts[5] ? parts[5].trim() : ''
            });
          }
        }
      }
      saveTimetable(newEntries);
      setIsImportMode(false);
      setImportText('');
    } catch {
      alert("Hiba az importálás során!");
    }
  };

  const openEditModal = (day: number, period: number) => {
    const existing = timetable.find(t => t.day === day && t.period === period);
    setEditForm(existing
      ? { subject: existing.subject, className: existing.className, room: existing.room, groupCode: existing.groupCode }
      : { subject: '', className: '', room: '', groupCode: '' }
    );
    setEditingCell({ day, period });
  };

  const saveCell = () => {
    if (!editingCell) return;
    const filtered = timetable.filter(t => !(t.day === editingCell.day && t.period === editingCell.period));
    if (editForm.subject.trim() || editForm.className.trim()) {
      filtered.push({
        day: editingCell.day, period: editingCell.period,
        subject: editForm.subject.trim(), className: editForm.className.trim(),
        room: editForm.room.trim(), groupCode: editForm.groupCode.trim()
      });
    }
    saveTimetable(filtered);
    setEditingCell(null);
  };

  const deleteCell = () => {
    if (!editingCell) return;
    const filtered = timetable.filter(t => !(t.day === editingCell.day && t.period === editingCell.period));
    saveTimetable(filtered);
    setEditingCell(null);
  };

  // Napi nézeten szükséges adat
  const todayEntries = timetable.filter(t => t.day === selectedDay).sort((a, b) => a.period - b.period);

  const renderCell = (entry: TimetableEntry | undefined, day: number, period: number) => {
    const color = entry ? (subjectColors[entry.subject] || 'var(--accent-blue)') : 'transparent';
    return (
      <td
        key={`${day}-${period}`}
        onClick={() => openEditModal(day, period)}
        style={{
          padding: '4px', borderBottom: '1px solid var(--border-glass)',
          borderRight: day < 5 ? '1px solid var(--border-glass)' : 'none',
          cursor: 'pointer', verticalAlign: 'top', height: '54px',
          background: entry ? `${color}10` : 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseOut={e => { e.currentTarget.style.background = entry ? `${color}10` : 'transparent'; }}
      >
        {entry && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 'bold', fontSize: '12px', color }}>{entry.subject}</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>{entry.className}</span>
            </div>
            {(entry.room || entry.groupCode) && (
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {entry.room && <span>{entry.room} </span>}
                {entry.groupCode && <span>({entry.groupCode})</span>}
              </div>
            )}
          </div>
        )}
      </td>
    );
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingBottom: '90px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
          <Clock size={22} color="var(--accent-blue)" /> Órarend
        </h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setViewMode(viewMode === 'daily' ? 'weekly' : 'daily')}
            style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {viewMode === 'daily' ? <><CalendarDays size={14} /> Heti</> : <><Calendar size={14} /> Napi</>}
          </button>
          <button onClick={() => setIsImportMode(!isImportMode)}
            style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText size={14} /> Import
          </button>
        </div>
      </div>

      {/* Import panel */}
      {isImportMode && (
        <div className="glass-panel" style={{ padding: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Tömeges importálás</h3>
            <button onClick={() => setIsImportMode(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18}/></button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
            Formátum: <code>nap;óra;tantárgy;osztály;terem;csoport</code><br/>
            Pl.: <code>2;1;mat;13.c;35;13_ME</code>
          </p>
          <textarea value={importText} onChange={e => setImportText(e.target.value)}
            placeholder="Ide illeszd az órarendet..."
            style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'white', fontFamily: 'monospace', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button className="btn-success" onClick={handleImport} style={{ marginTop: '10px', width: '100%' }}>Importálás</button>
        </div>
      )}

      {/* ============ DAILY VIEW ============ */}
      {viewMode === 'daily' && (
        <div>
          {/* Day selector */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button onClick={() => setSelectedDay(prev => prev > 1 ? prev - 1 : 5)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px' }}>
              <ChevronLeft size={24} />
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {DAYS_SHORT.map((d, i) => (
                <button key={i} onClick={() => setSelectedDay(i + 1)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: selectedDay === i + 1 ? 'var(--accent-blue)' : 'var(--bg-surface-glass)',
                    color: selectedDay === i + 1 ? 'white' : 'var(--text-secondary)',
                    fontWeight: selectedDay === i + 1 ? 'bold' : 'normal', fontSize: '13px',
                    transition: 'all 0.2s'
                  }}>
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedDay(prev => prev < 5 ? prev + 1 : 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px' }}>
              <ChevronRight size={24} />
            </button>
          </div>

          <h3 style={{ margin: '0 0 12px 0', textAlign: 'center', fontSize: '16px', color: 'var(--text-secondary)' }}>
            {DAYS[selectedDay - 1]}
          </h3>

          {/* Daily cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PERIODS.map(period => {
              const entry = todayEntries.find(e => e.period === period.p);
              const color = entry ? (subjectColors[entry.subject] || 'var(--accent-blue)') : 'var(--text-secondary)';
              return (
                <div key={period.p} onClick={() => openEditModal(selectedDay, period.p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                    background: entry ? 'var(--bg-surface-glass)' : 'transparent',
                    border: entry ? '1px solid var(--border-glass)' : '1px solid transparent',
                    opacity: entry ? 1 : 0.4, transition: 'all 0.15s',
                  }}>
                  {/* Period number + time */}
                  <div style={{ minWidth: '50px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: entry ? color : 'var(--text-secondary)' }}>{period.p}.</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{period.start}</div>
                  </div>
                  
                  {/* Divider */}
                  <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: entry ? color : 'var(--border-glass)' }} />

                  {/* Content */}
                  {entry ? (
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '15px', color }}>{entry.subject.toUpperCase()}</span>
                        <span style={{ fontSize: '14px', color: 'var(--accent-green)', fontWeight: 600 }}>{entry.className}</span>
                        {entry.groupCode && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({entry.groupCode})</span>}
                      </div>
                      {entry.room && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>📍 {entry.room}. terem</div>}
                    </div>
                  ) : (
                    <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>—</div>
                  )}

                  {/* End time */}
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{period.end}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ WEEKLY VIEW ============ */}
      {viewMode === 'weekly' && (
        <div style={{ overflowX: 'auto', background: 'var(--bg-surface-glass)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '550px', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '50px', padding: '10px 4px', borderBottom: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)' }}></th>
                {DAYS_SHORT.map((day, i) => (
                  <th key={i} style={{ padding: '10px 6px', textAlign: 'center', borderBottom: '1px solid var(--border-glass)', borderRight: i < 4 ? '1px solid var(--border-glass)' : 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => (
                <tr key={period.p}>
                  <td style={{ padding: '2px 4px', textAlign: 'center', borderBottom: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.15)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--accent-blue)' }}>{period.p}</div>
                    <div style={{ fontSize: '8px', color: 'var(--text-secondary)', lineHeight: '1.1' }}>{period.start}<br/>{period.end}</div>
                  </td>
                  {[1, 2, 3, 4, 5].map(day => {
                    const entry = timetable.find(t => t.day === day && t.period === period.p);
                    return renderCell(entry, day, period.p);
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ EDIT MODAL ============ */}
      {editingCell && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => setEditingCell(null)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{DAYS[editingCell.day - 1]} {editingCell.period}. óra</span>
              <button onClick={() => setEditingCell(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={22}/></button>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <input placeholder="Tantárgy (pl. mat)" value={editForm.subject} onChange={e => setEditForm({...editForm, subject: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none' }} />
              <input placeholder="Osztály (pl. 10.a)" value={editForm.className} onChange={e => setEditForm({...editForm, className: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Terem" value={editForm.room} onChange={e => setEditForm({...editForm, room: e.target.value})}
                  style={{ flex: 1, minWidth: 0, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none' }} />
                <input placeholder="Csoport" value={editForm.groupCode} onChange={e => setEditForm({...editForm, groupCode: e.target.value})}
                  style={{ flex: 1, minWidth: 0, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn-success" onClick={saveCell} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                <Check size={18} /> Mentés
              </button>
              {timetable.find(t => t.day === editingCell.day && t.period === editingCell.period) && (
                <button onClick={deleteCell}
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #f85149', background: 'transparent', color: '#f85149', cursor: 'pointer', fontSize: '13px' }}>
                  Törlés
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
