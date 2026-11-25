import React from 'react';

export default function LoginView({
  username,
  setUsername,
  password,
  setPassword,
  loginError,
  isLoggingIn,
  handleLogin,
  onOfflineLogin,
  isDarkTheme,
  setIsDarkTheme
}) {
  return (
    <div className="login-container">
      <div className="login-box animate-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="60" height="60" viewBox="0 0 128 128" fill="none" style={{ borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <rect width="128" height="128" rx="28" fill="#0A0A0C" />
            <rect x="1" y="1" width="126" height="126" rx="27" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" />
            <circle cx="90" cy="36" r="14" fill="#E11D48" opacity="0.3" filter="blur(6px)" />
            <path d="M80 44 C80 34.5 71.5 28 58 28 C43 28 34 37 34 48 C34 61 46 65 64 69 C79 72.5 86 78 86 89 C86 101.5 73.5 108 56 108 C40 108 32 99.5 32 89" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="90" cy="36" r="6.5" fill="#E11D48" />
          </svg>
        </div>
        <h2 className="login-title" style={{ letterSpacing: '1px', marginBottom: '4px' }}>Schola</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>Digitális Tanári Műszerfal</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Felhasználónév</label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Oktatási azonosító"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Jelszó</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Kréta jelszó"
            />
          </div>

          {loginError && <div className="error-message">{loginError}</div>}

          <button type="submit" className="btn-primary" disabled={isLoggingIn}>
            {isLoggingIn ? 'Hitelesítés a roboton keresztül...' : 'Bejelentkezés'}
          </button>

          <button
            type="button"
            className="btn-outline"
            style={{ width: '100%', marginTop: '10px', fontSize: '13px' }}
            onClick={onOfflineLogin}
          >
            Belépés mentett adatokkal (Azonnali / Offline mód)
          </button>
        </form>

        {/* Kis téma váltó a login képernyőre is */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            className="btn-outline"
            style={{ border: 'none', fontSize: '10px' }}
            onClick={() => setIsDarkTheme(!isDarkTheme)}
          >
            {isDarkTheme ? 'VILÁGOS TÉMA VÁLTÁSA' : 'SÖTÉT TÉMA VÁLTÁSA'}
          </button>
        </div>
      </div>
    </div>
  );
}
