const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Add widgetHeights state
const heightsCode = `  const [widgetHeights, setWidgetHeights] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_heights');
    return saved ? JSON.parse(saved) : {
      upNext: 1, classProgress: 1, vacation: 1, miniCalendar: 3, miniTimer: 2, messages: 2, quickActions: 2, quote: 2, todos: 3, postit: 2
    };
  });
  const changeWidgetHeight = (key, h) => {
    if (h < 1 || h > 10) return;
    setWidgetHeights(prev => { const n = {...prev, [key]: h}; localStorage.setItem('ekreta_widget_heights', JSON.stringify(n)); return n; });
  };
`;
content = content.replace(/(  const toggleWidgetSize = \(key\) => \{)/, heightsCode + "\n$1");

// 2. Add widgetOrder state and drag handlers
const orderCode = `  const [widgetOrder, setWidgetOrder] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_order');
    return saved ? JSON.parse(saved) : ['upNext', 'classProgress', 'vacation', 'miniCalendar', 'miniTimer', 'messages', 'quickActions', 'quote', 'todos', 'postit'];
  });
  const handleDragStart = (e, key) => {
    if (!widgetSettings.editMode) { e.preventDefault(); return; }
    e.dataTransfer.setData('text/plain', key);
  };
  const handleDragOver = (e) => {
    if (!widgetSettings.editMode) return;
    e.preventDefault();
  };
  const handleDrop = (e, targetKey) => {
    if (!widgetSettings.editMode) return;
    const sourceKey = e.dataTransfer.getData('text/plain');
    if (sourceKey === targetKey || !sourceKey) return;
    setWidgetOrder(prev => {
      const arr = [...prev];
      const srcIdx = arr.indexOf(sourceKey);
      arr.splice(srcIdx, 1);
      const tgtIdx = arr.indexOf(targetKey);
      arr.splice(tgtIdx, 0, sourceKey);
      localStorage.setItem('ekreta_widget_order', JSON.stringify(arr));
      return arr;
    });
  };
`;
content = content.replace(/(  const WidgetResizer = )/, orderCode + "\n$1");

// 3. Replace WidgetResizer
const newResizer = `  const WidgetResizer = ({ widgetKey, w, h }) => {
    if (!widgetSettings.editMode) return null;
    return (
      <>
        <div 
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '24px', cursor: 'ew-resize', zIndex: 10 }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.target.setPointerCapture(e.pointerId);
            const startX = e.clientX;
            const handlePointerMove = (moveEvent) => {
               const diff = moveEvent.clientX - startX;
               if (w === 1 && diff > 40) { toggleWidgetSize(widgetKey); cleanup(); }
               else if (w === 2 && diff < -40) { toggleWidgetSize(widgetKey); cleanup(); }
            };
            const cleanup = () => { window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerup', cleanup); };
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', cleanup);
          }}
        >
          <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '24px', background: 'var(--text-secondary)', opacity: 0.5, borderRadius: '2px' }} />
        </div>
        <div 
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', cursor: 'ns-resize', zIndex: 10 }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.target.setPointerCapture(e.pointerId);
            const startY = e.clientY;
            const handlePointerMove = (moveEvent) => {
               const diff = moveEvent.clientY - startY;
               if (diff > 40) { changeWidgetHeight(widgetKey, h + 1); cleanup(); }
               else if (diff < -40) { changeWidgetHeight(widgetKey, h - 1); cleanup(); }
            };
            const cleanup = () => { window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerup', cleanup); };
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', cleanup);
          }}
        >
          <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', height: '4px', width: '24px', background: 'var(--text-secondary)', opacity: 0.5, borderRadius: '2px' }} />
        </div>
      </>
    );
  };
`;
content = content.replace(/const WidgetResizer = \(\{ widgetKey, size \}\) => \{[\s\S]*?opacity: 0\.5, borderRadius: '2px' \}\} \/>\n      <\/div>\n    \);\n  \};/m, newResizer);

// 4. Update grid container
content = content.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(2, minmax\(0, 1fr\)\)', gap: '16px', alignContent: 'start' \}\}>/, `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridAutoRows: '80px', gap: '16px', alignContent: 'start' }}>`);

// 5. Update each section
const widgets = ['upNext', 'classProgress', 'vacation', 'miniCalendar', 'miniTimer', 'messages', 'quickActions', 'quote', 'todos', 'postit'];
for (const key of widgets) {
  const regexSection = new RegExp(`(<section className="card glass-panel animate-fade-in delay-2" style={{)([^}]*?gridColumn: \`span \\\${widgetSizes.${key}}\`)(.*?)}}>`);
  content = content.replace(regexSection, `$1$2, gridRow: \`span \${widgetHeights.${key}}\`, overflow: 'hidden', order: widgetOrder.indexOf('${key}') !== -1 ? widgetOrder.indexOf('${key}') : 99$3}} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, '${key}')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, '${key}')}>`);
  
  const regexResizer = new RegExp(`<WidgetResizer widgetKey="${key}" size={widgetSizes.${key}} />`);
  content = content.replace(regexResizer, `<WidgetResizer widgetKey="${key}" w={widgetSizes.${key}} h={widgetHeights.${key}} />`);
}

// 6. Make textareas height 100% so they expand inside the grid
content = content.replace(/height: '100px', background: 'transparent'/g, "height: '100%', background: 'transparent'");

fs.writeFileSync('src/App.jsx', content, 'utf-8');
console.log('App.jsx updated with 2D resizer and Dnd.');
