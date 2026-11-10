import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, ListTodo, X, Check, Calendar, Download, MessageSquare, Bell } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { saveUserData, subscribeToUserData } from '../lib/db';
import { StudentRecord, StudentNote, StudentReminder } from '../types';

export interface Group {
  id: string;
  name: string; // e.g. "9.A"
  subject: string; // e.g. "Informatika"
  students: string[]; // List of student names
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  date?: string;
  time?: string;
  reminderType?: string;
  reminderValue?: number;
  reminderUnit?: string;
  notified?: boolean;
}

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newStudents, setNewStudents] = useState('');

  // Todo states
  const [todos, setTodos] = useState<Record<string, Todo[]>>({});
  const [todoGroupId, setTodoGroupId] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDate, setNewTodoDate] = useState('');
  const [newTodoTime, setNewTodoTime] = useState('');
  const [newTodoReminderValue, setNewTodoReminderValue] = useState<number>(0);
  const [newTodoReminderUnit, setNewTodoReminderUnit] = useState<'min'|'hour'|'day'>('min');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  // Kréta import states
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Class Students states
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; groupId: string } | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [activeStudentTab, setActiveStudentTab] = useState<'notes' | 'reminders'>('notes');

  // Input states for student modal
  const [newNoteText, setNewNoteText] = useState('');
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');

  useEffect(() => {
    const unsubGroups = subscribeToUserData('teacher_groups', (data) => {
      setGroups(data || []);
    });
    const unsubTodos = subscribeToUserData('teacher_todos', (data) => {
      setTodos(data || {});
    });
    const unsubRecords = subscribeToUserData('student_records', (data) => {
      setStudentRecords(data || []);
    });
    return () => {
      unsubGroups();
      unsubTodos();
      unsubRecords();
    };
  }, []);

  const saveStudentRecords = (updated: StudentRecord[]) => {
    setStudentRecords(updated);
    saveUserData('student_records', updated);
  };

  const saveGroups = (updated: Group[]) => {
    // Optimista helyi frissítés, a subscribeToUserData később újra lefut
    setGroups(updated);
    saveUserData('teacher_groups', updated);
  };

  const saveTodos = (updated: Record<string, Todo[]>) => {
    setTodos(updated);
    saveUserData('teacher_todos', updated);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewName('');
    setNewSubject('');
    setNewStudents('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(group.id);
    setNewName(group.name);
    setNewSubject(group.subject);
    setNewStudents(group.students.join('\n'));
    setIsFormOpen(true);
    setExpandedId(group.id);
  };

  const handleSaveGroup = () => {
    if (!newName.trim() || !newSubject.trim()) return;
    
    const studentsArray = newStudents.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    if (editingId) {
      const updated = groups.map(g => g.id === editingId ? {
        ...g,
        name: newName,
        subject: newSubject,
        students: studentsArray
      } : g);
      saveGroups(updated);
    } else {
      const newGroup: Group = {
        id: Date.now().toString(),
        name: newName,
        subject: newSubject,
        students: studentsArray
      };
      saveGroups([...groups, newGroup]);
    }
    
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDeleteGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Biztosan törlöd ezt a csoportot? Minden adata elvész.')) {
      saveGroups(groups.filter(g => g.id !== id));
      if (editingId === id) setIsFormOpen(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        const p = await Notification.requestPermission();
        if (p !== 'granted') alert('Az értesítések letiltva. Kérlek engedélyezd őket a böngésző címsorában a lakat ikonra kattintva!');
      } else if (Notification.permission === 'denied') {
        alert('Az értesítések letiltva a böngészőben. A működéshez ezen az oldalon engedélyezni kell őket!');
      }
    } else {
      alert('A böngésződ vagy az eszközöd (pl. HTTP HTTPS helyett) nem támogatja az értesítéseket.');
    }
  };

  const handleTestNotification = () => {
    const title = 'Működik! ✅';
    const body = 'Ha látod ezt a lila buborékot, akkor a belső alkalmazás értesítések kiválóan működnek!';
    
    // App-on belüli értesítés tesztelése azonnal
    window.dispatchEvent(new CustomEvent('app-notification', { detail: { title, body } }));

    // Rendszer értesítés tesztelése és engedélykérés
    requestNotificationPermission().then(() => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Böngésző értesítés működik! ✅', { body: 'A háttérben futó emlékeztetők is megjelennek majd ezen az eszközön.' });
      }
    }).catch(() => {});
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim() || !todoGroupId) return;
    
    // Kérünk engedélyt, ha időpontot is állít be
    if (newTodoDate && newTodoTime) {
      requestNotificationPermission();
    }
    
    const groupTodos = todos[todoGroupId] || [];
    
    if (editingTodoId) {
        const updated = groupTodos.map(t => t.id === editingTodoId ? {
           ...t,
           text: newTodoText.trim(),
           date: newTodoDate || undefined,
           time: newTodoTime || undefined,
           reminderType: undefined,
           reminderValue: newTodoReminderValue,
           reminderUnit: newTodoReminderUnit,
           notified: false
        } : t);
        saveTodos({ ...todos, [todoGroupId]: updated });
    } else {
        const newTodo: Todo = {
           id: Date.now().toString(),
           text: newTodoText.trim(),
           completed: false,
           date: newTodoDate || undefined,
           time: newTodoTime || undefined,
           reminderValue: newTodoReminderValue,
           reminderUnit: newTodoReminderUnit,
           notified: false
        };
        saveTodos({ ...todos, [todoGroupId]: [...groupTodos, newTodo] });
    }
    
    setEditingTodoId(null);
    setNewTodoText('');
    setNewTodoDate('');
    setNewTodoTime('');
    setNewTodoReminderValue(0);
  };

  const handleEditTodo = (todo: Todo) => {
     setEditingTodoId(todo.id);
     setNewTodoText(todo.text);
     setNewTodoDate(todo.date || '');
     setNewTodoTime(todo.time || '');
     
     if (todo.reminderValue !== undefined) {
         setNewTodoReminderValue(todo.reminderValue);
         setNewTodoReminderUnit((todo.reminderUnit as any) || 'min');
     } else if (todo.reminderType && todo.reminderType !== 'none') {
         if (todo.reminderType === '10_min') { setNewTodoReminderValue(10); setNewTodoReminderUnit('min'); }
         else if (todo.reminderType === '1_hour') { setNewTodoReminderValue(1); setNewTodoReminderUnit('hour'); }
         else if (todo.reminderType === '1_day') { setNewTodoReminderValue(1); setNewTodoReminderUnit('day'); }
         else if (todo.reminderType === '2_days') { setNewTodoReminderValue(2); setNewTodoReminderUnit('day'); }
         else { setNewTodoReminderValue(0); setNewTodoReminderUnit('min'); }
     } else {
         setNewTodoReminderValue(0);
         setNewTodoReminderUnit('min');
     }
  };

  const openGoogleCalendar = (groupName: string, todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!todo.date) return;
    
    try {
        const [year, month, day] = todo.date.split('-').map(Number);
        const pad = (n: number) => n.toString().padStart(2, '0');
        let startStr = '';
        let endStr = '';
        
        if (todo.time) {
           const [hour, minute] = todo.time.split(':').map(Number);
           const startDate = new Date(year, month - 1, day, hour, minute);
           const endDate = new Date(year, month - 1, day, hour + 1, minute); // 1 órás alapértelmezett esemény
           
           // Google Calendar expects UTC format YYYYMMDDTHHMMSSZ for guaranteed perfect timezone alignment
           startStr = startDate.toISOString().replace(/-|:/g, '').split('.')[0] + 'Z';
           endStr = endDate.toISOString().replace(/-|:/g, '').split('.')[0] + 'Z';
        } else {
           startStr = `${year}${pad(month)}${pad(day)}`;
           const endDate = new Date(year, month - 1, day + 1);
           endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
        }
    
        const title = encodeURIComponent(`${groupName}: ${todo.text}`);
        const details = encodeURIComponent('A Teacher Assistant alkalmazásból mentve.');
        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
    
        window.open(googleUrl, '_blank');
    } catch (err) {
        console.error('Naptár hiba:', err);
        alert('Hiba a naptár link generálásakor.');
    }
  };

  const toggleTodo = (groupId: string, todoId: string) => {
    const groupTodos = todos[groupId] || [];
    const updated = groupTodos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
    saveTodos({ ...todos, [groupId]: updated });
  };

  const deleteTodo = (groupId: string, todoId: string) => {
    const groupTodos = todos[groupId] || [];
    const updated = groupTodos.filter(t => t.id !== todoId);
    saveTodos({ ...todos, [groupId]: updated });
  };

  const handleKretaImport = async () => {
    setIsImporting(true);
    setImportMessage('');
    try {
      if (!auth.currentUser) throw new Error("Nem vagy bejelentkezve!");
      const snapshot = await getDocs(collection(db, 'users', auth.currentUser.uid, 'scraped_groups'));
      if (snapshot.empty) {
        setImportMessage('⚠️ Nincs elérhető névsor a Felhőben. Előbb használd a Chrome bővítményt a Kréta oldalon!');
        setIsImporting(false);
        return;
      }

      let importedCount = 0;
      let updatedCount = 0;
      const currentGroups = [...groups];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const scrapedName = data.name || 'Ismeretlen';
        const scrapedSubject = data.subject || 'Ismeretlen';
        const scrapedStudents: string[] = data.students || [];

        // Létezik-e már ilyen csoport? (név + tantárgy alapján)
        const existingIdx = currentGroups.findIndex(
          g => g.name.toLowerCase() === scrapedName.toLowerCase() && 
               g.subject.toLowerCase() === scrapedSubject.toLowerCase()
        );

        if (existingIdx >= 0) {
          // Frissítés: meglévő csoport diáklistáját felülírjuk
          currentGroups[existingIdx] = {
            ...currentGroups[existingIdx],
            students: scrapedStudents
          };
          updatedCount++;
        } else {
          // Új csoport létrehozása
          currentGroups.push({
            id: Date.now().toString() + '_' + importedCount,
            name: scrapedName,
            subject: scrapedSubject,
            students: scrapedStudents
          });
          importedCount++;
        }

        // Töröljük a feldolgozott dokumentumot a Firestore-ból
        await deleteDoc(doc(db, 'users', auth.currentUser!.uid, 'scraped_groups', docSnap.id));
      }

      saveGroups(currentGroups);
      
      const parts = [];
      if (importedCount > 0) parts.push(`${importedCount} új csoport importálva`);
      if (updatedCount > 0) parts.push(`${updatedCount} csoport frissítve`);
      setImportMessage(`✅ ${parts.join(', ')}!`);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Ismeretlen hiba';
      setImportMessage(`❌ Hiba: ${errMsg}`);
    }
    setIsImporting(false);
  };

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Csoportok</h2>
        {!isFormOpen && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleKretaImport} 
              disabled={isImporting}
              style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #d29922, #bb8009)', color: 'white', cursor: isImporting ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: isImporting ? 0.6 : 1, transition: 'all 0.2s' }}
              title="Névsor letöltése a Kréta Chrome bővítményből"
            >
              <Download size={15} /> {isImporting ? 'Importálás...' : 'Kréta Import'}
            </button>
            <button className="btn-success" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={handleOpenAdd}>
              <Plus size={16} /> Új csoport
            </button>
          </div>
        )}
      </div>
      {importMessage && (
        <div style={{ padding: '10px 14px', marginBottom: '12px', borderRadius: '8px', background: importMessage.startsWith('✅') ? 'rgba(35,134,54,0.15)' : importMessage.startsWith('⚠️') ? 'rgba(210,153,34,0.15)' : 'rgba(248,81,73,0.15)', border: `1px solid ${importMessage.startsWith('✅') ? '#238636' : importMessage.startsWith('⚠️') ? '#d29922' : '#f85149'}`, color: importMessage.startsWith('✅') ? '#3fb950' : importMessage.startsWith('⚠️') ? '#d29922' : '#f85149', fontSize: '13px', fontWeight: 500, animation: 'slide-up 0.2s ease' }}>
          {importMessage}
        </div>
      )}

      {isFormOpen && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'slide-up 0.2s ease', border: editingId ? '1px solid var(--accent-blue)' : undefined }}>
          <h3 style={{ margin: 0, marginBottom: '8px', color: editingId ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
            {editingId ? 'Csoport Szerkesztése' : 'Új Csoport Létrehozása'}
          </h3>
          <input 
            placeholder="Név (pl. 9.A)" 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }}
          />
          <input 
            placeholder="Tantárgy (pl. Matematika)" 
            value={newSubject} 
            onChange={e => setNewSubject(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none' }}
          />
          <textarea 
            placeholder="Diákok nevei (minden sorba egy név)"
            value={newStudents}
            onChange={e => setNewStudents(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', minHeight: '120px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveGroup}>Mentés</button>
            <button style={{ flex: 1, padding: '12px 24px', borderRadius: 'var(--radius-full)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => { setIsFormOpen(false); setEditingId(null); }}>Mégse</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '70px' }}>
        {groups.length === 0 && !isFormOpen ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)', padding: '20px', background: 'var(--bg-surface-glass)', borderRadius: 'var(--radius-md)' }}>
            Még nincsenek létrehozott csoportok. <br/><br/>Kattints az "Új csoport" gombra, hogy felvidd a tanulókat és onnantól működjön a szkennelés!
          </div>
        ) : (
          groups.map(group => {
            const isExpanded = expandedId === group.id;
            const openTodosCount = (todos[group.id] || []).filter(t => !t.completed).length;

            return (
              <div key={group.id} className="glass-panel" style={{ overflow: 'hidden', transition: 'all 0.2s ease', border: editingId === group.id ? '1px solid var(--accent-blue)' : undefined }}>
                <div 
                  style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                  onClick={() => setExpandedId(isExpanded ? null : group.id)}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {group.name}
                    </h3>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{group.subject} • {group.students.length} diák</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setTodoGroupId(group.id); }} 
                       style={{ position: 'relative', background: 'none', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer', padding: '4px', opacity: 0.9 }} 
                       title="Teendők naptár"
                    >
                      <ListTodo size={22} />
                      {openTodosCount > 0 && (
                        <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#f85149', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                           {openTodosCount}
                        </span>
                      )}
                    </button>
                    <button onClick={(e) => handleOpenEdit(group, e)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', opacity: 0.8 }} title="Szerkesztés">
                      <Edit3 size={20} />
                    </button>
                    <button onClick={(e) => handleDeleteGroup(group.id, e)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px', opacity: 0.8 }} title="Törlés">
                      <Trash2 size={20} />
                    </button>
                    <div style={{ marginLeft: '4px' }}>
                      {isExpanded ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.25)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
                    {group.students.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                        {group.students.map((student, idx) => {
                          const record = studentRecords.find(r => r.studentName === student && r.groupId === group.id) || {
                            id: `${group.id}_${student}`,
                            studentName: student,
                            groupId: group.id,
                            notes: [],
                            reminders: []
                          };
                          const activeReminders = record.reminders.filter(r => !r.completed).length;
                          const notesCount = record.notes.length;

                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                setSelectedStudent({ name: student, groupId: group.id });
                                setIsStudentModalOpen(true);
                                setActiveStudentTab('notes');
                              }}
                              style={{ 
                                padding: '10px 12px', 
                                background: 'rgba(255, 255, 255, 0.03)', 
                                border: '1px solid rgba(255, 255, 255, 0.06)', 
                                borderRadius: '8px', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '6px', 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              className="student-card hover-border-blue"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{student}</span>
                                <span style={{ fontSize: '11px', color: 'var(--accent-blue)', opacity: 0.8, fontWeight: 500 }}>Megnyitás &rarr;</span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {notesCount > 0 ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', padding: '2px 5px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderRadius: '5px', fontWeight: 500 }}>
                                    <MessageSquare size={10} /> {notesCount} 💬
                                  </span>
                                ) : (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', padding: '2px 5px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-secondary)', borderRadius: '5px', opacity: 0.5 }}>
                                    <MessageSquare size={10} /> 0
                                  </span>
                                )}
                                
                                {activeReminders > 0 ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', padding: '2px 5px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderRadius: '5px', fontWeight: 600 }}>
                                    <Bell size={10} /> {activeReminders} 🔔
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>Nincsenek diákok a csoportban.</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Todo Modal Overlay */}
      {todoGroupId && (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.8)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            backdropFilter: 'blur(8px)', animation: 'slide-up 0.2s ease' 
        }}>
           <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--accent-purple)' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(163, 113, 247, 0.1)' }}>
                 <h3 style={{ margin: 0, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                    <ListTodo size={22} />
                    {(groups.find(g => g.id === todoGroupId)?.name || '')} Teendők
                 </h3>
                 <button onClick={() => {
                     setTodoGroupId(null);
                     setEditingTodoId(null);
                     setNewTodoText('');
                     setNewTodoDate('');
                     setNewTodoTime('');
                     setNewTodoReminderValue(0);
                 }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}><X size={24}/></button>
              </div>

              <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'center' }}>
                 <button onClick={handleTestNotification} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔔 Értesítések tesztelése
                 </button>
              </div>
              
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' }}>
                 {(todos[todoGroupId] || []).length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
                        Még nincsenek felírt teendők ehhez a csoporthoz.
                        <br/><br/>
                        <span style={{ fontSize: '12px' }}>Ide írhatod fel az emlékeztetőket (pl. füzetellenőrzés, kikérdezés).</span>
                    </div>
                 ) : (
                    (todos[todoGroupId] || []).sort((a,b) => Number(a.completed) - Number(b.completed)).map(todo => (
                       <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', opacity: todo.completed ? 0.6 : 1, transition: 'all 0.2s' }}>
                          <button onClick={() => toggleTodo(todoGroupId, todo.id)} style={{ background: todo.completed ? 'var(--accent-green)' : 'transparent', border: todo.completed ? 'none' : '2px solid var(--text-secondary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                             {todo.completed && <Check size={18} color="#000" />}
                          </button>
                          <div style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none', color: 'white', wordBreak: 'break-word' }}>
                             {todo.text}
                             {todo.date && <div style={{ fontSize: '12px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Calendar size={12}/> {todo.date} {todo.time ? ` ${todo.time}` : ''} {((todo.reminderType && todo.reminderType !== 'none') || (todo.reminderValue !== undefined && todo.reminderValue !== 0)) ? `🔔` : ''}</div>}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                             {todo.date && (
                                <button onClick={(e) => openGoogleCalendar((groups.find(g => g.id === todoGroupId)?.name || 'Csoport'), todo, e)} style={{ background: 'none', border: 'none', color: '#58a6ff', cursor: 'pointer', padding: '4px' }} title="Mentés Google Naptárba">
                                   <Calendar size={18} />
                                </button>
                             )}
                             <button onClick={() => handleEditTodo(todo)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', padding: '4px' }} title="Szerkesztés"><Edit3 size={18}/></button>
                             <button onClick={() => deleteTodo(todoGroupId, todo.id)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px' }} title="Törlés"><Trash2 size={18}/></button>
                          </div>
                       </div>
                    ))
                 )}
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
                 <input 
                    type="text" 
                    placeholder="Új feladat hozzáadása..." 
                    value={newTodoText}
                    onChange={e => setNewTodoText(e.target.value)}
                    style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                    onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                 />
                 <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                       type="date" 
                       value={newTodoDate}
                       onChange={e => setNewTodoDate(e.target.value)}
                       style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', colorScheme: 'dark' }}
                    />
                    {newTodoDate && (
                      <input 
                         type="time" 
                         value={newTodoTime}
                         onChange={e => setNewTodoTime(e.target.value)}
                         style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', colorScheme: 'dark' }}
                      />
                    )}
                 </div>
                 {newTodoDate && newTodoTime && (
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                             Értesítés: <strong style={{color:'white'}}>{newTodoReminderValue === 0 ? 'Esedékeskor' : `${newTodoReminderValue} ${newTodoReminderUnit === 'min' ? 'perccel' : newTodoReminderUnit === 'hour' ? 'órával' : 'nappal'} előtte`}</strong>
                          </span>
                          <select 
                             value={newTodoReminderUnit}
                             onChange={e => { setNewTodoReminderUnit(e.target.value as any); setNewTodoReminderValue(0); }}
                             style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                          >
                             <option value="min">Perc</option>
                             <option value="hour">Óra</option>
                             <option value="day">Nap</option>
                          </select>
                       </div>
                       <input 
                          type="range" 
                          min="0" 
                          max={newTodoReminderUnit === 'min' ? 60 : newTodoReminderUnit === 'hour' ? 48 : 14}
                          value={newTodoReminderValue}
                          onChange={e => setNewTodoReminderValue(Number(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                       />
                    </div>
                 )}
                 <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" onClick={handleAddTodo} style={{ padding: '12px 20px', background: 'var(--accent-purple)', flex: 1, borderRadius: '8px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                        {editingTodoId ? 'Mentés' : 'Hozzáadás'}
                    </button>
                    {editingTodoId && (
                       <button className="btn-secondary" onClick={() => {
                          setEditingTodoId(null);
                          setNewTodoText('');
                          setNewTodoDate('');
                          setNewTodoTime('');
                          setNewTodoReminderValue(0);
                       }} style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', color: 'white', flex: 1, borderRadius: '8px', cursor: 'pointer' }}>
                          Mégse
                       </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {isStudentModalOpen && selectedStudent && (() => {
        const student = selectedStudent.name;
        const groupId = selectedStudent.groupId;
        const group = groups.find(g => g.id === groupId);
        const record = studentRecords.find(r => r.studentName === student && r.groupId === groupId) || {
          id: `${groupId}_${student}`,
          studentName: student,
          groupId: groupId,
          notes: [],
          reminders: []
        };

        const handleAddNote = () => {
          if (!newNoteText.trim()) return;
          const newNote = {
            id: Date.now().toString(),
            text: newNoteText.trim(),
            createdAt: Date.now()
          };
          const updatedRecord = {
            ...record,
            notes: [newNote, ...record.notes]
          };
          const updatedRecords = studentRecords.filter(r => !(r.studentName === student && r.groupId === groupId));
          updatedRecords.push(updatedRecord);
          saveStudentRecords(updatedRecords);
          setNewNoteText('');
        };

        const handleDeleteNote = (noteId: string) => {
          const updatedRecord = {
            ...record,
            notes: record.notes.filter(n => n.id !== noteId)
          };
          const updatedRecords = studentRecords.filter(r => !(r.studentName === student && r.groupId === groupId));
          updatedRecords.push(updatedRecord);
          saveStudentRecords(updatedRecords);
        };

        const handleAddReminder = () => {
          if (!newReminderText.trim()) return;
          const newReminder = {
            id: Date.now().toString(),
            text: newReminderText.trim(),
            date: newReminderDate || undefined,
            time: newReminderTime || undefined,
            completed: false,
            createdAt: Date.now()
          };
          const updatedRecord = {
            ...record,
            reminders: [newReminder, ...record.reminders]
          };
          const updatedRecords = studentRecords.filter(r => !(r.studentName === student && r.groupId === groupId));
          updatedRecords.push(updatedRecord);
          saveStudentRecords(updatedRecords);
          setNewReminderText('');
          setNewReminderDate('');
          setNewReminderTime('');
        };

        const handleToggleReminder = (reminderId: string) => {
          const updatedRecord = {
            ...record,
            reminders: record.reminders.map(r => r.id === reminderId ? { ...r, completed: !r.completed } : r)
          };
          const updatedRecords = studentRecords.filter(r => !(r.studentName === student && r.groupId === groupId));
          updatedRecords.push(updatedRecord);
          saveStudentRecords(updatedRecords);
        };

        const handleDeleteReminder = (reminderId: string) => {
          const updatedRecord = {
            ...record,
            reminders: record.reminders.filter(r => r.id !== reminderId)
          };
          const updatedRecords = studentRecords.filter(r => !(r.studentName === student && r.groupId === groupId));
          updatedRecords.push(updatedRecord);
          saveStudentRecords(updatedRecords);
        };

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '16px', backdropFilter: 'blur(4px)' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', padding: 0, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
              
              {/* Header */}
              <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700 }}>{student}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{group?.name} • {group?.subject}</span>
                </div>
                <button 
                  onClick={() => setIsStudentModalOpen(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  className="hover:bg-white/10 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' }}>
                <button 
                  onClick={() => setActiveStudentTab('notes')}
                  style={{ 
                    flex: 1, 
                    padding: '12px 16px', 
                    background: 'none', 
                    border: 'none', 
                    borderBottom: activeStudentTab === 'notes' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    color: activeStudentTab === 'notes' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontWeight: activeStudentTab === 'notes' ? 700 : 500,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  📝 Feljegyzések ({record.notes.length})
                </button>
                <button 
                  onClick={() => setActiveStudentTab('reminders')}
                  style={{ 
                    flex: 1, 
                    padding: '12px 16px', 
                    background: 'none', 
                    border: 'none', 
                    borderBottom: activeStudentTab === 'reminders' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    color: activeStudentTab === 'reminders' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontWeight: activeStudentTab === 'reminders' ? 700 : 500,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🔔 Emlékeztetők ({record.reminders.filter(r => !r.completed).length})
                </button>
              </div>

              {/* Tab Contents */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {activeStudentTab === 'notes' && (
                  <>
                    {/* Add note form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <textarea
                        rows={2.5}
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder={`Írj feljegyzést diákhoz...`}
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', resize: 'none', width: '100%' }}
                      />
                      <button 
                        onClick={handleAddNote}
                        className="btn-primary" 
                        style={{ width: '100%', padding: '10px', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      >
                        Feljegyzés Hozzáadása
                      </button>
                    </div>

                    {/* Note list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Korábbi feljegyzések</h4>
                      
                      {record.notes.length === 0 ? (
                        <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                          Nincsenek feljegyzések ehhez a diákhoz.
                        </div>
                      ) : (
                        record.notes.map((note) => (
                          <div 
                            key={note.id} 
                            style={{ 
                              padding: '12px', 
                              background: 'rgba(255,255,255,0.02)', 
                              border: '1px solid rgba(255,255,255,0.05)', 
                              borderRadius: '8px', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{note.text}</p>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                                {new Date(note.createdAt).toLocaleString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteNote(note.id)}
                              style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                              className="hover:opacity-100"
                              title="Törlés"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {activeStudentTab === 'reminders' && (
                  <>
                    {/* Add reminder form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>Új egyéni emlékeztető</h4>
                      <input
                        type="text"
                        value={newReminderText}
                        onChange={(e) => setNewReminderText(e.target.value)}
                        placeholder="pl: Hiányzó füzet pótlása, Javító dolgozat..."
                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)', color: 'var(--text-primary)', outline: 'none', fontSize: '12.5px', width: '100%' }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase' }}>Dátum</label>
                          <input
                            type="date"
                            value={newReminderDate}
                            onChange={(e) => setNewReminderDate(e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px', width: '100%', colorScheme: 'dark' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase' }}>Időpont</label>
                          <input
                            type="time"
                            value={newReminderTime}
                            onChange={(e) => setNewReminderTime(e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px', width: '100%', colorScheme: 'dark' }}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handleAddReminder}
                        className="btn-success" 
                        style={{ width: '100%', padding: '8px', fontSize: '12.5px', marginTop: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      >
                        Emlékeztető Rögzítése
                      </button>
                    </div>

                    {/* Reminder checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emlékeztetők listája</h4>
                      
                      {record.reminders.length === 0 ? (
                        <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                          Nincsenek emlékeztetők rögzítve ehhez a diákhoz.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {record.reminders.map((rem) => (
                            <div 
                              key={rem.id} 
                              style={{ 
                                padding: '10px 12px', 
                                background: rem.completed ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.02)', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                borderRadius: '8px', 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '12px',
                                opacity: rem.completed ? 0.6 : 1,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={rem.completed}
                                onChange={() => handleToggleReminder(rem.id)}
                                style={{ width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ 
                                  fontSize: '13px', 
                                  color: 'var(--text-primary)', 
                                  textDecoration: rem.completed ? 'line-through' : 'none',
                                  fontWeight: rem.completed ? 400 : 500
                                }}>
                                  {rem.text}
                                </span>
                                {(rem.date || rem.time) && (
                                  <span style={{ fontSize: '10.5px', color: rem.completed ? 'var(--text-secondary)' : 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                    <Calendar size={11} /> {rem.date || ''} {rem.time || ''}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => handleDeleteReminder(rem.id)}
                                style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                                className="hover:opacity-100"
                                title="Törlés"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default Groups;

