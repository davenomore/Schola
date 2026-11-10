import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, Download, Loader2, Send, GripVertical, Book, Database, Check } from 'lucide-react';
import { CurriculumRow } from '../types';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CurriculumPlanner() {
  const [activeTab, setActiveTab] = useState<'generator' | 'nat_search'>('generator');

  // Form states for Generator
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('2');
  const [totalWeeks, setTotalWeeks] = useState('36');
  const [extraInfo, setExtraInfo] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [curriculum, setCurriculum] = useState<CurriculumRow[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  // NAT Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [natResponse, setNatResponse] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCurriculum([]);
    try {
      const topic = subject;
      const info = `Heti óraszám: ${weeklyHours}, Éves hetek száma: ${totalWeeks}. Extra info: ${extraInfo}`;
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'CURRICULUM_PLANNER',
          topic,
          grade,
          additionalInfo: info,
          profileContext: '',
          sourceText: ''
        })
      });
      const data = await response.json();
      if (data.content) {
        let jsonStr = data.content;
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```\n?$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```\n?/, '').replace(/```\n?$/, '');
        }
        
        try {
            const parsed = JSON.parse(jsonStr);
            setCurriculum(parsed);
        } catch(e) {
            console.error("JSON parse error:", e);
            alert("A rendszer nem tudta JSON formátumba rendezni a kimenetet. Próbáld újra!");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Hiba a hálózati kommunikációban.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNatSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'NAT_ASSISTANT',
          topic: searchQuery,
          grade: searchGrade || 'Minden évfolyam',
          additionalInfo: '',
          profileContext: ''
        })
      });
      const data = await response.json();
      setNatResponse(data.content);
    } catch (e) {
      console.error(e);
      alert("Hiba történt a NAT keresés során.");
    } finally {
      setIsSearching(false);
    }
  };

  const exportToCSV = () => {
    if (!curriculum.length) return;
    const headers = ['Hét', 'Témakör', 'Kulcsfogalmak', 'Óraszám', 'Módszertan'];
    const csvContent = [
      headers.join(';'),
      ...curriculum.map(row => 
        [
          row.week, 
          `"${(row.topic || '').replace(/"/g, '""')}"`, 
          `"${(row.concepts || '').replace(/"/g, '""')}"`, 
          row.hours, 
          `"${(row.methods || '').replace(/"/g, '""')}"`
        ].join(';')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tanmenet_${subject || 'targy'}_${grade || 'evf'}.csv`);
    link.click();
  };

  const totalAllocatedHours = curriculum.reduce((sum, row) => sum + (Number(row.hours) || 0), 0);
  const targetHours = Number(weeklyHours) * Number(totalWeeks);

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex p-1 bg-slate-200 rounded-lg w-fit">
        <button 
          onClick={() => setActiveTab('generator')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'generator' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileText className="w-4 h-4" />
          Tanmenet Generáló
        </button>
        <button 
          onClick={() => setActiveTab('nat_search')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'nat_search' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Database className="w-4 h-4" />
          NAT 2020 Böngésző
        </button>
      </div>

      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 self-start">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tantárgy</label>
              <input 
                type="text" placeholder="pl. Matematika" value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Évfolyam</label>
              <input 
                type="text" placeholder="pl. 9. évfolyam" value={grade} onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Heti óraszám</label>
                <input 
                  type="number" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Hetek száma</label>
                <input 
                  type="number" value={totalWeeks} onChange={(e) => setTotalWeeks(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Extra kérések (opcionális)</label>
              <textarea 
                rows={3} placeholder="pl. Téli szünet figyelembevétele, 4 témazáró dolgozat bekalkulálása..." value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !subject || !grade}
              className="w-full py-2.5 mt-2 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Tanmenet Generálása
            </button>
          </div>

          {/* Table Display */}
          <div className="lg:col-span-8">
            {curriculum.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex gap-4 items-center">
                    <h3 className="font-bold text-slate-800">Generált Tanmenet</h3>
                    <div className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600">
                      Órakeret: <span className={cn("ml-1", totalAllocatedHours > targetHours ? "text-red-500" : "text-green-600")}>
                        {totalAllocatedHours} / {targetHours} óra
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={exportToCSV}
                    className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-bold flex items-center gap-2 hover:bg-green-100 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Export (CSV)
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500">
                        <th className="p-3 w-16 font-bold">Hét</th>
                        <th className="p-3 font-bold">Témakör</th>
                        <th className="p-3 font-bold">Fogalmak</th>
                        <th className="p-3 w-16 text-center font-bold">Óra</th>
                        <th className="p-3 font-bold">Módszer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curriculum.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                          <td className="p-3 text-center font-bold text-slate-400">
                            {row.week}.
                          </td>
                          <td className="p-3">
                            {editingRow === idx ? (
                              <input autoFocus value={row.topic} onChange={(e) => {
                                const newC = [...curriculum]; newC[idx].topic = e.target.value; setCurriculum(newC);
                              }} onBlur={() => setEditingRow(null)} className="w-full border-b border-blue-500 outline-none bg-transparent" />
                            ) : (
                              <div onClick={() => setEditingRow(idx)} className="cursor-text">{row.topic}</div>
                            )}
                          </td>
                          <td className="p-3 text-xs text-slate-600">{row.concepts}</td>
                          <td className="p-3 text-center font-bold text-blue-600">
                            {editingRow === idx ? (
                              <input type="number" value={row.hours} onChange={(e) => {
                                const newC = [...curriculum]; newC[idx].hours = Number(e.target.value); setCurriculum(newC);
                              }} className="w-10 border-b border-blue-500 outline-none bg-transparent text-center" />
                            ) : (
                              row.hours
                            )}
                          </td>
                          <td className="p-3 text-xs text-slate-500 italic">{row.methods}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 opacity-70">
                <FileText className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-medium text-sm">Töltsd ki az űrlapot és generálj egy új tanmenetet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'nat_search' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 self-start">
            <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <Book className="w-4 h-4 text-blue-500" /> NAT 2020 Asszisztens
            </h3>
            <p className="text-xs text-slate-500">
              Kérdezz rá konkrét tantárgyi követelményekre, vagy keresd meg, mikor kell tanítani egy adott témakört a Nemzeti Alaptanterv 2020-as verziója szerint!
            </p>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tantárgy / Évfolyam</label>
              <input 
                type="text" placeholder="pl. 11. osztályos fizika" value={searchGrade} onChange={(e) => setSearchGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Keresett Kifejezés / Kérdés</label>
              <textarea 
                rows={3} placeholder="pl. Mik a fő témakörök az optikában? Mik a kötelező kísérletek?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <button 
              onClick={handleNatSearch}
              disabled={isSearching || !searchQuery}
              className="w-full py-2.5 mt-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Keresés a NAT-ban
            </button>
          </div>

          <div className="lg:col-span-8">
            {natResponse ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm prose prose-sm prose-blue max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{natResponse}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 opacity-70">
                <Database className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-medium text-sm">Írd be a keresett témát a NAT 2020 feldolgozásához.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
