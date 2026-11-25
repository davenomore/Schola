# 🚀 Schola (Digitális Tanári Műszerfal) - Fejlesztési Ötletek és Rendszertérkép

> **Projekt Státusz:** Aktív fejlesztés alatt  
> **Legutóbbi frissítés:** 2026. november (v3.0 - Összevont Platform Frissítés)  
> **Fő célkitűzés:** A hazai pedagógusok mindennapi adminisztrációs és tanítási terheinek radikális csökkentése egy modern, esztétikus és AI-vezérelt munkaállomással.

---

## 🌟 Bevezetés: A Platform Evolúciója

A projekt kezdetben egy modern, testreszabható felületként indult az e-Kréta kényelmesebb használatára (*E-Kréta 2.0*), miközben párhuzamosan fejlődött egy mesterséges intelligenciával támogatott tanársegéd alkalmazás (*Teacher Assistant / Katedra AI*). 

A két irányvonal mára a **Schola** égisze alatt egyesült:
1. **Intelligens Vezérlőpult & Kréta Adatintegráció** (órarend, napló, diákok, üzenetek, widgetek).
2. **Katedra AI & Módszertani Asszisztens** (Gemini alapú óraterv, dolgozat- és feladatgenerálás, szakmai segítség).
3. **Classroom Screen & Tantermi Interaktív Eszközök** (kivetíthető digitális tábla, zajszintmérő, sorsoló, stopper, rajztábla).
4. **Osztályfőnöki Irányítópult** (hiányzás-figyelés, 250 órás limit, osztálypénz, szülinap/névnap, intézkedések).
5. **Dolgozat Radar** (ütemezés, fáziskövetés, statisztikák és azonnali AI feladatsor-generálás).

---

## ✅ Már Megvalósult Rendszerek és Funkciók (Átfogó Leltár)

Az alábbi modulok és képességek már elkészültek, működnek a kódbázisban:

### 1. 📊 Dinamikus Vezérlőpult & Widget Ökoszisztéma
- **3-oszlopos Masonry Layout:** Hézagmentes "dense" elrendezés automatikus kitöltéssel.
- **2D Kártya Átméretezés (`WidgetResizer`):** Szabadon húzható szélesség és magasság szerkesztő módban.
- **Drag & Drop Rendszer:** Kártyák szabad átrendezése böngészőbeli mentéssel (`localStorage`).
- **Gazdag Widget-arzenál:**
  - *Digitális Óra:* Másodpercpontos, minimalista óra.
  - *Kréta Órarend & Állapotjelző:* Intelligens "Folyamatban lévő" és "Következő óra" blokk duplikációmentes logikával.
  - *Időjárás Widget (`useWeather`):* Élő Open-Meteo időjárás-előrejelzés szélsebességgel és dinamikus ikonokkal.
  - *Vakáció-számláló (`schoolHolidays`):* Visszaszámláló a következő tanítási szünetig a hivatalos magyar tanév rendje szerint.
  - *Gyors Időzítő (Mini Timer):* Kártyamérethez igazodó kompakt visszaszámláló és stopper.
  - *Gyors Teendők (Todo) & Modál:* Szűrhető, prioritással ellátható napi feladatlista.
  - *Napi Szokáskövető (Habit Tracker):* Személyre szabható pedagógusi szokások és haladási sáv.
  - *Folyadékpótlás (Hydration Tracker):* Vizuális kördiagramos vízfogyasztás-számláló gyorsgombokkal.
  - *Véletlen Diáksorsoló Widget:* Dashboardról azonnal indítható sorsolás.
  - *Könyvjelzők (Bookmarks):* Testreszabható külső oktatási hivatkozások (pl. Kahoot, Quizlet).
  - *Post-it / Gyors Jegyzet:* Automatikusan mentődő gondolatrögzítő.
  - *Napi Idézet:* Inspiráló gondolatok Tanári / Diák módban.
  - *Kréta Üzenetek Widget:* Legfrissebb Kréta értesítések kivonata.
  - *Gyors Műveletek:* 1-kattintásos navigáció a legfontosabb funkciókhoz.

### 2. 📝 Dolgozat Radar (`Exams.jsx`)
- **Életciklus-követés:** Dolgozatok tervezése, javítási státusza és archiválása (`Tervezett` → `Javítás alatt` → `Kész`).
- **Csoport és Tárgy Szűrés:** Csoportonkénti és tantárgyankénti azonnali áttekintés.
- **Statisztika és Elemzés:** Átlagszámítás, határidő-figyelés és dolgozateloszlás.
- **AI Dolgozat Generátor Modál (`ExamGeneratorModal.jsx`):** Gemini AI integrációval dolgozat, feladatsor és komplett javítókulcs készítése téma, évfolyam, nehézség és dolgozat-típus alapján.

### 3. 🤖 Katedra AI Szakmai Munkaállomás (`KatedraAi.jsx`)
- **Tantárgyi Fókusz:** Matematika és fizika emelt szintű, valamint általános tanári pedagógiai asszisztens.
- **Modulok:**
  - *Óraterv Generátor:* 45 perces tanórák percre bontott, modern módszertani tervei.
  - *Feladatsor Készítő:* Témakörhöz illeszkedő elméleti és számítási feladatok megoldásokkal.
  - *Módszertani Ötlettár:* Differenciálás, kooperatív technikák és figyelemfelkeltő feladatok.
  - *Feladat Levezető & Magyarázó:* Lépésről lépésre kidolgozott megoldások képletekkel.
- **BYOK (Bring Your Own Key):** Felhasználó által megadható Google Gemini API kulcs biztonságos kezelése (`ApiKeySettings.jsx`).
- **Szakmai Skill Bázis:** `mathExamSkill.js` struktúrált prompt- és logikai motor.

### 4. 👨‍🏫 Osztályfőnöki Irányítópult (`HeadTeacher.jsx`)
- **Hiányzások & Késések Monitor:**
  - Igazolatlan órák figyelése (10 és 30 órás jogszabályi határok kiemelése).
  - 250 órás limit-figyelmeztető (osztályozó vizsga veszélyének korai detektálása).
  - Percpontos összesített késések.
- **Osztálypénz & Projekt Tracker:** Osztálykirándulás, színházjegy, fotózás vagy havi osztálypénz befizetéseinek pipálható nyilvántartása.
- **Születésnap & Névnap Figyelő:** A hivatalos magyar névnaptár adatbázis (`nameDays.json`) alapján az osztály tanulóinak köszöntése.
- **Intézkedések & Értékelések:** Dicséretek és figyelmeztetések nyilvántartása.
- **OFŐ Óraterv & Adminisztrációs Jegyzetek:** Tematikus teendők és osztályfőnöki órák tervezése.

### 5. 🖥️ Classroom Screen - Kivetíthető Tantermi Képernyő (`ClassroomScreen.jsx`)
- **Tantermi Prezentációs Felület:** Projektorra és digitális táblára tervezett lebegő ablakos felület.
- **Beépített Interaktív Eszközök:**
  - *Valós idejű Zajszintmérő (`NoiseMeterWidget`):* Laptop mikrofonjáról működő Web Audio API vizualizáció (zöld/sárga/piros küszöbértékekkel).
  - *Munkamód / Fényjelző (`WorkModeWidget`):* Csend, Suttogás, Megbeszélés, Csoportmunka állapotok kivetítése.
  - *Szabadkézi Rajztábla (`DrawingWidget`):* Gyors vázlatokhoz, magyarázatokhoz.
  - *QR-Kód Generátor (`QRCodeWidget`):* Azonnali QR-kód kivetítés bármilyen linkhez (pl. Google Forms, Kahoot, tananyag).
  - *Órai Időzítő (`TimerWidget`):* Nagy méretű visszaszámláló hangjelzéssel.
  - *Véletlen Diáksorsoló (`RandomStudentWidget`):* Kivetíthető feleltető / választó eszköz.
  - *Csoportkészítő (`GroupMakerWidget`):* Gyors tantermi csapatbontás.
  - *Digitális & Analóg Óra (`ClockWidget`).*
  - *Rich Text Jegyzet (`RichTextWidget`):* Órai feladatok, instrukciók kivetítése formázva.
  - *Naptár Kártya (`CalendarWidget`).*
- **Interaktív Faliújság / Padlet (`InteractiveWallWidget` & `StudentWallView`):** Valós idejű közös faliújság tanórai ötletbörzéhez és kilépőcédulákhoz. A diákok egy QR-kód beolvasásával a telefonjukról, bejelentkezés nélkül küldhetnek be színes jegyzeteket, amelyek azonnal megjelennek a táblán.
- **Téma- és Háttérválasztó (`BackgroundSelectorModal`):** Nyugtató természetképek, minimalista és animált hátterek.

### 6. 🧰 Tanári Eszköztár (`TeacherTools.jsx`)
- **Ponthatár Számító (`GradeCalculator`):** Max pontszám és százalékos küszöbök megadása után azonnali ponthatárok generálása lefele, felfele vagy standard kerekítéssel.
- **Diáksorsoló / Szerencsekerék (`StudentRandomizer`):** Animált névválasztó feleltetéshez vagy játékokhoz.
- **Tanári Időzítő (`TeacherTimer`):** Fázisokra osztható tanórai stopper.
- **Csapatgenerátor (`TeamGenerator`):** Véletlenszerű csapatbeosztás csoportlétszám vagy csapatszám alapján.

### 7. 📅 Napló, Csoportok és Órarend
- **Csoport- és Diákkezelés (`Groups.jsx`):** Kréta csoportok listázása, tanulói névsorok, diákok egyéni jegyei és átlagai.
- **Interaktív Heti Órarend (`Timetable.jsx`):** Napok és tanórák áttekintése tantárggyal, teremmel és osztálymegjelöléssel.

### 8. ⚙️ Backend & Kréta Automatizáció
- **Playwright Headless Automation (`server/kretaService.js`):** E-Kréta belépés, adatok automatikus kiolvasása, session mentés (`kreta_session.json`).
- **Szerver Állapot & Ping:** Kréta szerverek elérhetőségének és válaszidejének vizsgálata.
- **Felhőre Kész Infrastruktúra:** Dockerfile (Playwright környezettel) és Render.com konfiguráció a teljes alkalmazás futtatásához.

---

## 🔮 Jövőbeli Fejlesztési Ötletek és Innovációs Tervek

A már meglévő szilárd alapokra építve az alábbiakban összegezzük a legfontosabb soron következő funkciókat és jövőbeli innovációkat.

---

### I. Kétirányú Kréta Automatizáció & Naplózás (Write-back)

*A rendszer jelenleg kiválóan olvassa és szintetizálja a Kréta adatait. A következő szint: a tanár egyetlen gombnyomással a Scholából írhassa vissza a teendőket.*

#### 1. Egykattintásos Óranaplózás (Lesson Logger)
- Az Órarendben és a Dashboard "Folyamatban lévő óra" widgetjében megjelenik egy **"Óra Naplózása"** gomb.
- A felugró ablakban a tanár beírja az óra témáját (vagy választ a tanmenetből / Katedra AI javaslatából).
- A háttérben futó Playwright robot megnyitja a Krétát, kiválasztja az órát, beírja a témát, és sikeres visszajelzést ad.

#### 2. Gyors Jelenlét & Hiányzás Rögzítés (Attendance Sync)
- A Classroom Screenen vagy a Dashboardon a tanár egy érintéssel jelöli a hiányzókat és későket.
- Egy "Kréta Beküldés" gombbal a robot azonnal rögzíti a hiányzókat a hivatalos e-naplóban, kiküszöbölve a lassú Kréta oldalbetöltéseket.

#### 3. Tömeges Jegybeírás a Dolgozat Radarból
- Miután a tanár beírta a dolgozat pontszámait a Dolgozat Radar felületén, a rendszer automatikusan érdemjegyekké alakítja (a Ponthatár kalkulátor szabályai szerint).
- Egy gombnyomásra a robot az egész csoport jegyeit (témával, súlyozással: pl. 100% témazáró, 50% röpdolgozat) közvetlenül beírja a Krétába.

#### 4. Kréta Üzenetek Kétirányú Kezelése
- Új üzenet küldése szülőknek, diákoknak vagy tantestületnek a Schola letisztult felületéről.
- Sablonok használata (pl. szülői értesítő hiányzásról, dicséretről).

---

### II. Katedra AI 2.0 & Generatív Értékelés

*A mesterséges intelligencia nemcsak segédanyagokat készít, hanem aktívan leveszi a javítási és adminisztrációs terheket.*

#### 5. QR-Kódos Dolgozat-Készítő és Kamerás Javítás (AI OMR Scanner)
- **Generálás:** A Katedra AI által generált dolgozat alsó sarkába egyedi QR-kód kerül, amely tartalmazza a feladatsor azonosítóját és a titkosított javítókulcsot.
- **Nyomtatás:** 1 oldalas, feleletválasztós és rövid válaszos tesztlap PDF formátumban.
- **Kamerás Beolvasás:** A tanár a laptop webkamerájával vagy mobiljával másodpercek alatt beolvassa a kitöltött dolgozatokat. A rendszer automatikusan azonosítja a diák nevét, a válaszokat, kiszámítja a pontszámot, és bejegyzi az eredményt a Dolgozat Radarba.

#### 6. Kézírás-Felismerés & Lépésenkénti Hibakeresés (Vision OCR)
- Matek vagy fizika levezetések fotójának elemzése Gemini Multimodal Vision modellel.
- A modell megkeresi a levezetésben azt a sort, ahol a diák elszámolta magát (pl. előjelhiba, zárójelfelbontás), és javaslatot tesz a részpontszámra.

#### 7. 3-Szintű Differenciált Feladatsor Generálás
- Ugyanabból a tananyagból egyetlen kattintással három párhuzamos feladatsor generálása:
  - *A szint (Felzárkóztató):* Alapfogalmak, vezetett lépések.
  - *B szint (Standard):* Érettségi/tantervi követelmény.
  - *C szint (Tehetséggondozó):* Összetett, verseny-típusú gondolkodtató feladatok.

#### 8. Automatizált Szöveges Értékelés és Fogadóórai Riportíró
- Félévi vagy év végi szöveges értékelések vázlatának automatikus megírása a rögzített jegyek, hiányzások és aktivitási adatok alapján.
- Egyéni, motiváló, pedagógiailag cizellált szövegek generálása szülők számára a fogadóórára.

#### 9. Természetes Nyelvű Kereső & Adatbázis Kérdező (Natural Language Query)
- Intelligens keresőmező a fejlécben:
  - *"Kik hiányoztak a héten a 11.A-ból matematikáról?"*
  - *"Milyen dolgozatok vannak betervezve jövő hétre?"*
  - *"Ki áll bukásra fizikából a 9.B-ben?"*

---

### III. Interaktív Osztályterem & Diák Bevonás (Classroom 2.0)

*A Classroom Screen továbbfejlesztése egy élő, kétirányú osztálytermi központtá.*

#### 10. Interaktív Drag & Drop Ülésrend (Seating Chart)
- **Vizuális Tanterem Tervező:** A tanterem elrendezésének modellezése (2-es padok, U-alak, csoportasztalok).
- **Diákok Beültetése:** Diákok húzása a padokba kézzel vagy véletlenszerű "okos" beültetéssel (pl. beszélgetős párok szétültetése).
- **Közvetlen Interakció:**
  - Padraborintás: Jelenlét / Hiányzás jelölése.
  - Dupla kattintás: Plusz / Mínusz pont (órai munka) adása közvetlenül az ülésrendről.

#### 11. Classroom Live - Diák Kliens QR-Kóddal
- A kivetített Classroom Screen QR-kódját a diákok a telefonjukkal beolvassák (nem igényel regisztrációt vagy app letöltést).
- **Funkciók diákoldalon:**
  - *Quick Poll (Gyors Szavazás):* A táblán megjelenő kérdésre A/B/C/D válasz beküldése valós időben.
  - *Exit Ticket (Kilépő Cédula):* Óra végi 1 perces visszajelzés ("Mit értettél meg ma a legjobban? Mi maradt homályos?").
  - *Névtelen Kérdésdoboz:* Csendes segítségkérés vagy kérdés feltevése óra közben.

#### 12. Tantermi Gamifikáció (XP, Kitűzők, Csapatverseny)
- Órai aktivitásért gyűjthető tapasztalati pontok (XP).
- Digitális kitűzők (pl. *"A hét logikusa"*, *"Hibátlan házi feladat"*).
- Csapatverseny mód: A generált csapatok pontjainak élő számlálása a kivetítőn.

#### 13. Intelligens Zajszintmérő Értesítésekkel
- A meglévő zajszintmérő kiegészítése: ha az osztály 10 másodpercig túllépi a piros határt, finom figyelmeztető hangot játszik le.
- "Csend-kihívás" (Streak): méri, hány perce dolgozik a csoport az optimális zöld sávban, és ezért jutalompontot oszt.

---

### IV. Osztályfőnöki & Adminisztratív Szuper-Eszközök

*Az osztályfőnöki lét papírmunkájának szinte teljes automatizálása.*

#### 14. Automatizált Szülői Figyelmeztető Értesítő (Email Draft Generátor)
- Ha egy tanuló eléri az 5, 10 vagy 25 igazolatlan órát, a rendszer automatikusan legenerálja a hivatalos felszólító levél szövegét a diák és a szülők adataival.
- 1-kattintásos vágólapra másolás vagy közvetlen e-mail küldés.

#### 15. Tanulmányi Trajektória & Korai Figyelmeztető Rendszer (Early Warning)
- Vizuális grafikon a diákok átlagának időbeli változásáról.
- Automatikus riasztás: ha egy diák átlaga hirtelen 1 teljes jegyet esik, vagy 3 egymást követő elégtelen dolgozatot ír.

#### 16. Osztálypénz PDF Pénzügyi Elszámolás Generátor
- A rögzített befizetésekből és kiadásokból formázott, hivatalos elszámoló PDF készítése a szülői értekezletekre (bevétel, kiadás, egyenleg, tartozók listája).

#### 17. Diákprofil Kártyák & Védett Megjegyzések
- Diák adatlap: elérhetőségek, szülői adatok, orvosi/egyéni bánásmód jegyzetek (pl. diszlexia, SNI, ételallergia).
- Titkosított, lokális tárolás a legmagasabb adatvédelmi normák szerint.

#### 18. Intelligens Értesítési Motor (Smart Notification Engine - SNE)
*A jelenlegi passzív, 5 másodperces Toast üzenetek helyett egy proaktív, kontextustudatos digitális asszisztens motor.*
- **Proaktív Elemzés és Triggerek:**
  - *Dolgozatjavítási emlékeztető:* *"A 10.A fizika dolgozatát 10 napja írattad meg – közeleg a jogszabályi 2 hetes javítási határidő!"*
  - *Osztályfőnöki kritikus riasztás:* *"Nagy Péter igazolatlan óráinak száma elérte a 28-at – 2 órán belül eléri a 30 órás határt!"*
  - *Órarendi & Pedagógiai javaslat:* *"Holnap 3 órád lesz a 9.C-vel matematikából. Szeretnél a Katedra AI-val egy 10 perces interaktív bemelegítő feladatsort generálni?"*
  - *Tanulmányi trendriasztás:* *"A 11.B matematika tantárgyi átlaga 0.4 jegyet esett az elmúlt hónapban – érdemes áttekinteni a legutóbbi témakört."*
  - *Pedagógusi Jóllét (Wellbeing):* Folyadékpótlási és szünet-emlékeztető 3 egymást követő óra után.
- **Megjelenítési Formák a Felületen:**
  - **Értesítési Központ (Notification Drawer):** Felső fejlécben harang ikon dinamikus jelvénnyel (badge), kategorizált nézettel (Sürgős teendő / Szakmai javaslat / Rutin).
  - **Kiemelt Napi Asszisztens Kártya:** A Vezérlőpult tetején megjelenő, 1-kattintásos akciókat tartalmazó kontextuális sáv (pl. `[Jegybeírás]`, `[Katedra AI megnyitása]`, `[Elhalasztás]`).
  - **PWA Web Push Értesítések:** Telefonra és asztali operációs rendszerre küldött diszkrét értesítések akkor is, ha az oldal nincs épp előtérben.

---

### V. Platform, Integrációk és Teljesítmény

#### 19. Kétirányú Google Naptár és Workspace Integráció
- Dolgozatok, szülői értekezletek és osztályprogramok automatikus szinkronizálása a tanár személyes Google Naptárával (`calendar.events` API).
- Google Tanterem (Classroom) integráció: feladatok és anyagok átadása.

#### 20. Teljes PWA (Progressive Web App) Támogatás
- Asztali gépen és mobilon is natív alkalmazásként telepíthető (ikon a tálcán/kezdőképernyőn).
- Offline üzemmód Service Workerrel: hálózati szakadás esetén is elérhető órarend, ülésrend és eszközök.

#### 21. Adat-Export és Biztonsági Mentés (CSV, Excel, JSON)
- Minden rögzített adat (jegyek, dolgozatok, osztálypénz, todo) egyetlen kattintással kimenthető Excel formátumba vagy JSON biztonsági mentésként.
- Bármikor visszaállítható adatbázis új gépre költözéskor.

#### 22. Teljesítmény Optimalizálás & Code Splitting
- A nagyobb méretű komponensek (Classroom Screen, Katedra AI, Charts) dinamikus betöltése (`React.lazy`), amely 40-50%-kal csökkenti a kezdeti oldalletöltési időt.

---

## 🗺️ Prioritási Mátrix és Fejlesztési Fázisok

```
                    MAGAS ÉRTÉK / HATÁS
                            ▲
                            │
       [1. Óranaplózás]     │   [10. Drag&Drop Ülésrend]
       [2. Jelenlét Kréta]  │   [5. QR Dolgozatjavító]
       [3. Jegybeírás Kréta]│   [11. Classroom Live Polls]
                            │   [15. Early Warning Rendszer]
   ─────────────────────────┼─────────────────────────►
   ALACSONY EFFORT / GYORS  │   MAGAS EFFORT / KOMPLEX
                            │
       [14. Szülői levél AI]│   [6. Kézírás-olvasás Vision]
       [16. Osztálypénz PDF]│   [18. Google Naptár Sync]
       [20. CSV/Excel exp.] │   [12. Gamifikáció / Diák XP]
                            │
                    ALACSONY ÉRTÉK / HATÁS
```

### 🎯 Javasolt Következő Sprint Fókusz (v3.1):
1. **Kétirányú Kréta jelenlét és óranaplózás prototípus** a meglévő Playwright backend kiterjesztésével.
2. **Interaktív Tantermi Ülésrend (Seating Chart)** a Classroom Screen és a Napló közé integrálva.
3. **QR-Kódos Dolgozat és Javítókulcs Generálás** kiterjesztése a Dolgozat Radarban.
4. **Excel/CSV Export** a Dolgozatok és Osztálypénz modulokhoz.

---

*Összeállította: Varga Dávid & Antigravity AI*  
*Dokumentum verzió: 3.0 (Schola Unified Edition)*