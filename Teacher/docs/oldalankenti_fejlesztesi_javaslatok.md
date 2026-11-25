# 📋 Schola - Oldalankénti Részletes Fejlesztési és Bővítési Terv

> **Dokumentum célja:** A Schola oktatási és tanári platform összes meglévő oldalának, fülének és moduljának szisztematikus áttekintése, valamint oldalankénti, kézzelfogható fejlesztési és funkcióbővítési javaslatok gyűjteménye.
> **Készült:** 2026. november
> **Célcsoport:** Fejlesztők, termékfelelősök és gyakorló pedagógusok.

---

## 🗺️ Tartalomjegyzék és Áttekintő Mátrix

| Modul / Oldal | Jelenlegi Funkciók | Fejlesztési Prioritás | Fő Fejlesztési Fókusz |
| :--- | :--- | :--- | :--- |
| **1. Vezérlőpult (Dashboard)** | Masonry rács, Kréta órarend, widgetek, időjárás, to-do | 🔥 Magas (P1/P2) | Napi fókusz, helyettesítés-figyelő, Kréta ping, widget layout profilok |
| **2. Üzenetek (Messages)** | Kréta üzenetek listája és olvasása | ⚡ Közepes (P2) | AI diplomata válaszgenerátor, sablonok, kategóriák |
| **3. Intelligens Értesítések (SNE)** | Fiók és banner, hiányzó jegyek, 250 órás limit | 🔥 Magas (P1) | Web Push értesítések, egyéni küszöbök, heti záró összegzés |
| **4. Órarend (Timetable)** | Heti/napi nézet, terem és tantárgy kijelzés | 🔥 Magas (P1/P2) | Óravázlat-csatolás, Google Naptár iCal export, teremütközés |
| **5. Napló & Csoportok (Groups)** | Diáklista, jegyek, átlagok, hiányzások, dicséretek | 🔥 Magas (P1) | Prediktív jegybecslő, Excel-szerű gyorsbevitel, órai plusz/mínusz |
| **6. Dolgozat Radar (Exams)** | Dolgozat-ütemező, fáziskövetés, AI feladatsor | ⚡ Közepes (P2) | Túlterheltség-figyelő (max 2 TZ/nap), A/B csoport, nyomtatható PDF |
| **7. Katedra AI Asszisztens** | Matek/fizika és általános óraterv, feladatsor generálás | 🚀 Prémium (P2/P3) | SNI/BTMN differenciáló motor, interaktív kvíz export, tantárgyi profilok |
| **8. Osztályfőnök (HeadTeacher)** | Hiányzás-figyelő, osztálypénz, szülinap, intézkedések | 🔥 Magas (P1/P2) | Intelligens ülésrend-tervező, 50 órás IKSZ, hivatalos levél generálás |
| **9. Tanári Eszközök (TeacherTools)** | Stopper, sorsoló, csapatok, pontozó, Padlet, Mentimeter | ⚡ Közepes (P2) | Digitális feladat/tételsorsoló, ClassDojo pontgyűjtő, kockadobó |
| **10. Classroom Screen (Tábla)** | Lebegő widgetek, zajszint, munkamód, faliújság, szavazás | 🔥 Magas (P1/P2) | Videólejátszó widget, vizuális óra-napirend, tábla layout mentés |
| **11. Diáknézetek (Mobile QR)** | Padlet faliújság és Mentimeter szavazó mobilfelület | ⚡ Közepes (P2) | Élő Q&A kérdésáramlat diák-szavazással, 3 perces kilépőkártya |
| **12. Beállítások (Settings)** | Widgetek, szünidők, könyvjelzők, téma | 🛠️ Rendszer (P2/P3) | JSON biztonsági mentés/visszaállítás, PWA offline mód, gyorsbillentyűk |

---

## 1. 📊 Vezérlőpult (Dashboard)

A Vezérlőpult a tanár digitális íróasztala. Jelenleg a 3-oszlopos rugalmas rácsban elhelyezett widgetekből, az automatikus Kréta órarend állapotjelzőből és a gyors műveletekből áll.

### Javasolt új funkciók és fejlesztések:
1. **Napi Pedagógiai Fókusz (Daily Focus / Pomodoro tanári mód):**
   - A nap elején 1 kiemelt pedagógiai vagy adminisztratív cél kitűzése (pl. *"Ma a 10.B-ben a passzív diákokat bátorítom"*, vagy *"A 11.A matek dolgozatokat mindenképp kijavítom"*).
   - Ez a kártya a fejlécben vagy egy kiemelt mini kártyán vizuálisan jelen van egész nap.
2. **Kréta Rendszerállapot & Szerver Sebesség Monitor (Ping Indicator):**
   - Egy diszkrét, esztétikus zöld/sárga/piros állapotjelző az e-Kréta hivatalos API válaszidejéről.
   - Időben tájékoztatja a pedagógust, ha a központi szerver karbantartás alatt áll vagy akadozik, megelőzve az adatvesztést.
3. **Gyors Helyettesítés és Teremcsere Értesítő Kártya:**
   - Reggeli kiemelt figyelmeztetés, ha a mai napon a tanár helyettesítést kapott, elmarad egy órája, vagy másik terembe kell mennie.
4. **Pedagógusi Jóllét & Hangulatnapló (Teacher Well-being & Stress Check):**
   - 1 kattintásos anonim/személyes önreflexió a nap végén (Energiaszint, Sikerélmény, Megterhelés).
   - Segít felismerni a túlterheltséget és a kiégési tendenciákat a tanév során.
5. **Widget Layout Profilok (Elrendezési Sablonok):**
   - Váltás előre definiált widget-elrendezések között:
     - *„Órai / Tanítási Profil”*: Kiemelt órarend, stopper, gyors jegyzet, sorsoló.
     - *„Délutáni / Adminisztrációs Profil”*: Todo lista, Kréta üzenetek, határidők, szokáskövető.
     - *„Minimalista Profil”*: Csak az aktuális óra és a legfontosabb teendők.
6. **Heti Órarendi Hőtérkép (Weekly Load Heatmap):**
   - Egy pillantásra látható mini vizualizáció, amely megmutatja a heti terhelést (mely napokon van 6-7 óra egybefüggően, és hol vannak a szabad lyukasórák a felkészüléshez).

---

## 2. 💬 Üzenetek (Kréta & Kommunikáció)

A Kréta belső üzenetküldő rendszere a szülőkkel, diákokkal és a vezetőséggel folytatott kommunikáció elsődleges terepe, amely jelenleg sok időt vesz el a pedagógusoktól.

### Javasolt új funkciók és fejlesztések:
1. **AI Diplomata Válaszgenerátor (Diplomatic Parent Reply Assistant):**
   - A beérkezett szülői panaszra vagy kérdésre gombnyomásra 3 professzionális válaszjavaslatot kínál:
     - *1. Empatikus & Bátorító* (megérti a családi helyzetet, személyes figyelmet ígér).
     - *2. Tárgyilagos & Hivatalos* (pontos jogszabályi és házirendi hivatkozásokkal).
     - *3. Konstruktív & Megoldásközpontú* (személyes fogadóórát és konkrét cselekvési tervet javasol).
2. **Kategóriák és Színes Címkék (Tags & Smart Folders):**
   - Automatikus vagy kézi címkézés: `Szülői Igazolás`, `Vezetőségi Körlevél`, `DÖK / Rendezvény`, `Sürgős / Megválaszolandó`.
3. **Előre Megírt Üzenetsablonok (Canned Responses):**
   - Gyakori rutinüzenetek 1 kattintásos beillesztése:
     - *"Köszönöm az orvosi igazolást, rögzítettem a naplóban."*
     - *"A következő fogadóóra időpontja..."*
     - *"Tájékoztatom, hogy a dolgozat kijavításra került..."*
4. **Válaszadási Határidő Figyelő (SLA Emlékeztető):**
   - Jelölje meg azokat a szülői vagy vezetőségi leveleket, amelyekre 48 órája nem érkezett válasz, így semmi nem merül feledésbe.

---

## 3. 🔔 Intelligens Értesítések (Smart Notification Engine - SNE)

A rendszer már rendelkezik a háttérben futó szabállyal és az oldalsó értesítési fiókkal (`NotificationDrawer.jsx`), amely a legfontosabb adminisztrációs mulasztásokat és kockázatokat szűri.

### Javasolt új funkciók és fejlesztések:
1. **Böngészős Push Értesítések (Web Notifications API) [✅ Jóváhagyva]:**
   - A pedagógus akkor is kapjon diszkrét asztali értesítést, ha a Schola egy másik lapon van megnyitva (pl. *"Csengetés 5 percen belül"*, *"Új szülői üzenet érkezett"*).
2. **Testreszabható Riasztási Küszöbértékek (Threshold Settings):**
   - A beállításokban a tanár maga állíthassa be a küszöböket:
     - Hiányzó jegy figyelmeztetés: alapértelmezett 3 hét helyett pl. 10 vagy 14 nap.
     - Veszélyes hiányzások: a 250 órás törvényi limit előtt már 180 vagy 200 óránál jelezzen.
3. **Pénteki Heti Záró Riport (Weekly Friday Digest):**
   - Péntek délután egy összefoglaló kártya jelenik meg:
     - *"Ezen a héten 18 jegyet rögzítettél."*
     - *"Minden tanórád beírásra került a naplóba."*
     - *"2 diák hiányzása maradt függőben igazolásra várva."*
     - *"Hétfőn a 10.A-ban témazáró dolgozat esedékes."*

---

## 4. 📅 Órarend (Timetable)

Az órarend nem csupán egy naptári táblázat, hanem a tanítási nap kronológiai vezérlője.

### Javasolt új funkciók és fejlesztések:
1. **Óravázlat & Tananyag Csatolás az Órákhoz:**
   - Az órarend egy adott órájára kattintva felugró ablakban lehessen:
     - Beírni az óra témáját és házi feladatát.
     - Csatolni a Katedra AI által generált óravázlatot vagy külső linket (pl. YouTube, Prezi).
2. **Kétirányú Naptár Szinkronizáció (Google / Apple Naptár iCal Export) [✅ Jóváhagyva]:**
   - Automatikusan frissülő titkos `.ics` naptárlink generálása és letöltése. A tanár feliratkozhat telefonja alapértelmezett naptárával az órarendre, így az iskolai órák, lyukasórák és helyettesítések közvetlenül megjelennek a telefonján.
3. **Terem- és Eszközfoglaltság Jelző:**
   - Szaktantermi órák (pl. Fizika előadó, Informatikai labor, Kémia szertár) esetén mutassa a speciális felszerelést és a projektor állapotát.
4. **Tanmenet és Előrehaladás Követő (Syllabus Progress Bar):**
   - Mutassa, hogy a tanmenethez képest hányadik óránál tart a csoport (pl. *Történelem 10.B: 42/72. óra - Időarányos haladás: +1 óra előnyben*).
5. **Időjárás Érzékeny Udvari / Szabadtéri Figyelmeztetés:**
   - Testnevelés vagy udvari szünetügyelet esetén azonnali ikon jelzi, ha a 4. órában eső vagy vihar várható.

---

## 5. 📚 Napló és Csoportok (Groups & Student Roster)

A tanári munka adminisztratív magja, ahol a tanulók érdemjegyei, hiányzásai és szaktanári értékelései találhatók.

### Javasolt új funkciók és fejlesztések:
1. **Prediktív Félévi és Évvégi Jegybecslő (Trend Elemző Algoritmus):**
   - A jegyek súlyozása (témazáró 200%, röpdolgozat 100%, órai munka 50%) és a fejlődési tendencia (javulás vs. romlás) alapján megmutatja a diák várható jegyét.
   - Sárga/piros felkiáltójellel jelöli a "billegő" tanulókat (pl. 2.44 vagy 3.48 átlagnál), ahol még 1 jó vagy rossz felelet sorsdöntő lehet.
2. **Gyors Órai Munka Értékelő (Plusz / Mínusz Rendszer):**
   - 1 kattintásos gyorsértékelő felület óra közben: `+` (aktív órai munka), `-` (hiányzó felszerelés / felkészületlenség).
   - Beállítható automatizmus: pl. 3 vagy 5 összegyűlt plusz után a rendszer felajánlja az 5-ös érdemjegy beírását.
3. **Excel-szerű Gyors Jegybeírás (Keyboard-first Grid):**
   - Dolgozatjavítás után a tanár a billentyűzet `Tab` és `Nyíl` gombjaival száguldva tudja beírni az egész osztály jegyeit másodpercek alatt.
   - Opcionális CSV import pontszámok alapján.
4. **Formatív és Szóbeli Szöveges Értékelés Tárhely:**
   - Nem minden pedagógiai visszajelzés számjegy: hely a diák egyéni szóbeli megfigyeléseinek és kompetenciafejlődésének tárolására.
5. **Fotós Névsor és Csoportkép Nézet:**
   - Új osztályoknál vagy helyettesítésnél felbecsülhetetlen érték: a diákok arcképével és nevével ellátott kártyarács a gyors megismeréshez és feleltetéshez.

---

## 6. 📝 Dolgozat Radar (Exams)

A felület jelenleg átlátja a tervezett, javítás alatt lévő és kész dolgozatokat, valamint tartalmazza a Gemini AI dolgozat- és javítókulcs-generátort.

### Javasolt új funkciók és fejlesztések:
1. **Iskolai Terheltség és Dolgozat-Ütközés Figyelő (Exam Load Balancer):**
   - Házirendi és törvényi szabályok ellenőrzése: egy osztályban egy napon legfeljebb 2 témazáró dolgozat íratható.
   - Ha egy másik szaktanár aznapra már beírt egy dolgozatot, a felület azonnal sárga figyelmeztetéssel jelzi az ütközési kockázatot.
2. **A és B Csoportos Automatikus Változatkészítés:**
   - A meglévő vagy AI által generált feladatsorból 1 kattintással készít párhuzamos, azonos nehézségű, de eltérő számozású/paraméterű A és B csoportot a másolás megelőzésére.
3. **Item-elemzés és Hibadiagnosztika:**
   - A dolgozat kijavítása után a feladatonkénti eredmények rögzítésével kimutatja:
     - *"A 3. algebrai egyenlet feladatot az osztály 70%-a elrontotta -> újraismétlendő anyag."*
     - *"Az 5. szöveges feladat kiemelkedően jól sikerült."*
4. **Nyomtatóbarát PDF Export (Dolgozatlap & Javítókulcs):**
   - Fejléccel (Név, Osztály, Dátum, Pontszám), rendezett vonalazással és pontozási segédlettel ellátott, A4-es méretben azonnal nyomtatható PDF készítése.
   - Külön egyoldalas tanári javítókulcs PDF.

---

## 7. 🤖 Katedra AI Szakmai Asszisztens

A mesterséges intelligenciával támogatott tanári asszisztens, amely már tartalmazza a matematika és fizika emelt szintű és általános tanári moduljait.

### Javasolt új funkciók és fejlesztések:
1. **Differenciáló & SNI / BTMN Támogató Motor:**
   - Bármilyen generált feladathoz vagy témakörhöz 1 gombnyomással 3 szintű differenciálást hoz létre:
     - *1. Könnyített / Lépésről lépésre vezetett változat* (tanulási nehézséggel küzdő, SNI/BTMN tanulóknak).
     - *2. Alap szintű tantervi követelmény*.
     - *3. Tehetséggondozó & Versenyfeladat* (a leggyorsabban haladóknak).
2. **Interaktív Kvíz & Interaktív Kvíz Export:**
   - A feldolgozott tananyagból közvetlenül exportálható formátumokat állít elő:
     - Kvíz Excel sablon közvetlen feltöltéshez.
     - Quizlet szókártya vagy fogalomtár.
     - Google Forms / Microsoft Forms kvíz import.
3. **Tantárgyi Portfólió Kiszélesítése Más Szakokra:**
   - *Történelem:* Korabeli forráselemzési feladatok és vaktérkép-kérdések generálása.
   - *Magyar nyelv és irodalom:* Műelemzési szempontsorok, fogalmazási témák és javítási rubrikák.
   - *Idegen nyelv:* Szövegértési feladatok, szókincskártyák, pármunka-szerepjátékok.
   - *Biológia & Földrajz:* Ábrafelismerési és környezetvédelmi esettanulmányok.
4. **Pedagógus Portfólió és Óralátogatási Reflexió Támogató:**
   - Az óravázlatok formázása az Oktatási Hivatal (OH) és a minősítési elvárások szerinti struktúrában, beépített módszertani indoklással és önreflexiós szempontokkal.

---

## 8. 👨‍🏫 Osztályfőnöki Irányítópult (HeadTeacher)

Az osztályfőnökök nemcsak tanítanak, hanem egy egész közösség adminisztrációjáért, mentális jóllétéért és jogi megfeleléséért felelnek.

### Javasolt új funkciók és fejlesztések:
1. **Intelligens Ülésrend Tervező (Smart Drag & Drop Seating Chart):**
   - Vizuális tantermi alaprajz (padsorok, katedra, ablak, ajtó).
   - Intelligens pedagógiai szabályrendszer:
     - *"Szemüveges / gyengénlátó diákok az első 2 padsorban."*
     - *"Összeférhetetlen vagy sokat beszélgető párok tiltása."*
     - *"Differenciált tanulópárok (erős diák segít a felzárkózónak)."*
     - *"1 kattintásos véletlenszerű helycsere havonta."*
2. **50 Órás Iskolai Közösségi Szolgálat (IKSZ) Tracker:**
   - A középiskolai érettségi feltételeként kötelező 50 óra precíz nyilvántartása:
     - Diákonkénti teljesített órák száma (pl. 35/50 óra).
     - Fogadó intézmények neve, leadott igazolások és naplók állapota.
     - Riasztás végzős évben a lemaradóknak.
3. **Hivatalos Értesítő Levél Generátor (10 és 30 órás hiányzások):**
   - A törvény által előírt hivatalos dokumentumok (szülői figyelmeztetés 10 óránál, gyámhatósági bejelentés 30 óránál) automatikus kitöltése a diák adataival és a hiányzások dátumaival, PDF letöltéssel.
4. **Fogadóóra és Szülői Értekezlet Szervező:**
   - 10-15 perces idősávos beosztás a szülők számára.
   - Szülőnkénti titkos jegyzetfüzet a megbeszélt célokról és megállapodásokról.
5. **Közösségi Háló & Szociometria (Kapcsolati Térkép):**
   - Évente 1-2 alkalommal kitölthető mini osztályközösségi kérdőív alapján Mérei-féle szociogram készítése.
   - Megmutatja a peremre szorult, kirekesztett diákokat és a hangadókat, segítve az időben történő közösségfejlesztést *(szigorúan a vizuális szabály betartásával: csak pontok/csomópontok zavaró feliratok nélkül)*.

---

## 9. 🛠️ Tanári Eszközök (TeacherTools)

A tanári eszközök fül a tanóra alatti azonnali mikro-segédeszközöket gyűjti össze (Stopper, Véletlen sorsoló, Csapatgenerátor, Érdemjegy kalkulátor, Faliújság, Mentimeter).

### Javasolt új funkciók és fejlesztések:
1. **Diák Rangsor & Gamifikációs Pontgyűjtő (ClassDojo stílusú modul):**
   - Pozitív viselkedés és kooperáció jutalmazása virtuális jelvényekkel (pl. *"Kreatív ötlet"*, *"Csapatmunka"*, *"Segítőkészség"*).
   - Osztályszintű közös célok (pl. 100 pont elérésekor zenehallgatás feladatmegoldás közben).
2. **Kombinált Diák- és Tételsorsoló (Feleltető / Prezentáció Sorsoló):**
   - Nemcsak a tanuló nevét sorsolja ki a kerék, hanem egy feltöltött kérdés- vagy tétellistából véletlenszerű tételt is rendel mellé.
3. **Digitális Kockadobó és Pénzfeldobó (Valószínűségszámítási Eszköz):**
   - 1-6 dobókocka virtuális eldobása 3D animációval és valós idejű statisztikai összegzéssel (ideális matematika és természettudományos kísérletekhez).
4. **Kirándulás & Rendezvény Költségkalkulátor:**
   - Osztálykirándulás költségvetés-tervezője (buszbérlés, szállás, étkezés, belépők) tanulónkénti önköltség-számítással és hiányzói tartalékkalkulációval.

---

## 10. 🖥️ Classroom Screen (Interaktív Tantermi Képernyő)

A digitális táblára vagy kivetítőre optimalizált munkatér, amely a tanóra alatt a diákok szeme előtt van.

### Javasolt új funkciók és fejlesztések:
1. **Beágyazott Videólejátszó Widget (YouTube / Helyi videó):**
   - Oktatóvideók közvetlen lejátszása a Classroom Screen ablakain belül, hirdetésmentesen, időzített leállítással, anélkül, hogy külön böngészőlapot kellene megnyitni.
2. **Vizuális Óra-Napirend Widget (Visual Lesson Agenda & Progress):**
   - Látványos folyamatjelző sáv a tanóra fázisairól:
     - `1. Bevezetés & Házi feladat megbeszélése [8 perc]`
     - `2. Új anyag feldolgozása [20 perc]`
     - `3. Csoportos feladatmegoldás [12 perc]`
     - `4. Összegzés & Kilépőkártya [5 perc]`
   - A diákok folyamatosan látják, hol tart az óra, ami drasztikusan javítja az időgazdálkodást és csökkenti a szorongást.
3. **Tábla Elrendezések Mentése és Visszatöltése (Screen Presets) [✅ Jóváhagyva]:**
   - 1 kattintásos váltás előre elmentett tábla-állapotok között (pl. *"Dolgozatírás elrendezés"*: nagy óra + csend munkamód + időzítő; *"Órai magyarázat"*: rajztábla + jegyzet + QR kód). Egyéni elrendezések elmentése névvel a helyi profilokba.
4. **„Fókusz / Blackout” Gomb:**
   - Egyetlen gyorsbillentyűvel (pl. `B` gomb) a teljes képernyő azonnal feketére váltható, amikor a tanár azt szeretné, hogy minden tekintet kizárólag rá irányuljon, ne a kivetítőre.
5. **Digitális Pdf / Munkafüzet Megjelenítő Widget [✅ Jóváhagyva]:**
   - Digitális tankönyv vagy feladatlap közvetlen kivetítése, kétujjas nagyítással és rárajzolási lehetőséggel.

---

## 11. 📱 Interaktív Diáknézetek (Mobile QR Code Interactions)

A Schola képessége, hogy a diákok saját okostelefonjukkal (BYOD - Bring Your Own Device), telepítés nélkül, pusztán a táblán lévő QR-kód beolvasásával bekapcsolódhatnak az órába.

### Javasolt új funkciók és fejlesztések:
1. **Élő Kérdezz-Felelek & Anonim Kérdésküldés (Live Q&A Stream):**
   - Óra közben a diákok bármikor feltehetik kérdéseiket telefonjukról, ha valamit nem értenek, de nem mernek megszólalni a többiek előtt.
   - A diákok szavazhatnak egymás kérdéseire (upvote), a tanári táblán pedig a legtöbb szavazatot kapott kérdések jelennek meg legfelül.
2. **Digitális 3 Perces Kilépőkártya (Exit Ticket) [✅ Jóváhagyva]:**
   - Az óra utolsó perceiben kivetített QR-kód, ahol a diák 3 gyors kérdésre válaszol a mobilján:
     - *1. Mi volt a legfontosabb gondolat, amit ma megértettél?*
     - *2. Mi maradt még homályos vagy nehezen érthető?*
     - *3. Milyen hangulatban távozol a mai óráról? (1-5)*
   - A rendszer óra után azonnal összefoglalja a tanárnak a visszajelzéseket a táblán és a tanári eszközökben.
3. **Csapatmunka Központ (Team Workspace Mobile Hub):**
   - A csoportgenerálás után a diák telefonján megjelenik, hogy ki a 3 másik csapattársa, mi a feladatuk és mennyi idő van még hátra a csoportmunkából.
4. **Élő Kvíz Versenymód (Gamifikált játékos, pontozásos Vetélkedő & AI Kvíz Generálás) [✅ Jóváhagyva]:**
   - A Mentimeter szavazó kibővítése pontozásos, időre menő kvíz funkcióval, ahol a diákok versenyezhetnek az óra végén.
   - **AI Témakör-Kvíz Generátor:** Bármilyen megadott tantárgyi témakörből (pl. *"Másodfokú egyenletek diszkriminánsa"* vagy *"Mohácsi csata okai"*) az AI azonnal legenerálja a 4 válaszos, helyes megoldással megjelölt kvízkérdéseket és opciókat.

---

## 12. ⚙️ Beállítások és Rendszerkonfiguráció (Settings & Admin)

A rendszer stabilitásáért, hordozhatóságáért és a tanár személyes munkafolyamataihoz való igazodásáért felelős modul.

### Javasolt új funkciók és fejlesztések:
1. **Biztonsági Mentés & Helyreállítás (Backup & Restore - JSON Export/Import):**
   - A tanár egyetlen gombnyomással exportálhassa egy fájlba az összes személyes beállítását, osztálypénz-táblázatát, feljegyzéseit, todo-jait és egyéni widget-elrendezéseit.
   - Iskolai gépcsere vagy otthoni munka esetén a fájl azonnal importálható, így minden szinkronban marad.
2. **PWA Offline Működés & Teljes Mobil Reszponzivitás [✅ Jóváhagyva & Kiemelt Fókusz]:**
   - **Kiemelt követelmény:** Minden lehetséges tanári oldal és eszköz reszponzív mobilnézetben is kényelmesen használható legyen okostelefonról (pl. gyors jegyzet, hiányzás-ellenőrzés, szavazás indítása, órarend).
   - Ha az iskolai Wi-Fi hálózat leáll, a már betöltött Schola alkalmazás (órarend, stopper, rajztábla, jegyzetek, sorsoló) zavartalanul működjön tovább helyi offline gyorsítótárból.
3. **Gyorskereső és Parancssor (Command Palette - `Ctrl + K` / `Cmd + K`):**
   - Univerzális gyorskereső bármely diák nevére, funkcióra vagy órára (pl. gépelés: *"Nagy Péter"* -> azonnal megnyitja a diák adatlapját; *"Stopper"* -> elindítja az időzítőt).
4. **Akadálymentesítés & Olvasási Módok:**
   - Diszlexia-barát betűtípus opció (OpenDyslexic).
   - Magas kontrasztú fekete-fehér téma gyengénlátóknak és napsütötte tantermekhez.

---

## 🏆 Javasolt Megvalósítási Ütemterv (Roadmap)

### 🥇 1. Fázis: Gyors Nyereség (Quick Wins - 1-2 hét)
- [ ] Vezérlőpult: Kréta szerver sebesség (ping) indikátor és Napi Fókusz kártya.
- [ ] Classroom Screen: Vizuális óra-napirend widget és Blackout (sötétítés) gomb.
- [ ] Tanári Eszközök: Digitális kérdés/tételsorsoló kombináció.
- [ ] Diáknézet: 3 perces digitális Kilépőkártya (Exit Ticket) a szavazóba integrálva.

### 🥈 2. Fázis: Pedagógiai és Adminisztrációs Mélyülés (3-4 hét)
- [ ] Dolgozat Radar: Iskolai terheltség / maximum 2 TZ naponta ütközésvizsgáló.
- [ ] Osztályfőnök: Drag & drop intelligens ülésrend-tervező és IKSZ 50 órás tracker.
- [ ] Katedra AI: 3 szintű SNI/BTMN differenciáló modul.
- [ ] Napló & Csoportok: Prediktív jegybecslő és órai plusz/mínusz gyorsnaplózó.

### 🥉 3. Fázis: Integráció és Hordozhatóság (Középtáv)
- [ ] Beállítások: Teljes JSON konfiguráció mentés és visszaállítás (Backup/Restore).
- [ ] Órarend: Google / Apple Naptár kétirányú `.ics` szinkronizáció.
- [ ] Üzenetek: AI diplomata szülői levélíró asszisztens 3 stílusvariációval.
- [ ] Diáknézet: Élő anonim kérdezz-felelek (Q&A stream) szavazással.
