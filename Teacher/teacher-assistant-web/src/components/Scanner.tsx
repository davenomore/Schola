import { useRef, useEffect, useState } from 'react';
import { Camera, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import type { Group } from './Groups';
import { saveUserData, subscribeToUserData } from '../lib/db';

export interface ScanResult {
  id: string;
  groupId: string;
  name: string;
  maxScore: number;
  score: number;
  grade: number;
  testTopic?: string;
  testType?: string;
  testWeight?: string;
}

// User Provided Google API Key
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '';

const Scanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamData, setStreamData] = useState<MediaStream | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState('');
  
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const [testTopic, setTestTopic] = useState('');
  const [isRetake, setIsRetake] = useState(false);
  const [testType, setTestType] = useState('Dolgozat');
  const [testWeight, setTestWeight] = useState('100%');
  const [testMaxScore, setTestMaxScore] = useState<number>(50);

  useEffect(() => {
    startCamera();
    
    const unsubScanned = subscribeToUserData('scanned_tests', (data) => {
      setScannedCount((data || []).length);
    });

    const unsubGroups = subscribeToUserData('teacher_groups', (data) => {
      const g = data || [];
      setGroups(g);
      // Állítsuk be az első osztályt aktívnak, ha még nincs kiválasztva
      setSelectedGroupId(current => current ? current : (g.length > 0 ? g[0].id : ''));
    });

    return () => {
      stopCamera();
      unsubScanned();
      unsubGroups();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStreamData(stream);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (streamData) streamData.getTracks().forEach(track => track.stop());
  };

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    setScanProgress(0); 
    setRawOcrText('');

    // Capture frame
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsScanning(false);
      return;
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    // Fake progress mapping just to show user something is happening during network call
    const progressInterval = setInterval(() => {
        setScanProgress(p => p < 90 ? p + Math.floor(Math.random() * 15) : 95);
    }, 400);

    try {
      const activeGroup = groups.find(g => g.id === selectedGroupId);
      const studentNamesContext = activeGroup && activeGroup.students.length > 0 
        ? `Here is the list of expected student names in this class: [${activeGroup.students.join(', ')}]. Please match the handwritten name to one of these precisely if possible.`
        : '';

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              contents: [{
                  parts: [
                      { text: `You are an expert AI grading assistant. Extract the student's name, max score, achieved score, and final grade from this handwritten or printed test header image. ${studentNamesContext} \nReturn ONLY a valid JSON object without any markdown blocks or backticks. Format exactly like this: {"name": "Extracted Name", "maxScore": 50, "score": 45, "grade": 5}` },
                      { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                  ]
              }]
          })
      });

      const jsonResponse = await response.json();
      clearInterval(progressInterval);
      setScanProgress(100);
      
      if (!response.ok) {
         throw new Error(`API hiba a Google-től: ${jsonResponse.error?.message || response.statusText}`);
      }
      
      if (!jsonResponse.candidates || jsonResponse.candidates.length === 0) {
         throw new Error(`A Google AI nem küldött vissza értelmezhető adatot. Nyers válasz: ${JSON.stringify(jsonResponse)}`);
      }

      // Extract the text from Gemini response
      const candidate = jsonResponse.candidates?.[0];
      if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
         throw new Error(`A Google AI nem küldött vissza értelmezhető adatot. Nyers válasz: ${JSON.stringify(jsonResponse)}`);
      }

      let aiText = candidate.content.parts[0].text;
      if (!aiText) {
         throw new Error(`A Gemini üres szöveget adott vissza. Nyers válasz: ${JSON.stringify(jsonResponse)}`);
      }
      setRawOcrText("Gemini JSON Válasz:\n" + aiText);

      // Clean up markdown code blocks if the AI still returned them
      aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      let parsedData;
      try {
        parsedData = JSON.parse(aiText);
      } catch (parseErr: any) {
        throw new Error(`Az AI válasza nem érvényes JSON. Nyers válasz: ${aiText}`);
      }

      let finalName = parsedData.name || "Ismeretlen diák";
      
      // Strict fuzzy finding to ensure the exact roster name is returned
      if (activeGroup && activeGroup.students.length > 0) {
        const query = finalName.toLowerCase();
        let bestMatch = activeGroup.students[0]; // fallback default
        let bestScore = -1;

        for (const student of activeGroup.students) {
          const studentLower = student.toLowerCase();
          let score = 0;
          
          if (studentLower === query) {
            bestMatch = student;
            bestScore = Infinity;
            break;
          }
          
          // Token matches (valuable!)
          const queryParts = query.split(/\s+/);
          const studentParts = studentLower.split(/\s+/);
          
          queryParts.forEach((qPart: string) => {
             if (qPart.length < 2) return;
             if (studentParts.some(sPart => sPart.includes(qPart) || qPart.includes(sPart))) {
               score += 15;
             }
          });
          
          // Basic character overlap to break ties
          const sharedChars = [...new Set(studentLower)].filter(c => query.includes(c)).length;
          score += sharedChars;

          if (score > bestScore) {
             bestScore = score;
             bestMatch = student;
          }
        }
        
        finalName = bestMatch;
      }

      setScanResult({
        id: Date.now().toString(),
        groupId: selectedGroupId,
        name: finalName,
        maxScore: Number(parsedData.maxScore) || testMaxScore,
        score: Number(parsedData.score) || 0,
        grade: Number(parsedData.grade) || 1,
        testTopic: isRetake ? `${testTopic.trim()} - pót/javító` : testTopic.trim(),
        testType: testType,
        testWeight: testWeight
      });
      
    } catch(err: any) {
      console.error(err);
      clearInterval(progressInterval);
      alert(`Hiba történt a szkennelés során:\n\n${err.message}\n\nNézd meg a számítógép konzolját is!`);
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanProgress(0), 1000);
    }
  };

  const handleConfirm = async () => {
    if (scanResult) {
      const { getUserData } = await import('../lib/db');
      const existing = (await getUserData('scanned_tests')) || [];
      existing.push(scanResult);
      await saveUserData('scanned_tests', existing);
      setScanResult(null);
      setRawOcrText('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* Hidden Canvas for capturing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Banner indicating scan progress */}
      <div style={{ position: 'absolute', top: '10px', left: '0', right: '0', zIndex: 5, display: 'flex', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '6px 16px', fontSize: '14px', borderRadius: 'var(--radius-full)', fontWeight: '600' }}>
          {scannedCount} dolgozat beolvasva
        </div>
      </div>

      {/* Camera Viewport */}
      <div style={{ flex: 1, backgroundColor: '#05070a', position: 'relative', overflow: 'hidden', margin: '-20px', marginBottom: '0' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
        
        {/* Scanner overlay */}
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '85%', height: '220px', border: '2px solid var(--accent-blue)', borderRadius: 'var(--radius-sm)',
          boxShadow: '0 0 30px var(--accent-blue-glow), inset 0 0 20px var(--accent-blue-glow)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(47, 129, 247, 0.05)'
        }}>
          {isScanning && (
            <div style={{ color: 'var(--accent-blue)', fontWeight: 'bold', textShadow: '0 0 8px #000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Sparkles size={32} className="spinning-sparkle" style={{ marginBottom: '8px' }} />
              Gemini AI Elemzés... {scanProgress}%
            </div>
          )}
          {isScanning && (
            <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '3px', backgroundColor: '#fff', boxShadow: '0 0 15px #fff', animation: 'scan-anim 1s infinite linear' }} />
          )}
        </div>
      </div>

      {/* Result Card or Scan Button Overlay */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10 }}>
        
        {scanResult ? (
          <div className="glass-panel" style={{ padding: '20px', animation: 'slide-up 0.3s ease', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} /> Eredmény
              </h3>
              <button onClick={() => setScanResult(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Felismert Név:</span>
                <strong style={{ fontSize: '18px', textAlign: 'right', color: scanResult.name.includes("Hiba") ? '#f85149' : 'white' }}>{scanResult.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingTop: '4px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pontszám</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{scanResult.score} / {scanResult.maxScore}</div>
                </div>
                <div style={{ width: '1px', backgroundColor: 'var(--border-glass)' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Jegy</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{scanResult.grade}</div>
                </div>
              </div>
              
              {/* Debug raw text */}
              {rawOcrText && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '10px', color: 'var(--text-secondary)', maxHeight: '60px', overflowY: 'auto' }}>
                  <strong>Nyers JSON válasz (Debug):</strong><br/>{rawOcrText}
                </div>
              )}
            </div>

            <button className="btn-primary" onClick={handleConfirm} style={{ width: '100%', padding: '16px' }}>
              Jóváhagyás <ChevronRight size={20} />
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent-blue)' }}>Nincs még osztályod!</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Kérlek, hozz létre egyet az Osztályok fülön, hogy tudj dolgozatokat szkennelni.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select 
              value={selectedGroupId} 
              onChange={e => setSelectedGroupId(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: !selectedGroupId ? '1px solid #f85149' : '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'white', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', outline: 'none' }}
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} - {g.subject}</option>
              ))}
            </select>
            

            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Dolgozat témája (pl. Tavaszi vizsga)"
                value={testTopic}
                onChange={e => setTestTopic(e.target.value)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: !testTopic.trim() ? '1px solid #f85149' : '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'white', boxSizing: 'border-box', outline: 'none' }}
              />
              <button 
                onClick={() => setIsRetake(!isRetake)}
                title="Pót vagy Javító dolgozat jelölése"
                style={{ 
                   padding: '0 16px', borderRadius: '8px', 
                   background: isRetake ? 'var(--accent-purple)' : 'var(--bg-surface-glass)', 
                   border: isRetake ? 'none' : '1px solid var(--border-glass)', 
                   color: 'white', fontWeight: 'bold', cursor: 'pointer',
                   transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                P/J
              </button>
            </div>
            
            <select 
              value={testType} 
              onChange={e => setTestType(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'white', outline: 'none' }}
            >
              <option value="Dolgozat">Dolgozat</option>
              <option value="Írásbeli témazáró dolgozat">Írásbeli témazáró dolgozat</option>
              <option value="Írásbeli röpdolgozat">Írásbeli röpdolgozat</option>
              <option value="Szóbeli felelet">Szóbeli felelet</option>
              <option value="Órai munka">Órai munka</option>
              <option value="Házi feladat">Házi feladat</option>
              <option value="Beszámoló">Beszámoló</option>
              <option value="Projektmunka">Projektmunka</option>
            </select>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'white' }}>
                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>Súlyzó:</span>
                 <select 
                   value={testWeight} 
                   onChange={e => setTestWeight(e.target.value)}
                   style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '14px', padding: '12px 0', cursor: 'pointer', appearance: 'none' }}
                 >
                   <option value="50%">50%</option>
                   <option value="100%">100%</option>
                   <option value="150%">150%</option>
                   <option value="200%">200%</option>
                 </select>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-surface-glass)', color: 'white' }}>
                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginRight: '8px' }}>Max:</span>
                 <input 
                   type="number" 
                   value={testMaxScore}
                   onChange={e => setTestMaxScore(Number(e.target.value))}
                   style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '15px' }}
                 />
              </div>
            </div>

            <button 
              className="btn-primary"  
              onClick={handleScan}
              disabled={isScanning || !testTopic.trim() || !selectedGroupId}
              style={{ 
                width: '100%', padding: '16px', fontSize: '18px', 
                boxShadow: (testTopic.trim() && selectedGroupId) ? '0 8px 32px rgba(0,0,0,0.4)' : 'none', 
                border: '1px solid rgba(255,255,255,0.1)', 
                background: 'linear-gradient(135deg, #1f6feb 0%, #2f81f7 100%)',
                opacity: (testTopic.trim() && selectedGroupId) ? 1 : 0.4,
                cursor: (testTopic.trim() && selectedGroupId) ? 'pointer' : 'not-allowed'
              }}
            >
               {isScanning ? <Sparkles size={24} className="spinning-sparkle" /> : <Camera size={24} />} 
               {isScanning ? 'Szkennelés (Gemini API)...' : 'Gemini AI Szkennelés'}
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        .spinning-sparkle { animation: pulse-spin 2s ease-in-out infinite; }
        @keyframes pulse-spin { 
           0% { transform: scale(1) rotate(0deg); opacity: 1; } 
           50% { transform: scale(1.2) rotate(180deg); opacity: 0.7; }
           100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        @keyframes scan-anim { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Scanner;
