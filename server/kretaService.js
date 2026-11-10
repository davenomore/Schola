const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CACHE_FILE = path.join(__dirname, 'kreta_cache.json');

class KretaService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.lock = Promise.resolve();
  }

  // Helper method for acquiring lock
  async _withLock(task) {
    let release;
    const nextLock = new Promise(resolve => release = resolve);
    const previousLock = this.lock;
    this.lock = previousLock.then(() => nextLock);
    try {
      await previousLock;
      return await task();
    } finally {
      release();
    }
  }

  loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      }
    } catch (e) { console.error('Cache load error', e); }
    return { students: [], timetable: {} };
  }

  saveCache(data) {
    try {
      const currentCache = this.loadCache();
      const newCache = { ...currentCache, ...data };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(newCache, null, 2), 'utf8');
    } catch (e) { console.error('Cache save error', e); }
  }

  async initBrowser() {
    if (this.browser && !this.browser.isConnected()) {
      console.log('Korábbi böngésző munkamenet lezárult, új indítása...');
      this.browser = null;
      this.page = null;
    }

    if (!this.browser) {
      const isDev = process.env.NODE_ENV !== 'production' && !process.env.RENDER;
      const launchOptions = {
        headless: process.env.HEADLESS !== undefined ? process.env.HEADLESS === 'true' : !isDev,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      };

      if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        launchOptions.executablePath = process.env.CHROME_PATH;
      } else if (isDev && fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')) {
        launchOptions.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      }

      this.browser = await chromium.launch(launchOptions); 
      const context = await this.browser.newContext();
      this.page = await context.newPage();
    }
  }

  // Sütik automatikus kezelése és elfogadása
  async handleCookieConsent(page = this.page) {
    if (!page) return;
    try {
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      
      // Pontos szelektor a Kréta süti elfogadó gombjára (kizárólag a <button>-re céloz, véletlenül sem a linkre)
      const cookieSelector = 'button[formaction*="acceptnecessarycookies"], button.btn-kreta:has-text("Az összes kötelező cookie elfogadása"), button:has-text("összes kötelező cookie elfogadása")';
      const cookieBtn = page.locator(cookieSelector).first();
      
      // Megvárjuk, amíg a gomb megjelenik a DOM-ban
      const isAttached = await cookieBtn.waitFor({ state: 'attached', timeout: 5000 }).then(() => true).catch(() => false);
      if (isAttached) {
        console.log('Süti tájékoztató modal érzékelve! Közvetlen gombkattintás a gombra (evaluate click)...');
        
        // Közvetlenül a BUTTON elemen hajtjuk végre a natív JavaScript .click() eseményt:
        // Ez garantálja, hogy véletlenül se a gomb feletti szöveges linkre ("tájékoztatóban") kattintson!
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
          cookieBtn.evaluate(b => b.click())
        ]);
        console.log('Sütik sikeresen elfogadva, modal lezárva!');
        await page.waitForTimeout(600);
      }

      // Ha esetleg korábban megnyílt volna a "tájékoztatóban" külső Tudásbázis lap, azt bezárjuk
      if (this.browser) {
        const contexts = this.browser.contexts();
        for (const ctx of contexts) {
          for (const p of ctx.pages()) {
            if (p.url().includes('tudasbazis.ekreta.hu') || p.url().includes('CookiePolicy')) {
              console.log('Tudásbázis tájékoztató fül bezárása...');
              await p.close().catch(() => {});
            }
          }
        }
      }
    } catch (err) {
      console.log('Süti elfogadás nem volt szükséges vagy átlépve:', err.message);
    }
  }

  async login(username, password, schoolId) {
    try {
      await this.initBrowser();
      console.log('Navigálás a Kréta belépési oldalára...');
      // Itt a schoolId alapján generáljuk le az iskola pontos Kréta linkjét
      const loginUrl = `https://${schoolId}.e-kreta.hu/Adminisztracio/Login`;
      await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Megvárjuk az IDP bejelentkező oldal / átirányítás betöltődését
      await this.page.waitForURL(url => url.href.includes('idp.e-kreta.hu') || url.href.includes('Login'), { timeout: 15000 }).catch(() => {});
      await this.page.waitForLoadState('networkidle').catch(() => {});

      // Sütik automatikus elfogadása
      await this.handleCookieConsent();

      // Ellenőrizzük, hogy véletlenül nem maradt-e még aktív a modal
      const modalStillVisible = await this.page.locator('.modal.show, button[formaction*="acceptnecessarycookies"]').isVisible().catch(() => false);
      if (modalStillVisible) {
        console.log('A süti modal még mindig látható, újrapróbálkozás a gombbal...');
        await this.handleCookieConsent();
      }

      console.log('Adatok kitöltése...');
      // Kréta IDP-n a mezők: UserName és Password, gomb: #submit-btn
      try {
        await this.page.waitForSelector('input[name="UserName"], #UserName', { state: 'visible', timeout: 5000 });
        await this.page.fill('input[name="UserName"], #UserName', username);
        await this.page.fill('input[name="Password"], #Password', password);
        
        console.log('Belépés indítása (gomb kattintás vagy Enter)...');
        const submitBtn = this.page.locator('#submit-btn, button[type="submit"]:has-text("BEJELENTKEZÉS"), button:has-text("Bejelentkezés")').first();
        if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await submitBtn.click();
        } else {
          await this.page.press('input[name="Password"], #Password', 'Enter');
        }
      } catch (e) {
        console.log('Automatikus kitöltés hiba, várunk a manuális belépésre...', e.message);
      }

      // Várakozás, amíg betölt valamilyen oldal (esetleg a modulválasztó)
      await this.page.waitForLoadState('networkidle').catch(() => {});

      // Megnézzük, hogy a Kréta modulválasztó oldalán vagyunk-e
      try {
        const naploGomb = await this.page.getByText('Elektronikus napló', { exact: false });
        if (await naploGomb.count() > 0) {
          console.log('Modulválasztó érzékelve! Kattintás az Elektronikus naplóra...');
          await naploGomb.first().click();
          
          await this.page.waitForTimeout(3000); // Várunk, hátha új fül nyílik
          
          // Ha új ablak/fül nyílt, váltsunk a legfrissebb Kréta napló fülre (kizárva a külső tájékoztató lapokat)
          const context = this.browser.contexts()[0];
          const validPages = context.pages().filter(p => !p.url().includes('tudasbazis.ekreta.hu') && !p.url().includes('CookiePolicy'));
          if (validPages.length > 0) {
            this.page = validPages[validPages.length - 1]; // A legutolsó érvényes napló fül
          }

          await this.page.waitForLoadState('networkidle').catch(() => {});
          await this.handleCookieConsent();
        }
      } catch (err) {
        console.log('Nem találtam Elektronikus napló gombot, továbblépés.');
      }

      return { success: true };
    } catch (error) {
      console.error('Kréta belépési hiba:', error);
      if (!this.browser || !this.browser.isConnected()) {
        return { success: false, message: 'Nem sikerült elindítani a háttérböngészőt. Kérjük próbálja újra!' };
      }
      // Ha manuálisan lépett be a felhasználó, akkor is sikeresnek vesszük, ha nincs komoly hiba
      return { success: true }; 
    }
  }

  async addGrade(studentId, gradeValue, subject, type) {
    if (!this.page) {
      throw new Error('Előbb be kell jelentkezni!');
    }

    try {
      console.log('Jegy rögzítésének megkezdése...');
      
      // Példa: Navigálás az értékelések oldalra
      // await this.page.goto('https://...e-kreta.hu/Ertekelesek');

      // Ezeket a kattintásokat pontosan úgy kell felprogramozni, ahogy Ön kattintana!
      
      // PÉLDA FOLYAMAT (kommentezve, mert a pontos Kréta gomb-neveket meg kell keresnünk):
      // await this.page.click('#uj-ertekeles-gomb');
      // await this.page.selectOption('#diak-kivalaszto', studentId);
      // await this.page.selectOption('#tantargy-kivalaszto', subject);
      // await this.page.fill('#jegy-mezo', gradeValue);
      // await this.page.click('#mentes-gomb');
      
      // Várakozás a sikeres mentés jelzésére
      // await this.page.waitForSelector('.sikeres-mentes-uzenet');

      return { status: 'Értékelés sikeresen szimulálva', grade: gradeValue };
    } catch (error) {
      console.error('Jegybeírási hiba:', error);
      throw error;
    }
  }

  async getTimetable(requestedDayIndex = null, refresh = false, isClass = false) {
    const currentDay = new Date().getDay();
    const defaultDay = [0, 6].includes(currentDay) ? 1 : currentDay;
    const dayIndexToUse = requestedDayIndex !== null ? requestedDayIndex : defaultDay;
    
    const napok = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    const activeDay = napok[dayIndexToUse];
    
    // Cache logikája
    const cacheKey = isClass ? 'classTimetable' : 'timetable';
    const cache = this.loadCache();
    if (!refresh && cache[cacheKey] && cache[cacheKey][dayIndexToUse] && cache[cacheKey][dayIndexToUse].length > 0) {
      console.log(`[Backend] ${isClass ? 'Osztály' : 'Tanári'} Órarend betöltése cacheből (${activeDay})...`);
      const finalSchedule = JSON.parse(JSON.stringify(cache[cacheKey][dayIndexToUse]));
      
      // Jelenlegi óra kiemelése
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      for (const ora of finalSchedule) {
        if (ora.duration && ora.duration.includes('-')) {
          const [startStr, endStr] = ora.duration.split(' - ');
          const startMin = parseInt(startStr.split(':')[0]) * 60 + parseInt(startStr.split(':')[1]);
          const endMin = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);
          if (currentMinutes >= startMin && currentMinutes <= endMin) {
            ora.isActive = true;
          }
        }
      }
      return { data: { day: activeDay, list: finalSchedule }, fromCache: true };
    }

    if (!this.page) {
      console.log('[Fejlesztői mód] Nincs valós böngésző munkamenet, mock adatok visszadása...');
      const mockSchedule = [
         { id: 1, hourNumber: 1, subject: 'Matematika', details: '11.A', room: '201', duration: '07:30 - 08:15', time: '07:30' },
         { id: 2, hourNumber: 2, subject: 'Történelem', details: '11.A', room: '201', duration: '08:25 - 09:10', time: '08:25' }
      ];
      return { data: { day: activeDay, list: isClass ? mockSchedule : [] }, fromCache: false };
    }

    // Ha osztály órarendet kérünk, az a régi UI-on egy TODO!!! oldalra visz, 
    // ezért ne navigáljunk oda, mert elrontja a többi hívást.
    // Később ezt a GetOrarendKereso API-ból kell feltölteni.
    if (isClass) {
       console.log('Osztály órarend lekérése blokkolva, mert a régi Kréta oldal hibás (TODO!!!). Később API-ból lesz implementálva.');
       return { data: { day: activeDay, list: [] }, fromCache: false };
    }

    return this._withLock(async () => {
      try {
        console.log(`Navigálás a Tanári Órarend oldalra...`);
        
        const targetUrl = 'https://bmszc-neumann.e-kreta.hu/Orarend/TanariOrarend';
        const urlCheck = 'TanariOrarend';
        
        if (!this.page.url().includes(urlCheck)) {
            try {
              await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            } catch (e) {
              console.log('Navigációs timeout:', e.message);
            }
            
            try {
              await this.page.waitForSelector('.fc-time-grid', { timeout: 10000 });
            } catch(e) {
              console.log('Naptár rács nem található:', e.message);
            }
            
            // Csak ÚJ navigálás esetén lapozunk!
            const todayDay = new Date().getDay();
            if (todayDay === 0 || todayDay === 6) {
               console.log('Hétvége van, lapozás a következő hétre a Kréta naptárban...');
               try {
                  await this.page.click('.fc-next-button');
                  // Várjuk meg, amíg a háttérben futó XHR lekérdezés befejeződik és betölt az órarend
                  await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
                  await this.page.waitForTimeout(1000); 
               } catch (e) {
                  console.log('Nem sikerült a következő hétre lapozni:', e.message);
               }
            } else {
               await this.page.waitForTimeout(1000); 
            }
          }
          
          // Még egy extra kis várakozás, hogy biztosan rendereljen a naptár
          await this.page.waitForTimeout(1000);

        const orarend = await this.page.$$eval('.fc-time-grid .fc-content-skeleton > table > tbody > tr', (sorok, dIdx) => {
          if (!sorok || sorok.length === 0) return [];
          const row = sorok[0];
          const cells = row.querySelectorAll('td');
          
          const cellIndexToUse = dIdx === 0 ? 7 : dIdx;
          const targetCell = cells[cellIndexToUse] || cells[cells.length - 1];
          if (!targetCell) return [];

          const elemek = Array.from(targetCell.querySelectorAll('.fc-event'));

          return elemek.map((elem, index) => {
            const timeText = elem.querySelector('.fc-time')?.getAttribute('data-start') || '';
            const titleHtml = elem.querySelector('.fc-title')?.innerHTML || '';
            
            const parts = titleHtml.split('<br>');
            const subjectAndClass = parts[0] || '';
            const room = parts[1] || '';
            
            const subject = subjectAndClass.split(' - ')[0] || subjectAndClass;
            const details = subjectAndClass.split(' - ')[1] || 'Osztály';
            
            let hourMatch = timeText.match(/0:0?(\d+)/);
            let hourNumber = hourMatch ? parseInt(hourMatch[1]) : index + 1;
            
            return {
              id: index,
              subject: subject.trim(),
              details: details.trim(),
              room: room.trim(),
              isActive: false,
              hourNumber: hourNumber
            };
          });
        }, dayIndexToUse);

        // Csengetési rend (Hivatalos BMSZC Neumann csengetési rend alapján!)
      const times = {
        0: '06:40 - 07:25',
        1: '07:30 - 08:15',
        2: '08:25 - 09:10',
        3: '09:20 - 10:05',
        4: '10:20 - 11:05',
        5: '11:15 - 12:00',
        6: '12:20 - 13:05',
        7: '13:25 - 14:10',
        8: '14:20 - 15:05',
        9: '15:10 - 15:55',
        10: '16:00 - 16:40',
        11: '16:50 - 17:30',
        12: '17:40 - 18:20'
      };

      // Kiválogatjuk az egyedi órákat
      const napiOrarend = [];
      const lathatoOrak = new Set();
      
      orarend.sort((a, b) => a.hourNumber - b.hourNumber);
      
      for(const ora of orarend) {
        if(!lathatoOrak.has(ora.hourNumber) && ora.hourNumber > 0) {
          lathatoOrak.add(ora.hourNumber);
          // Időpontok hozzárendelése
          const timeSpan = times[ora.hourNumber] || `${ora.hourNumber}. óra`;
          ora.time = timeSpan.split(' - ')[0] || '';
          ora.duration = timeSpan;
          napiOrarend.push(ora);
        }
      }

      // Lyukasórák detektálása (a legelső és legutolsó óra között)
      const finalSchedule = [];
      if (napiOrarend.length > 0) {
        const minHour = napiOrarend[0].hourNumber;
        const maxHour = napiOrarend[napiOrarend.length - 1].hourNumber;
        
        let map = {};
        for(const o of napiOrarend) map[o.hourNumber] = o;

        for (let i = minHour; i <= maxHour; i++) {
          if (map[i]) {
            finalSchedule.push(map[i]);
          } else {
            const timeSpan = times[i] || `${i}. óra`;
            finalSchedule.push({
              id: 'lyukas_' + i,
              time: timeSpan.split(' - ')[0] || '',
              duration: timeSpan,
              subject: 'Lyukasóra',
              details: 'Tanári / Felkészülés',
              room: '-',
              isActive: false,
              hourNumber: i
            });
          }
        }
      }

      // Elmentjük a cache-be (aktivitási állapotok nélkül)
      if (!cache[cacheKey]) cache[cacheKey] = {};
      cache[cacheKey][dayIndexToUse] = JSON.parse(JSON.stringify(finalSchedule));
      this.saveCache({ [cacheKey]: cache[cacheKey] });

      // Jelenlegi óra kiemelésének logikája valós idő alapján
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      for (const ora of finalSchedule) {
        if (ora.duration && ora.duration.includes('-')) {
          const [startStr, endStr] = ora.duration.split(' - ');
          const startMin = parseInt(startStr.split(':')[0]) * 60 + parseInt(startStr.split(':')[1]);
          const endMin = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);
          
          if (currentMinutes >= startMin && currentMinutes <= endMin) {
            ora.isActive = true;
          }
        }
      }

      return { data: { day: activeDay, list: finalSchedule }, fromCache: false };
    } catch (error) {
      console.error('Órarend lekérdezési hiba:', error);
      throw error;
    }
    }); // withLock vége
  }

  async getClassExams(osztalyUrlStr) {
    const cacheKey = 'classExams_cache';
    const cache = this.loadCache();

    if (!this.page) {
        if (cache[cacheKey]) {
            return { success: true, data: cache[cacheKey], fromCache: true };
        }
        return { success: true, data: [], raw: [], error: 'Nincs böngésző munkamenet' };
    }
    
    return this._withLock(async () => {
      try {
      console.log('API URL használata a dolgozatokhoz:', osztalyUrlStr);
      
      const originalUrl = osztalyUrlStr;
      
      // 30 nap lekérése
      const today = new Date();
      const future = new Date();
      future.setDate(today.getDate() + 30);
      
      const startStr = today.toISOString().split('T')[0];
      const endStr = future.toISOString().split('T')[0];
      
      let modifiedUrl = originalUrl.replace(/start=[^&]+/, `start=${startStr}`);
      modifiedUrl = modifiedUrl.replace(/end=[^&]+/, `end=${endStr}`);
      
      console.log('Belső API meghívása 30 napos időtávra:', modifiedUrl);
      
      // Végrehajtjuk a Fetch-et a böngésző kontextusában (hogy a sütik működjenek)
      const calendarData = await this.page.evaluate(async (fetchUrl) => {
         const res = await fetch(fetchUrl);
         return res.json();
      }, modifiedUrl);
      
      // A calendarData egy JSON array lesz az eseményekkel
      // Formázzuk és szűrjük őket
      const exams = [];
      if (Array.isArray(calendarData)) {
          calendarData.forEach(event => {
             // A Kréta esemény objektum mezői változhatnak, kinyerjük amit tudunk
             const title = event.title || event.Title || '';
             const isExam = event.hasBejelentettSzamonkeres || (event.BejelentettSzamonkeresContent && event.BejelentettSzamonkeresContent.toLowerCase().includes('dolgozat'));
             
             if (isExam) {
                 exams.push({
                     id: event.id || Math.random().toString(36).substr(2, 9),
                     subject: event.Tantargy || event.TantargyKategoria || title.split('-')[0].trim(),
                     date: event.start ? event.start.split('T')[0] : 'Ismeretlen dátum',
                     type: 'Számonkérés',
                     className: 'Osztály',
                     topic: event.BejelentettSzamonkeresContent || event.Tema || '',
                     status: 'written'
                 });
             }
          });
      }
      
      this.saveCache({ [cacheKey]: exams });
      return { success: true, data: exams, raw: calendarData };
      
    } catch (e) {
      console.error('Hiba az osztály dolgozatok lekérésekor:', e);
      const cache = this.loadCache();
      if (cache['classExams_cache']) {
          console.log('Cache-ből adjuk vissza a dolgozatokat a hiba miatt.');
          return { success: true, data: cache['classExams_cache'], fromCache: true };
      }
      return { success: false, data: [], error: e.message };
    }
    });
  }

  async getMenuItems() {
    if (!this.page) throw new Error('Nincs bejelentkezve.');
    
    // Először megnézzük a főoldalt vagy bármelyik oldalt ahol vagyunk, és kigyűjtjük az összes menüpontot
    // hogy megtaláljuk, hol van a "Tantárgyfelosztás" vagy "Osztályok".
    const links = await this.page.$$eval('a', as => {
      return as.map(a => {
        return { text: a.innerText.trim(), href: a.href };
      }).filter(a => a.text.length > 0);
    });
    return links;
  }

  async getGroups(refresh = false) {
    const cache = this.loadCache();
    if (!refresh && cache.groups && cache.groups.length > 0) {
      console.log('[Backend] Csoportok betöltése cacheből...');
      return cache.groups;
    }

    if (!this.page) return [];
    
    return this._withLock(async () => {
      try {
        await this.page.goto('https://bmszc-neumann.e-kreta.hu/Tanulo/TanarTanitottTanulok', { waitUntil: 'domcontentloaded', timeout: 20000 });
      } catch (e) {
        console.log('Navigációs timeout a getGroups-nál:', e.message);
      }
    
    // Kezeljük a felugró "Keresés" modális ablakot, ha megjelenik
    try {
      // Várunk egy picit, hátha beúszik az ablak
      await this.page.waitForTimeout(1000);
      
      // Kifejezetten a Kréta "Tovább" gombjának azonosítója (id="StartTanitottTanulok"), de keresünk szöveg alapján is
      const startButton = await this.page.waitForSelector('#StartTanitottTanulok, button:has-text("TOVÁBB"), button:has-text("Tovább")', { state: 'visible', timeout: 5000 });
      if (startButton) {
        console.log('Kereső ablak (Tovább gomb) észlelve, kattintás...');
        await startButton.click();
        await this.page.waitForTimeout(1500); // Várjuk meg, amíg eltűnik
      }
    } catch(e) {
      console.log('Kereső ablak nem ugrott fel (vagy már bezárult).', e.message);
    }
    
    // Várjuk meg amíg a Kendo Grid betöltődik
    try {
      await this.page.waitForSelector('.k-grid-content table tbody tr', { timeout: 10000 });
      
      // Próbáljuk meg UI alapon átállítani a lapozót (200-ra vagy 500-ra)
      try {
        const dropdownWrap = await this.page.$('.k-pager-sizes .k-dropdown-wrap');
        if (dropdownWrap) {
           await dropdownWrap.click();
           await this.page.waitForTimeout(500);
           
           await this.page.evaluate(() => {
              const items = Array.from(document.querySelectorAll('.k-animation-container .k-list .k-item'));
              const bestItem = items.find(i => i.innerText.includes('500')) || items.find(i => i.innerText.includes('200')) || items[items.length - 1];
              if (bestItem) bestItem.click();
           });
           await this.page.waitForTimeout(2000);
        }
      } catch(e) {
        console.log('Lapozó UI kattintás nem sikerült:', e.message);
      }
      
      // Biztosításképp a Kendo API-val is beállítjuk 200-ra (1000-et valószínűleg elutasítja a szerver)
      await this.page.evaluate(() => {
        try {
           const gridElement = document.querySelector('[data-role="grid"]');
           if (gridElement && window.jQuery) {
              const grid = window.jQuery(gridElement).data('kendoGrid');
              if (grid && grid.dataSource && grid.dataSource.pageSize() < 200) {
                 grid.dataSource.pageSize(200);
              }
           }
        } catch(err) { console.error(err); }
      });
      
      // Extra várakozás az adatok biztos megérkezéséhez
      await this.page.waitForTimeout(3000); 
    } catch (e) {
      console.log('Nem töltött be a Tanított Tanulók táblázat:', e.message);
      return [];
    }
    
    // Kinyerjük a sorokat és csoportosítjuk őket osztály/tárgy alapján
    const groupedData = await this.page.$$eval('.k-grid-content table tbody tr', rows => {
       const groups = {};
       
       rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 5) {
             const studentName = cells[1].innerText.trim();
             const className = cells[2].innerText.trim();
             const subject = cells[3].innerText.trim();
             const type = cells[4].innerText.trim();
             
             // Kulcs a csoportosításhoz (pl. "10.c MAT1 - Matematika")
             const groupKey = `${className} - ${subject}`;
             
             if (!groups[groupKey]) {
                groups[groupKey] = {
                   id: groupKey,
                   className: className,
                   subject: subject,
                   type: type,
                   students: []
                };
             }
             
             groups[groupKey].students.push(studentName);
          }
       });
       
       // Objektumból tömböt csinálunk
       return Object.values(groups);
    });
    
    this.saveCache({ groups: groupedData });
    return groupedData;
    }); // withLock vége
  }

  async getExams() {
    if (!this.page) {
      console.log('[Fejlesztői mód] Nincs valós böngésző munkamenet, mock adatok visszadása (Dolgozatok)...');
      return []; // Vagy lehetne mock dolgozat is, de most adjunk vissza üres listát.
    }
    
    return this._withLock(async () => {
      try {
          await this.page.goto('https://bmszc-neumann.e-kreta.hu/Tanar/TanarBejelentettSzamonkeresek', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
        console.log('Navigációs hiba a dolgozatok lekérésekor:', e.message);
        return [];
    }
    
    // Kezeljük a felugró ablakokat, ha vannak (általában érdemes egy keresést nyomni, vagy alapból is betölt)
    try {
      await this.page.waitForTimeout(1000);
      const searchButton = await this.page.waitForSelector('.kereses-gomb', { state: 'visible', timeout: 2000 });
      if (searchButton) {
        console.log('Kereső ablak észlelve a számonkéréseknél, kattintás...');
        await searchButton.click();
        await this.page.waitForTimeout(1000);
      }
    } catch(e) {
      console.log('Nincs külön kereső gomb a számonkéréseknél, vagy egyből listáz.');
    }
    
    // Várjuk meg amíg a Kendo Grid betöltődik
    try {
      await this.page.waitForSelector('.k-grid-content table tbody tr', { timeout: 10000 });
      // Extra várakozás az adatok biztos megérkezéséhez
      await this.page.waitForTimeout(2000); 
    } catch (e) {
      console.log('Nem töltött be a Számonkérések táblázat:', e.message);
      return [];
    }
    
    // Kinyerjük a sorokat
    const exams = await this.page.$$eval('.k-grid-content table tbody tr', rows => {
       const results = [];
       rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td');
          // Ha ez az "üres" sor (Nincs megjeleníthető adat), akkor ugorjuk át
          if (cells.length === 1 && cells[0].innerText.includes('Nincs megjeleníthető')) return;
          
          if (cells.length >= 8) {
             results.push({
                id: `exam_${index}_${Date.now()}`,
                date: cells[1].innerText.trim(),         // Dátum
                dayOfWeek: cells[2].innerText.trim(),    // Hét napja
                lessonNumber: cells[3].innerText.trim(), // Óraszám
                subject: cells[4].innerText.trim(),      // Tantárgy
                className: cells[5].innerText.trim(),    // Osztály/csoport
                type: cells[6].innerText.trim(),         // Számonkérés módja
                topic: cells[7].innerText.trim(),        // Számonkérés témája
                announcedAt: cells[8] ? cells[8].innerText.trim() : '' // Bejelentés dátuma
             });
          }
       });
       return results;
    });
    
    return exams;
    }); // _withLock vége
  }

  async getMyClassStudents(refresh = false) {
    const cache = this.loadCache();
    if (!refresh && cache.students && cache.students.length > 0) {
      console.log('[Backend] Osztály tanulóinak betöltése cacheből...');
      return { data: cache.students, fromCache: true };
    }

    if (!this.page) {
      if (cache.students && cache.students.length > 0) {
          console.log('[Fejlesztői mód] Nincs böngésző munkamenet, de van cache. A cache visszaadása mock helyett.');
          return { data: cache.students, fromCache: true };
      }
      console.log('[Fejlesztői mód] Nincs valós böngésző munkamenet, mock adatok visszadása (Osztály tanulói)...');
      const mockData = [
        { id: 'mock_1', name: 'Kovács Anna', rawData: ['1', 'Kovács Anna', '12345678901', '2008. 10. 07.'] },
        { id: 'mock_2', name: 'Nagy Gábor', rawData: ['2', 'Nagy Gábor', '12345678902', '2008. 10. 08.'] },
        { id: 'mock_3', name: 'Szabó Zsófia', rawData: ['3', 'Szabó Zsófia', '12345678903', '2008. 10. 10.'] },
        { id: 'mock_4', name: 'Tóth Bence', rawData: ['4', 'Tóth Bence', '12345678904', '2008. 03. 15.'] },
        { id: 'mock_5', name: 'Kiss Péter', rawData: ['5', 'Kiss Péter', '12345678905', '2008. 12. 01.'] },
        { id: 'mock_6', name: 'Varga Réka', rawData: ['6', 'Varga Réka', '12345678906', '2008. 10. 11.'] }
      ];
      return { data: mockData, fromCache: false };
    }
    
    try {
      if (!this.page.url().includes('OsztalyTanuloi')) {
        await this._withLock(async () => {
          await this.page.goto('https://bmszc-neumann.e-kreta.hu/Tanulo/OsztalyTanuloi', { waitUntil: 'domcontentloaded', timeout: 20000 });
        });
      }
    } catch (e) {
      console.log('Navigációs hiba az Osztály Tanulói oldalnál:', e.message);
    }
    
    // Kezeljük a keresés gombot, ha van
    try {
      await this.page.waitForTimeout(1000);
      const searchButton = await this.page.waitForSelector('.kereses-gomb, #btnKereses', { state: 'visible', timeout: 2000 });
      if (searchButton) {
        console.log('Keresés gomb megnyomása (Osztály Tanulói)...');
        await searchButton.click();
        await this.page.waitForTimeout(1500);
      }
    } catch(e) {}
    
    // Várjuk meg amíg a grid betöltődik
    try {
      await this.page.waitForTimeout(3000); 
      // Kinyomtatjuk a DOM-t
      const pageInfo = await this.page.evaluate(() => {
         const tables = Array.from(document.querySelectorAll('table')).map(t => ({
             className: t.className,
             id: t.id,
             rows: Array.from(t.querySelectorAll('tr')).slice(0, 3).map(r => r.innerText.replace(/\s+/g, ' '))
         }));
         return tables;
      });
      console.log('Megtalált táblázatok az oldalon:', JSON.stringify(pageInfo, null, 2));

      await this.page.waitForSelector('.k-grid-content table tbody tr, table tbody tr', { timeout: 10000 });
    } catch (e) {
      console.log('Nem töltött be az Osztály Tanulói táblázat:', e.message);
      return { data: [], fromCache: false };
    }
    
    // Adatok kinyerése
    let students = await this.page.$$eval('table tbody tr', rows => {
       const results = [];
       rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td');
          if (cells.length === 1 && cells[0].innerText.includes('Nincs megjeleníthető')) return;
          
          if (cells.length >= 2) {
             results.push({
                name: cells[1] ? cells[1].innerText.trim() : (cells[0] ? cells[0].innerText.trim() : 'Ismeretlen'),
                rawData: Array.from(cells).map(c => c.innerText.trim())
             });
          }
       });
       return results;
    });
    
    // Szűrés duplikációk ellen (Kendo grid fagyasztott oszlopok miatt kétszer szerepelhetnek a sorok)
    const uniqueStudentsMap = new Map();
    students.forEach(s => {
       if (s.name && s.name !== 'Ismeretlen') {
          if (!uniqueStudentsMap.has(s.name) || s.rawData.length > uniqueStudentsMap.get(s.name).rawData.length) {
             uniqueStudentsMap.set(s.name, s);
          }
       }
    });
    students = Array.from(uniqueStudentsMap.values());

    // Próbáljuk meg kitalálni az osztályfőnöki osztályt (amelyik osztályba a legtöbben járnak ezen a listán)
    // Az osztály neve a 7. oszlopban van általában (index 7).
    const classCounts = {};
    students.forEach(s => {
       const className = s.rawData.length >= 8 ? s.rawData[7] : null;
       if (className && className.trim() !== '') {
          classCounts[className] = (classCounts[className] || 0) + 1;
       }
    });
    
    let mainClass = null;
    let maxCount = 0;
    for (const [cName, count] of Object.entries(classCounts)) {
       if (count > maxCount) {
          maxCount = count;
          mainClass = cName;
       }
    }
    
    // Ha találtunk domináns osztályt, és a felhasználó az osztályfőnöki oldalon van, csak azt hagyjuk meg
    if (mainClass && students.length > maxCount) {
       console.log(`[Osztály szűrés] Fő osztályként azonosítva: ${mainClass}. A többi osztály tanulója elrejtve.`);
       students = students.filter(s => s.rawData.length >= 8 && s.rawData[7] === mainClass);
    }

    // Újra sorszámozzuk az azonosítókat
    students = students.map((s, index) => ({
       id: `student_${index}`,
       name: s.name,
       rawData: s.rawData
    }));
    
    console.log(`Kinyert tanulók száma: ${students.length}`);
    this.saveCache({ students });
    return { data: students, fromCache: false };
  }

  async getStudentsForClass(dayIndex, classIndex) {
    if (!this.page) throw new Error('Nincs bejelentkezve.');
    
    // Biztosítjuk, hogy az órarenden vagyunk
    if (!this.page.url().includes('TanariOrarend')) {
       await this.page.goto('https://bmszc-neumann.e-kreta.hu/Orarend/TanariOrarend', { waitUntil: 'domcontentloaded' });
       await this.page.waitForSelector('.fc-time-grid', { timeout: 10000 });
       
       const todayDay = new Date().getDay();
       if (todayDay === 0 || todayDay === 6) {
          try {
             await this.page.click('.fc-next-button');
             await this.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
             await this.page.waitForTimeout(1000); 
          } catch (e) {}
       }
       await this.page.waitForTimeout(1000);
    }
    
    // Megkeressük a megfelelő oszlopot és órát
    const cellIndexToUse = dayIndex === 0 ? 7 : dayIndex;
    const tr = await this.page.$('.fc-time-grid .fc-content-skeleton > table > tbody > tr');
    if (!tr) throw new Error('Nem található a naptár rács.');
    
    const tds = await tr.$$('td');
    const targetCell = tds[cellIndexToUse] || tds[tds.length - 1];
    if (!targetCell) throw new Error('Nem található a nap oszlopa.');
    
    const events = await targetCell.$$('.fc-event');
    if (!events || events.length <= classIndex) throw new Error('Nem található az adott óra.');
    
    // Rákattintunk az órára
    console.log(`Kattintás az órára: nap ${dayIndex}, index ${classIndex}...`);
    await events[classIndex].click();
    
    // Várjuk meg a Naplózás modális ablakot
    console.log('Várakozás a naplózás ablakra...');
    await this.page.waitForSelector('text="Tanuló neve"', { timeout: 10000 });
    await this.page.waitForTimeout(1000); // Kicsit várunk a táblázat betöltésére
    
    // Kinyerjük a diákok neveit (a táblázatból)
    const students = await this.page.$$eval('table', tables => {
      let result = [];
      for (const table of tables) {
        // Megkeressük a pontos táblázatot a fejléc alapján
        if (table.innerText.includes('Tanuló neve') && (table.innerText.includes('Mulasztás') || table.innerText.includes('Jelenlét'))) {
          const rows = table.querySelectorAll('tbody tr');
          for (const row of rows) {
            const tds = row.querySelectorAll('td');
            if (tds.length > 2) {
               const nameText = tds[1].innerText.trim();
               if (nameText && nameText.length > 3) {
                 // Kiszűrjük a születési dátumot ha van: "Bognár Csaba (2009.09.24.)" -> "Bognár Csaba"
                 const nameOnly = nameText.split('(')[0].trim();
                 if (nameOnly) result.push(nameOnly);
               }
            }
          }
        }
      }
      return Array.from(new Set(result)); // Eltávolítjuk az esetleges duplikációkat
    });
    
    // Bezárjuk az ablakot a MÉGSE gombbal vagy Escape-pel
    console.log('Ablak bezárása...');
    try {
      const cancelBtn = await this.page.$('button:has-text("MÉGSE"), button:has-text("Mégse")');
      if (cancelBtn) {
         await cancelBtn.click();
      } else {
         await this.page.keyboard.press('Escape');
      }
      await this.page.waitForTimeout(500);
    } catch(e) {
      await this.page.keyboard.press('Escape');
    }
    
    return students;
  }
}

module.exports = new KretaService();
