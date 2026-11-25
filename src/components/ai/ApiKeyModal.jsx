import React, { useState, useEffect } from 'react';
import { geminiService, AVAILABLE_MODELS } from '../../services/geminiService';

export default function ApiKeyModal({
  isOpen,
  onClose,
  onSaved,
  addNotification,
  title = 'Google Gemini API Kulcs Beállítása',
  subtitle = 'Szükséges az AI Kvíz és Katedra funkciók használatához'
}) {
  const [apiKey, setApiKey] = useState(() => geminiService.getApiKey() || '');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => geminiService.getModel() || AVAILABLE_MODELS[0].id);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [hasExistingKey, setHasExistingKey] = useState(() => Boolean(geminiService.getApiKey()));

  useEffect(() => {
    if (isOpen) {
      setApiKey(geminiService.getApiKey() || '');
      setHasExistingKey(Boolean(geminiService.getApiKey()));
      setSelectedModel(geminiService.getModel() || AVAILABLE_MODELS[0].id);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      geminiService.removeApiKey();
      setHasExistingKey(false);
      if (addNotification) addNotification('Gemini API kulcs törölve.', 'info');
      if (onSaved) onSaved('');
      onClose();
      return;
    }

    geminiService.setApiKey(trimmed);
    geminiService.setModel(selectedModel);
    setHasExistingKey(true);
    if (addNotification) addNotification('Gemini API kulcs sikeresen elmentve!', 'success');
    if (onSaved) onSaved(trimmed);
    onClose();
  };

  const handleTest = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    setIsTesting(true);
    setTestResult(null);
    const result = await geminiService.testConnection(trimmed);
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
    setHasExistingKey(false);
    setTestResult(null);
    if (addNotification) addNotification('API kulcs eltávolítva a böngészőből.', 'info');
    if (onSaved) onSaved('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel card"
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--panel-bg, #1e293b)',
          color: 'var(--text-primary, #f8fafc)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--panel-border, rgba(255, 255, 255, 0.1))',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
              }}
            >
              🔑
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Info Banner */}
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--text-secondary, #94a3b8)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>
            <span>💡 Miért szükséges az API kulcs?</span>
          </div>
          <div>
            Az AI kvíz és tanári funkciók az ultragyors Google Gemini modellt használják a kérdések és tananyagok összeállításához. A Schola a saját ingyenes kulcsodat használja, így korlátlanul működik.
          </div>
          <div style={{ marginTop: '8px' }}>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3b82f6',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>🔗 Ingyenes Google Gemini API kulcs igénylése (Google AI Studio) →</span>
            </a>
          </div>
        </div>

        {/* API Key Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Gemini API Kulcs <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              autoFocus
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--panel-border, #334155)',
                background: 'var(--bg-color, #0f172a)',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid var(--panel-border, #334155)',
                background: 'var(--panel-bg, #1e293b)',
                color: 'var(--text-secondary, #94a3b8)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {showKey ? 'Elrejtés' : 'Mutatás'}
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Alkalmazott Gemini AI Modell:
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--panel-border, #334155)',
              background: 'var(--bg-color, #0f172a)',
              color: 'var(--text-primary, #f8fafc)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Test Connection Button & Result */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--panel-border, #334155)',
                background: 'var(--panel-bg, #1e293b)',
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isTesting || !apiKey.trim() ? 'not-allowed' : 'pointer',
                opacity: isTesting || !apiKey.trim() ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isTesting ? 'Kapcsolat tesztelése...' : '⚡ Kapcsolat tesztelése'}
            </button>

            {hasExistingKey && (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Kulcs törlése
              </button>
            )}
          </div>

          {testResult && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: testResult.success ? '1px solid #22c55e' : '1px solid #ef4444',
                color: testResult.success ? '#22c55e' : '#ef4444'
              }}
            >
              {testResult.success ? `✓ ${testResult.message}` : `✕ ${testResult.error}`}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary, #94a3b8)',
            lineHeight: 1.4,
            borderTop: '1px solid var(--panel-border, rgba(255, 255, 255, 0.08))',
            paddingTop: '12px'
          }}
        >
          🔒 <strong>BYOK biztonsági modell:</strong> A kulcs kizárólag a saját böngésződ memóriájában (localStorage) tárolódik. Semmilyen központi szerverre nem kerül továbbításra, közvetlenül a Google Gemini API-hoz kommunikál.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--panel-border, #334155)',
              background: 'transparent',
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Mégse
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!apiKey.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: !apiKey.trim() ? 'not-allowed' : 'pointer',
              opacity: !apiKey.trim() ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
            }}
          >
            Mentés és Folytatás
          </button>
        </div>
      </div>
    </div>
  );
}
