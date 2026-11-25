/**
 * Math Exam Skill & Multi-Step Workflow
 * Magyar NAT kompatibilis matematika dolgozat- és javítókulcs-generátor munkafolyamat.
 */

import { geminiService } from '../geminiService';

const SYSTEM_INSTRUCTION = `Te egy mesterfokozatú, több évtizedes tapasztalattal rendelkező magyar középiskolai vezető matematikatanár és érettségi elnök vagy.
Küldetésed: Precíz, a hatályos magyar Nemzeti Alaptantervnek (NAT) és az Oktatási Hivatal érettségi követelményrendszerének maradéktalanul megfelelő dolgozatok, A/B csoportok és javítókulcsok összeállítása.

SZIGORÚ SZAKMAI ÉS JELÖLÉSBELI SZABÁLYOK:
1. Magyar matematikai jelölésrendszer kötelező:
   - Tangens: \\operatorname{tg} vagy tg (NEM tan)
   - Kotangens: \\operatorname{ctg} vagy ctg (NEM cot)
   - Tízes alapú logaritmus: \\lg (NEM log10)
   - Természetes logaritmus: \\ln
   - Tizedesvessző használata a számoknál (pl. 2,5 és nem 2.5)
   - Képletek LaTeX szintaxissal ($...$ vagy $$...$$) legyenek szedve!
2. Differenciálás 3 szinten:
   - Alapozó / Felzárkóztató: közvetlen definíciók és azonosságok alkalmazása.
   - Középszint: szöveges feladatok, összefüggések felismerése, érettségi típuspéldák.
   - Emelt szintű kihívás: paraméteres, geometriai bizonyítás vagy kombinatorikus logika.
3. A és B csoport:
   - Azonos nehézségű, analóg felépítésű, de eltérő numerikus adatokkal és változókkal rendelkező feladatsorok a másolás megelőzésére.
4. Javítókulcs és hibajelzés:
   - Minden feladathoz lépésenkénti részpontozás (pl. képlet felírása: 1p, átrendezés: 1p, helyes végeredmény: 1p).
   - Jelöld meg a tipikus diákhibákat (pl. kikötés / értelmezési tartomány elhagyása, hamis gyökök, előjelhiba).`;

export const mathExamSkill = {
  /**
   * Lefuttatja a többlépcsős dolgozattervező munkafolyamatot
   * @param {Object} params
   * @param {string} params.topic Témakör (pl. "Másodfokú egyenletek és függvények")
   * @param {string} params.grade Évfolyam (pl. "10. évfolyam")
   * @param {number} params.durationMinutes Megírási időtartam (pl. 45 perc)
   * @param {boolean} params.hasABGroups Legyen-e A és B csoport
   * @param {string} params.customInstructions Egyedi tanári kérések
   * @param {function} onStepUpdate Állapotfrissítő visszahívás
   */
  async generateExamWorkflow({
    topic,
    grade = '10. évfolyam',
    durationMinutes = 45,
    hasABGroups = true,
    customInstructions = '',
    onStepUpdate = () => {}
  }) {
    if (!geminiService.hasApiKey()) {
      throw new Error('Nincs beállítva Gemini API kulcs! Kérlek add meg a Beállítások menüben.');
    }

    // 1. Lépés: Tervezés és Kompetencia Térkép
    onStepUpdate({ step: 1, label: 'Tanmenet elemzése és részkompetenciák felbontása...' });

    const prompt = `Készíts komplett, azonnal sokszorosítható és kiosztható magyar matematika dolgozatot és javítókulcsot az alábbi paraméterekkel:

- **Témakör:** ${topic}
- **Évfolyam:** ${grade}
- **Rendelkezésre álló idő:** ${durationMinutes} perc
- **Csoportok:** ${hasABGroups ? 'A és B csoport párhuzamosan' : 'Egyetlen egységes feladatsor'}
${customInstructions ? `- **Egyedi tanári szempont:** ${customInstructions}` : ''}

KÉRLEK A KÖVETKEZŐ STRUKTÚRÁBAN ADD MEG A VÁLASZT:

# ${topic} – Dolgozat (${grade})
*Megírási idő: ${durationMinutes} perc • Összpontszám: [X] pont*

---

## 1. Részkompetenciák és Célok (Tanári Vázlat)
- Felsorolás a mért kompetenciákról (fogalmak, számítási készségek, szövegértés).

---

## 2. Feladatsor: "A" Csoport
(Minden feladat mellett szerepeljen a maximális pontszám, és legyen differenciálva: 1. Alapozó, 2. Középszint, 3. Összetett/Emelt)

${hasABGroups ? `
---

## 3. Feladatsor: "B" Csoport
(Az "A" csoporttal azonos nehézségű, analóg feladatok módosított adatokkal)
` : ''}

---

## ${hasABGroups ? '4' : '3'}. Részletes Javítókulcs és Pontozási Útmutató
- Lépésről lépésre levezetett megoldások LaTeX formátumban.
- Részpontozási szabályzat (mit ér a részeredmény).

---

## ${hasABGroups ? '5' : '4'}. Tipikus Diákhibák és Tanári Figyelmeztetések
- Milyen buktatókra figyeljünk a javításkor (pl. értelmezési tartomány, hamis gyökök kizárása, előjelhiba).
`;

    onStepUpdate({ step: 2, label: 'A és B csoportos feladatok összeállítása és LaTeX formázás...' });

    const generatedMarkdown = await geminiService.generateContent({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt,
      temperature: 0.5,
      maxTokens: 8192
    });

    onStepUpdate({ step: 3, label: 'Javítókulcs és részpontozás ellenőrzése kész!' });

    return {
      topic,
      grade,
      durationMinutes,
      hasABGroups,
      markdown: generatedMarkdown,
      createdAt: new Date().toISOString()
    };
  }
};
