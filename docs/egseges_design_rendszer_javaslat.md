# 🎨 Schola — Egységes Design Rendszer & Irányelvek (Design System v1.0)

> **Cél:** A Schola teljes felületén (Vezérlőpult, Dolgozat Radar, Osztályfőnök, Katedra AI, Órarend, Csoportok, Tanári Eszközök és Classroom Screen) meglévő dizájnbeli eltérések megszüntetése, valamint egy szilárd, skálázható vizuális és komponens-rendszer felállítása a jövőbeli fejlesztésekhez.

---

## 🔍 1. Jelenlegi Helyzetkép & Problémák Elemzése

A kódbázis mélyreható auditja során az alábbi kulcsproblémákat tártuk fel:
1. **Extrém magas inline stílus használat:** A React komponensekben több mint **2570 helyen** található egyedi `style={{ ... }}` attribútum, ami megnehezíti a rendszerszintű karbantartást.
2. **Széttöredezett színpaletta:** Több mint 35 különböző hardkódolt színérték (pl. `#18181b`, `#0f172a`, `#e21b3c`, `#1368ce`, `#3b82f6`, `#cc0000`) van közvetlenül a komponensekbe drótozva.
3. **Kiszámíthatatlan lekerekítések (Border Radius):** Néhány gombon 6px, máshol 8px, 10px, 12px, 20px vagy 9999px (pill) szerepel.
4. **Sötét mód inkonzisztenciák:** Az inline módon megadott fix `#ffffff` és `#18181b` háttérszínek miatt bizonyos modálok és kártyák sötét módban nehezen olvashatók vagy kilógnak a vizuális környezetből.

---

## 🎯 2. Hivatalos Fejlesztői Javaslat: „Modern Academic Zinc”

A 3 kidolgozott opció közül a pedagógusi felhasználási szokásokhoz és a szoftver funkcióihoz a **Modern Academic Zinc** irányzatot javasoljuk:

### Miért ez a legjobb választás?
- **Olvashatóság & Alacsony szemfáradás:** A tanárok naponta 4-8 órát töltenek a felület előtt. A semleges, visszafogott cink-szürke (Zinc/Slate) háttér nem vakít, mégis kontrasztos.
- **Tökéletes Kivetíthetőség (Projector-friendly):** A tantermi projektorok gyakran alacsonyabb kontrasztarányúak és fakóbbak. A tiszta 1px-es határolóvonalak és a 10px-es kártyarádiusz gyenge fényviszonyok között is határozottan elválasztja a tartalmakat.
- **Fókusz és Hierarchia:** Az információ (órarend, határidők, hiányzások) van a fókuszban, az akcentusszín (pl. *Schola Indigo `#4f46e5`* vagy *Crimson Red `#dc2626`*) kizárólag a kiemelést és a műveletre hívást (Call-to-Action) szolgálja.

---

## 🌐 3. Interaktív Döntéstámogató Munkafüzet

Elkészült egy önálló, böngészőben közvetlenül futtatható és tesztelhető interaktív HTML alkalmazás:
- **Elérési út a projektben:** `docs/design_system_preview.html` és `public/design_system_preview.html`
- **Megnyitás böngészőben:**
  - Közvetlenül a terminálból: `open docs/design_system_preview.html`
  - Vagy a futó Vite dev szerveren keresztül: `http://localhost:5173/design_system_preview.html`

### Az interaktív dokumentumban tesztelhető opciók:
1. **3 előre összeállított stílusirányzat:**
   - **Academic Zinc (Ajánlott):** Modern SaaS / Linear stílus, 10px rádiusz, precíz kontúrok.
   - **Warm Nordic:** Meleg törtfehér tónusok, 14px puhább kerekítés, barátságos hangulat.
   - **Swiss Modern:** Éles 6px geometriák, JetBrains Mono tipográfia, markáns monokróm kontraszt.
2. **Akcentusszín paletták:** Schola Indigo, Crimson Red, Sky Blue, Emerald Green, Warm Amber, Slate.
3. **Valós idejű komponens tesztek:** Gombok (méretek és állapotok), Státusz badge-ek, Érdemjegy pill-ek, Kereső- és form mezők, Dolgozat kártya, Okos értesítés banner, Minta Modál.
4. **Teljes Schola Alkalmazás Élő Szimulációja:** Képernyő előnézet oldalsávval, órarenddel és OFŐ radarral.
5. **Dinamikus CSS Token Generátor:** A kiválasztott opciók alapján azonnal másolható `:root` változók generálódnak.

---

## 🛠️ 4. Bevezetési és Átállási Menetrend (Roadmap)

Az egységesítés lépései anélkül hajthatók végre, hogy az alkalmazás üzleti logikája sérülne:

1. **1. Fázis: Globális Tokenek Integrálása (`src/index.css`):**
   - A meglévő `:root` és `:root.dark` változók bővítése a generált `--sys-*` tokenekkel.
2. **2. Fázis: Alap UI Primitívek Létrehozása (`src/components/ui/`):**
   - `<Button variant="primary|secondary|outline|ghost|danger" size="sm|md|lg">`
   - `<Card elevation="none|sm|md" padding="sm|md|lg">`
   - `<Badge variant="success|warning|danger|info|neutral">`
   - `<Input />`, `<Select />`, `<ToggleSwitch />`
   - `<Modal isOpen onClose title footer>`
3. **3. Fázis: Modulok Lépcsőzetes Egységesítése:**
   - 1. Vezérlőpult és Widgetek
   - 2. Dolgozat Radar (`Exams.jsx`)
   - 3. Osztályfőnöki Felület (`HeadTeacher.jsx`)
   - 4. Katedra AI és Beállítások
   - 5. Tanári Eszközök és Órarend
   - 6. Classroom Screen és Interaktív modulok külső keretei.
