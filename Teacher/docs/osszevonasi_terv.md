# Tanársegéd AI és Web App Összevonási Terv

Ez a dokumentum bemutatja, hogyan integráljuk a `teacher-assistant-web` funkcióit a `tanársegéd-ai---matek-&-fizika-asszisztens` dizájn rendszerébe, hogy egyetlen, robusztus alkalmazást kapjunk.

## User Review Required

> [!IMPORTANT]
> Mielőtt elkezdem a munkát, kérlek hagyd jóvá ezt a tervet! Különösen az adatbázis és backend stratégia (Firebase vs Local Server) kérdésében.

## Open Questions

> [!WARNING]
> 1. A Gemini AI hívásokhoz meg akarjuk tartani a lokális `server.ts` Express szervert, vagy inkább átmozgatnád az egészet kliens oldalra (vagy Firebase Cloud Functions-be)?
> 2. A mobil nézet (Phone Frame) teljesen megszűnik a webes verzióból, és egy reszponzív (de asztali fókuszú) webes layoutot kap az összes funkció?
> 3. Maradjon a lokális mappa `tanársegéd-ai---matek-&-fizika-asszisztens` néven, vagy hozzunk létre egy teljesen új mappát a teljes, egyesített projektnek?

## Proposed Changes

### Alapvető Architektúra (Base: tanársegéd-ai)
A bázis a `tanársegéd-ai---matek-&-fizika-asszisztens` marad, amely egy letisztult, Tailwind és Lucide-react alapú asztali/reszponzív felület.
Ebbe a projektbe fogjuk átemelni a Firebase authentikációt és az adatbázist.

---

### Hitelesítés és Adatbázis (Firebase)

#### [MODIFY] `src/App.tsx` (tanársegéd)
- Beemeljük a Firebase `onAuthStateChanged` logikát.
- Ha a felhasználó nincs bejelentkezve, megjelenítjük a `teacher-assistant-web` `Login.tsx` komponensét (a bázis dizájnjához igazítva).

#### [NEW] `src/firebase.ts` & `src/lib/db.ts`
- Átemeljük a `teacher-assistant-web`-ből a Firebase inicializálást és az adatbázis (Firestore) szinkronizációs függvényeket (`subscribeToUserData`, stb.).

---

### UI és Navigáció Egyesítése

A `tanársegéd` jelenleg egy oldalsávos (Sidebar) navigációt használ, ahol az AI eszközök találhatók. Ezt kiegészítjük az adminisztratív/gyakorlati modulokkal.

#### [MODIFY] `src/types.ts`
- A `ToolType` enum kibővítése az új modulokkal (pl. `SCANNER`, `GRADE_CALCULATOR`, `GROUPS`, `LIST`, `TIMER`, `SPINWHEEL`, `TEAMS`, `ANALYTICS`).

#### [MODIFY] `src/App.tsx` (Sidebar navigáció)
- Két kategóriára bontjuk az oldalsávot:
  1. **AI Asszisztens Eszközök** (Óraterv, Feladatsor, Módszertan, stb. - jelenlegiek)
  2. **Tanári Eszközök & Adminisztráció** (Szkennelés, Csoportok, Ponthatár Számító, Stopper, Szerencsekerék, stb.)
- A mobilalkalmazás "Bottom Nav" logikája megszűnik/átalakul, helyette minden a fő navigációból (vagy dashboardról) lesz elérhető.

---

### Funkciók Átemelése (Komponensek)

Az alábbi komponenseket átmásoljuk a `teacher-assistant-web/src/components` mappából a bázisba, és hozzáigazítjuk a Tailwind/Asztali layout formátumhoz:

#### [NEW] `src/components/Scanner.tsx`, `ManualEntry.tsx`, `VoiceEntry.tsx`
- A dolgozatértékelő és adminisztrációs modulok.
#### [NEW] `src/components/GradeCalculator.tsx`
- A ponthatár számító.
#### [NEW] `src/components/Tools/` (Timer, SpinWheel, TeamGenerator)
- A tanórai "quick tools".
#### [NEW] `src/components/Groups.tsx`, `List.tsx`, `Analytics.tsx`
- Az osztály és diák menedzsment.

---

### Backend és API (Gemini)

#### [MODIFY] `server.ts`
- A lokális Gemini Express szerver továbbra is kiszolgálja az AI kéréseket.
- Később kibővíthetjük, hogy az adatokat Firebase UID-hoz kötve, vagy biztonságosabban kezelje, de első lépésben marad a jelenlegi működése.

## Verification Plan

### Manual Verification
1. Futtatom a fejlesztői szervert az összevont mappában.
2. Ellenőrzöm, hogy a bejelentkezés (Google/Firebase) sikeresen működik.
3. Megnyitom a Dashboard-ot, ahol látszanak a wellbeing widgetek ÉS az aktuális órarendi információk.
4. Végigkattintom az új menüpontokat az oldalsávban (Szkennelés, Csapatgeneráló, Ponthatár), és megbizonyosodom róla, hogy beilleszkednek a dizájnba.
5. Indítok egy AI generálást (pl. Óraterv), hogy a `server.ts` működése is integrálva maradt.
