const fs = require('fs');
const path = './src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Make dashboard-grid 1fr
content = content.replace(
  /<div className="dashboard-grid">/,
  '<div className="dashboard-grid" style={{ gridTemplateColumns: \'1fr\' }}>'
);

// 2. Extract schedule section
const startStr = '<section className="card glass-panel animate-fade-in delay-1" style={{ display: \'flex\', flexDirection: \'column\', height: \'100%\', minHeight: 0 }}>';
const endStr = '</section>\n\n          {/* Sidebar Section */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  let scheduleSection = content.substring(startIndex, endIndex + '</section>'.length);
  
  // modify scheduleSection to be a widget
  scheduleSection = scheduleSection.replace(
    /<section className="card glass-panel animate-fade-in delay-1" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>/,
    `<section className="card glass-panel animate-fade-in delay-1" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gridColumn: \`\${widgetPositions.schedule?.c || 1} / span 2\`, gridRow: \`\${widgetPositions.schedule?.r || 1} / span 6\`, position: 'relative', zIndex: 1 }} draggable={widgetSettings.editMode} onDragStart={(e) => handleDragStart(e, 'schedule')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'schedule')}>`
  );

  // remove it from original place
  content = content.substring(0, startIndex) + '{/* Schedule Moved */}\n' + content.substring(endIndex + '</section>'.length);

  // 3. Put it inside the Sidebar Section grid
  const gridTargetsStr = '{/* Grid Background/Drop Targets */}';
  content = content.replace(gridTargetsStr, scheduleSection + '\n            ' + gridTargetsStr);
}

// 4. Update grid 
content = content.replace(
  /gridTemplateColumns: 'repeat\(4, minmax\(0, 1fr\)\)'/,
  "gridTemplateColumns: 'repeat(6, minmax(0, 1fr))'"
);
content = content.replace(
  /Array\.from\(\{ length: 24 \}\)/,
  "Array.from({ length: 36 })"
);
content = content.replace(
  /const r = Math\.floor\(i \/ 4\) \+ 1;/,
  "const r = Math.floor(i / 6) + 1;"
);
content = content.replace(
  /const c = \(i % 4\) \+ 1;/,
  "const c = (i % 6) + 1;"
);

// 5. Update widgetPositions defaults
const oldDefaults = `    const defaults = {
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
    };`;

const newDefaults = `    const defaults = {
      schedule: { c: 1, r: 1 },
      upNext: { c: 3, r: 1 },
      classProgress: { c: 4, r: 1 },
      vacation: { c: 6, r: 1 },
      miniCalendar: { c: 3, r: 2 },
      miniTimer: { c: 4, r: 2 },
      messages: { c: 5, r: 2 },
      quickActions: { c: 6, r: 2 },
      quote: { c: 3, r: 3 },
      todos: { c: 4, r: 3 },
      postit: { c: 5, r: 3 },
      digitalClock: { c: 6, r: 3 },
      randomStudent: { c: 3, r: 4 },
      habitTracker: { c: 4, r: 4 },
      hydrationTracker: { c: 5, r: 4 },
      bookmarks: { c: 6, r: 4 },
      weather: { c: 3, r: 5 }
    };`;

content = content.replace(oldDefaults, newDefaults);

fs.writeFileSync(path, content);
console.log('Update complete');
