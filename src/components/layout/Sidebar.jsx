import React from 'react';

export default function Sidebar({
  isSidebarCollapsed,
  toggleSidebar,
  activeTab,
  setActiveTab,
  isDarkTheme,
  setIsDarkTheme,
  handleLogout,
  setExamsRefreshTrigger,
  unreadNotificationCount = 0,
  onOpenNotificationDrawer
}) {
  return (
    <aside className={`sidebar glass-panel ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-left">
          <svg width="24" height="24" viewBox="0 0 128 128" fill="none" style={{ flexShrink: 0, borderRadius: '6px' }}>
            <rect width="128" height="128" rx="28" fill="#0A0A0C" />
            <rect x="1" y="1" width="126" height="126" rx="27" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="2" />
            <path d="M80 44 C80 34.5 71.5 28 58 28 C43 28 34 37 34 48 C34 61 46 65 64 69 C79 72.5 86 78 86 89 C86 101.5 73.5 108 56 108 C40 108 32 99.5 32 89" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="90" cy="36" r="6.5" fill="#E11D48" />
          </svg>
          <span className="brand-text" style={{ fontWeight: '700', letterSpacing: '2.5px' }}>SCHOLA</span>
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar} title={isSidebarCollapsed ? "Oldalsáv kinyitása" : "Oldalsáv összecsukása"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {isSidebarCollapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      <nav className="nav-links">
        <div className={`nav-item ${activeTab === 'vezérlőpult' ? 'active' : ''}`} onClick={() => setActiveTab('vezérlőpult')} title="Vezérlőpult">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1.5" /><rect width="7" height="5" x="14" y="3" rx="1.5" /><rect width="7" height="9" x="14" y="12" rx="1.5" /><rect width="7" height="5" x="3" y="16" rx="1.5" /></svg>
          <span className="nav-text">Vezérlőpult</span>
        </div>
        <div className={`nav-item ${activeTab === 'üzenetek' ? 'active' : ''}`} onClick={() => setActiveTab('üzenetek')} title="Üzenetek">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
          <span className="nav-text">Üzenetek</span>
        </div>
        <div
          className="nav-item"
          onClick={onOpenNotificationDrawer}
          title={unreadNotificationCount > 0 ? `Intelligens Értesítések (${unreadNotificationCount} új)` : "Intelligens Értesítések (SNE)"}
          style={{ position: 'relative', cursor: 'pointer' }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-3px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#e11d48',
                  boxShadow: '0 0 6px #e11d48'
                }}
              />
            )}
          </div>
          {!isSidebarCollapsed && (
            <span className="nav-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Értesítések</span>
              {unreadNotificationCount > 0 && (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: '#e11d48',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}
                >
                  {unreadNotificationCount}
                </span>
              )}
            </span>
          )}
        </div>
        <div className={`nav-item ${activeTab === 'órarend' ? 'active' : ''}`} onClick={() => setActiveTab('órarend')} title="Órarend">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>
          <span className="nav-text">Órarend</span>
        </div>
        <div className={`nav-item ${activeTab === 'csoportok' || activeTab === 'napló' ? 'active' : ''}`} onClick={() => setActiveTab('csoportok')} title="Napló">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
          <span className="nav-text">Napló</span>
        </div>
        <div
          className={`nav-item ${activeTab === 'dolgozatok' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('dolgozatok');
            if (setExamsRefreshTrigger) {
              setExamsRefreshTrigger(prev => prev + 1);
            }
          }}
          title="Dolgozat Radar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="m9 15 2 2 4-4" /></svg>
          <span className="nav-text">Dolgozat Radar</span>
        </div>
        <div className={`nav-item ${activeTab === 'katedra-ai' ? 'active' : ''}`} onClick={() => setActiveTab('katedra-ai')} title="Katedra AI">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /></svg>
          <span className="nav-text">Katedra AI</span>
        </div>
        <div className={`nav-item ${activeTab === 'osztalyfonok' ? 'active' : ''}`} onClick={() => setActiveTab('osztalyfonok')} title="Osztályfőnök">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
          <span className="nav-text">Osztályfőnök</span>
        </div>
        <div className={`nav-item ${activeTab === 'eszközök' ? 'active' : ''}`} onClick={() => setActiveTab('eszközök')} title="Tanári Eszközök">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
          <span className="nav-text">Tanári Eszközök</span>
        </div>
        <div className={`nav-item ${activeTab === 'quiz' || activeTab === 'kviz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')} title="Kvíz Aréna">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          <span className="nav-text">Kvíz Aréna</span>
        </div>
        <div className={`nav-item ${activeTab === 'classroomscreen' ? 'active' : ''}`} onClick={() => setActiveTab('classroomscreen')} title="Classroom Screen">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
          <span className="nav-text">Classroom Screen</span>
        </div>
        <div className={`nav-item ${activeTab === 'beállítások' ? 'active' : ''}`} onClick={() => setActiveTab('beállítások')} title="Beállítások">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          <span className="nav-text">Beállítások</span>
        </div>
      </nav>

      {/* User Profile in Sidebar */}
      <div className="user-profile" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="avatar" title="Kattints a kilépéshez" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={handleLogout}>VD</div>
        <div className="nav-text" style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: '500', fontSize: '13px', letterSpacing: '0.5px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Varga Dávid</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Osztályfőnök - 11.A</div>
        </div>
        <button
          className="btn-icon nav-text"
          title="Kilépés"
          style={{ padding: '6px', color: 'var(--danger)' }}
          onClick={handleLogout}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>

      {/* Téma váltó gomb a sidebar alján */}
      <div style={{ marginTop: '16px' }}>
        <button
          className="btn-outline"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={() => setIsDarkTheme(!isDarkTheme)}
        >
          {isDarkTheme ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              <span className="nav-text">Világos téma</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              <span className="nav-text">Sötét téma</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
