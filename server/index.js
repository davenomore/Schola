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
    res.status(500).json({ error: err.message });
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
    const exams = await kretaService.getExams();
    res.json({ success: true, data: exams });
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

// Statikus frontend kiszolgálása ha létezik a dist mappa (pl. éles környezetben / Render-en)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Backend] Kréta API háttérszolgáltatás elindult a ${PORT}-es porton`);
});
