# 📱 Teacher Assistant — Funkciók Áttekintése

> **Verzió:** 2.0 (Cloud & Multi-User)  
> **Platform:** PWA (Progressive Web App) + Chrome Bővítmény  
> **Utoljára frissítve:** 2026. március 25.

---

## 🔐 Hitelesítés és Felhő

| Funkció | Leírás |
|---------|--------|
| **Google Bejelentkezés** | Firebase Auth, Google fiókkal való bejelentkezés egyetlen gombnyomással |
| **Felhasználói Izoláció** | Minden tanár saját Firestore dokumentumban tárolja az adatait (`users/{uid}`) |
| **Offline-First Szinkronizáció** | Firestore IndexedDB persistence — hálózat nélkül is működik, majd automatikusan szinkronizál |
| **LocalStorage Migráció** | Első bejelentkezéskor a korábbi helyi adatok automatikusan feltöltődnek a felhőbe |

---

## 📋 Csoportkezelés

| Funkció | Leírás |
|---------|--------|
| **Csoportok létrehozása** | Osztályok és tantárgyak hozzárendelésével |
| **Diákok kezelése** | Név szerinti hozzáadás, törlés, rendezés |
| **Kréta Import** | A Chrome Bővítmény által leolvasott névsorok áthúzása a csoportokba |
| **Teendők (Todo)** | Csoportonkénti teendők rögzítése határidővel és emlékeztetővel |
| **Naptár export (.ics)** | Teendőkhöz generált naptárfájl letöltése, natív naptárba importálható |

---

## ✏️ Osztályzás és Adatrögzítés

| Funkció | Leírás |
|---------|--------|
| **Kamerás Szkennelés** | Dolgozatok fotózása → Gemini Vision AI kiolvassa a nevet és pontszámot |
| **Hangalapú Diktálás** | Mikrofonba mondott eredmények (pl. "Nagy Pista ötös") → AI feldolgozás + Fuzzy Match |
| **Manuális Bevitel** | Kézi űrlap a diák nevéhez, jegyéhez, pontszámához, témájához |
| **Dolgozat téma és típus** | Minden jegyhez rögzíthető a téma, típus (témazáró, röpdolgozat...) és súly |

---

## 📊 Statisztika és Elemzés

| Funkció | Leírás |
|---------|--------|
| **Eredmények nézet** | Beolvasott dolgozatok listája szűrhetően |
| **Archiválás** | Lezárt dolgozatok archiválása a statisztika oldalra |
| **Osztályátlag számítás** | Automatikus átlag, eloszlás megjelenítés csoportonként |

---

## 🕐 Órarend

| Funkció | Leírás |
|---------|--------|
| **Órarend importálás** | Szöveges beillesztéssel vagy manuálisan kitölthető heti rács |
| **"Most éppen" banner** | Az aktuális órát és osztályt kijelzi a felső sávban (valós idejű) |
| **Szünet/Lyukasóra felismerés** | Automatikusan jelzi, ha szünet vagy szabad óra van |

---

## 🧮 Eszközök

| Funkció | Leírás |
|---------|--------|
| **Ponthatár Számító** | Max pontszám + százalékos küszöbök → automatikus ponthatár kiszámítás jegyenként |
| — Kerekítés | Lefelé / Matematikai / Felfelé kerekítés egész pontokra |
| — Összesítő táblázat | Tiszta áttekintés: jegy, %, ponttól–pontig |

---

## 🔌 Chrome Bővítmény (Kréta Autofill)

| Funkció | Leírás |
|---------|--------|
| **Névsor leolvasás** | Egyetlen gombbal leolvassa a Kréta napló diáknévsorát |
| **Felhő feltöltés** | A leolvasott névsor a tanár Firestore fiókjába kerül |
| **4-jegyű párosító kód** | A bővítmény a webalkalmazásban generált kóddal kapcsolódik a fiókhoz |
| **Jegyek letöltése** | A felhőben tárolt jegyek lekérhetők és beírhatók a Krétába |

---

## ⚙️ Beállítások

| Funkció | Leírás |
|---------|--------|
| **Profil nézet** | Google fiók neve, emailje, profilképe |
| **Bővítmény Kód** | 4-jegyű párosító kód megjelenítése és másolása |
| **Kijelentkezés** | Google fiókból való kilépés |
| **Értesítések** | *(hamarosan)* |
| **Megjelenés** | *(hamarosan)* |

---

## 🔔 Értesítések

| Funkció | Leírás |
|---------|--------|
| **In-App értesítések** | Teendő-emlékeztetők az alkalmazáson belül |
| **Háttér polling** | Aktív figyelés a lejáró teendőkre Firestore-ból |

---

## 🧭 Navigáció

| Funkció | Leírás |
|---------|--------|
| **Alsó navigációs sáv** | Csoportok · Lista · [+] · Órarend · Több |
| **"Több" menü** | Felcsúszó panel: Eredmények, Ponthatárok (bővíthető) |
| **FAB (Floating Action Button)** | [+] gomb → Szkennelés / Manuális / Diktálás gyorsmenü |
| **Profilkép → Beállítások** | A felső sávban a profilképre bökve nyílik a Beállítások oldal |

---

*Ez a dokumentum a Teacher Assistant aktuális funkcióit tartalmazza. Új funkció megvalósításakor frissítendő.*
