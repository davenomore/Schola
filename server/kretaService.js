process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CACHE_FILE = path.join(__dirname, 'kreta_cache.json');
const SESSION_FILE = path.join(__dirname, 'kreta_session.json');

class KretaService {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.schoolId = 'bmszc-neumann';
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

  async saveSession() {
    try {
      if (this.context) {
        await this.context.storageState({ path: SESSION_FILE });
        console.log('[Kréta] Munkamenet (sütik) sikeresen elmentve a lemezre.');
      }
    } catch (e) {
      console.warn('[Kréta] Nem sikerült elmenteni a munkamenetet:', e.message);
    }
  }

  clearSession() {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
        console.log('[Kréta] Elmentett munkamenet törölve.');
      }
    } catch (e) {
      console.warn('[Kréta] Hiba a munkamenet törlésekor:', e.message);
    }
  }

  async ensureAuthenticated() {
    if (this.page && this.browser && this.browser.isConnected()) {
      return true;
    }
    return await this.isSessionValid();
  }

  _extractStudentsFromCache(cache) {
    if (!cache) return [];
    if (cache.students && cache.students.length > 0) return cache.students;
    if (cache.groups && cache.groups.length > 0) {
      const ofoGroup = cache.groups.find(g => 
        (g.className && (g.className.toLowerCase().includes('11.a') || g.className.toLowerCase().includes('11a'))) ||
        (g.id && (g.id.toLowerCase().includes('11.a') || g.id.toLowerCase().includes('11a')))
      ) || cache.groups.reduce((max, g) => (!max || (g.students && g.students.length > (max.students ? max.students.length : 0))) ? g : max, null);

      if (ofoGroup && ofoGroup.students && ofoGroup.students.length > 0) {
        const uniqueNames = Array.from(new Set(ofoGroup.students));
        return uniqueNames.map((name, index) => ({
          id: `student_${index}`,
          name: name,
          rawData: [`${index + 1}`, name, '', '', '', '', '', ofoGroup.className || '11.a', '']
        }));
      }
    }
    return [];
  }

  async isSessionValid() {
    if (!fs.existsSync(SESSION_FILE)) return false;
    try {
      await this.initBrowser();
      console.log('[Kréta] Elmentett munkamenet gyors érvényesítése...');
      const targetUrl = `https://${this.schoolId || 'bmszc-neumann'}.e-kreta.hu/Orarend/TanariOrarend`;
      await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const currentUrl = this.page.url().toLowerCase();
      if (!currentUrl.includes('account/login') && !currentUrl.includes('idp.e-kreta.hu')) {
        console.log('[Kréta] A korábbi munkamenet aktív és érvényes! Nem szükséges újra bejelentkezni.');
        return true;
      }
      console.log('[Kréta] A munkamenet lejárt, új bejelentkezés szükséges.');
    } catch (e) {
      console.log('[Kréta] Munkamenet ellenőrzés figyelmeztetés:', e.message);
    }
    return false;
  }

  async initBrowser() {
    if (this.browser && !this.browser.isConnected()) {
      console.log('Korábbi böngésző munkamenet lezárult, új indítása...');
      this.browser = null;
      this.context = null;
      this.page = null;
    }

    if (!this.browser) {
      const launchOptions = {
        headless: process.env.HEADLESS !== undefined ? process.env.HEADLESS === 'true' : true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--headless=new',
          '--disable-blink-features=AutomationControlled'
        ]
      };

      if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        launchOptions.executablePath = process.env.CHROME_PATH;
      } else if (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')) {
        launchOptions.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      }

      this.browser = await chromium.launch(launchOptions); 

      const contextOptions = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        locale: 'hu-HU',
        timezoneId: 'Europe/Budapest',
      };

      // Meglévő munkamenet (sütik) automatikus betöltése
      if (fs.existsSync(SESSION_FILE)) {
        try {
          contextOptions.storageState = SESSION_FILE;
          console.log('[Kréta] Meglévő munkamenet (sütik) betöltése a lemezről...');
        } catch (err) {
          console.warn('[Kréta] Nem sikerült betölteni a munkamenetet:', err.message);
        }
      }

      this.context = await this.browser.newContext(contextOptions);

      // Erőforrás-blokkoló: képek, fontok és analitikai kódok blokkolása a maximális sebességért
      await this.context.route('**/*', (route) => {
        const req = route.request();
        const type = req.resourceType();
        const url = req.url().toLowerCase();

        // Képek, betűtípusok és média blokkolása
        if (type === 'image' || type === 'font' || type === 'media') {
          return route.abort();
        }

        // Felesleges telemetria / analitika blokkolása (másodpercekkel gyorsítja a betöltést)
        if (
          url.includes('google-analytics.com') ||
          url.includes('googletagmanager.com') ||
          url.includes('apm.e-kreta.hu') ||
          url.includes('doubleclick.net') ||
          url.includes('firestore.googleapis.com')
        ) {
          return route.abort();
        }

        return route.continue();
      });

      await this.context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      this.page = await this.context.newPage();
    }
  }

  // Sütik automatikus kezelése és elfogadása
  async handleCookieConsent(page = this.page) {
    if (!page) return;
    try {
      // Pontos szelektor a Kréta süti elfogadó gombjára
      const cookieSelector = 'button[formaction*="acceptnecessarycookies"], button.btn-kreta:has-text("Az összes kötelező cookie elfogadása"), button:has-text("összes kötelező cookie elfogadása")';
      const cookieBtn = page.locator(cookieSelector).first();
      
      const isVisible = await cookieBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false);
      if (isVisible) {
        console.log('[Kréta] Süti tájékoztató modal érzékelve, elfogadás...');
        await Promise.all([
          page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {}),
          cookieBtn.click().catch(() => cookieBtn.evaluate(b => b.click()).catch(() => {}))
        ]);
        await page.waitForTimeout(500);
        console.log('[Kréta] Süti elfogadva.');
      }

      // Külső Tudásbázis lapok bezárása, ha megnyíltak volna
      if (this.browser) {
        for (const ctx of this.browser.contexts()) {
          for (const p of ctx.pages()) {
            if (p.url().includes('tudasbazis.ekreta.hu') || p.url().includes('CookiePolicy')) {
              console.log('[Kréta] Felesleges Tudásbázis fül bezárása...');
              await p.close().catch(() => {});
            }
          }
        }
      }
    } catch (err) {
      console.log('[Kréta] Süti elfogadás átlépve:', err.message);
    }
  }

  async login(username, password, schoolId = 'bmszc-neumann') {
    try {
      this.schoolId = schoolId || 'bmszc-neumann';

      // Ha már van érvényes lementett munkamenetünk, nem kell újra kitölteni az űrlapot!
      if (await this.isSessionValid()) {
        console.log('[Kréta] Létező érvényes munkamenet újrahasznosítva. Nincs szükség újracsatlakozásra.');
        return { success: true, fromSession: true };
      }

      await this.initBrowser();
      console.log(`[Kréta] Bejelentkezés indítása az intézményhez: ${this.schoolId}...`);

      // Az intézmény hivatalos belépési felületére navigálunk, ami elvégzi a megfelelő OIDC hitelesítési átirányítást és token-aláírást
      const targetUrl = `https://${this.schoolId}.e-kreta.hu/Adminisztracio/Login`;
      console.log(`[Kréta] Navigálás a bejelentkezési felületre (${targetUrl})...`);
      await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.page.waitForURL(url => url.href.includes('idp.e-kreta.hu') || url.href.includes('Login') || url.href.includes('account'), { timeout: 15000 }).catch(() => {});

      // Sütik azonnali kezelése
      await this.handleCookieConsent();

      console.log('[Kréta] Bejelentkezési mezők keresése és kitöltése...');
      const userField = this.page.locator('input[name="UserName"], #UserName').first();
      const passField = this.page.locator('input[name="Password"], #Password').first();

      const isInputReady = await userField.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
      if (!isInputReady) {
        // Ha nem jelent meg a mező, olvassuk ki a lehetséges hibaüzenetet az oldalról
        const pageText = await this.page.evaluate(() => document.body.innerText).catch(() => '');
        if (pageText.includes('licence') || pageText.includes('lejárt') || pageText.includes('karbantartás') || pageText.includes('nem elérhető')) {
          const cleanNotice = pageText.split('\n').map(t => t.trim()).filter(Boolean).slice(0, 3).join(' ');
          throw new Error(`A Kréta rendszer hibaüzenete: ${cleanNotice}`);
        }
        throw new Error('A Kréta bejelentkezési mező nem jelent meg 15 másodpercen belül.');
      }

      await userField.fill(username);
      await passField.fill(password);

      console.log('[Kréta] Belépés elküldése...');
      const submitBtn = this.page.locator('#submit-btn, button[type="submit"]:has-text("BEJELENTKEZÉS"), button:has-text("Bejelentkezés")').first();

      if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await Promise.all([
          this.page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
          submitBtn.click()
        ]);
      } else {
        await Promise.all([
          this.page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
          this.page.press('input[name="Password"], #Password', 'Enter')
        ]);
      }

      await this.page.waitForTimeout(1500);

      const currentUrl = this.page.url();
      console.log('[Kréta] Jelenlegi URL a beküldés után:', currentUrl);

      // Ellenőrizzük, hogy az oldalon maradtunk-e bejelentkezési hiba miatt
      if (currentUrl.toLowerCase().includes('account/login')) {
        const errorText = await this.page.locator('.validation-summary-errors, .field-validation-error, .alert-danger, .text-danger, #validation-summary')
          .allInnerTexts()
          .then(texts => texts.map(t => t.trim()).filter(Boolean).join('; '))
          .catch(() => '');

        if (errorText) {
          console.warn('[Kréta] Sikertelen bejelentkezés, hiba a felületen:', errorText);
          this.clearSession();
          return {
            success: false,
            message: errorText,
            error: errorText
          };
        }
      }

      // Ellenőrizzük, hogy a Kréta modulválasztó oldalán vagyunk-e
      try {
        const naploGomb = this.page.getByText('Elektronikus napló', { exact: false }).first();
        if (await naploGomb.isVisible({ timeout: 4000 }).catch(() => false)) {
          console.log('[Kréta] Modulválasztó érzékelve! Kattintás az Elektronikus naplóra...');
          await naploGomb.click();
          await this.page.waitForTimeout(2000);

          const context = this.browser.contexts()[0];
          const validPages = context.pages().filter(p => !p.url().includes('tudasbazis.ekreta.hu') && !p.url().includes('CookiePolicy'));
          if (validPages.length > 0) {
            this.page = validPages[validPages.length - 1];
          }
          await this.handleCookieConsent();
        }
      } catch (err) {
        console.log('[Kréta] Modulválasztó nem volt jelen, továbblépés.');
      }

      console.log('[Kréta] Sikeres bejelentkezés! Munkamenet elmentése a lemezre...');
      await this.saveSession();
      return { success: true };
    } catch (error) {
      console.error('[Kréta] Belépési hiba:', error);
      if (!this.browser || !this.browser.isConnected()) {
        return { 
          success: false, 
          message: 'Nem sikerült elindítani a háttérböngészőt: ' + error.message,
          error: error.message 
        };
      }
      return { 
        success: false, 
        message: 'A bejelentkezés sikertelen: ' + (error.message || 'Időtúllépés'),
        error: error.message 
      };
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
    if ((!refresh || !this.page) && cache[cacheKey] && cache[cacheKey][dayIndexToUse] && cache[cacheKey][dayIndexToUse].length > 0) {
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
      if (process.env.RENDER) {
        // Éles környezetben a szerver újraindulása után nincs munkamenet: új bejelentkezés kell.
        throw new Error('Nincs aktív Kréta munkamenet, jelentkezz be újra!');
      }
      console.log('[Fejlesztői mód] Nincs valós böngésző munkamenet...');
      return { data: { day: activeDay, list: cache[cacheKey]?.[dayIndexToUse] || [] }, fromCache: true };
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
        
        const targetUrl = `https://${this.schoolId || 'bmszc-neumann'}.e-kreta.hu/Orarend/TanariOrarend`;
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

  async getAllTimetable(refresh = false, isClass = false) {
    const cacheKey = isClass ? 'classTimetable' : 'timetable';
    const cache = this.loadCache();
    const napok = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    
    // Ha nem kér refresh-t VAGY nincs valós böngésző kapcsolat, és van a cache-ben adat
    if ((!refresh || !this.page) && cache[cacheKey]) {
      const result = {};
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const todayDay = now.getDay();

      for (let d = 1; d <= 5; d++) {
        const rawList = cache[cacheKey][d] || [];
        const dayList = JSON.parse(JSON.stringify(rawList));

        // Ha az aktuális hétköznap van, megjelöljük az aktív órát
        if (todayDay === d) {
          for (const ora of dayList) {
            if (ora.duration && ora.duration.includes('-')) {
              const [startStr, endStr] = ora.duration.split(' - ');
              const startMin = parseInt(startStr.split(':')[0]) * 60 + parseInt(startStr.split(':')[1]);
              const endMin = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);
              if (currentMinutes >= startMin && currentMinutes <= endMin) {
                ora.isActive = true;
              }
            }
          }
        }
        result[d] = {
          day: napok[d],
          list: dayList
        };
      }
      return { data: result, fromCache: true };
    }

    // Refresh vagy hiányzó cache esetén naponként lekérjük
    const result = {};
    for (let d = 1; d <= 5; d++) {
      const dayRes = await this.getTimetable(d, refresh, isClass);
      result[d] = dayRes.data;
    }
    return { data: result, fromCache: false };
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
      const subjectsMap = {};

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

             // Tantárgy és tanár kinyerése a valós órarendből
             let rawSubj = event.Tantargy || (title.includes(' - ') ? title.split(' - ')[0] : title).trim();
             if (rawSubj && !rawSubj.toLowerCase().includes('felzárkóztatás') && !rawSubj.toLowerCase().includes('tehetséggondozás') && !rawSubj.toLowerCase().includes('sportkör')) {
               let cleanSubj = rawSubj.replace(/\s*-\s*11\.?[a-zA-Z]?/g, '').trim();
               if (!subjectsMap[cleanSubj]) {
                 subjectsMap[cleanSubj] = {
                   subject: cleanSubj,
                   teachers: new Set(),
                   count: 0
                 };
               }
               subjectsMap[cleanSubj].count++;
               const teacher = event.Tanar || event.TanarNeve || event.tanar;
               if (teacher) subjectsMap[cleanSubj].teachers.add(teacher);
             }
          });
      }

      const extractedSubjects = Object.values(subjectsMap).map(s => ({
        subject: s.subject,
        teachers: Array.from(s.teachers).join(', '),
        lessonsCount: s.count
      }));
      
      this.saveCache({ [cacheKey]: exams, classScheduleSubjects: extractedSubjects });
      return { success: true, data: exams, subjects: extractedSubjects, raw: calendarData };
      
    } catch (e) {
      console.error('Hiba az osztály dolgozatok lekérésekor:', e);
      const cache = this.loadCache();
      if (cache['classExams_cache']) {
          console.log('Cache-ből adjuk vissza a dolgozatokat a hiba miatt.');
          return { success: true, data: cache['classExams_cache'], subjects: cache['classScheduleSubjects'] || [], fromCache: true };
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

    return this._withLock(async () => {
      if (!this.page || !this.browser || !this.browser.isConnected()) {
        await this.ensureAuthenticated();
      }

      if (!this.page) {
        if (cache.groups && cache.groups.length > 0) {
          console.log('[Backend] Nincs böngésző munkamenet, cache-elt csoportok visszaadása.');
          return cache.groups;
        }
        return [];
      }

      try {
        await this.page.goto(`https://${this.schoolId || 'bmszc-neumann'}.e-kreta.hu/Tanulo/TanarTanitottTanulok`, { waitUntil: 'domcontentloaded', timeout: 20000 });
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
      if (cache.groups && cache.groups.length > 0) {
        return cache.groups;
      }
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
    
    if (groupedData && groupedData.length > 0) {
      this.saveCache({ groups: groupedData });
      return groupedData;
    }
    if (cache.groups && cache.groups.length > 0) {
      return cache.groups;
    }
    return [];
    }); // withLock vége
  }

  async getExams(refresh = false) {
    const cacheKey = 'exams';
    const cache = this.loadCache();
    
    // Ha nem kényszerített frissítés és van érvényes cache, azonnal adjuk vissza
    if (!refresh && cache[cacheKey] && Array.isArray(cache[cacheKey]) && cache[cacheKey].length > 0) {
      console.log(`[Backend] Saját dolgozatok betöltése cache-ből (${cache[cacheKey].length} db)...`);
      return cache[cacheKey];
    }

    return this._withLock(async () => {
      // Ha még nincs page vagy megszakadt a kapcsolat, kíséreljük meg a munkamenet visszaállítását
      if (!this.page || !this.browser || !this.browser.isConnected()) {
        await this.ensureAuthenticated();
      }

      if (!this.page) {
        if (cache[cacheKey] && Array.isArray(cache[cacheKey])) {
          console.log('[Backend] Nincs böngésző munkamenet, cache-elt dolgozatok visszaadása.');
          return cache[cacheKey];
        }
        console.log('[Backend] Nincs valós böngésző munkamenet és nincs cache, üres lista visszaadása.');
        return [];
      }
      
      try {
        console.log('[Kréta] Dolgozatok (Számonkérések) lekérése a Kréta felületéről...');
        await this.page.goto(`https://${this.schoolId || 'bmszc-neumann'}.e-kreta.hu/Tanar/TanarBejelentettSzamonkeresek`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (e) {
        console.log('Navigációs hiba a dolgozatok lekérésekor:', e.message);
        if (cache[cacheKey] && Array.isArray(cache[cacheKey])) {
          return cache[cacheKey];
        }
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
        if (cache[cacheKey] && Array.isArray(cache[cacheKey])) {
          return cache[cacheKey];
        }
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
      
      if (exams && exams.length > 0) {
        this.saveCache({ [cacheKey]: exams, examsUpdatedAt: new Date().toISOString() });
        console.log(`[Kréta] ${exams.length} db dolgozat sikeresen kiolvasva és elmentve a cache-be.`);
        return exams;
      }

      if (cache[cacheKey] && Array.isArray(cache[cacheKey]) && cache[cacheKey].length > 0) {
        return cache[cacheKey];
      }

      return exams;
    }); // _withLock vége
  }

  _decodeHtmlEntities(str) {
    if (!str) return '';
    return str
      .replace(/&#225;/g, 'á')
      .replace(/&#233;/g, 'é')
      .replace(/&#237;/g, 'í')
      .replace(/&#243;/g, 'ó')
      .replace(/&#246;/g, 'ö')
      .replace(/&#245;/g, 'ő')
      .replace(/&#250;/g, 'ú')
      .replace(/&#252;/g, 'ü')
      .replace(/&#251;/g, 'ű')
      .replace(/&#193;/g, 'Á')
      .replace(/&#201;/g, 'É')
      .replace(/&#205;/g, 'Í')
      .replace(/&#211;/g, 'Ó')
      .replace(/&#214;/g, 'Ö')
      .replace(/&#213;/g, 'Ő')
      .replace(/&#218;/g, 'Ú')
      .replace(/&#220;/g, 'Ü')
      .replace(/&#219;/g, 'Ű');
  }

  async getGrades(refresh = false) {
    const cache = this.loadCache();
    if (!refresh && cache.grades && Object.keys(cache.grades).length > 0) {
      console.log('[Backend] Értékelések betöltése cacheből...');
      return { success: true, data: cache.grades, fromCache: true, updatedAt: cache.gradesUpdatedAt || null };
    }

    return this._withLock(async () => {
      if (!this.page || !this.browser || !this.browser.isConnected()) {
        await this.ensureAuthenticated();
      }

      if (!this.page) {
        if (cache.grades && Object.keys(cache.grades).length > 0) {
          return { success: true, data: cache.grades, fromCache: true, updatedAt: cache.gradesUpdatedAt || null };
        }
        return { success: false, data: {}, fromCache: false, message: 'Nincs aktív Kréta munkamenet' };
      }

      try {
        console.log('[Kréta] Értékelések kiolvasása a TanuloErtekeles/Ertekeles/IndexEvkozi oldalról...');
        const baseUrl = `https://${this.schoolId || 'bmszc-neumann'}.e-kreta.hu/TanuloErtekeles/Ertekeles/IndexEvkozi`;

        await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await this.page.waitForTimeout(2500);

        // Kinyerjük a foglalkozásokat a Kendo dropdownból
        const foglalkozasok = await this.page.evaluate(() => {
          const dropdown = window.jQuery('#FoglalkozasId').data('kendoDropDownList');
          if (!dropdown) return [];
          return dropdown.dataSource.data().map(d => ({
            text: d.Nev || d.Text || d.Name || d.text,
            value: String(d.Id || d.Value || d.value)
          }));
        });

        console.log(`[Kréta] Talált foglalkozások száma: ${foglalkozasok.length}`);
        if (!foglalkozasok || foglalkozasok.length === 0) {
          console.warn('[Kréta] Nem sikerült beolvasni a foglalkozások listáját a dropdownból.');
          if (cache.grades && Object.keys(cache.grades).length > 0) {
            return { success: true, data: cache.grades, fromCache: true, updatedAt: cache.gradesUpdatedAt || null };
          }
          return { success: true, data: {}, fromCache: false };
        }

        const allGradesByGroup = {};
        const monthKeys = ['Szeptember', 'Oktober', 'November', 'December', 'JanuarI', 'JanuarII', 'Februar', 'Marcius', 'Aprilis', 'Majus', 'Junius'];

        for (let i = 0; i < foglalkozasok.length; i++) {
          const grp = foglalkozasok[i];
          console.log(`[Kréta] [${i + 1}/${foglalkozasok.length}] Kiolvasás: ${grp.text} (ID: ${grp.value})...`);

          try {
            await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await this.page.waitForTimeout(1200);

            await this.page.evaluate((idVal) => {
              const dropdown = window.jQuery('#FoglalkozasId').data('kendoDropDownList');
              if (dropdown) {
                dropdown.value(idVal);
                dropdown.trigger('change');
              }
            }, grp.value);
            await this.page.waitForTimeout(500);

            const startBtn = await this.page.$('#StartTovabbButton');
            if (startBtn && await startBtn.isVisible()) {
              await startBtn.click();
              await this.page.waitForTimeout(2500);
            }

            const rows = await this.page.evaluate(() => {
              const grid = window.jQuery('.TanuloErtekelesGrid, [data-role="grid"]').data('kendoGrid');
              if (!grid || !grid.dataSource) return [];
              return grid.dataSource.data().map(r => ({
                tanuloNev: r.TanuloNev || r.TanuloNevElotagNelkul,
                atlag: r.Atlag,
                months: {
                  Szeptember: r.Szeptember || '',
                  Oktober: r.Oktober || '',
                  November: r.November || '',
                  December: r.December || '',
                  JanuarI: r.JanuarI || '',
                  JanuarII: r.JanuarII || '',
                  Februar: r.Februar || '',
                  Marcius: r.Marcius || '',
                  Aprilis: r.Aprilis || '',
                  Majus: r.Majus || '',
                  Junius: r.Junius || ''
                }
              }));
            });

            console.log(`[Kréta]   -> ${rows.length} diák beolvasva (${grp.text}).`);

            const studentsObj = {};
            const allNumericGrades = [];
            let failingCount = 0;
            let excellentCount = 0;
            const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            for (const row of rows) {
              const sName = row.tanuloNev;
              if (!sName) continue;

              const studentGrades = [];
              const spanRegex = /<span\s+([^>]+)>(\d+)<\/span>/gi;

              for (const mKey of monthKeys) {
                const monthHtml = row.months[mKey];
                if (!monthHtml) continue;
                let match;
                while ((match = spanRegex.exec(monthHtml)) !== null) {
                  const attrs = match[1];
                  const gradeVal = parseInt(match[2], 10);

                  const getAttr = (name) => {
                    const mat = new RegExp(`data-${name}=['"]([^'"]*)['"]`, 'i').exec(attrs);
                    return mat ? this._decodeHtmlEntities(mat[1]) : '';
                  };

                  const sulyStr = getAttr('suly');
                  const weight = parseInt(sulyStr.replace(/[^0-9]/g, '') || '100', 10);
                  const tema = getAttr('ertekelestema').replace(/^Téma:\s*/i, '');
                  const tipus = getAttr('tipusmod') || 'Értékelés';
                  const datum = getAttr('datum') || '';
                  const ertekelesId = getAttr('tanuloertekelesid') || '';

                  if (gradeVal >= 1 && gradeVal <= 5) {
                    studentGrades.push({
                      id: ertekelesId || `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                      value: gradeVal,
                      numericValue: gradeVal,
                      weight: weight || 100,
                      type: tipus,
                      topic: tema,
                      date: datum,
                      month: mKey
                    });

                    distribution[gradeVal] = (distribution[gradeVal] || 0) + 1;
                    allNumericGrades.push(gradeVal);
                  }
                }
              }

              const sAvg = row.atlag !== null && row.atlag !== undefined ? Number(Number(row.atlag).toFixed(2)) : null;
              if (sAvg !== null) {
                if (sAvg < 2.0) failingCount++;
                if (sAvg >= 4.5) excellentCount++;
              }

              studentsObj[sName] = studentGrades;
            }

            const totalCount = allNumericGrades.length;
            const avg = totalCount > 0 ? (allNumericGrades.reduce((a, b) => a + b, 0) / totalCount) : 0;
            let median = 0;
            if (totalCount > 0) {
              const sorted = [...allNumericGrades].sort((a, b) => a - b);
              const mid = Math.floor(totalCount / 2);
              median = totalCount % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2);
            }

            const parts = grp.text.trim().split(' - ');
            const className = parts[0] ? parts[0].trim() : grp.text.trim();
            const subject = parts[1] ? parts[1].trim() : '';

            const groupData = {
              id: grp.text.trim(),
              className,
              subject,
              students: studentsObj,
              stats: {
                average: Number(avg.toFixed(2)),
                median: Number(median.toFixed(2)),
                count: totalCount,
                failingCount,
                excellentCount,
                distribution
              }
            };

            allGradesByGroup[grp.text.trim()] = groupData;
            if (className !== grp.text.trim()) {
              allGradesByGroup[className] = groupData;
            }
          } catch (itemErr) {
            console.error(`[Kréta] Hiba ennél a csoportnál (${grp.text}):`, itemErr.message);
          }
        }

        this.saveCache({ grades: allGradesByGroup, gradesUpdatedAt: new Date().toISOString() });
        return { success: true, data: allGradesByGroup, fromCache: false, updatedAt: new Date().toISOString() };

      } catch (err) {
        console.error('[Kréta] Hiba az értékelések kiolvasásakor:', err);
        if (cache.grades && Object.keys(cache.grades).length > 0) {
          return { success: true, data: cache.grades, fromCache: true, updatedAt: cache.gradesUpdatedAt || null };
        }
        return { success: false, data: {}, error: err.message };
      }
    });
  }

  async getMyClassStudents(refresh = false) {
    const cache = this.loadCache();
    if (!refresh && cache.students && cache.students.length > 0) {
      console.log('[Backend] Osztály tanulóinak betöltése cacheből...');
      return { data: cache.students, fromCache: true };
    }

    return this._withLock(async () => {
      // Ha még nincs page vagy lezárult a böngésző, megpróbáljuk visszaállítani az elmentett munkamenetet
      if (!this.page || !this.browser || !this.browser.isConnected()) {
        await this.ensureAuthenticated();
      }

      if (!this.page) {
        if (cache.students && cache.students.length > 0) {
          console.log('[Backend] Nincs böngésző munkamenet, de van cache. A cache visszaadása.');
          return { data: cache.students, fromCache: true };
        }
        const fallbackStudents = this._extractStudentsFromCache(cache);
        if (fallbackStudents.length > 0) {
          return { data: fallbackStudents, fromCache: true };
        }
        console.log('[Backend] Nincs valós böngésző munkamenet, mock adatok visszadása (Osztály tanulói)...');
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
        console.log('[Kréta] Navigálás az Osztály Tanulói oldalra...');
        const targetUrl = `https://${this.schoolId || 'bmszc-neumann'}.e-kreta.hu/Tanulo/OsztalyTanuloi`;
        if (!this.page.url().includes('OsztalyTanuloi')) {
          await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        }

        // Ellenőrizzük, hogy nem dobott-e ki a belépési oldalra
        const curUrl = this.page.url().toLowerCase();
        if (curUrl.includes('account/login') || curUrl.includes('idp.e-kreta.hu')) {
          console.warn('[Kréta] A munkamenet lejárt az Osztály Tanulói oldalon.');
          if (cache.students && cache.students.length > 0) {
            return { data: cache.students, fromCache: true };
          }
          const fallback = this._extractStudentsFromCache(cache);
          if (fallback.length > 0) return { data: fallback, fromCache: true };
          return { data: [], fromCache: false };
        }

        // Kezeljük a keresés / tovább gombot
        try {
          await this.page.waitForTimeout(1000);
          const searchButton = await this.page.waitForSelector('#StartOsztalyTanuloi, #btnKereses, .kereses-gomb, button:has-text("TOVÁBB"), button:has-text("Tovább"), button:has-text("Keresés"), button:has-text("Lekérdezés")', { state: 'visible', timeout: 3000 });
          if (searchButton) {
            console.log('[Kréta] Keresés / Tovább gomb megnyomása (Osztály Tanulói)...');
            await searchButton.click();
            await this.page.waitForTimeout(1500);
          }
        } catch(e) {}

        // Kendo Grid lapméret beállítása
        try {
          await this.page.evaluate(() => {
            try {
              const gridElement = document.querySelector('[data-role="grid"]');
              if (gridElement && window.jQuery) {
                const grid = window.jQuery(gridElement).data('kendoGrid');
                if (grid && grid.dataSource && grid.dataSource.pageSize() < 200) {
                  grid.dataSource.pageSize(200);
                }
              }
            } catch(err) {}
          });
        } catch(e) {}

        // Várjuk meg a táblázat betöltődését
        try {
          await this.page.waitForSelector('.k-grid-content table tbody tr, table tbody tr', { timeout: 10000 });
        } catch (e) {
          console.log('[Kréta] Nem töltött be az Osztály Tanulói táblázat:', e.message);
        }

        // Adatok kinyerése
        let students = await this.page.$$eval('.k-grid-content table tbody tr, table tbody tr', rows => {
           const results = [];
           rows.forEach((row) => {
              const cells = row.querySelectorAll('td');
              if (cells.length === 1 && cells[0].innerText.includes('Nincs megjeleníthető')) return;
              
              if (cells.length >= 2) {
                 const name = cells[1] ? cells[1].innerText.trim() : (cells[0] ? cells[0].innerText.trim() : '');
                 if (name && name !== 'Nincs megjeleníthető elem.' && name !== 'Ismeretlen') {
                   results.push({
                      name: name,
                      rawData: Array.from(cells).map(c => c.innerText.trim())
                   });
                 }
              }
           });
           return results;
        });

        // Duplikációk szűrése
        const uniqueStudentsMap = new Map();
        students.forEach(s => {
           if (s.name && s.name !== 'Ismeretlen') {
              if (!uniqueStudentsMap.has(s.name) || s.rawData.length > uniqueStudentsMap.get(s.name).rawData.length) {
                 uniqueStudentsMap.set(s.name, s);
              }
           }
        });
        students = Array.from(uniqueStudentsMap.values());

        // Fő osztály keresése ha több osztály tanulója szerepelne
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
        
        if (mainClass && students.length > maxCount) {
           console.log(`[Osztály szűrés] Fő osztályként azonosítva: ${mainClass}. A többi osztály tanulója elrejtve.`);
           students = students.filter(s => s.rawData.length >= 8 && s.rawData[7] === mainClass);
        }

        if (students.length > 0) {
          students = students.map((s, index) => ({
             id: `student_${index}`,
             name: s.name,
             rawData: s.rawData
          }));
          console.log(`[Kréta] Kinyert tanulók száma: ${students.length}`);
          this.saveCache({ students });
          return { data: students, fromCache: false };
        }

        // Ha az OsztályTanuloi nem adott vissza diákot, fallback a meglévő cache-re vagy a csoportokból kinyert adatra
        console.log('[Kréta] Nem sikerült új tanulókat találni az Osztály Tanulói oldalon, tartalék opciók vizsgálata...');
        if (cache.students && cache.students.length > 0) {
          return { data: cache.students, fromCache: true };
        }

        const fallback = this._extractStudentsFromCache(cache);
        if (fallback.length > 0) {
          this.saveCache({ students: fallback });
          return { data: fallback, fromCache: true };
        }

        return { data: [], fromCache: false };
      } catch (e) {
        console.error('[Kréta] Hiba az Osztály Tanulói lekérésekor:', e.message);
        if (cache.students && cache.students.length > 0) {
          console.log('[Kréta] Hiba történt, korábbi cache visszaadása.');
          return { data: cache.students, fromCache: true };
        }
        const fallback = this._extractStudentsFromCache(cache);
        if (fallback.length > 0) {
          return { data: fallback, fromCache: true };
        }
        return { data: [], fromCache: false };
      }
    }); // _withLock vége
  }

  async getStudentsForClass(dayIndex, classIndex) {
    if (!this.page) throw new Error('Nincs bejelentkezve.');
    
    // Biztosítjuk, hogy az órarenden vagyunk
    if (!this.page.url().includes('TanariOrarend')) {
       await this.page.goto(`https://${this.schoolId || 'bmszc-neumann'}.e-kreta.hu/Orarend/TanariOrarend`, { waitUntil: 'domcontentloaded' });
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
