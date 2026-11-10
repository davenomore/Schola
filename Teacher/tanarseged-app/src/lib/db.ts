import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField, FieldPath } from 'firebase/firestore';

// Nested key törlése egy Firestore map mezőből (pl. teacher_syllabi-ból egy adott csoport tanmenetének végleges törléséhez)
export const deleteUserNestedKey = async (parentKey: string, nestedKey: string) => {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const docRef = doc(db, 'users', uid);
  try {
    await updateDoc(docRef, new FieldPath(parentKey, nestedKey), deleteField());
  } catch (err) {
    console.error(`Hiba a(z) ${parentKey}.${nestedKey} törlésekor Firestore-ból:`, err);
  }
};


// Helyi mentés funkció - a bejelentkezett felhasználó saját dokumentumába ment
export const saveUserData = async (key: string, data: any) => {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const docRef = doc(db, 'users', uid);
  try {
    // Az updateDoc teljesen felülírja a megadott mezőt (key), így a törölt elemek is eltűnnek belőle
    await updateDoc(docRef, { [key]: data });
  } catch (err: any) {
    // Ha a dokumentum még nem létezik, akkor setDoc-ot használunk merge-dzsel
    if (err.code === 'not-found' || err.message?.includes('not-found') || err.message?.includes('No document to update')) {
      try {
        await setDoc(docRef, { [key]: data }, { merge: true });
      } catch (innerErr) {
        console.error(`Hiba a(z) ${key} mentésekor (setDoc) Firestore-ba:`, innerErr);
      }
    } else {
      console.error(`Hiba a(z) ${key} mentésekor (updateDoc) Firestore-ba:`, err);
    }
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
