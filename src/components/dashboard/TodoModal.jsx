import React from 'react';

export default function TodoModal({
  isOpen,
  onClose,
  draft,
  setDraft,
  onSave
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card glass-panel"
        style={{ width: '100%', maxWidth: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Részletes Teendő</h3>

        <div>
          <label className="input-label">Teendő szövege</label>
          <input
            type="text"
            className="input-field"
            autoFocus
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="Mit kell elintézni?"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="input-label">Határidő (opcionális)</label>
            <input
              type="date"
              className="input-field"
              value={draft.deadline}
              onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Osztály (opcionális)</label>
            <input
              type="text"
              className="input-field"
              value={draft.class}
              onChange={(e) => setDraft({ ...draft, class: e.target.value })}
              placeholder="pl. 11.A"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="input-label">Óra (opcionális)</label>
            <input
              type="number"
              className="input-field"
              value={draft.lesson}
              onChange={(e) => setDraft({ ...draft, lesson: e.target.value })}
              placeholder="pl. 3"
              min="1"
              max="10"
            />
          </div>
          <div>
            <label className="input-label">Prioritás</label>
            <select
              className="input-field"
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
            >
              <option value="Alacsony">Alacsony</option>
              <option value="Közepes">Közepes</option>
              <option value="Magas">Magas</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>
            Mégse
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onSave}>
            Mentés
          </button>
        </div>
      </div>
    </div>
  );
}
