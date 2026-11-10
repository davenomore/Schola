const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(
  /const \[widgetOrder, setWidgetOrder\] = useState\(\(\) => \{[\s\S]*?\}\);/,
  `const [widgetPositions, setWidgetPositions] = useState(() => {
    const saved = localStorage.getItem('ekreta_widget_positions');
    const defaults = {
      upNext: { c: 1, r: 1 },
      classProgress: { c: 2, r: 1 },
      vacation: { c: 4, r: 1 },
      miniCalendar: { c: 1, r: 2 },
      miniTimer: { c: 2, r: 2 },
      messages: { c: 3, r: 2 },
      quickActions: { c: 4, r: 2 },
      quote: { c: 1, r: 3 },
      todos: { c: 2, r: 3 },
      postit: { c: 3, r: 3 },
      digitalClock: { c: 4, r: 3 },
      randomStudent: { c: 1, r: 4 },
      habitTracker: { c: 2, r: 4 },
      hydrationTracker: { c: 3, r: 4 },
      bookmarks: { c: 4, r: 4 },
      weather: { c: 1, r: 5 }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) { }
    }
    return defaults;
  });`
);

content = content.replace(
  /const handleDrop = \(e, targetKey\) => \{[\s\S]*?\}\;/g,
  `const handleDropEmpty = (e, c, r) => {
    if (!widgetSettings.editMode) return;
    const sourceKey = e.dataTransfer.getData('text/plain');
    if (!sourceKey || !widgetPositions[sourceKey]) return;
    setWidgetPositions(prev => {
      const n = { ...prev, [sourceKey]: { c, r } };
      localStorage.setItem('ekreta_widget_positions', JSON.stringify(n));
      return n;
    });
  };

  const handleDrop = (e, targetKey) => {
    if (!widgetSettings.editMode) return;
    const sourceKey = e.dataTransfer.getData('text/plain');
    if (sourceKey === targetKey || !sourceKey || !widgetPositions[sourceKey] || !widgetPositions[targetKey]) return;
    setWidgetPositions(prev => {
      const n = { ...prev };
      const temp = n[targetKey];
      n[targetKey] = n[sourceKey];
      n[sourceKey] = temp;
      localStorage.setItem('ekreta_widget_positions', JSON.stringify(n));
      return n;
    });
  };`
);

content = content.replace(
  /gridColumn:\s*\`span \$\{widgetSizes\.([a-zA-Z]+)\}\`,\s*gridRow:\s*\`span \$\{widgetHeights\.\1\}\`([\s\S]*?)order:\s*widgetOrder\.indexOf\('\1'\)[^,]+,\s*position:\s*'relative'/g,
  "gridColumn: `${widgetPositions.$1?.c || 1} / span ${widgetSizes.$1}`, gridRow: `${widgetPositions.$1?.r || 1} / span ${widgetHeights.$1}`$2position: 'relative', zIndex: 1"
);

content = content.replace(
  /gridAutoRows: 'minmax\(0, 1fr\)',\s*gap: '12px',\s*alignContent: 'stretch',\s*height: '100%',\s*minHeight: 0,\s*gridAutoFlow: widgetSettings\.autoFillGrid \? 'dense' : 'row',/g,
  `gridAutoRows: 'minmax(140px, auto)', 
              gap: '12px', 
              alignContent: 'start',
              height: '100%',
              minHeight: 0,
              position: 'relative',`
);

// Insert drop zones
content = content.replace(
  /\{\/\* Sidebar Section \*\/\}\s*<div\s*style=\{\{/,
  `{/* Sidebar Section */}
          <div 
            style={{`
);

// We need to inject the dropzones right after the <div style={{ ... }}>
content = content.replace(
  /(minHeight: '600px'\s*\}\s*:\s*\{\})\s*\}\s*>/,
  `$1
            }}
          >
            {widgetSettings.editMode && Array.from({ length: 32 }).map((_, i) => {
               const r = Math.floor(i / 4) + 1;
               const c = (i % 4) + 1;
               return (
                 <div 
                   key={\`cell-\${c}-\${r}\`}
                   style={{ 
                     gridColumn: c, gridRow: r, 
                     border: '1px dashed rgba(255,255,255,0.1)', 
                     borderRadius: '4px',
                     zIndex: 0,
                     minHeight: '140px'
                   }}
                   onDragOver={handleDragOver}
                   onDrop={(e) => handleDropEmpty(e, c, r)}
                 />
               );
            })}`
);

fs.writeFileSync('src/App.jsx', content);
