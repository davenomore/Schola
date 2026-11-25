import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { SOLID_BGS, GRADIENT_BGS, AMBIENT_PATTERNS } from '../../constants/dashboardConstants';
import RichTextWidget from './RichTextWidget';
import QRCodeWidget from './QRCodeWidget';
import WorkModeWidget from './WorkModeWidget';
import NoiseMeterWidget from './NoiseMeterWidget';
import RandomStudentWidget from './RandomStudentWidget';
import GroupMakerWidget from './GroupMakerWidget';
import ClockWidget from './ClockWidget';
import TimerWidget from './TimerWidget';
import CalendarWidget from './CalendarWidget';
import DrawingWidget from './DrawingWidget';
import InteractiveWallWidget from './InteractiveWallWidget';
import MentimeterWidget from './MentimeterWidget';
import PdfViewerWidget from './PdfViewerWidget';
import QuizArenaWidget from './QuizArenaWidget';
import BackgroundSelectorModal from './BackgroundSelectorModal';

export default function ClassroomScreen({
  isFullscreen,
  classroomBg,
  setClassroomBg,
  classroomWidgets,
  setClassroomWidgets,
  addWidget,
  removeWidget,
  updateWidgetBounds,
  isToolbarCollapsed,
  setIsToolbarCollapsed
}) {
  const [showBgModal, setShowBgModal] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('schola_classroom_presets') || '[]');
    } catch {
      return [];
    }
  });
  const [newPresetName, setNewPresetName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [undoWidgets, setUndoWidgets] = useState(null);

  const handleClearScreen = () => {
    if (classroomWidgets.length === 0) return;
    setUndoWidgets(classroomWidgets);
    if (setClassroomWidgets) {
      setClassroomWidgets([]);
    }
    setShowClearConfirm(false);
  };

  const handleUndoClear = () => {
    if (undoWidgets && setClassroomWidgets) {
      setClassroomWidgets(undoWidgets);
      setUndoWidgets(null);
    }
  };

  React.useEffect(() => {
    if (!undoWidgets) return;
    const timer = setTimeout(() => {
      setUndoWidgets(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [undoWidgets]);

  const handleUpdateWidgetBounds = (id, bounds) => {
    if (updateWidgetBounds) {
      updateWidgetBounds(id, bounds);
    } else if (setClassroomWidgets) {
      setClassroomWidgets(prev => prev.map(w => w.id === id ? { ...w, ...bounds } : w));
    }
  };

  // Keyboard shortcut 'B' for instant Blackout focus mode
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'b' || e.key === 'B') {
        setIsBlackout(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const BUILTIN_PRESETS = [
    {
      id: 'exam',
      title: 'Dolgozatírás',
      icon: '📝',
      desc: 'Időzítő, Pontos idő és Csend munkamód',
      widgets: [
        { id: 'p-1', type: 'Időzítő', x: 180, y: 120 },
        { id: 'p-2', type: 'Pontos idő', x: 540, y: 120 },
        { id: 'p-3', type: 'Munkamód', x: 180, y: 360 }
      ]
    },
    {
      id: 'lesson',
      title: 'Órai Magyarázat',
      icon: '👨‍🏫',
      desc: 'Munkafüzet (PDF), Rajztábla és QR kód',
      widgets: [
        { id: 'p-1', type: 'Munkafüzet', x: 60, y: 60 },
        { id: 'p-2', type: 'Rajztábla', x: 680, y: 60 },
        { id: 'p-3', type: 'QR Kód', x: 680, y: 390 }
      ]
    },
    {
      id: 'teamwork',
      title: 'Csoportmunka',
      icon: '👥',
      desc: 'Csoportalkotó, Időzítő és Csoportmunkamód',
      widgets: [
        { id: 'p-1', type: 'Csoportalkotó', x: 100, y: 80 },
        { id: 'p-2', type: 'Időzítő', x: 580, y: 80 },
        { id: 'p-3', type: 'Munkamód', x: 580, y: 340 }
      ]
    },
    {
      id: 'poll',
      title: 'Szavazás & Kvíz',
      icon: '📊',
      desc: 'Mentimeter Élő Szavazó és Időzítő',
      widgets: [
        { id: 'p-1', type: 'Mentimeter', x: 120, y: 60 },
        { id: 'p-2', type: 'Időzítő', x: 740, y: 60 }
      ]
    }
  ];

  const handleApplyPreset = (widgets) => {
    if (setClassroomWidgets) {
      setClassroomWidgets(widgets.map((w, idx) => ({
        ...w,
        id: 'widget-' + Date.now() + '-' + idx
      })));
      setShowPresetsModal(false);
    }
  };

  const handleSaveCustomPreset = (e) => {
    e.preventDefault();
    if (!newPresetName.trim() || classroomWidgets.length === 0) return;
    const newPreset = {
      id: 'custom-' + Date.now(),
      title: newPresetName.trim(),
      icon: '⭐',
      desc: `${classroomWidgets.length} widget elrendezése`,
      widgets: classroomWidgets.map(w => ({ type: w.type, x: w.x, y: w.y }))
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem('schola_classroom_presets', JSON.stringify(updated));
    setNewPresetName('');
  };

  const handleDeleteCustomPreset = (id) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem('schola_classroom_presets', JSON.stringify(updated));
  };

  const allBgs = [...SOLID_BGS, ...GRADIENT_BGS, ...AMBIENT_PATTERNS];
  const currentBgObj = allBgs.find(b => b.value === classroomBg) || { color: '#ffffff' };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        background: classroomBg,
        color: currentBgObj.color,
        margin: 0,
        overflow: 'hidden',
        borderRadius: isFullscreen ? '0' : '4px'
      }}
    >
      <button
        className="btn-icon"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 100,
          background: 'rgba(128,128,128,0.2)',
          color: currentBgObj.color,
          padding: '12px',
          borderRadius: '4px'
        }}
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
          } else {
            document.exitFullscreen().catch(e => console.error(e));
          }
        }}
        title={isFullscreen ? 'Kilépés a teljes képernyőből (Esc)' : 'Teljes képernyő indítása'}
      >
        {isFullscreen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        )}
      </button>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {classroomWidgets.map(widget => {
          if (widget.type === 'Szövegdoboz' || widget.type === 'Szöveg') {
            return (
              <RichTextWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'QR Kód' || widget.type === 'QR kód') {
            return (
              <QRCodeWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Munkamód' || widget.type === 'Munkaszimbólumok' || widget.type === 'Munkaforma') {
            return (
              <WorkModeWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Zajszintmérő' || widget.type === 'Zajszint') {
            return (
              <NoiseMeterWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Véletlen Diák' || widget.type === 'Sorsolás') {
            return (
              <RandomStudentWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Csoportalkotó' || widget.type === 'Csoportok') {
            return (
              <GroupMakerWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Pontos idő' || widget.type === 'Óra' || widget.type === 'Idő') {
            return (
              <ClockWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Időzítő' || widget.type === 'Stopper') {
            return (
              <TimerWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Naptár') {
            return (
              <CalendarWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Rajztábla' || widget.type === 'Rajz') {
            return (
              <DrawingWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Faliújság' || widget.type === 'Faliújság (Padlet)' || widget.type === 'Padlet') {
            return (
              <InteractiveWallWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Mentimeter' || widget.type === 'Szavazás' || widget.type === 'Szavazás (Mentimeter)') {
            return (
              <MentimeterWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Kvíz Aréna' || widget.type === 'Kvíz') {
            return (
              <QuizArenaWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          if (widget.type === 'Munkafüzet' || widget.type === 'PDF' || widget.type === 'Feladatlap') {
            return (
              <PdfViewerWidget
                key={widget.id}
                widget={widget}
                removeWidget={removeWidget}
                updateWidgetBounds={handleUpdateWidgetBounds}
              />
            );
          }

          return (
            <Rnd
              key={widget.id}
              default={{ x: widget.x, y: widget.y, width: 320, height: 240 }}
              minWidth={200}
              minHeight={150}
              bounds="parent"
              dragHandleClassName="widget-drag-handle"
              style={{ zIndex: 20 }}
            >
              <div
                className="glass-panel"
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--panel-bg, #ffffff)',
                  color: 'var(--text-primary, #18181b)',
                  borderRadius: '8px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                  border: '1px solid var(--panel-border, #e4e4e7)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Title bar for dragging */}
                <div
                  className="widget-drag-handle"
                  style={{
                    padding: '8px 14px',
                    background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                    borderBottom: '1px solid var(--panel-border, #e4e4e7)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'grab'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ opacity: 0.5, display: 'flex', alignItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="3" r="1.5" />
                        <circle cx="11" cy="3" r="1.5" />
                        <circle cx="5" cy="8" r="1.5" />
                        <circle cx="11" cy="8" r="1.5" />
                        <circle cx="5" cy="13" r="1.5" />
                        <circle cx="11" cy="13" r="1.5" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      {widget.type}
                    </span>
                  </div>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="rich-text-toolbar-btn"
                    style={{ color: 'var(--theme-red, #cc0000)' }}
                    title="Bezárás"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ opacity: 0.5, fontSize: '12px' }}>Hamarosan...</div>
                </div>
              </div>
            </Rnd>
          );
        })}

        {classroomWidgets.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: '24px', opacity: 0.3, fontWeight: '300', letterSpacing: '1px' }}>
              Kattints egy eszközre az alsó sávban a megjelenítéshez...
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom Tools Bar Wrapper */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 10 }}>
        {/* Toggle Button */}
        {isFullscreen && (
          <button
            className="btn-icon"
            style={{
              position: 'absolute',
              top: isToolbarCollapsed ? '-14px' : '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: currentBgObj.color === '#ffffff' ? '#111111' : '#ffffff',
              color: currentBgObj.color === '#ffffff' ? '#ffffff' : '#000000',
              border: '1px solid var(--panel-border)',
              borderRadius: '4px',
              padding: '6px',
              zIndex: 50,
              cursor: 'pointer',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.2)'
            }}
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            title={isToolbarCollapsed ? 'Eszköztár kinyitása' : 'Eszköztár elrejtése'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: isToolbarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        )}

        {/* Bottom Tools Bar */}
        <div
          style={{
            background: currentBgObj.color === '#ffffff' ? '#111111' : '#ffffff',
            color: currentBgObj.color === '#ffffff' ? '#ffffff' : '#000000',
            borderTop: '1px solid var(--panel-border)',
            padding: isToolbarCollapsed ? '0' : '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '48px',
            flexWrap: 'wrap',
            height: isToolbarCollapsed ? '0px' : 'auto',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
          }}
        >
          {!isToolbarCollapsed && (
            <>
              {/* Category: Időkezelés */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '8px', fontWeight: 'bold' }}>Idő</div>
                <button onClick={() => addWidget('Pontos idő')} className="btn-icon" title="Pontos idő" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></button>
                <button onClick={() => addWidget('Időzítő')} className="btn-icon" title="Időzítő" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 12 12 14 14"></polyline><line x1="12" y1="2" x2="12" y2="4"></line></svg></button>
                <button onClick={() => addWidget('Naptár')} className="btn-icon" title="Naptár" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button>
              </div>

              <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }}></div>

              {/* Category: Osztályterem */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '8px', fontWeight: 'bold' }}>Osztály</div>
                <button onClick={() => addWidget('Zajszintmérő')} className="btn-icon" title="Zajszintmérő" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5v14M7 5v14M22 8v8M2 8v8" /></svg></button>
                <button onClick={() => addWidget('Munkamód')} className="btn-icon" title="Munkamód jelző (Work symbols)" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg></button>
                <button onClick={() => addWidget('Véletlen Diák')} className="btn-icon" title="Véletlen Diák" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></button>
                <button onClick={() => addWidget('Csoportalkotó')} className="btn-icon" title="Csoportalkotó" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></button>
              </div>

              <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }}></div>

              {/* Category: Média & Jegyzet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '8px', fontWeight: 'bold' }}>Média</div>
                <button onClick={() => addWidget('Szövegdoboz')} className="btn-icon" title="Szöveg (T)" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg></button>
                <button onClick={() => addWidget('Rajztábla')} className="btn-icon" title="Rajztábla" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg></button>
                <button onClick={() => addWidget('QR Kód')} className="btn-icon" title="QR Kód" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
                <button onClick={() => addWidget('Faliújság')} className="btn-icon" title="Interaktív Faliújság (Padlet)" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 7h8M8 12h8M8 17h5" /></svg></button>
                <button onClick={() => addWidget('Mentimeter')} className="btn-icon" title="Élő Szavazás (Mentimeter)" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg></button>
                <button onClick={() => addWidget('Kvíz Aréna')} className="btn-icon" title="Kvíz Aréna (Interaktív vetélkedő)" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: '#ec4899' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></button>
                <button onClick={() => addWidget('Munkafüzet')} className="btn-icon" title="Munkafüzet & Feladatlap (PDF)" style={{ padding: '14px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'inherit' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></button>
              </div>

              <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }}></div>

              {/* Category: Sablonok & Fókusz */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '4px', fontWeight: 'bold' }}>Elrendezés</div>
                <button
                  type="button"
                  onClick={() => setShowPresetsModal(true)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(128,128,128,0.1)',
                    color: 'inherit',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                  title="Előre definiált és mentett tábla sablonok"
                >
                  <span>📋 Sablonok</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBlackout(true)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#fff',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                  title="Fókusz / Blackout mód: azonnali fekete képernyő (Gyorsbillentyű: B)"
                >
                  <span>🌑 Fókusz (B)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (classroomWidgets.length > 0) {
                      setShowClearConfirm(true);
                    }
                  }}
                  disabled={classroomWidgets.length === 0}
                  style={{
                    padding: '8px 12px',
                    background: classroomWidgets.length === 0 ? 'rgba(128,128,128,0.05)' : 'rgba(239, 68, 68, 0.1)',
                    color: classroomWidgets.length === 0 ? 'var(--text-secondary)' : '#ef4444',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: classroomWidgets.length === 0 ? 'var(--panel-border)' : 'rgba(239, 68, 68, 0.3)',
                    cursor: classroomWidgets.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    opacity: classroomWidgets.length === 0 ? 0.45 : 1,
                    transition: 'all 0.15s ease'
                  }}
                  title={classroomWidgets.length === 0 ? 'A képernyő már üres' : 'Képernyő / munkalap tisztítása (összes megnyitott eszköz bezárása)'}
                >
                  <span>🧹 Képernyő tisztítása</span>
                  {classroomWidgets.length > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 700
                    }}>
                      {classroomWidgets.length}
                    </span>
                  )}
                </button>
              </div>

              <div style={{ width: '1px', height: '40px', background: 'var(--panel-border)' }}></div>

              {/* Category: Háttér (Egyetlen letisztult gomb) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginRight: '4px', fontWeight: 'bold' }}>Háttér</div>

                <button
                  type="button"
                  data-bg-toggle="true"
                  onClick={() => setShowBgModal(!showBgModal)}
                  title="Tantermi hátterek és minták választása"
                  style={{
                    padding: '8px 14px',
                    background: showBgModal ? 'var(--accent-color, #18181b)' : 'rgba(128,128,128,0.1)',
                    color: showBgModal ? 'var(--badge-color, #ffffff)' : 'inherit',
                    borderRadius: '4px',
                    border: '1px solid var(--panel-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Miniature live preview badge */}
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: classroomBg,
                      border: '1px solid rgba(128,128,128,0.4)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      flexShrink: 0
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                    Háttér
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    style={{
                      transform: showBgModal ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      opacity: 0.6
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Ambient & Background Selector Popover Modal */}
        <BackgroundSelectorModal
          isOpen={showBgModal}
          onClose={() => setShowBgModal(false)}
          classroomBg={classroomBg}
          onSelectBg={(newBg) => {
            setClassroomBg(newBg);
            localStorage.setItem('ekreta_classroom_bg', newBg);
          }}
          isToolbarCollapsed={isToolbarCollapsed}
        />

        {/* Presets Selector Modal */}
        {showPresetsModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              style={{
                background: 'var(--panel-bg, #ffffff)',
                color: 'var(--text-primary)',
                borderRadius: '16px',
                border: '1px solid var(--panel-border)',
                boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                padding: '24px',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📋</span>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Tábla Sablonok (Screen Presets)</h3>
                </div>
                <button
                  onClick={() => setShowPresetsModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              </div>

              {/* Builtin Presets */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Beépített tantermi sablonok:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {BUILTIN_PRESETS.map(preset => (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.widgets)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--panel-border)',
                        background: 'var(--hover-bg, rgba(0,0,0,0.02))',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                        <span>{preset.icon}</span>
                        <span>{preset.title}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        {preset.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Presets */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Saját mentett sablonjaid:
                </div>
                {customPresets.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '10px', background: 'var(--hover-bg, rgba(0,0,0,0.02))', borderRadius: '8px' }}>
                    Még nincsenek elmentett egyéni sablonjaid.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {customPresets.map(preset => (
                      <div
                        key={preset.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--panel-border)',
                          background: 'var(--hover-bg, rgba(0,0,0,0.02))'
                        }}
                      >
                        <div
                          onClick={() => handleApplyPreset(preset.widgets)}
                          style={{ cursor: 'pointer', flex: 1 }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{preset.icon} {preset.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{preset.desc}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteCustomPreset(preset.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Törlés"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Current Layout */}
              <form onSubmit={handleSaveCustomPreset} style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Jelenlegi elrendezés mentése új sablonként:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Pl. Fizika kísérlet elrendezés..."
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#3b82f6',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mentés
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Blackout / Fókusz Overlay */}
        {isBlackout && (
          <div
            onClick={() => setIsBlackout(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: '#000000',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>
              Fókusz Mód Aktív • Kattints vagy nyomj 'B' gombot a feloldáshoz
            </div>
          </div>
        )}

        {/* Clear Screen / Munkalap tisztítása Megerősítő Modál */}
        {showClearConfirm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={() => setShowClearConfirm(false)}
          >
            <div
              className="glass-panel"
              style={{
                width: '380px',
                background: 'var(--panel-bg, #ffffff)',
                color: 'var(--text-primary, #18181b)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                border: '1px solid var(--panel-border, #e4e4e7)',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🧹</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 800 }}>
                Képernyő letisztítása
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Biztosan be szeretnéd zárni az összes megnyitott eszközt ({classroomWidgets.length} db)?
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowClearConfirm(false)}
                  style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 600, borderRadius: '6px' }}
                >
                  Mégse
                </button>
                <button
                  type="button"
                  onClick={handleClearScreen}
                  style={{
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Igen, tisztítás
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Toast for Screen Clear */}
        {undoWidgets && (
          <div
            style={{
              position: 'fixed',
              bottom: isToolbarCollapsed ? '24px' : '90px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(24, 24, 27, 0.95)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '30px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 9990,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.15)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <span>🧹 Képernyő letisztítva ({undoWidgets.length} eszköz bezárva)</span>
            <button
              type="button"
              onClick={handleUndoClear}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#38bdf8',
                padding: '4px 10px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11px'
              }}
            >
              ↩ Visszavonás
            </button>
            <button
              type="button"
              onClick={() => setUndoWidgets(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                padding: '2px',
                fontSize: '13px'
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
