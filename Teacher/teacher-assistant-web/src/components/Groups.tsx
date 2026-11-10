import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, ListTodo, X, Check, Calendar, Download } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { saveUserData, subscribeToUserData } from '../lib/db';

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

  useEffect(() => {
    const unsubGroups = subscribeToUserData('teacher_groups', (data) => {
      setGroups(data || []);
    });
    const unsubTodos = subscribeToUserData('teacher_todos', (data) => {
      setTodos(data || {});
    });
    return () => {
      unsubGroups();
      unsubTodos();
    };
  }, []);

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
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'white', outline: 'none' }}
          />
          <input 
            placeholder="Tantárgy (pl. Matematika)" 
            value={newSubject} 
            onChange={e => setNewSubject(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'white', outline: 'none' }}
          />
          <textarea 
            placeholder="Diákok nevei (minden sorba egy név)"
            value={newStudents}
            onChange={e => setNewStudents(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'white', minHeight: '120px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveGroup}>Mentés</button>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} onClick={() => { setIsFormOpen(false); setEditingId(null); }}>Mégse</button>
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
                  <div style={{ padding: '12px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
                    {group.students.length > 0 ? (
                      <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                        {group.students.map((student, idx) => (
                          <li key={idx} style={{ padding: '2px 0' }}>{student}</li>
                        ))}
                      </ol>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nincsenek diákok a csoportban.</span>
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

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-surface)' }}>
                 <input 
                    type="text" 
                    placeholder="Új feladat hozzáadása..." 
                    value={newTodoText}
                    onChange={e => setNewTodoText(e.target.value)}
                    style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none' }}
                    onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                 />
                 <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                       type="date" 
                       value={newTodoDate}
                       onChange={e => setNewTodoDate(e.target.value)}
                       style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none', colorScheme: 'dark' }}
                    />
                    {newTodoDate && (
                      <input 
                         type="time" 
                         value={newTodoTime}
                         onChange={e => setNewTodoTime(e.target.value)}
                         style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white', outline: 'none', colorScheme: 'dark' }}
                      />
                    )}
                 </div>
                 {newTodoDate && newTodoTime && (
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-color)', color: 'white' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                             Értesítés: <strong style={{color:'white'}}>{newTodoReminderValue === 0 ? 'Esedékeskor' : `${newTodoReminderValue} ${newTodoReminderUnit === 'min' ? 'perccel' : newTodoReminderUnit === 'hour' ? 'órával' : 'nappal'} előtte`}</strong>
                          </span>
                          <select 
                             value={newTodoReminderUnit}
                             onChange={e => { setNewTodoReminderUnit(e.target.value as any); setNewTodoReminderValue(0); }}
                             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
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
                       }} style={{ padding: '12px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-glass)', color: 'white', flex: 1, borderRadius: '8px', cursor: 'pointer' }}>
                          Mégse
                       </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Groups;

