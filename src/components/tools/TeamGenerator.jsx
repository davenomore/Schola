import React, { useState, useEffect } from 'react';

export default function TeamGenerator() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamSize, setTeamSize] = useState(3);

  useEffect(() => {
    const savedGroupsStr = localStorage.getItem('ekreta_groups');
    if (savedGroupsStr) {
      try {
        const parsed = JSON.parse(savedGroupsStr);
        setGroups(parsed);
        if (parsed.length > 0) {
          setSelectedGroup(parsed[0].id);
        }
      } catch (e) {
        console.error('Hiba a csoportok betöltésekor:', e);
      }
    }
  }, []);

  const generateTeams = () => {
    const group = groups.find((g) => g.id === selectedGroup);
    if (!group || !group.students || group.students.length === 0) {
      alert('Ebben a csoportban nincsenek diákok!');
      return;
    }

    const shuffled = [...group.students].sort(() => 0.5 - Math.random());
    const newTeams = [];

    for (let i = 0; i < shuffled.length; i += teamSize) {
      newTeams.push(shuffled.slice(i, i + teamSize));
    }

    setTeams(newTeams);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 8px', height: '100%', overflowY: 'auto' }}>
      <h2 className="card-title">Csapatgenerátor</h2>

      <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label className="input-label">Válassz osztályt/csoportot:</label>
          <select
            className="input-field"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.length === 0 ? (
              <option value="">Nincs szinkronizált csoport</option>
            ) : (
              groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.subject})
                </option>
              ))
            )}
          </select>
        </div>

        <div style={{ width: '150px' }}>
          <label className="input-label">Csapatlétszám:</label>
          <input
            type="number"
            className="input-field"
            value={teamSize}
            onChange={(e) => setTeamSize(parseInt(e.target.value, 10) || 2)}
            min="2"
            max="10"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className="btn-primary"
            onClick={generateTeams}
            disabled={!selectedGroup}
          >
            Generálás
          </button>
        </div>
      </div>

      {teams.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '40px' }}>
          {teams.map((team, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px'
              }}
            >
              <div style={{ fontSize: '14px', color: 'var(--accent-color)', fontWeight: 'bold', marginBottom: '12px' }}>
                {index + 1}. Csapat
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {team.map((student, sIdx) => (
                  <li key={sIdx} style={{ fontSize: '14px' }}>
                    {student}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
