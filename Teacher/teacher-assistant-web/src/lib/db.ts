import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Helyi mentés funkció - a bejelentkezett felhasználó saját dokumentumába ment
export const saveUserData = async (key: string, data: any) => {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const docRef = doc(db, 'users', uid);
  try {
    // Merge: true biztosítja, hogy a dokumentum többi mezője ne törlődjön, ha csak egyet (pl. teacher_groups) frissítünk
    await setDoc(docRef, { [key]: data }, { merge: true });
  } catch (err) {
    console.error(`Hiba a(z) ${key} mentésekor Firestore-ba:`, err);
  }
};

// Egyszeri beolvasás (pl. háttérfolyamatoknak)
export const getUserData = async (key: string) => {
  if (!auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  const docRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data()[key] || null;
    }
  } catch (err) {
    console.error(`Hiba a(z) ${key} beolvasásakor Firestore-ból:`, err);
  }
  return null;
};

export const migrateLocalDataToCloud = async (uid: string): Promise<boolean> => {
  if (localStorage.getItem('migration_to_cloud_done')) return false;
  
  const hasLocalData = localStorage.getItem('teacher_groups') || localStorage.getItem('scanned_tests');
  if (!hasLocalData) {
     localStorage.setItem('migration_to_cloud_done', 'true');
     return false;
  }

  try {
    const dataToSync: any = {};
    const keys = ['teacher_groups', 'scanned_tests', 'archived_sessions', 'teacher_timetable', 'teacher_timetable_v2', 'teacher_todos'];
    
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          dataToSync[key] = JSON.parse(val);
        } catch(e) {}
      }
    }
    
    if (Object.keys(dataToSync).length > 0) {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, dataToSync, { merge: true });
      localStorage.setItem('migration_to_cloud_done', 'true');
      return true;
    } else {
      localStorage.setItem('migration_to_cloud_done', 'true');
      return false;
    }
  } catch (err) {
    console.error("Migration hiba:", err);
    return false;
  }
};

export const getOrGenerateSyncCode = async (): Promise<string | null> => {
  if (!auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  const userDocRef = doc(db, 'users', uid);
  
  try {
    const userDoc = await getDoc(userDocRef);
    let code = userDoc.exists() ? userDoc.data().syncCode : null;

    if (!code) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous characters
      code = '';
      for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      
      await setDoc(userDocRef, { syncCode: code }, { merge: true });
      const syncCodeRef = doc(db, 'sync_codes', code);
      await setDoc(syncCodeRef, { uid: uid });
    }
    return code;
  } catch (err) {
    console.error('Hiba a szinkronizációs kód generálásakor:', err);
    return null;
  }
};

// Valós idejű figyelő React komponensekhez
// Használat: useEffect(() => subscribeToUserData('teacher_groups', setGroups), []);
export const subscribeToUserData = (key: string, callback: (data: any) => void) => {
  if (!auth.currentUser) return () => {};
  const uid = auth.currentUser.uid;
  const docRef = doc(db, 'users', uid);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()[key];
      callback(data !== undefined ? data : null);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error(`Hiba a(z) ${key} feliratkozásakor:`, err);
  });
};
