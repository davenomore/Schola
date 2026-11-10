# Tanári Asszisztens Alkalmazás

## Tervezés (Planning)
- [/] Architektúra és technológiai stack meghatározása (Vite + React + Vanilla CSS)
- [/] Implementation plan létrehozása és jóváhagyása

## Projekt Setup
- [x] Vite React TS projekt inicializálása
- [x] CSS design system készítése (színek, tipográfia, sötét mód)
- [x] Alapvető komponensek (gombok, kártyák, layout) elkészítése

## Mobilos Alkalmazás Fejlesztése (Scanner & Lista)
- [x] HTML5 Kamera API integrációja a böngészőbe
- [x] Scanner zöld keret és vizuális visszajelzések UI elkészítése
- [x] Ingyenes, offline OCR motor felváltása a prémium Google Gemini Visio AI-al (API kulcs bekötve)
- [x] Sikerült olvasás felugró kártya (Név, Pontszám, Jegy, Max pont)
- [x] Beszkennelt diákok lista nézetének megépítése beépített szerkesztővel
- [x] Adatmentés Local Storage-be és Export/Sync struktúra kialakítása
- [x] Osztályok és Tantárgyak (Csoportok) kezelőfelületének megépítése (és szerkesztési funkciója)
- [x] Szkenner módosítása a csoport és tantárgy rögzítéséhez a dolgozat elmentésekor

## Kréta Böngészőbővítmény és Felhő (Chrome Extension & Firebase)
- [x] Alap extension struktúra létrehozása (manifest.json, popup, content script)
- [x] Popup UI megépítése (Dark mode, sync gombok, JSON parser)
- [x] Kréta oldal szkriptelése: Auto-fill DOM logika felépítése (Bot clicker)
- [x] Firebase SDK telepítése és konfigurálása a Web Appban
- [x] List.tsx Firestore `setDoc` mentés bekötése (Vágólap helyett)
- [x] Chrome Extension Firestore REST API olvasás és gomb logika
- [x] Firestore Native Mode biztonsági szabályok élesítése a tanulói adatokon
- [x] Kényszerített Injektálásos SPA Script betöltő (Belső iframe letiltások ellen)
- [x] **Dinamikus Kréta UI Manipulátor (Kendo UI Dropdown kattintás simulálás és Téma kitöltés)**

## Statisztika és Archívum Modul (Analytics Dashboard)
- [x] Tervezés és grafikonrajzoló csomag telepítése (Recharts)
- [x] Adatmodell bővítése: Dolgozatok (TestSessions) végleges mentése Archívumként
- [x] 'Eredmények / Statisztika' oldal létrehozása és bekötése az alsó menüsávba
- [x] Csoportszintű statisztikák (Átlag, Szórás) és eloszlás Oszlopdiagramok (Recharts) megépítése
- [x] Diákszintű egyéni előrehaladás grafikon és múltbeli eredmény-szerkesztés implementálása

## Új Jegybevitel UX és Manuális Mód (FAB)
- [ ] Alsó navigációs sáv áttervezése: Középső nagy "+" FAB (Floating Action Button) bevezetése
- [ ] FAB Speed Dial menü készítése: Kamera, Diktálás, Manuális opciók
- [ ] `ManualEntry.tsx` létrehozása a beküldött design alapján (Diák kártyák, 1-5 gombok)
- [ ] Manuális jegybevitel logikájának összekötése az ideiglenes `scanned_tests` listával
