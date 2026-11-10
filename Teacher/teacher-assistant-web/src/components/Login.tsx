import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed", err);
      // Ignore user-closed-popup errors, only show real errors
      if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Hiba történt a bejelentkezés során.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '20px', textAlign: 'center', background: 'var(--bg-main)'
    }}>
      <div style={{
        background: 'var(--bg-surface)', padding: '40px 30px', borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)',
        maxWidth: '400px', width: '100%'
      }}>
        <div style={{ background: 'rgba(88, 166, 255, 0.1)', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
          <LogIn size={40} color="var(--accent-blue)" />
        </div>
        
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '24px' }}>Teacher Assistant</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px', lineHeight: '1.5' }}>
          Jelentkezz be a fiókodba, hogy az osztályaid és eredményeid biztonságban legyenek a felhőben (offline móddal)!
        </p>
        
        {error && (
            <div style={{ background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                {error}
            </div>
        )}
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            background: 'white', color: '#161b22', border: 'none', padding: '14px 24px',
            borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer',
            width: '100%', transition: 'transform 0.2s, opacity 0.2s',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 4px 15px rgba(255,255,255,0.1)'
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '24px', height: '24px'}} />
          {loading ? 'Bejelentkezés...' : 'Bejelentkezés Google-lel'}
        </button>
      </div>
    </div>
  );
};

export default Login;
