# 🚀 Teacher Assistant - Jövőbeli Fejlesztési és Innovációs Javaslatok

A Teacher Assistant jelenlegi kapacitása egy stabil, felhő-alapú és böngésző-automatizált termék (MVP), amely már most drasztikusan csökkenti az adminisztrációra fordított időt. Az alábbi innovatív funkciók integrálásával az alkalmazás egy modern startup platformmá (EdTech) nőhetné ki magát!

---

## ✅ Megvalósított funkciók

### ~~1. Kréta "Oda-Vissza" Névsor-Szinkronizáció (Scraper)~~ — KÉSZ ✅
A Chrome Bővítmény egyetlen gombnyomással leolvassa a Kréta Naplóból a diákok névsorát, osztályt, tantárgyat, és feltölti Firebase-be. A telefonos appban a "Kréta Import" gombbal áthúzhatóak a csoportokba.

### ~~2. Hangalapú Osztályzás (Voice-to-Grade AI)~~ — KÉSZ ✅
A natív böngészős Speech-to-Text API-val diktált szöveget a Gemini AI elemzi, a Fuzzy-Match összepárosítja a diáknevekkel, és automatikusan rögzíti az eredményeket.

### ~~8. Intelligens Órarend-Vezérelt Szkennelés (Smart Schedule Sync)~~ — KÉSZ ✅
Az órarend betölthető az appba (manuálisan vagy szöveges importtal), és az aktuális idő alapján a rendszer tudja, épp melyik osztálynál vagy. A "Most éppen" banner minden oldalon kijelzi az aktuális órát.

---

## ✅ Megvalósított funkciók (v2.0 – Cloud & Multi-User)

### ~~13. Offline-First és Felhő Szinkronizáció~~ — KÉSZ ✅
A Firestore IndexedDB Persistence révén az app offline is működik, és a kapcsolat visszaállásakor automatikusan szinkronizál. Minden adat felhasználói UID-hez kötött.

### ~~15. Multi-User Google Bejelentkezés~~ — KÉSZ ✅
Firebase Authentication (Google Provider) bevezetésre került. Minden tanárnak saját, izolált adattere van a felhőben. A Chrome Bővítmény 4 jegyű párosító kóddal csatlakozik a fiókhoz.

### ~~Ponthatár Számító (Grade Calculator)~~ — KÉSZ ✅
A "Több" menüben elérhető mikroalkalmazás: max pontszám és százalékos küszöbök megadása után automatikusan kiszámolja az érdemjegy-ponthatárokat, egész számra kerekítéssel (le/matek/fel).
- **Mentés/Betöltés:** Elmenthetők különböző értékelési rendszerek (pl. "Témazáró 85/70/55/40", "Röpdolgozat 90/75/60/45"), localStorage-ba

### ~~Ponthatár Sablon Rendszer~~ — KÉSZ ✅
(#17 - Ponthatár Számító mentés/betöltés megvalósítva, localStorage-ban tárolás)

### ~~Szerencsekerék (Random Picker)~~ — KÉSZ ✅
A "Több" menüben elérhető mikroalkalmazás: Animált, látványos névválasztó feleltetéshez radiális feliratozással. Képes a feleltek nyilvántartására, pontozására és egyéni visszavonására/újraosztására.

### ~~Csoportbontó (Team Generator)~~ — KÉSZ ✅
A "Több" menüben elérhető mikroalkalmazás: Véletlenszerű csapatgenerátor. A tanár beállíthatja a csapatok számát vagy a csapatlétszámot. A generált felosztások "Projekt" néven elmenthetőek a Firestore-ban és később visszanézhetőek.

### ~~7. Pluszpont Rendszer (Plus Points)~~ — KÉSZ ✅
A "Több" menüben elérhető mikroalkalmazás: Órai aktivitás nyilvántartó. A tanár egyetlen gombnyomással "pluszt" ad a diáknak. 3 plusz összegyűjtésénél a rendszer "KIGYŰLT!" jelzést ad, amit a tanár egy ✅ gombbal értékeltté tehet (nullázás + történet rögzítés). A kigyűlt diákok automatikusan a lista tetejére kerülnek.

### ~~Rögzített Alsó Navigáció~~ — KÉSZ ✅
Az alsó navigációs sáv `position: fixed` pozicionálással mindig a képernyő alján marad, görgetéstől függetlenül.

---

## 🔜 Eredeti javaslatok (még nem megvalósított)

### 3. Generatív Dolgozat-Készítő és QR Kódos Javítás
Ha már mögöttünk áll a Google Gemini AI, miért ne ő írná meg a dolgozatokat is?
- **Innováció:** A tanár megadja a témát (pl. "Második világháború, 8. osztály"). Az AI **generál egy 10 kérdéses feleletválasztós (X-elős) tesztlapot**, amit a telefonból azonnal ki lehet nyomtatni PDF-ben. 
- **Magija:** A papírok sarkába egy egyedi **QR kód** kerül, amely tartalmazza a megoldókulcs térképét. Miután a diákok kitöltötték az X-eket, a mi kamerás szkennelőnk nemcsak a nevet, hanem a QR kódot is leolvassa, a betanult sablon alapján pedig **másodpercek alatt, 100%-os pontossággal automatikusan ki is javítja a dolgozatot a tanár helyett**, a pontokkal együtt!

### 4. "AI Tutor" Diák Portál (Személyre Szabott Oktatás)
A diákok számára egy View-Only weboldal vagy mobilapp, ahol bejelentkezve látják a saját eredményeiket.
- **Innováció:** A Gemini AI végigköveti a diák gyengébb témaköreit (pl. látja az Eredmények fülön, hogy "Geometriából" mindig hármast kap valaki, míg az "Egyenletekből" ötöst). A rendszer automatikusan személyre szabott, támogató gyakorló kérdéseket és magyarázatokat állít elő a diák telefonján, hogy felkészítse az év végi vizsgára!

### 5. Dinamikus Interaktív Ülésrend (Seating Chart)
Az "Osztályok" fülön a szálas listát le lehetne cserélni egy **Interaktív Ülésrendre** (Drag & Drop padok). 
- **Funkció:** Ha a telefon a padon van óra közben, a tanár rábökhet egy üres padsorra, ami automatikusan "Hiányzó"-ra teszi a tanulót a napi szinkronhoz, egy dupla bökés pedig az órai munka (Piros pont / Fekete pont) adminisztrálását intézi nevek keresgélése nélkül.

### 6. Szülői Haladás-Jelentések (Automated Parent Reports)
A félév végén vagy a fogadóórán a tanár egy gombnyomással generálhat egy gyönyörűen vizualizált **PDF Értékelő Riportot** minden diákról az eddig felhőbe mentett adatok alapján.
- Elavult tájékoztatók helyett egy menő kimutatás vonaldiagrammal, az osztályátlaghoz viszonyított helyzettel, és egy **mesterséges intelligencia által írt diplomatikus, motiváló összegzéssel**.

### 9. Célzott Kézírás-Tanulás Visszacsatolása
A jelenlegi Google Gemini Vision már most is zseniális, de mi lenne, ha megtanulná a konkrét diákjaid egyedi írásképét?
- **Innováció:** Minden alkalommal, amikor a rendszer félreolvas egy nevet és te manuálisan átjavítod, a rendszer "Személyes Algoritmusként" eltárolja. Így a tanév végére a program képes lesz a legkuszább kézírást is hibátlanul olvasni.

### 10. AI Fogadóórai Dicséret/Rovó Generátor
A diák profiljában a statisztikák alapján az AI megírhat helyetted egy rendkívül udvarias, hivatalos beszámolót az iskola és a szülők számára.

---

## 💡 Korábbi javaslatok (még nem megvalósított)

### 11. Órarend-Alapú Automatikus Csoportváltás a Szkennernél
Az órarend modul már működik és felismeri az aktuális osztályt. **A következő lépés:** a Szkennelés és a Manuális/Hangos jegybeviteli oldalak automatikusan váltsanak a megfelelő csoportra az órarend alapján.
- A tanárnak soha többé ne kelljen legördülőből választania — ha a rendszer tudja, hogy most 4. óra van és MAT a 9.c-vel, akkor a csoportot magától válassza ki.
- Kézzel felülírható maradjon, de alapból mindig a helyes legyen kiválasztva.

### 12. Hiányzás-Kezelés az Órarend Alapján (Attendance Tracker)
Ha már tudjuk, melyik az aktuális osztály, miért ne rögzíthetnénk a hiányzásokat is?
- Óra elején a tanár megnyitja a "Jelenlét" modált, ami automatikusan listázza az adott csoport diákjait. Egy swipe vagy tap-pal "Jelen / Hiányzó / Késett" jelölhető. 
- A hiányzások mentődnek Firestore-ba, és a Statisztika oldalon megjelenik egy "Hiányzási arány" grafikon.
- A Chrome Bővítmény akár vissza is töltheti a hiányzásokat a Kréta felületre.

### 14. Dolgozat Fotó Archívum és AI Elemzés
A jelenlegi szkenner megolvassa a nevet és az eredményt, de magát a fotót eldobja.
- A dolgozat fotóját is elmenteni a diák profiljához, hogy később visszanézhető legyen.
- Az AI elemezhetné a tipikus hibákat osztályszinten.
- Fogadóórán a tanár megmutathatja a diák összes korábbi dolgozatát, fotóval együtt.

### 16. Valódi Háttérszinkronizációs Google Naptár Integráció
A jelenlegi .ics letöltős megoldás helyett automatizált háttér naptár szinkronizáció.
- A Google Auth már megvan – csak a `calendar.events` API scope-ot kell elkérni.
- A teendő mentésekor az alkalmazás egyből létrehozza az eseményt a tanár naptárában.

---

## 🆕 v2.0 utáni javaslatok (2026. március 24.)

### ~~17. Ponthatár Sablon Rendszer~~ — KÉSZ ✅
*(lásd fentebb)*

### 18. Diák Profil Kártya és Egyéni Megjegyzések
A Statisztika oldalon jelenleg csak számok vannak – hiányzik az emberi dimenzió.
- Minden diákhoz tartozna egy **profilkártya**: összesített átlag, legjobb/leggyengébb téma, tanári megjegyzések (pl. "Nehéz családi helyzet, ügyeljünk rá"), hiányzási arány.
- A tanár a fogadóórán egyetlen tap-pal előhúzhatja a diák teljes képét – nem kell fejben tartani 150 diákot.
- **Adatvédelem:** Az érzékeny megjegyzések csak a bejelentkezett tanár saját fiókjából érhetők el.

### 19. Intelligens Értesítések (Smart Notification Engine)
A jelenlegi értesítő rendszer egyszerű időzített emlékeztetőket küld.
- Az AI elemezné a tanár szokásait és proaktívan szólna:
  - *"A 10.a dolgozatát 3 hete írtad – itt az ideje kijavítani?"*
  - *"A 9.c csoport átlaga 2 hónapja csökken – küldj egy összefoglaló emailt?"*
  - *"Holnap 5 órád van a 13.c-vel – hátha kellene új dolgozat téma."*
- A Push Notification API (PWA) révén ezek valódi telefonos értesítésként jelennének meg.

### 20. Sablon-Alapú PDF Bizonyítvány és Jelentés Generátor
A félév végi összegzés jelenleg manuális papírmunka.
- A tanár a Beállítások oldalon kiválaszt egy sablont (pl. "Félévi értékelés", "Szülői tájékoztató"), megadja az osztályt, és az alkalmazás **automatikusan legenerálja a PDF-et** minden diáknak a Firestore statisztikák alapján.
- A Gemini AI diplomatikus, egyénre szabott szöveges értékelést generál.
- A PDF-ek tölthetők le ZIP-ben vagy küldhetők emailben a szülők felé.

### 21. Kréta Napló Visszaíró Robot 2.0 (Komplex Autofill)
A jelenlegi Chrome Bővítmény már tud névsorokat beolvasni – de lehetne sokkal többet is.
- A bővítmény ne csak a névsorokat olvassa, hanem:
  - **Jegyeket** is vigye vissza a Krétába az alkalmazásból.
  - **Hiányzásokat** is szinkronizálja (ha a jelenlét-kezelő implementálva van, #12).
  - **Tömeges beírás:** Egy gombbal az egész heti összes osztály jegyeit és hiányzásait "visszadobja" a Krétába, nem egyenként.
- A tanár a hét végén rányom az "Összes szinkronizálása" gombra, és miközben kávézik, a robot végigmegy az összes oldalon.

---

## 🎮 Gamifikáció és Motiváció

### 22. XP (Tapasztalati pont) rendszer
Fejlődési rendszer órai munkáért — a diákok pontot gyűjtenek az aktív részvételért, házi feladatért, jó dolgozatokért.

### 23. Digitális kitűzők (Badges)
Automatikusan kiosztható kitűzők, pl. "Logika Mestere", "Hét Segítője", "Sorozatbajnok". Az AI a teljesítmény alapján javasolja.

### 24. Heti Leaderboard
A legtöbb XP-t gyűjtő diákok listája — akár anonim módon is megjeleníthető a tanár döntése alapján.

### 25. Házifeladat-streak
Sorozat-számláló a folyamatos készülésért. Ha valaki 5 egymást követő napon készül, extra pontot kap.

### 26. Avatar-építő
A diákok az összegyűjtött pontjaikból fejleszthető profilképet (avatárt) kapnak — vizuális motiváció.

### 27. "Mentőöv" kártyák
Pontokért váltható előnyök, pl. késés elengedése, házi mulasztás feloldása, pluszpont dolgozatra.

---

## 🛠️ Tantermi Segédeszközök (Interaktív)

### 29. Zajszint-mérő
Mikrofon alapú vizuális visszajelzés a terem hangerejéről. Zöld/sárga/piros szintek. Kivetíthető a projektoron.

### 30. Interaktív Ülőrend
Drag-and-drop felület a padok elrendezéséhez. A tanár rábökhet egy padra a hiányzás/jelenlét rögzítéséhez.

### 32. Okos Stopper
Többfázisú időzítő feladatokhoz — pl. "5 perc olvasás → 10 perc megoldás → 3 perc ellenőrzés". Hangjelzéssel.

### 33. "Brain Break" Generátor
Gyors, 1 perces átmozgató/koncentrációs feladatok generálása (AI segítségével), ha a tanár úgy érzi, a diákok fáradtak.

### 34. Fényjelző (Traffic Light)
Vizuális szabályjelző felület, kivetíthető. "Zöld = beszélgethettek", "Sárga = suttogva", "Piros = csend".

---

## 📊 Elemzés és Adminisztráció (Haladó)

### 35. Dolgozat-statisztika
Automatikus Gauss-görbe megjelenítés és részletes átlagszámítás csoportonként, témakörönként.

### 36. Hiányzás-monitor
Figyelmeztetés kritikus hiányzási százaléknál. A rendszer jelzi, ha egy diák közelít a 250 órás határhoz.

### 37. "Veszélyzóna" detektor
Romló tendenciát mutató diákok automatikus kiszűrése — az AI jelzi, ha valakinek 3 egymást követő dolgozata gyengébb.

### 38. Szülői Értesítő sablonok
Előre megírt, AI által generált szövegminták dicsérethez vagy intőhöz. A tanár az iskolai email rendszerébe másolhatja.

### 39. Témakör-lefedettség
Pipálható tanmenet haladási napló — a tanár jelölheti, mely témákat dolgozta fel, és látja a lefedettséget százalékban.

### 40. Digitális Késési Napló
Percpontos rögzítés és összesítés — ha egy diák érkezik, a tanár egy tap-pal jelöli az időt, a rendszer összesíti havonta.

---

## 📝 Interakció és Visszajelzés

### 41. Exit Ticket (Kilépő kártya)
Az óra végén gyors kérdés a megértésről — a diákok a telefonjukon válaszolnak, a tanár azonnal látja az összesítést.

### 42. Gyors Szavazás (Quick Poll)
A/B/C/D válaszlehetőségek azonnali felmérése — a tanár kivetíti, a diákok telefonon szavaznak.

### 43. Névtelen kérdés-láda
Digitális felület a "cikis" kérdéseknek — a diákok név nélkül tehetik fel a kérdéseiket, a tanár az óra végén válaszol.

### 44. "Segítséget kérek" gomb
Csendes, digitális jelzés a tanárnak, ha egy diák elakadt — a tanár telefonján megjelenik a diák neve.

---

## 💡 Extra és AI Funkciók

### 45. AI Kérdés-generátor
Fotózott szövegből (tankönyv oldal) automatikus ellenőrző kérdések generálása Gemini AI segítségével.

### 46. Születésnap-emlékeztető
Reggeli jelzés a diákok köszöntéséhez — a rendszer a diákprofilokból kiolvassa a születésnapokat.

### 47. Helyettesítési segéd
PDF riport generálása az ülőrendről, az aktuális tananyagról és a tudnivalókról a helyettesítő tanárnak.

### 48. Audio-jegyzet
Hangalapú megjegyzések fűzése a feleletekhez — pl. a tanár diktálja: "Jó volt a szóbeli, de a házi hiányzott".

### 49. Sötét/Világos mód szinkron
Napszakhoz (vagy rendszerbeállításhoz) igazodó automatikus témaváltás a Beállítások oldalon keresztül.

### 50. Dolgozat-időpont kalkulátor
Az órarend és a naptár alapján optimális sáv keresése a következő dolgozat megírásához — elkerüli az ütközéseket.

### 51. Napi bölcsesség
Pedagógiai tippek vagy motiváló idézetek megjelenítése indításkor — AI generált, naponta változó.

### 52. "Tudtad-e?" Kártyák (Quick Facts)
A tantárgyadhoz kapcsolódó véletlenszerű érdekességek generátora (AI alapú). Ha marad 2 perc az órából, gyorsan felolvashatsz egy "fun fact"-et, ami feldobja a hangulatot és leköti a diákokat a csengőig.

---

## 🆕 v2.1 utáni javaslatok (2026. március 25.)

### 53. Pluszpont → Kréta Autojegy (Auto-Grade on Threshold)
Jelenleg a "KIGYŰLT!" jelzés csak tájékoztató. Az igazi varázslat: amikor a tanár megnyomja az ✅ gombot, a Chrome Bővítmény **automatikusan beírna egy 50%-os súlyú, "Órai munka" 5-öst** a Kréta naplóba a diák nevére. Ezzel a plusz-rendszer zárt körré válik: telefon → felhő → Kréta.

### 54. Gyors Mínusz Gomb a Pluszpontoknál (Quick Minus)
A plusz-rendszer egyirányú – nincs módszer egy tévesen adott plusz egyedi visszavonására (csak az utolsó törölhető). Legyen egy **hosszú nyomás (long press)** a csillag-badge-eken, ami felkínálja az adott dátumú plusz törlését, megerősítő dialógussal.

### 55. Órarend-Alapú Automatikus Csoportváltás Mindenhol
Az órarend modul már felismeri az aktuális órát, de a Pluszpontok, Szerencsekerék és Csoportbontó oldalakon a tanárnak kézzel kell csoportot választania. A rendszer **automatikusan válassza ki** az épp aktuális csoportot minden eszköznél, ha az órarend alapján egyértelmű.

### 56. Adat-Export és Backup (CSV / JSON)
Jelenleg nincs módszer a Firestore adatok exportálására. A Beállítások oldalon legyen:
- **CSV export** a jegyekhez, pluszpontokhoz, hiányzásokhoz (Excel-kompatibilis)
- **JSON teljes backup** az összes felhasználói adatról
- **Import funkció** a JSON backup visszatöltéséhez (tanárváltás, új fiók)

### 57. Több Plusz-Küszöb és Egyedi Szabályok (Custom Threshold)
A jelenlegi 3-as küszöb fix. A tanár állíthassa be csoportonként:
- Hány plusz = kigyűlt (pl. 3, 5, 10)
- Milyen jegy keletkezzen (5-ös, 4-es, vagy csak dicséret)
- Opcionálisan: mínusz pontok bevezetése negatív viselkedésre

### 58. Code Splitting és Lazy Loading (Performance)
A jelenlegi bundle 1.1 MB+ (gzip: 334 KB) egyetlen chunk-ban. A ritkán használt oldalak (`SpinWheel`, `TeamGenerator`, `GradeCalculator`, `PlusPoints`) **dinamikus importtal** külön chunk-okba szétválaszthatók. Ez 30-50%-kal gyorsabb első betöltést eredményezne mobil hálózaton.

### 59. Tanári Együttműködés (Multi-Teacher Mode)
Jelenleg minden tanár izoláltan dolgozik. Több tanáros iskolákban hasznos lenne:
- **Megosztott csoportok**: Ugyanaz az osztály több tanár alá tartozik (pl. matektanár és fizikatanár is látja a 9.c-t)
- **Csoport-meghívó link**: Egy tanár megosztja a csoport névsorát a kollégájával, aki átveheti
- Az adatok továbbra is szeparáltak maradnak (saját jegyek), de a névsor közös

### 60. Pluszpont Heti Összesítő Dashboard
A Pluszpontok oldalon jelenleg csak az aktuális állapot látszik. Egy **heti/havi összesítő nézet**:
- Melyik diák kapott a legtöbb pluszt az adott időszakban?
- Csoportonkénti aktivitási hőtérkép (ki aktív, ki passzív)
- Trendvonal: javul vagy romlik az osztály aktivitása?

### 61. PWA Telepítési Prompt és Splash Screen
Az app PWA-ként működik, de nincs proaktív telepítési prompt. A felhasználó első 3 látogatása után jelenjen meg egy **elegáns banner**: "Telepítsd az alkalmazást a kezdőképernyődre!" A telepítés után egyedi splash screen és alkalmazás ikon (nem a böngésző ikonja).

### 62. Hangutasítás-Alapú Pluszpont Adás
A meglévő hangfelismerő rendszert kiterjeszteni a pluszpontokra:
- A tanár mondja: *"Kiss Anna plusz"* → a rendszer Fuzzy Match-el megtalálja a diákot és pluszt ad
- Tömegesen is: *"Nagy Péter plusz, Tóth Gábor plusz, Szabó Lili plusz"*
- Ez különösen hasznos óra közben, amikor a tanár nem tudja a telefont kézbe venni
---

## 🆕 Új javaslatok (2026. április)

### 63. Dolgozat-statisztika részletes nézet
Gauss-görbe megjelenítés, medián, szórás számítás minden dolgozatnál.

### 64. Témakör-szűrés a Listában
A jegyek listája szűrhető legyen témakörök szerint.

### 65. Egyéni jegy-súlyozás
Témazáró /=1, röpdolgozat /=0.5 súlyozás az átlag számításnál.

### 66. CSV export a jegyekről
Exportálható táblázatba a Lista oldalról.

### 67. Osztályátlag trend-grafikon
Idővel ábrázolt átlagvonal az Analytics oldalon.

---

*Összeállította: Varga Dávid és az Antigravity AI (2026-os EdTech Víziók)*
*Utoljára frissítve: 2026. április 16.*
