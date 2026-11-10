import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getOrGenerateSyncCode } from '../lib/db';
import { LogOut, Copy, Check, ChevronRight } from 'lucide-react';

const Settings = () => {
  const user = auth.currentUser;
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getOrGenerateSyncCode().then(code => setSyncCode(code));
  }, []);

  const copyCode = () => {
    if (syncCode) {
      navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>

      {/* Profil kártya */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user?.photoURL && (
          <img src={user.photoURL} alt="Profil" style={{ width: '56px', height: '56px', borderRadius: '28px', border: '2px solid var(--accent-blue)' }} />
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{user?.displayName || 'Felhasználó'}</h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user?.email}</span>
        </div>
      </div>

      {/* Szekció: Bővítmény */}
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px' }}>
        Chrome Bővítmény
      </div>
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Párosító Kód</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Írd be ezt a Chrome kiegészítőbe</div>
        </div>
        <button onClick={copyCode} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: copied ? 'var(--accent-green)' : 'var(--accent-purple)',
          color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px',
          fontSize: '18px', fontWeight: 'bold', letterSpacing: '4px', cursor: 'pointer',
          transition: 'all 0.2s', minWidth: '120px', justifyContent: 'center'
        }}>
          {syncCode || '....'}
          {copied ? <Check size={18} /> : <Copy size={16} />}
        </button>
      </div>

      {/* Szekció: Általános (jövőbeli beállítások helye) */}
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px' }}>
        Általános
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', opacity: 0.5, cursor: 'not-allowed' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Értesítések</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Emlékeztető beállítások</div>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </div>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5, cursor: 'not-allowed' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Megjelenés</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Téma, nyelv</div>
          </div>
          <ChevronRight size={18} color="var(--text-secondary)" />
        </div>
      </div>

      {/* Szekció: Fiók */}
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px' }}>
        Fiók
      </div>
      <button onClick={() => signOut(auth)} style={{
        width: '100%', padding: '14px', borderRadius: '12px',
        border: '1px solid #f85149', background: 'rgba(248, 81, 73, 0.08)',
        color: '#f85149', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'all 0.2s'
      }}>
        <LogOut size={18} /> Kijelentkezés
      </button>

      {/* Verzió */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', marginTop: '16px' }}>
        Teacher Assistant v2.0 • Cloud Sync
      </div>
    </div>
  );
};

export default Settings;
