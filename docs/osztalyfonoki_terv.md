# Osztályfőnöki Irányítópult (Terv)

Ez a dokumentum az "Osztályfőnökök" számára dedikált új oldal koncepcióját tartalmazza, amely a már meglévő widgetes (kártyás) struktúrára épül. A cél egy olyan áttekinthető felület létrehozása, ami minimalizálja az osztályfőnöki adminisztrációra szánt időt.

## Tervezett Elrendezés

A főoldalhoz hasonlóan egy `dashboard-grid` alapú elrendezést kap, de speciálisan a saját osztály adataira fókuszálva.

### 1. Hiányzások és Késések Widget (Kiemelt fontosságú)
- **Célja:** Azonnali riasztások és áttekintés a problémás hiányzásokról.
- **Funkciók:**
  - **Igazolatlan órák figyelése:** Listázza azokat a diákokat, akiknek van igazolatlan órája, és pirossal jelzi, ha elérték a 10, vagy 30 órás határt.
  - **250 órás limit:** Figyelmeztetést dob azoknál a tanulóknál, akik veszélyeztetettek a 250 órás hiányzási limit átlépésében (osztályozó vizsga veszélye).
  - **Késések:** Összesített késések percben, ami automatikusan igazolatlan órává válhat.
- **Kréta Integráció:** A háttérben a `KretaAutomation` kiolvassa az "Osztályom / Hiányzások" fület.

### 2. Igazolások Kezelése Widget
- **Célja:** A szülői és orvosi igazolások gyors adminisztrációja.
- **Funkciók:**
  - **Függőben lévő igazolások:** Lista azokról a diákokról, akik hiányoztak, de még nem hoztak igazolást (pl. 3 napon belüli hiányzások).
  - **Szülői igazolások kerete:** Mutatja, hogy a tanuló hány szülői igazolást (pl. 3 nap/félév) használt már el.

### 3. Statisztikák és Tanulmányi Átlagok Widget
- **Célja:** Az osztály tanulmányi előmenetelének gyors áttekintése.
- **Funkciók:**
  - **Osztályátlag:** Az osztály aktuális átlaga, vizuálisan ábrázolva (pl. kördiagram).
  - **Bukásra állók / Veszélyeztetettek:** Listázza azokat a diákokat, akik egy vagy több tárgyból elégtelenre (1) állnak.
  - **Legjobb/Leggyengébb tantárgy:** Dinamikusan mutatja, miből teljesít legjobban vagy legrosszabbul az osztály.

### 4. Dicséretek és Figyelmeztetések Widget (Intézkedések)
- **Célja:** A fegyelmi és motivációs eszközök gyors elérése.
- **Funkciók:**
  - Utoljára kiosztott dicséretek és intők listája.
  - **Gyorsgomb:** "Új intézkedés felvitele" (közvetlen űrlap, ahol 2 kattintással adható szaktanári vagy ofői dicséret/intő).

### 5. Osztálypénz / Adminisztráció Tracker Widget (Kanban/Lista hibrid)
- **Célja:** Pénzügyek és beadandó dokumentumok (pl. papírgyűjtés, színházpénz, kirándulás) követése.
- **Funkciók:**
  - Hasonlóan a "Dolgozat Radar"-hoz, itt felvehető egy projekt (pl. "Múzeumlátogatás befizetés 1500 Ft").
  - Pipálható névsor az osztályról: ki fizette be, ki hozta a szülői nyilatkozatot.
  - Ez a modul csak lokálisan ment (LocalStorage), mivel a Kréta ilyet nem kezel alapból.

### 6. Osztályfőnöki Óra Tervező (Jegyzetek / Emlékeztetők)
- **Célja:** Jegyzetfüzet a következő ofői órára.
- **Funkciók:**
  - Egyszerű Todo-lista (pl. "Tűzvédelmi napló aláíratása", "Félévi értékelés kiosztása").
  - Húzható elemek (drag and drop).

### 7. Ünnepek és Események Widget (Születésnap / Névnap)
- **Célja:** Az osztályközösség építése, a diákok személyes elismerése.
- **Funkciók:**
  - **Közelgő születésnapok és névnapok:** Az aktuális héten/hónapban ünneplő diákok listája egy kis torta/ajándék ikonnal.
  - **Automatikus emlékeztetők:** "A héten 2 diákodnak lesz születésnapja."
  - API alapú magyar névnap naptár integráció (vagy beépített lokális adatbázis).
  - Lehetőség egy gombnyomással e-Krétás köszöntő / oklevél generálására.

### 8. Személyiségfejlesztés és Kompetenciatérkép
- **Célja:** A diákok egyéni szociális és érzelmi fejlődésének (SEL) tudatos követése.
- **Funkciók:**
  - **Erősségek és fejlesztendő területek:** Minden diákhoz rendelhető "soft-skill" címkék (pl. *Kiváló csapatjátékos*, *Konfliktuskerülőbb*, *Vezetői hajlam*, *Több bátorítást igényel*).
  - **Fejlődési mérföldkövek:** Rövid egyéni feljegyzések (pl. "Végre aktívan jelentkezett történelemből").
  - **Hangulat- és motivációkövetés:** Egy nagyon egyszerű, színkódos jelzés a diák pillanatnyi mentális állapotáról, ha a tanár valami szokatlant tapasztal (pl. befelé forduló lett az utóbbi hetekben).

### 9. Közösségi / Szociometria Háló
- **Célja:** Az osztályon belüli társas kapcsolatok és csoportdinamika nyomon követése.
- **Funkciók:**
  - **Ülésrend-generátor és tervező:** A drag-and-drop ülésrend, ahol látszik, ki kivel ül, és beállíthatók a "nem ülhetnek egymás mellé" szabályok (fegyelmi okok).
  - **Kirekesztődés figyelő:** Feljegyzések, ha valaki mindig egyedül van csoportmunkánál vagy szünetben, így időben közbe tud lépni az ofő.

## Technikai Megvalósítás
- Új fájl: `src/components/HeadTeacher.jsx`
- Moduláris felépítés: Minden widget önálló komponensként (pl. `AbsenceWidget`, `StatsWidget`) épül fel.
- Backend útvonalak: Szükség lesz a `kretaService.js`-ben egy új funkcióra (pl. `getAbsencesForMyClass()`).
- Új menüpont a navigációban: `Osztályfőnök` (speciális "korona" vagy "osztály" ikonnal).
