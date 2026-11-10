# E-Kréta 2.0 - Fejlesztési Javaslatok és Tervek

Ez a dokumentum a projekt jövőbeli funkcióit, technikai fejlesztési lehetőségeit és ötleteit tartalmazza.

## ✅ Megvalósult Főbb UI/UX Mérföldkövek
- **Dinamikus 3-oszlopos Widget Dashboard:** Teljesen testreszabható felület, amely "dense" auto-flow logikával hézagmentesen rendezi az elemeket.
- **Kompakt, Intelligens Oldalsáv:** A navigációs sáv letisztult, helytakarékos, a bal oldali naptár- és órarend nézet ("Folyamatban" és "Következő óra" logikájának okos összevonásával) pedig minden fontos információt azonnal, duplikációmentesen mutat.
- **2D Kártya Átméretezés (Masonry Layout):** A widgetek magassága és szélessége húzással, szabadon állítható szerkesztő módban, látható háttérráccsal.
- **Drag & Drop Átrendezés:** A kártyák fogd-és-vidd módszerrel sorrendbe rakhatók, a beállításokat a böngésző (localStorage) megjegyzi.
- **Reszponzív, Tartalomfüggő Kártyák:** A widgetek belső elrendezése és betűmérete (pl. Óra, Időzítő) okosan igazodik a kártya aktuális méretéhez.

## 1. Kétirányú kommunikáció (Naplózás és Jelenlét)
A legfontosabb soron következő lépés, hogy a felület ne csak olvassa a Kréta adatait, hanem írni is tudjon bele.
- **Tanóra naplózása:** Az órakártyák mellé kerüljön egy "Naplózás" gomb. Erre kattintva a felületen kiválasztható legyen a téma, amit a háttérben futó Playwright robot automatikusan beír a Krétába.
- **Hiányzók rögzítése (Jelenlét widget):** Gyors felület a diákok listájának lekérésére, és a hiányzók automatikus beküldésére.
- **Értékelések (Jegybeírás):** Egy gyors panel, ahol egyszerre több diáknak is adható érdemjegy a Kréta lassú menüi nélkül.

## 2. Intelligens Asszisztens és AI Integráció (ÚJ!)
A modern pedagógiát támogató mesterséges intelligencia eszközök beépítése közvetlenül a vezérlőpultba:
- **Órai kvíz / feladat generátor:** Az aktuális tantárgy és téma alapján az AI automatikusan generál 5 gyors kérdést (Kahoot formátumban vagy csak nyomtatásra).
- **Szöveges értékelés író:** Diákok félévi/év végi szöveges értékelésének automatikus vázlata kulcsszavak (szorgalmas, figyelmetlen, fejlődő) megadásával.
- **Smart Keresés:** "Ki hiányzott tegnap a 10.C-ből?" típusú természetes nyelvű kérdések feltétele a felületen.

## 3. Teljesítmény és Adatkezelés (Caching & Cloud)
- **Memória gyorstár (In-memory cache):** A lekért órarendek és adatok ideiglenes tárolása a Node.js szerveren (pl. 10 perces lejárattal).
- **Session megtartása:** A robot ne zárja be azonnal a böngészőt, hanem tartsa nyitva a munkamenetet, hogy a további kéréseket azonnal ki tudja szolgálni.
- **Felhő alapú szinkronizáció:** A testreszabott Widget elrendezés (szélességek, magasságok, sorrend) és a "Gyors Teendők" szinkronizálása több eszköz között.

## 4. Kiterjesztett UI/UX továbbfejlesztések
- **Valós idejű idősáv az órarendben:** Egy vízszintes, mozgó vonal a napi órarend rácson, ami mutatja a pontos aktuális időt.
- **Helyettesítések vizuális jelzése:** Ha a Kréta rendszerből kiolvasható, hogy egy óra helyettesített, az kapjon egy egyedi, feltűnő színkódot (pl. sárga/narancs sáv).
- **Sötét/Világos mód automatizáció:** Rendszerszintű OS témához (prefers-color-scheme) igazodó automata váltás, finomhangolt átmenetekkel.

## 5. Robosztus hibakezelés és Architektúra
- Jobb védekezés a Kréta váratlan felugró ablakai (pl. jelszólejárat, új modul hirdetése) ellen a Playwright szkriptben.
- **PWA (Progressive Web App):** Az alkalmazás telepíthetővé tétele (manifest.json, service worker), hogy asztali/mobilos appként lehessen indítani.

## 6. Diák- és Csoportkezelés (CRM)
- **Csoportok és Diákok menüpont:** A tanított osztályok/csoportok listája.
- **Hangulat- és Trajektória követő:** Egyfajta "mini-CRM" rendszer, ahol a tanár gyorsan feljegyezheti egy-egy diák fejlődését, órai aktivitását, ami alapján a rendszer később automatikus statisztikát készít.

## 7. Külső Integrációk (Google Calendar & Gmail)
- **Google Naptár szinkronizáció:** A hivatalos iskolai (vagy privát) naptár eseményeinek megjelenítése az E-Kréta naptárában.
- **Gmail integráció:** Bejövő e-mailek és Kréta üzenetek együttes, közös kezelése a vezérlőpulton.
