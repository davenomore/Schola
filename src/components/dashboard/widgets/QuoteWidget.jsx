import React, { useState } from 'react';
import WidgetResizer from '../WidgetResizer';

export default function QuoteWidget({
  dailyQuote,
  quoteType,
  setQuoteType,
  setQuoteOffset,
  widgetSettings,
  widgetPositions,
  widgetSizes,
  widgetHeights,
  changeWidgetWidth,
  changeWidgetHeight,
  handleDragStart,
  handleDragOver,
  handleDrop
}) {
  const [copied, setCopied] = useState(false);
  const parts = dailyQuote.split(' - ');
  const quoteText = parts[0] || '';
  const quoteAuthor = parts[1] || 'Ismeretlen';

  const w = widgetSizes.quote || 1;
  const h = widgetHeights.quote || 1;
  const isCompactH = h === 1;

  const handleCopy = (e) => {
    e.stopPropagation();
    const textToCopy = `"${quoteText}" - ${quoteAuthor}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.quote?.c || 1} / span ${w}`,
        gridRow: `${widgetPositions.quote?.r || 1} / span ${h}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'quote')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'quote')}
    >
      <WidgetResizer
        widgetKey="quote"
        w={w}
        h={h}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title compact-hide-h" style={{ marginBottom: isCompactH ? '2px' : '4px', flexWrap: w === 1 ? 'wrap' : 'nowrap', gap: '4px' }}>
          <span>Idézet</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: w === 1 ? '4px' : '8px' }}>
            <div style={{ display: 'flex', background: 'var(--hover-bg)', padding: '2px', borderRadius: '6px', gap: '2px', border: '1px solid var(--panel-border)' }}>
              <button
                onClick={() => {
                  setQuoteType('teacher');
                  localStorage.setItem('ekreta_quote_type', 'teacher');
                }}
                style={{
                  padding: w === 1 ? '3px 8px' : '4px 12px',
                  fontSize: w === 1 ? '11px' : '12px',
                  fontWeight: 600,
                  background: quoteType === 'teacher' ? 'var(--accent-color)' : 'transparent',
                  color: quoteType === 'teacher' ? 'var(--bg-color)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: quoteType === 'teacher' ? '0 1px 4px rgba(0, 0, 0, 0.12)' : 'none'
                }}
              >
                Tanári
              </button>
              <button
                onClick={() => {
                  setQuoteType('student');
                  localStorage.setItem('ekreta_quote_type', 'student');
                }}
                style={{
                  padding: w === 1 ? '3px 8px' : '4px 12px',
                  fontSize: w === 1 ? '11px' : '12px',
                  fontWeight: 600,
                  background: quoteType === 'student' ? 'var(--accent-color)' : 'transparent',
                  color: quoteType === 'student' ? 'var(--bg-color)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: quoteType === 'student' ? '0 1px 4px rgba(0, 0, 0, 0.12)' : 'none'
                }}
              >
                Diák
              </button>
            </div>

            <button
              onClick={handleCopy}
              title={copied ? 'Másolva!' : 'Idézet másolása'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: w === 1 ? '4px 6px' : '4px 9px',
                fontSize: '11px',
                fontWeight: 600,
                background: copied ? 'rgba(34, 197, 94, 0.15)' : 'var(--hover-bg)',
                color: copied ? '#16a34a' : 'var(--text-secondary)',
                border: '1px solid var(--panel-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                lineHeight: 1.2
              }}
            >
              {copied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {w > 1 && <span>Másolva</span>}
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {w > 1 && <span>Másolás</span>}
                </>
              )}
            </button>
          </div>
        </div>
        <div
          style={{
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            textAlign: 'center',
            padding: isCompactH ? '2px 6px' : (w === 1 ? '10px 4px' : '14px 12px'),
            fontSize: isCompactH ? (quoteText.length > 70 ? '12px' : '13px') : (w >= 3 ? '18px' : (w >= 2 ? '17px' : (h >= 2 ? '15px' : '13px'))),
            lineHeight: isCompactH ? 1.3 : 1.5,
            fontWeight: 500,
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: isCompactH ? '2px' : '8px',
            width: '100%',
            cursor: 'pointer',
            userSelect: 'text',
            overflow: 'hidden'
          }}
          onClick={() => {
            if (window.getSelection && window.getSelection().toString().trim().length > 0) return;
            setQuoteOffset((prev) => prev + 1);
          }}
          title="Kattints új idézetért!"
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>"{quoteText}"</span>
          <div style={{ fontSize: isCompactH ? '11px' : (w === 1 ? '12px' : '13px'), fontWeight: 'bold', color: 'var(--text-secondary)', textAlign: 'right', marginTop: isCompactH ? '1px' : '2px', lineHeight: 1 }}>
            - {quoteAuthor}
          </div>
        </div>
      </div>
    </section>
  );
}
