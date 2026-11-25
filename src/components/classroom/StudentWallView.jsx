import React, { useState, useEffect } from 'react';
import { wallService } from '../../services/wallService';

const COLOR_OPTIONS = [
  { id: 'yellow', label: 'Sárga', bg: '#fef08a', text: '#854d0e', border: '#facc15' },
  { id: 'pink', label: 'Rózsaszín', bg: '#fbcfe8', text: '#9d174d', border: '#f472b6' },
  { id: 'blue', label: 'Kék', bg: '#bae6fd', text: '#075985', border: '#38bdf8' },
  { id: 'green', label: 'Zöld', bg: '#bbf7d0', text: '#166534', border: '#4ade80' },
  { id: 'purple', label: 'Lila', bg: '#e9d5ff', text: '#6b21a8', border: '#c084fc' },
  { id: 'orange', label: 'Narancs', bg: '#fed7aa', text: '#9a3412', border: '#fb923c' }
];

export default function StudentWallView() {
  const [topic, setTopic] = useState('Gondolatok & Kérdések a mai óráról');
  const [author, setAuthor] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [recentNotes, setRecentNotes] = useState([]);
  const [likedNoteIds, setLikedNoteIds] = useState([]);

  const loadWall = async () => {
    try {
      const data = await wallService.getWall();
      if (data) {
        if (data.topic) setTopic(data.topic);
        if (data.notes) setRecentNotes(data.notes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadWall();
    const interval = setInterval(loadWall, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const finalAuthor = isAnonymous ? 'Névtelen' : author.trim() || 'Névtelen';
      await wallService.addNote({
        author: finalAuthor,
        text: text.trim(),
        color: selectedColor
      });
      setSubmittedSuccess(true);
      setText('');
      await loadWall();
    } catch (err) {
      alert('Nem sikerült elküldeni a jegyzetet: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id) => {
    if (likedNoteIds.includes(id)) return;
    setLikedNoteIds(prev => [...prev, id]);
    try {
      const updated = await wallService.likeNote(id);
      setRecentNotes(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const currentColorObj = COLOR_OPTIONS.find(c => c.id === selectedColor) || COLOR_OPTIONS[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        color: '#f4f4f5',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Brand & Title */}
      <div style={{ maxWidth: '480px', width: '100%', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              S
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '1.5px' }}>SCHOLA WALL</div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Interaktív Diák Faliújság</div>
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
            Élő Kapcsolat
          </span>
        </div>

        {/* Topic Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.12), rgba(139, 92, 246, 0.12))',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            marginBottom: '16px'
          }}
        >
          <div style={{ fontSize: '11px', color: '#fda4af', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
            Órai Téma / Kérdés
          </div>
          <div style={{ fontSize: '17px', fontWeight: '700', marginTop: '4px', color: '#fff', lineHeight: 1.3 }}>
            {topic}
          </div>
        </div>

        {/* Note Submission Form or Success Message */}
        {submittedSuccess ? (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '26px'
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>
              Jegyzet Sikeresen Beküldve!
            </h3>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '6px', lineHeight: 1.4 }}>
              A gondolatod megjelent a tantermi kivetítőn.
            </p>
            <button
              onClick={() => setSubmittedSuccess(false)}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#e11d48',
                color: '#fff',
                border: 'none',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              + Újabb jegyzet beküldése
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {/* Name input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8' }}>Neved</label>
                <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ accentColor: '#e11d48' }}
                  />
                  Névtelenül írok
                </label>
              </div>
              <input
                type="text"
                disabled={isAnonymous}
                value={isAnonymous ? 'Névtelen' : author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Pl. Kovács Anna"
                maxLength={40}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: isAnonymous ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.25)',
                  color: isAnonymous ? '#71717a' : '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Color selection */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8', display: 'block', marginBottom: '6px' }}>
                Cédula színe
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: c.bg,
                      border: selectedColor === c.id ? '2px solid #fff' : `1px solid ${c.border}`,
                      boxShadow: selectedColor === c.id ? '0 0 10px rgba(255,255,255,0.4)' : 'none',
                      cursor: 'pointer',
                      transform: selectedColor === c.id ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Note text input with live sticky preview */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#d4d4d8' }}>Üzeneted / Válaszod</label>
                <span style={{ fontSize: '11px', color: text.length > 280 ? '#f43f5e' : '#71717a' }}>
                  {text.length}/300
                </span>
              </div>
              <textarea
                rows={4}
                required
                maxLength={300}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Írd le a gondolatodat, kérdésedet vagy válaszodat..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `2px solid ${currentColorObj.border}`,
                  backgroundColor: currentColorObj.bg,
                  color: currentColorObj.text,
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.4',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!text.trim() || isSubmitting}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: text.trim() ? '#e11d48' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '700',
                cursor: text.trim() ? 'pointer' : 'not-allowed',
                boxShadow: text.trim() ? '0 4px 16px rgba(225, 29, 72, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              {isSubmitting ? (
                <span>Küldés folyamatban...</span>
              ) : (
                <>
                  <span>Beküldés a Faliújságra</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* Live Wall Feed preview */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#d4d4d8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Faliújság Üzenetek ({recentNotes.length})
            </h4>
            <span style={{ fontSize: '11px', color: '#71717a' }}>Élőben frissül</span>
          </div>

          {recentNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#71717a', fontSize: '13px' }}>
              Még nincs beküldött jegyzet. Legyél te az első! ✍️
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentNotes.map((note) => {
                const colorObj = COLOR_OPTIONS.find(c => c.id === note.color) || COLOR_OPTIONS[0];
                const hasLiked = likedNoteIds.includes(note.id);
                return (
                  <div
                    key={note.id}
                    style={{
                      background: colorObj.bg,
                      color: colorObj.text,
                      borderRadius: '10px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '12px' }}>{note.author}</span>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>{note.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.35', fontWeight: '500' }}>
                      {note.text}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleLike(note.id)}
                        style={{
                          background: hasLiked ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.4)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '3px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: colorObj.text
                        }}
                      >
                        <span>{hasLiked ? '❤️' : '🤍'}</span>
                        <span>{note.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
