import { useState, useMemo } from 'react';
import { Calculator, RotateCcw, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_THRESHOLDS = [
  { grade: 5, label: 'Jeles', percent: 85, color: '#3fb950' },
  { grade: 4, label: 'Jó', percent: 70, color: '#58a6ff' },
  { grade: 3, label: 'Közepes', percent: 55, color: '#d29922' },
  { grade: 2, label: 'Elégséges', percent: 40, color: '#f0883e' },
];

const STORAGE_KEY = 'grade_thresholds';

interface SavedConfig {
  name: string;
  thresholds: { grade: number; label: string; percent: number; color: string }[];
}

const loadFromStorage = (): SavedConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as SavedConfig[];
  } catch {}
  return [];
};

const GradeCalculator = () => {
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS.map(t => ({ ...t })));
  const [maxScore, setMaxScore] = useState(50);
  const [roundToWhole, setRoundToWhole] = useState(true);
  const [roundDirection, setRoundDirection] = useState<'down' | 'up' | 'math'>('down');
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>(() => loadFromStorage());
  const [configName, setConfigName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  const saveConfig = () => {
    if (!configName.trim()) return;
    const newConfig: SavedConfig = {
      name: configName.trim(),
      thresholds: thresholds.map(t => ({ ...t })),
    };
    const updated = [...savedConfigs, newConfig];
    setSavedConfigs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setConfigName('');
    setShowSaveModal(false);
  };

  const loadConfig = (config: SavedConfig) => {
    setThresholds(config.thresholds.map(t => ({ ...t })));
    setShowLoadMenu(false);
  };

  const deleteConfig = (index: number) => {
    const updated = savedConfigs.filter((_, i) => i !== index);
    setSavedConfigs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const results = useMemo(() => {
    return thresholds.map(t => {
      let points = (t.percent / 100) * maxScore;
      if (roundToWhole) {
        points = roundDirection === 'up' ? Math.ceil(points) : roundDirection === 'down' ? Math.floor(points) : Math.round(points);
      }
      return { ...t, points };
    });
  }, [maxScore, thresholds, roundToWhole, roundDirection]);

  const updatePercent = (index: number, value: number) => {
    const updated = [...thresholds];
    updated[index] = { ...updated[index], percent: value };
    setThresholds(updated);
  };

  const resetDefaults = () => {
    setThresholds(DEFAULT_THRESHOLDS.map(t => ({ ...t })));
    setMaxScore(50);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>
      
{/* Header */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
      <Calculator size={22} color="var(--accent-blue)" /> Ponthatárok
    </h2>
    <button onClick={resetDefaults} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
      <RotateCcw size={14} /> Alaphelyzet
    </button>
  </div>

  {/* Mentés modal */}
  {showSaveModal && (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="text"
        value={configName}
        onChange={e => setConfigName(e.target.value)}
        placeholder="Eloszlás neve..."
        onKeyDown={e => e.key === 'Enter' && saveConfig()}
        autoFocus
        style={{
          flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)',
          background: 'var(--bg-color)', color: 'var(--text-primary)', outline: 'none'
        }}
      />
      <button onClick={saveConfig} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent-blue)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
        Mentés
      </button>
      <button onClick={() => { setShowSaveModal(false); setConfigName(''); }} style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
        ✕
      </button>
    </div>
  )}

  {/* Max pontszám */}
  <div className="glass-panel" style={{ padding: '16px' }}>
    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
      Dolgozat maximális pontszáma
    </label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <input
        type="range" min={5} max={200} value={maxScore}
        onChange={e => setMaxScore(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent-blue)' }}
      />
      <div style={{ position: 'relative' }}>
        <input
          type="number" min={1} max={999} value={maxScore}
          onChange={e => setMaxScore(Number(e.target.value) || 1)}
          onFocus={e => e.target.select()}
          style={{
            width: '70px', padding: '10px', borderRadius: '10px', textAlign: 'center',
            border: '1px solid var(--border-glass)', background: 'var(--bg-color)',
            color: 'var(--accent-blue)', fontSize: '20px', fontWeight: 'bold', outline: 'none'
          }}
        />
      </div>
    </div>
  </div>

      {/* Kerekítés beállítások */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Csak egész pontok</span>
          <button
            onClick={() => setRoundToWhole(!roundToWhole)}
            style={{
              width: '48px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: roundToWhole ? 'var(--accent-blue)' : '#30363d',
              position: 'relative', transition: 'background 0.2s'
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '11px', background: 'white',
              position: 'absolute', top: '3px',
              left: roundToWhole ? '23px' : '3px',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }} />
          </button>
        </div>

        {roundToWhole && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setRoundDirection('down')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                border: roundDirection === 'down' ? '1px solid var(--accent-blue)' : '1px solid var(--border-glass)',
                background: roundDirection === 'down' ? 'rgba(88,166,255,0.15)' : 'transparent',
                color: roundDirection === 'down' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              ⬇ Le
            </button>
            <button
              onClick={() => setRoundDirection('math')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                border: roundDirection === 'math' ? '1px solid var(--accent-purple)' : '1px solid var(--border-glass)',
                background: roundDirection === 'math' ? 'rgba(163,113,247,0.15)' : 'transparent',
                color: roundDirection === 'math' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              ⚖ Matek
            </button>
            <button
              onClick={() => setRoundDirection('up')}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                border: roundDirection === 'up' ? '1px solid var(--accent-green)' : '1px solid var(--border-glass)',
                background: roundDirection === 'up' ? 'rgba(63,185,80,0.15)' : 'transparent',
                color: roundDirection === 'up' ? 'var(--accent-green)' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              ⬆ Fel
            </button>
          </div>
        )}
      </div>

      {/* Százalékok szerkesztése */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Százalékos határok
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowLoadMenu(!showLoadMenu)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            {showLoadMenu ? <ChevronUp size={12} /> : <ChevronDown size={12} />}{showLoadMenu ? 'Betöltés' : 'Betöltés'}
          </button>
          <button onClick={() => setShowSaveModal(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
            <Save size={12} />Mentés
          </button>
        </div>
      </div>

      {showLoadMenu && (
        <div className="glass-panel" style={{ padding: '12px' }}>
          {savedConfigs.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '8px' }}>
              Nincs mentett eloszlás
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {savedConfigs.map((config, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: 'var(--bg-color)' }}>
                  <button onClick={() => loadConfig(config)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
                    {config.name}
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {config.thresholds.map(t => t.percent).join('-')}%
                  </span>
                  <button onClick={() => deleteConfig(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', opacity: 0.6 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {results.map((r, i) => (
        <div key={r.grade} className="glass-panel" style={{
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
          borderLeft: `4px solid ${r.color}`
        }}>
          {/* Jegy + Címke */}
          <div style={{ minWidth: '65px' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: r.color }}>{r.grade}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.label}</div>
          </div>

          {/* Százalék szerkesztő */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="range" min={0} max={100} value={r.percent}
              onChange={e => updatePercent(i, Number(e.target.value))}
              style={{ width: '100%', accentColor: r.color }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>{r.percent}%-tól</span>
              <span>{i === 0 ? '100%' : `${results[i - 1].percent - 1}%`}-ig</span>
            </div>
          </div>

          {/* Eredmény pont */}
          <div style={{
            minWidth: '55px', textAlign: 'center', padding: '8px', borderRadius: '10px',
            background: `${r.color}18`, border: `1px solid ${r.color}40`
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: r.color }}>
              {roundToWhole ? r.points : r.points.toFixed(1)}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>pont</div>
          </div>
        </div>
      ))}

      {/* Elégtelen info */}
      <div className="glass-panel" style={{
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        borderLeft: '4px solid #f85149', opacity: 0.7
      }}>
        <div style={{ minWidth: '65px' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f85149' }}>1</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Elégtelen</div>
        </div>
        <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>
          0 – {results.length > 0 ? (roundToWhole ? results[results.length - 1].points - 1 : (results[results.length - 1].points - 0.1).toFixed(1)) : 0} pont
        </div>
        <div style={{
          minWidth: '55px', textAlign: 'center', padding: '8px', borderRadius: '10px',
          background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f85149' }}>
            {'<'}{results.length > 0 ? results[results.length - 1].points : 0}
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>pont</div>
        </div>
      </div>

      {/* Összegző táblázat */}
      <div className="glass-panel" style={{ padding: '16px', marginTop: '4px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', textAlign: 'center' }}>Összesítő Táblázat</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', textAlign: 'left', fontWeight: 600 }}>Jegy</th>
              <th style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 600 }}>%</th>
              <th style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 600 }}>Ponttól</th>
              <th style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 600 }}>Pontig</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.grade}>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-glass)' }}>
                  <span style={{ color: r.color, fontWeight: 'bold' }}>{r.grade}</span> {r.label}
                </td>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-glass)', textAlign: 'center' }}>{r.percent}%</td>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-glass)', textAlign: 'center', fontWeight: 'bold', color: r.color }}>
                  {roundToWhole ? r.points : r.points.toFixed(1)}
                </td>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  {i === 0 ? maxScore : (roundToWhole ? results[i - 1].points - 1 : (results[i - 1].points - 0.1).toFixed(1))}
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: '8px 4px', color: '#f85149' }}><span style={{ fontWeight: 'bold' }}>1</span> Elégtelen</td>
              <td style={{ padding: '8px 4px', textAlign: 'center' }}>0%</td>
              <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 'bold', color: '#f85149' }}>0</td>
              <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                {results.length > 0 ? (roundToWhole ? results[results.length - 1].points - 1 : (results[results.length - 1].points - 0.1).toFixed(1)) : 0}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeCalculator;
