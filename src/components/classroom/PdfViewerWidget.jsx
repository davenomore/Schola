import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';

// Sample worksheets embedded as structured practice sheets
const SAMPLE_DOCS = [
  {
    id: 'doc-1',
    title: 'Matematika - Másodfokú Egyenletek Gyakorló',
    pages: [
      {
        pageNumber: 1,
        title: 'I. Rész: Alapfeladatok és Diszkrimináns',
        content: [
          '1. Határozd meg a következő másodfokú egyenlet diszkriminánsát és valós gyökeinek számát!',
          '    a)  x² - 6x + 9 = 0',
          '    b)  2x² + 5x - 3 = 0',
          '    c)  3x² - 2x + 5 = 0',
          '',
          '2. Oldd meg a valós számok halmazán a megoldóképlettel:',
          '    x₁,₂ = (-b ± √(b² - 4ac)) / (2a)',
          '    Feladat:  x² - 7x + 10 = 0'
        ]
      },
      {
        pageNumber: 2,
        title: 'II. Rész: Szöveges feladatok',
        content: [
          '3. Egy téglalap egyik oldala 4 cm-rel hosszabb a másiknál.',
          '   A téglalap területe 96 cm².',
          '   Mekkora a téglalap kerülete és az oldalak hossza?',
          '',
          '4. Két egymást követő természetes szám szorzata 156.',
          '   Melyik ez a két szám? Írj fel egyenletet!'
        ]
      }
    ]
  },
  {
    id: 'doc-2',
    title: 'Fizika - Newton Törvényei Munkafüzet',
    pages: [
      {
        pageNumber: 1,
        title: 'Dinamika alapjai - Erő és Gyorsulás',
        content: [
          '1. Fogalmazd meg Newton I. törvényét (a tehetetlenség törvényét)!',
          '   Milyen feltétel mellett marad egy test nyugalomban vagy egyenes vonalú egyenletes mozgásban?',
          '',
          '2. Számítási feladat: Egy 1200 kg tömegű gépkocsira 3600 N állandó fékezőerő hat.',
          '   a) Mekkora a gépkocsi lassulása (gyorsulása)?',
          '   b) Mennyi idő alatt áll meg, ha a kezdeti sebessége 72 km/h (20 m/s)?'
        ]
      }
    ]
  }
];

export default function PdfViewerWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 120, y: widget.y || 60 });
  const [size, setSize] = useState({ width: 720, height: 580 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 120, y: widget.y || 60 }, size: { width: 720, height: 580 } });

  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [uploadedDoc, setUploadedDoc] = useState(null);

  const activeDoc = uploadedDoc || SAMPLE_DOCS[selectedDocIndex];
  const pages = activeDoc.pages || [];
  const page = pages[currentPage] || { title: 'Oldal', content: [] };

  // Maximize / restore
  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDims.current = { position, size };
      setPosition({ x: 20, y: 20 });
      setSize({ width: 'calc(100% - 40px)', height: 'calc(100% - 70px)' });
      setIsMaximized(true);
    } else {
      setPosition(prevDims.current.position);
      setSize(prevDims.current.size);
      setIsMaximized(false);
    }
  };

  // File Upload Handler (Native binary handling for PDF and images)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const url = URL.createObjectURL(file);
      setUploadedDoc({
        title: file.name,
        isImage: true,
        imageUrl: url,
        pages: [{ pageNumber: 1, title: file.name, content: [] }]
      });
      setCurrentPage(0);
    } else if (isPdf) {
      // Create native browser blob URL for PDF rendering
      const url = URL.createObjectURL(file);
      setUploadedDoc({
        title: file.name,
        isPdf: true,
        pdfUrl: url,
        pages: [{ pageNumber: 1, title: file.name, content: [] }]
      });
      setCurrentPage(0);
    } else {
      // Plain text file (.txt)
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          setUploadedDoc({
            title: file.name,
            isText: true,
            pages: [
              {
                pageNumber: 1,
                title: file.name,
                content: lines
              }
            ]
          });
          setCurrentPage(0);
        }
      };
      reader.readAsText(file);
    }
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
      minWidth={360}
      minHeight={280}
      bounds="parent"
      dragHandleClassName="pdf-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 85 : 30 }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--panel-bg, #ffffff)',
          color: 'var(--text-primary, #18181b)',
          borderRadius: '8px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
          border: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header Bar */}
        <div
          className="pdf-drag-handle"
          style={{
            padding: '8px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            cursor: isMaximized ? 'default' : 'grab'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <span style={{ fontSize: '14px' }}>{activeDoc.isPdf ? '📕' : activeDoc.isImage ? '🖼️' : '📄'}</span>
              <span>MUNKAFÜZET</span>
              <span
                style={{
                  background: 'var(--hover-bg, rgba(0,0,0,0.05))',
                  border: '1px solid var(--panel-border, #e4e4e7)',
                  padding: '1px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  maxWidth: '180px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={activeDoc.title}
              >
                {activeDoc.title}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Open in new tab / download option */}
            {activeDoc.isPdf && activeDoc.pdfUrl && (
              <a
                href={activeDoc.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="rich-text-toolbar-btn"
                title="Megnyitás böngésző lapon"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}

            {/* File Upload Button */}
            <label
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '4px',
                border: '1px solid var(--panel-border, #e4e4e7)',
                background: 'var(--panel-bg, #ffffff)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              title="Saját PDF, kép vagy feladatlap megnyitása"
            >
              <span>📁 Megnyitás</span>
              <input
                type="file"
                accept="application/pdf,image/*,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            {/* Sample Document Selector */}
            {!uploadedDoc && (
              <select
                value={selectedDocIndex}
                onChange={(e) => {
                  setSelectedDocIndex(Number(e.target.value));
                  setCurrentPage(0);
                }}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--panel-border, #e4e4e7)',
                  background: 'var(--panel-bg, #ffffff)',
                  color: 'var(--text-primary, #18181b)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {SAMPLE_DOCS.map((doc, idx) => (
                  <option key={doc.id} value={idx}>{doc.title}</option>
                ))}
              </select>
            )}

            {/* Maximize */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={toggleMaximize}
              title={isMaximized ? 'Visszaállítás' : 'Teljes méret'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {isMaximized ? (
                  <>
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                ) : (
                  <>
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                )}
              </svg>
            </button>

            {/* Close */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => removeWidget(widget.id)}
              title="Bezárás"
              style={{ color: 'var(--theme-red, #cc0000)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Optional Secondary Sub-Toolbar ONLY for multi-page sample sheets or images (never shown for PDFs) */}
        {!activeDoc.isPdf && (pages.length > 1 || activeDoc.isImage) && (
          <div style={{
            padding: '6px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.015))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}>
            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {pages.length > 1 && (
                <>
                  <button
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 0 ? 0.4 : 1
                    }}
                  >
                    ◀
                  </button>
                  <span style={{ fontWeight: 600 }}>
                    {currentPage + 1} / {pages.length} oldal
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= pages.length - 1}
                    onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--panel-border)',
                      background: 'var(--panel-bg)',
                      cursor: currentPage >= pages.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage >= pages.length - 1 ? 0.4 : 1
                    }}
                  >
                    ▶
                  </button>
                </>
              )}
            </div>

            {/* Zoom controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 15))}
                style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', cursor: 'pointer' }}
                title="Kicsinyítés"
              >
                -
              </button>
              <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 600 }}>
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(180, prev + 15))}
                style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', cursor: 'pointer' }}
                title="Nagyítás"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Document Content Viewport */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: activeDoc.isPdf ? 'hidden' : 'auto',
            padding: activeDoc.isPdf ? '0' : '20px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {activeDoc.isPdf ? (
            /* Clean, Unobstructed Native PDF Document Embedding */
            <div style={{ width: '100%', height: '100%', position: 'relative', flex: 1, overflow: 'hidden' }}>
              <object
                data={`${activeDoc.pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block'
                }}
              >
                <iframe
                  src={`${activeDoc.pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={activeDoc.title}
                >
                  <div style={{ padding: '30px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '12px' }}>A PDF megnyitható az alábbi gombbal:</p>
                    <a
                      href={activeDoc.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '8px 16px',
                        background: 'var(--accent-color, #18181b)',
                        color: 'var(--badge-color, #ffffff)',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      PDF Megnyitása
                    </a>
                  </div>
                </iframe>
              </object>
            </div>
          ) : (
            /* Document Sheet Simulation for Images and Text Worksheets */
            <div
              style={{
                width: `${zoomLevel}%`,
                maxWidth: '900px',
                minWidth: '320px',
                margin: '0 auto',
                background: '#ffffff',
                color: '#18181b',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                border: '1px solid #e4e4e7',
                padding: '32px 36px',
                minHeight: '440px',
                position: 'relative',
                fontSize: `${Math.round(zoomLevel * 0.14)}px`,
                lineHeight: 1.6
              }}
            >
              {activeDoc.isImage ? (
                <img
                  src={activeDoc.imageUrl}
                  alt={activeDoc.title}
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
                />
              ) : (
                <div>
                  <div style={{ borderBottom: '2px solid #18181b', paddingBottom: '8px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#18181b' }}>
                      {activeDoc.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <span>{page.title}</span>
                      <span>Név: _______________________  Dátum: __________</span>
                    </div>
                  </div>

                  <div style={{ fontFamily: "'Inter', sans-serif" }}>
                    {page.content.map((line, idx) => (
                      <div
                        key={idx}
                        style={{
                          marginBottom: line.startsWith('    ') ? '6px' : '14px',
                          fontWeight: (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) ? 700 : 400,
                          color: line.startsWith('    ') ? '#27272a' : '#09090b',
                          fontFamily: line.includes('x₁') || line.includes('x²') ? "'Courier New', monospace" : 'inherit'
                        }}
                      >
                        {line || '\u00A0'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
