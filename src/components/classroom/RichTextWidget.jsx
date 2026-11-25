import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Rnd } from 'react-rnd';

const FONT_OPTIONS = [
  { label: 'Sans', value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Serif', value: "Georgia, Cambria, 'Times New Roman', serif" },
  { label: 'Mono', value: "'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace" },
  { label: 'Handwriting', value: "'Caveat', 'Comic Sans MS', cursive" }
];

const BG_THEMES = [
  { label: 'Fehér', bg: '#ffffff', text: '#0f172a', border: '#e2e8f0' },
  { label: 'Post-it Sárga', bg: '#fefce8', text: '#1c1917', border: '#fef08a' },
  { label: 'Menta Zöld', bg: '#f0fdf4', text: '#064e3b', border: '#bbf7d0' },
  { label: 'Égkék', bg: '#eff6ff', text: '#1e3a8a', border: '#bfdbfe' },
  { label: 'Halvány Rózsaszín', bg: '#fdf2f8', text: '#831843', border: '#fbcfe8' },
  { label: 'Sötét Tábla', bg: '#1e293b', text: '#f8fafc', border: '#334155' }
];

const TEXT_COLORS = [
  '#0f172a', '#475569', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed', '#db2777'
];

const HIGHLIGHT_COLORS = [
  { label: 'Sárga', value: '#ffff00' },
  { label: 'Zöld', value: '#bbf7d0' },
  { label: 'Kék', value: '#bae6fd' },
  { label: 'Rózsaszín', value: '#fbcfe8' },
  { label: 'Narancs', value: '#fed7aa' },
  { label: 'Nincs', value: 'transparent' }
];

export default function RichTextWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 90, y: widget.y || 70 });
  const [size, setSize] = useState({ width: 720, height: 420 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 90, y: widget.y || 70 }, size: { width: 720, height: 420 } });

  // Pages
  const [pages, setPages] = useState([{ id: 1, content: '' }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isEmpty, setIsEmpty] = useState(true);

  // Formatting state
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontLabel, setFontLabel] = useState(FONT_OPTIONS[0].label);
  const [fontSize, setFontSize] = useState(16);
  const [align, setAlign] = useState('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState('#0f172a');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [bgTheme, setBgTheme] = useState(BG_THEMES[0]);
  const [paperPattern, setPaperPattern] = useState('plain'); // 'plain' | 'lined' | 'grid'

  // Popups / Menus
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
  const [showBgPalette, setShowBgPalette] = useState(false);
  const [showPatternMenu, setShowPatternMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  const editorRef = useRef(null);

  // Close popups when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.rich-text-popup-container')) {
        setShowFontMenu(false);
        setShowTextColorPicker(false);
        setShowHighlightColorPicker(false);
        setShowBgPalette(false);
        setShowPatternMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update button states on selection/caret change
  const updateActiveStates = useCallback(() => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      if (document.queryCommandState('justifyCenter')) setAlign('center');
      else if (document.queryCommandState('justifyRight')) setAlign('right');
      else setAlign('left');
    } catch {
      // Ignored if queryCommandState is unavailable
    }
  }, []);

  // Format commands helper
  const execCmd = (cmd, val = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false, val);
    updateActiveStates();
  };

  // Change font size
  const handleFontSizeChange = (delta) => {
    const newSize = Math.max(10, Math.min(64, fontSize + delta));
    setFontSize(newSize);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        const span = document.createElement('span');
        span.style.fontSize = `${newSize}px`;
        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
          selection.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.addRange(newRange);
          return;
        } catch {
          // fallback
        }
      }
    }
  };

  // Apply font family
  const handleSelectFont = (f) => {
    setFontFamily(f.value);
    setFontLabel(f.label);
    setShowFontMenu(false);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        const span = document.createElement('span');
        span.style.fontFamily = f.value;
        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
          selection.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.addRange(newRange);
          return;
        } catch {
          // fallback
        }
      }
    }
  };

  // Text color
  const handleTextColor = (c) => {
    setTextColor(c);
    setShowTextColorPicker(false);
    execCmd('foreColor', c);
  };

  // Highlight color
  const handleHighlightColor = (c) => {
    setHighlightColor(c);
    setShowHighlightColorPicker(false);
    execCmd('hiliteColor', c);
  };

  // Link insert
  const handleInsertLink = () => {
    if (linkInput.trim()) {
      let url = linkInput.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      execCmd('createLink', url);
    }
    setLinkInput('');
    setShowLinkModal(false);
  };

  // Handle page change
  const saveCurrentPageContent = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const text = editorRef.current.innerText || '';
      setIsEmpty(text.trim().length === 0);
      setPages((prev) => {
        const copy = [...prev];
        if (copy[currentPage]) {
          copy[currentPage] = { ...copy[currentPage], content: currentHtml };
        }
        return copy;
      });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      saveCurrentPageContent();
      const prevIdx = currentPage - 1;
      setCurrentPage(prevIdx);
      if (editorRef.current) {
        editorRef.current.innerHTML = pages[prevIdx]?.content || '';
        setIsEmpty((editorRef.current.innerText || '').trim().length === 0);
      }
    }
  };

  const goToNextPage = () => {
    saveCurrentPageContent();
    if (currentPage < pages.length - 1) {
      const nextIdx = currentPage + 1;
      setCurrentPage(nextIdx);
      if (editorRef.current) {
        editorRef.current.innerHTML = pages[nextIdx]?.content || '';
        setIsEmpty((editorRef.current.innerText || '').trim().length === 0);
      }
    } else {
      const newPage = { id: Date.now(), content: '' };
      setPages((prev) => [...prev, newPage]);
      setCurrentPage(pages.length);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        setIsEmpty(true);
      }
    }
  };

  // Toggle maximize
  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDims.current = { position, size };
      setPosition({ x: 20, y: 20 });
      setSize({ width: 'calc(100% - 40px)', height: 'calc(100% - 90px)' });
      setIsMaximized(true);
    } else {
      setPosition(prevDims.current.position);
      setSize(prevDims.current.size);
      setIsMaximized(false);
    }
  };

  const isDarkBg = bgTheme.bg === '#1e293b';

  // Paper pattern styles
  const getPatternStyle = () => {
    if (paperPattern === 'lined') {
      return {
        backgroundImage: isDarkBg
          ? 'repeating-linear-gradient(transparent, transparent 27px, rgba(255,255,255,0.08) 28px)'
          : 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.06) 28px)',
        backgroundAttachment: 'local'
      };
    }
    if (paperPattern === 'grid') {
      return {
        backgroundImage: isDarkBg
          ? 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)'
          : 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundAttachment: 'local'
      };
    }
    return {};
  };

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
        updateWidgetBounds?.(widget.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, pos) => {
        const newW = ref.offsetWidth;
        const newH = ref.offsetHeight;
        setSize({ width: newW, height: newH });
        setPosition(pos);
        updateWidgetBounds?.(widget.id, { ...pos, width: newW, height: newH });
      }}
      minWidth={440}
      minHeight={220}
      bounds="parent"
      dragHandleClassName="rich-text-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 80 : 25 }}
    >
      <div
        className={`glass-panel ${isDarkBg ? 'rich-text-dark' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          background: bgTheme.bg,
          color: bgTheme.text,
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          border: `1px solid ${bgTheme.border || 'var(--panel-border, #e4e4e7)'}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'background-color 0.2s ease, border-color 0.2s ease'
        }}
      >
        {/* Top Header & Toolbar */}
        <div
          className="rich-text-drag-handle"
          style={{
            padding: '7px 12px',
            background: isDarkBg ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            borderBottom: isDarkBg ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            userSelect: 'none',
            position: 'relative',
            cursor: 'grab'
          }}
        >
          {/* Left tools group (scrollable if narrow) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {/* Drag Grip (6 dots) */}
          <div
            title="Mozgatás"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 4px',
              color: isDarkBg ? 'rgba(255,255,255,0.4)' : '#94a3b8',
              cursor: 'grab'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </div>

          {/* Undo / Redo */}
          <button
            type="button"
            className="rich-text-toolbar-btn"
            title="Visszavonás (Ctrl+Z)"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd('undo');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            type="button"
            className="rich-text-toolbar-btn"
            title="Mégis (Ctrl+Y)"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd('redo');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '18px', background: isDarkBg ? 'rgba(255,255,255,0.15)' : '#cbd5e1', margin: '0 2px' }} />

          {/* Alignment: Left, Center, Right */}
          <button
            type="button"
            className={`rich-text-toolbar-btn ${align === 'left' ? 'active' : ''}`}
            title="Balra zárt"
            onMouseDown={(e) => {
              e.preventDefault();
              setAlign('left');
              execCmd('justifyLeft');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="14" y2="12" />
              <line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            className={`rich-text-toolbar-btn ${align === 'center' ? 'active' : ''}`}
            title="Középre zárt"
            onMouseDown={(e) => {
              e.preventDefault();
              setAlign('center');
              execCmd('justifyCenter');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            className={`rich-text-toolbar-btn ${align === 'right' ? 'active' : ''}`}
            title="Jobbra zárt"
            onMouseDown={(e) => {
              e.preventDefault();
              setAlign('right');
              execCmd('justifyRight');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="6" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '18px', background: isDarkBg ? 'rgba(255,255,255,0.15)' : '#cbd5e1', margin: '0 2px' }} />

          {/* Bold, Italic, Underline */}
          <button
            type="button"
            className={`rich-text-toolbar-btn ${isBold ? 'active' : ''}`}
            title="Félkövér (Ctrl+B)"
            style={{ width: '26px' }}
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd('bold');
            }}
          >
            <span style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'serif' }}>B</span>
          </button>
          <button
            type="button"
            className={`rich-text-toolbar-btn ${isItalic ? 'active' : ''}`}
            title="Dőlt (Ctrl+I)"
            style={{ width: '26px' }}
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd('italic');
            }}
          >
            <span style={{ fontStyle: 'italic', fontWeight: 600, fontSize: '13px', fontFamily: 'serif' }}>I</span>
          </button>
          <button
            type="button"
            className={`rich-text-toolbar-btn ${isUnderline ? 'active' : ''}`}
            title="Aláhúzott (Ctrl+U)"
            style={{ width: '26px' }}
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd('underline');
            }}
          >
            <span style={{ textDecoration: 'underline', fontWeight: 600, fontSize: '13px', fontFamily: 'serif' }}>U</span>
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '18px', background: isDarkBg ? 'rgba(255,255,255,0.15)' : '#cbd5e1', margin: '0 2px' }} />

          {/* Font Selector: T Sans */}
          <div className="rich-text-popup-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className="rich-text-toolbar-btn"
              title="Betűtípus választása"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowFontMenu(!showFontMenu);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 7px', fontSize: '12px' }}
            >
              <span style={{ fontWeight: 'bold', fontFamily: 'serif', fontSize: '13px' }}>T</span>
              <span style={{ fontWeight: 500 }}>{fontLabel}</span>
            </button>

            {showFontMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: isDarkBg ? '#0f172a' : '#ffffff',
                  color: isDarkBg ? '#ffffff' : '#0f172a',
                  border: isDarkBg ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  zIndex: 100,
                  minWidth: '130px',
                  padding: '4px'
                }}
              >
                {FONT_OPTIONS.map((f) => (
                  <div
                    key={f.label}
                    onClick={() => handleSelectFont(f)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontFamily: f.value,
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: fontLabel === f.label ? (isDarkBg ? 'rgba(255,255,255,0.12)' : '#f1f5f9') : 'transparent'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDarkBg ? 'rgba(255,255,255,0.08)' : '#f8fafc')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = fontLabel === f.label ? (isDarkBg ? 'rgba(255,255,255,0.12)' : '#f1f5f9') : 'transparent')
                    }
                  >
                    {f.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '18px', background: isDarkBg ? 'rgba(255,255,255,0.15)' : '#cbd5e1', margin: '0 2px' }} />

          {/* Font Size Control: – 16px + */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              type="button"
              className="rich-text-toolbar-btn"
              title="Betűméret csökkentése"
              style={{ width: '20px', height: '24px', padding: 0 }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleFontSizeChange(-2);
              }}
            >
              –
            </button>
            <span style={{ fontSize: '12px', fontWeight: 500, minWidth: '32px', textAlign: 'center', userSelect: 'none' }}>
              {fontSize}px
            </span>
            <button
              type="button"
              className="rich-text-toolbar-btn"
              title="Betűméret növelése"
              style={{ width: '20px', height: '24px', padding: 0 }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleFontSizeChange(2);
              }}
            >
              +
            </button>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '18px', background: isDarkBg ? 'rgba(255,255,255,0.15)' : '#cbd5e1', margin: '0 2px' }} />

          {/* Lists & Link */}
          <button
            type="button"
            className="rich-text-toolbar-btn"
            title="Felsorolás (Pontok)"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd('insertUnorderedList');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="9" y1="6" x2="20" y2="6" />
              <line x1="9" y1="12" x2="20" y2="12" />
              <line x1="9" y1="18" x2="20" y2="18" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className="rich-text-toolbar-btn"
            title="Számozott lista"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd('insertOrderedList');
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="10" y1="6" x2="20" y2="6" />
              <line x1="10" y1="12" x2="20" y2="12" />
              <line x1="10" y1="18" x2="20" y2="18" />
              <path d="M4 6h1v4" strokeWidth="1.5" />
              <path d="M3 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3v1h3" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            type="button"
            className="rich-text-toolbar-btn"
            title="Hivatkozás beszúrása"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowLinkModal(true);
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '18px', background: isDarkBg ? 'rgba(255,255,255,0.15)' : '#cbd5e1', margin: '0 2px' }} />

          {/* Color Swatches: Text color & Highlight color matching screenshot */}
          <div className="rich-text-popup-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {/* Text color box */}
            <button
              type="button"
              title="Szöveg színe"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowTextColorPicker(!showTextColorPicker);
                setShowHighlightColorPicker(false);
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: isDarkBg ? '#1e293b' : '#f1f5f9',
                border: '1.5px solid #475569',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  background: textColor
                }}
              />
            </button>

            {/* Highlight color box */}
            <button
              type="button"
              title="Kiemelés színe"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowHighlightColorPicker(!showHighlightColorPicker);
                setShowTextColorPicker(false);
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#fef9c3',
                border: '1.5px solid #eab308',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  background: highlightColor
                }}
              />
            </button>

            {/* Text Color Picker Popover */}
            {showTextColorPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '6px',
                  background: isDarkBg ? '#0f172a' : '#ffffff',
                  border: isDarkBg ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  padding: '8px',
                  zIndex: 100,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 24px)',
                  gap: '6px'
                }}
              >
                {TEXT_COLORS.map((c) => (
                  <div
                    key={c}
                    onClick={() => handleTextColor(c)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: c,
                      cursor: 'pointer',
                      border: textColor === c ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.15)'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Highlight Color Picker Popover */}
            {showHighlightColorPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '28px',
                  marginTop: '6px',
                  background: isDarkBg ? '#0f172a' : '#ffffff',
                  border: isDarkBg ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  padding: '8px',
                  zIndex: 100,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 24px)',
                  gap: '6px'
                }}
              >
                {HIGHLIGHT_COLORS.map((hc) => (
                  <div
                    key={hc.value}
                    title={hc.label}
                    onClick={() => handleHighlightColor(hc.value)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: hc.value === 'transparent' ? '#ffffff' : hc.value,
                      cursor: 'pointer',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: '#ef4444'
                    }}
                  >
                    {hc.value === 'transparent' ? '✕' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

          {/* Right controls cluster (Pinned to right, NEVER cut off) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: 'auto' }}>
            {/* Page navigation: < > */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              type="button"
              className="rich-text-toolbar-btn"
              title={`Előző oldal (${currentPage + 1}/${pages.length})`}
              disabled={currentPage === 0}
              onMouseDown={(e) => {
                e.preventDefault();
                goToPrevPage();
              }}
              style={{ opacity: currentPage === 0 ? 0.35 : 1, width: '22px', height: '24px', padding: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span style={{ fontSize: '11px', opacity: 0.7, padding: '0 2px' }}>
              {currentPage + 1}/{pages.length}
            </span>
            <button
              type="button"
              className="rich-text-toolbar-btn"
              title={currentPage < pages.length - 1 ? 'Következő oldal' : 'Új oldal hozzáadása'}
              onMouseDown={(e) => {
                e.preventDefault();
                goToNextPage();
              }}
              style={{ width: '22px', height: '24px', padding: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Background Palette */}
          <div className="rich-text-popup-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className="rich-text-toolbar-btn"
              title="Háttérszín és téma"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowBgPalette(!showBgPalette);
                setShowPatternMenu(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
            </button>

            {showBgPalette && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: isDarkBg ? '#0f172a' : '#ffffff',
                  border: isDarkBg ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  padding: '8px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minWidth: '150px'
                }}
              >
                {BG_THEMES.map((theme) => (
                  <div
                    key={theme.label}
                    onClick={() => {
                      setBgTheme(theme);
                      setShowBgPalette(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: bgTheme.bg === theme.bg ? (isDarkBg ? 'rgba(255,255,255,0.12)' : '#f1f5f9') : 'transparent'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDarkBg ? 'rgba(255,255,255,0.08)' : '#f8fafc')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        bgTheme.bg === theme.bg ? (isDarkBg ? 'rgba(255,255,255,0.12)' : '#f1f5f9') : 'transparent')
                    }
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: theme.bg,
                        border: '1px solid #94a3b8'
                      }}
                    />
                    <span>{theme.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pen / Pattern Icon */}
          <div className="rich-text-popup-container" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`rich-text-toolbar-btn ${paperPattern !== 'plain' ? 'active' : ''}`}
              title="Vonalazás / Füzet mintázat"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowPatternMenu(!showPatternMenu);
                setShowBgPalette(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>

            {showPatternMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: isDarkBg ? '#0f172a' : '#ffffff',
                  border: isDarkBg ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  padding: '6px',
                  zIndex: 100,
                  minWidth: '130px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}
              >
                <div
                  onClick={() => {
                    setPaperPattern('plain');
                    setShowPatternMenu(false);
                  }}
                  style={{
                    padding: '5px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    background: paperPattern === 'plain' ? (isDarkBg ? 'rgba(255,255,255,0.1)' : '#f1f5f9') : 'transparent'
                  }}
                >
                  Sima papír
                </div>
                <div
                  onClick={() => {
                    setPaperPattern('lined');
                    setShowPatternMenu(false);
                  }}
                  style={{
                    padding: '5px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    background: paperPattern === 'lined' ? (isDarkBg ? 'rgba(255,255,255,0.1)' : '#f1f5f9') : 'transparent'
                  }}
                >
                  Vonalas füzet
                </div>
                <div
                  onClick={() => {
                    setPaperPattern('grid');
                    setShowPatternMenu(false);
                  }}
                  style={{
                    padding: '5px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    background: paperPattern === 'grid' ? (isDarkBg ? 'rgba(255,255,255,0.1)' : '#f1f5f9') : 'transparent'
                  }}
                >
                  Négyzetrácsos
                </div>
              </div>
            )}
          </div>

          {/* Maximize / Restore */}
          <button
            type="button"
            className="rich-text-toolbar-btn"
            title={isMaximized ? 'Visszaállítás' : 'Teljes méret'}
            onMouseDown={(e) => {
              e.preventDefault();
              toggleMaximize();
            }}
          >
            {isMaximized ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>

          {/* Close Button */}
          <button
            type="button"
            className="rich-text-toolbar-btn"
            title="Bezárás"
            onMouseDown={(e) => {
              e.preventDefault();
              removeWidget(widget.id);
            }}
            style={{ color: 'var(--theme-red, #cc0000)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          </div>
        </div>

        {/* Link Input Modal */}
        {showLinkModal && (
          <div
            style={{
              padding: '8px 16px',
              background: isDarkBg ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
              borderBottom: isDarkBg ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              type="text"
              placeholder="https://pelda.hu"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInsertLink();
                if (e.key === 'Escape') setShowLinkModal(false);
              }}
              autoFocus
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: isDarkBg ? '#1e293b' : '#ffffff',
                color: 'inherit',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleInsertLink}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Beszúrás
            </button>
            <button
              onClick={() => setShowLinkModal(false)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'transparent',
                color: 'inherit',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Mégse
            </button>
          </div>
        )}

        {/* Writing Area with Placeholder */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {isEmpty && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '24px',
                color: '#94a3b8',
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily,
                pointerEvents: 'none',
                userSelect: 'none',
                lineHeight: 1.6
              }}
            >
              Write here...
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="rich-text-editor"
            onKeyUp={updateActiveStates}
            onMouseUp={updateActiveStates}
            onInput={saveCurrentPageContent}
            style={{
              flex: 1,
              padding: '20px 24px',
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              lineHeight: 1.6,
              outline: 'none',
              overflowY: 'auto',
              textAlign: align,
              wordBreak: 'break-word',
              ...getPatternStyle()
            }}
          />
        </div>
      </div>
    </Rnd>
  );
}
