import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/extract-text", upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nincs fájl feltöltve" });
      }

      let text = "";
      if (req.file.mimetype === "application/pdf") {
        const data = await pdf(req.file.buffer);
        text = data.text;
      } else if (req.file.mimetype === "text/plain") {
        text = req.file.buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Nem támogatott fájlformátum (csak PDF és TXT)" });
      }

      res.json({ text: text.slice(0, 10000) }); // Limit to 10k chars for prompt safety
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: "Hiba a szöveg kinyerése közben" });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { tool, topic, grade, additionalInfo, sourceText, profile } = req.body;

      let systemPrompt = "";
      let userPrompt = "";

      const profileContext = profile ? `A felhasználó profilja: Tanár neve: ${profile.name || 'Ismeretlen'}, Iskola: ${profile.schoolName || 'Nincs megadva'}, Tanított tárgyak: ${profile.subjects?.join(', ') || 'Nincs megadva'}. Osztályfőnök: ${profile.isHomeroomTeacher ? 'Igen' : 'Nem'}.` : '';

      if (tool === 'LESSON_PLANNER') {
        systemPrompt = "Te egy tapasztalt tanár vagy. Készíts részletes óratervet magyar nyelven. Használj strukturált Markdown formázást, beleértve táblázatokat az időbeosztáshoz vagy feladatokhoz. A matematikai képleteket és fizikai egyenleteket LaTeX formátumban add meg (használj $...$ jeleket a soron belüli, és $$...$$ jeleket a kiemelt képletekhez). " + profileContext;
        userPrompt = `Téma: ${topic}, Évfolyam: ${grade}. Kiegészítő infó: ${additionalInfo || 'Nincs'}. Az óraterv tartalmazza a bevezetőt, a fő részt szemléltető példákkal, és az összefoglalást. Használj Markdown formázást és táblázatokat ahol indokolt.`;
      } else if (tool === 'EXERCISE_GENERATOR') {
        systemPrompt = "Te egy profi feladatíró vagy. Készíts 5-10 feladatot megoldással együtt. Használj táblázatokat az adatok közléséhez, ha az segíti az átláthatóságot. A matematikai képleteket és fizikai egyenleteket LaTeX formátumban add meg (használj $...$ jeleket a soron belüli, és $$...$$ jeleket a kiemelt képletekhez). " + profileContext;
        userPrompt = `Téma: ${topic}, Szint: ${grade}. Kiegészítő infó: ${additionalInfo || 'Nincs'}. A feladatok legyenek változatosak és sorrendben nehezedjenek. A végén adj meg részletes megoldókulcsot. Használj táblázatokat az adatok szemléltetéséhez ha szükséges.`;
      } else if (tool === 'CONCEPT_EXPLAINER') {
        systemPrompt = "Te egy kiváló pedagógus vagy, aki egyszerűen, érthetően tud elmagyarázni bonyolult jelenségeket. A matematikai képleteket és fizikai egyenleteket LaTeX formátumban add meg (használj $...$ jeleket a soron belüli, és $$...$$ jeleket a kiemelt képletekhez). " + profileContext;
        userPrompt = `Magyarázd el a következő fogalmat: ${topic}. Célközönség korosztálya: ${grade}. Használj hétköznapi példákat és hasonlatokat.`;
      } else if (tool === 'EXPERIMENT_GUIDE') {
        systemPrompt = "Te egy tapasztalt szaktanár vagy. Készíts részletes kísérleti jegyzőkönyvet vagy útmutatót. Tartalmazza: cél, szükséges eszközök, a kísérlet menete, várható tapasztalatok és magyarázat. Használj LaTeX-et a képleteket tartalmazó részeknél. " + profileContext;
        userPrompt = `Kísérlet témája: ${topic}, Évfolyam: ${grade}. Kiegészítő infó: ${additionalInfo || 'Nincs'}.`;
      } else if (tool === 'CURRICULUM_PLANNER') {
        systemPrompt = "Te egy oktatás-tervezési szakértő vagy. Tervezd meg a tanmenetet a Nemzeti Alaptanterv (NAT) irányelvei szerint. Készíts egy strukturált ütemtervet hetekre lebontva, kizárólag Markdown táblázat formátumban. " + profileContext;
        userPrompt = `Témakör: ${topic}, Évfolyam: ${grade}, Óraszám: ${additionalInfo || 'Heti 2 óra'}. Készíts féléves vagy éves ütemtervet részletes táblázatos formában Markdown segítségével. Oszlopok: Hét, Témakör, Kulcsfogalmak, Módszertan.`;
      } else if (tool === 'HOMEROOM_ASSISTANT') {
        systemPrompt = "Te egy tapasztalt, empatikus osztályfőnök vagy. Segíts adminisztratív és pedagógiai feladatokban: szülői értekezlet vázlat, tanulói jellemzés (erősségek és fejlesztendő területek), konfliktuskezelési tanácsok, osztályfőnöki óravázlat (érzékenyítő, közösségépítő), vagy osztálykirándulás tervezés. Használj táblázatokat az adminisztratív listákhoz. " + profileContext;
        userPrompt = `Feladat: ${topic}, Osztály/Korosztály: ${grade}. Kontextus: ${additionalInfo || ''}. Kérlek készíts részletes, gyakorlatias választ.`;
      } else if (tool === 'METHODOLOGY_GUIDE') {
        systemPrompt = "Te egy innovatív pedagógiai szakértő vagy. Magyarázz meg modern tanítási módszereket (pl. drámapedagógia, projektmódszer, gamifikáció, fordított osztályterem, kooperatív tanulás) és adj gyakorlati tippeket az alkalmazáshoz. Használj Markdown formázást. " + profileContext;
        userPrompt = `Módszer/Téma: ${topic}, Célcsoport: ${grade}. Kiegészítő infó: ${additionalInfo || ''}. Mutasd be a módszer lényegét, előnyeit és egy konkrét órai megvalósítási ötletet.`;
      } else if (tool === 'PSYCHOLOGY_ADVISOR') {
        systemPrompt = "Te egy tapasztalt iskolapszichológus vagy. Adj tanácsot nevelési kérdésekben, tanulói motivációval, sajátos nevelési igényű (SNI) tanulók integrációjával, konfliktuskezeléssel vagy a pedagógus kiégésének megelőzésével kapcsolatban. Válaszaid legyenek empatikusak, támogatóak és szakmailag megalapozottak. " + profileContext;
        userPrompt = `Kérdés/Helyzet: ${topic}, Érintett korosztály: ${grade}. Kontextus: ${additionalInfo || ''}. Kérlek adj konkrét tanácsokat és nézőpontokat a helyzet kezeléséhez.`;
      } else if (tool === 'CLASS_MANAGER') {
        systemPrompt = "Te egy oktatásszervezési asszisztens vagy. Segíts csoportbontásban, ülésrend tervezésében vagy differenciált feladatok kiosztásában a megadott névsor alapján. " + profileContext;
        userPrompt = `Feladat: ${topic}, Névsor/Adatok: ${sourceText || 'Nincs névsor megadva'}. Osztály: ${grade}. Extra kérés: ${additionalInfo || ''}.`;
      }

      if (sourceText) {
        userPrompt += `\n\nKÉRLEK HASZNÁLD AZ ALÁBBI FORRÁSANYAGOT IS A GENERÁLÁSHOZ:\n${sourceText}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      res.json({ content: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
