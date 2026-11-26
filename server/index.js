// Kréta backend szerver
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const kretaService = require('./kretaService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/api/ping-kreta', async (req, res) => {
  try {
    const start = Date.now();
    const fetchRes = await fetch('https://bmszc-neumann.e-kreta.hu/Adminisztracio/Login', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      redirect: 'manual'
    });
    res.json({
      status: fetchRes.status,
      ok: fetchRes.ok || fetchRes.status === 302,
      location: fetchRes.headers.get('location'),
      elapsedMs: Date.now() - start
    });
  } catch (err) {
    res.status(500).json({ 
      error: err.message,
      cause: err.cause ? (err.cause.message || err.cause.code || String(err.cause)) : null,
      code: err.code || null
    });
  }
});

// Kijelentkezési végpont
app.post('/api/logout', (req, res) => {
  try {
    kretaService.clearSession();
    res.json({ success: true, message: 'Kijelentkezve' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bejelentkezési végpont
app.post('/api/login', async (req, res) => {
  const { username, password, schoolId } = req.body;
  try {
    const result = await kretaService.login(username, password, schoolId);
    if (result.success) {
      res.json({ success: true, message: 'Sikeres bejelentkezés' });
    } else {
      res.status(401).json({ 
        success: false, 
        message: result.message || 'Hibás adatok vagy a Kréta nem elérhető',
        details: result.error || null
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Példa egy új jegy beírására
app.post('/api/add-grade', async (req, res) => {
  const { studentId, grade, subject, type } = req.body;
  try {
    const result = await kretaService.addGrade(studentId, grade, subject, type);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Órarend lekérése
app.get('/api/timetable', async (req, res) => {
  try {
    const dayParam = req.query.day;
    const refresh = req.query.refresh === 'true';
    const dayIndex = dayParam !== undefined ? parseInt(dayParam) : null;
    const timetable = await kretaService.getTimetable(dayIndex, refresh);
    // Visszaadjuk a fromCache flag-et is
    res.json({ success: true, data: timetable.data, fromCache: timetable.fromCache });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Heti teljes órarend lekérése
app.get('/api/timetable/all', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const isClass = req.query.isClass === 'true';
    const timetable = await kretaService.getAllTimetable(refresh, isClass);
    res.json({ success: true, data: timetable.data, fromCache: timetable.fromCache });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Osztály Órarend lekérése
app.get('/api/class-timetable', async (req, res) => {
  try {
    const dayParam = req.query.day;
    const refresh = req.query.refresh === 'true';
    const dayIndex = dayParam !== undefined ? parseInt(dayParam) : null;
    const timetable = await kretaService.getTimetable(dayIndex, refresh, true);
    res.json({ success: true, data: timetable.data, fromCache: timetable.fromCache });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ÚJ: Osztály összes jövőbeli dolgozatának lekérése
app.post('/api/class-exams', async (req, res) => {
  try {
    const { apiUrl } = req.body;
    if (!apiUrl) {
      return res.status(400).json({ success: false, error: 'API URL is required' });
    }
    const result = await kretaService.getClassExams(apiUrl);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/menus', async (req, res) => {
  try {
    const links = await kretaService.getMenuItems();
    res.json({ success: true, data: links });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/groups', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const groups = await kretaService.getGroups(refresh);
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/exams', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const cache = kretaService.loadCache();
    const boardState = cache.exams_board || null;
    const exams = await kretaService.getExams(refresh);
    res.json({ success: true, data: exams, boardState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/exams/save', (req, res) => {
  try {
    const { exams } = req.body;
    if (exams && typeof exams === 'object') {
      kretaService.saveCache({ exams_board: exams, exams_boardUpdatedAt: new Date().toISOString() });
      res.json({ success: true, message: 'Dolgozat tábla elmentve a szerverre' });
    } else {
      res.status(400).json({ success: false, error: 'Érvénytelen dolgozat adatok' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/grades', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const result = await kretaService.getGrades(refresh);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/my-class', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const students = await kretaService.getMyClassStudents(refresh);
    res.json({ success: true, data: students.data, fromCache: students.fromCache });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { dayIndex, classIndex } = req.body;
    const students = await kretaService.getStudentsForClass(dayIndex, classIndex);
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Hiba a diákok lekérdezésekor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Interaktív Diák Faliújság (Padlet-jellegű élő faliújság) ---
let wallData = {
  topic: 'Gondolatok & Kérdések a mai óráról',
  notes: [
    {
      id: 'demo-1',
      author: 'Példa Diák',
      text: 'Nagyon tetszett a mai órai kísérlet! Érthetőbb lett az összefüggés.',
      color: 'yellow',
      timestamp: '10:15',
      likes: 3
    },
    {
      id: 'demo-2',
      author: 'Névtelen',
      text: 'A 3. feladat megoldási lépését át tudjuk még egyszer ismételni a végén?',
      color: 'blue',
      timestamp: '10:18',
      likes: 1
    }
  ]
};

app.get('/api/wall', (req, res) => {
  res.json({ success: true, ...wallData });
});

app.post('/api/wall/note', (req, res) => {
  const { author, text, color } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Üres szöveg' });
  }
  const newNote = {
    id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    author: (author && author.trim()) ? author.trim() : 'Névtelen',
    text: text.trim().substring(0, 400),
    color: color || 'yellow',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    likes: 0
  };
  wallData.notes.unshift(newNote);
  res.json({ success: true, note: newNote, notes: wallData.notes });
});

app.post('/api/wall/topic', (req, res) => {
  const { topic } = req.body;
  if (topic && topic.trim()) {
    wallData.topic = topic.trim();
  }
  res.json({ success: true, topic: wallData.topic });
});

app.post('/api/wall/like', (req, res) => {
  const { id } = req.body;
  const note = wallData.notes.find(n => n.id === id);
  if (note) {
    note.likes = (note.likes || 0) + 1;
  }
  res.json({ success: true, notes: wallData.notes });
});

app.delete('/api/wall/note/:id', (req, res) => {
  const { id } = req.params;
  wallData.notes = wallData.notes.filter(n => n.id !== id);
  res.json({ success: true, notes: wallData.notes });
});

app.post('/api/wall/clear', (req, res) => {
  wallData.notes = [];
  res.json({ success: true, notes: [] });
});

// Helyi Wi-Fi / hálózati IP lekérése mobil QR-kódhoz
const os = require('os');
app.get('/api/network-ip', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
      if (localIp !== 'localhost') break;
    }
    res.json({ success: true, ip: localIp });
  } catch (err) {
    res.json({ success: false, ip: 'localhost' });
  }
});

// --- Mentimeter-jellegű Élő Szavazás & Kvíz (Live Polling, Quiz & Exit Ticket) ---
let pollData = {
  id: 'poll-1',
  question: 'Mennyire érthető a mai tananyag?',
  type: 'choice', // 'choice' | 'wordcloud' | 'rating' | 'quiz' | 'exit-ticket'
  isOpen: true,
  showResults: true,
  correctOptionId: null,
  timeLimit: 30, // seconds for quiz mode
  options: [
    { id: 'opt-1', text: 'Teljesen tiszta és világos', votes: 4, color: '#10b981', isCorrect: false },
    { id: 'opt-2', text: 'Nagyjából értem, de még gyakorolni kell', votes: 7, color: '#3b82f6', isCorrect: false },
    { id: 'opt-3', text: 'Van pár dolog, amit át kéne ismételni', votes: 3, color: '#f59e0b', isCorrect: false },
    { id: 'opt-4', text: 'Nem értem, segítségre van szükségem', votes: 1, color: '#ef4444', isCorrect: false }
  ],
  words: [
    { text: 'gravitáció', count: 6 },
    { text: 'erő', count: 5 },
    { text: 'tömeg', count: 4 },
    { text: 'gyorsulás', count: 3 },
    { text: 'lendület', count: 2 },
    { text: 'energia', count: 3 }
  ],
  ratings: { sum: 18, count: 4 }, // 4.5 átlag
  exitTickets: [
    {
      id: 'et-1',
      studentName: 'Bence',
      q1: 'Megértettem a szabadesés és a gravitáció kapcsolatát.',
      q2: 'A mértékegységek átszámítását még gyakorolni kell.',
      q3: 5,
      timestamp: Date.now() - 3600000
    },
    {
      id: 'et-2',
      studentName: 'Zsófi',
      q1: 'A kísérlet a lejtővel nagyon látványos és érthető volt.',
      q2: 'A súrlódási erő hatása nem teljesen tiszta még.',
      q3: 4,
      timestamp: Date.now() - 1800000
    }
  ],
  quizScores: []
};

app.get('/api/poll', (req, res) => {
  res.json({ success: true, ...pollData });
});

app.post('/api/poll/vote', (req, res) => {
  if (!pollData.isOpen) {
    return res.status(403).json({ success: false, message: 'A szavazás jelenleg le van zárva.' });
  }

  const { optionId, word, rating, exitTicket, quizAnswer } = req.body;

  if (pollData.type === 'choice' && optionId) {
    const opt = pollData.options.find(o => o.id === optionId);
    if (opt) {
      opt.votes = (opt.votes || 0) + 1;
    }
  } else if (pollData.type === 'quiz' && (optionId || quizAnswer)) {
    const chosenOptId = optionId || quizAnswer?.optionId;
    const studentName = quizAnswer?.studentName || 'Névtelen Diák';
    const responseTimeMs = quizAnswer?.responseTimeMs || 5000;
    
    const opt = pollData.options.find(o => o.id === chosenOptId);
    if (opt) {
      opt.votes = (opt.votes || 0) + 1;
    }
    const isCorrect = chosenOptId === pollData.correctOptionId || opt?.isCorrect === true;
    
    // Számítsunk pontszámot (helyes válasz max 1000 pont, idő függvényében csökkenő)
    const points = isCorrect ? Math.max(200, Math.round(1000 - (responseTimeMs / 30000) * 800)) : 0;
    
    const existingIndex = pollData.quizScores.findIndex(s => s.studentName === studentName);
    const scoreEntry = {
      studentName,
      optionId: chosenOptId,
      isCorrect,
      points,
      responseTimeMs,
      timestamp: Date.now()
    };
    if (existingIndex >= 0) {
      pollData.quizScores[existingIndex] = scoreEntry;
    } else {
      pollData.quizScores.push(scoreEntry);
    }
  } else if (pollData.type === 'exit-ticket' && exitTicket) {
    const newTicket = {
      id: 'et-' + Date.now(),
      studentName: exitTicket.studentName?.trim() || 'Anonim Diák',
      q1: exitTicket.q1?.trim() || '-',
      q2: exitTicket.q2?.trim() || '-',
      q3: Number(exitTicket.q3) || 5,
      timestamp: Date.now()
    };
    pollData.exitTickets.unshift(newTicket);
  } else if (pollData.type === 'wordcloud' && word) {
    const cleanWord = word.trim().toLowerCase();
    if (cleanWord) {
      const existing = pollData.words.find(w => w.text.toLowerCase() === cleanWord);
      if (existing) {
        existing.count += 1;
      } else {
        pollData.words.push({ text: cleanWord, count: 1 });
      }
    }
  } else if (pollData.type === 'rating' && rating) {
    const r = Number(rating);
    if (r >= 1 && r <= 5) {
      pollData.ratings.sum = (pollData.ratings.sum || 0) + r;
      pollData.ratings.count = (pollData.ratings.count || 0) + 1;
    }
  }

  res.json({ success: true, ...pollData });
});

app.post('/api/poll/create', (req, res) => {
  const { question, type, options, correctOptionId, timeLimit } = req.body;
  pollData = {
    id: 'poll-' + Date.now(),
    question: question ? question.trim() : 'Új szavazás',
    type: type || 'choice',
    isOpen: true,
    showResults: true,
    timeLimit: timeLimit || 30,
    correctOptionId: correctOptionId || null,
    options: options && options.length > 0 ? options : [
      { id: 'opt-1', text: 'Igen / Egyetértek', votes: 0, color: '#10b981', isCorrect: false },
      { id: 'opt-2', text: 'Nem / Nem értek egyet', votes: 0, color: '#ef4444', isCorrect: false }
    ],
    words: [],
    ratings: { sum: 0, count: 0 },
    exitTickets: [],
    quizScores: []
  };
  res.json({ success: true, ...pollData });
});

// AI Kvíz Generálás Témakörhöz
app.post('/api/poll/generate-quiz', (req, res) => {
  try {
    const { topic, subject, difficulty } = req.body;
    const safeTopic = topic ? topic.trim() : 'Általános műveltség';
    
    // Szakmai intelligens sablon-generálás témakörhöz
    const sampleColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'];
    
    let generatedQuestion = `Mi a legfontosabb alapelve vagy jellemzője a következő témakörnek: ${safeTopic}?`;
    let generatedOptions = [
      { id: 'opt-1', text: `A(z) ${safeTopic} alapvető definíciója és meghatározó törvényszerűsége`, votes: 0, color: sampleColors[0], isCorrect: true },
      { id: 'opt-2', text: `Kizárólag elméleti modell, amely a valóságban soha nem érvényesül`, votes: 0, color: sampleColors[1], isCorrect: false },
      { id: 'opt-3', text: `Csak speciális szélsőértékeknél alkalmazható szabályrendszer`, votes: 0, color: sampleColors[2], isCorrect: false },
      { id: 'opt-4', text: `Egy korábban elvetett hipotézis, amit ma már nem használunk`, votes: 0, color: sampleColors[3], isCorrect: false }
    ];

    if (/egyenlet|matek|másodfokú|függvény/i.test(safeTopic)) {
      generatedQuestion = `Mire következtethetünk a másodfokú egyenlet diszkriminánsából (D = b² - 4ac)?`;
      generatedOptions = [
        { id: 'opt-1', text: 'Ha D > 0, akkor két különböző valós gyöke van az egyenletnek', votes: 0, color: sampleColors[0], isCorrect: true },
        { id: 'opt-2', text: 'Ha D = 0, akkor nincs megoldás a valós számok halmazán', votes: 0, color: sampleColors[1], isCorrect: false },
        { id: 'opt-3', text: 'A diszkrimináns csak a parabola csúcspontját határozza meg', votes: 0, color: sampleColors[2], isCorrect: false },
        { id: 'opt-4', text: 'Ha D < 0, akkor pontosan három valós gyök létezik', votes: 0, color: sampleColors[3], isCorrect: false }
      ];
    } else if (/fizika|gravitáció|erő|sebesség|lendület/i.test(safeTopic)) {
      generatedQuestion = `Newton II. törvénye szerint hogyan függ a test gyorsulása a rá ható eredő erőtől?`;
      generatedOptions = [
        { id: 'opt-1', text: 'Egyenesen arányos a ható erővel és fordítottan a test tömegével (F = m·a)', votes: 0, color: sampleColors[0], isCorrect: true },
        { id: 'opt-2', text: 'Kizárólag a test térfogatától függ, a tömegétől független', votes: 0, color: sampleColors[1], isCorrect: false },
        { id: 'opt-3', text: 'Négyzetesen arányos a megtett út hosszával', votes: 0, color: sampleColors[2], isCorrect: false },
        { id: 'opt-4', text: 'Állandó sebességnél az eredő erő mindig végtelen nagy', votes: 0, color: sampleColors[3], isCorrect: false }
      ];
    } else if (/töri|történelem|mohács|forradalom|szabadságharc/i.test(safeTopic)) {
      generatedQuestion = `Melyik állítás írja le a legpontosabban a(z) ${safeTopic} jelentőségét a magyar történelemben?`;
      generatedOptions = [
        { id: 'opt-1', text: 'Korszakalkotó fordulatot hozott és alapjaiban formálta át a nemzeti fejlődést', votes: 0, color: sampleColors[0], isCorrect: true },
        { id: 'opt-2', text: 'Csupán egy elszigetelt helyi esemény volt nemzetközi visszhang nélkül', votes: 0, color: sampleColors[1], isCorrect: false },
        { id: 'opt-3', text: 'Azonnali gazdasági virágzást eredményezett az egész birodalomban', votes: 0, color: sampleColors[2], isCorrect: false },
        { id: 'opt-4', text: 'Semmilyen hatással nem volt az alkotmányos berendezkedésre', votes: 0, color: sampleColors[3], isCorrect: false }
      ];
    }

    res.json({
      success: true,
      quiz: {
        question: generatedQuestion,
        type: 'quiz',
        correctOptionId: 'opt-1',
        timeLimit: 30,
        options: generatedOptions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Kétirányú Naptár Szinkronizáció (Google / Apple Naptár RFC 5545 iCal Export) ---
app.get('/api/timetable/export-ical', (req, res) => {
  try {
    const cache = kretaService.loadCache();
    const timetable = cache.timetable || {};
    
    // RFC 5545 iCalendar formátum felépítése
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Schola//Tanari Orarend Naptar//HU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Schola Tanári Órarend',
      'X-WR-TIMEZONE:Europe/Budapest'
    ];

    const dayMap = { '1': 'MO', '2': 'TU', '3': 'WE', '4': 'TH', '5': 'FR' };
    const now = new Date();
    // Számoljuk ki a jelenlegi hétfőt referenciának
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    Object.entries(timetable).forEach(([dayKey, lessons]) => {
      const byDay = dayMap[dayKey];
      if (!byDay || !Array.isArray(lessons)) return;

      const dayOffset = Number(dayKey) - 1; // 0 for MO, 1 for TU, etc.
      const lessonDate = new Date(monday);
      lessonDate.setDate(monday.getDate() + dayOffset);

      lessons.forEach((lesson, idx) => {
        if (!lesson.subject) return;

        // Időpont parszolása pl: "07:30 - 08:15"
        let startHour = 8, startMin = 0, endHour = 8, endMin = 45;
        if (lesson.duration && lesson.duration.includes('-')) {
          const [startStr, endStr] = lesson.duration.split('-').map(s => s.trim());
          const [sh, sm] = startStr.split(':').map(Number);
          const [eh, em] = endStr.split(':').map(Number);
          if (!isNaN(sh) && !isNaN(sm)) { startHour = sh; startMin = sm; }
          if (!isNaN(eh) && !isNaN(em)) { endHour = eh; endMin = em; }
        } else if (lesson.hourNumber) {
          // Becsült csengetési rend
          const bellSchedule = [
            [7, 30, 8, 15],
            [8, 25, 9, 10],
            [9, 20, 10, 5],
            [10, 20, 11, 5],
            [11, 15, 12, 0],
            [12, 10, 12, 55],
            [13, 5, 13, 50],
            [14, 0, 14, 45]
          ];
          const slot = bellSchedule[lesson.hourNumber - 1];
          if (slot) {
            [startHour, startMin, endHour, endMin] = slot;
          }
        }

        const dtStart = new Date(lessonDate);
        dtStart.setHours(startHour, startMin, 0, 0);

        const dtEnd = new Date(lessonDate);
        dtEnd.setHours(endHour, endMin, 0, 0);

        const formatIcalDate = (d) => {
          const pad = n => String(n).padStart(2, '0');
          return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
        };

        const uid = `schola-lesson-${dayKey}-${lesson.hourNumber || idx}-${lesson.id || idx}@schola.app`;

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${formatIcalDate(new Date())}Z`,
          `DTSTART;TZID=Europe/Budapest:${formatIcalDate(dtStart)}`,
          `DTEND;TZID=Europe/Budapest:${formatIcalDate(dtEnd)}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=20270625T235959Z`,
          `SUMMARY:${lesson.subject}${lesson.details ? ' (' + lesson.details + ')' : ''}`,
          `LOCATION:${lesson.room ? lesson.room + '. terem' : 'Iskola'}`,
          `DESCRIPTION:${lesson.hourNumber ? lesson.hourNumber + '. óra' : ''} - Osztály: ${lesson.details || 'Nincs megadva'}`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });
    });

    icsContent.push('END:VCALENDAR');
    const finalIcs = icsContent.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="schola_orarend.ics"');
    res.send(finalIcs);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 🏆 STANDALONE INTERAKTÍV KVÍZ ARÉNA (SCHOLA QUIZ ARENA)
// =========================================================================

const ARENA_COLORS = ['#e21b3c', '#1368ce', '#ffa602', '#26890c']; // Piros, Kék, Sárga, Zöld
const ARENA_SHAPES = ['▲', '◆', '●', '■'];

let savedQuizzes = [
  {
    id: 'quiz-math-1',
    title: 'Másodfokú egyenletek és függvények',
    subject: 'Matematika',
    grade: '10. évfolyam',
    questions: [
      {
        id: 'q-1',
        question: 'Mennyi a másodfokú egyenlet diszkriminánsa, ha a = 1, b = -6, c = 9?',
        timeLimit: 20,
        correctOptionId: 'opt-1',
        options: [
          { id: 'opt-1', text: '0 (egy valós gyök van)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
          { id: 'opt-2', text: '36 (két pozitív gyök)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
          { id: 'opt-3', text: '-18 (nincs valós gyök)', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
          { id: 'opt-4', text: '12 (végtelen gyök)', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
        ]
      },
      {
        id: 'q-2',
        question: 'Mi a megoldóképlet helyes alakja ax² + bx + c = 0 esetén?',
        timeLimit: 20,
        correctOptionId: 'opt-2',
        options: [
          { id: 'opt-1', text: 'x = (b ± √(b² - 4ac)) / (2a)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
          { id: 'opt-2', text: 'x = (-b ± √(b² - 4ac)) / (2a)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
          { id: 'opt-3', text: 'x = (-b ± √(b² + 4ac)) / a', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
          { id: 'opt-4', text: 'x = (-b ± √(b² - 2ac)) / (4a)', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
        ]
      },
      {
        id: 'q-3',
        question: 'Milyen alakzat az f(x) = x² - 4x + 3 függvény grafikonja?',
        timeLimit: 15,
        correctOptionId: 'opt-3',
        options: [
          { id: 'opt-1', text: 'Egyenes vonal', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
          { id: 'opt-2', text: 'Hiperbola', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
          { id: 'opt-3', text: 'Felfelé nyíló parabola', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
          { id: 'opt-4', text: 'Lefelé nyíló parabola', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
        ]
      }
    ]
  },
  {
    id: 'quiz-physics-1',
    title: 'Newton törvényei és dinamika',
    subject: 'Fizika',
    grade: '9. évfolyam',
    questions: [
      {
        id: 'q-1',
        question: 'Newton II. törvénye szerint: F = ?',
        timeLimit: 15,
        correctOptionId: 'opt-1',
        options: [
          { id: 'opt-1', text: 'm · a (tömeg szorozva gyorsulással)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
          { id: 'opt-2', text: 'm · v (lendület)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
          { id: 'opt-3', text: '1/2 · m · v²', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
          { id: 'opt-4', text: 'm · g · h', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
        ]
      },
      {
        id: 'q-2',
        question: 'Mi a tehetetlenség mértéke a fizikában?',
        timeLimit: 20,
        correctOptionId: 'opt-3',
        options: [
          { id: 'opt-1', text: 'A sebesség', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
          { id: 'opt-2', text: 'A térfogat', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
          { id: 'opt-3', text: 'A test tömege (kg)', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
          { id: 'opt-4', text: 'A súrlódási együttható', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
        ]
      }
    ]
  }
];

let quizSession = {
  id: 'session-default',
  pin: '582914',
  status: 'lobby', // 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'podium'
  quizId: 'quiz-math-1',
  title: 'Másodfokú egyenletek és függvények',
  currentQuestionIndex: 0,
  timeLimit: 20,
  questionStartTime: 0,
  questions: savedQuizzes[0].questions,
  players: [
    { id: 'p-1', name: 'Bence', score: 1850, streak: 2, answered: false, lastPoints: 920, lastAnswerCorrect: true },
    { id: 'p-2', name: 'Zsófi', score: 1720, streak: 2, answered: false, lastPoints: 860, lastAnswerCorrect: true },
    { id: 'p-3', name: 'Dániel', score: 950, streak: 1, answered: false, lastPoints: 950, lastAnswerCorrect: true }
  ],
  answersHistory: {}
};

// 1. Mentett kvízek lekérése
app.get('/api/quiz-arena/saved', (req, res) => {
  res.json({ success: true, quizzes: savedQuizzes });
});

// 2. Kvíz mentése vagy felülbírálása
app.post('/api/quiz-arena/saved', (req, res) => {
  const { quiz } = req.body;
  if (!quiz || !quiz.title) {
    return res.status(400).json({ success: false, message: 'Hiányzó kvíz adatok.' });
  }

  const existingIdx = savedQuizzes.findIndex(q => q.id === quiz.id);
  if (existingIdx >= 0) {
    savedQuizzes[existingIdx] = quiz;
  } else {
    quiz.id = quiz.id || 'quiz-' + Date.now();
    savedQuizzes.unshift(quiz);
  }
  res.json({ success: true, quiz, quizzes: savedQuizzes });
});

// 3. Mentett kvíz törlése
app.delete('/api/quiz-arena/saved/:id', (req, res) => {
  const { id } = req.params;
  savedQuizzes = savedQuizzes.filter(q => q.id !== id);
  res.json({ success: true, quizzes: savedQuizzes });
});

// 4. AI Kvíz Generálás témakörhöz felülbírálható kérdéssorral
app.post('/api/quiz-arena/ai-generate', (req, res) => {
  try {
    const { topic, questionCount = 3, subject = 'Általános', documentName, documentText } = req.body;
    const safeTopic = topic ? topic.trim() : (documentName ? documentName.replace(/\.[^/.]+$/, '') : 'Általános Műveltség');
    const count = Math.max(1, Math.min(30, Number(questionCount) || 3));

    const generatedQuestions = [];

    // Témakör-specifikus intelligens generálás
    const combinedTopic = `${safeTopic} ${subject || ''} ${documentName || ''}`.toLowerCase();
    const isKombinatorika = /kombináció|kombinatorika|permutáció|variáció|valószínűség|lottó|faktoriális/i.test(combinedTopic);
    const isSzogek = /szög|szögek|ívmérték|radián|trigonometria|fok|geometria|szinusz|koszinusz|tangens/i.test(combinedTopic);
    const isAlgebra = /egyenlet|matek|másodfokú|függvény|diszkrimináns/i.test(combinedTopic);
    const isHotan = /hő|hőtan|hőtani|hőmérséklet|fajhő|olvadás|forrás|párolgás|termodinamika|kalória/i.test(combinedTopic);
    const isFizika = isHotan || /fizika|dinamika|erő|energia|newton|sebesség|munka|nyomás|optika/i.test(combinedTopic);
    const isTortenelem = /töri|történelem|mohács|forradalom|szabadságharc|háború|király/i.test(combinedTopic);

    // Kinyert mondatok a valós dokumentum forrásszövegéből
    const docSentences = (typeof documentText === 'string' && documentText.trim().length > 30)
      ? documentText
          .split(/(?<=[.?!])\s+|\n+/)
          .map(s => s.trim())
          .filter(s => s.length >= 20 && s.length <= 220)
      : [];
    const hasDocSentences = docSentences.length >= 2;

    for (let i = 1; i <= count; i++) {
      let qText = `${safeTopic}: ${i}. kérdés és összefüggés`;
      let options = [];
      let correctId = 'opt-1';

      if (hasDocSentences) {
        // Közvetlenül a dokumentum szövegéből képezünk szövegértési kérdést
        const correctSentence = docSentences[(i - 1) % docSentences.length];
        const distractor1 = docSentences[i % docSentences.length] || 'A dokumentumban említett folyamat nem függ a környezeti feltételektől.';
        const distractor2 = docSentences[(i + 1) % docSentences.length] || 'A jelenség vizsgálata kizárólag elméleti, a valóságban nem figyelhető meg.';
        const distractor3 = `A kapott érték ellentétes a szövegben ismertetett megfigyeléssel.`;

        qText = `Melyik állítás igaz a(z) "${safeTopic}" témakörben (${i}. kérdés)?`;
        options = [
          { id: 'opt-1', text: correctSentence, color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
          { id: 'opt-2', text: distractor1 !== correctSentence ? distractor1 : 'A szöveg szerint a folyamat nem igényel külső behatást.', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
          { id: 'opt-3', text: distractor2 !== correctSentence && distractor2 !== distractor1 ? distractor2 : 'A vizsgált mennyiség értéke tetszőlegesen választható meg.', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
          { id: 'opt-4', text: distractor3, color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
        ];
        correctId = 'opt-1';
      } else if (isHotan) {
        if (i === 1) {
          qText = 'Hogyan számítjuk ki az ismétlés nélküli kombinációk számát ($n$ elemből $k$ kiválasztása)?';
          options = [
            { id: 'opt-1', text: '$C(n, k) = \\binom{n}{k} = \\frac{n!}{k!(n-k)!}$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$P(n) = n!$ (permutáció)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$V(n, k) = \\frac{n!}{(n-k)!}$ (variáció)', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$C(n, k) = \\frac{n \\cdot k}{2}$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 2) {
          qText = 'Melyik állítás igaz az ismétlés nélküli kombinációra?';
          options = [
            { id: 'opt-1', text: 'A sorrend lényegtelen, és minden elem legfeljebb egyszer szerepelhet', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'A kiválasztás sorrendje szigorúan számít', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Egy elem korlátlanul sokszor ismétlődhet a csoportban', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Csak akkor alkalmazható, ha $n = k$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 3) {
          qText = 'Melyik valós példa írható le ismétlés nélküli kombinációval?';
          options = [
            { id: 'opt-1', text: 'Ötöslottó: 90 számból 5 szám kihúzása ($\\binom{90}{5}$)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'PIN kód megadása 4 számjeggyel ($10^4$)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Dobogós helyezések kiosztása egy futóversenyen', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Egy szó betűinek összes lehetséges összekeverése', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 4) {
          qText = 'Mennyi az értéke: $\\binom{5}{2}$ ismétlés nélküli kombinációnál?';
          options = [
            { id: 'opt-1', text: '10 (mert $\\frac{5 \\cdot 4}{2} = 10$)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '20 (mert $5 \\cdot 4 = 20$)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '120 (mert $5! = 120$)', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '25 (mert $5^2 = 25$)', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else {
          qText = 'Mi a kapcsolat $\\binom{n}{k}$ és $\\binom{n}{n-k}$ értékei között a szimmetria szerint?';
          options = [
            { id: 'opt-1', text: 'Pontosan egyenlőek: $\\binom{n}{k} = \\binom{n}{n-k}$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Az egyik mindig a másik reciproka: $\\frac{1}{\\binom{n}{k}}$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'A különbségük mindig $n!$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Nincs köztük közvetlen összefüggés', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        }
      } else if (isAlgebra) {
        if (i === 1) {
          qText = 'Hány valós gyöke van a másodfokú egyenletnek, ha a diszkrimináns $D > 0$?';
          options = [
            { id: 'opt-1', text: 'Kettő különböző valós gyök ($x_1 \\neq x_2$)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Egyetlen valós gyök ($x_1 = x_2$)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Nincs valós megoldás', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Végtelen sok gyök', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 2) {
          qText = 'Milyen összefüggés érvényes a gyökök és együtthatók között (Viète-formulák)?';
          options = [
            { id: 'opt-1', text: '$x_1 + x_2 = -\\frac{b}{a}$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$x_1 \\cdot x_2 = -\\frac{c}{a}$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$x_1 + x_2 = \\frac{b}{2a}$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$x_1 \\cdot x_2 = \\frac{a}{c}$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else {
          qText = 'Melyik $x$ értékre lesz zérus az $f(x) = x^2 - 25$ kifejezés?';
          options = [
            { id: 'opt-1', text: '$x = 5$ és $x = -5$ ($x = \\pm 5$)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Csak $x = 5$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$x = 25$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Nincs ilyen valós érték', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        }
      } else if (isHotan) {
        if (i === 1) {
          qText = 'Melyik állítás írja le helyesen a fajhő ($c$) fizikai jelentését?';
          options = [
            { id: 'opt-1', text: 'Az az energia, amely $1\\text{ kg}$ anyag hőmérsékletének $1\\text{ }^\\circ\\text{C}$-kal való emeléséhez szükséges', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Az az energia, amely $1\\text{ kg}$ anyag megolvasztásához szükséges olvadásponton', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Az anyag belső energiájának teljes összege $0\\text{ K}$-en', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'A gázok tágulásakor végzett külső mechanikai munka', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 2) {
          qText = 'Mi történik a víz hőmérsékletével forrás közben, állandó légköri nyomáson?';
          options = [
            { id: 'opt-1', text: 'Állandó marad $100\\text{ }^\\circ\\text{C}$-on, amíg az összes víz el nem forr', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Folyamatosan emelkedik, ahogy növekszik a közölt hőmennyiség', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Csökken, mert a kilépő gőz hőt von el a rendszertől', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Ugrásszerűen $150\\text{ }^\\circ\\text{C}$-ra emelkedik a buborékképződés pillanatában', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 3) {
          qText = 'Melyik hőterjedési mód képes vákuumban (közvetítő közeg nélkül) is terjedni?';
          options = [
            { id: 'opt-1', text: 'Hősugárzás (pl. ahogy a Nap melegíti a Földet)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Hővezetés (kondukció)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Hőáramlás (konvekció)', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Egyik hőterjedési mód sem működik vákuumban', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 4) {
          qText = 'Hogyan számítjuk ki az állapotváltozás nélküli melegítéshez szükséges $Q$ hőmennyiséget?';
          options = [
            { id: 'opt-1', text: '$Q = c \\cdot m \\cdot \\Delta T$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$Q = L_o \\cdot m$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$Q = \\frac{1}{2} m v^2$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$Q = p \\cdot \\Delta V$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else {
          qText = 'Mi a különbség a párolgás és a forrás között?';
          options = [
            { id: 'opt-1', text: 'A párolgás bármely hőmérsékleten és csak a felszínen, a forrás csak forrásponton és a folyadék egészében zajlik', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'A párolgás során hő szabadul fel, míg a forrás hőt igényel', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Párolgás csak gázokban, forrás csak szilárd anyagokban történik', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Nincs fizikai különbség, a két szó szinonimája egymásnak', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        }
      } else if (isFizika) {
        if (i === 1) {
          qText = 'Melyik törvény mondja ki a hatás-ellenhatás elvét ($F_1 = -F_2$)?';
          options = [
            { id: 'opt-1', text: 'Newton III. törvénye ($F_{AB} = -F_{BA}$)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Newton I. törvénye (tehetetlenség)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Galilei szabadesési elve', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Arkhimédész törvénye', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 2) {
          qText = 'Mi a munka mértékegysége és kiszámítása az SI-rendszerben?';
          options = [
            { id: 'opt-1', text: 'Joule ($1\\text{ J} = 1\\text{ N} \\cdot \\text{m}$, $W = F \\cdot s$)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Watt ($1\\text{ W} = 1\\text{ J}/\\text{s}$)', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Pascal ($1\\text{ Pa} = 1\\text{ N}/\\text{m}^2$)', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Newton ($F = m \\cdot a$)', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else {
          qText = 'Milyen mozgási energiával rendelkezik egy $v$ sebességű, $m$ tömegű test?';
          options = [
            { id: 'opt-1', text: '$E_k = \\frac{1}{2} m v^2$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$E_p = m \\cdot g \\cdot h$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$E = \\frac{1}{2} D \\cdot s^2$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$Q = I \\cdot t$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        }
      } else if (isTortenelem) {
        if (i === 1) {
          qText = 'Melyik évben zajlott a mohácsi csata?';
          options = [
            { id: 'opt-1', text: '1526', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '1456', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '1686', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '1848', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else {
          qText = 'Ki vezette a magyar sereget a mohácsi csatában?';
          options = [
            { id: 'opt-1', text: 'II. Lajos magyar király és Tomori Pál', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: 'Hunyadi János', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: 'Zrínyi Miklós', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: 'Rákóczi Ferenc', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        }
      } else if (isSzogek) {
        if (i === 1) {
          qText = 'Hány radiánnak felel meg a $180^\\circ$-os szög az ívmérték definíciója szerint?';
          options = [
            { id: 'opt-1', text: '$\\pi\\text{ radián}$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$2\\pi\\text{ radián}$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$\\frac{\\pi}{2}\\text{ radián}$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$\\frac{\\pi}{4}\\text{ radián}$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 2) {
          qText = 'Hogyan számítjuk át az $\\alpha$ fokban adott szöget ívmértékre (radiánba)?';
          options = [
            { id: 'opt-1', text: '$\\text{ívmérték} = \\alpha \\cdot \\frac{\\pi}{180^\\circ}$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$\\text{ívmérték} = \\alpha \\cdot \\frac{180^\\circ}{\\pi}$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$\\text{ívmérték} = \\frac{\\alpha}{360^\\circ}$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$\\text{ívmérték} = \\alpha \\cdot 2\\pi$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 3) {
          qText = 'Mekkora szögnek felel meg a $\\frac{\\pi}{2}$ radián nagyságú szög fokokban kifejezve?';
          options = [
            { id: 'opt-1', text: '$90^\\circ$ (derékszög)', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$45^\\circ$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$180^\\circ$ (egyenesszög)', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$60^\\circ$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else if (i === 4) {
          qText = 'Hány foknak felel meg a $\\frac{\\pi}{3}$ radián nagyságú szög?';
          options = [
            { id: 'opt-1', text: '$60^\\circ$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$30^\\circ$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$45^\\circ$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$120^\\circ$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        } else {
          qText = 'Hány radián felel meg egy teljes körbefordulásnak ($360^\\circ$)?';
          options = [
            { id: 'opt-1', text: '$2\\pi\\text{ radián}$', color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: '$\\pi\\text{ radián}$', color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: '$4\\pi\\text{ radián}$', color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: '$\\frac{3\\pi}{2}\\text{ radián}$', color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
          correctId = 'opt-1';
        }
      } else {
        // Általános intelligens pedagógiai kérdések a témakörhöz - változatos kérdésekkel
        if (i === 1) {
          qText = `Melyik állítás fogalmazza meg legpontosabban a(z) "${safeTopic}" lényegét?`;
          options = [
            { id: 'opt-1', text: `A témakör szaktárgyi törvényszerűségeinek és fogalmainak szabatos alkalmazása`, color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: `Kizárólag kivételes határesetekben alkalmazható elmélet`, color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: `A gyakorlati tapasztalatok által megcáfolt, korábbi hipotézis`, color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: `A számítások során figyelmen kívül hagyható másodlagos elnevezés`, color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
        } else if (i === 2) {
          qText = `Milyen módszerrel vagy összefüggéssel oldhatók meg megbízhatóan a(z) "${safeTopic}" feladatai?`;
          options = [
            { id: 'opt-1', text: `A témához tartozó levezetett szakterületi összefüggések és mértékegységek betartásával`, color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: `Egy tetszőlegesen választott becsült érték használatával`, color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: `A mértékegységek és előjelek figyelmen kívül hagyásával`, color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: `Kizárólag közelítő grafikus becsléssel`, color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
        } else if (i === 3) {
          qText = `Hogyan érdemes ellenőrizni a kapott végeredményt a(z) "${safeTopic}" esetén?`;
          options = [
            { id: 'opt-1', text: `Visszahelyettesítéssel, dimenzió- és nagyságrendi ellenőrzéssel`, color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: `Csak az eredmény előjelének elfogadásával további vizsgálat nélkül`, color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: `A peremfeltételek és megszorítások elhagyásával`, color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: `Kizárólag a kiindulási adatok újbóli leírásával`, color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
        } else {
          qText = `Melyik megállapítás érvényes a(z) "${safeTopic}" témakör vizsgálatakor?`;
          options = [
            { id: 'opt-1', text: `A szabályos lépések betartásával egyértelmű, reprodukálható eredményt kapunk`, color: ARENA_COLORS[0], shape: ARENA_SHAPES[0] },
            { id: 'opt-2', text: `Az eredmény teljesen független a kiindulási adatoktól`, color: ARENA_COLORS[1], shape: ARENA_SHAPES[1] },
            { id: 'opt-3', text: `Minden esetben negatív előjelű számszerű eredményt kell kapnunk`, color: ARENA_COLORS[2], shape: ARENA_SHAPES[2] },
            { id: 'opt-4', text: `A feladat nem oldható meg egzakt módszerekkel`, color: ARENA_COLORS[3], shape: ARENA_SHAPES[3] }
          ];
        }
        correctId = 'opt-1';
      }

      // Keverjük meg az opciókat, hogy a helyes válasz ne mindig az opt-1 legyen!
      const targetCorrectIdx = (i - 1) % 4;
      if (targetCorrectIdx !== 0 && options.length === 4) {
        const temp = options[0];
        options[0] = options[targetCorrectIdx];
        options[targetCorrectIdx] = temp;
        // Színek és formák frissítése a helyes pozícióhoz
        options.forEach((opt, idx) => {
          opt.color = ARENA_COLORS[idx];
          opt.shape = ARENA_SHAPES[idx];
        });
        correctId = options[targetCorrectIdx].id;
      }

      generatedQuestions.push({
        id: `gen-q-${i}-${Date.now()}`,
        question: qText,
        timeLimit: 20,
        correctOptionId: correctId,
        options
      });
    }

    const generatedQuiz = {
      id: 'ai-quiz-' + Date.now(),
      title: `${safeTopic} Kvíz (AI Generált)`,
      subject: subject || 'Egyéni Téma',
      grade: 'Általános',
      questions: generatedQuestions
    };

    res.json({ success: true, quiz: generatedQuiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Élő Kvíz Állapot lekérése (Tanárnak vagy Diáknak)
app.get('/api/quiz-arena/state', (req, res) => {
  const currentQ = quizSession.questions[quizSession.currentQuestionIndex] || null;
  
  // Ha diák kéri és még 'question' fázisban van, elrejtjük a helyes választ!
  const isStudent = req.query.role === 'student';
  let safeQ = null;
  if (currentQ) {
    safeQ = {
      ...currentQ,
      correctOptionId: (isStudent && quizSession.status === 'question') ? null : currentQ.correctOptionId,
      correctAnswer: (isStudent && quizSession.status === 'question') ? null : currentQ.correctAnswer
    };
  }

  res.json({
    success: true,
    id: quizSession.id,
    pin: quizSession.pin,
    status: quizSession.status,
    title: quizSession.title,
    currentQuestionIndex: quizSession.currentQuestionIndex,
    totalQuestions: quizSession.questions.length,
    currentQuestion: safeQ,
    timeLimit: currentQ ? currentQ.timeLimit || 20 : 20,
    questionStartTime: quizSession.questionStartTime,
    playersCount: quizSession.players.length,
    answeredCount: quizSession.players.filter(p => p.answered).length,
    answersHistory: isStudent ? undefined : (quizSession.answersHistory || {}),
    players: quizSession.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      streak: p.streak,
      answered: p.answered,
      lastPoints: p.lastPoints,
      lastAnswerCorrect: p.lastAnswerCorrect
    }))
  });
});

// 6. Új élő kvíz indítása egy kiválasztott sablonból (Lobby állapotba helyezés)
app.post('/api/quiz-arena/init', (req, res) => {
  const { quiz } = req.body;
  const newPin = String(Math.floor(100000 + Math.random() * 900000));
  
  quizSession = {
    id: 'session-' + Date.now(),
    pin: newPin,
    status: 'lobby',
    quizId: quiz?.id || 'custom',
    title: quiz?.title || 'Schola Kvíz',
    currentQuestionIndex: 0,
    timeLimit: 20,
    questionStartTime: 0,
    questions: quiz?.questions && quiz.questions.length > 0 ? quiz.questions : savedQuizzes[0].questions,
    players: [],
    answersHistory: {}
  };

  res.json({ success: true, ...quizSession });
});

// 7. Diák csatlakozása a Lobbyhoz névvel és PIN-nel
app.post('/api/quiz-arena/join', (req, res) => {
  const { name, pin } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Kérlek adj meg egy nevet!' });
  }

  // Ha meg van adva PIN, ellenőrizzük (ha üres, engedélyezzük a legutóbbi aktív játékot)
  if (pin && String(pin).trim() !== String(quizSession.pin).trim()) {
    return res.status(403).json({ success: false, message: 'Érvénytelen PIN kód! Ellenőrizd a kivetítőt.' });
  }

  const cleanName = name.trim();
  let player = quizSession.players.find(p => p.name.toLowerCase() === cleanName.toLowerCase());
  
  if (!player) {
    player = {
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: cleanName,
      score: 0,
      streak: 0,
      answered: false,
      lastAnswerCorrect: null,
      lastPoints: 0
    };
    quizSession.players.push(player);
  }

  res.json({
    success: true,
    player,
    playerId: player.id,
    sessionTitle: quizSession.title,
    status: quizSession.status
  });
});

// 8. Játék indítása a Tanár által (Lobby -> 1. Kérdés)
app.post('/api/quiz-arena/start', (req, res) => {
  quizSession.status = 'question';
  quizSession.currentQuestionIndex = 0;
  quizSession.questionStartTime = Date.now();
  quizSession.players.forEach(p => {
    p.answered = false;
    p.lastAnswerCorrect = null;
    p.lastPoints = 0;
  });

  res.json({ success: true, ...quizSession });
});

// 9. Diák válaszának beküldése
app.post('/api/quiz-arena/answer', (req, res) => {
  const { playerId, optionId, numericAnswer, responseTimeMs } = req.body;
  if (quizSession.status !== 'question') {
    return res.status(400).json({ success: false, message: 'A válaszadási idő már lezárult!' });
  }

  const player = quizSession.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ success: false, message: 'A játékos nem található.' });
  }

  const currentQ = quizSession.questions[quizSession.currentQuestionIndex];
  if (!currentQ) {
    return res.status(400).json({ success: false, message: 'Nincs aktív kérdés.' });
  }

  let isCorrect = false;
  if (currentQ.type === 'numeric') {
    const userVal = String(numericAnswer !== undefined ? numericAnswer : '').replace(',', '.').trim();
    const targetVal = String(currentQ.correctAnswer !== undefined ? currentQ.correctAnswer : '').replace(',', '.').trim();
    const userNum = parseFloat(userVal);
    const targetNum = parseFloat(targetVal);
    const tol = parseFloat(currentQ.tolerance || 0);
    if (!isNaN(userNum) && !isNaN(targetNum)) {
      isCorrect = Math.abs(userNum - targetNum) <= tol;
    } else {
      isCorrect = userVal.toLowerCase() === targetVal.toLowerCase();
    }
  } else {
    isCorrect = (optionId === currentQ.correctOptionId);
  }

  const timeLimit = (currentQ.timeLimit || 20) * 1000;
  const elapsed = Math.min(timeLimit, Math.max(200, Number(responseTimeMs) || 5000));
  
  // Interaktív pontképlet: max 1000 pont, időarányosan csökkenő, minimum 200 helyes válaszért
  let points = 0;
  if (isCorrect) {
    const timeFraction = elapsed / timeLimit;
    points = Math.round(1000 * (1 - (timeFraction / 2)));
    points = Math.max(200, points);
    player.streak = (player.streak || 0) + 1;
    // Streak bónusz
    if (player.streak >= 2) points += 100;
  } else {
    player.streak = 0;
  }

  player.score = (player.score || 0) + points;
  player.answered = true;
  player.lastAnswerCorrect = isCorrect;
  player.lastPoints = points;

  // Válasz mentése a statisztikai történetbe
  if (!quizSession.answersHistory) quizSession.answersHistory = {};
  const qIdx = quizSession.currentQuestionIndex;
  if (!quizSession.answersHistory[qIdx]) quizSession.answersHistory[qIdx] = [];
  
  const existingRespIdx = quizSession.answersHistory[qIdx].findIndex(r => r.playerId === player.id);
  const respItem = {
    playerId: player.id,
    playerName: player.name,
    optionId: optionId || null,
    numericAnswer: numericAnswer !== undefined ? String(numericAnswer).trim() : null,
    isCorrect,
    points,
    responseTimeMs: elapsed
  };

  if (existingRespIdx >= 0) {
    quizSession.answersHistory[qIdx][existingRespIdx] = respItem;
  } else {
    quizSession.answersHistory[qIdx].push(respItem);
  }

  res.json({
    success: true,
    isCorrect,
    points,
    currentScore: player.score,
    streak: player.streak
  });
});

// 10. Eredmények felfedése a kérdés után (Tanár)
app.post('/api/quiz-arena/reveal', (req, res) => {
  quizSession.status = 'reveal';
  res.json({ success: true, ...quizSession });
});

// 11. Ranglista képernyő megjelenítése (Tanár)
app.post('/api/quiz-arena/leaderboard', (req, res) => {
  quizSession.status = 'leaderboard';
  res.json({ success: true, ...quizSession });
});

// 12. Következő kérdésre ugrás vagy Végeredmény (Podium)
app.post('/api/quiz-arena/next', (req, res) => {
  if (quizSession.currentQuestionIndex < quizSession.questions.length - 1) {
    quizSession.currentQuestionIndex += 1;
    quizSession.status = 'question';
    quizSession.questionStartTime = Date.now();
    quizSession.players.forEach(p => {
      p.answered = false;
      p.lastAnswerCorrect = null;
      p.lastPoints = 0;
    });
  } else {
    // Vége a kvíznek -> Dobogó / Podium!
    quizSession.status = 'podium';
  }

  res.json({ success: true, ...quizSession });
});

// 13. Kvíz újraindítása vagy vissza a lobbyba
app.post('/api/quiz-arena/reset', (req, res) => {
  quizSession.status = 'lobby';
  quizSession.currentQuestionIndex = 0;
  quizSession.answersHistory = {};
  quizSession.players.forEach(p => {
    p.score = 0;
    p.streak = 0;
    p.answered = false;
    p.lastAnswerCorrect = null;
    p.lastPoints = 0;
  });
  res.json({ success: true, ...quizSession });
});

// 14. Teljes Tanári Riport lekérése
app.get('/api/quiz-arena/report', (req, res) => {
  res.json({
    success: true,
    quiz: {
      id: quizSession.quizId,
      title: quizSession.title,
      questions: quizSession.questions
    },
    players: quizSession.players,
    answersHistory: quizSession.answersHistory || {}
  });
});

// Központi műszerfal-konfiguráció mentése és betöltése (összeszköz-szinkronizáció)
const DASHBOARD_CONFIG_FILE = path.join(__dirname, 'dashboard_config.json');

app.get('/api/dashboard-config', (req, res) => {
  try {
    if (fs.existsSync(DASHBOARD_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(DASHBOARD_CONFIG_FILE, 'utf8'));
      return res.json({ success: true, data });
    }
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/dashboard-config', (req, res) => {
  try {
    const { config } = req.body;
    if (config && typeof config === 'object') {
      let existing = {};
      if (fs.existsSync(DASHBOARD_CONFIG_FILE)) {
        try {
          existing = JSON.parse(fs.readFileSync(DASHBOARD_CONFIG_FILE, 'utf8'));
        } catch (_) {}
      }
      const updated = { ...existing, ...config };
      fs.writeFileSync(DASHBOARD_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');
      return res.json({ success: true, data: updated });
    }
    res.status(400).json({ success: false, message: 'Érvénytelen konfiguráció' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Statikus frontend kiszolgálása ha létezik a dist mappa (pl. éles környezetben / Render-en)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Vercelen az app exportálva van (a platform kezeli a figyelést), helyben/Renderen közvetlenül indul.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Backend] Kréta API háttérszolgáltatás elindult a ${PORT}-es porton`);
  });
}

module.exports = app;
