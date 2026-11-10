# Google Cloud Console Beállítás (Naptár API)

Ahhoz, hogy az alkalmazás a háttérben közvetlenül, gombnyomás nélkül egy új tab megnyitása nélkül elérhesse a naptáradat, létre kell hoznod egy hivatalos hozzáférést (egy ún. **Kliens azonosító**-t) a Google-nél. 

Kérlek kövesd az alábbi lépéseket asztali gépről (Mac-ről) a Google Cloud Console oldalon:

## 1. Projekt létrehozása
1. Nyisd meg a [Google Cloud Console](https://console.cloud.google.com/) oldalt.
2. Jelentkezz be a Google fiókoddal, fogadd el a feltételeket, ha most jársz ott először.
3. A bal felső sarokban (a Google Cloud felirat mellett) kattints a lenyíló menüre (pl. `Select a project`), majd felül az **Új projekt** (New Project) gombra.
4. Adj neki egy nevet (pl. `Teacher-Calendar-App`), majd kattints a **Létrehozás** (Create) gombra.
5. Pár másodperc múlva a felső legördülőből kiválaszthatod az új projektet.

## 2. Google Calendar API bekapcsolása
1. A bal oldali főmenüben menj az **APIs & Services** (API-k és szolgáltatások) → **Library** (Címtár) menüpontba.
2. A keresőbe írd be: `Google Calendar API`.
3. Kattints rá a kék ikonra a találatok között, majd nyomd meg az **Enable** (Engedélyezés) gombot.

## 3. Hozzájárulási képernyő (OAuth Consent Screen) beállítása
1. A bal menüben menj az **APIs & Services** -> **OAuth consent screen** (OAuth hozzájárulási képernyő) oldalra.
2. Jelöld be az **External** (Külső) opciót (ha nincs fizetős G-Suite/WorkSpace fiókod), majd nyomj a **Create** gombra.
3. App name: `Teacher Assistant Web`
4. User support email: Válaszd ki a saját email címedet a legördülőből.
5. (Görgess le teljesen alulra) Developer contact email: Ide is írd be a saját email címed.
6. Erre kattints a **Save and Continue** (Mentés és Tovább) gombra a tesztfelhasználók és scope módosítások nélkül az összes hátralévő oldalon végig, amíg el nem érsz az összefoglaló (Summary) oldalra.

## 4. Teszt felhasználó hozzáadása (Test Users)
*Ha nem adod hozzá az email címed tesztelőnek, nem fog beengedni a Google a saját alkalmazásodba.*
1. A menüben kattints vissza az **OAuth consent screen** gombra.
2. Görgess le a "Test Users" (Teszt felhasználók) részig, kattints az **ADD USERS** gombra.
3. Írd be a Google email címedet (vagy a telefonodét, amit bejelentkezéshez fogunk használni), kattints az ADD-ra!

## 5. Kliens azonosító (Client ID) létrehozása
1. A bal menüben kattints a **Credentials** (Hitelesítő adatok) menüpontra.
2. Felül kattints a **+ CREATE CREDENTIALS** gombra -> Válaszd: **OAuth client ID**.
3. Itt a legördülőből állítsd be ezt:
   - **Application type**: Web application
   - **Name**: `Teacher Web React App`
4. Görgess le az **Authorized JavaScript origins** (Engedélyezett JavaScript-eredetek) részhez:
   - Kattints az **+ ADD URI** gombra és add hozzá ezt: `http://localhost:5173`
   - Kattints újra az **+ ADD URI** gombra és add hozzá ezt: `https://192.168.0.36:5173` (ide írd azt a címet, amin a telefonodon szoktad nézni a fejlesztői szervert).
5. Kattints a **CREATE** (Létrehozás) gombra!

A legenerált "Client ID" szükséges ahhoz, hogy a jövőben elkészítsük a háttérszinkronizációt az aktuális alkalmazásban.
