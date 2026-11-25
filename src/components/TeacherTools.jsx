import React, { useState, useEffect } from 'react';
import TeacherTimer from './tools/TeacherTimer';
import StudentRandomizer from './tools/StudentRandomizer';
import TeamGenerator from './tools/TeamGenerator';
import GradeCalculator from './tools/GradeCalculator';
import InteractiveWallTool from './tools/InteractiveWallTool';
import MentimeterTool from './tools/MentimeterTool';
import QuizArenaTool from './tools/QuizArenaTool';

const TeacherTools = ({ addNotification }) => {
  const [activeTool, setActiveTool] = useState('randomizer');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Eszközválasztó / Almenü fül */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px', flexShrink: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--panel-bg)',
            border: '1px solid var(--panel-border)',
            borderRadius: '8px',
            padding: '3px',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <button
            style={{
              cursor: 'pointer',
              border: 'none',
              background: activeTool === 'randomizer' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'randomizer' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTool === 'randomizer' ? '600' : '500',
              padding: '6px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTool('randomizer')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            Szerencsekerék
          </button>
          <button
            style={{
              cursor: 'pointer',
              border: 'none',
              background: activeTool === 'timer' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'timer' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTool === 'timer' ? '600' : '500',
              padding: '6px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTool('timer')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Időzítő
          </button>
          <button
            style={{
              cursor: 'pointer',
              border: 'none',
              background: activeTool === 'teams' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'teams' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTool === 'teams' ? '600' : '500',
              padding: '6px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTool('teams')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Csapatgenerátor
          </button>
          <button
            style={{
              cursor: 'pointer',
              border: 'none',
              background: activeTool === 'grades' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'grades' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTool === 'grades' ? '600' : '500',
              padding: '6px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTool('grades')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Ponthatárok
          </button>
          <button
            style={{
              cursor: 'pointer',
              border: 'none',
              background: activeTool === 'wall' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'wall' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTool === 'wall' ? '600' : '500',
              padding: '6px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTool('wall')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 7h8M8 12h8M8 17h5" />
            </svg>
            Faliújság (Padlet)
          </button>
          <button
            style={{
              cursor: 'pointer',
              border: 'none',
              background: activeTool === 'poll' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'poll' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTool === 'poll' ? '600' : '500',
              padding: '6px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTool('poll')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Szavazás (Mentimeter)
          </button>
          <button
            style={{
              cursor: 'pointer',
              border: 'none',
              background: activeTool === 'quiz' ? 'var(--text-primary)' : 'transparent',
              color: activeTool === 'quiz' ? 'var(--bg-color)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTool === 'quiz' ? '600' : '500',
              padding: '6px 14px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setActiveTool('quiz')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Kvíz Aréna
          </button>
        </div>
      </div>

      <div className="card glass-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: (activeTool === 'wall' || activeTool === 'poll' || activeTool === 'quiz') ? '0' : '16px' }}>
        {activeTool === 'timer' && <TeacherTimer isDark={isDark} />}
        {activeTool === 'randomizer' && <StudentRandomizer isDark={isDark} />}
        {activeTool === 'teams' && <TeamGenerator />}
        {activeTool === 'grades' && <GradeCalculator />}
        {activeTool === 'wall' && <InteractiveWallTool />}
        {activeTool === 'poll' && <MentimeterTool addNotification={addNotification} />}
        {activeTool === 'quiz' && <QuizArenaTool addNotification={addNotification} />}
      </div>
    </div>
  );
};

export default TeacherTools;
