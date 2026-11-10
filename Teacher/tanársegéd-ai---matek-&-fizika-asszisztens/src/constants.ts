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
    description: "Hogyan segítsünk az elszigetelődött vagy érdektelen tanulóknak újra kapcsolódni?",
    tags: ["motiváció", "kapcsolat", "egyéni figyelem"],
    content: `
# Tanulói Motiváció Visszanyerése

Hogyan segítsünk az elszigetelődött vagy érdektelen tanulóknak újra kapcsolódni a tananyaghoz?

## Stratégiák
1. **Egyéni érdeklődés:** Keressük az egyéni érdeklődési pontokat és kapcsoljuk a tananyaghoz.
2. **Apró győzelmek:** Használjunk 'apró győzelmek' stratégiát a magabiztosság növelésére.
3. **Biztonságos közeg:** Teremtsünk biztonságos, hibázást megengedő környezetet.
4. **Háttérokok:** Privát beszélgetés keretében keressük a háttérokokat.

## Mikor alkalmazzuk?
Hirtelen teljesítményromlás vagy tartós passzivitás esetén.
`
  },
  {
    id: "psy-2",
    title: "SNI Tanulók Integrációja",
    category: "Inklúzió",
    description: "Gyakorlati tanácsok a sajátos nevelési igényű tanulók hatékony bevonásához.",
    tags: ["SNI", "inklúzió", "differenciálás"],
    content: `
# SNI Tanulók Integrációja

Gyakorlati tanácsok a sajátos nevelési igényű tanulók hatékony bevonásához az osztálymunkába.

## Módszerek
- **Differenciálás:** Egyéni képességekhez mért feladatadás.
- **Vizuális támasz:** Strukturált napirend és vizuális segédeszközök.
- **Társi segítés:** Peer-to-peer (párban dolgozás) rendszer kialakítása.
- **Szenzoros igények:** A terem elrendezésének tudatos kialakítása.
`
  },
  {
    id: "psy-3",
    title: "Konfliktuskezelés az Osztályban",
    category: "Közösség",
    description: "Mediációs technikák és resztoratív szemlélet alkalmazása.",
    tags: ["konfliktus", "mediáció", "közösség"],
    content: `
# Konfliktuskezelés az Osztályban

Mediációs technikák és resztoratív szemlélet alkalmazása diákkonfliktusok esetén.

## Lépések
1. **Én-üzenetek:** Érzelem-központú kommunikáció használata.
2. **Szabályok:** A közösen hozott szabályrendszer felelevenítése.
3. **Meghallgatás:** A felek meghallgatása ítélkezés nélkül.
4. **Megoldás-fókusz:** A jövőbeli megoldás keresése a múltbeli bűnbakkeresés helyett.
`
  }
];
