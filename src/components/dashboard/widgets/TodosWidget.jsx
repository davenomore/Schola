import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function TodosWidget({
  todos,
  setTodos,
  setTodoModalOpen,
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
  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.todos?.c || 1} / span ${widgetSizes.todos}`,
        gridRow: `${widgetPositions.todos?.r || 1} / span ${widgetHeights.todos}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'todos')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'todos')}
    >
      <WidgetResizer
        widgetKey="todos"
        w={widgetSizes.todos}
        h={widgetHeights.todos}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title">Teendők</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="todo-item group"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px', borderRadius: '4px', transition: 'background 0.2s' }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
                onClick={() => setTodos(todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    flexShrink: 0,
                    borderRadius: '4px',
                    border: '2px solid var(--accent-color)',
                    background: todo.done ? 'var(--accent-color)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {todo.done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg-color)" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      color: todo.done ? 'var(--text-secondary)' : 'var(--text-primary)',
                      textDecoration: todo.done ? 'line-through' : 'none',
                      wordBreak: 'break-word'
                    }}
                  >
                    {todo.text}
                  </span>
                  {(todo.deadline || todo.class || todo.lesson || (todo.priority && todo.priority !== 'Közepes')) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {todo.class && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {todo.class}
                        </span>
                      )}
                      {todo.lesson && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {todo.lesson}. óra
                        </span>
                      )}
                      {todo.deadline && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(128,128,128,0.1)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {todo.deadline}
                        </span>
                      )}
                      {todo.priority && todo.priority !== 'Közepes' && (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: todo.priority === 'Magas' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                            color: todo.priority === 'Magas' ? 'var(--danger)' : '#22c55e',
                            borderRadius: '4px'
                          }}
                        >
                          {todo.priority}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                className="delete-todo-btn"
                title="Törlés"
                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', opacity: 0.7, transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => (e.target.style.opacity = 1)}
                onMouseLeave={(e) => (e.target.style.opacity = 0.7)}
                onClick={(e) => {
                  e.stopPropagation();
                  setTodos(todos.filter((t) => t.id !== todo.id));
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <input
              type="text"
              placeholder="Új teendő hozzáadása (Enter)..."
              className="input-field"
              style={{ flex: 1, padding: '8px 12px', fontSize: '12px', borderRadius: '4px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', outline: 'none' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  setTodos([...todos, { id: Date.now(), text: e.target.value.trim(), done: false }]);
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={() => setTodoModalOpen(true)}
              className="btn-icon"
              style={{ padding: '8px', borderRadius: '4px', background: 'var(--hover-bg)', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}
              title="Részletes teendő felvétele"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
