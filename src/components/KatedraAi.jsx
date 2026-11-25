import React, { useState, useEffect } from 'react';
import { geminiService, AVAILABLE_MODELS } from '../services/geminiService';
import { mathExamSkill } from '../services/skills/mathExamSkill';

export default function KatedraAi({ addNotification, setActiveTab }) {
  const [currentTab, setCurrentTab] = useState('exam-planner'); // 'exam-planner' | 'subject-assistant' | 'api-settings'
  
  // API Kulcs állapota
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState(null);

  useEffect(() => {
    const savedKey = geminiService.getApiKey();
    setApiKey(savedKey || '');
    setHasKey(Boolean(savedKey));
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      geminiService.removeApiKey();
      setHasKey(false);
      setKeyStatusMsg({ type: 'error', text: 'API kulcs törölve.' });
      if (addNotification) addNotification('Gemini API kulcs törölve.', 'info');
      return;
    }
    geminiService.setApiKey(apiKey.trim());
    setHasKey(true);
    setKeyStatusMsg({ type: 'success', text: 'API kulcs sikeresen elmentve a böngésződben!' });
    if (addNotification) addNotification('Gemini API kulcs elmentve!', 'success');
  };

  const handleTestApiKey = async () => {
    setIsTestingKey(true);
    setKeyStatusMsg(null);
    const result = await geminiService.testConnection(apiKey.trim());
    setIsTestingKey(false);
    if (result.success) {
      setKeyStatusMsg({ type: 'success', text: result.message });
      if (addNotification) addNotification(result.message, 'success');
    } else {
      setKeyStatusMsg({ type: 'error', text: result.error });
      if (addNotification) addNotification(result.error, 'error');
    }
  };

  // ==========================================
  // 1. DOLGOZATTERVEZŐ ÁLLAPOTOK
  // ==========================================
  const [topic, setTopic] = useState('Másodfokú egyenletek és függvények');
  const [grade, setGrade] = useState('10. évfolyam');
  const [duration, setDuration] = useState(45);
  const [hasAB, setHasAB] = useState(true);
  const [customNotes, setCustomNotes] = useState('');

  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [examStep, setExamStep] = useState(0);
  const [examStepLabel, setExamStepLabel] = useState('');
  const [examResult, setExamResult] = useState(null);
  const [examMarkdown, setExamMarkdown] = useState('');
  const [examViewMode, setExamViewMode] = useState('preview'); // 'preview' | 'markdown'
  const [savedToRadar, setSavedToRadar] = useState(false);

  const quickTopics = [
    'Másodfokú egyenletek és függvények',
    'Trigonometrikus összefüggések és szögfüggvények',
    'Exponenciális és logaritmusos egyenletek',
    'Kombinatorika és valószínűségszámítás',
    'Koordinátageometria: kör és egyenes egyenlete',
    'Függvénytranszformációk és határérték',
    'Mechanika: Newton törvényei és kinematika',
    'Termodinamika: Hőtani állapotegyenletek és gáztörvények'
  ];

  const handleGenerateExam = async () => {
    if (!topic.trim()) {
      if (addNotification) addNotification('Kérlek add meg a dolgozat témakörét!', 'error');
      return;
    }
    if (!hasKey) {
      if (addNotification) addNotification('Kérlek előbb add meg a Gemini API kulcsodat a Beállítások fülön!', 'error');
      setCurrentTab('api-settings');
      return;
    }

    setIsGeneratingExam(true);
    setExamResult(null);
    setExamStep(1);
    setSavedToRadar(false);

    try {
      const result = await mathExamSkill.generateExamWorkflow({
        topic: topic.trim(),
        grade,
        durationMinutes: Number(duration),
        hasABGroups: hasAB,
        customInstructions: customNotes.trim(),
        onStepUpdate: ({ step, label }) => {
          setExamStep(step);
          setExamStepLabel(label);
        }
      });

      setExamResult(result);
      setExamMarkdown(result.markdown);
      setExamStep(3);
      if (addNotification) addNotification('A dolgozat és a javítókulcs sikeresen elkészült!', 'success');
    } catch (err) {
      if (addNotification) addNotification(err.message, 'error');
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleCopyExam = () => {
    const textToCopy = examMarkdown || examResult?.markdown || '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    if (addNotification) addNotification('Dolgozat vágólapra másolva!', 'success');
  };

  const handlePrintExam = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = examMarkdown || examResult?.markdown || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${topic} – Dolgozat</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; color: #000; }
            h1 { font-size: 22px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
            h2 { font-size: 17px; margin-top: 24px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
            h3 { font-size: 14px; margin-top: 16px; }
            pre { font-family: inherit; white-space: pre-wrap; font-size: 14px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <pre>${content}</pre>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSaveExamToRadar = () => {
    if (!topic.trim()) return;

    try {
      const saved = localStorage.getItem('ekreta_exams');
      const existing = saved ? JSON.parse(saved) : {};
      const id = `ai_${Date.now()}`;
      const newExam = {
        id,
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: '',
        lessonNumber: 1,
        subject: topic.toLowerCase().includes('mechanika') || topic.toLowerCase().includes('termodinamika') ? 'Fizika' : 'Matematika',
        className: grade,
        type: Number(duration) <= 20 ? 'Röpdolgozat' : 'Témazáró dolgozat',
        topic: topic.trim(),
        status: 'planned',
        notes: examMarkdown || examResult?.markdown || ''
      };

      existing[id] = newExam;
      localStorage.setItem('ekreta_exams', JSON.stringify(existing));
      setSavedToRadar(true);

      if (addNotification) {
        addNotification(`"${topic}" dolgozat hozzáadva a Dolgozat Radarhoz!`, 'success');
      }
    } catch (e) {
      console.error(e);
      if (addNotification) addNotification('Nem sikerült a mentés a Dolgozat Radarba.', 'error');
    }
  };

  // ==========================================
  // 2. SZAKTÁRGYI & OFŐ ASSZISZTENS ÁLLAPOTOK
  // ==========================================
  const [assistantRole, setAssistantRole] = useState('math'); // 'math' | 'physics' | 'formTeacher'
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [isGeneratingAssistant, setIsGeneratingAssistant] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState('');

  const promptTemplates = {
    math: [
      {
        title: 'Érettségi típuspélda levezetéssel',
        prompt: 'Készíts egy középszintű érettségi típusú szöveges másodfokú feladatot lépésről lépésre kidolgozott, diákok számára didaktikus megoldással és pontozási útmutatóval.'
      },
      {
        title: 'Differenciált gyakorló feladatsor',
        prompt: 'Készíts egy 3 szintű differenciált feladatsort a Trigonometria (szögfüggvények derékszögű háromszögben) témakörből: 1. Szint: Alap definíciók (2 feladat), 2. Szint: Gyakorlati szöveges feladat (2 feladat), 3. Szint: Kihívást jelentő geometriai összefüggés (1 feladat).'
      },
      {
        title: 'Tétel és bizonyítás magyarázata',
        prompt: 'Mutasd be a Pitagorasz-tétel algebrai vagy geometriai bizonyítását úgy, hogy egy 9. évfolyamos diák is könnyen megértse a mögöttes gondolatmenetet. Emeld ki a kulcslépéseket!'
      }
    ],
    physics: [
      {
        title: 'Kísérleti terv & mérési jegyzőkönyv',
        prompt: 'Tervezz meg egy tanórai demonstrációs és tanulói kísérletet a rugalmas deformáció és a Hooke-törvény igazolására. Készíts kitölthető mérési jegyzőkönyv sablont táblázattal, hibaszámítási szempontokkal és ellenőrző kérdésekkel.'
      },
      {
        title: 'Számításos feladatsor képlettárral',
        prompt: 'Állíts össze 3 számításos feladatot az Egyenletesen gyorsuló mozgás és szabadesés témakörében 9. osztályosoknak. Add meg a szükséges fizikai összefüggéseket (képlettár), és a teljes számítási menetet mértékegységekkel.'
      },
      {
        title: 'Fizikai tévhit feldolgozása',
        prompt: 'Hogyan oszlatható el az a gyakori diák-tévhit, hogy „nehezebb testek gyorsabban esnek le”? Írj egy tanórai gondolatkísérletet és egy egyszerű szemléltetést a gravitációs gyorsulás függetlenségének bemutatására.'
      }
    ],
    formTeacher: [
      {
        title: 'Hivatalos szülői értesítő (Osztálykirándulás)',
        prompt: 'Fogalmazz meg egy hivatalos, mégis barátságos szülői tájékoztató levelet egy kétnapos őszi/tavaszi osztálykirándulásról. Tartalmazza a fontosabb időpontokat, a várható költségeket, az étkezést, az orvosi igazolások szükségességét és a szülői hozzájáruló nyilatkozatot.'
      },
      {
        title: 'Mulasztási figyelmeztető levél sablon',
        prompt: 'Készíts egy hivatalos osztályfőnöki figyelmeztető levelet a szülőknek, amely felhívja a figyelmet a tanuló igazolatlan mulasztásainak elért óraszámára (10 óra / 30 óra), a jogszabályi következményekre és az együttműködési lehetőségre.'
      },
      {
        title: 'Közösségépítő OFŐ óravázlat',
        prompt: 'Tervezz meg egy 45 perces osztályfőnöki órát a digitális tudatosság, közösségi média és online konfliktusok témájában. Tartalmazzon egy ráhangoló feladatot (10 perc), kiscsoportos szituációs játékot (20 perc) és egy közös összegző reflexiót (15 perc).'
      }
    ]
  };

  const handleRunAssistant = async (customText = null) => {
    const textToRun = customText || assistantPrompt;
    if (!textToRun.trim()) {
      if (addNotification) addNotification('Kérlek írd be a kérdésed vagy válassz egy sablont!', 'error');
      return;
    }
    if (!hasKey) {
      if (addNotification) addNotification('Kérlek előbb add meg a Gemini API kulcsodat a Beállítások fülön!', 'error');
      setCurrentTab('api-settings');
      return;
    }

    setIsGeneratingAssistant(true);
    setAssistantResponse('');

    const roleInstructions = {
      math: 'Te egy kiváló magyar matematika tanár és érettségi szakértő vagy. Használj magyar matematikai jelöléseket (tg, ctg, lg, tizedesvessző) és didaktikus, lépésről lépésre történő magyarázatokat.',
      physics: 'Te egy tapasztalt magyar fizikatanár vagy. Precíz SI mértékegységeket, szemléletes analógiákat és a mindennapi tapasztalatokhoz kapcsolódó didaktikai magyarázatokat alkalmazol.',
      formTeacher: 'Te egy támogató, tapasztalt magyar középiskolai osztályfőnök és pedagógus vagy. Válaszaidban hivatalos, szakszerű, mégis empátiával teli pedagógiai hangnemet képviselsz.'
    };

    try {
      const response = await geminiService.generateContent({
        systemInstruction: roleInstructions[assistantRole],
        prompt: textToRun,
        temperature: 0.7
      });
      setAssistantResponse(response);
    } catch (err) {
      if (addNotification) addNotification(err.message, 'error');
    } finally {
      setIsGeneratingAssistant(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      
      {/* Fejléc */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Katedra AI
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Matematika, fizika és osztályfőnöki intelligens tanári asszisztens & dolgozatgenerátor
          </p>
        </div>

        {/* API Státusz jelvény */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            background: 'var(--panel-bg)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--panel-border)'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: hasKey ? '#10b981' : '#f59e0b',
              boxShadow: hasKey ? '0 0 6px rgba(16, 185, 129, 0.4)' : 'none'
            }} />
            {hasKey ? 'Gemini AI Aktív' : 'API Kulcs Szükséges'}
          </div>
        </div>
      </div>

      {/* Fő Fülválasztó Sáv - a TeacherTools szegmentált stílusában */}
      <div style={{ display: 'flex', marginBottom: '20px', flexShrink: 0 }}>
        <div style={{
          display: 'inline-flex',
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          borderRadius: '8px',
          padding: '3px',
          gap: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <button
            type="button"
            onClick={() => setCurrentTab('exam-planner')}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: currentTab === 'exam-planner' ? 'var(--text-primary)' : 'transparent',
              color: currentTab === 'exam-planner' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: currentTab === 'exam-planner' ? '600' : '500',
              padding: '7px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Dolgozattervező (A/B)
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('subject-assistant')}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: currentTab === 'subject-assistant' ? 'var(--text-primary)' : 'transparent',
              color: currentTab === 'subject-assistant' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: currentTab === 'subject-assistant' ? '600' : '500',
              padding: '7px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Szaktárgyi Asszisztens & Sablonok
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('api-settings')}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: currentTab === 'api-settings' ? 'var(--text-primary)' : 'transparent',
              color: currentTab === 'api-settings' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: currentTab === 'api-settings' ? '600' : '500',
              padding: '7px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            API Beállítások
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FÜL: DIFFERENCIÁLT DOLGOZATTERVEZŐ (A/B CSOPORT + JAVÍTÓKULCS)         */}
      {/* ========================================================================= */}
      {currentTab === 'exam-planner' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Bal oldali konfigurációs panel */}
          <div className="glass-panel card" style={{ borderRadius: '4px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Dolgozat Paraméterek
              </h3>
            </div>

            {/* Témakör megadása */}
            <div>
              <label className="input-label" style={{ marginBottom: '6px' }}>
                Dolgozat Témaköre
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="pl. Másodfokú egyenletek és függvények"
                className="input-field"
                style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '4px' }}
              />
              {/* Gyors témaválasztó címkék */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {quickTopics.map((t) => {
                  const isSelected = topic === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: isSelected ? 'var(--text-primary)' : 'var(--bg-color)',
                        border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--panel-border)'}`,
                        color: isSelected ? 'var(--bg-color)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Évfolyam és Időtartam */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>
                  Évfolyam
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="input-field"
                  style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '4px' }}
                >
                  <option value="9. évfolyam">9. évfolyam</option>
                  <option value="10. évfolyam">10. évfolyam</option>
                  <option value="11. évfolyam">11. évfolyam</option>
                  <option value="12. évfolyam">12. évfolyam</option>
                </select>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>
                  Időtartam
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="input-field"
                  style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '4px' }}
                >
                  <option value={20}>20 perc (Röpdolgozat)</option>
                  <option value={45}>45 perc (Témazáró)</option>
                  <option value={90}>90 perc (Nagydolgozat)</option>
                </select>
              </div>
            </div>

            {/* A/B Csoport opció */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              background: 'var(--bg-color)',
              borderRadius: '4px',
              border: '1px solid var(--panel-border)'
            }}>
              <input
                type="checkbox"
                id="hasABCheck"
                checked={hasAB}
                onChange={(e) => setHasAB(e.target.checked)}
                style={{ cursor: 'pointer', width: '15px', height: '15px', marginTop: '2px' }}
              />
              <label htmlFor="hasABCheck" style={{ fontSize: '12px', cursor: 'pointer', flex: 1, userSelect: 'none' }}>
                <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  A és B csoport párhuzamosan
                </strong>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Azonos nehézségű feladatok eltérő numerikus adatokkal a másolás megelőzésére
                </span>
              </label>
            </div>

            {/* Egyedi megjegyzések */}
            <div>
              <label className="input-label" style={{ marginBottom: '6px' }}>
                Egyedi instrukciók (opcionális)
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="pl. Legyen benne 1 emelt szintű feladat is; ne tartalmazzon tört kitevőt; lépésenkénti részpontozás..."
                rows={3}
                className="input-field"
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Generálás gomb */}
            <button
              onClick={handleGenerateExam}
              disabled={isGeneratingExam}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {isGeneratingExam ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Generálás folyamatban...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span>Dolgozat & Javítókulcs Generálása</span>
                </>
              )}
            </button>

            {/* Lépésjelző folyamatjelző doboz */}
            {isGeneratingExam && (
              <div style={{
                padding: '12px',
                background: 'var(--bg-color)',
                border: '1px solid var(--panel-border)',
                borderRadius: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Munkafolyamat</span>
                  <span>{examStep}/3 fázis</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--panel-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: examStep === 1 ? '33%' : examStep === 2 ? '70%' : '100%',
                    height: '100%',
                    background: 'var(--text-primary)',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {examStepLabel || 'Előkészítés...'}
                </p>
              </div>
            )}
          </div>

          {/* Jobb oldali Eredmény és Előnézet panel */}
          <div className="glass-panel card" style={{ borderRadius: '4px', padding: '20px', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setExamViewMode('preview')}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    borderRadius: '4px',
                    border: `1px solid ${examViewMode === 'preview' ? 'var(--text-primary)' : 'var(--panel-border)'}`,
                    background: examViewMode === 'preview' ? 'var(--text-primary)' : 'transparent',
                    color: examViewMode === 'preview' ? 'var(--bg-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Formázott Előnézet
                </button>
                <button
                  type="button"
                  onClick={() => setExamViewMode('markdown')}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    borderRadius: '4px',
                    border: `1px solid ${examViewMode === 'markdown' ? 'var(--text-primary)' : 'var(--panel-border)'}`,
                    background: examViewMode === 'markdown' ? 'var(--text-primary)' : 'transparent',
                    color: examViewMode === 'markdown' ? 'var(--bg-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Markdown Forrás
                </button>
              </div>

              {examResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handleCopyExam}
                    className="btn-outline"
                    style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Szöveg másolása"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Másolás
                  </button>
                  <button
                    onClick={handlePrintExam}
                    className="btn-outline"
                    style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Nyomtatás vagy mentés PDF-be"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Nyomtatás / PDF
                  </button>
                  <button
                    onClick={handleSaveExamToRadar}
                    disabled={savedToRadar}
                    className="btn-primary"
                    style={{
                      padding: '6px 14px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    {savedToRadar ? '✓ Mentve a Radarba' : 'Mentés a Dolgozat Radarba'}
                  </button>
                </div>
              )}
            </div>

            {/* Eredmény tartalom */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {!examResult && !isGeneratingExam ? (
                <div style={{
                  height: '100%',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: '40px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '1px solid var(--panel-border)',
                    background: 'var(--bg-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    color: 'var(--text-secondary)'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    Még nincs generált dolgozat
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', maxWidth: '380px', lineHeight: '1.5' }}>
                    Állítsd be a kívánt témakört, évfolyamot és instrukciókat a bal oldalon, majd kattints a <strong>Dolgozat & Javítókulcs Generálása</strong> gombra.
                  </p>
                </div>
              ) : isGeneratingExam ? (
                <div style={{
                  height: '100%',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '40px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid var(--panel-border)',
                    borderTopColor: 'var(--text-primary)',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                  }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    Katedra AI Dolgozattervezés...
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {examStepLabel || 'A feladatsor és a javítókulcs összeállítása...'}
                  </p>
                </div>
              ) : examViewMode === 'markdown' ? (
                <textarea
                  value={examMarkdown}
                  onChange={(e) => setExamMarkdown(e.target.value)}
                  className="input-field"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '500px',
                    padding: '16px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {savedToRadar && (
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Dolgozat hozzáadva a Dolgozat Radarhoz.</span>
                      </div>
                      {setActiveTab && (
                        <button
                          onClick={() => setActiveTab('dolgozatok')}
                          className="btn-outline"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px' }}
                        >
                          Ugrás a Radarhoz &rarr;
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{
                    padding: '16px',
                    background: 'var(--bg-color)',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border)'
                  }}>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      lineHeight: '1.7',
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--text-primary)'
                    }}>
                      {examMarkdown}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FÜL: SZAKTÁRGYI ASSZISZTENS & SABLONOK (MATEK • FIZIKA • OFŐ)         */}
      {/* ========================================================================= */}
      {currentTab === 'subject-assistant' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Szerepkör & Sablon választó */}
          <div className="glass-panel card" style={{ borderRadius: '4px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Tanári Szerepkör & Feladatkör
              </h3>
            </div>
            
            {/* Szerepkör gombok */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'math', label: 'Matematika', icon: '📐' },
                { id: 'physics', label: 'Fizika', icon: '⚡' },
                { id: 'formTeacher', label: 'Osztályfőnök', icon: '🎓' }
              ].map(role => {
                const isActive = assistantRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setAssistantRole(role.id)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: isActive ? '600' : '500',
                      border: `1px solid ${isActive ? 'var(--text-primary)' : 'var(--panel-border)'}`,
                      background: isActive ? 'var(--text-primary)' : 'var(--bg-color)',
                      color: isActive ? 'var(--bg-color)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{role.icon}</span>
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="input-label" style={{ marginBottom: '8px' }}>
                Gyors pedagógiai sablonok
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {promptTemplates[assistantRole].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAssistantPrompt(tpl.prompt);
                      handleRunAssistant(tpl.prompt);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '4px',
                      background: 'var(--bg-color)',
                      border: '1px solid var(--panel-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--panel-border)';
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '3px' }}>
                      {tpl.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tpl.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label" style={{ marginBottom: '6px' }}>
                Egyéni kérdés vagy feladat
              </label>
              <textarea
                value={assistantPrompt}
                onChange={(e) => setAssistantPrompt(e.target.value)}
                placeholder="Írd be a kérdésed, feladatod vagy instrukciódat..."
                rows={4}
                className="input-field"
                style={{
                  padding: '10px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              onClick={() => handleRunAssistant()}
              disabled={isGeneratingAssistant}
              className="btn-primary"
              style={{
                padding: '10px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isGeneratingAssistant ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Generálás...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Futtatás Katedra AI-val</span>
                </>
              )}
            </button>
          </div>

          {/* Asszisztens válasz megjelenítő */}
          <div className="glass-panel card" style={{ borderRadius: '4px', padding: '20px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                AI Asszisztens Válasza
              </h3>
              {assistantResponse && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(assistantResponse);
                    if (addNotification) addNotification('Válasz kimásolva a vágólapra!', 'success');
                  }}
                  className="btn-outline"
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Másolás
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {!assistantResponse && !isGeneratingAssistant ? (
                <div style={{ height: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                  <div>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--bg-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px auto',
                      color: 'var(--text-secondary)'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Válassz egy pedagógiai sablont vagy írd be egyéni kérésed a bal oldalon.
                    </p>
                  </div>
                </div>
              ) : isGeneratingAssistant ? (
                <div style={{ height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid var(--panel-border)',
                    borderTopColor: 'var(--text-primary)',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                  }} />
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Katedra AI válasz generálása folyamatban...
                  </p>
                </div>
              ) : (
                <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.7', margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {assistantResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FÜL: GEMINI API BEÁLLÍTÁSOK                                            */}
      {/* ========================================================================= */}
      {currentTab === 'api-settings' && (
        <div style={{ maxWidth: '720px' }}>
          <div className="glass-panel card" style={{ borderRadius: '4px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Google Gemini API Konfiguráció
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                A Katedra AI motorja kliensoldali <strong>BYOK (Bring Your Own Key)</strong> modellt használ. Az API kulcsodat közvetlenül a böngésződ helyi tárolója (localStorage) őrzi meg, külső szerverre nem kerül továbbításra.
              </p>
            </div>

            <div>
              <label className="input-label" style={{ marginBottom: '8px' }}>
                Google Gemini API Kulcs (Google AI Studio)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="input-field"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '4px' }}
                >
                  Mentés
                </button>
                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isTestingKey || !apiKey.trim()}
                  className="btn-outline"
                  style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '4px' }}
                >
                  {isTestingKey ? 'Tesztelés...' : 'Tesztelés'}
                </button>
              </div>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Ingyenes API kulcs igénylése: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>aistudio.google.com</a>
              </span>
            </div>

            {keyStatusMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '4px',
                fontSize: '12px',
                background: 'var(--bg-color)',
                border: `1px solid ${keyStatusMsg.type === 'success' ? 'var(--text-primary)' : 'var(--danger)'}`,
                color: keyStatusMsg.type === 'success' ? 'var(--text-primary)' : 'var(--danger)'
              }}>
                {keyStatusMsg.type === 'success' ? '✓ ' : '✕ '}
                {keyStatusMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
