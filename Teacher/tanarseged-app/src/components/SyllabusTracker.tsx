import { useState, useEffect } from 'react';
import { 
  CalendarDays, FileSpreadsheet, Plus, Trash2, Upload, Download, 
  CheckCircle2, Circle, ChevronRight, Sparkles, Clock, ArrowLeft, 
  Pencil, MessageSquare, AlertCircle, Search, FileText, LayoutGrid, Check, X, Info
} from 'lucide-react';
import { subscribeToUserData, saveUserData, deleteUserNestedKey } from '../lib/db';
import { Group } from './Groups';
import { SyllabusLesson, GroupSyllabus } from '../types';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

// Default subject templates for instant onboarding
const SAMPLE_SYLLABI: Record<string, Omit<GroupSyllabus, 'id' | 'groupId' | 'importedAt'>> = {
  informatika_9: {
    schoolYear: '2025/2026',
    fileName: 'Informatika_9_Kerettanterv.xlsx',
    lessons: [
      { id: 'inf9_1', week: 1, lessonNumber: 1, topic: 'Digitális kultúra alapjai, balesetvédelem', concepts: 'adat, információ, ergonómia, szabályzat', hours: 1, methods: 'előadás, megbeszélés', completed: true, completedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, notes: 'Mindenki aláírta a balesetvédelmi jegyzőkönyvet.' },
      { id: 'inf9_2', week: 1, lessonNumber: 2, topic: 'A számítógép felépítése, hardver elemek', concepts: 'CPU, RAM, HDD, SSD, alaplap, periféria', hours: 1, methods: 'demonstráció, csoportmunka', completed: true, completedAt: Date.now() - 28 * 24 * 60 * 60 * 1000, notes: 'A régi szétszerelt gépet nagyon élvezték a diákok.' },
      { id: 'inf9_3', week: 2, lessonNumber: 3, topic: 'Szoftverek csoportosítása, operációs rendszerek', concepts: 'rendszerszoftver, alkalmazás, fájlrendszer', hours: 1, methods: 'gyakorlati feladat', completed: true, completedAt: Date.now() - 23 * 24 * 60 * 60 * 1000 },
      { id: 'inf9_4', week: 2, lessonNumber: 4, topic: 'Fájlkezelés alapműveletei, tömörítés', concepts: 'mappaszerkezet, kiterjesztés, zip, rar', hours: 1, methods: 'egyéni gyakorlás', completed: true, completedAt: Date.now() - 21 * 24 * 60 * 60 * 1000 },
      { id: 'inf9_5', week: 3, lessonNumber: 5, topic: 'Az internet története, működési elve', concepts: 'IP cím, DNS, URL, kliens-szerver', hours: 1, methods: 'kooperatív tanulás', completed: false },
      { id: 'inf9_6', week: 3, lessonNumber: 6, topic: 'Keresőmotorok hatékony használata', concepts: 'kulcsszavas keresés, szűrők, operátorok', hours: 1, methods: 'kutatómunka', completed: false },
      { id: 'inf9_7', week: 4, lessonNumber: 7, topic: 'Információbiztonság, adatok védelme', concepts: 'jelszó, vírus, adathalászat, tűzfal', hours: 1, methods: 'esettanulmány', completed: false, notes: 'Fontos a kétlépcsős azonosítás részletes átbeszélése.' },
      { id: 'inf9_8', week: 4, lessonNumber: 8, topic: 'Szerzői jogok a digitális világban', concepts: 'Creative Commons, copyright, plágium', hours: 1, methods: 'vita', completed: false },
      { id: 'inf9_9', week: 5, lessonNumber: 9, topic: 'A szövegszerkesztés alaplépései, karakterformázás', concepts: 'betűtípus, méret, stílus, igazítás', hours: 1, methods: 'gyakorlati bemutató', completed: false },
      { id: 'inf9_10', week: 5, lessonNumber: 10, topic: 'Bekezdésformázás, sorköz, behúzások', concepts: 'igazítás, térköz, tabulátor', hours: 1, methods: 'irányított gyakorlat', completed: false },
      { id: 'inf9_11', week: 6, lessonNumber: 11, topic: 'Stílusok használata szöveges dokumentumban', concepts: 'Címsor 1, Címsor 2, tartalomjegyzék', hours: 1, methods: 'önálló munka', completed: false },
      { id: 'inf9_12', week: 6, lessonNumber: 12, topic: 'Táblázatok beszúrása és formázása', concepts: 'cella, sor, oszlop, szegély, igazítás', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_13', week: 7, lessonNumber: 13, topic: 'Képek és grafikus elemek elrendezése', concepts: 'horgonyzás, körbefuttatás, képaláírás', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_14', week: 7, lessonNumber: 14, topic: 'Oldalbeállítások, fejléc és lábléc', concepts: 'margó, oldalszám, szakaszok', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_15', week: 8, lessonNumber: 15, topic: 'Összetett szövegszerkesztési feladat', concepts: 'dokumentumsablon, korrektúra', hours: 1, methods: 'számonkérés', completed: false },
      { id: 'inf9_16', week: 8, lessonNumber: 16, topic: 'Bemutatókészítés elvei, tervezés', concepts: 'diadizájn, kontraszt, olvashatóság', hours: 1, methods: 'előadás, ötletbörze', completed: false },
      { id: 'inf9_17', week: 9, lessonNumber: 17, topic: 'Prezentációk készítése, sablonok', concepts: 'dia elrendezés, szövegdoboz, kép', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_18', week: 9, lessonNumber: 18, topic: 'Animációk és diaátmenetek mértékkel', concepts: 'belépés, hangsúly, kilépés, időzítés', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_19', week: 10, lessonNumber: 19, topic: 'Előadói készségek, prezentáció megtartása', concepts: 'szemkontaktus, testbeszéd, hanghordozás', hours: 1, methods: 'mikrotanítás', completed: false },
      { id: 'inf9_20', week: 10, lessonNumber: 20, topic: 'Bemutatók értékelése, visszajelzések', concepts: 'peer assessment, értékelési rubrika', hours: 1, methods: 'értékelés', completed: false },
      { id: 'inf9_21', week: 11, lessonNumber: 21, topic: 'Táblázatkezelés alapjai, adattípusok', concepts: 'sor, oszlop, munkalap, cellacím', hours: 1, methods: 'bemutató', completed: false },
      { id: 'inf9_22', week: 11, lessonNumber: 22, topic: 'Egyszerű képletek, alapműveletek', concepts: 'összeadás, kivonás, szorzás, osztás', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_23', week: 12, lessonNumber: 23, topic: 'Alapvető függvények használata', concepts: 'SZUM, ÁTLAG, DARAB, MIN, MAX', hours: 1, methods: 'irányított feladatok', completed: false },
      { id: 'inf9_24', week: 12, lessonNumber: 24, topic: 'Cellahivatkozások típusai', concepts: 'relatív hivatkozás, abszolút hivatkozás ($)', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_25', week: 13, lessonNumber: 25, topic: 'Adatok formázása, szegélyek, színek', concepts: 'pénznem, százalék, tizedesjegyek', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_26', week: 13, lessonNumber: 26, topic: 'Diagramok készítése és testreszabása', concepts: 'oszlopdiagram, kördiagram, adatkijelölés', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_27', week: 14, lessonNumber: 27, topic: 'Adatsorok rendezése és szűrése', concepts: 'növekvő, csökkenő, egyéni szűrők', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_28', week: 14, lessonNumber: 28, topic: 'Komplex táblázatkezelési feladat', concepts: 'számítások, formázás, diagram', hours: 1, methods: 'számonkérés', completed: false },
      { id: 'inf9_29', week: 15, lessonNumber: 29, topic: 'Algoritmizálás alapfogalmai, folyamatábrák', concepts: 'szekvencia, elágazás, ciklus', hours: 1, methods: 'megbeszélés', completed: false },
      { id: 'inf9_30', week: 15, lessonNumber: 30, topic: 'Ismerkedés a blokkprogramozással', concepts: 'Scratch, szereplő, háttér, parancsok', hours: 1, methods: 'játékos programozás', completed: false },
      { id: 'inf9_31', week: 16, lessonNumber: 31, topic: 'Eseményvezérelt programok készítése', concepts: 'ha kattintanak, billentyűleütésre', hours: 1, methods: 'páros munka', completed: false },
      { id: 'inf9_32', week: 16, lessonNumber: 32, topic: 'Változók és matematikai műveletek', concepts: 'változó létrehozása, értékadás', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_33', week: 17, lessonNumber: 33, topic: 'Elágazások használata Scratch-ben', concepts: 'ha... akkor, ha... különben', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_34', week: 17, lessonNumber: 34, topic: 'Ciklusok beépítése az algoritmusokba', concepts: 'ismételd, ismételd eddig, mindig', hours: 1, methods: 'gyakorlat', completed: false },
      { id: 'inf9_35', week: 18, lessonNumber: 35, topic: 'Saját Scratch projekt tervezése', concepts: 'játékterv, animációterv', hours: 1, methods: 'projektmunka', completed: false },
      { id: 'inf9_36', week: 18, lessonNumber: 36, topic: 'Projektek bemutatása és közös értékelés', concepts: 'tesztelés, hibajavítás, bemutató', hours: 1, methods: 'bemutató', completed: false }
    ]
  },
  matematika_10: {
    schoolYear: '2025/2026',
    fileName: 'Matematika_10_Kerettanterv.xlsx',
    lessons: [
      { id: 'mat10_1', week: 1, lessonNumber: 1, topic: 'Ismétlés: Halmazok és logikai szita', concepts: 'részhalmaz, unió, metszet, különbség', hours: 1, methods: 'megbeszélés', completed: true, completedAt: Date.now() - 25 * 24 * 60 * 60 * 1000 },
      { id: 'mat10_2', week: 1, lessonNumber: 2, topic: 'Hatványozás értelmezése racionális kitevőre', concepts: 'hatványalap, hatványkitevő, gyökvonás', hours: 1, methods: 'magyarázat, gyakorlat', completed: true, completedAt: Date.now() - 22 * 24 * 60 * 60 * 1000 },
      { id: 'mat10_3', week: 2, lessonNumber: 3, topic: 'A hatványozás azonosságai', concepts: 'azonos alapú hatványok, hatvány hatványa', hours: 1, methods: 'irányított gyakorlat', completed: false },
      { id: 'mat10_4', week: 2, lessonNumber: 4, topic: 'Négyzetgyök fogalma és azonosságai', concepts: 'négyzetgyök, szorzat és hányados négyzetgyöke', hours: 1, methods: 'páros feladatmegoldás', completed: false },
      { id: 'mat10_5', week: 3, lessonNumber: 5, topic: 'n-edik gyök fogalma és azonosságai', concepts: 'páros és páratlan gyökkitevő', hours: 1, methods: 'gyakorlat', completed: false }
    ]
  }
};

export const SyllabusTracker = () => {
  // Global States
  const [groups, setGroups] = useState<Group[]>([]);
  const [syllabi, setSyllabi] = useState<Record<string, GroupSyllabus>>({});
  const [schoolYears, setSchoolYears] = useState<string[]>(['2025/2026', '2026/2027']);
  
  // Selection States
  const [selectedYear, setSelectedYear] = useState<string>('2025/2026');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // Custom Year state
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearName, setNewYearName] = useState('');

  // AI & Excel Import states
  const [isImporting, setIsImporting] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importMessages, setImportMessages] = useState<string[]>([]);

  // Helper to score sheet based on keywords in first 15 rows
  const scoreSheet = (sheet: XLSX.WorkSheet): number => {
    const grid = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    let maxRowScore = 0;
    for (let r = 0; r < Math.min(grid.length, 15); r++) {
      const row = grid[r];
      if (!row || row.length === 0) continue;
      let score = 0;
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').toLowerCase().trim();
        if (!val) continue;
        if (val.includes('téma') || val.includes('anyag') || val.includes('tananyag') || val.includes('cím') || val.includes('topic')) {
          score += 5;
        }
        if (val.includes('hét') || val.includes('week') || val === 'h.') {
          score += 3;
        }
        if (val.includes('óra') || val.includes('lesson') || val.includes('sorszám') || val === 'ó.') {
          score += 3;
        }
      }
      if (score > maxRowScore) {
        maxRowScore = score;
      }
    }
    return maxRowScore;
  };

  // Pure helper to auto-detect columns on a sheet grid
  const autoDetectColumns = (grid: any[][]) => {
    let bestHeaderRow = 0;
    let maxMatchScore = -1;
    let detected = { week: -1, lessonNumber: -1, topic: -1, concepts: -1, methods: -1 };

    for (let r = 0; r < Math.min(grid.length, 15); r++) {
      const row = grid[r];
      if (!row || row.length === 0) continue;

      let score = 0;
      let tempDetected = { week: -1, lessonNumber: -1, topic: -1, concepts: -1, methods: -1 };

      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').toLowerCase().trim();
        if (!val) continue;

        if (val.includes('hét') || val.includes('week') || val === 'h.') {
          tempDetected.week = c;
          score += 3;
        } else if (val.includes('óra') || val.includes('lesson') || val.includes('sorszám') || val === 'ó.' || val === 'db') {
          tempDetected.lessonNumber = c;
          score += 3;
        } else if (val.includes('téma') || val.includes('anyag') || val.includes('tananyag') || val.includes('cím') || val.includes('topic')) {
          tempDetected.topic = c;
          score += 5;
        } else if (val.includes('fogalom') || val.includes('kulcs') || val.includes('concepts')) {
          tempDetected.concepts = c;
          score += 2;
        } else if (val.includes('módszer') || val.includes('munka') || val.includes('methods')) {
          tempDetected.methods = c;
          score += 2;
        }
      }

      if (score > maxMatchScore && tempDetected.topic !== -1) {
        maxMatchScore = score;
        bestHeaderRow = r;
        detected = tempDetected;
      }
    }

    if (detected.topic === -1) {
      for (let r = 0; r < Math.min(grid.length, 10); r++) {
        if (grid[r] && grid[r].filter(Boolean).length >= 2) {
          bestHeaderRow = r;
          break;
        }
      }
      detected = {
        week: grid[bestHeaderRow]?.findIndex((v: any) => String(v || '').toLowerCase().includes('hét')) ?? 0,
        lessonNumber: grid[bestHeaderRow]?.findIndex((v: any) => String(v || '').toLowerCase().includes('óra')) ?? 1,
        topic: grid[bestHeaderRow]?.findIndex((v: any) => String(v || '').toLowerCase().includes('téma') || String(v || '').toLowerCase().includes('anyag')) ?? 2,
        concepts: grid[bestHeaderRow]?.findIndex((v: any) => String(v || '').toLowerCase().includes('fogalom')) ?? -1,
        methods: grid[bestHeaderRow]?.findIndex((v: any) => String(v || '').toLowerCase().includes('módszer')) ?? -1
      };
      if (detected.topic === -1) detected.topic = Math.min(2, grid[bestHeaderRow]?.length - 1 || 0);
      if (detected.week === -1) detected.week = Math.min(0, grid[bestHeaderRow]?.length - 1 || 0);
      if (detected.lessonNumber === -1) detected.lessonNumber = Math.min(1, grid[bestHeaderRow]?.length - 1 || 0);
    }

    return { headerRowIndex: bestHeaderRow, colMappings: detected };
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Notes Modal state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonNoteText, setLessonNoteText] = useState('');

  // Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // AI Auto Mapping status
  const [isAIAutoMapping, setIsAIAutoMapping] = useState(false);

  // Subscribe to Firestore / localStorage
  useEffect(() => {
    const unsubGroups = subscribeToUserData('teacher_groups', (data) => {
      setGroups(data || []);
    });
    const unsubSyllabi = subscribeToUserData('teacher_syllabi', (data) => {
      setSyllabi(data || {});
    });
    const unsubYears = subscribeToUserData('school_years', (data) => {
      if (data && data.length > 0) {
        setSchoolYears(data);
      }
    });

    return () => {
      unsubGroups();
      unsubSyllabi();
      unsubYears();
    };
  }, []);

  // Helpers to update and save syllabi
  const saveSyllabi = (updated: Record<string, GroupSyllabus>) => {
    setSyllabi(updated);
    saveUserData('teacher_syllabi', updated);
  };

  const handleAddYear = () => {
    const trimmed = newYearName.trim();
    if (!trimmed) return;
    if (schoolYears.includes(trimmed)) {
      alert('Ez a tanév már létezik.');
      return;
    }
    const updated = [...schoolYears, trimmed].sort();
    setSchoolYears(updated);
    saveUserData('school_years', updated);
    setSelectedYear(trimmed);
    setNewYearName('');
    setIsAddingYear(false);
  };

  // Get active syllabus
  const activeSyllabusKey = activeGroupId ? `${selectedYear}_${activeGroupId}` : '';
  const activeSyllabus = activeSyllabusKey ? syllabi[activeSyllabusKey] : null;
  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Excel Parsing and Document Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setIsImporting(true);
    setImportMessages(['Fájl beolvasása folyamatban...']);

    const fileReader = new FileReader();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      fileReader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          setImportMessages(prev => [...prev, 'Munkalapok elemzése...', 'Optimális munkalap automatikus kiválasztása...']);

          let bestSheetName = workbook.SheetNames[0];
          let bestScore = -1;
          workbook.SheetNames.forEach(name => {
            const score = scoreSheet(workbook.Sheets[name]);
            if (score > bestScore) {
              bestScore = score;
              bestSheetName = name;
            }
          });

          setImportMessages(prev => [...prev, `✓ Kijelölt munkalap: "${bestSheetName}"`]);

          const worksheet = workbook.Sheets[bestSheetName];
          const grid = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (!grid || grid.length === 0) {
            throw new Error('A kijelölt munkalap üres.');
          }

          // Heuristic local detection as fallback
          const { headerRowIndex: fallbackHeaderRow, colMappings: fallbackMappings } = autoDetectColumns(grid);

          setImportMessages(prev => [...prev, 'AI Oszlop-párosítás indítása a háttérben...']);

          // Format first 25 rows as text for Gemini
          let gridText = '';
          const maxRows = Math.min(grid.length, 25);
          for (let r = 0; r < maxRows; r++) {
            const row = grid[r] || [];
            const rowCells = [];
            for (let c = 0; c < Math.max(row.length, 10); c++) {
              const val = row[c];
              const colLetter = String.fromCharCode(65 + c);
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                rowCells.push(`${colLetter}: "${String(val).substring(0, 60).replace(/"/g, "'")}"`);
              }
            }
            if (rowCells.length > 0) {
              gridText += `Row ${r + 1}: ${rowCells.join(' | ')}\n`;
            }
          }

          let finalHeaderRow = fallbackHeaderRow;
          let finalMappings = fallbackMappings;

          try {
            const res = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tool: 'EXCEL_MAPPER',
                topic: activeGroup?.subject || 'Matematika',
                grade: activeGroup?.name || 'Osztály',
                sourceText: gridText
              })
            });

            if (!res.ok) throw new Error('AI szerver elérhetetlen.');
            const aiData = await res.json();
            if (!aiData.content) throw new Error('Üres AI válasz.');

            const cleanText = aiData.content.replace(/```json/g, '').replace(/```/g, '').trim();
            const mapping = JSON.parse(cleanText);

            if (typeof mapping.headerRowIndex === 'number' && mapping.headerRowIndex >= 0) {
              finalHeaderRow = mapping.headerRowIndex;
            }
            finalMappings = {
              week: typeof mapping.week === 'number' ? mapping.week : fallbackMappings.week,
              lessonNumber: typeof mapping.lessonNumber === 'number' ? mapping.lessonNumber : fallbackMappings.lessonNumber,
              topic: typeof mapping.topic === 'number' ? mapping.topic : fallbackMappings.topic,
              concepts: typeof mapping.concepts === 'number' ? mapping.concepts : fallbackMappings.concepts,
              methods: typeof mapping.methods === 'number' ? mapping.methods : fallbackMappings.methods,
            };

            setImportMessages(prev => [...prev, '✓ AI Oszlop-párosítás kész.']);
          } catch (aiErr) {
            console.warn('AI mapping failed, falling back to local heuristic:', aiErr);
            setImportMessages(prev => [...prev, '⚠ AI párosítás sikertelen, automatikus mintafelismerés használata...']);
          }

          // Ensure topic is valid
          if (finalMappings.topic === -1) {
            finalMappings.topic = Math.min(2, grid[finalHeaderRow]?.length - 1 || 0);
          }

          setImportMessages(prev => [...prev, 'Adatok feldolgozása a leképezés alapján...', 'Tanórák létrehozása...']);

          const lessons: SyllabusLesson[] = [];
          let lastParsedWeek = 1;
          let lastParsedLesson = 1;

          for (let r = finalHeaderRow + 1; r < grid.length; r++) {
            const row = grid[r];
            if (!row || row.length === 0) continue;

            const topicVal = String(row[finalMappings.topic] || '').trim();
            if (!topicVal || topicVal.toLowerCase() === 'null' || topicVal.toLowerCase() === 'undefined') continue;

            // Skip divider or header rows in sheet
            if (topicVal.toLowerCase().includes('téma') && topicVal.toLowerCase().includes('óra')) continue;

            // Week parsing
            let weekVal = lastParsedWeek;
            if (finalMappings.week !== -1 && row[finalMappings.week] !== undefined && row[finalMappings.week] !== null) {
              const cleanedWeek = parseInt(String(row[finalMappings.week]).replace(/\D/g, ''));
              if (!isNaN(cleanedWeek)) {
                weekVal = cleanedWeek;
                lastParsedWeek = cleanedWeek;
              }
            } else {
              weekVal = Math.ceil((lessons.length + 1) / 2);
            }

            // Lesson number parsing
            let lessonVal = lastParsedLesson;
            if (finalMappings.lessonNumber !== -1 && row[finalMappings.lessonNumber] !== undefined && row[finalMappings.lessonNumber] !== null) {
              const cleanedLesson = parseInt(String(row[finalMappings.lessonNumber]).replace(/\D/g, ''));
              if (!isNaN(cleanedLesson)) {
                lessonVal = cleanedLesson;
                lastParsedLesson = cleanedLesson + 1;
              }
            } else {
              lessonVal = lessons.length + 1;
            }

            const conceptsVal = finalMappings.concepts !== -1 ? String(row[finalMappings.concepts] || '').trim() : '';
            const methodsVal = finalMappings.methods !== -1 ? String(row[finalMappings.methods] || '').trim() : '';

            lessons.push({
              id: `parsed_lesson_${Date.now()}_${r}`,
              week: weekVal,
              lessonNumber: lessonVal,
              topic: topicVal,
              concepts: conceptsVal || 'nincs megadva',
              hours: 1,
              methods: methodsVal || 'egyéni/csoportmunka',
              completed: false
            });
          }

          if (lessons.length === 0) {
            throw new Error('Nem találtunk feldolgozható órákat a munkalapon. Kérjük ellenőrizd a táblázat szerkezetét.');
          }

          setImportMessages(prev => [...prev, `✓ ${lessons.length} db tanóra sikeresen beolvasva!`, 'Tanmenet mentése folyamatban...']);

          setTimeout(() => {
            const newSyllabus: GroupSyllabus = {
              id: activeSyllabusKey,
              groupId: activeGroupId!,
              schoolYear: selectedYear,
              fileName: file.name,
              lessons: lessons,
              importedAt: Date.now()
            };

            saveSyllabi({
              ...syllabi,
              [activeSyllabusKey]: newSyllabus
            });

            setIsImporting(false);
          }, 1500);

        } catch (err: any) {
          console.error(err);
          setImportMessages(prev => [...prev, `❌ Hiba a feldolgozás során: ${err.message || err}`]);
          setTimeout(() => setIsImporting(false), 4000);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.pdf') || file.name.endsWith('.txt')) {
      // PDF & TXT AI extraction
      setImportMessages(prev => [...prev, 'Szöveg kinyerése a dokumentumból a szerver segítségével...']);
      
      const formData = new FormData();
      formData.append('file', file);

      fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      })
      .then(res => {
        if (!res.ok) throw new Error('A szerver nem tudta kinyerni a szöveget a fájlból.');
        return res.json();
      })
      .then(data => {
        setImportMessages(prev => [...prev, '✓ Szöveg kinyerve.', 'Gemini AI tanmenet-feldolgozás indítása...']);
        
        // Call Gemini generate API with extracted text
        return fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'CURRICULUM_PLANNER',
            topic: activeGroup?.subject || 'Tantárgy',
            grade: activeGroup?.name || 'Osztály',
            additionalInfo: 'Heti 2 óra',
            sourceText: data.text
          })
        });
      })
      .then(res => {
        if (!res.ok) throw new Error('Az AI generálás sikertelen volt.');
        return res.json();
      })
      .then(result => {
        try {
          // Parse JSON content from Gemini
          const rawText = result.content;
          // Trim markdown codeblocks if Gemini added them
          const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsedLessons = JSON.parse(cleanedText) as any[];

          const lessons: SyllabusLesson[] = parsedLessons.map((l, index) => ({
            id: `ai_lesson_${Date.now()}_${index}`,
            week: Number(l.week) || Math.ceil((index + 1) / 2),
            lessonNumber: Number(l.lessonNumber) || Number(l.hours) || index + 1,
            topic: l.topic || l.title || 'Ismeretlen téma',
            concepts: l.concepts || 'nincs megadva',
            hours: 1,
            methods: l.methods || 'egyéni/csoportmunka',
            completed: false
          }));

          setImportMessages(prev => [...prev, `✓ AI sikeresen feldolgozta: ${lessons.length} db tanóra generálva!`, 'Tanmenet mentése...']);

          setTimeout(() => {
            const newSyllabus: GroupSyllabus = {
              id: activeSyllabusKey,
              groupId: activeGroupId!,
              schoolYear: selectedYear,
              fileName: file.name,
              lessons: lessons,
              importedAt: Date.now()
            };

            saveSyllabi({
              ...syllabi,
              [activeSyllabusKey]: newSyllabus
            });

            setIsImporting(false);
          }, 1500);

        } catch (parseErr) {
          console.error(parseErr);
          throw new Error('Az AI válasza nem érvényes struktúra. Kérlek próbáld újra.');
        }
      })
      .catch(err => {
        console.error(err);
        setImportMessages(prev => [...prev, `❌ Hiba az AI feldolgozás során: ${err.message || err}`]);
        setTimeout(() => setIsImporting(false), 4000);
      });
    } else {
      setImportMessages(prev => [...prev, '❌ Nem támogatott fájlformátum. Kérlek válassz .xlsx, .xls, .pdf vagy .txt fájlt!']);
      setTimeout(() => setIsImporting(false), 3000);
    }
  };

  // Load a rich pre-built template
  const handleLoadSample = (sampleKey: keyof typeof SAMPLE_SYLLABI) => {
    if (!activeGroupId) return;
    const template = SAMPLE_SYLLABI[sampleKey];
    
    // Copy the lessons array to avoid reference issues and assign unique IDs
    const copiedLessons = template.lessons.map(l => ({
      ...l,
      id: `lesson_${activeGroupId}_${Date.now()}_${l.lessonNumber}`,
      completed: false, // Start clean
      completedAt: undefined,
      notes: undefined
    }));

    const newSyllabus: GroupSyllabus = {
      id: activeSyllabusKey,
      groupId: activeGroupId,
      schoolYear: selectedYear,
      fileName: template.fileName,
      lessons: copiedLessons,
      importedAt: Date.now()
    };

    saveSyllabi({
      ...syllabi,
      [activeSyllabusKey]: newSyllabus
    });
  };

  // Toggle single lesson completion status
  const handleToggleLesson = (lessonId: string) => {
    if (!activeSyllabus) return;
    const updatedLessons = activeSyllabus.lessons.map(l => {
      if (l.id === lessonId) {
        const completed = !l.completed;
        return {
          ...l,
          completed,
          completedAt: completed ? Date.now() : undefined
        };
      }
      return l;
    });

    saveSyllabi({
      ...syllabi,
      [activeSyllabusKey]: {
        ...activeSyllabus,
        lessons: updatedLessons
      }
    });
  };

  // Save lesson note
  const handleSaveNote = () => {
    if (!activeSyllabus || !editingLessonId) return;
    const updatedLessons = activeSyllabus.lessons.map(l => {
      if (l.id === editingLessonId) {
        return {
          ...l,
          notes: lessonNoteText.trim() || undefined
        };
      }
      return l;
    });

    saveSyllabi({
      ...syllabi,
      [activeSyllabusKey]: {
        ...activeSyllabus,
        lessons: updatedLessons
      }
    });

    setEditingLessonId(null);
    setLessonNoteText('');
  };

  // Open note edit popover
  const handleOpenEditNote = (lesson: SyllabusLesson) => {
    setEditingLessonId(lesson.id);
    setLessonNoteText(lesson.notes || '');
  };

  // Reset or delete active syllabus
  const handleDeleteSyllabus = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSyllabus = () => {
    setIsDeleteModalOpen(false);
    if (!activeSyllabusKey) return;
    
    // Copy the syllabi state, delete the active key, and save the updated map to Firestore
    const updatedSyllabi = { ...syllabi };
    delete updatedSyllabi[activeSyllabusKey];
    saveSyllabi(updatedSyllabi);
  };

  // Export to CSV format
  const handleExportCSV = () => {
    if (!activeSyllabus || !activeGroup) return;

    // Excel compatible Hungarian CSV layout with BOM for proper characters
    let csvContent = '\uFEFF'; 
    csvContent += 'Hét;Óraszám;Témakör;Kulcsfogalmak;Módszerek;Állapot;Dátum;Megjegyzések\n';

    activeSyllabus.lessons.forEach(l => {
      const statusText = l.completed ? 'Teljesítve' : 'Folyamatban';
      const dateText = l.completedAt ? new Date(l.completedAt).toLocaleDateString('hu-HU') : '';
      const notesClean = (l.notes || '').replace(/;/g, ',').replace(/\n/g, ' ');
      csvContent += `${l.week};${l.lessonNumber};"${l.topic.replace(/"/g, '""')}";"${l.concepts.replace(/"/g, '""')}";"${l.methods?.replace(/"/g, '""') || ''}";${statusText};${dateText};"${notesClean}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tanmenet_${activeGroup.name}_${selectedYear.replace(/\//g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print syllabus
  const handlePrintSyllabus = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6 py-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Tanmenet Követő & Adminisztráció</h2>
            <p className="text-xs text-slate-500">Kövesd nyomon és kezeld tanmeneteidet tanévekre bontva</p>
          </div>
        </div>

        {/* Year Select & Creator */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isAddingYear ? (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <input
                type="text"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                placeholder="pl: 2025/2026"
                className="px-2 py-1 text-xs border border-slate-300 rounded outline-none w-28 bg-white focus:border-blue-500 transition-colors"
                autoFocus
              />
              <button 
                onClick={handleAddYear}
                className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsAddingYear(false)}
                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setActiveGroupId(null); // Clear group select on year change
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {schoolYears.map(year => (
                  <option key={year} value={year}>{year} Tanév</option>
                ))}
              </select>
              <button
                onClick={() => setIsAddingYear(true)}
                className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all"
                title="Új Tanév Létrehozása"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* NO ACTIVE GROUP SELECT SCREEN */}
      {activeGroupId === null ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main list of groups */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tanított csoportjaid a(z) {selectedYear} tanévben</h3>
            
            {groups.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-800">Még nincs rögzített csoportod</h4>
                  <p className="text-xs text-slate-500 mt-1">Hozz létre egy csoportot a Csoportok & Diákok menüpontban a tanmenet kezeléséhez.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map(group => {
                  const sKey = `${selectedYear}_${group.id}`;
                  const s = syllabi[sKey];
                  const completedCount = s ? s.lessons.filter(l => l.completed).length : 0;
                  const totalCount = s ? s.lessons.length : 0;
                  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                  return (
                    <button
                      key={group.id}
                      onClick={() => setActiveGroupId(group.id)}
                      className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-5 text-left transition-all hover:shadow-md group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
                    >
                      <div className="space-y-1 z-10">
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                          {group.subject}
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-800 mt-1">{group.name} osztály</h4>
                        <p className="text-[11px] text-slate-500">{group.students.length} tanuló</p>
                      </div>

                      <div className="mt-4 z-10 w-full">
                        {s ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                              <span>Haladás</span>
                              <span>{progressPct}% ({completedCount}/{totalCount} óra)</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                            <Upload className="w-3.5 h-3.5 text-slate-300" />
                            Nincs még tanmenet feltöltve
                          </div>
                        )}
                      </div>

                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick info panel */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-lg flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Tanmenet AI Asszisztens</span>
              </div>
              <h4 className="text-lg font-bold">Importáld és kövesd tanmeneted egyszerűen!</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Töltsd fel az iskola által biztosított tanmenet fájlt (Excel, Word, PDF) és a rendszerünk automatikusan struktúrába rendezi a leckéket, hetekre lebontva.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 mt-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Kördiagramos és statisztikai haladásjelzés</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Módszertani megjegyzések rögzítése óránként</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Egyetlen kattintásos óra-pipálás dátumbélyegzővel</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-700/50 flex items-center gap-3">
              <div className="text-[10px] text-slate-400 leading-normal">
                Kezdéshez válassz ki egy osztályt a bal oldali listából.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE GROUP WORKSPACE */
        <div className="space-y-6">
          {/* Back button and group title */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveGroupId(null)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Vissza a csoportokhoz</span>
            </button>
            <div className="text-right">
              <h3 className="text-lg font-extrabold text-slate-800">{activeGroup?.name} csoport tanmenete</h3>
              <p className="text-xs text-slate-500 font-medium">{activeGroup?.subject} • {selectedYear} tanév</p>
            </div>
          </div>

          {/* IF NO SYLLABUS UPLOADED: UPLOADER SCREEN */}
          {!activeSyllabus ? (
            /* DEFAULT TWO-COLUMN LAYOUT */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File drop uploader */}
              <div className="bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center transition-all flex flex-col justify-center items-center min-h-[350px]">
                {isImporting ? (
                  <div className="space-y-6 w-full max-w-sm">
                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin" />
                      <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800">Tanmenet beolvasása folyamatban</h4>
                      <p className="text-[11px] text-slate-500 italic">Fájl: {importFileName}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-left space-y-2 max-h-40 overflow-y-auto font-mono text-[10px]">
                      {importMessages.map((msg, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-slate-600">
                          <span className="text-emerald-500">✓</span>
                          <span>{msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-full inline-block">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">Tanmenet fájl feltöltése</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Töltsd fel az iskola által biztosított **Excel (.xlsx, .xls), Word (.docx) vagy PDF** tanmenetet.
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <input
                        type="file"
                        id="syllabus-uploader"
                        accept=".xlsx,.xls,.docx,.pdf,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <label
                        htmlFor="syllabus-uploader"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all inline-block active:scale-95"
                      >
                        Tallózás a számítógépről
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">Támogatott formátumok: PDF, DOCX, XLSX, TXT</p>
                  </div>
                )}
              </div>

              {/* Sample prebuilt templates */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Sparkles className="w-5 h-5 fill-current" />
                    <h4 className="font-bold text-slate-800">Gyors mintatanmenetek (Azonnali indítás)</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Nincs még elkészült tanmeneted a gépen? Teszteld a rendszert azonnal a tantárgyadnak megfelelő előre feltöltött, 36 hetes részletes kerettanterv sablonok egyikével!
                  </p>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => handleLoadSample('informatika_9')}
                      className="w-full p-4 border border-slate-100 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <h5 className="text-xs font-extrabold text-slate-800">Digitális Kultúra / Informatika — 9. évfolyam</h5>
                        <p className="text-[10px] text-slate-500">Heti 2 óra, 36 órás teljes kerettanterv sablon</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleLoadSample('matematika_10')}
                      className="w-full p-4 border border-slate-100 rounded-xl hover:border-blue-300 hover:bg-blue-50/20 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <h5 className="text-xs font-extrabold text-slate-800">Matematika — 10. évfolyam</h5>
                        <p className="text-[10px] text-slate-500">Minta felosztás, alapvető témakörökkel</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2 text-[10px] text-slate-500 leading-normal">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>A sablon betöltése után bármikor törölheted vagy felülírhatod a tanmenetet saját fájllal is.</span>
                </div>
              </div>
            </div>
          ) : (
            /* IF SYLLABUS LOADED: MAIN TRACKING PANEL */
            <div className="space-y-6">
              {/* PROGRESS DASHBOARD */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                {/* Left: Circular progress */}
                <div className="md:col-span-4 flex items-center gap-5 border-r border-slate-100 pr-5">
                  <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      {/* Foreground completed circle */}
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="#2563eb"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - activeSyllabus.lessons.filter(l => l.completed).length / activeSyllabus.lessons.length)}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-slate-800">
                        {Math.round((activeSyllabus.lessons.filter(l => l.completed).length / activeSyllabus.lessons.length) * 100)}%
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Haladás</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Óraszámok</h4>
                    <p className="text-2xl font-black text-slate-800">
                      {activeSyllabus.lessons.filter(l => l.completed).length} <span className="text-slate-400 font-semibold text-sm">/ {activeSyllabus.lessons.length} óra</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium italic">Fájl: {activeSyllabus.fileName || 'Generált tanmenet'}</p>
                  </div>
                </div>

                {/* Middle: Metric cards */}
                <div className="md:col-span-5 grid grid-cols-2 gap-4">
                  {/* Last finished */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Utoljára Pipálva
                      </p>
                      <p className="text-xs font-bold text-slate-700 mt-1.5 truncate">
                        {activeSyllabus.lessons.filter(l => l.completed).slice(-1)[0]?.topic || 'Nincs elvégzett óra'}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 mt-2">
                      {activeSyllabus.lessons.filter(l => l.completed).slice(-1)[0]?.completedAt 
                        ? new Date(activeSyllabus.lessons.filter(l => l.completed).slice(-1)[0].completedAt!).toLocaleDateString('hu-HU') 
                        : '-'}
                    </span>
                  </div>

                  {/* Next up */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-blue-500" /> Következő óra
                      </p>
                      <p className="text-xs font-bold text-slate-700 mt-1.5 truncate">
                        {activeSyllabus.lessons.find(l => !l.completed)?.topic || 'Mind elvégezve! 🎉'}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-blue-600 mt-2">
                      {activeSyllabus.lessons.find(l => !l.completed) ? `${activeSyllabus.lessons.find(l => !l.completed)?.lessonNumber}. sorszámú óra` : 'Befejezve'}
                    </span>
                  </div>
                </div>

                {/* Right: Export & Reset actions */}
                <div className="md:col-span-3 flex flex-col justify-center gap-2 md:pl-5 md:border-l md:border-slate-100">
                  <button
                    onClick={handleExportCSV}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV / Excel Exportálás</span>
                  </button>

                  <button
                    onClick={handlePrintSyllabus}
                    className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Nyomtatás / PDF</span>
                  </button>

                  <button
                    onClick={handleDeleteSyllabus}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tanmenet törlése</span>
                  </button>
                </div>
              </div>

              {/* FILTER & SEARCH */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Témakör vagy fogalom keresése..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-semibold"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      statusFilter === 'all' ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Összes
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      statusFilter === 'completed' ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Csak Teljesített
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      statusFilter === 'pending' ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Csak Hátralévő
                  </button>
                </div>
              </div>

              {/* TABLE LIST VIEW */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3 w-16 text-center">Hét</th>
                        <th className="px-4 py-3 w-16 text-center">Óra</th>
                        <th className="px-5 py-3">Témakör / Tanóra Címe</th>
                        <th className="px-5 py-3 hidden md:table-cell">Kulcsfogalmak</th>
                        <th className="px-5 py-3">Megjegyzések / Módszerek</th>
                        <th className="px-4 py-3 w-28 text-center">Státusz</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {activeSyllabus.lessons
                        .filter(l => {
                          const matchesSearch = l.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                l.concepts.toLowerCase().includes(searchQuery.toLowerCase());
                          const matchesFilter = statusFilter === 'all' || 
                                                (statusFilter === 'completed' && l.completed) ||
                                                (statusFilter === 'pending' && !l.completed);
                          return matchesSearch && matchesFilter;
                        })
                        .map(lesson => (
                          <tr 
                            key={lesson.id}
                            className={cn(
                              "hover:bg-slate-50/50 transition-colors",
                              lesson.completed ? "bg-emerald-50/10 text-slate-700" : "text-slate-800"
                            )}
                          >
                            {/* Week */}
                            <td className="px-4 py-3.5 text-center font-bold text-slate-500">
                              {lesson.week}. hét
                            </td>
                            {/* Lesson Number */}
                            <td className="px-4 py-3.5 text-center font-extrabold text-slate-700">
                              {lesson.lessonNumber}.
                            </td>
                            {/* Topic Title */}
                            <td className="px-5 py-3.5">
                              <p className={cn("font-bold text-[13px]", lesson.completed ? "line-through text-slate-400" : "text-slate-800")}>
                                {lesson.topic}
                              </p>
                              {lesson.completedAt && (
                                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50 mt-1 inline-block">
                                  Elvégezve: {new Date(lesson.completedAt).toLocaleDateString('hu-HU')}
                                </span>
                              )}
                            </td>
                            {/* Concepts */}
                            <td className="px-5 py-3.5 text-[11px] text-slate-500 leading-normal max-w-xs hidden md:table-cell">
                              {lesson.concepts}
                            </td>
                            {/* Custom notes column */}
                            <td className="px-5 py-3.5">
                              {lesson.notes ? (
                                <div className="group/note flex items-start gap-2 bg-blue-50/30 border border-blue-100 rounded-lg p-2 max-w-sm">
                                  <div className="flex-1 text-[11px] text-slate-600 leading-normal">
                                    <strong>Jegyzet:</strong> {lesson.notes}
                                  </div>
                                  <button
                                    onClick={() => handleOpenEditNote(lesson)}
                                    className="p-1 hover:bg-blue-100/50 rounded text-slate-400 hover:text-blue-600 opacity-0 group-hover/note:opacity-100 transition-opacity shrink-0"
                                    title="Szerkesztés"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenEditNote(lesson)}
                                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px] font-semibold border border-dashed border-slate-200 hover:border-slate-300 px-2 py-1 rounded-md transition-all"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Megjegyzés írása</span>
                                </button>
                              )}
                            </td>
                            {/* Completed Checkbox */}
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => handleToggleLesson(lesson.id)}
                                className={cn(
                                  "p-1.5 rounded-full transition-all duration-300",
                                  lesson.completed 
                                    ? "text-emerald-600 bg-emerald-100/50 hover:bg-emerald-100" 
                                    : "text-slate-300 hover:text-blue-500 hover:bg-slate-100"
                                )}
                              >
                                {lesson.completed ? (
                                  <CheckCircle2 className="w-5 h-5 fill-current" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT NOTE POPUP MODAL */}
      {editingLessonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Módszertani jegyzet / Megjegyzés</span>
              </h4>
              <button 
                onClick={() => setEditingLessonId(null)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Óra témája</p>
              <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-normal">
                {activeSyllabus?.lessons.find(l => l.id === editingLessonId)?.topic}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Megjegyzés vagy egyedi módszer</label>
              <textarea
                rows={4}
                value={lessonNoteText}
                onChange={(e) => setLessonNoteText(e.target.value)}
                placeholder="Írd ide a módszertani észrevételeket, vagy azt, hogy hol tartottatok a csoporttal az órán..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-300 resize-none font-medium leading-normal"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLessonId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
              >
                Mégse
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 animate-pulse">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">Biztosan törlöd a tanmenetet?</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Ez a művelet nem vonható vissza. A csoport összes haladási adata és módszertani megjegyzése véglegesen törlődik az adatbázisból.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all w-full active:scale-98"
              >
                Mégse
              </button>
              <button
                onClick={confirmDeleteSyllabus}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all w-full active:scale-98"
              >
                Igen, törlöm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
