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
      if (err.code !== 'auth/popup-closed-by-user') {
          setError(err.message || 'Hiba történt a bejelentkezés során.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center bg-slate-50 text-slate-900 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 max-w-[400px] w-full">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogIn className="w-10 h-10 text-blue-600" />
        </div>
        
        <h1 className="text-slate-800 mb-3 text-2xl font-bold tracking-tight">TanárSegéd Assistant</h1>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          Jelentkezz be a fiókodba, hogy az osztályaid és eredményeid biztonságban legyenek a felhőben (offline móddal)!
        </p>
        
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm font-medium border border-red-100">
                {error}
            </div>
        )}
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          className={`flex items-center justify-center gap-3 bg-white text-slate-700 border border-slate-200 p-3.5 rounded-xl text-base font-bold w-full transition-all hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] ${loading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          {loading ? 'Bejelentkezés...' : 'Bejelentkezés Google-lel'}
        </button>
      </div>
    </div>
  );
};

export default Login;
