const PROJECT_ID = "teacher-assistant-383cf";

// Fetch scanned_tests from user's specific Firestore document
async function fetchCloudData(teacherUid) {
  if (!teacherUid) throw new Error("Add meg a Bővítmény Kódot a fiók összekapcsolásához!");
  
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${teacherUid}`;
  const response = await fetch(url);
  const json = await response.json();
  
  if (json.error) {
     if (json.error.status === "PERMISSION_DENIED" || json.error.status === "NOT_FOUND") return []; // Ha még nincs adat, nem halunk le
     throw new Error(json.error.message);
  }
  
  // Unpack scanned_tests array directly from document fields
  if (!json.fields || !json.fields.scanned_tests || !json.fields.scanned_tests.arrayValue || !json.fields.scanned_tests.arrayValue.values) {
     return [];
  }
  
  const rawArray = json.fields.scanned_tests.arrayValue.values;
  const parsedItems = rawArray.map(item => {
    const map = item.mapValue.fields;
    return {
       id: map.id?.stringValue,
       groupId: map.groupId?.stringValue,
       name: map.name?.stringValue,
       maxScore: map.maxScore?.integerValue ? parseInt(map.maxScore.integerValue) : 0,
       score: map.score?.integerValue ? parseInt(map.score.integerValue) : 0,
       grade: map.grade?.integerValue ? parseInt(map.grade.integerValue) : (map.grade?.doubleValue ? parseFloat(map.grade.doubleValue) : 0),
       testTopic: map.testTopic?.stringValue || "",
       testType: map.testType?.stringValue || "Írásbeli témazáró dolgozat",
       testWeight: map.testWeight?.stringValue || "100%"
    };
  }).filter(item => item.grade > 0);
  return parsedItems;
}

// Push scraped group to Firestore specific UID subcollection
async function pushGroupToFirestore(teacherUid, groupData) {
  if (!teacherUid) throw new Error("Add meg a Bővítmény Kódot a fiók összekapcsolásához!");

  const docId = "scraped_" + Date.now();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${teacherUid}/scraped_groups/${docId}`;
  
  const firestoreDoc = {
    fields: {
      id: { stringValue: docId },
      name: { stringValue: groupData.className || "Ismeretlen osztály" },
      subject: { stringValue: groupData.subject || "Ismeretlen tantárgy" },
      students: { 
        arrayValue: { 
          values: groupData.students.map(s => ({ stringValue: s }))
        }
      },
      scrapedAt: { timestampValue: new Date().toISOString() }
    }
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(firestoreDoc)
  });

  if (!response.ok) {
    const errJson = await response.json();
    throw new Error(errJson.error?.message || "Firestore mentés sikertelen");
  }
  
  return docId;
}

document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('connectionStatus');
  const injectBtn = document.getElementById('injectBtn');
  const fetchCloudBtn = document.getElementById('fetchCloudBtn');
  const previewArea = document.getElementById('previewArea');
  const scrapeBtn = document.getElementById('scrapeBtn');
  const scrapeResult = document.getElementById('scrapeResult');
  const uidInput = document.getElementById('uidInput');
  const saveUidBtn = document.getElementById('saveUidBtn');

  let loadedData = null;
  let isOnKreta = false;
  let currentUid = null;

  // UID betöltése
  chrome.storage.local.get(['teacherUid', 'displayCode'], (result) => {
    if (result.teacherUid) {
      currentUid = result.teacherUid;
      uidInput.value = result.displayCode || 'KÉSZ';
      saveUidBtn.textContent = 'Kész';
      saveUidBtn.style.background = '#238636';
    } else {
      scrapeBtn.disabled = true;
      fetchCloudBtn.disabled = true;
    }
  });

  saveUidBtn.addEventListener('click', async () => {
    const val = uidInput.value.trim().toUpperCase();
    if (val.length === 4) {
      saveUidBtn.textContent = 'Keresés...';
      try {
         const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/sync_codes/${val}`;
         const res = await fetch(url);
         const json = await res.json();
         if (json.error || !json.fields) {
             alert('Helytelen kód! Nézd meg a PWA alkalmazásban!');
             saveUidBtn.textContent = 'Párosítás';
             return;
         }
         const foundUid = json.fields.uid.stringValue;
         
         chrome.storage.local.set({ teacherUid: foundUid, displayCode: val }, () => {
           currentUid = foundUid;
           saveUidBtn.textContent = 'Kész';
           saveUidBtn.style.background = '#238636';
           if (isOnKreta) scrapeBtn.disabled = false;
           fetchCloudBtn.disabled = false;
           alert('Sikeresen kapcsolódott a fiókodhoz!');
         });
      } catch (err) {
         alert('Hálózati hiba a kód ellenőrzésekor!');
         saveUidBtn.textContent = 'Párosítás';
      }
    } else {
       alert("A kódnak pontosan 4 karakternek kell lennie!");
    }
  });

  // Csatlakozás lekérdezése
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url && (activeTab.url.includes('kretanaplo.hu') || activeTab.url.includes('e-kreta.hu') || activeTab.url.includes('localhost'))) {
      statusDiv.className = 'status';
      statusDiv.innerHTML = '<div class="dot"></div> Csatlakozva az Értékelés laphoz';
      isOnKreta = true;
      scrapeBtn.disabled = false;
    } else {
      statusDiv.className = 'status offline';
      statusDiv.innerHTML = '<div class="dot"></div> Nyisd meg a Kréta Értékelés weblapját!';
      isOnKreta = false;
      scrapeBtn.disabled = true;
    }
  });

  // ===== SCRAPER: Névsor leolvasása =====
  scrapeBtn.addEventListener('click', () => {
    if (!isOnKreta) return;
    
    scrapeBtn.textContent = 'Névsor olvasása...';
    scrapeBtn.disabled = true;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id;
      
      chrome.scripting.executeScript({
        target: { tabId: activeTabId, allFrames: true },
        files: ['content.js']
      }).then(() => {
        setTimeout(() => {
          chrome.tabs.sendMessage(activeTabId, { action: "SCRAPE_STUDENTS" }, async (response) => {
            if (chrome.runtime.lastError) {
              scrapeResult.innerHTML = `<span style="color: #f85149">Hiba: ${chrome.runtime.lastError.message}</span>`;
              scrapeBtn.innerHTML = '📋 Névsor Leolvasása a Krétából';
              scrapeBtn.disabled = false;
              return;
            }
            
            if (response && response.status === "success" && response.students.length > 0) {
              const { className, subject, students } = response;
              
              // Megjelenítés
              scrapeResult.innerHTML = 
                `<strong style="color: #d29922">${className || '?'} – ${subject || '?'}</strong><br/>` +
                `<span style="color: #3fb950; font-weight: 600;">${students.length} diák</span> sikeresen leolvasva:<br/><br/>` +
                students.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('<br/>') +
                (students.length > 6 ? `<br/><span style="color: #8b949e">... és még ${students.length - 6} diák</span>` : '') +
                `<br/><br/><span style="color: #8b949e">Mentés a Felhőbe folyamatban...</span>`;

              try {
                if (!currentUid) throw new Error("Nincs azonosító csatolva (Bővítmény Kód).");
                await pushGroupToFirestore(currentUid, { className, subject, students });
                
                scrapeBtn.innerHTML = '✅ Névsor sikeresen elmentve!';
                scrapeBtn.style.background = '#238636';
                scrapeBtn.style.boxShadow = '0 4px 12px rgba(35, 134, 54, 0.3)';
                
                scrapeResult.innerHTML = 
                  `<strong style="color: #3fb950">✅ ${className || '?'} – ${subject || '?'}</strong><br/>` +
                  `<span style="color: #3fb950; font-weight: 600;">${students.length} diák</span> elmentve a Felhőbe!<br/><br/>` +
                  students.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('<br/>') +
                  (students.length > 6 ? `<br/><span style="color: #8b949e">... és még ${students.length - 6} diák</span>` : '') +
                  `<br/><br/><span style="color: #8b949e; font-size: 12px;">A Telefonos Appban a Csoportok fülön fogod megtalálni a szinkronizálás után!</span>`;
              } catch(e) {
                scrapeResult.innerHTML += `<br/><span style="color: #f85149">Felhő mentés hiba: ${e.message}</span>`;
                scrapeBtn.innerHTML = '📋 Névsor Leolvasása a Krétából';
              }
            } else if (response && response.students && response.students.length === 0) {
              scrapeResult.innerHTML = '<span style="color: #d29922">⚠️ Nem találtam diáknevet a Kréta oldalon. Győződj meg, hogy az Osztályozó naplóban vagy!</span>';
              scrapeBtn.innerHTML = '📋 Névsor Leolvasása a Krétából';
            } else {
              scrapeResult.innerHTML = '<span style="color: #f85149">Hiba a scrape során: ' + (response?.message || 'Ismeretlen') + '</span>';
              scrapeBtn.innerHTML = '📋 Névsor Leolvasása a Krétából';
            }
            
            scrapeBtn.disabled = false;
          });
        }, 500);
      }).catch(err => {
        scrapeResult.innerHTML = `<span style="color: #f85149">Extension betöltés hiba: ${err.message}</span>`;
        scrapeBtn.innerHTML = '📋 Névsor Leolvasása a Krétából';
        scrapeBtn.disabled = false;
      });
    });
  });

  // ===== Felhő letöltés =====
  fetchCloudBtn.addEventListener('click', async () => {
     if (!currentUid) {
        alert("Ezt megelőzően illeszd be a Bővítmény Kódodat a fiókod kapcsolásához!");
        return;
     }
     
     const origText = fetchCloudBtn.innerHTML;
     fetchCloudBtn.textContent = 'Letöltés folyamatban a Firebase-ből...';
     
     try {
       const items = await fetchCloudData(currentUid);
       loadedData = items;
       
       if (items.length === 0) {
          previewArea.innerHTML = 'A felhőben (sync/latest) nincsenek adatok.';
          fetchCloudBtn.innerHTML = origText;
          return;
       }
       
       previewArea.innerHTML = `<strong style="color: #e6edf3">${items.length} diák értékelése sikeresen letöltve a Felhőből!</strong><br/><br/>` + 
          items.slice(0, 4).map(d => `<span style="color: #3fb950; font-weight: bold;">${d.grade}</span> - ${d.name}`).join('<br>') + 
          (items.length > 4 ? '<br><span style="color: #8b949e">... további diákok</span>' : '');
          
       fetchCloudBtn.innerHTML = '✅ Adatok sikeresen szinkronizálva!';
       fetchCloudBtn.style.background = '#238636';
       
       injectBtn.disabled = !isOnKreta;
       
     } catch(e) {
       console.error(e);
       previewArea.innerHTML = `<span style="color: #f85149">Hiba történt:<br/>${e.message}</span>`;
       fetchCloudBtn.innerHTML = origText;
     }
  });

  // ===== Kréta Injektálás (eredeti) =====
  injectBtn.addEventListener('click', () => {
    const data = loadedData;
    if (!data || !Array.isArray(data)) {
        alert("Először töltsd le az adatokat a Felhőből!");
        return;
    }

    injectBtn.textContent = 'Robot bevetése...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id;
      
      chrome.scripting.executeScript({
        target: { tabId: activeTabId, allFrames: true },
        files: ['content.js']
      }).then(() => {
        setTimeout(() => {
          chrome.tabs.sendMessage(activeTabId, { action: "FILL_GRADES", payload: data }, (response) => {
            injectBtn.textContent = 'Minden beírva!';
            if (chrome.runtime.lastError) {
               console.error("Content Script hiba:", chrome.runtime.lastError.message);
               previewArea.innerHTML = "<span style='color: #f85149'>Még mindig nem válaszol a Kréta. Részletek a konzolban: " + chrome.runtime.lastError.message + "</span>";
            } else {
               previewArea.innerHTML = `<span style='color: #3fb950; font-weight: 500;'>✅ Sikeres Kréta Auto-Fill!<br/>${response?.count || 0} jegy került beírásra a böngészőben. Kérlek ellenőrizd!</span>`;
            }
          });
        }, 500);
      }).catch(err => {
         previewArea.innerHTML = "<span style='color: #f85149'>A böngésző biztonsági rendszere nem engedi a robotot betölteni: " + err.message + "</span>";
      });
    });
  });
});

