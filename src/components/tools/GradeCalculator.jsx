import React, { useState } from 'react';

export default function GradeCalculator() {
  const [maxScore, setMaxScore] = useState(50);
  const [thresholds, setThresholds] = useState([
    { grade: 5, label: 'Jeles', percent: 85, color: '#3fb950' },
    { grade: 4, label: 'Jó', percent: 70, color: '#58a6ff' },
    { grade: 3, label: 'Közepes', percent: 55, color: '#d29922' },
    { grade: 2, label: 'Elégséges', percent: 40, color: '#f0883e' }
  ]);
  const [roundDirection, setRoundDirection] = useState('down');
  const [savedConfigs, setSavedConfigs] = useState(() => {
    try {
      const stored = localStorage.getItem('grade_thresholds');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });
  const [configName, setConfigName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  const calculatePoints = (percent) => {
    const raw = (maxScore * percent) / 100;
    if (roundDirection === 'down') return Math.floor(raw);
    if (roundDirection === 'up') return Math.ceil(raw);
    if (roundDirection === 'math') return Math.round(raw);
    return Number(raw.toFixed(1));
  };

  const saveConfig = () => {
    if (!configName.trim()) return;
    const newConfig = {
      name: configName.trim(),
      thresholds: thresholds.map((t) => ({ ...t }))
    };
    const updated = [...savedConfigs, newConfig];
    setSavedConfigs(updated);
    localStorage.setItem('grade_thresholds', JSON.stringify(updated));
    setConfigName('');
    setShowSaveModal(false);
  };

  const loadConfig = (config) => {
    setThresholds(config.thresholds.map((t) => ({ ...t })));
    setShowLoadMenu(false);
  };

  const deleteConfig = (index) => {
    const updated = savedConfigs.filter((_, i) => i !== index);
    setSavedConfigs(updated);
    localStorage.setItem('grade_thresholds', JSON.stringify(updated));
  };

  const calculateGradeBounds = () => {
    const bounds = [];
    let currentMax = maxScore;

    for (const t of thresholds) {
      const minPoint = calculatePoints(t.percent);
      bounds.push({
        ...t,
        min: minPoint,
        max: currentMax,
        display: `${minPoint} - ${currentMax}`
      });
      currentMax = minPoint - 0.5;
      if (roundDirection !== 'none') {
        currentMax = minPoint - 1;
      }
    }

    bounds.push({
      grade: 1,
      label: 'Elégtelen',
      percent: 0,
      color: '#f85149',
      min: 0,
      max: currentMax,
      display: `0 - ${currentMax}`
    });

    return bounds;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 8px', height: '100%', overflowY: 'auto' }}>
      <h2 className="card-title">Ponthatár Kalkulátor</h2>

      <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: '150px' }}>
          <label className="input-label">Max pontszám:</label>
          <input
            type="number"
            className="input-field"
            value={maxScore}
            onChange={(e) => setMaxScore(parseFloat(e.target.value) || 0)}
            min="1"
          />
        </div>

        <div style={{ width: '200px' }}>
          <label className="input-label">Kerekítés:</label>
          <select
            className="input-field"
            value={roundDirection}
            onChange={(e) => setRoundDirection(e.target.value)}
          >
            <option value="down">Lefelé (pl. 42.8 → 42)</option>
            <option value="up">Felfelé (pl. 42.2 → 43)</option>
            <option value="math">Matematikai</option>
            <option value="none">Nincs (törtek engedélyezése)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', maxWidth: '600px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Százalékos határok
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowLoadMenu(!showLoadMenu)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
            {showLoadMenu ? 'Mentettek elrejtése' : 'Betöltés'}
          </button>
          <button onClick={() => setShowSaveModal(!showSaveModal)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
            Mentés
          </button>
        </div>
      </div>

      {showSaveModal && (
        <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginTop: '16px', maxWidth: '600px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Eloszlás neve (pl. Szigorú dolgozat)"
            className="input-field"
            style={{ flex: 1 }}
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveConfig()}
          />
          <button onClick={saveConfig} className="btn-primary">
            Mentés
          </button>
          <button onClick={() => setShowSaveModal(false)} className="btn-outline">
            Mégse
          </button>
        </div>
      )}

      {showLoadMenu && (
        <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginTop: '16px', maxWidth: '600px' }}>
          {savedConfigs.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Nincs mentett eloszlás.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedConfigs.map((config, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--hover-bg)',
                    border: '1px solid var(--panel-border)'
                  }}
                >
                  <button
                    onClick={() => loadConfig(config)}
                    style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    {config.name}
                  </button>
                  <span style={{ fontSize: '12px', color: 'var(--accent-color)' }}>
                    {config.thresholds.map((t) => t.percent).join(' - ')}%
                  </span>
                  <button
                    onClick={() => deleteConfig(i)}
                    className="btn-outline"
                    style={{ padding: '4px 8px', fontSize: '12px', color: '#f85149', borderColor: 'transparent' }}
                  >
                    Törlés
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--panel-border)' }}>
          <div>Érdemjegy</div>
          <div>Százalék</div>
          <div>Pontszám</div>
        </div>

        {calculateGradeBounds().map((bound) => (
          <div
            key={bound.grade}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 2fr',
              gap: '16px',
              alignItems: 'center',
              background: 'var(--hover-bg)',
              border: '1px solid var(--panel-border)',
              padding: '12px 16px',
              borderRadius: '8px',
              borderLeft: `4px solid ${bound.color}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${bound.color}20`,
                  color: bound.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}
              >
                {bound.grade}
              </div>
              <span style={{ fontWeight: '500' }}>{bound.label}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {bound.grade !== 1 ? (
                <input
                  type="number"
                  className="input-field"
                  style={{ width: '70px', padding: '6px' }}
                  value={bound.percent}
                  onChange={(e) => {
                    const newPercent = parseFloat(e.target.value) || 0;
                    setThresholds(
                      thresholds.map((t) => (t.grade === bound.grade ? { ...t, percent: newPercent } : t))
                    );
                  }}
                />
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>&lt; {thresholds[3].percent}%</span>
              )}
              {bound.grade !== 1 && <span>%</span>}
            </div>

            <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {bound.display}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
