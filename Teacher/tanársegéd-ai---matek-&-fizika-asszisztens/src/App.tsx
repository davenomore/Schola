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
  ChevronRight,
  ClipboardCheck,
  Zap,
  Atom,
  Pi,
  Menu,
  X,
  FileText,
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
  Coffee
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { cn } from './lib/utils';
import { ToolType, GenerationRequest, GeneratedContent, MethodologyItem, UserProfile, PsychologyLibraryItem } from './types.ts';
import { METHODOLOGY_LIBRARY, PSYCHOLOGY_LIBRARY } from './constants.ts';

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
    case ToolType.CLASS_MANAGER: return 'Csoportkezelő';
    case ToolType.TIMETABLE: return 'Órarend';
    case ToolType.EVENT_CALENDAR: return 'Eseménynaptár';
    case ToolType.HOMEROOM_ASSISTANT: return 'Osztályfőnöki';
    case ToolType.METHODOLOGY_GUIDE: return 'Módszertani Gyűjtemény';
    case ToolType.PSYCHOLOGY_ADVISOR: return 'Pszichológiai Tanácsadó';
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
    case ToolType.CLASS_MANAGER: return <Users className="w-4 h-4" />;
    case ToolType.TIMETABLE: return <Table className="w-4 h-4" />;
    case ToolType.EVENT_CALENDAR: return <Calendar className="w-4 h-4" />;
    case ToolType.HOMEROOM_ASSISTANT: return <ShieldCheck className="w-4 h-4" />;
    case ToolType.METHODOLOGY_GUIDE: return <Brain className="w-4 h-4" />;
    case ToolType.PSYCHOLOGY_ADVISOR: return <Heart className="w-4 h-4" />;
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
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Üdvözöljük újra, {profile.name || 'Kolléga'}! 👋</h2>
          <p className="text-slate-500">Íme egy gyors áttekintés a mai napra és eszközeire.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WellbeingWidget profile={profile} eventsCount={eventsCount} />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Gyors Műveletek
          </h3>
          <div className="space-y-2">
            <button 
              onClick={() => onNavigate(ToolType.LESSON_PLANNER)}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white text-slate-500 group-hover:text-blue-600 transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Új óraterv készítése</span>
            </button>
            <button 
              onClick={() => onNavigate(ToolType.EXERCISE_GENERATOR)}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center gap-3 group"
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white text-slate-500 group-hover:text-blue-600 transition-colors">
                <Pi className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Feladatsor generálása</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Clock className="text-blue-500" />, label: 'Utolsó generálás', val: '2 órája' },
          { icon: <ShieldCheck className="text-emerald-500" />, label: 'Adminisztráció', val: 'Kész' },
          { icon: <Brain className="text-purple-500" />, label: 'Módszertan', val: '4 új tipp' },
          { icon: <Users className="text-rose-500" />, label: 'Tanulói visszajelzés', val: 'Pozitív' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-lg">
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">{stat.label}</p>
              <p className="text-sm font-bold text-slate-700">{stat.val}</p>
            </div>
          </div>
        ))}
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

const SettingsModule = ({ profile, setProfile }: { profile: UserProfile, setProfile: (p: UserProfile) => void }) => {
  const [subjects, setSubjects] = useState(profile.subjects.join(', '));
  
  const save = () => {
    setProfile({
      ...profile,
      subjects: subjects.split(',').map(s => s.trim()).filter(s => s !== '')
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            Személyes Profil Beállítások
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tanár Neve</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Iskola neve (opcionális)</label>
              <input 
                type="text" 
                value={profile.schoolName || ''}
                onChange={(e) => setProfile({ ...profile, schoolName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tanított tantárgyak (vesszővel elválasztva)</label>
            <input 
              type="text" 
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              onBlur={save}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="pl: Matematika, Fizika, Informatika"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Osztályfőnöki modul</h4>
              <p className="text-xs text-slate-500">Kapcsolja be, ha osztályfőnöki feladatokat is ellát.</p>
            </div>
            <button 
              onClick={() => setProfile({ ...profile, isHomeroomTeacher: !profile.isHomeroomTeacher })}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                profile.isHomeroomTeacher ? "bg-blue-600" : "bg-slate-200"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                profile.isHomeroomTeacher ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
        <h4 className="text-sm font-bold text-blue-800 mb-2">Hogyan segít a profil?</h4>
        <ul className="text-xs text-blue-700 space-y-2 list-disc list-inside">
          <li>Az AI generátor figyelembe veszi a tanított tárgyaidat a válaszoknál.</li>
          <li>A felület elrejti a számodra nem releváns eszközöket.</li>
          <li>A generált anyagok fejlécébe bekerülhet a neved és az iskolád.</li>
        </ul>
      </section>
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

const TimetableModule = ({ timetable, setTimetable }: { timetable: any[], setTimetable: any }) => {
  const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];
  const slots = Array.from({ length: 8 }, (_, i) => i + 1);

  const updateSlot = (day: string, slot: number, value: string) => {
    const newTimetable = [...timetable];
    const index = newTimetable.findIndex(t => t.day === day && t.slot === slot);
    if (index > -1) {
      newTimetable[index].value = value;
    } else {
      newTimetable.push({ day, slot, value });
    }
    setTimetable(newTimetable);
  };

  const getSlotValue = (day: string, slot: number) => {
    return timetable.find(t => t.day === day && t.slot === slot)?.value || '';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-3 border border-slate-700 text-xs uppercase font-bold w-12 sticky left-0 bg-slate-900 z-10">Óra</th>
              {days.map(day => (
                <th key={day} className="p-3 border border-slate-700 text-xs uppercase font-bold min-w-[120px]">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => (
              <tr key={slot} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 border border-slate-200 text-center font-bold text-slate-500 bg-slate-50 sticky left-0 z-10">{slot}.</td>
                {days.map(day => (
                  <td key={day} className="p-1 border border-slate-200">
                    <input 
                      type="text"
                      className="w-full px-2 py-2 text-xs border-none focus:ring-1 focus:ring-blue-500 rounded bg-transparent outline-none"
                      placeholder="Tárgy/Osztály"
                      value={getSlotValue(day, slot)}
                      onChange={(e) => updateSlot(day, slot, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <p className="text-[10px] text-slate-400 italic">Az adatok mentése automatikus a böngészőben.</p>
        <button 
          onClick={() => setTimetable([])}
          className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase"
        >
          Órarend törlése
        </button>
      </div>
    </div>
  );
};

const ClassManagerModule = ({ classGroups, setClassGroups, sourceText }: { classGroups: any[], setClassGroups: any, sourceText: string }) => {
  const [newClassName, setNewClassName] = useState('');
  const [students, setStudents] = useState('');
  const [seatingPlans, setSeatingPlans] = useState<Record<string, string[][]>>({});

  const addClass = () => {
    if (!newClassName) return;
    const newClass = {
      id: crypto.randomUUID(),
      name: newClassName,
      students: students.split('\n').filter(s => s.trim() !== ''),
      createdAt: Date.now()
    };
    setClassGroups([newClass, ...classGroups]);
    setNewClassName('');
    setStudents('');
  };

  const generateSeatingPlan = (classId: string, studentList: string[]) => {
    const shuffled = [...studentList].sort(() => Math.random() - 0.5);
    const rows: string[][] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      rows.push([shuffled[i], shuffled[i+1] || 'Üres']);
    }
    setSeatingPlans({ ...seatingPlans, [classId]: rows });
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Új Osztály/Csoport</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Megnevezés</label>
              <input 
                type="text"
                placeholder="pl. 10.A Matematika"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-sans">Tanulók listája (Soronként egy név)</label>
              <textarea 
                rows={6}
                placeholder="Nagy Anna&#10;Kovács Béla..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none font-sans"
                value={students}
                onChange={(e) => setStudents(e.target.value)}
              />
            </div>
            <button 
              onClick={addClass}
              className="w-full py-2 bg-slate-900 text-white rounded text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Osztály Hozzáadása
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
        {classGroups.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center opacity-60">
            <Users className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-500">Még nincs rögzített osztályod.</p>
          </div>
        ) : (
          classGroups.map(cls => (
            <div key={cls.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-800">{cls.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono uppercase">{cls.students.length} tanuló</p>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => generateSeatingPlan(cls.id, cls.students)}
                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    title="Ülésrend generálása"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setClassGroups(classGroups.filter(c => c.id !== cls.id))}
                    className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {seatingPlans[cls.id] ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generált Ülésrend (Kettes padok)</p>
                    <button 
                      onClick={() => {
                        const newPlans = { ...seatingPlans };
                        delete newPlans[cls.id];
                        setSeatingPlans(newPlans);
                      }}
                      className="text-[10px] text-red-500 font-bold hover:underline"
                    >
                      Bezárás
                    </button>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {seatingPlans[cls.id].map((pair, idx) => (
                      <div key={idx} className="border border-slate-100 bg-slate-50 rounded p-2 flex flex-col gap-1">
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{idx + 1}. pad</div>
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium text-slate-700">{pair[0]}</span>
                          <span className="text-slate-400">|</span>
                          <span className="font-medium text-slate-700">{pair[1]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cls.students.map((student: string, i: number) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                      {student}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [methodologyView, setMethodologyView] = useState<'generator' | 'library'>('library');
  const [psychologyView, setPsychologyView] = useState<'generator' | 'library'>('library');
  const [activeTab, setActiveTab] = useState<ToolType | 'SETTINGS' | 'DASHBOARD'>( 'DASHBOARD');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    subjects: ['Matematika', 'Fizika'],
    isHomeroomTeacher: true
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedContent[]>([]);
  const [selectedResult, setSelectedResult] = useState<GeneratedContent | null>(null);

  // New states for organizational modules
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classGroups, setClassGroups] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

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

  const handleGenerate = async () => {
    if (!topic || !grade) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: activeTab,
          topic,
          grade,
          additionalInfo,
          sourceText,
          profile
        }),
      });

      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();

      const newContent: GeneratedContent = {
        id: crypto.randomUUID(),
        type: activeTab as ToolType,
        title: topic,
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
          "bg-white border-r border-slate-200 flex flex-col shrink-0 z-40 transition-transform duration-300 overflow-y-auto",
          "fixed inset-y-0 left-0 w-64 lg:static lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-4 flex flex-col gap-1 pt-20 lg:pt-4">
            <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Áttekintés</p>
            <button
              onClick={() => {
                setActiveTab('DASHBOARD');
                setSelectedResult(null);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 rounded-md flex items-center gap-3 font-medium transition-all text-left",
                activeTab === 'DASHBOARD' 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm">Vezérlőpult</span>
            </button>

            <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-6 mb-2 tracking-wider">Tervezés & Tartalom</p>
            {[ToolType.LESSON_PLANNER, ToolType.EXERCISE_GENERATOR, ToolType.CONCEPT_EXPLAINER, ToolType.EXPERIMENT_GUIDE, ToolType.CURRICULUM_PLANNER].map((key) => (
              <button
                key={key}
                onClick={() => {
                   setActiveTab(key);
                   setSelectedResult(null);
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-md flex items-center gap-3 font-medium transition-all text-left",
                  activeTab === key 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {getToolIcon(key)}
                <span className="text-sm">{getToolTitle(key)}</span>
              </button>
            ))}

            <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-4 mb-2 tracking-wider">Pedagógiai Támogatás</p>
            {[ToolType.HOMEROOM_ASSISTANT, ToolType.METHODOLOGY_GUIDE, ToolType.PSYCHOLOGY_ADVISOR]
              .filter(key => key !== ToolType.HOMEROOM_ASSISTANT || profile.isHomeroomTeacher)
              .map((key) => (
              <button
                key={key}
                onClick={() => {
                   setActiveTab(key);
                   setSelectedResult(null);
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-md flex items-center gap-3 font-medium transition-all text-left",
                  activeTab === key 
                    ? "bg-rose-50 text-rose-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {getToolIcon(key)}
                <span className="text-sm">{getToolTitle(key)}</span>
              </button>
            ))}

            <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-4 mb-2 tracking-wider">Szervezés</p>
            {[ToolType.TIMETABLE, ToolType.CLASS_MANAGER, ToolType.EVENT_CALENDAR]
              .filter(key => key !== ToolType.EVENT_CALENDAR || profile.isHomeroomTeacher)
              .map((key) => (
              <button
                key={key}
                onClick={() => {
                   setActiveTab(key);
                   setSelectedResult(null);
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-md flex items-center gap-3 font-medium transition-all text-left",
                  activeTab === key 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {getToolIcon(key)}
                <span className="text-sm">{getToolTitle(key)}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 p-4 border-t border-slate-100">
            <button 
              onClick={() => {
                setSelectedResult(null);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 rounded-md flex items-center gap-3 font-medium transition-all",
                !selectedResult ? "bg-slate-100 text-slate-800" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <History className="w-4 h-4" />
              <span className="text-sm">Előzmények</span>
            </button>
          </div>

          <div className="mt-auto p-4 border-t border-slate-100">
            <div className="bg-slate-100 p-3 rounded-lg">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Gyors Műveletek</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <button className="bg-white border border-slate-200 p-2 rounded hover:shadow-sm">Export</button>
                <button className="bg-white border border-slate-200 p-2 rounded hover:shadow-sm">Súgó</button>
              </div>
            </div>
            <p className="px-3 text-[10px] uppercase font-bold text-slate-400 mt-4 mb-2 tracking-wider">Beállítások</p>
            <button
              onClick={() => {
                setActiveTab('SETTINGS');
                setSelectedResult(null);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 rounded-md flex items-center gap-3 font-medium transition-all text-left",
                activeTab === 'SETTINGS' 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Profil & Beállítások</span>
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
              {!(activeTab === ToolType.TIMETABLE || activeTab === ToolType.CLASS_MANAGER || activeTab === ToolType.EVENT_CALENDAR || activeTab === 'SETTINGS' || activeTab === 'DASHBOARD' || (activeTab === ToolType.METHODOLOGY_GUIDE && methodologyView === 'library') || (activeTab === ToolType.PSYCHOLOGY_ADVISOR && psychologyView === 'library')) && (
                <div className="col-span-12 lg:col-span-4 flex flex-col">
                  <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beviteli mezők</h3>
                    </div>
                    
                    <div className="p-5 space-y-4 flex-1">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-1.5">
                            {activeTab === ToolType.HOMEROOM_ASSISTANT ? "Esemény vagy Feladat megnevezése" : 
                             activeTab === ToolType.METHODOLOGY_GUIDE ? "Módszer vagy Oktatási Téma" :
                             activeTab === ToolType.PSYCHOLOGY_ADVISOR ? "Kérdés vagy Helyzet leírása" : 
                             activeTab === ToolType.LESSON_PLANNER ? "Óra témája" :
                             activeTab === ToolType.EXERCISE_GENERATOR ? "Feladatsor témája" :
                             activeTab === ToolType.CONCEPT_EXPLAINER ? "Elmagyarázandó fogalom" :
                             activeTab === ToolType.EXPERIMENT_GUIDE ? "Kísérlet címe" : "Téma / Tananyag"}
                          </label>
                          {activeTab === ToolType.PSYCHOLOGY_ADVISOR || activeTab === ToolType.HOMEROOM_ASSISTANT ? (
                            <textarea 
                              rows={2}
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                              placeholder={
                                activeTab === ToolType.HOMEROOM_ASSISTANT ? "pl: Szülői értekezlet vázlat a félévi eredményekről..." : 
                                "pl: Egy tanulóm hirtelen leromlott a jegyeiben, és magányosnak tűnik az órákon..."
                              }
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

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-tight text-slate-400 mb-1.5">
                            {activeTab === ToolType.PSYCHOLOGY_ADVISOR ? "Célcsoport / Érintett korosztály" : "Évfolyam / Osztály"}
                          </label>
                          <select 
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          >
                          <option value="">Válasszon...</option>
                          <option value="5-6. osztály">5-6. Általános</option>
                          <option value="7-8. osztály">7-8. Általános</option>
                          <option value="9-10. osztály">9-10. Középiskola</option>
                          <option value="11-12. osztály">11-12. Érettségi</option>
                          <option value="Emelt szint">Liceum / Emelt szint</option>
                        </select>
                      </div>

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

                      <div className="pt-2">
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
                    </div>


                    <div className="p-5 bg-slate-50 border-t border-slate-100">
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic || !grade}
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
                (activeTab === ToolType.TIMETABLE || activeTab === ToolType.CLASS_MANAGER || activeTab === ToolType.EVENT_CALENDAR || activeTab === 'SETTINGS' || activeTab === 'DASHBOARD' || (activeTab === ToolType.METHODOLOGY_GUIDE && methodologyView === 'library') || (activeTab === ToolType.PSYCHOLOGY_ADVISOR && psychologyView === 'library')) ? "lg:col-span-12" : "lg:col-span-8"
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
                      <SettingsModule profile={profile} setProfile={setProfile} />
                    </motion.div>
                  ) : activeTab === ToolType.TIMETABLE ? (
                    <motion.div key="tt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <TimetableModule timetable={timetable} setTimetable={setTimetable} />
                    </motion.div>
                  ) : (activeTab === ToolType.PSYCHOLOGY_ADVISOR && psychologyView === 'library') ? (
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
                  ) : activeTab === ToolType.CLASS_MANAGER ? (
                    <motion.div key="cm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <ClassManagerModule classGroups={classGroups} setClassGroups={setClassGroups} sourceText={sourceText} />
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
                
                {/* Visual Stats Section - Dense Pattern */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-indigo-900 text-white rounded-xl p-4 shadow-lg relative overflow-hidden flex flex-col justify-between h-28 sm:h-32">
                    <h3 className="text-[9px] md:text-[10px] font-bold text-indigo-300 uppercase tracking-widest relative z-10">AI Tevékenység</h3>
                    <div className="flex items-end gap-2 relative z-10">
                      <span className="text-3xl font-light">{results.length}</span>
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
