import { API_BASE } from '../config';
import { geminiService } from './geminiService';
import { convertAsciiMathToLatex } from '../components/ui/MathText';

const LOCAL_STORAGE_SAVED_KEY = 'schola_quiz_arena_saved_quizzes';
const LOCAL_STORAGE_SESSION_KEY = 'schola_quiz_arena_session';

/**
 * Szöveges kvíztartalom (kérdés, válaszopciók) matematikai kifejezéseinek LaTeX formázása
 */
function ensureQuizLatex(text) {
  if (!text) return '';
  const s = String(text).trim();

  // Ha már van dollárjel, ellenőrizzük nincs-e benne kezeletlen ASCII szorzás vagy hatvány
  if (s.includes('$')) {
    return s.replace(/\$([^\$]+)\$/g, (_, math) => {
      return `$${convertAsciiMathToLatex(math)}$`;
    });
  }

  // Ha tipikus mondatszöveg és nem matek (pl. "A sorrend lényegtelen")
  const proseRegex = /\b(hogy|mert|vagy|és|nem|csak|minden|melyik|hogyan|értéke|kapcsolat|szerint|számít|számítás|lehetséges|állítás|valós|példa|összes|egyik|másik|különbség|törvény|mértékegység|test|sebesség|tömeg)\b/i;
  
  // Ha tiszta matematikai kifejezés (n!, n^k, n! / (k! * (n-k)!), 5*4/2, stb.)
  const isPureMath = !proseRegex.test(s) && (
    /^[a-zA-Z0-9\(\)\-]+!$/.test(s) ||
    /^[a-zA-Z0-9\(\)\-]+[\^_²³⁴][a-zA-Z0-9\(\)\-]+$/.test(s) ||
    /[a-zA-Z0-9\)!]\s*\/\s*[a-zA-Z0-9\(!]/.test(s) ||
    (/[\!\/\*\^\_\=\\±²³⁴]|\bbinom\b|\bfrac\b|\balatt\b/.test(s) && /^[a-zA-Z0-9\(\)\{\}\[\]\!\/\*\+\-\=\^\_\.\,\s\\·±²³⁴]+$/.test(s))
  );

  if (isPureMath) {
    return `$${convertAsciiMathToLatex(s)}$`;
  }

  // Ha vegyes mondat: kombináció "(90 alatt az 5)" vagy magyarázat "(mert 5 * 4 / 2 = 10)"
  let formatted = s;
  formatted = formatted.replace(/\(?\b([a-zA-Z0-9]+)\s+alatt\s+(?:a\s+|az\s+)?([a-zA-Z0-9\-]+)\)?/gi, '$\\binom{$1}{$2}$');
  formatted = formatted.replace(/\(mert\s+([^)]+)\)/gi, (m, expr) => {
    return `(mert $${convertAsciiMathToLatex(expr)}$)`;
  });

  return formatted;
}

const DEFAULT_QUIZZES = [
  {
    id: 'quiz-math-1',
    title: 'Másodfokú egyenletek és függvények',
    subject: 'Matematika',
    grade: '10. évfolyam',
    questions: [
      {
        id: 'q-1',
        question: 'Mennyi a másodfokú egyenlet diszkriminánsa, ha $a = 1$, $b = -6$, $c = 9$?',
        timeLimit: 20,
        correctOptionId: 'opt-1',
        options: [
          { id: 'opt-1', text: '$D = 0$ (egy valós gyök van)', color: '#e21b3c', shape: '▲' },
          { id: 'opt-2', text: '$D = 36$ (két pozitív gyök)', color: '#1368ce', shape: '◆' },
          { id: 'opt-3', text: '$D = -18$ (nincs valós gyök)', color: '#ffa602', shape: '●' },
          { id: 'opt-4', text: '$D = 12$ (végtelen gyök)', color: '#26890c', shape: '■' }
        ]
      },
      {
        id: 'q-2',
        question: 'Mi a megoldóképlet helyes alakja $ax^2 + bx + c = 0$ esetén?',
        timeLimit: 20,
        correctOptionId: 'opt-2',
        options: [
          { id: 'opt-1', text: '$x = \\frac{b \\pm \\sqrt{b^2 - 4ac}}{2a}$', color: '#e21b3c', shape: '▲' },
          { id: 'opt-2', text: '$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$', color: '#1368ce', shape: '◆' },
          { id: 'opt-3', text: '$x = \\frac{-b \\pm \\sqrt{b^2 + 4ac}}{a}$', color: '#ffa602', shape: '●' },
          { id: 'opt-4', text: '$x = \\frac{-b \\pm \\sqrt{b^2 - 2ac}}{4a}$', color: '#26890c', shape: '■' }
        ]
      },
      {
        id: 'q-3',
        question: 'Milyen alakzat az $f(x) = x^2 - 4x + 3$ függvény grafikonja?',
        timeLimit: 15,
        correctOptionId: 'opt-3',
        options: [
          { id: 'opt-1', text: 'Egyenes vonal', color: '#e21b3c', shape: '▲' },
          { id: 'opt-2', text: 'Hiperbola', color: '#1368ce', shape: '◆' },
          { id: 'opt-3', text: 'Felfelé nyíló parabola', color: '#ffa602', shape: '●' },
          { id: 'opt-4', text: 'Lefelé nyíló parabola', color: '#26890c', shape: '■' }
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
        question: 'Newton II. törvénye szerint: $F = ?$',
        timeLimit: 15,
        correctOptionId: 'opt-1',
        options: [
          { id: 'opt-1', text: '$m \\cdot a$ (tömeg szorozva gyorsulással)', color: '#e21b3c', shape: '▲' },
          { id: 'opt-2', text: '$m \\cdot v$ (lendület)', color: '#1368ce', shape: '◆' },
          { id: 'opt-3', text: '$\\frac{1}{2}mv^2$', color: '#ffa602', shape: '●' },
          { id: 'opt-4', text: '$m \\cdot g \\cdot h$', color: '#26890c', shape: '■' }
        ]
      },
      {
        id: 'q-2',
        question: 'Mi a tehetetlenség mértéke a fizikában?',
        timeLimit: 20,
        correctOptionId: 'opt-3',
        options: [
          { id: 'opt-1', text: 'A sebesség', color: '#e21b3c', shape: '▲' },
          { id: 'opt-2', text: 'A térfogat', color: '#1368ce', shape: '◆' },
          { id: 'opt-3', text: 'A test tömege ($m$, kg)', color: '#ffa602', shape: '●' },
          { id: 'opt-4', text: 'A súrlódási együttható ($\\mu$)', color: '#26890c', shape: '■' }
        ]
      }
    ]
  }
];

function parseQuizJson(rawText) {
  if (!rawText) return null;
  const text = rawText.trim();

  const tryParse = (str) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {}
    // 1. Javítás: Ha a LaTeX képletekben csupasz backslashek maradtak (pl. \frac, \cdot, \Delta)
    try {
      const repaired = str.replace(/\\([a-zA-Z0-9_\^\{\}])/g, '\\\\$1');
      return JSON.parse(repaired);
    } catch {}
    // 2. Javítás: Ha a formfeed vagy egyéb vezérlőkarakter sérült
    try {
      const repaired2 = str.replace(/\f/g, '\\f').replace(/\b/g, '\\b');
      return JSON.parse(repaired2);
    } catch {}
    return null;
  };

  // 1. Markdown codeblock (```json ... ``` vagy ``` ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    const p = tryParse(match[1].trim());
    if (p) return p;
  }

  // 2. Közvetlen parse
  const direct = tryParse(text);
  if (direct) return direct;

  // 3. Legkülső kapcsos zárójelek { ... }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const braced = tryParse(text.slice(firstBrace, lastBrace + 1));
    if (braced) return braced;
  }

  return null;
}

export const quizArenaService = {
  async getSavedQuizzes() {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/saved`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.quizzes) {
          localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(json.quizzes));
          return json.quizzes;
        }
      }
    } catch {}
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      return local ? JSON.parse(local) : DEFAULT_QUIZZES;
    } catch {
      return DEFAULT_QUIZZES;
    }
  },

  async saveQuiz(quiz) {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/saved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(json.quizzes));
          return json.quiz;
        }
      }
    } catch {}
    return quiz;
  },

  async deleteQuiz(id) {
    try {
      await fetch(`${API_BASE}/api/quiz-arena/saved/${id}`, { method: 'DELETE' });
    } catch {}
  },

  async generateAiQuiz({
    topic = '',
    questionCount = 3,
    subject = 'Általános',
    sourceMode = 'topic',
    documentText = '',
    documentFile = null
  }) {
    const ARENA_COLORS = ['#e21b3c', '#1368ce', '#ffa602', '#26890c'];
    const ARENA_SHAPES = ['▲', '◆', '●', '■'];
    const count = Math.max(1, Math.min(8, Number(questionCount) || 3));
    const safeTopic = topic ? topic.trim() : (documentFile?.name ? documentFile.name.replace(/\.[^/.]+$/, '') : 'Általános témakör');
    const safeSubject = subject || 'Általános';
    const isDocMode = sourceMode === 'document';

    // 1. Gemini AI direkt kliensoldali generálás, ha van beállított API kulcs
    if (geminiService.hasApiKey()) {
      try {
        const systemInstruction = `Te egy díjnyertes magyar középiskolai szaktanár és interaktív kvízmester vagy (pl. Kahoot, Quizlet, Kvíz Aréna).
Küldetésed: Szakmailag kifogástalan, érdekes, gondolkodtató és valós tanórai 4-válaszos (A, B, C, D) kvízkérdéssort készíteni a megadott tantárgyhoz és témához/dokumentumhoz.

SZIGORÚ PEDAGÓGIAI ÉS TARTALMI SZABÁLYOK:
1. KONKRÉT TARTALMI KÉRDÉSEK (NINCSENEK META-KÉRDÉSEK!):
   - MINDEN kérdésnek konkrét tényre, törvényre, képletre, számítási feladatra, mértékegységre, jelenségre vagy konkrét definícióra KELL rákérdeznie!
   - KIFEJEZETTEN TILOS olyan sablonos, általános "meta-kérdéseket" generálni, mint:
     * "Mi a témakör legfontosabb alapelve vagy definíciója?"
     * "Melyik összefüggés alkalmazható a feladatok megoldásakor?"
     * "Milyen gyakorlati lépéssel ellenőrizhetjük a megoldást?"
     * "Melyik állítás igaz a vizsgálatra?"
   - HELYETTE konkrét szaktárgyi kérdéseket tegyél fel valós fizikai, matematikai, történelmi vagy természettudományos adatokkal!

2. DOKUMENTUM / FORRÁSANYAG ALAPJÁN (ha dokumentum vagy bemásolt szöveg adott):
   - A kérdések és helyes válaszok 100%-ban KÖZVETLENÜL a mellékelt forrásanyagban szereplő konkrét mondatokból, adatokból, fogalmakból, bekezdésekből és kísérletekből származzanak!
   - Kérdezz rá a dokumentumban szereplő kulcsfogalmakra, számértékekre, ok-okozati összefüggésekre és konkrét megállapításokra!
   - TILOS a dokumentum címéből vagy általános külső ismeretekből kérdést feltenni, ha az nincs benne a megadott szövegben!

3. VALÓSÁGHŰ DISZTRAKTOROK (HIBÁS VÁLASZOK):
   - A 3 hibás válaszlehetőség NE legyen abszurd vagy komolytalan sablonszöveg (TILOS az olyan sablon, mint: "kizárólag ellenpéldáknál alkalmazható", "korábban megcáfolt hipotézis", "definíció szerinti helyes állítás")!
   - A hibás válaszok legyenek hihető, életszerű tanulói tévhitek, mértékegység-elírások, előjelhibák vagy rokon, de ide nem illő fogalmak!

4. MATEMATIKAI ÉS FIZIKAI KÉPLETEK (LaTeX):
   - Minden matematikai változót, mértékegységet és képletet LaTeX formátumban, dollárjelek ($...$) közé zárva adj meg!
   - JSON FORMÁTUM MIATT: A LaTeX backslasheket KÖTELEZŐ DUPLÁN írni a JSON-ben (pl. \\\\frac{a}{b}, \\\\cdot, \\\\Delta T, \\\\pi, \\\\alpha, \\\\circ, \\\\binom{n}{k})!

5. VÁLASZOK ÉS IDŐKORLÁT:
   - Pontosan 4 válaszlehetőség kell kérdésenként (opt-1, opt-2, opt-3, opt-4).
   - A helyes válasz pozícióját (correctOptionId) KÖTELEZŐEN variáld a kérdések között, ne mindig ugyanaz legyen (legyen néha opt-1, opt-2, opt-3, opt-4)!
   - Időkorlát: 20 vagy 30 másodperc.

7. FORMAI KÖVETELMÉNYEK A KÉRDÉSSZÖVEGRE:
   - A kérdésekben és válaszokban TILOS hivatkozni a forrásra! Soha ne írd, hogy "a dokumentum szerint", "a szövegben szerepel", "a csatolt anyag alapján", "a forrás említi" stb. A kérdés önállóan, tankönyvi/feladatlapi stílusban szóljon, mintha a tanár saját kérdése lenne.
   - MINDEN matematikai és fizikai szimbólumot, változót, számot mértékegységgel, képletet, törtet, hatványt, indexet, görög betűt és műveleti jelet LaTeX-ben, $...$ között írj (pl. $Q = c \\\\cdot m \\\\cdot \\\\Delta T$, $\\\\frac{J}{kg \\\\cdot K}$, $10^5\\\\,\\\\text{Pa}$, $\\\\alpha$, $\\\\pi$, $90^\\\\circ$, $\\\\sqrt{2}$). Soha ne használj sima szöveges jelölést (pl. "J/(kg*K)", "m^2", "delta T", "pi")!

6. VÁLASZ FORMÁTUMA (KIZÁRÓLAG ÉRVÉNYES JSON):
{
  "title": "${safeTopic} Kvíz",
  "subject": "${safeSubject}",
  "grade": "Általános",
  "questions": [
    {
      "id": "q-1",
      "question": "Konkrét, szaktárgyi kérdés szövege...",
      "timeLimit": 20,
      "correctOptionId": "opt-2",
      "options": [
        { "id": "opt-1", "text": "Konkrét hihető téves válasz 1" },
        { "id": "opt-2", "text": "Konkrét pontos helyes válasz" },
        { "id": "opt-3", "text": "Konkrét hihető téves válasz 2" },
        { "id": "opt-4", "text": "Konkrét hihető téves válasz 3" }
      ]
    }
  ]
}`;

        let prompt = '';
        let parts = null;

        if (isDocMode && documentFile?.base64) {
          // 1. ELSŐDLEGES: A DOKUMENTUM FÁJL KÖZVETLEN ÁTADÁSA (PDF vagy Kép) a Gemini multimodális motorjának
          prompt = `SZIGORÚ UTASÍTÁS: Készíts egy ${count} kérdéses, professzionális tanórai interaktív kvízt a(z) "${safeSubject}" tantárgyból KIZÁRÓLAG a csatolt eredeti forrásdokumentum ("${documentFile.name || 'Dokumentum'}") teljes belső tartalma alapján!

KÖVETELMÉNYEK:
1. KÖZVETLENÜL A CSATOLT DOKUMENTUMBÓL MERÍTS: Minden kérdés és a hozzá tartozó helyes válasz a csatolt dokumentum oldalain, szövegében, táblázataiban, ábráin vagy képleteiben szereplő konkrét tényekre, szabályokra, kísérletekre, adatokra vagy definíciókra kérdezzen rá!
2. TILOS ÁLTALÁNOS META-KÉRDÉSEKET FELTENNI: Szigorúan tilos a címre vagy fájlnévre rákérdezni általánosságban, tilos olyan sablonkérdés, mint "Mi a témakör legfontosabb alapelve?", "Melyik összefüggés alkalmazható?". Minden kérdés érdemi szaktárgyi ismeretről szóljon, a kérdésben NE hivatkozz a dokumentumra/szövegre, és a matematikai jeleket LaTeX-ben ($...$) írd!
3. HITELESSÉG ÉS PONTOSSÁG: A helyes válasz pontosan fedje a dokumentumban közölt tényt vagy összefüggést. A 3 hibás válasz legyen a dokumentum témájához illeszkedő, életszerű diák-tévesztés.
${topic ? `4. KIEMELT TANÁRI FÓKUSZ / MEGJEGYZÉS: "${topic}".` : ''}`;

          parts = [
            {
              inlineData: {
                mimeType: documentFile.type || 'application/pdf',
                data: documentFile.base64
              }
            },
            { text: prompt }
          ];
        } else if (isDocMode && (documentText || documentFile?.text)) {
          // 2. MÁSODLAGOS: Bemásolt szöveges tananyag alapján
          const content = (documentText || documentFile?.text || '').trim();
          prompt = `SZIGORÚ UTASÍTÁS: Készíts egy ${count} kérdéses, színvonalas interaktív kvízt a(z) "${safeSubject}" tantárgyból KIZÁRÓLAG az alábbi bemásolt tananyag szövege alapján!

KÖVETELMÉNYEK:
1. 100%-BAN FORRÁSHŰ KÉRDÉSEK: Minden egyes kérdés és a hozzá tartozó helyes válasz KÖZVETLENÜL az alábbi szövegben található konkrét mondatokból, tényekből, adatokból, összefüggésekből vagy fogalmakból származzon!
2. TILOS ÁLTALÁNOS META-KÉRDÉSEKET FELTENNI: Tilos a címre rákérdezni általánosságban, tilos olyan kérdés, mint "Mi a témakör legfontosabb alapelve?", "Melyik összefüggés alkalmazható?". Minden kérdés érdemi szaktárgyi ismeretről szóljon, a kérdésben NE hivatkozz a szövegre/dokumentumra, és a matematikai jeleket LaTeX-ben ($...$) írd!
3. PONTOSSÁG ÉS HITELESSÉG: A helyes válasz pontosan fedje a szövegben közölt tényt. A 3 téves opció legyen a témához illeszkedő, életszerű diák-tévesztés.
${topic ? `4. KIEMELT TANÁRI FÓKUSZ: "${topic}".` : ''}

--- BEMÁSOLT TANANYAG SZÖVEGE ---
${content}
---------------------------------`;
        } else {
          // Témakör alapú normál generálás
          prompt = `Készíts egy ${count} kérdéses, magas színvonalú, konkrét tanórai interaktív kvízt a(z) "${safeSubject}" tantárgyból a(z) "${safeTopic}" témakörben!
KÖVETELMÉNYEK:
- A kérdések konkrét fogalmakra, számításokra, törvényekre, képletekre, összefüggésekre vagy mértékegységekre kérdezzenek rá, amelyek a(z) "${safeTopic}" tananyagában szerepelnek!
- Tilos általános meta-kérdéseket feltenni (pl. "Mi a témakör legfontosabb alapelve?"). Helyette igazi szaktárgyi kérdéseket fogalmazz meg!
- A hibás válaszok legyenek a témához szorosan kapcsolódó, életszerű tanulói tévesztések!`;
        }

        const responseText = await geminiService.generateContent({
          systemInstruction,
          prompt,
          parts,
          temperature: 0.3,
          maxTokens: 16384,
          thinkingBudget: 0,
          responseMimeType: 'application/json'
        });

        const parsed = parseQuizJson(responseText);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return {
            id: 'ai-quiz-' + Date.now(),
            title: parsed.title || `${safeTopic} (AI Generált)`,
            subject: parsed.subject || safeSubject,
            grade: parsed.grade || 'Általános',
            questions: parsed.questions.slice(0, count).map((q, qIdx) => ({
              id: q.id || `q-${qIdx + 1}`,
              question: ensureQuizLatex(q.question || `${qIdx + 1}. kérdés`),
              timeLimit: Number(q.timeLimit) || 20,
              correctOptionId: q.correctOptionId || 'opt-1',
              options: (Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : [
                { id: 'opt-1', text: '1. opció' },
                { id: 'opt-2', text: '2. opció' },
                { id: 'opt-3', text: '3. opció' },
                { id: 'opt-4', text: '4. opció' }
              ]).map((opt, optIdx) => {
                const rawOptText = typeof opt === 'string' ? opt : (opt.text || `Opció ${optIdx + 1}`);
                return {
                  id: opt.id || `opt-${optIdx + 1}`,
                  text: ensureQuizLatex(rawOptText),
                  color: ARENA_COLORS[optIdx % 4],
                  shape: ARENA_SHAPES[optIdx % 4]
                };
              })
            }))
          };
        } else {
          console.warn('Nem sikerült értelmezni a Gemini JSON válaszát:', responseText?.slice(0, 500));
          throw new Error('Az AI válasza nem volt értelmezhető kvíz-formátum. Kérlek próbáld újra.');
        }
      } catch (geminiError) {
        console.error('Gemini kliensoldali kvíz generálás hiba:', geminiError);
        // Dobjuk fel a konkrét hibát a felhasználónak, hogy ne a sablon mock fusson némán, ha a tanár AI-t kért
        throw new Error(geminiError.message || 'Az AI nem tudott érvényes kvízkérdéseket előállítani.');
      }
    }

    // 2. Fallback a szerver mock/helyi végpontjára
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: safeTopic,
          questionCount: count,
          subject: safeSubject,
          documentName: documentFile?.name || '',
          documentText: documentText || documentFile?.text || ''
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.quiz) {
          return json.quiz;
        }
      }
    } catch {}

    // 3. Helyi tartalmi minta generálása
    return {
      id: 'ai-quiz-' + Date.now(),
      title: `${safeTopic} (Kvíz)`,
      subject: safeSubject,
      grade: 'Általános',
      questions: [
        {
          id: 'q-1',
          question: `Melyik állítás írja le helyesen a(z) "${safeTopic}" lényegét?`,
          timeLimit: 20,
          correctOptionId: 'opt-1',
          options: [
            { id: 'opt-1', text: `A(z) ${safeTopic} alapvető szaktárgyi összefüggéseinek pontos alkalmazása`, color: '#e21b3c', shape: '▲' },
            { id: 'opt-2', text: 'Kizárólag ellenkező feltételezés mellett alkalmazható szabály', color: '#1368ce', shape: '◆' },
            { id: 'opt-3', text: 'A gyakorlati tapasztalatokkal ellentétes feltételezés', color: '#ffa602', shape: '●' },
            { id: 'opt-4', text: 'A számítások során elhanyagolható másodlagos hatás', color: '#26890c', shape: '■' }
          ]
        }
      ]
    };
  },

  async getState(role = 'teacher') {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/state?role=${role}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json;
      }
    } catch {}
    return null;
  },

  async initSession(quiz) {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json;
      }
    } catch {}
    return null;
  },

  async joinSession({ name, pin }) {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin })
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
      const err = await res.json();
      return { success: false, message: err.message || 'Csatlakozási hiba' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  async startSession() {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/start`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async submitAnswer({ playerId, optionId, responseTimeMs }) {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, optionId, responseTimeMs })
      });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async revealAnswer() {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/reveal`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async showLeaderboard() {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/leaderboard`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async nextQuestion() {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/next`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async resetSession() {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/reset`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }
};
