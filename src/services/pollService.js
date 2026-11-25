import { API_BASE } from '../config';
import { geminiService } from './geminiService';

const LOCAL_STORAGE_KEY = 'schola_mentimeter_poll_data';

const DEFAULT_POLL_DATA = {
  id: 'poll-1',
  question: 'Mennyire érthető a mai tananyag?',
  type: 'choice', // 'choice' | 'wordcloud' | 'rating'
  isOpen: true,
  showResults: true,
  correctOptionId: null,
  options: [
    { id: 'opt-1', text: 'Teljesen tiszta és világos', votes: 4, color: '#10b981' },
    { id: 'opt-2', text: 'Nagyjából értem, de még gyakorolni kell', votes: 7, color: '#3b82f6' },
    { id: 'opt-3', text: 'Van pár dolog, amit át kéne ismételni', votes: 3, color: '#f59e0b' },
    { id: 'opt-4', text: 'Nem értem, segítségre van szükségem', votes: 1, color: '#ef4444' }
  ],
  words: [
    { text: 'gravitáció', count: 6 },
    { text: 'erő', count: 5 },
    { text: 'tömeg', count: 4 },
    { text: 'gyorsulás', count: 3 },
    { text: 'lendület', count: 2 },
    { text: 'energia', count: 3 }
  ],
  ratings: { sum: 18, count: 4 }
};

function getLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_POLL_DATA;
  } catch {
    return DEFAULT_POLL_DATA;
  }
}

function saveLocalData(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('schola_poll_updated'));
  } catch (err) {
    console.error('Failed to save local poll data:', err);
  }
}

export const pollService = {
  async getPoll() {
    try {
      const res = await fetch(`${API_BASE}/api/poll`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData(json);
          return json;
        }
      }
    } catch {
      // Fallback local
    }
    return getLocalData();
  },

  async submitVote({ optionId, word, rating, exitTicket, quizAnswer }) {
    try {
      const res = await fetch(`${API_BASE}/api/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, word, rating, exitTicket, quizAnswer })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData(json);
          return json;
        }
      }
    } catch {
      // Fallback
    }

    const current = getLocalData();
    if (!current.isOpen) return current;

    if (current.type === 'choice' && optionId) {
      const opt = current.options.find(o => o.id === optionId);
      if (opt) opt.votes = (opt.votes || 0) + 1;
    } else if (current.type === 'quiz' && (optionId || quizAnswer)) {
      const chosenOptId = optionId || quizAnswer?.optionId;
      const opt = (current.options || []).find(o => o.id === chosenOptId);
      if (opt) opt.votes = (opt.votes || 0) + 1;
      const isCorrect = chosenOptId === current.correctOptionId || opt?.isCorrect === true;
      const points = isCorrect ? Math.max(200, Math.round(1000 - ((quizAnswer?.responseTimeMs || 5000) / 30000) * 800)) : 0;
      
      const newScore = {
        studentName: quizAnswer?.studentName || 'Névtelen Diák',
        optionId: chosenOptId,
        isCorrect,
        points,
        responseTimeMs: quizAnswer?.responseTimeMs || 5000,
        timestamp: Date.now()
      };
      current.quizScores = [...(current.quizScores || []), newScore];
    } else if (current.type === 'exit-ticket' && exitTicket) {
      const newTicket = {
        id: 'et-' + Date.now(),
        studentName: exitTicket.studentName?.trim() || 'Anonim Diák',
        q1: exitTicket.q1?.trim() || '-',
        q2: exitTicket.q2?.trim() || '-',
        q3: Number(exitTicket.q3) || 5,
        timestamp: Date.now()
      };
      current.exitTickets = [newTicket, ...(current.exitTickets || [])];
    } else if (current.type === 'wordcloud' && word) {
      const clean = word.trim().toLowerCase();
      if (clean) {
        const existing = (current.words || []).find(w => w.text.toLowerCase() === clean);
        if (existing) existing.count += 1;
        else current.words = [...(current.words || []), { text: clean, count: 1 }];
      }
    } else if (current.type === 'rating' && rating) {
      const r = Number(rating);
      if (r >= 1 && r <= 5) {
        current.ratings = {
          sum: (current.ratings?.sum || 0) + r,
          count: (current.ratings?.count || 0) + 1
        };
      }
    }

    saveLocalData(current);
    return current;
  },

  async generateQuiz({ topic, subject, difficulty }) {
    const safeTopic = topic ? topic.trim() : 'Általános témakör';

    // 1. Kliensoldali Gemini AI generálás ha van API kulcs
    if (geminiService.hasApiKey()) {
      try {
        const systemInstruction = `Te egy magyar tanár vagy és interaktív szavazás/kvíz kérdéseket készítesz tanórára.
Készíts egyetlen pontos, 4 válaszlehetőséges kérdést a megadott témában.
Pontosan egy válasz legyen helyes ("isCorrect": true), a többi 3 helytelen ("isCorrect": false).
SZIGORÚ JSON kimenet egyéb szöveg nélkül:
{
  "question": "Kérdés szövege...",
  "type": "quiz",
  "correctOptionId": "opt-1",
  "timeLimit": 30,
  "options": [
    { "id": "opt-1", "text": "Helyes válasz", "color": "#ef4444", "isCorrect": true },
    { "id": "opt-2", "text": "Helytelen válasz 1", "color": "#3b82f6", "isCorrect": false },
    { "id": "opt-3", "text": "Helytelen válasz 2", "color": "#f59e0b", "isCorrect": false },
    { "id": "opt-4", "text": "Helytelen válasz 3", "color": "#10b981", "isCorrect": false }
  ]
}`;
        const responseText = await geminiService.generateContent({
          systemInstruction,
          prompt: `Készíts 1 db 4-válaszos kvízkérdést a következő témában: "${safeTopic}"`,
          temperature: 0.4
        });

        let parsed = null;
        try {
          const codeBlock = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
          if (codeBlock && codeBlock[1]) {
            parsed = JSON.parse(codeBlock[1].trim());
          } else {
            const firstBrace = responseText.indexOf('{');
            const lastBrace = responseText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
              parsed = JSON.parse(responseText.slice(firstBrace, lastBrace + 1));
            } else {
              parsed = JSON.parse(responseText.trim());
            }
          }
        } catch {}

        if (parsed && parsed.question && Array.isArray(parsed.options) && parsed.options.length >= 2) {
          const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'];
          const correctOpt = parsed.options.find(o => o.isCorrect) || parsed.options[0];
          return {
            question: parsed.question,
            type: 'quiz',
            correctOptionId: correctOpt.id || 'opt-1',
            timeLimit: Number(parsed.timeLimit) || 30,
            options: parsed.options.slice(0, 4).map((opt, idx) => ({
              id: opt.id || `opt-${idx + 1}`,
              text: opt.text,
              votes: 0,
              color: opt.color || colors[idx % 4],
              isCorrect: Boolean(opt.isCorrect)
            }))
          };
        }
      } catch (err) {
        console.warn('Gemini poll kvíz hiba, szerver fallback indul:', err);
      }
    }

    // 2. Fallback szerverre
    try {
      const res = await fetch(`${API_BASE}/api/poll/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject, difficulty })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.quiz) {
          return json.quiz;
        }
      }
    } catch {
      // Fallback
    }

    return {
      question: `Melyik a legfontosabb alapelve a következő témakörnek: ${safeTopic}?`,
      type: 'quiz',
      correctOptionId: 'opt-1',
      timeLimit: 30,
      options: [
        { id: 'opt-1', text: `A(z) ${safeTopic} meghatározó alapfogalma és összefüggése`, votes: 0, color: '#ef4444', isCorrect: true },
        { id: 'opt-2', text: 'Kizárólag elméletben létező speciális eset', votes: 0, color: '#3b82f6', isCorrect: false },
        { id: 'opt-3', text: 'Egy elavult modell, amit ma már nem alkalmazunk', votes: 0, color: '#f59e0b', isCorrect: false },
        { id: 'opt-4', text: 'Kizárólag magasabb évfolyamokon érvényes összefüggés', votes: 0, color: '#10b981', isCorrect: false }
      ]
    };
  },

  async createPoll({ question, type, options, correctOptionId }) {
    const payload = { question, type, options, correctOptionId };
    try {
      const res = await fetch(`${API_BASE}/api/poll/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData(json);
          return json;
        }
      }
    } catch {
      // Fallback
    }

    const newPoll = {
      id: 'poll-' + Date.now(),
      question: question ? question.trim() : 'Új szavazás',
      type: type || 'choice',
      isOpen: true,
      showResults: true,
      correctOptionId: correctOptionId || null,
      options: options && options.length > 0 ? options : [
        { id: 'opt-1', text: 'Igen / Egyetértek', votes: 0, color: '#10b981' },
        { id: 'opt-2', text: 'Nem / Nem értek egyet', votes: 0, color: '#ef4444' }
      ],
      words: [],
      ratings: { sum: 0, count: 0 }
    };
    saveLocalData(newPoll);
    return newPoll;
  },

  async togglePoll() {
    try {
      const res = await fetch(`${API_BASE}/api/poll/toggle`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData(json);
          return json;
        }
      }
    } catch {
      // Fallback
    }

    const current = getLocalData();
    current.isOpen = !current.isOpen;
    saveLocalData(current);
    return current;
  },

  async resetVotes() {
    try {
      const res = await fetch(`${API_BASE}/api/poll/reset`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData(json);
          return json;
        }
      }
    } catch {
      // Fallback
    }

    const current = getLocalData();
    (current.options || []).forEach(o => { o.votes = 0; });
    current.words = [];
    current.ratings = { sum: 0, count: 0 };
    saveLocalData(current);
    return current;
  },

  async toggleResults() {
    try {
      const res = await fetch(`${API_BASE}/api/poll/results-toggle`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData(json);
          return json;
        }
      }
    } catch {
      // Fallback
    }

    const current = getLocalData();
    current.showResults = !current.showResults;
    saveLocalData(current);
    return current;
  }
};
