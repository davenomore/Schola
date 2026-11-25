import React, { useState } from 'react';
import ApiKeySettings from '../ai/ApiKeySettings';

export default function Settings({
  settingsSubTab,
  setSettingsSubTab,
  widgetSettings,
  updateWidgetSetting,
  vacationDates,
  updateVacationDate,
  bookmarks,
  setBookmarks,
  addNotification
}) {
  const [draggedBmIndex, setDraggedBmIndex] = useState(null);
  const [dragOverBmIndex, setDragOverBmIndex] = useState(null);

  const moveBookmark = (index, delta) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= bookmarks.length) return;
    const newBm = [...bookmarks];
    const [item] = newBm.splice(index, 1);
    newBm.splice(targetIndex, 0, item);
    setBookmarks(newBm);
  };

  const handleBmDragStart = (e, index) => {
    setDraggedBmIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleBmDragOver = (e, index) => {
    e.preventDefault();
    if (draggedBmIndex === null || draggedBmIndex === index) return;
    if (dragOverBmIndex !== index) {
      setDragOverBmIndex(index);
    }
  };

  const handleBmDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedBmIndex === null || draggedBmIndex === targetIndex) {
      setDraggedBmIndex(null);
      setDragOverBmIndex(null);
      return;
    }
    const newBm = [...bookmarks];
    const [item] = newBm.splice(draggedBmIndex, 1);
    newBm.splice(targetIndex, 0, item);
    setBookmarks(newBm);
    setDraggedBmIndex(null);
    setDragOverBmIndex(null);
  };

  const handleBmDragEnd = () => {
    setDraggedBmIndex(null);
    setDragOverBmIndex(null);
  };
  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', height: '100%', minHeight: 0 }}>
      <div
        className="card glass-panel animate-fade-in"
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0, gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 className="card-title" style={{ margin: '0 0 4px 0', fontSize: '15px' }}>
              {settingsSubTab === 'widgets' ? 'Widget Beállítások' : 'Gemini AI & Katedra Motor Beállítások'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '12px' }}>
              {settingsSubTab === 'widgets'
                ? 'Itt testreszabhatod, hogy milyen widgetek és modulok jelenjenek meg a Vezérlőpult oldalsávjában.'
                : 'Konfiguráld a Google Gemini API kulcsodat az AI tanári asszisztens és feladatgenerálás funkciókhoz.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
            <button
              type="button"
              onClick={() => setSettingsSubTab('widgets')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: settingsSubTab === 'widgets' ? 'var(--accent-color)' : 'transparent',
                color: settingsSubTab === 'widgets' ? 'var(--panel-bg)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              Vezérlőpult Widgetek
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab('ai')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: settingsSubTab === 'ai' ? 'var(--accent-color)' : 'transparent',
                color: settingsSubTab === 'ai' ? 'var(--panel-bg)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              Gemini AI Motor
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' }}>
          {settingsSubTab === 'widgets' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Oszlop 1: Adminisztráció */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', margin: '0 0 4px 0', fontSize: '15px', color: 'var(--accent-color)' }}>
                  Adminisztráció
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '13px' }}>Widgetek szerkesztése</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>A widgetek szélét húzva méretezhetsz.</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input
                      type="checkbox"
                      style={{ opacity: 0, width: 0, height: 0 }}
                      checked={widgetSettings.editMode}
                      onChange={(e) => updateWidgetSetting('editMode', e.target.checked)}
                    />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.editMode ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.editMode ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '13px' }}>Rács automatikus kitöltése</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>Felhúzza a widgeteket az üres helyekre.</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input
                      type="checkbox"
                      style={{ opacity: 0, width: 0, height: 0 }}
                      checked={widgetSettings.autoFillGrid || false}
                      onChange={(e) => updateWidgetSetting('autoFillGrid', e.target.checked)}
                    />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.autoFillGrid ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.autoFillGrid ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Gyors Teendők (To-Do)</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showTodos} onChange={(e) => updateWidgetSetting('showTodos', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showTodos ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showTodos ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Post-it / Jegyzet</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showPostit} onChange={(e) => updateWidgetSetting('showPostit', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showPostit ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showPostit ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Üzenetek Előnézete</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showMessages} onChange={(e) => updateWidgetSetting('showMessages', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showMessages ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showMessages ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Gyors Műveletek</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showQuickActions} onChange={(e) => updateWidgetSetting('showQuickActions', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showQuickActions ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showQuickActions ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Értesítés Csempe (SNE)</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'var(--text-secondary)' }}>Sürgős határidők és figyelmeztetések piros kerettel</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showSmartNotification !== false} onChange={(e) => updateWidgetSetting('showSmartNotification', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showSmartNotification !== false ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showSmartNotification !== false ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Oszlop 2: Óraszervezés */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', margin: '0 0 4px 0', fontSize: '15px', color: 'var(--accent-color)' }}>
                  Óraszervezés
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Következő Óra</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showUpNext} onChange={(e) => updateWidgetSetting('showUpNext', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showUpNext ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showUpNext ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Visszaszámláló a Szünetig</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showClassProgress} onChange={(e) => updateWidgetSetting('showClassProgress', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showClassProgress ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showClassProgress ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Mini Naptár</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showMiniCalendar} onChange={(e) => updateWidgetSetting('showMiniCalendar', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showMiniCalendar ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showMiniCalendar ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Digitális Óra</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showDigitalClock} onChange={(e) => updateWidgetSetting('showDigitalClock', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showDigitalClock ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showDigitalClock ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Gyors Időzítő</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showMiniTimer} onChange={(e) => updateWidgetSetting('showMiniTimer', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showMiniTimer ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showMiniTimer ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Időjárás</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showWeather} onChange={(e) => updateWidgetSetting('showWeather', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showWeather ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showWeather ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Oszlop 3: Pedagógiai modulok */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', margin: '0 0 4px 0', fontSize: '15px', color: 'var(--accent-color)' }}>
                  Pedagógiai modulok
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Napi Motiváció (Idézet)</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showQuote} onChange={(e) => updateWidgetSetting('showQuote', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showQuote ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showQuote ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px' }}>Szokáskövető</h4>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showHabitTracker} onChange={(e) => updateWidgetSetting('showHabitTracker', e.target.checked)} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showHabitTracker ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showHabitTracker ? 'translateX(16px)' : 'none' }}></span>
                      </span>
                    </label>
                  </div>
                  {widgetSettings.showHabitTracker && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <input type="text" value={widgetSettings.habitName} onChange={(e) => updateWidgetSetting('habitName', e.target.value)} style={{ padding: '6px', fontSize: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} placeholder="Tevékenység (pl. Vízivás)" />
                      <select value={widgetSettings.habitType} onChange={(e) => updateWidgetSetting('habitType', e.target.value)} style={{ padding: '6px', fontSize: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                        <option value="napi">Napi ütemezés (többszöri pipa)</option>
                        <option value="heti">Heti ütemezés (napok kipipálása)</option>
                      </select>
                      {widgetSettings.habitType === 'napi' && (
                        <input type="number" min="1" max="20" value={widgetSettings.habitDailyMax} onChange={(e) => updateWidgetSetting('habitDailyMax', parseInt(e.target.value, 10))} style={{ padding: '6px', fontSize: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} placeholder="Hányszor egy nap?" />
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px' }}>Folyadékpótlás</h4>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showHydrationTracker} onChange={(e) => updateWidgetSetting('showHydrationTracker', e.target.checked)} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showHydrationTracker ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showHydrationTracker ? 'translateX(16px)' : 'none' }}></span>
                      </span>
                    </label>
                  </div>
                  {widgetSettings.showHydrationTracker && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Napi cél (ml)</label>
                      <input type="number" min="500" max="10000" step="100" value={widgetSettings.hydrationTarget} onChange={(e) => updateWidgetSetting('hydrationTarget', parseInt(e.target.value, 10) || 2000)} style={{ padding: '6px', fontSize: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }} placeholder="pl. 2000" />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px' }}>Véletlen Diák</h4>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showRandomStudent} onChange={(e) => updateWidgetSetting('showRandomStudent', e.target.checked)} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showRandomStudent ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showRandomStudent ? 'translateX(16px)' : 'none' }}></span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Oszlop 4: Időrend & Linkek */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', margin: '0 0 4px 0', fontSize: '15px', color: 'var(--accent-color)' }}>
                  Időrend & Linkek
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px' }}>Vakáció-számláló</h4>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showVacationCountdown} onChange={(e) => updateWidgetSetting('showVacationCountdown', e.target.checked)} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showVacationCountdown ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showVacationCountdown ? 'translateX(16px)' : 'none' }}></span>
                      </span>
                    </label>
                  </div>

                  {widgetSettings.showVacationCountdown && (
                    <div style={{ padding: '8px 10px', background: 'rgba(128,128,128,0.08)', borderRadius: '4px', marginTop: '4px' }}>
                      <h5 style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '600' }}>Szünetek Dátumai</h5>
                      <p style={{ margin: '0 0 6px 0', fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                        Automatikusan levonódnak a dolgozatok 15 munkanapos határidejéből.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div>
                          <label className="input-label" style={{ fontSize: '10px', marginBottom: '1px' }}>Őszi szünet</label>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="date" className="input-field" style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }} value={vacationDates.autumnStart || vacationDates.autumn} onChange={(e) => updateVacationDate('autumnStart', e.target.value)} />
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>–</span>
                            <input type="date" className="input-field" style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }} value={vacationDates.autumnEnd || ''} onChange={(e) => updateVacationDate('autumnEnd', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="input-label" style={{ fontSize: '10px', marginBottom: '1px' }}>Téli szünet</label>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="date" className="input-field" style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }} value={vacationDates.winterStart || vacationDates.winter} onChange={(e) => updateVacationDate('winterStart', e.target.value)} />
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>–</span>
                            <input type="date" className="input-field" style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }} value={vacationDates.winterEnd || ''} onChange={(e) => updateVacationDate('winterEnd', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="input-label" style={{ fontSize: '10px', marginBottom: '1px' }}>Tavaszi szünet</label>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="date" className="input-field" style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }} value={vacationDates.springStart || vacationDates.spring} onChange={(e) => updateVacationDate('springStart', e.target.value)} />
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>–</span>
                            <input type="date" className="input-field" style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }} value={vacationDates.springEnd || ''} onChange={(e) => updateVacationDate('springEnd', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="input-label" style={{ fontSize: '10px', marginBottom: '1px' }}>Nyári szünet</label>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="date" className="input-field" style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }} value={vacationDates.summerStart || vacationDates.summer} onChange={(e) => updateVacationDate('summerStart', e.target.value)} />
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>–</span>
                            <input type="date" className="input-field" style={{ padding: '3px 6px', fontSize: '11px', flex: 1 }} value={vacationDates.summerEnd || ''} onChange={(e) => updateVacationDate('summerEnd', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px' }}>Könyvjelzők</h4>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px' }}>
                      <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={widgetSettings.showBookmarks} onChange={(e) => updateWidgetSetting('showBookmarks', e.target.checked)} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: widgetSettings.showBookmarks ? 'var(--accent-color)' : 'rgba(128,128,128,0.3)', transition: '.4s', borderRadius: '22px' }}>
                        <span style={{ position: 'absolute', content: '""', height: '14px', width: '14px', left: '4px', bottom: '4px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: '.4s', borderRadius: '50%', transform: widgetSettings.showBookmarks ? 'translateX(16px)' : 'none' }}></span>
                      </span>
                    </label>
                  </div>
                  {widgetSettings.showBookmarks && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      {bookmarks.map((bm, index) => (
                        <div
                          key={index}
                          draggable
                          onDragStart={(e) => handleBmDragStart(e, index)}
                          onDragOver={(e) => handleBmDragOver(e, index)}
                          onDrop={(e) => handleBmDrop(e, index)}
                          onDragEnd={handleBmDragEnd}
                          style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                            padding: '3px 4px',
                            borderRadius: '4px',
                            background: dragOverBmIndex === index ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                            border: dragOverBmIndex === index ? '1px dashed var(--accent-color)' : '1px solid transparent',
                            opacity: draggedBmIndex === index ? 0.35 : 1,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div
                            style={{
                              cursor: 'grab',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '2px',
                              flexShrink: 0
                            }}
                            title="Fogd és húzd a sorrend módosításához"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="8" cy="4" r="2" />
                              <circle cx="16" cy="4" r="2" />
                              <circle cx="8" cy="12" r="2" />
                              <circle cx="16" cy="12" r="2" />
                              <circle cx="8" cy="20" r="2" />
                              <circle cx="16" cy="20" r="2" />
                            </svg>
                          </div>
                          {(() => {
                            let hostname = '';
                            try {
                              const u = bm.url.startsWith('http://') || bm.url.startsWith('https://') ? bm.url : `https://${bm.url}`;
                              hostname = new URL(u).hostname;
                            } catch {}
                            return hostname ? (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                alt=""
                                style={{ width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0 }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : null;
                          })()}
                          <input
                            type="text"
                            draggable={false}
                            onDragStart={(e) => e.stopPropagation()}
                            value={bm.title}
                            onChange={(e) => {
                              const newBm = [...bookmarks];
                              newBm[index].title = e.target.value;
                              setBookmarks(newBm);
                            }}
                            style={{ padding: '4px 6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', flex: 1, minWidth: 0, fontSize: '11px' }}
                            placeholder="Név"
                          />
                          <input
                            type="text"
                            draggable={false}
                            onDragStart={(e) => e.stopPropagation()}
                            value={bm.url}
                            onChange={(e) => {
                              const newBm = [...bookmarks];
                              newBm[index].url = e.target.value;
                              setBookmarks(newBm);
                            }}
                            style={{ padding: '4px 6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', flex: 2, minWidth: 0, fontSize: '11px' }}
                            placeholder="https://..."
                          />
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveBookmark(index, -1)}
                            className="btn-icon"
                            style={{
                              padding: '2px 3px',
                              opacity: index === 0 ? 0.2 : 0.7,
                              cursor: index === 0 ? 'default' : 'pointer',
                              color: 'var(--text-primary)',
                              flexShrink: 0
                            }}
                            title="Mozgatás fel"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                          </button>
                          <button
                            type="button"
                            disabled={index === bookmarks.length - 1}
                            onClick={() => moveBookmark(index, 1)}
                            className="btn-icon"
                            style={{
                              padding: '2px 3px',
                              opacity: index === bookmarks.length - 1 ? 0.2 : 0.7,
                              cursor: index === bookmarks.length - 1 ? 'default' : 'pointer',
                              color: 'var(--text-primary)',
                              flexShrink: 0
                            }}
                            title="Mozgatás le"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ color: 'var(--danger)', padding: '2px 3px', flexShrink: 0 }}
                            onClick={() => setBookmarks(bookmarks.filter((_, i) => i !== index))}
                            title="Törlés"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ))}
                      {bookmarks.length < 5 && (
                        <button
                          className="btn-outline"
                          style={{ fontSize: '11px', padding: '4px 8px', marginTop: '2px', display: 'flex', justifyContent: 'center' }}
                          onClick={() => setBookmarks([...bookmarks, { title: 'Új', url: 'https://' }])}
                        >
                          + Új hozzáadása
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {settingsSubTab === 'ai' && (
            <div style={{ maxWidth: '850px' }}>
              <ApiKeySettings addNotification={addNotification} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
