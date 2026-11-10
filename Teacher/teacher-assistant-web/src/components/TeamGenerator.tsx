import { useState, useEffect } from 'react';
import { subscribeToUserData, saveUserData } from '../lib/db';
import { Shuffle, Users, Save, Trash2, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';

interface GroupData {
  id: string;
  name: string;
  subject?: string;
  students: string[];
}

interface SavedProject {
  id: string;
  name: string;
  groupName: string;
  date: string;
  teams: { name: string; members: string[] }[];
}

const TEAM_COLORS = [
  { bg: 'rgba(63,185,80,0.12)', border: '#3fb950', text: '#3fb950', label: '🟢' },
  { bg: 'rgba(88,166,255,0.12)', border: '#58a6ff', text: '#58a6ff', label: '🔵' },
  { bg: 'rgba(163,113,247,0.12)', border: '#a371f7', text: '#a371f7', label: '🟣' },
  { bg: 'rgba(240,136,62,0.12)', border: '#f0883e', text: '#f0883e', label: '🟠' },
  { bg: 'rgba(210,153,34,0.12)', border: '#d29922', text: '#d29922', label: '🟡' },
  { bg: 'rgba(248,81,73,0.12)', border: '#f85149', text: '#f85149', label: '🔴' },
  { bg: 'rgba(86,212,221,0.12)', border: '#56d4dd', text: '#56d4dd', label: '🩵' },
  { bg: 'rgba(219,97,162,0.12)', border: '#db61a2', text: '#db61a2', label: '🩷' },
];

type SplitMode = 'byTeamCount' | 'byTeamSize';

const TeamGenerator = () => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [splitMode, setSplitMode] = useState<SplitMode>('byTeamCount');
  const [teamCount, setTeamCount] = useState(4);
  const [teamSize, setTeamSize] = useState(4);
  const [teams, setTeams] = useState<string[][]>([]);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToUserData('teacher_groups', (data) => {
      setGroups(data || []);
      if (data && data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    });
    const unsub2 = subscribeToUserData('saved_team_projects', (data) => {
      setSavedProjects(data || []);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const students = selectedGroup?.students || [];

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const generate = () => {
    if (students.length === 0) return;
    const shuffled = shuffle(students);

    let numTeams: number;
    if (splitMode === 'byTeamCount') {
      numTeams = Math.min(teamCount, shuffled.length);
    } else {
      numTeams = Math.max(1, Math.ceil(shuffled.length / teamSize));
    }

    const result: string[][] = Array.from({ length: numTeams }, () => []);
    shuffled.forEach((student, i) => {
      result[i % numTeams].push(student);
    });

    setTeams(result);
    setTeamNames(Array.from({ length: numTeams }, (_, i) => `${i + 1}. csapat`));
    setGenerated(true);
    setSavedMessage(false);
  };

  const updateTeamName = (index: number, name: string) => {
    const updated = [...teamNames];
    updated[index] = name;
    setTeamNames(updated);
  };

  const saveProject = async () => {
    if (!projectName.trim() || teams.length === 0) return;
    const project: SavedProject = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: projectName.trim(),
      groupName: selectedGroup ? `${selectedGroup.name}${selectedGroup.subject ? ' — ' + selectedGroup.subject : ''}` : '',
      date: new Date().toISOString(),
      teams: teams.map((t, i) => ({ name: teamNames[i] || `${i + 1}. csapat`, members: [...t] })),
    };
    try {
      // Olvassuk a jelenlegi mentett projekteket közvetlenül Firestore-ból, ne a state-ből
      const { getUserData } = await import('../lib/db');
      const current: SavedProject[] = (await getUserData('saved_team_projects')) || [];
      const updated = [project, ...current];
      await saveUserData('saved_team_projects', updated);
      setProjectName('');
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (err) {
      console.error('Hiba a projekt mentésekor:', err);
      alert('Hiba történt a mentéskor! Próbáld újra.');
    }
  };

  const deleteProject = async (id: string) => {
    const updated = savedProjects.filter(p => p.id !== id);
    await saveUserData('saved_team_projects', updated);
    if (expandedProjectId === id) setExpandedProjectId(null);
  };

  const daysAgo = (iso: string) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'ma';
    if (days === 1) return 'tegnap';
    return `${days} napja`;
  };

  const maxTeams = Math.min(students.length, 8);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}>

      {/* Fejléc */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={22} color="var(--accent-blue)" /> Csoportbontó
        </h2>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <select
            value={selectedGroupId}
            onChange={e => { setSelectedGroupId(e.target.value); setGenerated(false); setTeams([]); setShowSaved(false); }}
            style={{
              padding: '8px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: '1px solid var(--border-glass)', background: 'var(--bg-color)',
              color: 'var(--text-primary)', outline: 'none'
            }}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}{g.subject ? ` — ${g.subject}` : ''}</option>
            ))}
          </select>
          <button
            onClick={() => setShowSaved(!showSaved)}
            style={{
              padding: '8px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: showSaved ? 'rgba(163,113,247,0.2)' : 'rgba(255,255,255,0.05)',
              color: showSaved ? 'var(--accent-purple)' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              outline: showSaved ? '1px solid var(--accent-purple)' : '1px solid var(--border-glass)'
            }}
          >
            <FolderOpen size={16} />
            {savedProjects.length > 0 && <span>{savedProjects.length}</span>}
          </button>
        </div>
      </div>
      {/* ----- MENTETT PROJEKTEK NÉZET ----- */}
      {showSaved ? (
        <>
          {savedProjects.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📁</div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Nincs mentett projekt</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Generálj csapatokat és mentsd el őket!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedProjects.map(project => {
                const isExpanded = expandedProjectId === project.id;
                return (
                  <div key={project.id} className="glass-panel" style={{ overflow: 'hidden' }}>
                    <div
                      onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                      style={{
                        padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', transition: 'background 0.15s',
                        background: isExpanded ? 'rgba(88,166,255,0.05)' : 'transparent'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📋 {project.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {project.groupName} · {project.teams.length} csapat · {daysAgo(project.date)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} style={{
                          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px',
                          opacity: 0.5, transition: 'opacity 0.15s'
                        }}>
                          <Trash2 size={14} />
                        </button>
                        {isExpanded ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {project.teams.map((team, i) => {
                          const color = TEAM_COLORS[i % TEAM_COLORS.length];
                          return (
                            <div key={i} style={{
                              borderRadius: '10px', overflow: 'hidden',
                              border: `1px solid ${color.border}33`
                            }}>
                              <div style={{
                                padding: '6px 12px', background: color.bg, fontSize: '12px', fontWeight: 600, color: color.text,
                                display: 'flex', justifyContent: 'space-between'
                              }}>
                                <span>{color.label} {team.name}</span>
                                <span style={{ opacity: 0.7 }}>{team.members.length} fő</span>
                              </div>
                              <div style={{ padding: '4px 12px', fontSize: '13px' }}>
                                {team.members.join(', ')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>

      {/* Létszám infó */}
      {selectedGroup && (
        <div className="glass-panel" style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
          👥 <strong>{students.length}</strong> diák a csoportban
        </div>
      )}

      {/* Bontás módja */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>Bontás módja</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSplitMode('byTeamCount')}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              border: splitMode === 'byTeamCount' ? '1px solid var(--accent-blue)' : '1px solid var(--border-glass)',
              background: splitMode === 'byTeamCount' ? 'rgba(88,166,255,0.15)' : 'transparent',
              color: splitMode === 'byTeamCount' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Csapatok száma
          </button>
          <button
            onClick={() => setSplitMode('byTeamSize')}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              border: splitMode === 'byTeamSize' ? '1px solid var(--accent-green)' : '1px solid var(--border-glass)',
              background: splitMode === 'byTeamSize' ? 'rgba(63,185,80,0.15)' : 'transparent',
              color: splitMode === 'byTeamSize' ? 'var(--accent-green)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Csapat mérete
          </button>
        </div>

        {splitMode === 'byTeamCount' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '90px' }}>Csapatok:</span>
            <input
              type="range" min={2} max={maxTeams || 2} value={Math.min(teamCount, maxTeams || 2)}
              onChange={e => setTeamCount(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-blue)' }}
            />
            <span style={{
              padding: '6px 14px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold',
              background: 'rgba(88,166,255,0.1)', color: 'var(--accent-blue)',
              border: '1px solid rgba(88,166,255,0.3)', minWidth: '40px', textAlign: 'center'
            }}>
              {Math.min(teamCount, maxTeams || 2)}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '90px' }}>Fő/csapat:</span>
            <input
              type="range" min={2} max={Math.max(2, Math.ceil(students.length / 2))} value={teamSize}
              onChange={e => setTeamSize(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent-green)' }}
            />
            <span style={{
              padding: '6px 14px', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold',
              background: 'rgba(63,185,80,0.1)', color: 'var(--accent-green)',
              border: '1px solid rgba(63,185,80,0.3)', minWidth: '40px', textAlign: 'center'
            }}>
              {teamSize}
            </span>
          </div>
        )}
      </div>

      {/* Generálás gomb */}
      <button onClick={generate} disabled={students.length === 0} style={{
        padding: '14px', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: 'bold',
        background: students.length === 0 ? '#30363d' : 'linear-gradient(135deg, #3fb950, #58a6ff)',
        color: 'white', cursor: students.length === 0 ? 'not-allowed' : 'pointer',
        boxShadow: students.length > 0 ? '0 4px 16px rgba(63,185,80,0.3)' : 'none',
        transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
      }}>
        <Shuffle size={20} />
        {generated ? 'Újrakeverés' : 'Csapatok generálása'}
      </button>

      {/* Eredmény */}
      {generated && teams.length > 0 && (
        <>
          {/* Mentés panel */}
          <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Projekt neve (pl. Poszter készítés)"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '10px', fontSize: '13px',
                border: '1px solid var(--border-glass)', background: 'var(--bg-color)',
                color: 'var(--text-primary)', outline: 'none'
              }}
              onKeyDown={e => e.key === 'Enter' && saveProject()}
            />
            <button onClick={saveProject} disabled={!projectName.trim()} style={{
              padding: '10px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600,
              background: projectName.trim() ? '#238636' : '#30363d',
              color: 'white', cursor: projectName.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}>
              <Save size={16} /> Mentés
            </button>
          </div>
          {savedMessage && (
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#3fb950', fontWeight: 600, animation: 'slide-up 0.2s ease-out' }}>
              ✅ Projekt elmentve!
            </div>
          )}

          {/* Csapatok */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {teams.map((team, i) => {
              const color = TEAM_COLORS[i % TEAM_COLORS.length];
              return (
                <div key={i} className="glass-panel" style={{
                  overflow: 'hidden',
                  borderLeft: `4px solid ${color.border}`,
                  animation: `slide-up 0.3s ease-out ${i * 0.05}s both`
                }}>
                  <div style={{
                    padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: color.bg, borderBottom: `1px solid ${color.border}22`
                  }}>
                    <input
                      value={teamNames[i] || ''}
                      onChange={e => updateTeamName(i, e.target.value)}
                      placeholder={`${i + 1}. csapat`}
                      style={{
                        flex: 1, background: 'none', border: 'none', fontWeight: 'bold', fontSize: '14px',
                        color: color.text, outline: 'none', padding: 0
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {team.length} fő
                    </span>
                  </div>
                  <div style={{ padding: '8px 16px' }}>
                    {team.map((student, j) => (
                      <div key={j} style={{
                        padding: '8px 0', fontSize: '14px',
                        borderBottom: j < team.length - 1 ? '1px solid var(--border-glass)' : 'none'
                      }}>
                        {student}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
        </>
      )}

      {/* Mentett projektek nézet vége */}

    </div>
  );
};

export default TeamGenerator;
