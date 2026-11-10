const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf-8');

// Add state
if (!content.includes('isSidebarCollapsed')) {
  content = content.replace(
    /const \[isDarkTheme, setIsDarkTheme\] = useState[^\n]+\n/,
    match => match + `  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('ekreta_sidebar_collapsed') === 'true');\n  const toggleSidebar = () => { const nextState = !isSidebarCollapsed; setIsSidebarCollapsed(nextState); localStorage.setItem('ekreta_sidebar_collapsed', nextState); };\n`
  );
}

// Update aside tag
content = content.replace(
  /<aside className="sidebar glass-panel">/,
  `<aside className={\`sidebar glass-panel \${isSidebarCollapsed ? 'collapsed' : ''}\`}>`
);

// Update brand
content = content.replace(
  /<div className="brand">\s*<svg([\s\S]*?)<\/svg>\s*e-Kréta 2\.0\s*<\/div>/,
  `<div className="brand">
          <div className="brand-left">
            <svg$1</svg>
            <span className="brand-text">e-Kréta 2.0</span>
          </div>
          <button className="btn-icon" onClick={toggleSidebar} style={{ padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={isSidebarCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} /></svg>
          </button>
        </div>`
);

// Update nav items to wrap text in <span className="nav-text">
const navItems = [
  'Vezérlőpult',
  'Napló',
  'Üzenetek',
  'Órarend',
  'Csoportok és Diákok',
  'Tanári Eszközök',
  'Beállítások'
];
navItems.forEach(item => {
  const regex = new RegExp(`(<div className={\`nav-item[^\n]+\n\\s*<svg[\\s\\S]*?<\/svg>)\\s*${item}\\s*<\/div>`, 'g');
  content = content.replace(regex, `$1\n            <span className="nav-text">${item}</span>\n          </div>`);
});

// Update theme toggle text
content = content.replace(
  /Világos téma\s*<\/>/,
  `<span className="nav-text">Világos téma</span>\n              </>`
);
content = content.replace(
  /Sötét téma\s*<\/>/,
  `<span className="nav-text">Sötét téma</span>\n              </>`
);

fs.writeFileSync('src/App.jsx', content, 'utf-8');
console.log("Patched App.jsx successfully!");
