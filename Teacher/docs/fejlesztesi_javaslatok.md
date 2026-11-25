# 🚀 Teacher Assistant & Schola - Jövőbeli Fejlesztési és Innovációs Javaslatok

> **Rendszer Státusz:** Egyesült platform a **Schola** (Digitális Tanári Műszerfal) égisze alatt.  
> **Központi dokumentum:** 🔗 [Schola Fejlesztési Javaslatok (docs/fejlesztesi_javaslatok.md)](file:///Users/vargadavid/Documents/Projektek/Schola/docs/fejlesztesi_javaslatok.md)  
> **Utolsó átfogó frissítés:** 2026. november 24. (v3.0 – Schola Unified Edition)

---

## ✅ Megvalósított Funkciók (Átfogó Leltár)

### ~~1. Kréta "Oda-Vissza" Névsor-Szinkronizáció (Scraper)~~ — KÉSZ ✅
A Playwright headless böngészőmotor és a Chrome bővítmény automatikusan kiolvassa a Kréta Naplóból a diákok névsorát, csoportjait, tantárgyait, session mentéssel (`kreta_session.json`).

### ~~2. Hangalapú Osztályzás (Voice-to-Grade AI)~~ — KÉSZ ✅
A natív böngészős Speech-to-Text API-val diktált szöveget a Gemini AI elemzi, a Fuzzy-Match összepárosítja a diáknevekkel, és automatikusan rögzíti az eredményeket.

### ~~7. Pluszpont Rendszer (Plus Points)~~ — KÉSZ ✅
Órai aktivitás nyilvántartó mikroalkalmazás: egykattintásos plusz adás, 3 plusz összegyűjtésénél "KIGYŰLT!" jelzés, nullázási és értékelési történettel.

### ~~8. Intelligens Órarend-Vezérelt Szkennelés & Dashboard~~ — KÉSZ ✅
Az órarend szinkronizálódik a Krétából. A rendszer pontosan tudja, melyik osztálynál jár a tanár, a "Folyamatban lévő" és "Következő óra" blokk minden fontos adatot azonnal mutat.

### ~~13. Offline-First és Felhő Szinkronizáció~~ — KÉSZ ✅
A helyi perzisztencia (IndexedDB / LocalStorage) révén az app hálózati kimaradás esetén is működik, és visszatéréskor szinkronizál.

### ~~15. Multi-User & Kréta Hitelesítés~~ — KÉSZ ✅
Izolált felhasználói munkamenetek, védett adatterek és Kréta automatikus belépési munkamenet-megőrzés.

### ~~Ponthatár Számító (Grade Calculator) & Sablon Rendszer~~ — KÉSZ ✅
(#17) Mikroalkalmazás: max pontszám és százalékos küszöbök alapján érdemjegy-ponthatárok generálása lefelé, felfelé vagy matematikai kerekítéssel, menthető sablonokkal.

### ~~Szerencsekerék & Diáksorsoló (Random Picker)~~ — KÉSZ ✅
Látványos névválasztó feleltetéshez radiális feliratozással, feleltek nyilvántartásával, widgetként és önálló eszközként is.

### ~~Csoportbontó (Team Generator)~~ — KÉSZ ✅
Véletlenszerű csapatgenerátor csoportlétszám vagy csapatszám alapján, menthető projekt felosztásokkal.

### ~~29. Zajszint-mérő~~ — KÉSZ ✅ (Classroom Screen)
Mikrofon alapú valós idejű hangerő-visszajelzés Web Audio API-val, zöld/sárga/piros szintekkel, kivetíthető a projektoron.

### ~~32. Okos Stopper & Időzítő~~ — KÉSZ ✅ (Classroom Screen, Teacher Tools & MiniTimer)
Többfázisú időzítő feladatokhoz és stopper hangjelzéssel, widgetként a vezérlőpulton és prezentációs módban a nagykijelzőn is.

### ~~34. Fényjelző & Munkamód (Traffic Light)~~ — KÉSZ ✅ (Classroom Screen WorkMode)
Vizuális szabályjelző felület projektorra: Csend, Suttogás, Megbeszélés és Csoportmunka állapotok kivetítése.

### ~~36. Hiányzás-monitor & Limitfigyelő~~ — KÉSZ ✅ (HeadTeacher modul)
Figyelmeztetés kritikus hiányzási óráknál (10, 30 óra igazolatlan) és a 250 órás határnál az Osztályfőnöki Irányítópulton.

### ~~46. Születésnap & Névnap Emlékeztető~~ — KÉSZ ✅ (HeadTeacher modul + Magyar Névnaptár)
Reggeli és heti jelzés a diákok köszöntéséhez születésnap és a beépített magyar névnaptár (`nameDays.json`) alapján.

### ~~51. Napi Bölcsesség & Idézetek~~ — KÉSZ ✅ (Dashboard QuoteWidget)
Pedagógiai tippek vagy motiváló idézetek megjelenítése Tanári / Diák módban naponta frissülve.

---

## 🆕 Újonnan Megvalósult Rendszerek (v3.0 Schola Frissítés)

### ~~19. Intelligens Értesítési Motor (Smart Notification Engine - SNE)~~ — KÉSZ ✅
A passzív felugró ablakok helyett egy **proaktív, kontextustudatos digitális asszisztens motor** (`smartNotificationEngine.js`):
- **Dolgozatjavítási figyelmeztető:** Sárga/piros riasztás, ha egy dolgozat javítása közeledik a jogszabályi 14 napos határidőhöz.
- **Katedra AI & Órarendi előkészület:** Javaslatot tesz a következő órára bemelegítő feladatsor vagy óraterv generálására.
- **Sürgős teendők:** Kiemeli a mai/magas prioritású határidős feladatokat.
- **Névnapi köszöntés:** Automatikusan jelzi a mai névnaposokat a diákok és kollégák köszöntéséhez.
- **Tanári Jóllét (Hidratáció):** Folyadékbeviteli emlékeztető 1-kattintásos ivásrögzítéssel (`+250 ml`).
- **UI Integráció:** Kiemelt Dashboard Banner (`SmartNotificationBanner.jsx`), Oldalsáv értesítési harang élő jelvénnyel (badge), és csúsztatható Értesítési Központ fiók (`NotificationDrawer.jsx`) szűrőkkel, elhalasztással (Snooze) és elrejtéssel.

### ~~Katedra AI Szakmai Munkaállomás~~ — KÉSZ ✅
- Matematika, fizika és általános tantárgyi AI asszisztens Google Gemini motorral.
- 45 perces óraterv generátor, feladatsor- és dolgozatkészítő, differenciálási módszertan, lépésről lépésre feladatlevezető és hibakereső.
- Saját API kulcs kezelés (BYOK) és specializált prompt-motor (`mathExamSkill.js`).

### ~~Dolgozat Radar (Exams modul)~~ — KÉSZ ✅
- Dolgozatok tervezése, fáziskövetése (`Tervezett` → `Javítás alatt` → `Kész`), csoportszűrés, átlagszámítás és statisztikák.
- **Beépített AI Dolgozat Generátor:** Téma, évfolyam, nehézség és dolgozat-típus alapján komplett tesztlap és javítókulcs készítés egy kattintással.

### ~~Classroom Screen (Kivetíthető Tantermi Képernyő)~~ — KÉSZ ✅
- Projektorra/okostáblára méretezett prezentációs munkaterület lebegő ablakokkal.
- **Interaktív Faliújság (Padlet modul):** Valós idejű közös digitális faliújság. A diákok QR-kód beolvasásával a telefonjukról, belépés nélkül beküldhetnek színes öntapadós jegyzeteket (post-it), amelyek élőben megjelennek a táblán.
- Szabadkézi Rajztábla (`DrawingWidget`), QR-Kód generáló (`QRCodeWidget`), Csoportkészítő, Munkamód jelző, Időzítő, Óra, Szövegdoboz és egyedi/animált háttérválasztó.

### ~~Osztályfőnöki Irányítópult (HeadTeacher)~~ — KÉSZ ✅
- 250 órás limit és igazolatlan hiányzások monitorozása.
- Osztálypénz és projekt befizetés követő (kirándulás, színház, osztálypénz státusz).
- Dicséretek és intők adminisztrációja, OFŐ óraterv és jegyzetek.

### ~~Dinamikus Vezérlőpult (Dashboard 2.0)~~ — KÉSZ ✅
- 3-oszlopos Masonry grid, 2D átméretezés, Drag & Drop átrendezés.
- 15+ widget: Élő Open-Meteo Időjárás, Tanév rendje szerinti Vakáció-számláló, Szokáskövető, Hidratáció, Diáksorsoló, Mini-Timer, Todo modál, Post-it, Könyvjelzők, Kréta üzenetek és órarendi blokk.

---

## 🔮 Jövőbeli Innovációs Fejlesztési Javaslatok

---

### I. Kétirányú Kréta Automatizáció & Naplózás (Write-Back)

#### 68. Egykattintásos Óranaplózás (Lesson Logger)
- Az Órarendben és a Dashboard "Folyamatban lévő óra" kártyáján megjelenik az **"Óra Naplózása"** gomb.
- A felugró ablakban a tanár beírja az óra témáját (vagy a Katedra AI által javasolt tanmeneti témát választja).
- A háttérben futó Playwright robot megnyitja a Krétát, kiválasztja az órát, beírja a témát, és sikeres visszajelzést ad.

#### 69. Gyors Jelenlét & Hiányzás Beküldés a Krétába (Attendance Sync)
- A Classroom Screenen vagy a Dashboardon a tanár egyetlen érintéssel jelöli a hiányzókat és későket.
- Egy "Kréta Beküldés" gombbal a robot azonnal rögzíti a hiányzókat a hivatalos e-naplóban, kiküszöbölve a lassú Kréta oldalbetöltéseket.

#### 70. Tömeges Jegybeírás a Dolgozat Radarból
- A Dolgozat Radar felületén rögzített pontszámokat a rendszer automatikusan érdemjegyekké alakítja (a Ponthatár kalkulátor beállított küszöbei szerint).
- Egyetlen kattintásra a robot az egész csoport jegyeit (témával, súlyozással: pl. 100% témazáró, 50% röpdolgozat) közvetlenül beírja a Krétába.

#### 71. Kréta Üzenetek Kétirányú Kezelése & Sablonok
- Új üzenet küldése szülőknek, diákoknak vagy tantestületnek közvetlenül a Schola felületéről.
- Hivatalos intézményi sablonok használata (pl. szülői értesítő hiányzásról, dicséretről, fogadóóráról).

---

### II. Katedra AI 2.0 & Generatív Értékelés

#### 72. QR-Kódos Dolgozat-Készítő és Kamerás Javítás (AI OMR Scanner)
- **Generálás:** A Katedra AI által generált dolgozat alsó sarkába egyedi QR-kód kerül, amely tartalmazza a feladatsor azonosítóját és a titkosított javítókulcsot.
- **Nyomtatás:** 1 oldalas, feleletválasztós (X-elős) és rövid válaszos tesztlap PDF formátumban.
- **Kamerás Beolvasás:** A tanár a laptop webkamerájával vagy mobiljával másodpercek alatt beolvassa a kitöltött dolgozatokat. A rendszer automatikusan felismeri a válaszokat, kiszámítja a pontszámot, és bejegyzi az eredményt a Dolgozat Radarba.

#### 73. Diák Kézírás- és Levezetés-Elemzés (Multimodal Vision OCR)
- Matematika és fizika levezetések fotójának elemzése Gemini Multimodal Vision modellel.
- A modell lépésről lépésre megkeresi a levezetésben azt a pontot, ahol a diák elszámolta magát (pl. előjelhiba, tört egyszerűsítési hiba, képletelírás), és javaslatot tesz a részpontszámra.

#### 74. 3-Szintű Differenciált Feladatsor Generálás
- Ugyanabból a tananyagból egyetlen kattintással három párhuzamos feladatsor generálása:
  - *A szint (Felzárkóztató):* Alapfogalmak, vezetett lépések, behelyettesítős példák.
  - *B szint (Standard):* Érettségi/tantervi követelménynek megfelelő feladatok.
  - *C szint (Tehetséggondozó):* Összetett, kreatív versenyfeladatok.

#### 75. Automatizált Szöveges Értékelés és Fogadóórai Riportíró
- Félévi vagy év végi szöveges értékelések vázlatának automatikus megírása a rögzített jegyek, hiányzások és aktivitási adatok alapján.
- Egyéni, motiváló, pedagógiailag igényes összegzés generálása szülők számára a fogadóórára.

#### 76. Természetes Nyelvű Tanári Kereső & Kérdező (NLP Search)
- Intelligens asszisztens keresőmező a fejlécben:
  - *"Kik hiányoztak a héten a 11.A-ból matematikáról?"*
  - *"Milyen dolgozatok vannak betervezve jövő hétre?"*
  - *"Ki áll bukásra fizikából a 9.B-ben?"*

#### 77. Szaktárgyi Interaktív Szimulációk (GeoGebra & Desmos integráció)
- Matematikai függvénygörbék, geometriai szerkesztések és fizikai szimulációk (pl. ferde hajítás, rezgőkör) közvetlen beágyazása a Classroom Screen felületére.

---

### III. Interaktív Osztályterem & Diák Bevonás (Classroom 2.0)

#### 78. Interaktív Drag & Drop Ülésrend (Seating Chart)
- **Vizuális Tanterem Tervező:** A tanterem elrendezésének modellezése (2-es padok, U-alak, csoportasztalok).
- **Diákok Beültetése:** Diákok húzása a padokba kézzel vagy véletlenszerű "okos" beültetéssel (pl. beszélgetős tanulók szétültetése).
- **Közvetlen Interakció:**
  - Padraborintás: Jelenlét / Hiányzás jelölése.
  - Dupla kattintás: Plusz / Mínusz pont (órai munka) adása közvetlenül az ülésrendről.

#### 79. Classroom Live - Diák Kliens QR-Kóddal
- A kivetített Classroom Screen QR-kódját a diákok a telefonjukkal beolvassák (nem igényel regisztrációt vagy app letöltést).
- **Funkciók diákoldalon:**
  - *Quick Poll (Gyors Szavazás):* A táblán megjelenő kérdésre A/B/C/D válasz beküldése valós időben.
  - *Exit Ticket (Kilépő Cédula):* Óra végi 1 perces visszajelzés ("Mit értettél meg ma a legjobban? Mi maradt homályos?").
  - *Névtelen Kérdésdoboz:* Csendes segítségkérés vagy kérdés feltevése óra közben anélkül, hogy a diák szégyellné a többiek előtt.

#### 80. Intelligens Csend-Kihívás (Streak) & Zajszint Figyelmeztetés
- A meglévő zajszintmérő kiegészítése: ha az osztály 10 másodpercig túllépi a piros határt, finom figyelmeztető hangot játszik le.
- "Csend-kihívás" (Streak): méri, hány perce dolgozik a csoport az optimális zöld sávban, és ezért tanórai pluszpontot vagy kitűzőt oszt.

#### 81. Tantermi Gamifikáció (XP, Kitűzők, Csapatverseny)
- Órai aktivitásért és jó válaszokért gyűjthető tapasztalati pontok (XP).
- Digitális kitűzők (pl. *"A hét logikusa"*, *"Hibátlan levezetés"*, *"Sorozatbajnok"*).
- Csapatverseny mód: A generált csapatok pontjainak élő számlálása a kivetítőn.

---

### IV. Osztályfőnöki & Adminisztratív Szuper-Eszközök

#### 82. Automatizált Hivatalos Szülői Felszólító Levél (Email Draft)
- Ha egy tanuló eléri az 5, 10 vagy 28 igazolatlan órát, a rendszer automatikusan legenerálja a hivatalos felszólító levél szövegét a diák, a szülők és a jogszabályi hivatkozások adataival.
- 1-kattintásos vágólapra másolás vagy közvetlen e-mail küldés.

#### 83. Tanulmányi Trajektória & Korai Figyelmeztető Rendszer (Early Warning)
- Vizuális grafikon a diákok átlagának időbeli változásáról.
- Automatikus riasztás: ha egy diák átlaga hirtelen 1 teljes jegyet esik, vagy 3 egymást követő elégtelen dolgozatot ír.

#### 84. Osztálypénz és Rendezvény Pénzügyi Elszámoló PDF
- A rögzített befizetésekből és kiadásokból formázott, hivatalos elszámoló PDF készítése a szülői értekezletekre (bevétel, kiadás, egyenleg, tartozók listája).

#### 85. Diákprofil Kártyák & Védett Megjegyzések
- Diák adatlap: elérhetőségek, szülői adatok, orvosi/egyéni bánásmód jegyzetek (pl. diszlexia, SNI, BTMN, ételallergia).
- Titkosított, lokális tárolás a legmagasabb adatvédelmi normák szerint.

---

### V. Platform, Integrációk és Teljesítmény

#### 86. Kétirányú Google Naptár és Workspace Integráció
- Dolgozatok, szülői értekezletek és osztályprogramok automatikus szinkronizálása a tanár személyes Google Naptárával (`calendar.events` API).
- Google Tanterem (Classroom) integráció: feladatok és anyagok átadása.

#### 87. Teljes PWA (Progressive Web App) Offline Támogatás
- Asztali gépen és mobilon is natív alkalmazásként telepíthető (ikon a tálcán/kezdőképernyőn).
- Offline üzemmód Service Workerrel: hálózati kimaradás esetén is elérhető órarend, ülésrend és eszközök.

#### 88. Adat-Export és Teljes Biztonsági Mentés (CSV, Excel, JSON)
- Minden rögzített adat (jegyek, dolgozatok, osztálypénz, todo) egyetlen kattintással kimenthető Excel formátumba vagy JSON biztonsági mentésként.
- Bármikor visszaállítható adatbázis új gépre költözéskor.

#### 89. Code Splitting és Bundle Optimalizálás
- A nagyobb méretű komponensek (Classroom Screen, Katedra AI, Charts) dinamikus betöltése (`React.lazy`), amely 40-50%-kal csökkenti a kezdeti oldalletöltési időt mobilon.

#### 90. Tanári Együttműködés (Multi-Teacher Mode)
- **Megosztott csoportok**: Ugyanaz az osztály több tanár alá tartozik (pl. matektanár és fizikatanár is látja a 9.C-t).
- **Tanmenet és feladatsor megosztás**: Kollégák egyetlen linkkel megoszthatják egymással a Katedra AI által generált sikeres dolgozatokat és óravázlatokat.

---

## 🗺️ Prioritási Mátrix és Fejlesztési Fázisok

```
                    MAGAS ÉRTÉK / PEDAGÓGIAI HATÁS
                                   ▲
                                   │
      [68. Kréta Óranaplózás]      │   [78. Drag & Drop Ülésrend]
      [69. Jelenlét Kréta Sync]    │   [72. QR Dolgozatjavító OMR]
      [70. Jegybeírás Kréta]       │   [79. Classroom Live Polls]
      [82. Hivatalos szülői levél] │   [83. Early Warning Rendszer]
   ────────────────────────────────┼─────────────────────────────────►
   ALACSONY FEJLESZTÉSI EFFORT     │   MAGAS FEJLESZTÉSI EFFORT (KOMPLEX)
                                   │
      [84. Osztálypénz PDF]        │   [73. Multimodal Kézírás-OCR]
      [88. CSV/Excel export]       │   [86. Google Naptár Sync]
      [80. Csend-kihívás hang]     │   [81. Tantermi Gamifikáció XP]
                                   │
                    ALACSONY ÉRTÉK / PEDAGÓGIAI HATÁS
```

### 🎯 Javasolt Következő Sprint Fókusz (v3.1):
1. **Kétirányú Kréta jelenlét és óranaplózás prototípus (#68, #69)** a meglévő Playwright backend kiterjesztésével.
2. **Interaktív Tantermi Ülésrend (#78)** a Classroom Screen és a Napló közé integrálva.
3. **QR-Kódos Dolgozat és Javítókulcs Generálás (#72)** a Dolgozat Radarban.
4. **Excel/CSV Export (#88)** a Dolgozatok és Osztálypénz modulokhoz.

---

*Összeállította: Varga Dávid & Antigravity AI*  
*Dokumentum verzió: 3.0 (Schola Unified Edition)*  
*Utolsó felülvizsgálat: 2026. november 24.*
