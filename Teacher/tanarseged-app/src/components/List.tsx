import { useState, useEffect } from 'react';
import { Trash2, CloudUpload, Loader2 } from 'lucide-react';
import type { ScanResult } from './Scanner';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { saveUserData, subscribeToUserData, getUserData } from '../lib/db';

const List = () => {
  const [items, setItems] = useState<ScanResult[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToUserData('scanned_tests', (data) => {
      setItems(data || []);
    });
    return unsub;
  }, []);

  const handleDelete = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    saveUserData('scanned_tests', newItems);
  };

  const handleSync = async () => {
    if (items.length === 0) {
      alert("Nincs mit szinkronizálni!");
      return;
    }
    
    setIsSyncing(true);
    try {
      if (!auth.currentUser) throw new Error("Be kell jelentkezned a szinkronizáláshoz!");
      const uid = auth.currentUser.uid;

      // 1. Mentés a hosszútávú Archívumba (Eredmények fülhöz) Firestore-ba
      const archive = (await getUserData('archived_sessions')) || [];
      const topic = items[0]?.testTopic || 'Névtelen Dolgozat';
      const type = items[0]?.testType || 'Írásbeli';
      const groupId = items[0]?.groupId || '';
      
      const newSession = {
         id: Date.now().toString(),
         date: new Date().toISOString(),
         topic, 
         type, 
         groupId,
         scans: items
      };
      archive.push(newSession);
      await saveUserData('archived_sessions', archive);

      // 2. Szinkronizáció a Firebase Firestore-ba a Kréta Bot számára (Multi-user path)
      const latestRef = doc(db, 'users', uid, 'sync', 'latest');
      await setDoc(latestRef, {
        timestamp: Date.now(),
        data: items
      });
      console.log('Sikeres Firestore mentés és Lokális Archiválás');
      alert("✅ Adatok a Felhőben ÉS lementve az Archívumba!\nMost már a gépeden kattinthatsz az 'Automatikus Beírás' gombra.");
    } catch (error: any) {
      console.error('Hiba a Firestore mentésnél:', error);
      alert("❌ Firebase hiba történt: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Biztosan törlöd az összes beolvasott dolgozatot? Ez a telefonodról le fogja törölni, de a Chrome bővítmény a következő felhő mentésig még tarthatja magánál a másolatot.')) {
      setItems([]);
      saveUserData('scanned_tests', []);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Beolvasott Dolgozatok</h2>
        {items.length > 0 && (
          <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '13px' }}>
            Összes törlése
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>
            Nincsenek beolvasott dolgozatok.
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>{item.name}</strong>
                {item.testTopic && <span style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>{item.testTopic}</span>}
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>{item.testType || 'Írásbeli'} ({item.testWeight || '100%'})</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Pont: {item.score}/{item.maxScore}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: item.grade === 0 ? 'var(--text-secondary)' : 'var(--accent-green)' }}>{item.grade === 0 ? 'N/A' : item.grade}</span>
                <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 'auto', padding: '16px 0 80px 0', backgroundColor: 'var(--bg-color)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
           className="btn-primary" 
           onClick={handleSync} 
           disabled={items.length === 0 || isSyncing}
           style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {isSyncing ? <Loader2 className="spinning" size={20} /> : <CloudUpload size={20} />}
          {isSyncing ? 'Feltöltés a felhőbe...' : 'Feltöltés a felhőbe (Kréta Sync)'}
        </button>
        <style>{`.spinning { animation: spin 1s linear infinite; }`}</style>
      </div>
    </div>
  );
};

export default List;
