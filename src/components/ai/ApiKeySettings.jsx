import React, { useState, useEffect } from 'react';
import { geminiService, AVAILABLE_MODELS } from '../../services/geminiService';

export default function ApiKeySettings({ addNotification }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const savedKey = geminiService.getApiKey();
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
    }
    setSelectedModel(geminiService.getModel());
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      geminiService.removeApiKey();
      setIsSaved(false);
      setTestResult({ success: false, message: 'API kulcs törölve.' });
      if (addNotification) addNotification('Gemini API kulcs eltávolítva a böngészőből.', 'info');
      return;
    }

    geminiService.setApiKey(apiKey.trim());
    geminiService.setModel(selectedModel);
    setIsSaved(true);
    setTestResult(null);
    if (addNotification) addNotification('Gemini beállítások sikeresen elmentve a böngésződben!', 'success');
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await geminiService.testConnection(apiKey.trim());
    setIsTesting(false);
    setTestResult(result);

    if (addNotification) {
      if (result.success) {
        addNotification(result.message, 'success');
      } else {
        addNotification(result.error, 'error');
      }
    }
  };

  const handleDelete = () => {
    geminiService.removeApiKey();
    setApiKey('');
    setIsSaved(false);
    setTestResult(null);
    if (addNotification) addNotification('API kulcs törölve a helyi tárolóból.', 'info');
  };

  return (
    <div className="glass-panel card" style={{
      borderRadius: '4px',
      padding: '20px',
      marginTop: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Katedra AI & Google Gemini Konfiguráció
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {isSaved ? '● Konfigurálva (Böngészőben elmentve)' : '○ Nincs beállítva API kulcs'}
            </span>
          </div>
        </div>

        <span style={{
          fontSize: '10px',
          fontWeight: '600',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          padding: '4px 8px',
          borderRadius: '4px',
          background: 'var(--bg-color)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--panel-border)'
        }}>
          BYOK • Kliensoldali
        </span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
        A Schola helyi és biztonságos modellben működik: a saját ingyenes Google Gemini API kulcsodat
        kizárólag a <strong>jelenlegi böngésződ helyi tárolója (localStorage)</strong> őrzi meg. A kérések közvetlenül a böngésződből indulnak az AI felé.
      </p>

      {/* API Key Input */}
      <div style={{ marginBottom: '16px' }}>
        <label className="input-label" style={{ marginBottom: '6px' }}>
          Gemini API Kulcs
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            name="gemini_api_key_schola"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setIsSaved(false);
            }}
            placeholder="AIzaSy..."
            className="input-field"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
              WebkitTextSecurity: showKey ? 'none' : 'disc'
            }}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="btn-outline"
            style={{
              padding: '0 12px',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            {showKey ? 'Elrejtés' : 'Mutatás'}
          </button>
        </div>
      </div>

      {/* Model Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label className="input-label" style={{ marginBottom: '6px' }}>
          Alkalmazott AI Modell
        </label>
        <select
          value={selectedModel}
          onChange={(e) => {
            setSelectedModel(e.target.value);
            geminiService.setModel(e.target.value);
          }}
          className="input-field"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {AVAILABLE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          Mentés
        </button>

        <button
          type="button"
          onClick={handleTest}
          disabled={isTesting || !apiKey.trim()}
          className="btn-outline"
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: isTesting || !apiKey.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {isTesting ? 'Kapcsolat tesztelése...' : 'Kapcsolat tesztelése'}
        </button>

        {isSaved && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-outline"
            style={{
              padding: '8px 14px',
              borderRadius: '4px',
              color: 'var(--danger)',
              fontSize: '12px',
              marginLeft: 'auto'
            }}
          >
            Kulcs törlése
          </button>
        )}
      </div>

      {/* Test Feedback Result */}
      {testResult && (
        <div style={{
          marginTop: '14px',
          padding: '10px 14px',
          borderRadius: '4px',
          fontSize: '12px',
          background: 'var(--bg-color)',
          border: `1px solid ${testResult.success ? 'var(--text-primary)' : 'var(--danger)'}`,
          color: testResult.success ? 'var(--text-primary)' : 'var(--danger)'
        }}>
          {testResult.success ? `✓ ${testResult.message}` : `✕ ${testResult.error || testResult.message}`}
        </div>
      )}

      {/* Helper Footer Link */}
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Még nincs ingyenes kulcsod?
        </span>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '12px', color: 'var(--text-primary)', textDecoration: 'underline' }}
        >
          Ingyenes Gemini API kulcs igénylése a Google AI Studio-ban &rarr;
        </a>
      </div>
    </div>
  );
}
