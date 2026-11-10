const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Add new widgets to widgetSettings defaults
content = content.replace(/showMiniTimer: false\n    };/g, "showMiniTimer: false,\n      showTodos: true,\n      showPostit: true,\n      showQuote: true,\n      editMode: false\n    };");

// 2. Add sizes to widgetSizes defaults
content = content.replace(/quickActions: 2\n    };/g, "quickActions: 2,\n      todos: 2,\n      postit: 1,\n      quote: 2\n    };");

// 3. Add states for Todos and Postit inside App component
const stateCode = `  // Todos state
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('ekreta_todos');
    return saved ? JSON.parse(saved) : [{ id: 1, text: '11.A dolgozatok javítása', done: false }, { id: 2, text: 'E-mail a szülőnek', done: true }];
  });
  useEffect(() => { localStorage.setItem('ekreta_todos', JSON.stringify(todos)); }, [todos]);

  // Post-it state
  const [postit, setPostit] = useState(() => localStorage.getItem('ekreta_postit') || 'Ne felejtsd el feladni a pénteki leckét!');
  useEffect(() => { localStorage.setItem('ekreta_postit', postit); }, [postit]);

  const quotes = [
    "A jó tanár megmagyarázza, a kiváló tanár demonstrálja, a nagyszerű tanár inspirálja. - William Arthur Ward",
    "A tanulás az az egyetlen dolog, ami sosem meríti ki az elmét, sosem félemlíti meg és sosem bánja meg. - Leonardo da Vinci",
    "Nem az a tudás, hogy mennyi mindent tudsz, hanem hogy tudod, mit kezdj vele. - Ismeretlen",
    "A gyermekek nem arra vágynak, hogy tökéletes legyél, hanem hogy ott legyél nekik. - Ismeretlen",
    "A tanítás az az optimizmus legnagyobb aktusa. - Colleen Wilcox"
  ];
  const dailyQuote = quotes[Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) % quotes.length];
`;
content = content.replace(/(  const \[widgetSettings, setWidgetSettings\] = useState\(\(\) => \{)/, stateCode + "\n$1");

// 4. Add WidgetResizer component and editMode toggle
const resizerComponent = `  const WidgetResizer = ({ widgetKey, size }) => {
    if (!widgetSettings.editMode) return null;
    return (
      <div 
        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '24px', cursor: 'ew-resize', background: 'rgba(128,128,128,0.1)', borderLeft: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '0 12px 12px 0' }}
        onPointerDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const handlePointerMove = (moveEvent) => {
             const diff = moveEvent.clientX - startX;
             if (size === 1 && diff > 40) {
                 toggleWidgetSize(widgetKey);
                 cleanup();
             } else if (size === 2 && diff < -40) {
                 toggleWidgetSize(widgetKey);
                 cleanup();
             }
          };
          const cleanup = () => {
             window.removeEventListener('pointermove', handlePointerMove);
             window.removeEventListener('pointerup', cleanup);
          };
          window.addEventListener('pointermove', handlePointerMove);
          window.addEventListener('pointerup', cleanup);
        }}
      >
        <div style={{ width: '4px', height: '24px', background: 'var(--text-secondary)', opacity: 0.5, borderRadius: '2px' }} />
      </div>
    );
  };
`;
content = content.replace(/(localStorage\.setItem\('ekreta_widget_sizes', JSON\.stringify\(newSizes\)\);\n  };)/, "$1\n\n" + resizerComponent);

// 5. Replace existing buttons with WidgetResizer
content = content.replace(/<button onClick=\{\(\) => toggleWidgetSize\('([^']+)'\)\} className="widget-resize-btn" title="Átméretezés">⤡<\/button>/g, "<WidgetResizer widgetKey=\"$1\" size={widgetSizes.$1} />");

// 6. Add new widgets to the sidebar
const newWidgets = `
            {/* Napi Motiváció Widget */}
            {widgetSettings.showQuote && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ gridColumn: \`span \${widgetSizes.quote}\`, position: 'relative' }}>
                <WidgetResizer widgetKey="quote" size={widgetSizes.quote} />
                <div style={{ fontStyle: 'italic', color: 'var(--text-primary)', textAlign: 'center', padding: '12px 8px', fontSize: '14px', lineHeight: 1.5 }}>
                  "{dailyQuote.split(' - ')[0]}"
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>- {dailyQuote.split(' - ')[1]}</div>
                </div>
              </section>
            )}

            {/* Gyors Teendők (To-Do) Widget */}
            {widgetSettings.showTodos && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ gridColumn: \`span \${widgetSizes.todos}\`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <WidgetResizer widgetKey="todos" size={widgetSizes.todos} />
                <div className="card-title" style={{ marginBottom: '12px' }}>Gyors Teendők</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {todos.map(todo => (
                    <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px' }} onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))}>
                       <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--accent-color)', background: todo.done ? 'var(--accent-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {todo.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                       </div>
                       <span style={{ fontSize: '13px', color: todo.done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</span>
                    </div>
                  ))}
                  <input type="text" placeholder="Új teendő hozzáadása..." className="input-field" style={{ marginTop: 'auto', padding: '8px 12px', fontSize: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: 'none' }} onKeyDown={(e) => {
                    if(e.key === 'Enter' && e.target.value.trim()) {
                       setTodos([...todos, { id: Date.now(), text: e.target.value.trim(), done: false }]);
                       e.target.value = '';
                    }
                  }} />
                </div>
              </section>
            )}

            {/* Post-it / Gyors Jegyzet Widget */}
            {widgetSettings.showPostit && (
              <section className="card glass-panel animate-fade-in delay-2" style={{ gridColumn: \`span \${widgetSizes.postit}\`, position: 'relative', background: 'var(--accent-color)', color: '#fff' }}>
                <WidgetResizer widgetKey="postit" size={widgetSizes.postit} />
                <div className="card-title" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>Gyors Jegyzet</div>
                <textarea 
                  value={postit}
                  onChange={(e) => setPostit(e.target.value)}
                  style={{ width: '100%', height: '100px', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                  placeholder="Írj ide valami fontosat..."
                />
              </section>
            )}
`;
content = content.replace(/(          <\/div>\n\n          \{activeTab === 'osztálynapló' && \()/, newWidgets + "\n$1");

// 7. Add toggles in Beállítások
const toggles = `
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Widgetek szerkesztése (Húzd a szélüket)</span>
                      <label className="switch">
                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={!!widgetSettings.editMode} onChange={(e) => updateWidgetSetting('editMode', e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>Gyors Teendők (To-Do List)</span>
                      <label className="switch">
                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={!!widgetSettings.showTodos} onChange={(e) => updateWidgetSetting('showTodos', e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>Post-it / Gyors Jegyzet</span>
                      <label className="switch">
                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={!!widgetSettings.showPostit} onChange={(e) => updateWidgetSetting('showPostit', e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '14px' }}>Napi Motiváció (Idézet)</span>
                      <label className="switch">
                        <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={!!widgetSettings.showQuote} onChange={(e) => updateWidgetSetting('showQuote', e.target.checked)} />
                        <span className="slider"></span>
                      </label>
                    </div>
`;
content = content.replace(/(<h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>Widgetek Beállításai<\/h4>)/, "$1\n" + toggles);

fs.writeFileSync('src/App.jsx', content, 'utf-8');
console.log('App.jsx updated with dragging resize and 3 new widgets.');
