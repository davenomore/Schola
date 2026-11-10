if (!window.taBotLoaded) {
  window.taBotLoaded = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // ===== SCRAPE STUDENTS: Kréta névsor automatikus leolvasása =====
    if (request.action === "SCRAPE_STUDENTS") {
      // Csak a FŐ frame-ből válaszolunk, iframe-ekből NEM!
      if (window !== window.top) {
        console.log("TA BOT: Iframe-ben vagyunk, scrape kihagyva.");
        return false;
      }
      console.log("TA BOT: Névsor scrape indítása (fő frame)...");

      try {
        // 1. Osztálynév és tantárgy kinyerése a Kréta fejlécből
        let className = "";
        let subject = "";
        let teacherName = "";
        
        // A Kréta "Tanóra naplózása" fejléc minta: 
        // "Tanóra naplózása (2026. 03. 23. 10:20-11:05 (4.Óra), Matematika, 9.c MAT1)"
        // FONTOS: belső zárójelek is lehetnek (pl. "(4.Óra)"), ezért .+ greedy match kell!
        const allPageText = document.body.innerText || "";
        const headerMatch = allPageText.match(/Tan[óo]ra napl[óo]z[áa]sa\s*\((.+)\)/i);
        if (headerMatch) {
           const parts = headerMatch[1].split(",").map(s => s.trim());
           // Az utolsó rész az osztálynév (pl. "9.c MAT1"), az utolsó előtti a tantárgy (pl. "Matematika")
           if (parts.length >= 2) {
              className = parts[parts.length - 1]; // "9.c MAT1"
              subject = parts[parts.length - 2];   // "Matematika"
              // Ha a tantárgy tartalmaz zárójeleset (pl. "(4.Óra)"), próbáljuk az eggyel előttet
              if (subject.includes("Óra") || subject.includes("óra") || /^\d/.test(subject)) {
                 subject = parts.length >= 3 ? parts[parts.length - 3] : "";
              }
           }
           console.log(`TA BOT: Fejlécből kiolvasva → Osztály: "${className}", Tantárgy: "${subject}"`);
        }
        
        // Ha a fejléc nem adott eredményt, fallback: keresés egyéb elemeken
        if (!className) {
           const headerEls = Array.from(document.querySelectorAll("h1, h2, h3, h4, .k-header, div[class*='title']"));
           for (const el of headerEls) {
              const text = (el.innerText || "").trim();
              if (!text || text.length > 120) continue;
              // Próbáljuk ugyanazt a mintát
              const m = text.match(/Tan[óo]ra napl[óo]z[áa]sa\s*\(([^)]+)\)/i);
              if (m) {
                 const p = m[1].split(",").map(s => s.trim());
                 if (p.length >= 2) {
                    className = p[p.length - 1];
                    subject = p[p.length - 2];
                    if (subject.includes("Óra") || /^\d/.test(subject)) {
                       subject = p.length >= 3 ? p[p.length - 3] : "";
                    }
                 }
              }
              // Egyszerű osztálynév keresés is
              if (/^\d+[\.\s\/]?\s?[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]/.test(text) && text.length < 20 && !text.includes("oldal")) {
                 className = text;
              }
           }
        }

        // 2. Bejelentkezett tanár nevének megtalálása (kizárandó a listából)
        // A Kréta általában a jobb felső sarokban mutatja a user nevét
        const userEls = Array.from(document.querySelectorAll(".user-name, .username, .user-info, #loggedInUserName, .navbar-right span, .navbar-right a, .dropdown-toggle, [class*='user'] span, [class*='User'] span, .header-right span"));
        for (const uel of userEls) {
           const uText = (uel.innerText || "").trim();
           if (uText.length >= 3 && uText.includes(" ") && uText.length < 40 && !/\d/.test(uText)) {
              const uWords = uText.split(/\s+/);
              if (uWords.length >= 2 && uWords.every(w => /^[A-ZÁÉÍÓÖŐÚÜŰ]/.test(w))) {
                 teacherName = uText;
                 console.log(`TA BOT: Bejelentkezett tanár neve: "${teacherName}" (ki lesz szűrve)`);
                 break;
              }
           }
        }

        // 2. DEBUG: Logoljuk az összes elérhető TD tartalmát
        const allTds = Array.from(document.querySelectorAll("td"));
        console.log(`TA BOT DEBUG: Összesen ${allTds.length} TD cella az oldalon.`);
        
        // Log az első 10 TD tartalmát a debug-hoz
        allTds.slice(0, 15).forEach((td, i) => {
           console.log(`TA BOT DEBUG TD[${i}]: "${(td.innerText || "").trim().substring(0, 60)}"`);
        });

        // 3. Diákok nevének scrape-elése: CSAK sorszámozott sorokból!
        // A Kréta diáktáblázatban minden sor elején van egy sorszám (1, 2, 3...)
        const students = [];
        const seenNames = new Set();

        const rows = Array.from(document.querySelectorAll("tr"));
        console.log(`TA BOT DEBUG: Összesen ${rows.length} TR sor az oldalon.`);
        
        for (const row of rows) {
           const cells = Array.from(row.querySelectorAll("td"));
           if (cells.length < 2) continue;
           
           // Az ELSŐ cella sorszám kell legyen (1, 2, 3, stb.)
           const firstCellText = (cells[0].innerText || "").trim();
           if (!/^\d+$/.test(firstCellText)) continue;
           
           // A MÁSODIK cella tartalmazza a nevet (esetleg születési dátummal)
           // Pl.: "Börzsönyi Máté (2010.02.11.)" → "Börzsönyi Máté"
           const nameCell = cells[1];
           let rawName = (nameCell.innerText || "").trim();
           
           // Születési dátum eltávolítása: zárójelben lévő rész a végéről
           rawName = rawName.replace(/\s*\([^)]*\)\s*⚠?\s*$/g, "").trim();
           // Figyelmeztető ikonok (⚠ stb.) eltávolítása
           rawName = rawName.replace(/[⚠️🔔🔴⭐\u26A0\uFE0F]/g, "").trim();
           
           if (rawName.length < 3 || !rawName.includes(" ")) continue;
           
           const words = rawName.split(/\s+/).filter(w => w.length > 0);
           const looksLikeName = words.length >= 2 && words.every(w => /^[A-ZÁÉÍÓÖŐÚÜŰ]/.test(w));
           
           if (looksLikeName && !seenNames.has(rawName)) {
              seenNames.add(rawName);
              students.push(rawName);
              console.log(`TA BOT: [Sor ${firstCellText}] Diák: "${rawName}"`);
           }
        }

        // 4. Ha a fő módszertől nem kaptunk nevet, próbáljuk a Kréta "k-grid" specifikus struktúrát
        if (students.length === 0) {
           console.log("TA BOT: Fallback keresés indul a Kendo Grid locked content-en...");
           const lockedCells = Array.from(document.querySelectorAll(".k-grid-content-locked td, .k-grid-header-locked td, table td"));
           for (const cell of lockedCells) {
              const text = (cell.innerText || "").trim();
              if (text.length >= 3 && text.includes(" ") && !/^\d/.test(text) && text.length < 60) {
                 const words = text.split(/\s+/).filter(w => w.length > 0);
                 if (words.length >= 2 && words.length <= 5 && words.every(w => /^[A-ZÁÉÍÓÖŐÚÜŰ]/.test(w)) && !seenNames.has(text)) {
                    seenNames.add(text);
                    students.push(text);
                    console.log(`TA BOT (fallback): Név megtalálva: "${text}"`);
                 }
              }
           }
        }

        console.log(`TA BOT: Névsor scrape kész! ${students.length} diák neve leolvasva.`, students);
        sendResponse({ status: "success", className, subject, students });

      } catch (e) {
        console.error("TA BOT: Scrape hiba:", e);
        sendResponse({ status: "error", message: e.message });
      }
      return true;
    }

    // ===== FILL GRADES: Jegyek automatikus beírása (eredeti funkció) =====
    if (request.action === "FILL_GRADES") {
      const students = request.payload;
      let successCount = 0;
      
      console.log("TA BOT: Megkaptam az adatokat. Kréta DOM manipuláció kezdete...", students);
      
      const firstData = students[0];
      if (firstData) {
        console.log("TA BOT: Megpróbálom kitölteni a Téma és Típus mezőket a bal felső sarokban...");
        try {
          // 1. TÉMA (Input mező)
          const labels = Array.from(document.querySelectorAll("label, span, div.control-label"));
          const topicLabel = labels.find(el => el.innerText && el.innerText.toLowerCase().includes("témája"));
          if (topicLabel && topicLabel.parentElement) {
             const container = topicLabel.parentElement.parentElement || topicLabel.parentElement;
             const input = container.querySelector("input[type='text'], textarea");
             if (input && firstData.testTopic) {
                input.value = firstData.testTopic;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.style.border = "2px solid #3fb950";
                console.log("TA BOT: Téma mező sikeresen kitöltve:", firstData.testTopic);
             }
          }

          // 2. MÓD / TÍPUS (Kendo UI Select legördülő hacker kód)
          const modeLabel = labels.find(el => el.innerText && el.innerText.toLowerCase().includes("módja"));
          if (modeLabel && modeLabel.parentElement) {
             const container = modeLabel.parentElement.parentElement || modeLabel.parentElement;
             
             const kendoWrap = container.querySelector(".k-dropdown-wrap");
             if (kendoWrap) {
                 kendoWrap.click();
                 
                 setTimeout(() => {
                    const listItems = Array.from(document.querySelectorAll("ul.k-list li"));
                    
                    const rawType = firstData.testType.toLowerCase();
                    const searchStr = rawType.split(' ')[1] || rawType;
                    const targetLi = listItems.find(li => li.innerText && li.innerText.toLowerCase().includes(searchStr));
                    
                    if (targetLi) {
                        targetLi.click();
                        kendoWrap.style.border = "2px solid #3fb950";
                        console.log("TA BOT: Kendo UI Mód sikeresen kiválasztva:", targetLi.innerText);
                    } else {
                        kendoWrap.click();
                        console.warn(`TA BOT: Nem találtunk egyezőt erre: ${searchStr}. Fallback indul...`);
                        
                        const select = container.querySelector("select");
                        if (select) {
                            const options = Array.from(select.options);
                            const targetOpt = options.find(o => o.text.toLowerCase().includes(searchStr));
                            if (targetOpt) {
                                select.value = targetOpt.value;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                kendoWrap.style.border = "2px solid #3fb950";
                                
                                const kInput = kendoWrap.querySelector(".k-input");
                                if (kInput) kInput.innerText = targetOpt.text;
                                
                                console.log("TA BOT: Mód kiválasztva 'mögöttes' select-tel:", targetOpt.text);
                            }
                        }
                    }
                 }, 600);
             } else {
                 const select = container.querySelector("select");
                 if (select && firstData.testType) {
                    const options = Array.from(select.options);
                    const searchStr = firstData.testType.toLowerCase().split(' ')[1] || firstData.testType.toLowerCase();
                    const targetOpt = options.find(o => o.text.toLowerCase().includes(searchStr));
                    if (targetOpt) {
                       select.value = targetOpt.value;
                       select.dispatchEvent(new Event('change', { bubbles: true }));
                       select.style.border = "2px solid #3fb950";
                    }
                 }
             }
          }
        } catch(e) {
          console.warn("TA BOT: Hiba a fejléc (téma/típus) kitöltésénél (a jegyek mennek tovább):", e);
        }
      }
      
      const rows = Array.from(document.querySelectorAll('tr'));
      console.log(`TA BOT: ${rows.length} táblázat sort találtam.`);
      
      students.forEach(student => {
        const nameParts = student.name.toLowerCase().split(/\\s+/).filter(Boolean);

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowText = (row.innerText || '').toLowerCase();
          
          const isMatch = nameParts.length > 0 && nameParts.every(part => rowText.includes(part));
          
          if (isMatch) {
            console.log(`TA BOT: Megtaláltam a kért diákot (${student.name}) a ${i}. sorban.`);
            
            const dataUid = row.getAttribute("data-uid");
            let targetRows = [row];
            if (dataUid) {
                targetRows = Array.from(document.querySelectorAll(`tr[data-uid="${dataUid}"]`));
            }
            
            let targetBtn = null;
            for (const tRow of targetRows) {
                const allRowButtons = Array.from(tRow.querySelectorAll('td a, td button, td div')).reverse();
                targetBtn = allRowButtons.find(btn => {
                    const btnText = btn.innerText ? btn.innerText.trim() : '';
                    return btnText === student.grade.toString();
                });
                if (targetBtn) break;
            }

            if (targetBtn) {
              console.log(`TA BOT: Jegy (${student.grade}) gomb megtalálva, kattintás...`);
              targetBtn.click();
              
              if(targetBtn.style) {
                targetBtn.style.border = "2px solid #3fb950";
                targetBtn.style.backgroundColor = "rgba(63, 185, 80, 0.2)";
                targetBtn.style.transform = "scale(1.1)";
              }
              successCount++;
              break; 
            } else {
               console.warn("TA BOT: A diák megvan, de nem találtam meg a jegy (1-5) bekattintó DOM elemet annak ellenére, hogy átkutattam mindkét táblafelet!");
            }
          }
        }
      });

      console.log(`TA BOT Ciklus lefutott: ${successCount} jegyet osztottam ki automatikusan.`);
      sendResponse({ status: "success", count: successCount });
      return true;
    }
  });
}

