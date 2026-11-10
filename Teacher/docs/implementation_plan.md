# [Tanári Asszisztens: Statisztika és Archívum Modul]

A meglévő rendszer kibővítése hosszú távú adattárolással, utólagos szerkeszthetőséggel és fejlett matematikai-vizuális analitikával (Átlag, szórás, Recharts grafikonok).

## User Review Required
A vizualizációhoz a modern, Reszponzív és látványos `recharts` nevű React vizualizációs könyvtárat fogom használni, mert gyönyörűen illeszkedik a jelenlegi sötét (Glassmorphism) témánkba, és beépített reszponzivitással rendelkezik!

## Proposed Changes

### 1. Adatmodell Csomagok
- Végleges archiváló struktúra kialakítása (amikor a felhasználó a "Lista" [Scanned tests] oldalon jóváhagyja / felküldi a Krétába az adatokat, azok egy "Eltett Dolgozatok" listába is lementődnek csoportosítva, dátummal és témával).
- Erre egy új LocalStorage kulcsot (`archived_tests`) használunk, ami Firebase-be is felküldhető a jövőben, de offline elsődlegesen számol.

### 2. Matematikai Logika (Átlag és Szórás)
- Átlag kiszámítása (Mean): A diákok jegyeinek összege / diákok száma.
- Szórás (Standard Deviation): `sqrt( sum( (jegy - átlag)^2 ) / N )`, ami egy kritikus mérőszám arra, hogy mennyire szóródnak szét a készségek az osztályban (mindenki 3-as, vagy a fele 1-es, a fele 5-ös?).

### 3. Komponensek
#### [MODIFY] `src/App.tsx`
- Új navigációs gomb hozzáadása az alsó sávozásba egy Analytics (BarChart) ikonnal.
#### [MODIFY] `src/components/List.tsx`
- Egy "Archiválás / Mentés" gomb integrálása, amely az ideiglenesen beszkennelt tételeket archiválja az adott témával.
#### [NEW] `src/components/Analytics.tsx`
- A fő statisztikai nézet.
- **Funkciók lépésről lépésre:**
   1. Legördülőből (Select) választható Csoport (Osztály).
   2. Az alatta lévő listából kiválasztható egy adott Dolgozat (Téma + Dátum alapján), VAGY egy Diák az osztályból.
   3. Ha **Dolgozat** van kiválasztva:
       - Kimutatja a csoport átlagát és a szórást.
       - Egy nagy oszlopdiagram (`BarChart`) mutatja a jegyek eloszlását (Hány 1-es, 2-es lett, stb.).
       - Lista a diákokról, ahol szerkeszthetjük (Edit) is a korábban adott jegyeket vagy törölhetjük azokat egy gombbal a naplóból.
   4. Ha **Diák** van kiválasztva:
       - Egy egyedi vonaldiagram (`LineChart`) rajzolódik ki, amely a diák teljesítményének időbeli drasztikus változásait követi az eddigi dolgozatokon!

## Phase 6: Központi FAB és Manuális Jegybevitel
A felhasználó kérésére az UI egy modernebb, "Jegybevitel-központú" designt kap. A hagyományos navigáció helyett egy központi `+` gomb nyitja meg a lehetőségeket.

### Adatmodell
A Manuális bevitel a meglévő `scanned_tests` localStorage tömbbe fog inzertálni adatokat, pont úgy, mintha a kamera Szkennere csinálta volna.

### UI Kibővítés
#### [MODIFY] `src/App.tsx`
- A `BottomNav` komponens teljes újraírása. 
- A struktúra: `Lista` | `Csoportok` | `[Központi FAB +]` | `Eredmények` | `Beállítások` (üres placeholder a szimmetriához).
- A FAB gombra kattintva felugrik három opció (Speed Dial): 1. Szkenner, 2. Diktálás, 3. Manuális.

#### [NEW] `src/components/ManualEntry.tsx`
- A beküldött fotó alapján készül el.
- Kártyás elrendezés (Card) minden diáknak.
- Kártya fejlécében: Név, eddigi értékelések száma, átlag (az Archívumból kiszámolva).
- Kártya alján: 5 kerek gomb (`1 2 3 4 5`). 
- Ha a tanár rányom a `3`-asra, az automatikusan bekerül a "Lista" fülre, mint feldolgozandó eredmény. Visual feedback (pl. zöld pipa egy pillanatra) jelöli a sikert.

## Verification Plan
### Automated Tests
- `npm install recharts` futtatása.
- Megfelelő tesztadatok vizuális ellenőrzése az Analytics komonens tabján.
- Szórásképlet pontosságának verifikálása (pl: [1, 5, 3] halmaz).
