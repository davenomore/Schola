import { MethodologyItem, PsychologyLibraryItem } from './types';

export const METHODOLOGY_LIBRARY: MethodologyItem[] = [
  {
    id: 'm1',
    title: 'Gamifikáció a matematika órán',
    category: 'Aktív tanulás',
    description: 'Játékos elemek bevezetése a tanulási folyamatba a motiváció növelése érdekében.',
    tags: ['játék', 'motiváció', 'pontrendszer'],
    content: `
# Gamifikáció a matematika órán

A gamifikáció nem játékot jelent, hanem játékos elemek alkalmazását nem játékos környezetben.

## Alapelvek
1. **Azonnali visszacsatolás:** Pontok, jelvények.
2. **Szintek és haladás:** Látható fejlődési út.
3. **Történetmesélés:** Kerettörténet a tananyag köré.

## Gyakorlati példa: "Függvény-lovagok"
A tanulók lovagokként haladnak előre a "Függvények Birodalmában". Minden helyesen megoldott egyenletért aranytallért kapnak, amiből "felszerelést" (pl. plusz pontot a dolgozatban, vagy egy puskát a következő kisérettségihez) vásárolhatnak.

## Előnyök
- Növeli az elkötelezettséget.
- Csökkenti a hibázástól való félelmet.
- Együttműködésre ösztönöz.
`
  },
  {
    id: 'm2',
    title: 'Fordított osztályterem (Flipped Classroom)',
    category: 'IKT',
    description: 'A hagyományos tantermi és otthoni tevékenységek felcserélése.',
    tags: ['videó', 'egyéni tempó', 'aktív óra'],
    content: `
# Fordított osztályterem (Flipped Classroom)

A módszer lényege, hogy a tanulók az elméleti anyagot otthon, saját tempójukban dolgozzák fel (pl. videó segítségével), az órai időt pedig gyakorlásra és problémamegoldásra fordítják.

## Hogyan kezdjük?
1. **Előkészítés:** Készítsünk 5-10 perces videókat a témáról.
2. **Otthoni munka:** A tanulók megnézik a videót és felírják a kérdéseiket.
3. **Órai munka:** Csoportos feladatmegoldás, ahol a tanár mentorként segít.

## Mikor ajánlott?
Kifejezetten hasznos bonyolult fizikai kísérletek elméleti hátterének bemutatására vagy matematikai bizonyítások ismertetésére.
`
  },
  {
    id: 'm3',
    title: 'Projektmódszer a fizika tanításában',
    category: 'Aktív tanulás',
    description: 'Összetett, valós problémák megoldása hosszabb időtávon.',
    tags: ['kutatás', 'alkotás', 'valós világ'],
    content: `
# Projektmódszer a fizika tanításában

A tanulók nem csak befogadják az információt, hanem aktívan alkotnak valamit.

## Projekt téma: "Az álmaim napelem-parkja"
A diákoknak meg kell tervezniük egy iskola energiaellátását megújuló forrásokból.
- **Kutatás:** Teljesítmény-számítás, hatásfok.
- **Gazdaság:** Megtérülési idő számítása.
- **Prezentáció:** Makett vagy digitális terv bemutatása.

## Értékelés
Folyamatorientált értékelés, ahol az együttműködés és a kreativitás is számít.
`
  },
  {
    id: 'm4',
    title: 'Formatív értékelés digitális eszközökkel',
    category: 'Értékelés',
    description: 'Folyamatos visszacsatolás a tanulás közben a tanulási hibák javítására.',
    tags: ['quiz', 'feedback', 'mentimeter'],
    content: `
# Formatív értékelés digitális eszközökkel

A cél nem az osztályzás, hanem a megértés ellenőrzése.

## Eszközök
- **Kahoot! / Quizziz:** Gyors ellenőrzés óra elején.
- **Plickers:** Ha nincsenek a diákoknál telefonok.
- **Exit Ticket:** Digitális kilépőkártyák óra végén.

## Alkalmazása
Ne csak a végeredményt kérdezzük, hanem a gondolatmenetet is!
`
  }
];

export const PSYCHOLOGY_LIBRARY: PsychologyLibraryItem[] = [
  {
    id: "psy-1",
    title: "Tanulói Motiváció Visszanyerése",
    category: "Motiváció",
    description: "Hogyan segítsünk az elszigetelődött vagy érdektelen tanulóknak újra kapcsolódni a tananyaghoz és az osztályközösséghez?",
    tags: ["motiváció", "kapcsolat", "egyéni figyelem", "alulteljesítés"],
    content: `
# Tanulói Motiváció Visszanyerése

A tanulói apátia és motiválatlanság gyakran nem a tananyagnak szól, hanem mélyebb, a háttérben húzódó okokra vezethető vissza (kudarcélmények, családi problémák, vagy az autonómia hiánya). Hogyan segítsünk az elszigetelődött vagy érdektelen tanulóknak újra kapcsolódni?

## 1. Az "Apró Győzelmek" Stratégiája (Micro-wins)
A motivációvesztés gyakran a krónikus kudarckerülésből fakad. Építsünk be olyan mikrofázisokat a tanórába, ahol a tanuló garantáltan sikerélményhez jut.
- **Tipp:** Adjunk neki egy látszólag könnyű, de a témához illeszkedő feladatot (pl. "Légy szíves, olvasd fel a feladatot az osztálynak", vagy "Keresd meg ezt az egy adatot a táblázatban"). Dicsérjük meg az elvégzett munkát, fókuszálva az erőfeszítésre, nem a képességre.

## 2. A 2×10-es Szabály
Kutatások bizonyítják, hogy a nehezen kezelhető vagy motiválatlan diákokkal való kapcsolatfelvétel leghatékonyabb módja a **2×10-es módszer**.
- **A módszer:** Zsinórban 10 napon keresztül, minden nap szánj **2 percet** arra, hogy a diákkal olyan témáról beszélgess, aminek *semmi köze az iskolához*. (pl. hobbik, sport, zenék).
- **Eredmény:** A diák úgy érzi, emberként tekintenek rá, nem csak teljesítménygépként, ami drasztikusan javítja a tanár-diák kapcsolatot és ezáltal az órai aktivitást is.

## 3. Autonómia Biztosítása
Az érdektelenség sokszor a kontrollvesztettség érzéséből fakad. Adjunk választási lehetőséget a tanulásban!
- **Példa:** "A mai feladatok közül választhatsz: vagy a 3-as, 4-es, 5-ös feladatot csinálod meg, vagy csinálsz egy gondolattérképet a témáról."

## 4. Rejtett Képességek Kamatoztatása
Keresd meg, miben jó a diák (még ha az mondjuk a videójátékok ismerete is), és próbáld meg bevonni a tananyagba. "Tomi, te nagyon vágod a stratégiát a játékokban, szerinted a hadvezér itt milyen taktikát választott volna?"
`
  },
  {
    id: "psy-2",
    title: "SNI és BTMN Tanulók Integrációja",
    category: "Inklúzió",
    description: "Gyakorlati tanácsok a sajátos nevelési igényű (például ADHD, autizmus spektrum, diszlexia) tanulók hatékony bevonásához.",
    tags: ["SNI", "inklúzió", "differenciálás", "ADHD", "diszlexia"],
    content: `
# SNI és BTMN Tanulók Integrációja

A neurodivergens (pl. ADHD-s, autizmus spektrumzavarral élő, vagy tanulási zavarral küzdő) diákok integrációja nem csupán papírmunka, hanem a mindennapi pedagógiai rutin tudatos átalakítása.

## 1. ADHD-s (Figyelemzavaros, Hiperaktív) Diákok Támogatása
- **Mozgásigény csatornázása:** Ne büntessük a mozgásigényt. Adjuk ki neki a "teremfelelős" feladatokat (lapok kiosztása, táblatörlés, ablaknyitás). Ha fészkelődik, engedélyezzük a stresszlabda vagy a babzsák használatát.
- **Rövidített utasítások:** Az összetett instrukciókat bontsuk fel lépésekre. Ne mondjuk: *"Nyissátok ki a könyvet a 12. oldalon, olvassátok el a szöveget, és írjatok ki 5 kulcsszót"*. Adjuk ki a lépéseket egyesével.
- **Vizuális időzítő:** Használjunk látható visszaszámlálót (pl. TimeTimer), hogy érzékeljék a feladatvégzés határait.

## 2. Diszlexiás, Diszgráfiás Tanulók
- **Értékelés formája:** Engedjük a szóbeli számonkérést az írásbeli helyett, vagy adjunk 30%-kal több időt a dolgozatoknál (ahogy a szakvélemény is előírja).
- **Táblakép és Vizuális segédletek:** A táblára írt szöveg legyen jól strukturált. Használjunk színeket a kiemeléshez, de ne essünk túlzásba. Kerüljük a hosszú, egybefüggő másoltatásokat.
- **Felolvasó szoftverek:** Engedélyezzük a telefon/tablet használatát, ha felolvasó szoftvert (Text-to-Speech) használ az önálló feldolgozáshoz.

## 3. Autizmus Spektrumzavar (ASD) Enyhe Esetei (pl. Asperger)
- **Kiszámíthatóság:** Ragaszkodjunk a rutinokhoz. Az óra elején mindig írjuk fel a tábla szélére az óra menetrendjét (1. Házi ellenőrzés, 2. Új anyag, 3. Csoportmunka). Ha változás van (pl. terembere), előre jelezzük!
- **Konkrét kommunikáció:** Kerüljük az iróniát, a szarkazmust és a kétértelmű utalásokat, mert nehezen dekódolják ezeket. Fogalmazzunk egyértelműen és tényszerűen.
- **Szenzoros túlterhelés:** Engedjük, hogy fülvédőt vagy zajszűrő fülhallgatót viseljenek önálló munka közben, ha a teremzaj zavaró számukra.
`
  },
  {
    id: "psy-3",
    title: "Konfliktuskezelés és Resztoratív Technikák",
    category: "Közösség",
    description: "Mediációs technikák és resztoratív szemlélet alkalmazása osztálytermi konfliktusok (pl. kiközösítés, verekedés, viták) esetén.",
    tags: ["konfliktus", "mediáció", "resztoratív", "közösség"],
    content: `
# Konfliktuskezelés az Osztályban

A hagyományos, büntetés-központú fegyelmezés (intő, sarokba állítás) gyakran csak elnyomja a konfliktusokat. A **resztoratív (helyreállító) szemlélet** a kapcsolatok megjavítására fókuszál.

## 1. A Resztoratív Kérdések Alapelvei
Amikor két diák összeveszik, a szokásos "Ki kezdte?" és "Miért csináltad?" kérdések védekezéshez és hazudozáshoz vezetnek. Próbáljuk ki a resztoratív kérdéssort külön-külön mindkét féllel:
1. *Mi történt?* (Ítélkezésmentes tényfeltárás)
2. *Mire gondoltál abban a pillanatban?*
3. *Mit érzel most az esettel kapcsolatban?*
4. *Kire volt hatással ez a dolog, és hogyan?*
5. *Szerinted mit kell tenni ahhoz, hogy helyrehozzuk a helyzetet?*

## 2. Az "Én-üzenetek" Használata
Tanárként a fegyelmezés során alkalmazzuk a háromrészes Én-üzenetet:
> **Cselekvés + Érzés + Hatás**
> Helytelen: *"Megint közbeszóltál, borzasztóan neveletlen vagy!"*
> Helyes: *"Amikor közbeszólsz, miközben magyarázok (cselekvés), frusztrált leszek (érzés), mert így nem tudom befejezni a gondolatmenetemet és az osztály is lemarad (hatás)."*

## 3. Resztoratív Kör
Súlyosabb osztály-szintű problémák (pl. kiközösítés, lopás, online zaklatás) esetén érdemes egy beszélgetőkört tartani.
- A diákok körben ülnek. Csak az beszélhet, akinél a "beszélő bot/tárgy" van.
- A pedagógus facilitátorként van jelen, nem bíróként.
- Cél: Megértetni az elkövetővel a tetteinek súlyát az áldozat szemszögéből, majd közösen kitalálni a jóvátételt.
`
  },
  {
    id: "psy-4",
    title: "A Pedagógus Kiégés (Burnout) Megelőzése",
    category: "Wellbeing",
    description: "Saját mentális egészségünk védelme, stresszkezelési stratégiák és a kiégés jeleinek felismerése.",
    tags: ["burnout", "kiégés", "stressz", "öngondoskodás"],
    content: `
# A Pedagógus Kiégés (Burnout) Megelőzése

A pedagógus pálya a "segítő szakmák" közé tartozik, amelyek fokozottan veszélyeztetettek az érzelmi kimerülés, azaz a kiégés szempontjából. A saját oxigénmaszkunkat kell először feltennünk, mielőtt a diákokon segítenénk.

## A Kiégés Három Fő Stádiuma
1. **Érzelmi kimerültség:** Fáradtság, fásultság, alvászavarok, türelmetlenség a diákokkal és a kollégákkal.
2. **Cinizmus és deperszonalizáció:** Távolságtartás, "címkézés" (pl. "ez az osztály úgyis menthetetlen"), a munka mechanikus elvégzése.
3. **Csökkent személyes hatékonyság:** Az az érzés, hogy semminek nincs értelme, a kompetencia elvesztése.

## Gyakorlati Tippek a Megelőzésre

### 1. Határok Meghúzása (Boundary Setting)
- **E-mail és üzenet stop:** Határozzunk meg egy időpontot (pl. 17:00), ami után nem nézzük meg a szülők vagy a diákok üzeneteit.
- **Nem-et mondás művészete:** Nem kell minden extra bizottsági tagságot, fakultációt vagy versenyfelkészítést elvállalni, ha már így is 120%-on pörgünk.

### 2. Mikro-szünetek az Iskolában
Két óra között gyakran csak a folyosói ügyelet vagy a fénymásolás marad. Próbáljunk meg tudatosan kiszakítani napi 5-10 percet, amikor a tanáriban (vagy a mosdóban) csendben vagyunk, iszunk egy teát, és végzünk 3 mély, rekeszizom-légzést.

### 3. A Fókusz Áthelyezése ("Good Enough" tanárság)
Le kell számolni a "Tökéletes Pedagógus" mítoszával. Nem lehet minden óra interaktív, gamifikált projekt-csoda. Egy "elég jó" óra, amit a tankönyv alapján tartunk meg, teljesen elfogadható, ha ez segít megőrizni az energiáinkat a fontosabb pillanatokra.
`
  },
  {
    id: "psy-5",
    title: "Teljesítményszorongás és Teszt-Pánik Kezelése",
    category: "Mentális egészség",
    description: "Hogyan segítsünk azoknak a diákoknak, akik leblokkolnak a számonkéréseknél?",
    tags: ["szorongás", "dolgozat", "stresszkezelés", "pánik"],
    content: `
# Teljesítményszorongás és Teszt-Pánik Kezelése

Sok diák rendelkezik a megfelelő tudással, de a számonkérés pillanatában a szorongás miatt (fight-or-flight reakció) szó szerint "leblokkol" az agyuk memóriaközpontja.

## Jelek
- Remegés, izzadás, sírás dolgozat előtt.
- Furcsa, banális hibák egy amúgy jó tanulónál.
- Folyamatos halogatás, az utolsó pillanatos felkészülés miatti stressz.
- Szomatikus tünetek: gyakori fejfájás, hasfájás a "nehezebb" napokon.

## Pedagógiai Beavatkozások

### 1. Vizsgahelyzet "Demitizálása"
A témazáró ne egy mindent eldöntő, rettegett esemény legyen.
- Tartsunk tét nélküli "próbavizsgákat" (formatív értékelés), ahol megszokják a formátumot.
- Adjuk meg előre a pontos követelményrendszert és a típushibákat.

### 2. A "Feszültség-levezető" Percek
Dolgozatírás megkezdése előtt adjunk 2 percet. Kérjük meg az osztályt, hogy írják le egy üres papírra az összes félelmüket, ami a dolgozattal kapcsolatos, majd gyűrjék össze a papírt, és dobják a kukába. (Pszichológiai kutatások bizonyítják, hogy az "expresszív írás" csökkenti a teszt-szorongást).

### 3. Fókusz-visszaállító Technikák
Ha látjuk, hogy a diák pánikol a papír felett, menjünk oda hozzá, tegyük a kezünket a padjára, és halkan kérjük meg: *"Tedd le a tollat egy percre. Vegyél három mély levegőt. Nézd meg a 3-as feladatot, az könnyebb, kezdd azzal, és utána térj vissza ide."* Ez a külső kontroll segít megtörni a pánik spirálját.

### 4. A Növekedési Szemlélet (Growth Mindset) Erősítése
Tudatosítsuk bennük, hogy a jegy nem a személyüket vagy az intelligenciájukat minősíti, hanem a pillanatnyi felkészültséget. *"Azt még nem tudod, de ha gyakorlod, menni fog."*
`
  }
];
