import { Link } from 'react-router-dom';
import { Timer, Disc, Shuffle, ChevronRight, Wrench } from 'lucide-react';

const Tools = () => {
  const tools = [
    {
      id: 'timer',
      title: 'Órai Időzítő',
      description: 'Vizuális visszaszámláló tanórákhoz',
      icon: <Timer size={28} color="#58a6ff" />,
      path: '/timer',
      color: 'rgba(88,166,255,0.1)',
      border: 'rgba(88,166,255,0.3)'
    },
    {
      id: 'spinwheel',
      title: 'Szerencsekerék',
      description: 'Véletlen felelő választó a diákok közül',
      icon: <Disc size={28} color="#d29922" />,
      path: '/spinwheel',
      color: 'rgba(210,153,34,0.1)',
      border: 'rgba(210,153,34,0.3)'
    },
    {
      id: 'teams',
      title: 'Csoportbontó',
      description: 'Véletlen csapatgenerátor az osztálynak',
      icon: <Shuffle size={28} color="#3fb950" />,
      path: '/teams',
      color: 'rgba(63,185,80,0.1)',
      border: 'rgba(63,185,80,0.3)'
    }
  ];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>
      
      {/* Fejléc */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Wrench size={24} color="var(--accent-blue)" />
        <h2 style={{ margin: 0, fontSize: '22px' }}>Segédeszközök</h2>
      </div>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
        Gyors elérésű interaktív tanári eszközök.
      </p>

      {/* Rácsos kártyák */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '16px' }}>
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className="glass-panel"
            style={{
              textDecoration: 'none',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              transition: 'transform 0.2s, background 0.2s',
              background: 'var(--bg-surface-glass)'
            }}
          >
            {/* Ikon doboz */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: tool.color,
              border: `1px solid ${tool.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {tool.icon}
            </div>

            {/* Szöveg */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {tool.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                {tool.description}
              </div>
            </div>

            {/* Nyíl */}
            <div style={{ color: 'var(--text-secondary)' }}>
              <ChevronRight size={20} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Tools;
