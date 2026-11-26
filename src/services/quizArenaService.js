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
        type: 'multiple-choice',
        question: 'Milyen alakzat az $f(x) = x^2 - 4x + 3$ függvény grafikonja?',
        timeLimit: 15,
        correctOptionId: 'opt-3',
        options: [
          { id: 'opt-1', text: 'Egyenes vonal', color: '#e21b3c', shape: '▲' },
          { id: 'opt-2', text: 'Hiperbola', color: '#1368ce', shape: '◆' },
          { id: 'opt-3', text: 'Felfelé nyíló parabola', color: '#ffa602', shape: '●' },
          { id: 'opt-4', text: 'Lefelé nyíló parabola', color: '#26890c', shape: '■' }
        ]
      },
      {
        id: 'q-4',
        type: 'true-false',
        question: 'Egy valós együtthatós másodfokú egyenletnek lehet 3 különböző valós gyöke.',
        timeLimit: 15,
        correctOptionId: 'opt-false',
        options: [
          { id: 'opt-true', text: 'IGAZ', color: '#26890c', shape: '✓' },
          { id: 'opt-false', text: 'HAMIS', color: '#e21b3c', shape: '✗' }
        ]
      },
      {
        id: 'q-5',
        type: 'numeric',
        question: 'Mennyi a zérushelye az $f(x) = 2x - 14$ függvénynek? Írd be a pontos számértéket!',
        timeLimit: 25,
        correctAnswer: '7',
        tolerance: 0,
        unit: ''
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
    documentFile = null,
    questionTypes = 'mixed' // 'mixed' | 'multiple-choice' | 'true-false' | 'numeric'
  }) {
    const ARENA_COLORS = ['#e21b3c', '#1368ce', '#ffa602', '#26890c'];
    const ARENA_SHAPES = ['▲', '◆', '●', '■'];
    const count = Math.max(1, Math.min(30, Number(questionCount) || 3));
    const safeTopic = topic ? topic.trim() : (documentFile?.name ? documentFile.name.replace(/\.[^/.]+$/, '') : 'Általános témakör');
    const safeSubject = subject || 'Általános';
    const isDocMode = sourceMode === 'document';

    // 1. Gemini AI direkt kliensoldali generálás, ha van beállított API kulcs
    if (geminiService.hasApiKey()) {
      try {
        const activeTypes = Array.isArray(questionTypes)
          ? (questionTypes.length > 0 ? questionTypes : ['multiple-choice', 'true-false', 'numeric'])
          : (questionTypes === 'mixed' ? ['multiple-choice', 'true-false', 'numeric'] : [questionTypes]);

        let typeRule = '';
        if (activeTypes.length === 1) {
          if (activeTypes[0] === 'true-false') {
            typeRule = 'KIZÁRÓLAG "true-false" (Igaz / Hamis) típusú kérdéseket generálj! Minden kérdésnél a "type" mező értéke kötelezően "true-false" legyen.';
          } else if (activeTypes[0] === 'numeric') {
            typeRule = 'KIZÁRÓLAG "numeric" (számolásos, számérték-beírós) típusú kérdéseket generálj! Minden kérdésnél a "type" mező értéke kötelezően "numeric" legyen.';
          } else {
            typeRule = 'KIZÁRÓLAG "multiple-choice" (4-válaszos feleletválasztó) típusú kérdéseket generálj! Minden kérdésnél a "type" mező értéke kötelezően "multiple-choice" legyen 4 opcióval.';
          }
        } else {
          const typeNames = activeTypes.map(t => {
            if (t === 'multiple-choice') return '"multiple-choice" (4-válaszos feleletválasztó)';
            if (t === 'true-false') return '"true-false" (Igaz / Hamis)';
            if (t === 'numeric') return '"numeric" (számolásos numerikus)';
            return `"${t}"`;
          }).join(' és ');
          typeRule = `A kérdéssor KIZÁRÓLAG a következő kijelölt típusokból álljon össze vegyesen: ${typeNames}! Más típust NE generálj, és minden kérdés típusát pontosan tüntesd fel a "type" mezőben!`;
        }

        const systemInstruction = `Te egy díjnyertes magyar középiskolai szaktanár és interaktív kvízmester vagy (pl. Kahoot, Quizlet, Kvíz Aréna).
Küldetésed: Szakmailag kifogástalan, érdekes, gondolkodtató és valós tanórai kvízkérdéssort készíteni a megadott tantárgyhoz és témához/dokumentumhoz.

KÉRDÉSTÍPUSOKRA VONATKOZÓ UTASÍTÁS:
${typeRule}

SZIGORÚ PEDAGÓGIAI ÉS TARTALMI SZABÁLYOK:
1. KONKRÉT TARTALMI KÉRDÉSEK (NINCSENEK META-KÉRDÉSEK!):
   - MINDEN kérdésnek konkrét tényre, törvényre, képletre, számítási feladatra, mértékegységre, jelenségre vagy konkrét definícióra KELL rákérdeznie!
   - KIFEJEZETTEN TILOS olyan sablonos, általános "meta-kérdéseket" generálni, mint "Mi a témakör legfontosabb alapelve?", "Melyik összefüggés alkalmazható?".
   - A kérdések szövegében TILOS hivatkozni a forrásra ("a szöveg szerint", "a dokumentumban"). A kérdés közvetlenül a szaktárgyi tényre kérdezzen rá!

2. KÉRDÉSTÍPUSOK STRUKTÚRÁJA A JSON-BEN:
   - "multiple-choice" típus: pontosan 4 válaszopció (opt-1..opt-4) és a correctOptionId variálása.
   - "true-false" típus: állítás, amelyről el kell dönteni, hogy IGAZ vagy HAMIS. correctOptionId: "opt-true" vagy "opt-false".
   - "numeric" típus: számításos kérdés, ahol a diák konkrét számot ír be. Mezők: "correctAnswer": "42", "tolerance": 0, "unit": "cm".

3. MATEMATIKAI ÉS FIZIKAI KÉPLETEK (LaTeX):
   - Minden matematikai változót, mértékegységet és képletet LaTeX formátumban, dollárjelek ($...$) közé zárva adj meg!
   - JSON FORMÁTUM MIATT: A LaTeX backslasheket KÖTELEZŐ DUPLÁN írni a JSON-ben (pl. \\\\frac{a}{b}, \\\\cdot, \\\\binom{n}{k})!

4. VÁLASZ FORMÁTUMA (KIZÁRÓLAG ÉRVÉNYES JSON):
{
  "title": "${safeTopic} Kvíz",
  "subject": "${safeSubject}",
  "grade": "Általános",
  "questions": [
    {
      "id": "q-1",
      "type": "multiple-choice",
      "question": "Konkrét szaktárgyi kérdés szövege...",
      "timeLimit": 20,
      "correctOptionId": "opt-2",
      "options": [
        { "id": "opt-1", "text": "Hihető téves válasz 1" },
        { "id": "opt-2", "text": "Pontos helyes válasz" },
        { "id": "opt-3", "text": "Hihető téves válasz 2" },
        { "id": "opt-4", "text": "Hihető téves válasz 3" }
      ]
    },
    {
      "id": "q-2",
      "type": "true-false",
      "question": "Konkrét szaktárgyi állítás...",
      "timeLimit": 15,
      "correctOptionId": "opt-true"
    },
    {
      "id": "q-3",
      "type": "numeric",
      "question": "Számítási feladat szövege... Mennyi a végeredmény?",
      "timeLimit": 30,
      "correctAnswer": "12",
      "tolerance": 0,
      "unit": ""
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
            questions: parsed.questions.slice(0, count).map((q, qIdx) => {
              const qType = (q.type === 'true-false' || q.type === 'numeric') ? q.type : 'multiple-choice';
              const baseQ = {
                id: q.id || `q-${qIdx + 1}`,
                type: qType,
                question: ensureQuizLatex(q.question || `${qIdx + 1}. kérdés`),
                timeLimit: Number(q.timeLimit) || 20
              };

              if (qType === 'true-false') {
                const isTrue = q.correctOptionId === 'opt-true' || q.correctOptionId === true || String(q.correctAnswer).toLowerCase() === 'igaz' || String(q.correctAnswer).toLowerCase() === 'true';
                return {
                  ...baseQ,
                  correctOptionId: isTrue ? 'opt-true' : 'opt-false',
                  options: [
                    { id: 'opt-true', text: 'Igaz', color: '#26890c', shape: '✓' },
                    { id: 'opt-false', text: 'Hamis', color: '#e21b3c', shape: '✗' }
                  ]
                };
              }

              if (qType === 'numeric') {
                return {
                  ...baseQ,
                  correctAnswer: Number(q.correctAnswer) || 0,
                  tolerance: Number(q.tolerance) || 0,
                  unit: q.unit || '',
                  options: []
                };
              }

              // multiple-choice
              return {
                ...baseQ,
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
              };
            })
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

  async submitAnswer({ playerId, optionId, numericAnswer, responseTimeMs }) {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, optionId, numericAnswer, responseTimeMs })
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
  },

  async getReport() {
    try {
      const res = await fetch(`${API_BASE}/api/quiz-arena/report`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json;
      }
    } catch {}
    return null;
  }
};

/**
 * Excel-kompatibilis CSV exportáló segédfüggvény UTF-8 BOM karakterrel
 */
export function exportQuizResultsToCsv({ quiz, players = [], answersHistory = {} }) {
  const questions = quiz?.questions || [];

  // Fejléc oszlopok
  const headers = ['Helyezés', 'Diák neve', 'Összpontszám', 'Helyes válaszok', 'Kérdések száma', 'Átlagos válaszidő (mp)'];
  questions.forEach((q, idx) => {
    headers.push(`${idx + 1}. kérdés válasz`, `${idx + 1}. kérdés pont`, `${idx + 1}. kérdés idő (mp)`);
  });

  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const rows = sorted.map((p, idx) => {
    let correctCount = 0;
    let totalTimeMs = 0;
    let answeredCount = 0;

    const qCols = [];
    questions.forEach((q, qIdx) => {
      const resp = (answersHistory?.[qIdx] || []).find(r => r.playerId === p.id);
      if (resp) {
        answeredCount++;
        if (resp.isCorrect) correctCount++;
        totalTimeMs += (resp.responseTimeMs || 0);

        let ansText = '';
        if (q.type === 'numeric') {
          ansText = `${resp.numericAnswer !== undefined ? resp.numericAnswer : ''} ${q.unit || ''}`.trim();
        } else {
          const opt = (q.options || []).find(o => o.id === resp.optionId);
          ansText = opt?.text || resp.optionId || '-';
        }
        ansText = ansText.replace(/"/g, '""');
        qCols.push(`"${ansText}"`, resp.points || 0, ((resp.responseTimeMs || 0) / 1000).toFixed(1));
      } else {
        qCols.push('"Nem válaszolt"', 0, '-');
      }
    });

    const avgTimeSec = answeredCount > 0 ? ((totalTimeMs / answeredCount) / 1000).toFixed(1) : '-';

    return [
      idx + 1,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.score || 0,
      correctCount,
      questions.length,
      avgTimeSec,
      ...qCols
    ].join(';');
  });

  // UTF-8 BOM (\uFEFF) a helyes magyar ékezetekhez Excelben
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanTitle = (quiz?.title || 'kviz').replace(/[^a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ_-]/g, '_');
  link.setAttribute('download', `Schola_Kviz_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gemini AI Típushiba- és pedagógiai diagnózis generálása
 */
export async function analyzeMisconceptionsWithAi({ quizTitle, questions, players, answersHistory }) {
  const questionSummaries = questions.map((q, idx) => {
    const responses = answersHistory?.[idx] || [];
    const total = responses.length;
    const correct = responses.filter(r => r.isCorrect).length;
    const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;

    let details = '';
    if (q.type === 'numeric') {
      const wrongValues = responses.filter(r => !r.isCorrect).map(r => r.numericAnswer).filter(v => v !== undefined);
      details = `Típus: Számításos (Helyes: ${q.correctAnswer} ${q.unit || ''}, Tolerancia: ±${q.tolerance || 0}). Diákok téves válaszai: [${wrongValues.slice(0, 10).join(', ')}]`;
    } else {
      const optSummary = (q.options || []).map(opt => {
        const c = responses.filter(r => r.optionId === opt.id).length;
        const mark = (opt.id === q.correctOptionId) ? '[HELYES]' : '[TÉVES]';
        return `"${opt.text}" (${mark}): ${c} diák`;
      }).join('; ');
      details = `Típus: ${q.type || 'feleletválasztó'}. Válaszok megoszlása: ${optSummary}`;
    }

    return `${idx + 1}. Kérdés: "${q.question}" | Sikerességi arány: ${successRate}% (${correct}/${total} helyes) | ${details}`;
  }).join('\n');

  const prompt = `Pedagógiai és szaktárgyi elemzést készíts a tanár számára egy lezajlott Schola Kvíz Aréna vetélkedőről!
Kvíz címe: "${quizTitle}"
Résztvevők száma: ${players.length} diák

A kérdések és a diákok válaszai / statisztikái:
${questionSummaries}

Kérlek, strukturált JSON formátumban válaszolj az alábbi mezőkkel:
{
  "summary": "1-2 bekezdéses átfogó pedagógiai értékelés az osztály teljesítményéről, felkészültségéről és a tanóra sikerességéről.",
  "hardestQuestions": [
    {
      "questionNumber": 1,
      "misconception": "Mi volt a tipikus tévedés vagy rossz gondolatmenet a diákok körében ennél a kérdésnél?",
      "pedagogicalAdvice": "Konkrét tanári javaslat: hogyan érdemes elmagyarázni, milyen szemléltetéssel vagy példával lehet tisztázni ezt a fogalmat/számítást a következő órán."
    }
  ],
  "recommendations": [
    "3-4 konkrét, pontokba szedett tanári teendő vagy ismétlési javaslat a felmerült hiányosságok pótlására."
  ]
}`;

  const responseText = await geminiService.generateContent({
    prompt,
    temperature: 0.3,
    responseMimeType: 'application/json'
  });

  try {
    return JSON.parse(responseText);
  } catch (e) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return {
      summary: responseText,
      hardestQuestions: [],
      recommendations: []
    };
  }
}
