/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Settings, 
  Lightbulb, 
  PlusCircle, 
  History, 
  Send, 
  Loader2, 
  Download, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardCheck,
  Zap,
  Atom,
  Pi,
  Menu,
  X,
  FileText,
  FileSpreadsheet,
  Upload,
  Calendar,
  Users,
  Table,
  ShieldCheck,
  Brain,
  Heart,
  Search,
  Book,
  Clock,
  LayoutDashboard,
  Sparkles,
  Coffee,
  Camera,
  Calculator,
  ListTodo,
  PieChart,
  Users as UsersIcon,
  BarChart2,
  Mic,
  Edit3,
  Star,
  Trash2,
  Bookmark,
  ExternalLink,
  Link
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { cn } from './lib/utils';
import { ToolType, GenerationRequest, GeneratedContent, MethodologyItem, UserProfile, PsychologyLibraryItem, SchoolBookmark, StudentRecord } from './types.ts';
import { METHODOLOGY_LIBRARY, PSYCHOLOGY_LIBRARY } from './constants.ts';
import schools from './data/schools.json';

// Firebase & Auth
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeToUserData, migrateLocalDataToCloud, saveUserData } from './lib/db';
import { PERIODS } from './utils/currentClassHelper';


// New Components
import Login from './components/Login';
import Scanner from './components/Scanner';
import GradeCalculator from './components/GradeCalculator';
import Groups from './components/Groups';
import List from './components/List';
import Timer from './components/Timer';
import SpinWheel from './components/SpinWheel';
import TeamGenerator from './components/TeamGenerator';
import Analytics from './components/Analytics';
import VoiceEntry from './components/VoiceEntry';
import ManualEntry from './components/ManualEntry';
import PlusPoints from './components/PlusPoints';
import Timetable from './components/Timetable';
import CurriculumPlanner from './components/CurriculumPlanner';
import { SyllabusTracker } from './components/SyllabusTracker';

const exportToWord = (content: string, title: string) => {
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
          "xmlns:w='urn:schemas-microsoft-com:office:word' "+
          "xmlns='http://www.w3.org/TR/REC-html40'>"+
          "<head><meta charset='utf-8'><title>Export</title></head><body>";
  const footer = "</body></html>";
  const html = header + content.replace(/\n/g, '<br>') + footer;

  const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.doc`;
  link.click();
  URL.revokeObjectURL(url);
};

const getToolTitle = (type: ToolType | 'SETTINGS' | 'DASHBOARD') => {
  if (type === 'DASHBOARD') return 'Vezérlőpult';
  if (type === 'SETTINGS') return 'Beállítások & Profil';
  switch (type) {
    case ToolType.LESSON_PLANNER: return 'Óraterv Készítő';
    case ToolType.EXERCISE_GENERATOR: return 'Feladatsor Generáló';
    case ToolType.CONCEPT_EXPLAINER: return 'Fogalom Magyarázó';
    case ToolType.EXPERIMENT_GUIDE: return 'Kísérleti Útmutató';
    case ToolType.CURRICULUM_PLANNER: return 'NAT Tanmenet Tervező';
    case ToolType.TIMETABLE: return 'Órarend';
    case ToolType.EVENT_CALENDAR: return 'Eseménynaptár';
    case ToolType.HOMEROOM_ASSISTANT: return 'Osztályfőnöki';
    case ToolType.METHODOLOGY_GUIDE: return 'Módszertani Gyűjtemény';
    case ToolType.PSYCHOLOGY_ADVISOR: return 'Pszichológiai Tanácsadó';
    case ToolType.SCANNER: return 'Dolgozat Szkennelés';
    case ToolType.GRADE_CALCULATOR: return 'Ponthatár Számító';
    case ToolType.GROUPS: return 'Csoportok & Diákok';
    case ToolType.LIST: return 'Feladatlista';
    case ToolType.TIMER: return 'Időzítő';
    case ToolType.SPINWHEEL: return 'Szerencsekerék';
    case ToolType.TEAMS: return 'Csapatgeneráló';
    case ToolType.ANALYTICS: return 'Eredmények & Analitika';
    case ToolType.VOICE_ENTRY: return 'Hangalapú Diktálás';
    case ToolType.MANUAL_ENTRY: return 'Manuális Rögzítés';
    case ToolType.PLUS_POINTS: return 'Pluszpontok';
    case ToolType.SYLLABUS_TRACKER: return 'Tanmenet Követő';
  }
};

const getToolIcon = (type: ToolType | 'SETTINGS' | 'DASHBOARD') => {
  if (type === 'DASHBOARD') return <LayoutDashboard className="w-4 h-4" />;
  if (type === 'SETTINGS') return <Settings className="w-4 h-4" />;
  switch (type) {
    case ToolType.LESSON_PLANNER: return <BookOpen className="w-4 h-4" />;
    case ToolType.EXERCISE_GENERATOR: return <Pi className="w-4 h-4" />;
    case ToolType.CONCEPT_EXPLAINER: return <Lightbulb className="w-4 h-4" />;
    case ToolType.EXPERIMENT_GUIDE: return <Atom className="w-4 h-4" />;
    case ToolType.CURRICULUM_PLANNER: return <FileText className="w-4 h-4" />;
    case ToolType.TIMETABLE: return <Table className="w-4 h-4" />;
    case ToolType.EVENT_CALENDAR: return <Calendar className="w-4 h-4" />;
    case ToolType.HOMEROOM_ASSISTANT: return <ShieldCheck className="w-4 h-4" />;
    case ToolType.METHODOLOGY_GUIDE: return <Brain className="w-4 h-4" />;
    case ToolType.PSYCHOLOGY_ADVISOR: return <Heart className="w-4 h-4" />;
    case ToolType.SCANNER: return <Camera className="w-4 h-4" />;
    case ToolType.GRADE_CALCULATOR: return <Calculator className="w-4 h-4" />;
    case ToolType.GROUPS: return <Users className="w-4 h-4" />;
    case ToolType.LIST: return <ListTodo className="w-4 h-4" />;
    case ToolType.TIMER: return <Clock className="w-4 h-4" />;
    case ToolType.SPINWHEEL: return <PieChart className="w-4 h-4" />;
    case ToolType.TEAMS: return <UsersIcon className="w-4 h-4" />;
    case ToolType.ANALYTICS: return <BarChart2 className="w-4 h-4" />;
    case ToolType.VOICE_ENTRY: return <Mic className="w-4 h-4" />;
    case ToolType.MANUAL_ENTRY: return <Edit3 className="w-4 h-4" />;
    case ToolType.PLUS_POINTS: return <PlusCircle className="w-4 h-4" />;
    case ToolType.SYLLABUS_TRACKER: return <FileSpreadsheet className="w-4 h-4" />;
  }
};

const EventCalendarModule = ({ events, setEvents }: { events: any[], setEvents: any }) => {
  const [newEvent, setNewEvent] = useState({ title: '', date: '', category: 'Dolgozat' });

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    setEvents([...events, { ...newEvent, id: crypto.randomUUID() }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setNewEvent({ title: '', date: '', category: 'Dolgozat' });
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Dolgozat': return 'bg-red-100 text-red-700 border-red-200';
      case 'Esemény': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Értekezlet': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Új Esemény</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Esemény neve</label>
              <input 
                type="text"
                placeholder="pl. Matek Témazáró"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dátum</label>
              <input 
                type="date"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Kategória</label>
              <select 
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              >
                <option value="Dolgozat">Dolgozat</option>
                <option value="Esemény">Esemény / Kirándulás</option>
                <option value="Értekezlet">Értekezlet / Szülői</option>
                <option value="Egyéb">Egyéb</option>
              </select>
            </div>
            <button 
              onClick={addEvent}
              className="w-full py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              Hozzáadás
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8 space-y-3">
        {events.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center opacity-60">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500">Nincsenek rögzített események.</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg p-2 min-w-[60px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{new Date(event.date).toLocaleDateString('hu-HU', { month: 'short' })}</span>
                  <span className="text-lg font-bold text-slate-700">{new Date(event.date).getDate()}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{event.title}</h4>
                  <span className={cn("text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border inline-block mt-1", getCategoryColor(event.category))}>
                    {event.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => deleteEvent(event.id)}
                className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MethodologyLibrary = ({ onSelect }: { onSelect: (item: MethodologyItem) => void }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Összes');

  const categories = ['Összes', 'Aktív tanulás', 'IKT', 'Értékelés', 'Közösségépítés', 'Differenciálás'];

  const filtered = METHODOLOGY_LIBRARY.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                         item.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === 'Összes' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Keresés módszerek vagy címkék között..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                activeCategory === cat 
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => (
          <motion.div 
            layout
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {item.category}
              </span>
              <Book className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">{item.title}</h3>
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{item.description}</p>
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
             <p className="text-slate-400 text-sm">Nincs találat a keresési feltételeknek megfelelően.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WellbeingWidget = ({ profile, eventsCount }: { profile: UserProfile, eventsCount: number }) => {
  const [advice, setAdvice] = useState('');
  
  const wellbeingTips = [
    "A mai napon koncentrálj egyetlen apró sikerre, amit egy diáknál láttál.",
    "Tarts 5 perc teljes csendet a szünetben, mielőtt belekezdenél a következő órába.",
    "Emlékeztesd magad: nem kell mindenre azonnal válaszolnod. A határok tartása segít a hosszú távú lelkesedésben.",
    "A humor a legjobb eszköz a feszültség ellen. Keress valami vicceset a mai napban!",
    "Igyál egy pohár vizet és végy három mély lélegzetet. A tested meghálálja."
  ];

  const motivationQuotes = [
    "A tanítás nem csak tudásátadás, hanem életek formálása. Ma is fontos munkát végzel!",
    "Egy jó tanár örökre hatással van a tanítványai jövőjére.",
    "A tudás magjait veted el, amik évek múltán fognak kikelni. Légy türelmes magaddal is."
  ];

  useEffect(() => {
    // Basic logic to pick a tip/quote
    const randomTip = wellbeingTips[Math.floor(Math.random() * wellbeingTips.length)];
    const randomQuote = motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
    setAdvice(eventsCount > 3 ? `Sűrű napod van (${eventsCount} esemény). ${randomTip}` : randomQuote);
  }, [eventsCount]);

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <h3 className="font-bold">Pedagógus Wellbeing</h3>
        </div>
        <p className="text-lg font-medium mb-4 leading-relaxed">
          "{advice}"
        </p>
        <div className="flex items-center gap-2 text-white/80 text-xs">
          <Coffee className="w-4 h-4" />
          <span>Vigyázz magadra ma is, {profile.name || 'Kedves Kolléga'}!</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ 
  profile, 
  historyCount, 
  eventsCount,
  onNavigate 
}: { 
  profile: UserProfile, 
  historyCount: number, 
  eventsCount: number,
  onNavigate: (tab: ToolType) => void 
}) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [todos, setTodos] = useState<Record<string, any[]>>({});
  const [plusData, setPlusData] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub1 = subscribeToUserData('teacher_groups', (data) => {
      setGroups(data || []);
    });
    const unsub2 = subscribeToUserData('teacher_todos', (data) => {
      setTodos(data || {});
    });
    const unsub3 = subscribeToUserData('plus_points', (data) => {
      setPlusData(data || []);
    });
    const unsub4 = subscribeToUserData('teacher_timetable_v2', (data) => {
      setTimetable(data || []);
      setLoading(false);
    });
    const unsub5 = subscribeToUserData('student_records', (data) => {
      setStudentRecords(data || []);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, []);

  const handleToggleStudentReminder = async (recordId: string, reminderId: string) => {
    const record = studentRecords.find(r => r.id === recordId);
    if (!record) return;
    const updatedRecord = {
      ...record,
      reminders: record.reminders.map(r => r.id === reminderId ? { ...r, completed: true } : r)
    };
    const updatedRecords = studentRecords.map(r => r.id === recordId ? updatedRecord : r);
    setStudentRecords(updatedRecords);
    await saveUserData('student_records', updatedRecords);
  };

  const totalStudents = groups.reduce((acc, g) => acc + (g.students?.length || 0), 0);
  
  const todayDayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const todayTimetable = timetable
    .filter(t => t.day === todayDayIndex)
    .sort((a, b) => a.period - b.period);

  const activeTodosList: { id: string; text: string; groupName: string; groupId: string; date?: string; isStudentReminder?: boolean; studentRecordId?: string }[] = [];
  Object.entries(todos).forEach(([groupId, list]) => {
    const group = groups.find(g => g.id === groupId);
    const groupName = group ? `${group.name} - ${group.subject}` : 'Csoport';
    if (Array.isArray(list)) {
      list.forEach(t => {
        if (!t.completed) {
          activeTodosList.push({
            id: t.id,
            text: t.text,
            groupId,
            groupName,
            date: t.date
          });
        }
      });
    }
  });

  studentRecords.forEach(record => {
    const group = groups.find(g => g.id === record.groupId);
    const groupName = group ? `${group.name} (Tanuló)` : 'Tanuló';
    record.reminders.forEach(r => {
      if (!r.completed) {
        activeTodosList.push({
          id: r.id,
          text: `${record.studentName}: ${r.text}`,
          groupId: record.groupId,
          groupName,
          date: r.date,
          isStudentReminder: true,
          studentRecordId: record.id
        });
      }
    });
  });

  const handleToggleTodo = async (groupId: string, todoId: string, isStudentReminder?: boolean, studentRecordId?: string) => {
    if (isStudentReminder && studentRecordId) {
      await handleToggleStudentReminder(studentRecordId, todoId);
      return;
    }
    const groupTodos = todos[groupId] || [];
    const updatedTodos = groupTodos.map((t: any) => 
      t.id === todoId ? { ...t, completed: true } : t
    );
    const newTodos = { ...todos, [groupId]: updatedTodos };
    setTodos(newTodos);
    await saveUserData('teacher_todos', newTodos);
  };

  const threshold = profile?.plusPointThreshold || 3;
  const kigyultStudents: { student: string; groupId: string; groupName: string; plusesCount: number }[] = [];

  plusData.forEach((pd: any) => {
    if (pd.pluses && pd.pluses.length >= threshold) {
      const group = groups.find(g => g.id === pd.groupId);
      if (group && group.students.includes(pd.student)) {
        kigyultStudents.push({
          student: pd.student,
          groupId: pd.groupId,
          groupName: `${group.name} - ${group.subject}`,
          plusesCount: pd.pluses.length
        });
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Üdvözöljük újra, {profile.name || 'Kolléga'}! 👋</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-500">
              Ma {new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })} van.
            </span>
            {profile.schoolName && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                  🏫 {profile.schoolName}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 flex items-center gap-1">
            <Book className="w-3 h-3" /> {historyCount} mentett anyag
          </span>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {eventsCount} feladat mára
          </span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => onNavigate(ToolType.GROUPS)}
          className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-blue-300 hover:shadow transition-all text-left"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Aktív diákok</p>
            <p className="text-lg font-bold text-slate-800">{totalStudents} diák</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate(ToolType.TIMETABLE)}
          className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-emerald-300 hover:shadow transition-all text-left"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Mai órák száma</p>
            <p className="text-lg font-bold text-slate-800">{todayTimetable.length} óra</p>
          </div>
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Aktív Teendők</p>
            <p className="text-lg font-bold text-slate-800">{activeTodosList.length} teendő</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Generált anyagok</p>
            <p className="text-lg font-bold text-slate-800">{historyCount} anyag</p>
          </div>
        </div>
      </div>

      {/* Main Core Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Mai órarended
            </h3>
            {loading ? (
              <div className="text-center py-6 text-slate-400">Betöltés...</div>
            ) : todayTimetable.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <span className="text-2xl mb-2">☕</span>
                <p className="text-sm font-medium text-slate-700">Ma nincs tanítási órád az órarendben!</p>
                <p className="text-xs text-slate-400 mt-1">Élvezd a pihenést vagy a felkészülést.</p>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1">
                {todayTimetable.map((entry, index) => {
                  const periodTime = PERIODS.find(p => p.p === entry.period) || { start: '--:--', end: '--:--' };
                  return (
                    <div key={index} className="flex items-center justify-between p-2.5 px-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {entry.period}.
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 uppercase">
                            {entry.subject === 'mat' ? 'Matematika' : entry.subject === 'fiz' ? 'Fizika' : entry.subject === 'of' ? 'Osztályfőnöki' : entry.subject}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {periodTime.start} - {periodTime.end} • Terem: {entry.room}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-200/60 text-slate-700 text-[10px] font-semibold rounded">
                        {entry.className}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plus points threshold alerts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                Kigyűlt Pluszpontok
              </span>
              <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full font-semibold">
                {kigyultStudents.length} diák
              </span>
            </h3>
            {kigyultStudents.length === 0 ? (
              <div className="text-center p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-medium text-slate-500">Még nincs kigyűlt tanuló (küszöb: {threshold} pont).</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[160px] pr-1">
                {kigyultStudents.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 px-3 bg-orange-50/30 border border-orange-100 rounded-lg transition-all hover:bg-orange-50/60">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.student}</p>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">{item.groupName}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                        ⭐ {item.plusesCount}p
                      </span>
                      <button 
                        onClick={() => onNavigate(ToolType.PLUS_POINTS)}
                        className="px-2 py-1 bg-orange-500 text-white text-[9px] font-bold rounded hover:bg-orange-600 transition-colors shadow-sm"
                      >
                        Jegyosztás
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Todo Manager & Quick Actions */}
        <div className="space-y-6">
          <WellbeingWidget profile={profile} eventsCount={eventsCount} />

          {/* Central Todo Manager */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-500" />
              Aktív Teendők
            </h3>
            {activeTodosList.length === 0 ? (
              <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
                <span className="text-xl mb-1 block">🎉</span>
                <p className="text-xs font-semibold text-slate-600">Minden teendő elvégezve!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                {activeTodosList.map((todo) => (
                  <div key={todo.id} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-colors group">
                    <button 
                      onClick={() => handleToggleTodo(todo.groupId, todo.id, todo.isStudentReminder, todo.studentRecordId)}
                      className="mt-0.5 w-4 h-4 rounded border border-slate-300 hover:border-purple-500 hover:bg-purple-50 text-white flex items-center justify-center transition-colors"
                      title="Késznek jelölés"
                    >
                      <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-purple-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 break-words">{todo.text}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-none">
                        {todo.groupName} {todo.date && `• Határidő: ${todo.date}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Gyors Műveletek
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onNavigate(ToolType.SCANNER)}
                className="p-3 text-center rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-1.5 group"
              >
                <div className="p-2 bg-blue-50 rounded-lg text-blue-500 group-hover:bg-blue-100 transition-colors">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Dolgozat Szkennelés</span>
              </button>

              <button 
                onClick={() => onNavigate(ToolType.MANUAL_ENTRY)}
                className="p-3 text-center rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-1.5 group"
              >
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Manuális Jegyek</span>
              </button>

              <button 
                onClick={() => onNavigate(ToolType.VOICE_ENTRY)}
                className="p-3 text-center rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-1.5 group"
              >
                <div className="p-2 bg-purple-50 rounded-lg text-purple-500 group-hover:bg-purple-100 transition-colors">
                  <Mic className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Hangalapú Bevitel</span>
              </button>

              <button 
                onClick={() => onNavigate(ToolType.TIMER)}
                className="p-3 text-center rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-1.5 group"
              >
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Órai Időzítő</span>
              </button>

              <button 
                onClick={() => onNavigate(ToolType.SPINWHEEL)}
                className="p-3 text-center rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-1.5 group"
              >
                <div className="p-2 bg-pink-50 rounded-lg text-pink-500 group-hover:bg-pink-100 transition-colors">
                  <PieChart className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Szerencsekerék</span>
              </button>

              <button 
                onClick={() => onNavigate(ToolType.GROUPS)}
                className="p-3 text-center rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center gap-1.5 group"
              >
                <div className="p-2 bg-orange-50 rounded-lg text-orange-500 group-hover:bg-orange-100 transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">Csoportok</span>
              </button>
            </div>
          </div>

          {/* School Bookmarks / Gyorslinkek Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                Iskolai Gyorslinkek
              </span>
              <button 
                onClick={() => onNavigate('SETTINGS' as any)}
                className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-50 rounded transition-colors"
                title="Könyvjelzők Kezelése"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </h3>
            
            {(!profile.bookmarks || profile.bookmarks.length === 0) ? (
              <div className="text-center py-5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4">
                <p className="text-[11px] font-medium text-slate-500">Még nincs rögzített gyorslinked.</p>
                <button
                  onClick={() => onNavigate('SETTINGS' as any)}
                  className="text-[10px] text-blue-600 font-bold hover:underline mt-1 block w-full text-center"
                >
                  ➕ Beállítás most
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {profile.bookmarks.map((bm) => (
                  <a 
                    key={bm.id}
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 px-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/30 hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-1.5 bg-white border border-slate-100 text-slate-500 rounded-lg group-hover:text-blue-600 group-hover:border-blue-100 transition-colors flex-shrink-0">
                        {bm.category === 'Kréta / Adminisztráció' ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : bm.category === 'Iskolai Honlap' ? (
                          <BookOpen className="w-3.5 h-3.5" />
                        ) : bm.category === 'Tananyagok / Segédletek' ? (
                          <Book className="w-3.5 h-3.5" />
                        ) : (
                          <Link className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{bm.title}</p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{bm.category}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const PsychologyLibrary = ({ onSelectItem }: { onSelectItem: (item: PsychologyLibraryItem) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(PSYCHOLOGY_LIBRARY.map(item => item.category)));

  const filteredItems = PSYCHOLOGY_LIBRARY.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Keresés a tanácsadó tárban..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
              !selectedCategory ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Összes
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                selectedCategory === cat ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group cursor-pointer"
            onClick={() => onSelectItem(item)}
          >
            <div className="p-5 flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded">
                  {item.category}
                </span>
                <Heart className="w-4 h-4 text-slate-200 group-hover:text-purple-400 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">{item.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-3">{item.description}</p>
              <div className="mt-4 flex flex-wrap gap-1">
                {item.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-slate-400">#{tag}</span>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Részletek</span>
              <BookOpen className="w-3 h-3 text-slate-400 group-hover:text-purple-600 transition-all group-hover:translate-x-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SettingsModule = ({ profile, setProfile, resultsCount }: { profile: UserProfile, setProfile: (p: UserProfile) => void, resultsCount: number }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [subjects, setSubjects] = useState(profile.subjects.join(', '));
  const [searchQuery, setSearchQuery] = useState(profile.schoolName || '');
  const [schoolCode, setSchoolCode] = useState(profile.schoolCode || '');
  const [schoolUrl, setSchoolUrl] = useState(profile.schoolUrl || '');
  const [isHomeroomTeacher, setIsHomeroomTeacher] = useState(profile.isHomeroomTeacher);
  const [homeroomClass, setHomeroomClass] = useState(profile.homeroomClass || '');
  const [plusPointThreshold, setPlusPointThreshold] = useState(profile.plusPointThreshold || 3);
  
  // Bookmarks local state
  const [bookmarks, setBookmarks] = useState<SchoolBookmark[]>(profile.bookmarks || []);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'Kréta / Adminisztráció' | 'Iskolai Honlap' | 'Tananyagok / Segédletek' | 'Egyéb'>('Kréta / Adminisztráció');

  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    setName(profile.name);
    setSubjects(profile.subjects.join(', '));
    setSearchQuery(profile.schoolName || '');
    setSchoolCode(profile.schoolCode || '');
    setSchoolUrl(profile.schoolUrl || '');
    setIsHomeroomTeacher(profile.isHomeroomTeacher);
    setHomeroomClass(profile.homeroomClass || '');
    setPlusPointThreshold(profile.plusPointThreshold || 3);
    setBookmarks(profile.bookmarks || []);
  }, [profile]);

  const handleSave = () => {
    setProfile({
      ...profile,
      name,
      subjects: subjects.split(',').map(s => s.trim()).filter(s => s !== ''),
      isHomeroomTeacher,
      homeroomClass: isHomeroomTeacher ? homeroomClass : '',
      schoolName: searchQuery,
      schoolCode,
      schoolUrl,
      plusPointThreshold: Number(plusPointThreshold) || 3,
      bookmarks
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(profile.name);
    setSubjects(profile.subjects.join(', '));
    setSearchQuery(profile.schoolName || '');
    setSchoolCode(profile.schoolCode || '');
    setSchoolUrl(profile.schoolUrl || '');
    setIsHomeroomTeacher(profile.isHomeroomTeacher);
    setHomeroomClass(profile.homeroomClass || '');
    setPlusPointThreshold(profile.plusPointThreshold || 3);
    setBookmarks(profile.bookmarks || []);
    setNewTitle('');
    setNewUrl('');
    setNewCategory('Kréta / Adminisztráció');
    setIsEditing(false);
  };

  const filteredSchools = searchQuery.trim() === '' ? [] : schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {!isEditing ? (
        <>
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              Személyes Profil
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Szerkesztés
            </button>
          </div>
          
          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-md shrink-0">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="space-y-1 flex-1">
                <h2 className="text-lg font-bold text-slate-800">{profile.name || 'Név nincs megadva'}</h2>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {profile.schoolName ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                      🏫 {profile.schoolName}
                      {profile.schoolCode && (
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" title="Kréta összeköttetés aktív" />
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Iskola nincs beállítva</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tanított tantárgyak</span>
                {profile.subjects && profile.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.subjects.map((sub, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-50/50 text-blue-700 border border-blue-100 rounded-md text-xs font-semibold">
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Nincsenek megadva tárgyak</span>
                )}
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Osztályfőnöki státusz</span>
                {profile.isHomeroomTeacher ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-xs font-semibold">
                    ⭐ Osztályfőnök {profile.homeroomClass ? `(${profile.homeroomClass})` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-md text-xs font-semibold">
                    Nem osztályfőnök
                  </span>
                )}
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pluszpont küszöb</span>
                <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-md text-xs font-semibold font-mono">
                  🎯 {profile.plusPointThreshold || 3} pont = 1 mérföldkő
                </span>
              </div>
              
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Generált anyagok</span>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-semibold">
                  ✨ {resultsCount} db AI erőforrás
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Read-Only Bookmarks Section */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600" />
              Iskolai Hasznos Linkek (Könyvjelzők)
            </h3>
          </div>
          <div className="p-6">
            {bookmarks.length === 0 ? (
              <div className="text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-medium text-slate-500">Nincsenek még rögzített könyvjelzőid.</p>
                <p className="text-[10px] text-slate-400 mt-1">Kattints a "Szerkesztés" gombra a hozzáadáshoz!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bookmarks.map((bm) => (
                  <a
                    key={bm.id}
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 rounded-xl flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {bm.category === 'Kréta / Adminisztráció' ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : bm.category === 'Iskolai Honlap' ? (
                          <BookOpen className="w-4 h-4" />
                        ) : bm.category === 'Tananyagok / Segédletek' ? (
                          <Book className="w-4 h-4" />
                        ) : (
                          <Link className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{bm.title}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{bm.category}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </>
      ) : (
        <>
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                Profil Szerkesztése
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Mégse
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Mentés
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tanár Neve</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
                
                <div className="relative">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Kréta Iskola Kiválasztása</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsOpen(true);
                        if (e.target.value === '') {
                          setSchoolCode('');
                          setSchoolUrl('');
                        }
                      }}
                      onFocus={() => setIsOpen(true)}
                      onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Iskola vagy város neve..."
                    />
                    {schoolCode && (
                      <span className="absolute right-3 top-2.5 px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">
                        Kréta összekötve
                      </span>
                    )}
                  </div>
                  
                  {isOpen && searchQuery.trim() !== '' && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSchools.map((school) => (
                        <button
                          key={school.code}
                          type="button"
                          onClick={() => {
                            setSearchQuery(school.name);
                            setSchoolCode(school.code);
                            setSchoolUrl(school.url);
                            setIsOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 transition-colors flex flex-col border-b border-slate-100 last:border-b-0"
                        >
                          <span className="font-semibold text-slate-800">{school.name}</span>
                          <span className="text-[10px] text-slate-500">{school.city} • {school.url}</span>
                        </button>
                      ))}
                      {!schools.some(s => s.name.toLowerCase() === searchQuery.toLowerCase()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSchoolCode('');
                            setSchoolUrl('');
                            setIsOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-xs hover:bg-blue-50 text-blue-600 font-semibold transition-colors flex items-center gap-2 border-t border-slate-100 first:border-t-0"
                        >
                          <span className="text-sm">➕</span>
                          <div>
                            <p className="font-bold">Egyedi iskola rögzítése</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">"{searchQuery}" mentése Kréta összeköttetés nélkül</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tanított tantárgyak (vesszővel elválasztva)</label>
                <input 
                  type="text" 
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  placeholder="pl: Matematika, Fizika, Informatika"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Osztályfőnöki modul</h4>
                    <p className="text-xs text-slate-500">Kapcsolja be, ha osztályfőnöki feladatokat is ellát.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsHomeroomTeacher(!isHomeroomTeacher)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                      isHomeroomTeacher ? "bg-blue-600" : "bg-slate-200"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      isHomeroomTeacher ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>
                
                {isHomeroomTeacher && (
                  <div className="pt-3 border-t border-slate-200/60">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Saját osztályfőnöki osztályod</label>
                    <input 
                      type="text" 
                      value={homeroomClass}
                      onChange={(e) => setHomeroomClass(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="pl: 9.A"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Ezt az osztályt fogja alapértelmezettként használni az Osztályfőnöki AI asszisztens.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500" />
                Személyreszabás
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pluszpont küszöb</label>
                <p className="text-xs text-slate-500 mb-3">Hány pluszpont összegyűjtése esetén járjon egy jegy (vagy váltson át a diák állapota "KIGYŰLT"-re)?</p>
                <input 
                  type="number" 
                  min="1"
                  max="20"
                  value={plusPointThreshold}
                  onChange={(e) => setPlusPointThreshold(Number(e.target.value) || 3)}
                  className="w-full max-w-[120px] px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none bg-white"
                />
              </div>
            </div>
          </section>

          {/* Editable Bookmarks Section */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                Hasznos Linkek Kezelése
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Existing links list with delete button */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jelenlegi linkek ({bookmarks.length} db)</h4>
                {bookmarks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Még nincs rögzített könyvjelző.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                    {bookmarks.map((bm) => (
                      <div key={bm.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{bm.title}</p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5 font-mono">{bm.url} • {bm.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBookmarks(bookmarks.filter(b => b.id !== bm.id))}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                          title="Törlés"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form to add a new link */}
              <div className="pt-4 border-t border-slate-200/60 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Új könyvjelző hozzáadása</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Megnevezés</label>
                    <input
                      type="text"
                      placeholder="pl: Iskolai Menza"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Weboldal URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Kategória</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="Kréta / Adminisztráció">Kréta / Adminisztráció</option>
                      <option value="Iskolai Honlap">Iskolai Honlap</option>
                      <option value="Tananyagok / Segédletek">Tananyagok / Segédletek</option>
                      <option value="Egyéb">Egyéb</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newTitle.trim() || !newUrl.trim()) return;
                    let formattedUrl = newUrl.trim();
                    if (!/^https?:\/\//i.test(formattedUrl)) {
                      formattedUrl = 'https://' + formattedUrl;
                    }
                    const newBookmark: SchoolBookmark = {
                      id: crypto.randomUUID(),
                      title: newTitle.trim(),
                      url: formattedUrl,
                      category: newCategory
                    };
                    setBookmarks([...bookmarks, newBookmark]);
                    setNewTitle('');
                    setNewUrl('');
                  }}
                  disabled={!newTitle.trim() || !newUrl.trim()}
                  className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Könyvjelző Hozzáadása
                </button>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Mégse
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Változások Mentése
            </button>
          </div>
        </>
      )}

      {/* Helper and stats section rendered at the bottom in both states */}
      <section className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-blue-800 mb-2">Hogyan segít a profil?</h4>
        <ul className="text-xs text-blue-700 space-y-2 list-disc list-inside">
          <li>Az AI generátor figyelembe veszi a tanított tárgyaidat a válaszoknál.</li>
          <li>A felület elrejti a számodra nem releváns eszközöket.</li>
          <li>A generált anyagok fejlécébe bekerülhet a neved és az iskolád.</li>
        </ul>
      </section>

      {/* Visual Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-indigo-900 text-white rounded-xl p-4 shadow-lg relative overflow-hidden flex flex-col justify-between h-28 sm:h-32">
          <h3 className="text-[9px] md:text-[10px] font-bold text-indigo-300 uppercase tracking-widest relative z-10">AI Tevékenység</h3>
          <div className="flex items-end gap-2 relative z-10">
            <span className="text-3xl font-light">{resultsCount}</span>
            <span className="text-[9px] md:text-[10px] text-indigo-300 mb-1.5 uppercase font-bold text-right leading-none">Generált<br/>Erőforrás</span>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="text-6xl md:text-7xl font-bold italic font-serif">π</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-28 sm:h-32 flex flex-col">
          <h3 className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rendszer Állapot</h3>
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-700">Gemini Pro Online</span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-1">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: '85%' }}></div>
             </div>
             <p className="text-[9px] text-slate-400 mt-2">Válaszidő: ~1.2s | Biztonság: OK</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultDisplay = ({ 
  result, 
  onBack, 
  onFullscreen,
  isFullscreen,
  results,
  setResults,
  getToolTitle,
  exportToWord
}: { 
  result: GeneratedContent, 
  onBack: () => void,
  onFullscreen: () => void,
  isFullscreen: boolean,
  results: GeneratedContent[],
  setResults: React.Dispatch<React.SetStateAction<GeneratedContent[]>>,
  getToolTitle: (type: ToolType) => string,
  exportToWord: (content: string, title: string) => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(result.content);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    const updatedResults = results.map(r => 
      r.id === result.id ? { ...r, content: editedContent } : r
    );
    setResults(updatedResults);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFavorite = () => {
    const updatedResults = results.map(r => 
      r.id === result.id ? { ...r, isFavorite: !r.isFavorite } : r
    );
    setResults(updatedResults);
  };

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-white border border-slate-200 shadow-sm flex flex-col no-print",
        isFullscreen ? "fixed inset-0 z-[60] lg:inset-4 lg:rounded-3xl h-auto" : "rounded-xl h-full"
      )}
    >
      <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 overflow-x-auto shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">
            {getToolTitle(result.type)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden xs:inline">
            {new Date(result.createdAt).toLocaleDateString('hu-HU')}
          </span>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleCopy}
             className={cn(
               "p-1.5 rounded transition-colors",
               copied ? "bg-green-100 text-green-600" : "hover:bg-slate-200 text-slate-500"
             )}
             title="Másolás vágólapra"
           >
              {copied ? <ShieldCheck className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
           </button>
           <button 
             onClick={toggleFavorite}
             className={cn(
               "p-1.5 rounded transition-colors",
               result.isFavorite ? "text-yellow-500 bg-yellow-50" : "hover:bg-slate-200 text-slate-500"
             )}
             title="Kedvencekhez adás"
           >
              <Zap className={cn("w-4 h-4", result.isFavorite ? "fill-yellow-500" : "")} />
           </button>
           <button 
             onClick={() => exportToWord(result.content, result.title)}
             className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"
             title="Exportálás Word (.doc) formátumba"
           >
              <FileText className="w-4 h-4" />
           </button>
           <button 
             onClick={() => window.print()}
             className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"
             title="Exportálás PDF formátumba (Nyomtatás)"
           >
              <Download className="w-4 h-4" />
           </button>
           <button 
             onClick={() => setIsEditing(!isEditing)}
             className={cn(
               "p-1.5 rounded transition-colors",
               isEditing ? "bg-blue-100 text-blue-600" : "hover:bg-slate-200 text-slate-500"
             )}
             title="Szerkesztés"
           >
              <Settings className="w-4 h-4" />
           </button>
           <button 
             onClick={onFullscreen}
             className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"
             title={isFullscreen ? "Kilépés a teljes képernyőből" : "Teljes képernyő"}
           >
              <PlusCircle className={cn("w-4 h-4 transition-transform", isFullscreen ? "rotate-45" : "")} />
           </button>
           {!isFullscreen && (
             <button 
              onClick={onBack}
              className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-500"
             >
                <X className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>

      <div className={cn(
        "p-6 md:p-10 overflow-y-auto flex-1",
        isFullscreen ? "max-h-full" : "max-h-[calc(100vh-280px)]"
      )}>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 border-b border-slate-100 pb-4 leading-tight">{result.title}</h2>
        
        {isEditing ? (
          <div className="space-y-4">
            <textarea 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[500px] p-6 font-mono text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
              >
                Mégse
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
              >
                Módosítás Mentése
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm md:prose-base prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
            <ReactMarkdown 
              remarkPlugins={[remarkMath, remarkGfm]} 
              rehypePlugins={[rehypeKatex]}
            >
              {result.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Hidden copy for print only */}
      <div className="hidden print-only p-10 font-sans">
         <h1 className="text-3xl font-bold mb-4">{result.title}</h1>
         <p className="text-sm text-slate-500 mb-8">{getToolTitle(result.type)} - {new Date(result.createdAt).toLocaleDateString('hu-HU')}</p>
         <div className="prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{result.content}</ReactMarkdown>
         </div>
      </div>
    </motion.div>
  );
};




const DEFAULT_BOOKMARKS: SchoolBookmark[] = [
  { id: '1', title: 'Kréta Ellenőrző', url: 'https://klik.ekreta.hu', category: 'Kréta / Adminisztráció' },
  { id: '2', title: 'Nemzeti Köznevelési Portál', url: 'https://www.nkp.hu', category: 'Tananyagok / Segédletek' },
  { id: '3', title: 'Oktatási Hivatal', url: 'https://www.oktatas.hu', category: 'Egyéb' },
  { id: '4', title: 'Sulinet', url: 'https://www.sulinet.hu', category: 'Tananyagok / Segédletek' }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [methodologyView, setMethodologyView] = useState<'generator' | 'library'>('library');
  const [psychologyView, setPsychologyView] = useState<'generator' | 'library'>('library');
  const [activeTab, setActiveTab] = useState<ToolType | 'SETTINGS' | 'DASHBOARD'>( 'DASHBOARD');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    subjects: ['Matematika', 'Fizika'],
    isHomeroomTeacher: true,
    homeroomClass: '',
    plusPointThreshold: 3,
    bookmarks: DEFAULT_BOOKMARKS
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedContent[]>([]);
  const [selectedResult, setSelectedResult] = useState<GeneratedContent | null>(null);

  // Innovative Homeroom states
  const [selectedHomeroomTemplate, setSelectedHomeroomTemplate] = useState<'MEETING' | 'COMMUNITY' | 'CONFLICT' | 'TRIP' | null>(null);
  const [meetingTopics, setMeetingTopics] = useState<string[]>(['Tanulmányi eredmények', 'Magaviselet']);
  const [communityFocus, setCommunityFocus] = useState('Csapatépítés');
  const [conflictScenario, setConflictScenario] = useState('Cyberbullying');
  const [tripDuration, setTripDuration] = useState(1);
  const [tripTransport, setTripTransport] = useState('Busz');
  const [tripFocus, setTripFocus] = useState('Kulturális');

  // New states for organizational modules
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classGroups, setClassGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
         await migrateLocalDataToCloud(currentUser.uid);
      }
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load history and data from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('tanarseged_history');
    if (savedHistory) setResults(JSON.parse(savedHistory));

    const savedTimetable = localStorage.getItem('tanarseged_timetable');
    if (savedTimetable) setTimetable(JSON.parse(savedTimetable));

    const savedClasses = localStorage.getItem('tanarseged_classes');
    if (savedClasses) setClassGroups(JSON.parse(savedClasses));

    const savedEvents = localStorage.getItem('tanarseged_events');
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    const savedProfile = localStorage.getItem('tanarseged_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  // Real-time Firestore subscription for classGroups
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserData('teacher_groups', (data) => {
      if (data) setClassGroups(data);
    });
    return () => unsub();
  }, [user]);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('tanarseged_history', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem('tanarseged_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('tanarseged_classes', JSON.stringify(classGroups));
  }, [classGroups]);

  useEffect(() => {
    localStorage.setItem('tanarseged_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('tanarseged_profile', JSON.stringify(profile));
  }, [profile]);

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">Betöltés...</div>;
  if (!user) return <Login />;

  const handleGenerate = async () => {
    const activeGrade = activeTab === ToolType.HOMEROOM_ASSISTANT && profile.homeroomClass 
      ? profile.homeroomClass 
      : grade;

    let finalTopic = topic;
    let finalAdditionalInfo = additionalInfo;

    if (activeTab === ToolType.HOMEROOM_ASSISTANT && selectedHomeroomTemplate) {
      if (selectedHomeroomTemplate === 'MEETING') {
        finalTopic = `Szülői értekezlet tervező - ${meetingTopics.join(', ')}`;
        finalAdditionalInfo = `Megadott napirendi pontok: ${meetingTopics.join(', ')}. Extra megjegyzések: ${additionalInfo || 'Nincs'}`;
      } else if (selectedHomeroomTemplate === 'COMMUNITY') {
        finalTopic = `Osztályközösség-építés és OFŐ óra: ${communityFocus}`;
        finalAdditionalInfo = `Fókuszterület: ${communityFocus}. Kiegészítő kontextus: ${additionalInfo || 'Nincs'}`;
      } else if (selectedHomeroomTemplate === 'CONFLICT') {
        finalTopic = `Pedagógiai Esetkezelő & Egyéni Akcióterv: ${conflictScenario}`;
        finalAdditionalInfo = `Probléma/Szituáció jellege: ${conflictScenario}. Eset leírása/Részletek: ${additionalInfo || 'Nincs'}`;
      } else if (selectedHomeroomTemplate === 'TRIP') {
        finalTopic = `Osztálykirándulás Tervező: ${tripDuration} napos ${tripFocus.toLowerCase()} program`;
        finalAdditionalInfo = `Időtartam: ${tripDuration} nap. Közlekedés: ${tripTransport}. Fókusz: ${tripFocus}. Célállomás/Részletek: ${additionalInfo || 'Nincs'}`;
      }
    } else if (activeTab === ToolType.HOMEROOM_ASSISTANT && !topic) {
      return;
    }

    if (!finalTopic && activeTab === ToolType.HOMEROOM_ASSISTANT && selectedHomeroomTemplate) {
      finalTopic = "Osztályfőnöki Anyag";
    }

    if (!finalTopic || !activeGrade) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: activeTab,
          topic: finalTopic,
          grade: activeGrade,
          additionalInfo: finalAdditionalInfo,
          sourceText,
          profile
        }),
      });

      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();

      const newContent: GeneratedContent = {
        id: crypto.randomUUID(),
        type: activeTab as ToolType,
        title: finalTopic,
        content: data.content,
        createdAt: Date.now()
      };

      setResults(prev => [newContent, ...prev]);
      setSelectedResult(newContent);
      setTopic('');
      setAdditionalInfo('');
      setSourceText('');
    } catch (error) {
      console.error(error);
      alert('Sajnáljuk, hiba történt a generálás során.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setSourceText(data.text);
    } catch (error) {
      console.error(error);
      alert('Hiba a fájl feldolgozása során.');
    } finally {
      setIsUploading(false);
    }
  };

  const isFullWidthTool = [
    ToolType.TIMETABLE, ToolType.EVENT_CALENDAR, ToolType.CURRICULUM_PLANNER,
    ToolType.SCANNER, ToolType.GRADE_CALCULATOR, ToolType.GROUPS,
    ToolType.LIST, ToolType.TIMER, ToolType.SPINWHEEL, ToolType.TEAMS,
    ToolType.ANALYTICS, ToolType.VOICE_ENTRY, ToolType.MANUAL_ENTRY, ToolType.PLUS_POINTS,
    ToolType.SYLLABUS_TRACKER
  ].includes(activeTab as ToolType) || activeTab === 'SETTINGS' || activeTab === 'DASHBOARD' || (activeTab === ToolType.METHODOLOGY_GUIDE && methodologyView === 'library') || (activeTab === ToolType.PSYCHOLOGY_ADVISOR && psychologyView === 'library');

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden relative">
      {/* Top Navigation Bar */}
      <nav className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 md:px-6 border-b border-slate-700 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 lg:hidden hover:bg-slate-800 rounded-md transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-slate-800 rounded-md transition-colors hidden lg:flex text-slate-300 hover:text-white items-center justify-center"
            title={isSidebarCollapsed ? "Oldalsáv kibontása" : "Oldalsáv összecsukása"}
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-lg hidden xs:flex">Σ</div>
          <h1 className="text-base md:text-lg font-semibold tracking-tight">TanárSegéd <span className="hidden sm:inline">AI</span> <span className="text-slate-400 font-normal ml-1 md:ml-2 text-[10px] md:text-sm italic hidden xs:inline">Oktatási Asszisztens</span></h1>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400 leading-none">Rendszeridő</p>
            <p className="text-sm font-medium">{new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
          <button 
            onClick={() => {
              setActiveTab('SETTINGS');
              setSelectedResult(null);
            }}
            className="h-8 w-8 md:h-10 md:w-10 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden hover:bg-slate-600 transition-all active:scale-95 group"
            title="Profil & Beállítások"
          >
            {profile.name ? (
              <span className="text-blue-400 font-bold text-base md:text-lg">{profile.name.charAt(0).toUpperCase()}</span>
            ) : (
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-blue-400 fill-current group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar (Responsive) */}
        <aside className={cn(
          "bg-white border-r border-slate-200 flex flex-col shrink-0 z-40 transition-all duration-300 overflow-y-auto overflow-x-hidden",
          "fixed inset-y-0 left-0 lg:static lg:translate-x-0",
          isSidebarCollapsed ? "w-64 lg:w-16" : "w-64 lg:w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className={cn("flex flex-col gap-1 pt-20 lg:pt-4 transition-all duration-300", isSidebarCollapsed ? "p-2" : "p-4")}>
            {!isSidebarCollapsed ? (
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Áttekintés</p>
            ) : (
              <hr className="my-2 border-slate-100" />
            )}
            <button
              onClick={() => {
                setActiveTab('DASHBOARD');
                setSelectedResult(null);
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Vezérlőpult" : undefined}
              className={cn(
                "w-full rounded-md flex items-center font-medium transition-all text-left",
                isSidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                activeTab === 'DASHBOARD' 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm">Vezérlőpult</span>}
            </button>

            {!isSidebarCollapsed ? (
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-6 mb-2 tracking-wider">Tervezés & Tartalom</p>
            ) : (
              <hr className="my-2 border-slate-100" />
            )}
            {[ToolType.LESSON_PLANNER, ToolType.EXERCISE_GENERATOR, ToolType.CONCEPT_EXPLAINER, ToolType.EXPERIMENT_GUIDE, ToolType.CURRICULUM_PLANNER].map((key) => (
              <button
                key={key}
                onClick={() => {
                   setActiveTab(key);
                   setSelectedResult(null);
                   setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? getToolTitle(key) : undefined}
                className={cn(
                  "w-full rounded-md flex items-center font-medium transition-all text-left",
                  isSidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                  activeTab === key 
                    ? "bg-blue-55 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="shrink-0">{getToolIcon(key)}</div>
                {!isSidebarCollapsed && <span className="text-sm">{getToolTitle(key)}</span>}
              </button>
            ))}

            {!isSidebarCollapsed ? (
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-4 mb-2 tracking-wider">Pedagógiai Támogatás</p>
            ) : (
              <hr className="my-2 border-slate-100" />
            )}
            {[ToolType.HOMEROOM_ASSISTANT, ToolType.METHODOLOGY_GUIDE, ToolType.PSYCHOLOGY_ADVISOR]
              .filter(key => key !== ToolType.HOMEROOM_ASSISTANT || profile.isHomeroomTeacher)
              .map((key) => (
              <button
                key={key}
                onClick={() => {
                   setActiveTab(key);
                   setSelectedResult(null);
                   setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? getToolTitle(key) : undefined}
                className={cn(
                  "w-full rounded-md flex items-center font-medium transition-all text-left",
                  isSidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                  activeTab === key 
                    ? "bg-rose-50 text-rose-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="shrink-0">{getToolIcon(key)}</div>
                {!isSidebarCollapsed && <span className="text-sm">{getToolTitle(key)}</span>}
              </button>
            ))}

            {!isSidebarCollapsed ? (
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-4 mb-2 tracking-wider">Szervezés & Adminisztráció</p>
            ) : (
              <hr className="my-2 border-slate-100" />
            )}
            {[ToolType.TIMETABLE, ToolType.GROUPS, ToolType.SYLLABUS_TRACKER, ToolType.LIST, ToolType.EVENT_CALENDAR]
              .filter(key => key !== ToolType.EVENT_CALENDAR || profile.isHomeroomTeacher)
              .map((key) => (
              <button
                key={key}
                onClick={() => {
                   setActiveTab(key);
                   setSelectedResult(null);
                   setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? getToolTitle(key) : undefined}
                className={cn(
                  "w-full rounded-md flex items-center font-medium transition-all text-left",
                  isSidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                  activeTab === key 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="shrink-0">{getToolIcon(key)}</div>
                {!isSidebarCollapsed && <span className="text-sm">{getToolTitle(key)}</span>}
              </button>
            ))}
            
            {!isSidebarCollapsed ? (
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-4 mb-2 tracking-wider">Értékelés & Rögzítés</p>
            ) : (
              <hr className="my-2 border-slate-100" />
            )}
            {[
              ToolType.SCANNER, ToolType.GRADE_CALCULATOR, ToolType.PLUS_POINTS, 
              ToolType.VOICE_ENTRY, ToolType.MANUAL_ENTRY, ToolType.ANALYTICS
            ].map((key) => (
              <button
                key={key}
                onClick={() => {
                   setActiveTab(key);
                   setSelectedResult(null);
                   setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? getToolTitle(key) : undefined}
                className={cn(
                  "w-full rounded-md flex items-center font-medium transition-all text-left",
                  isSidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                  activeTab === key 
                    ? "bg-amber-50 text-amber-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="shrink-0">{getToolIcon(key)}</div>
                {!isSidebarCollapsed && <span className="text-sm">{getToolTitle(key)}</span>}
              </button>
            ))}

            {!isSidebarCollapsed ? (
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-4 mb-2 tracking-wider">Órai Eszközök</p>
            ) : (
              <hr className="my-2 border-slate-100" />
            )}
            {[ToolType.TIMER, ToolType.SPINWHEEL, ToolType.TEAMS].map((key) => (
              <button
                key={key}
                onClick={() => {
                   setActiveTab(key);
                   setSelectedResult(null);
                   setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? getToolTitle(key) : undefined}
                className={cn(
                  "w-full rounded-md flex items-center font-medium transition-all text-left",
                  isSidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                  activeTab === key 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <div className="shrink-0">{getToolIcon(key)}</div>
                {!isSidebarCollapsed && <span className="text-sm">{getToolTitle(key)}</span>}
              </button>
            ))}
          </div>

          <div className={cn("mt-4 border-t border-slate-100 transition-all duration-300", isSidebarCollapsed ? "p-2" : "p-4")}>
            <button 
              onClick={() => {
                setSelectedResult(null);
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Előzmények" : undefined}
              className={cn(
                "w-full rounded-md flex items-center font-medium transition-all",
                isSidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                !selectedResult ? "bg-slate-100 text-slate-800" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <History className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm">Előzmények</span>}
            </button>
          </div>

          <div className={cn("mt-auto border-t border-slate-100 transition-all duration-300", isSidebarCollapsed ? "p-2" : "p-4")}>
            {!isSidebarCollapsed && (
              <div className="bg-slate-100 p-3 rounded-lg mb-4">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Gyors Műveletek</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <button className="bg-white border border-slate-200 p-2 rounded hover:shadow-sm">Export</button>
                  <button className="bg-white border border-slate-200 p-2 rounded hover:shadow-sm">Súgó</button>
                </div>
              </div>
            )}
            {!isSidebarCollapsed && (
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-4 mb-2 tracking-wider">Beállítások</p>
            )}
            <button
              onClick={() => {
                setActiveTab('SETTINGS');
                setSelectedResult(null);
                setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? "Profil & Beállítások" : undefined}
              className={cn(
                "w-full rounded-md flex items-center font-medium transition-all text-left",
                isSidebarCollapsed ? "justify-center p-2" : "px-3 py-2 gap-3",
                activeTab === 'SETTINGS' 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm">Profil & Beállítások</span>}
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-4 gap-2">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{getToolTitle(activeTab)}</h2>
                <p className="text-xs md:text-sm text-slate-500">Konfigurálja a paramétereket az AI generáláshoz.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold uppercase">Ready</span>
              </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
              {/* Methodology Toggle */}
              {activeTab === ToolType.METHODOLOGY_GUIDE && !selectedResult && (
                <div className="col-span-12 flex bg-white p-1 rounded-lg border border-slate-200 w-fit self-start">
                  <button 
                    onClick={() => setMethodologyView('library')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                      methodologyView === 'library' ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <Book className="w-4 h-4" />
                    Kereshető Gyűjtemény
                  </button>
                  <button 
                    onClick={() => setMethodologyView('generator')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                      methodologyView === 'generator' ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    AI Generátor
                  </button>
                </div>
              )}

              {/* Input Section */}
              {!isFullWidthTool && (
                <div className="col-span-12 lg:col-span-4 flex flex-col">
                  <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beviteli mezők</h3>
                      {activeTab === ToolType.HOMEROOM_ASSISTANT && profile.homeroomClass && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          Osztály: {profile.homeroomClass}
                        </span>
                      )}
                    </div>
                    
                    <div className="p-5 space-y-4 flex-1">
                      {activeTab === ToolType.HOMEROOM_ASSISTANT ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                              Intelligens Sablonok (Opcionális)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVal = selectedHomeroomTemplate === 'MEETING' ? null : 'MEETING';
                                  setSelectedHomeroomTemplate(nextVal);
                                  setTopic(nextVal ? 'Szülői Értekezlet' : '');
                                  setAdditionalInfo('');
                                }}
                                className={cn(
                                  "p-3 border rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer",
                                  selectedHomeroomTemplate === 'MEETING'
                                    ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm"
                                    : "border-slate-100 hover:border-slate-200 bg-slate-50/30 text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                <span className="text-xl">📅</span>
                                <span className="text-[10px] font-bold tracking-tight">Szülői Értekezlet</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVal = selectedHomeroomTemplate === 'COMMUNITY' ? null : 'COMMUNITY';
                                  setSelectedHomeroomTemplate(nextVal);
                                  setTopic(nextVal ? 'Közösségépítő Foglalkozás' : '');
                                  setAdditionalInfo('');
                                }}
                                className={cn(
                                  "p-3 border rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer",
                                  selectedHomeroomTemplate === 'COMMUNITY'
                                    ? "border-green-500 bg-green-50/50 text-green-700 shadow-sm"
                                    : "border-slate-100 hover:border-slate-200 bg-slate-50/30 text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                <span className="text-xl">🤝</span>
                                <span className="text-[10px] font-bold tracking-tight">Közösségépítés</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVal = selectedHomeroomTemplate === 'CONFLICT' ? null : 'CONFLICT';
                                  setSelectedHomeroomTemplate(nextVal);
                                  setTopic(nextVal ? 'Esetkezelés és Akcióterv' : '');
                                  setAdditionalInfo('');
                                }}
                                className={cn(
                                  "p-3 border rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer",
                                  selectedHomeroomTemplate === 'CONFLICT'
                                    ? "border-rose-500 bg-rose-50/50 text-rose-700 shadow-sm"
                                    : "border-slate-100 hover:border-slate-200 bg-slate-50/30 text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                <span className="text-xl">🛠️</span>
                                <span className="text-[10px] font-bold tracking-tight">Esetkezelő</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVal = selectedHomeroomTemplate === 'TRIP' ? null : 'TRIP';
                                  setSelectedHomeroomTemplate(nextVal);
                                  setTopic(nextVal ? 'Osztálykirándulás szervező' : '');
                                  setAdditionalInfo('');
                                }}
                                className={cn(
                                  "p-3 border rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer",
                                  selectedHomeroomTemplate === 'TRIP'
                                    ? "border-orange-500 bg-orange-50/50 text-orange-700 shadow-sm"
                                    : "border-slate-100 hover:border-slate-200 bg-slate-50/30 text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                <span className="text-xl">🎒</span>
                                <span className="text-[10px] font-bold tracking-tight">Kirándulás</span>
                              </button>
                            </div>
                          </div>

                          {/* Render template inputs */}
                          {selectedHomeroomTemplate === 'MEETING' && (
                            <div className="space-y-3 bg-blue-50/30 p-3 border border-blue-100 rounded-xl">
                              <label className="block text-[10px] font-bold uppercase tracking-tight text-blue-600">
                                Napirendi pontok
                              </label>
                              <div className="space-y-1.5">
                                {['Tanulmányi eredmények', 'Magaviselet és szorgalom', 'Közelgő programok', 'Osztálypénz / Pénzügyek', 'Egyebek'].map((topicOption) => (
                                  <label key={topicOption} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={meetingTopics.includes(topicOption)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setMeetingTopics([...meetingTopics, topicOption]);
                                        } else {
                                          setMeetingTopics(meetingTopics.filter(t => t !== topicOption));
                                        }
                                      }}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {topicOption}
                                  </label>
                                ))}
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase tracking-tight text-slate-400 mb-1">
                                  Kiegészítő részletek / Megjegyzés
                                </label>
                                <textarea
                                  rows={2}
                                  value={additionalInfo}
                                  onChange={(e) => setAdditionalInfo(e.target.value)}
                                  placeholder="pl: Megbeszéljük a kirándulás befizetéseit és határidejét..."
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {selectedHomeroomTemplate === 'COMMUNITY' && (
                            <div className="space-y-3 bg-green-50/30 p-3 border border-green-100 rounded-xl">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-tight text-green-600 mb-1.5">
                                  Foglalkozás fókuszterülete
                                </label>
                                <select
                                  value={communityFocus}
                                  onChange={(e) => setCommunityFocus(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                                >
                                  <option value="Csapatépítés és kohézió">Csapatépítés és kohézió</option>
                                  <option value="Érzékenyítés és empátia">Érzékenyítés és empátia</option>
                                  <option value="Pályaorientáció és jövőkép">Pályaorientáció és jövőkép</option>
                                  <option value="Konfliktuskezelés és kibékülés">Konfliktuskezelés és kibékülés</option>
                                  <option value="Digitális tudatosság és netikett">Digitális tudatosság és netikett</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase tracking-tight text-slate-400 mb-1">
                                  Különleges kérések / Részletek
                                </label>
                                <textarea
                                  rows={2}
                                  value={additionalInfo}
                                  onChange={(e) => setAdditionalInfo(e.target.value)}
                                  placeholder="pl: Új diák érkezett, ezt a beilleszkedést szeretném segíteni..."
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-300 resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {selectedHomeroomTemplate === 'CONFLICT' && (
                            <div className="space-y-3 bg-rose-50/30 p-3 border border-rose-100 rounded-xl">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-tight text-rose-600 mb-1.5">
                                  Probléma típusa
                                </label>
                                <select
                                  value={conflictScenario}
                                  onChange={(e) => setConflictScenario(e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-500 outline-none"
                                >
                                  <option value="Cyberbullying és online bántalmazás">Cyberbullying / Bántalmazás</option>
                                  <option value="SNI / BTMN tanuló integrációja">SNI / BTMN integráció</option>
                                  <option value="Órai bomlasztó viselkedés / Engedetlenség">Órai bomlasztó viselkedés</option>
                                  <option value="Hirtelen leromlott tanulmányi eredmény">Leromlott tanulmányi eredmény</option>
                                  <option value="Iskolai szorongás / Motiválatlanság">Iskolai szorongás / Apátia</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase tracking-tight text-slate-400 mb-1">
                                  Szituáció részletes leírása (Név nélkül)
                                </label>
                                <textarea
                                  rows={2.5}
                                  value={additionalInfo}
                                  onChange={(e) => setAdditionalInfo(e.target.value)}
                                  placeholder="Írd le a tüneteket vagy a probléma hátterét..."
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-300 resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {selectedHomeroomTemplate === 'TRIP' && (
                            <div className="space-y-3 bg-orange-50/30 p-3 border border-orange-100 rounded-xl">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] font-bold uppercase tracking-tight text-orange-600 mb-1">
                                    Időtartam
                                  </label>
                                  <select
                                    value={tripDuration}
                                    onChange={(e) => setTripDuration(Number(e.target.value))}
                                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                                  >
                                    {[1, 2, 3, 4, 5].map(d => (
                                      <option key={d} value={d}>{d} napos</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold uppercase tracking-tight text-orange-600 mb-1">
                                    Közlekedés
                                  </label>
                                  <select
                                    value={tripTransport}
                                    onChange={(e) => setTripTransport(e.target.value)}
                                    className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                                  >
                                    <option value="Busz">Busz</option>
                                    <option value="Vonat">Vonat</option>
                                    <option value="Gyalogos">Gyalogos</option>
                                    <option value="Kerékpár">Kerékpár</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase tracking-tight text-orange-600 mb-1">
                                  Program jellege
                                </label>
                                <select
                                  value={tripFocus}
                                  onChange={(e) => setTripFocus(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                                >
                                  <option value="Kulturális / Történelmi">Kulturális / Történelmi</option>
                                  <option value="Természetjárás / Túra">Természetjárás / Túra</option>
                                  <option value="Kaland / Sport">Kaland / Sport</option>
                                  <option value="Csapatépítés / Szórakozás">Csapatépítés / Szórakozás</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold uppercase tracking-tight text-slate-400 mb-1">
                                  Célállomás és részletek
                                </label>
                                <textarea
                                  rows={2}
                                  value={additionalInfo}
                                  onChange={(e) => setAdditionalInfo(e.target.value)}
                                  placeholder="pl: Eger és környéke, vadaspark, wellness..."
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-300 resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {/* Fallback to custom topic field if no template selected */}
                          {!selectedHomeroomTemplate && (
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-1.5">
                                Egyedi téma megnevezése (Manuális)
                              </label>
                              <textarea
                                rows={2.5}
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="pl: Szülői értekezlet vázlat a félévi eredményekről..."
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 resize-none"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-1.5">
                              {activeTab === ToolType.METHODOLOGY_GUIDE ? "Módszer vagy Oktatási Téma" :
                               activeTab === ToolType.PSYCHOLOGY_ADVISOR ? "Kérdés vagy Helyzet leírása" : 
                               activeTab === ToolType.LESSON_PLANNER ? "Óra témája" :
                               activeTab === ToolType.EXERCISE_GENERATOR ? "Feladatsor témája" :
                               activeTab === ToolType.CONCEPT_EXPLAINER ? "Elmagyarázandó fogalom" :
                               activeTab === ToolType.EXPERIMENT_GUIDE ? "Kísérlet címe" : "Téma / Tananyag"}
                            </label>
                            {activeTab === ToolType.PSYCHOLOGY_ADVISOR ? (
                              <textarea 
                                rows={2.5}
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="pl: Egy tanulóm hirtelen leromlott a jegyeiben, és magányosnak tűnik..."
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 resize-none"
                              />
                            ) : (
                              <input 
                                type="text" 
                                placeholder={
                                  activeTab === ToolType.LESSON_PLANNER ? "pl: Newton törvényei" : 
                                  activeTab === ToolType.EXERCISE_GENERATOR ? "pl: Másodfokú egyenletek" :
                                  activeTab === ToolType.METHODOLOGY_GUIDE ? "pl: Gamifikáció a matekórán" : 
                                  activeTab === ToolType.CONCEPT_EXPLAINER ? "pl: Elektromágneses indukció" :
                                  activeTab === ToolType.EXPERIMENT_GUIDE ? "pl: Szabadesés vizsgálata" : "pl: Tananyag megnevezése"
                                }
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                              />
                            )}
                        </div>
                      )}

                        {!(activeTab === ToolType.HOMEROOM_ASSISTANT && profile.homeroomClass) && (
                          <div className="relative">
                            <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-1.5">
                              {activeTab === ToolType.PSYCHOLOGY_ADVISOR ? "Célcsoport / Érintett korosztály" : "Évfolyam / Osztály"}
                            </label>
                            
                            {activeTab === ToolType.HOMEROOM_ASSISTANT ? (
                              // profile.homeroomClass is not set here due to the outer check, so show warning and manual input
                              <div className="space-y-2">
                                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-normal">
                                  ⚠️ Nincs megadva osztályfőnöki osztály a <strong>Beállításokban ⚙️</strong>. Gépeld be alább, vagy állítsd be a Profilodban az automata kitöltéshez.
                                </div>
                                <input 
                                  type="text"
                                  value={grade}
                                  onChange={(e) => setGrade(e.target.value)}
                                  placeholder="pl: 9.A"
                                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="relative">
                                  <input 
                                    type="text"
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    onFocus={() => setIsGradeDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setIsGradeDropdownOpen(false), 250)}
                                    placeholder={
                                      activeTab === ToolType.PSYCHOLOGY_ADVISOR 
                                        ? "pl: 14-16 évesek, 9. osztály" 
                                        : "Válassz vagy gépelj be osztályt..."
                                    }
                                    className="w-full px-3 py-2 pr-10 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
                                  />
                                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                
                                {isGradeDropdownOpen && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {/* Own Groups */}
                                    {classGroups.length > 0 && (
                                      <div>
                                        <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 bg-slate-50 uppercase tracking-widest border-b border-slate-100">
                                          Saját Csoportjaid
                                        </div>
                                        {classGroups.map((g) => (
                                          <button
                                            key={g.id || g.name}
                                            type="button"
                                            onClick={() => {
                                              setGrade(g.name);
                                              setIsGradeDropdownOpen(false);
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-xs hover:bg-blue-50 transition-colors flex items-center justify-between border-b border-slate-100 last:border-b-0"
                                          >
                                            <span className="font-semibold text-slate-800">{g.name}</span>
                                            <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono uppercase">{g.subject || 'Csoport'}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Standard Grades */}
                                    <div>
                                      <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 bg-slate-50 uppercase tracking-widest border-b border-slate-100 border-t">
                                        Standard Évfolyamok
                                      </div>
                                      {[
                                        "5. osztály", "6. osztály", "7. osztály", "8. osztály",
                                        "9. osztály", "10. osztály", "11. osztály", "12. osztály",
                                        "Középiskola / Gimnázium", "Egyetemi / Felsőoktatás"
                                      ].map((stdGrade) => (
                                        <button
                                          key={stdGrade}
                                          type="button"
                                          onClick={() => {
                                            setGrade(stdGrade);
                                            setIsGradeDropdownOpen(false);
                                          }}
                                          className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 transition-colors text-slate-700 border-b border-slate-100 last:border-b-0"
                                        >
                                          {stdGrade}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Hide redundant additionalInfo text area for homeroom templates since they have their own specific details fields */}
                        {!(activeTab === ToolType.HOMEROOM_ASSISTANT && selectedHomeroomTemplate !== null) && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-1.5">Kiegészítő információk</label>
                            <textarea 
                              rows={3}
                              placeholder={
                                activeTab === ToolType.CURRICULUM_PLANNER ? "Heti óraszám, kiemelt témák..." : 
                                activeTab === ToolType.EXERCISE_GENERATOR ? "Nehézségi szint, feladatok száma..." :
                                activeTab === ToolType.PSYCHOLOGY_ADVISOR ? "Milyen korábbi megoldásokkal próbálkozott?" : "Egyéb megjegyzések, kritériumok..."
                              }
                              value={additionalInfo}
                              onChange={(e) => setAdditionalInfo(e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none placeholder:text-slate-300"
                            />
                          </div>
                        )}

                      <div className="pt-2">
                        {activeTab === ToolType.HOMEROOM_ASSISTANT && selectedHomeroomTemplate ? (
                          // Compact inline uploader version to save space when a template is active
                          <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Saját forrásanyag (PDF/TXT)</span>
                            <div className="relative">
                              <input 
                                type="file" 
                                id="rag-upload"
                                accept=".pdf,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <label 
                                htmlFor="rag-upload"
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer transition-all",
                                  sourceText 
                                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50" 
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                {isUploading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                                ) : (
                                  <>
                                    <Upload className={cn("w-3.5 h-3.5", sourceText ? "text-green-600" : "text-slate-400")} />
                                    <span>{sourceText ? "Feltöltve" : "Csatolás"}</span>
                                  </>
                                )}
                              </label>
                              {sourceText && (
                                <button 
                                  onClick={() => setSourceText('')}
                                  className="absolute -top-1.5 -right-1.5 bg-white border border-slate-200 rounded-full p-0.5 text-slate-400 hover:text-red-500"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Standard drag-and-drop sized dashboard uploader
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-2">Saját forrásanyag (PDF/TXT)</label>
                            <div className="relative">
                              <input 
                                type="file" 
                                id="rag-upload"
                                accept=".pdf,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <label 
                                htmlFor="rag-upload"
                                className={cn(
                                  "flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-all",
                                  sourceText ? "border-green-300 bg-green-50" : ""
                                )}
                              >
                                {isUploading ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                ) : (
                                  <>
                                    <Upload className={cn("w-4 h-4", sourceText ? "text-green-600" : "text-slate-400")} />
                                    <span className={cn("text-xs font-medium", sourceText ? "text-green-700" : "text-slate-500")}>
                                      {sourceText ? "Fájl feltöltve" : "Kérelemhez csatolás"}
                                    </span>
                                  </>
                                )}
                              </label>
                              {sourceText && (
                                <button 
                                  onClick={() => setSourceText('')}
                                  className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-0.5 text-slate-400 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>


                    <div className="p-5 bg-slate-50 border-t border-slate-100">
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic || !(activeTab === ToolType.HOMEROOM_ASSISTANT && profile.homeroomClass ? profile.homeroomClass : grade)}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-md flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-semibold text-sm active:scale-[0.98]"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Generálás Indítása</span>
                          </>
                        )}
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {/* Output Section */}
              <div className={cn(
                "col-span-12 flex flex-col gap-6",
                isFullWidthTool ? "lg:col-span-12" : "lg:col-span-8"
              )}>
                <AnimatePresence mode="wait">
                  {activeTab === 'DASHBOARD' ? (
                    <motion.div key="db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Dashboard 
                        profile={profile} 
                        historyCount={history.length} 
                        eventsCount={events.length}
                        onNavigate={(tab) => {
                          setActiveTab(tab);
                          setSelectedResult(null);
                        }}
                      />
                    </motion.div>
                  ) : activeTab === 'SETTINGS' ? (
                    <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <SettingsModule profile={profile} setProfile={setProfile} resultsCount={results.length} />
                    </motion.div>
                  ) : activeTab === ToolType.TIMETABLE ? (
                    <motion.div key="tt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Timetable />
                    </motion.div>
                  ) : activeTab === ToolType.CURRICULUM_PLANNER ? (
                    <motion.div key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <CurriculumPlanner />
                    </motion.div>
                  ) : (activeTab === ToolType.PSYCHOLOGY_ADVISOR && psychologyView === 'library' && !selectedResult) ? (
                    <motion.div key="psylib" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <PsychologyLibrary onSelectItem={(item) => {
                        setSelectedResult({
                          id: item.id,
                          type: ToolType.PSYCHOLOGY_ADVISOR,
                          title: item.title,
                          content: item.content,
                          createdAt: Date.now()
                        });
                      }} />
                    </motion.div>
                  ) : activeTab === ToolType.EVENT_CALENDAR ? (
                    <motion.div key="ec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <EventCalendarModule events={events} setEvents={setEvents} />
                    </motion.div>
                  ) : (activeTab === ToolType.METHODOLOGY_GUIDE && methodologyView === 'library' && !selectedResult) ? (
                    <motion.div key="ml" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <MethodologyLibrary 
                        onSelect={(item) => {
                          setSelectedResult({
                            id: item.id,
                            type: ToolType.METHODOLOGY_GUIDE,
                            title: item.title,
                            content: item.content,
                            createdAt: Date.now(),
                            isFavorite: false
                          });
                        }} 
                      />
                    </motion.div>
                  ) : activeTab === ToolType.SCANNER ? (
                    <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Scanner />
                    </motion.div>
                  ) : activeTab === ToolType.GRADE_CALCULATOR ? (
                    <motion.div key="grade_calc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <GradeCalculator />
                    </motion.div>
                  ) : activeTab === ToolType.GROUPS ? (
                    <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Groups />
                    </motion.div>
                  ) : activeTab === ToolType.LIST ? (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <List />
                    </motion.div>
                  ) : activeTab === ToolType.TIMER ? (
                    <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Timer />
                    </motion.div>
                  ) : activeTab === ToolType.SPINWHEEL ? (
                    <motion.div key="spinwheel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full min-h-[500px]">
                      <SpinWheel />
                    </motion.div>
                  ) : activeTab === ToolType.TEAMS ? (
                    <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <TeamGenerator />
                    </motion.div>
                  ) : activeTab === ToolType.ANALYTICS ? (
                    <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Analytics />
                    </motion.div>
                  ) : activeTab === ToolType.VOICE_ENTRY ? (
                    <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <VoiceEntry />
                    </motion.div>
                  ) : activeTab === ToolType.MANUAL_ENTRY ? (
                    <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <ManualEntry />
                    </motion.div>
                  ) : activeTab === ToolType.PLUS_POINTS ? (
                    <motion.div key="pluspoints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <PlusPoints profile={profile} />
                    </motion.div>
                  ) : activeTab === ToolType.SYLLABUS_TRACKER ? (
                    <motion.div key="syllabustracker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <SyllabusTracker />
                    </motion.div>
                  ) : selectedResult ? (
                    <ResultDisplay 
                      result={selectedResult}
                      onBack={() => {
                        setSelectedResult(null);
                        setIsFullscreen(false);
                      }}
                      onFullscreen={() => setIsFullscreen(!isFullscreen)}
                      isFullscreen={isFullscreen}
                      results={results}
                      setResults={setResults}
                      getToolTitle={getToolTitle}
                      exportToWord={exportToWord}
                    />
                  ) : (
                    <motion.div
                      key="history-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-3"
                    >
                      {results.length === 0 ? (
                        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 md:p-12 flex flex-col items-center justify-center text-center">
                           <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4 text-slate-400">
                              <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
                           </div>
                           <h3 className="text-sm font-bold text-slate-700">Még nincs előzmény</h3>
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Indítson el egy generálást a bal oldali mezők kitöltésével.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
                          <table className="w-full text-left text-xs md:text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] md:text-[10px] font-bold border-b border-slate-200">
                                <th className="px-3 md:px-5 py-3 w-8"></th>
                                <th className="px-3 md:px-5 py-3">Időpont</th>
                                <th className="px-3 md:px-5 py-3 hidden sm:table-cell">Eszköz</th>
                                <th className="px-3 md:px-5 py-3">Téma</th>
                                <th className="px-3 md:px-5 py-3"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {results.map((res) => (
                                <tr 
                                  key={res.id} 
                                  onClick={() => setSelectedResult(res)}
                                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                >
                                  <td className="px-3 md:px-5 py-3">
                                    {res.isFavorite && <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                  </td>
                                  <td className="px-3 md:px-5 py-3 font-mono text-[10px] text-slate-400 italic whitespace-nowrap">
                                    {new Date(res.createdAt).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-3 md:px-5 py-3 hidden sm:table-cell">
                                    <span className="text-[9px] font-bold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded uppercase">{getToolTitle(res.type)}</span>
                                  </td>
                                  <td className="px-3 md:px-5 py-3 font-semibold text-slate-700 truncate max-w-[120px] md:max-w-none">{res.title}</td>
                                  <td className="px-3 md:px-5 py-3 text-right flex items-center justify-end gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setResults(prev => prev.filter(r => r.id !== res.id));
                                      }}
                                      className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                      title="Törlés"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer Bar */}
      <footer className="h-auto py-2 sm:h-8 bg-slate-100 border-t border-slate-200 px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between text-[9px] md:text-[10px] text-slate-500 font-medium shrink-0 gap-2 sm:gap-0">
        <div className="flex gap-3 md:gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-green-500" /> Kapcsolat Aktív
          </span>
          <span className="hidden xs:inline">Tárolás: LocalStorage</span>
        </div>
        <div className="flex gap-4 uppercase tracking-widest">
          <span>Ver. 1.0.1</span>
          <span className="text-slate-400 hidden xs:inline">|</span>
          <span className="text-slate-400 hidden xs:inline">TanárSegéd Assistant</span>
        </div>
      </footer>
    </div>
  );
}
