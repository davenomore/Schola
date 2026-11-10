import React, { useState, useEffect, useMemo } from 'react';

const Groups = () => {
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('ekreta_groups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ekreta_groups_view') || 'grid');
  const [copiedId, setCopiedId] = useState(null);
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newStudents, setNewStudents] = useState('');

  useEffect(() => {
    // Háttérszinkronizáció a Krétából
    fetch('http://localhost:3001/api/groups?refresh=true')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const newGroups = data.data.map(g => ({
            id: g.id,
            name: g.className,
            subject: g.subject,
            students: g.students || []
          }));
          
          setGroups(currentGroups => {
            const manualGroups = currentGroups.filter(g => !String(g.id).includes(' - '));
            const mergedGroups = [...manualGroups, ...newGroups];
            localStorage.setItem('ekreta_groups', JSON.stringify(mergedGroups));
            return mergedGroups;
          });
        }
      })
      .catch(err => console.error('Hiba a háttérszinkronizáció során:', err));
  }, []);

  const saveGroups = (updated) => {
    setGroups(updated);
    localStorage.setItem('ekreta_groups', JSON.stringify(updated));
  };

  const handleToggleView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('ekreta_groups_view', mode);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewName('');
    setNewSubject('');
    setNewStudents('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group, e) => {
    e.stopPropagation();
    setEditingId(group.id);
    setNewName(group.name);
    setNewSubject(group.subject);
    setNewStudents((group.students || []).join('\n'));
    setIsFormOpen(true);
  };

  const handleSaveGroup = () => {
    if (!newName.trim() || !newSubject.trim()) return;
    
    const studentsArray = newStudents.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    if (editingId) {
      const updated = groups.map(g => g.id === editingId ? {
        ...g,
        name: newName.trim(),
        subject: newSubject.trim(),
        students: studentsArray
      } : g);
      saveGroups(updated);
    } else {
      const newGroup = {
        id: Date.now().toString(),
        name: newName.trim(),
        subject: newSubject.trim(),
        students: studentsArray
      };
      saveGroups([...groups, newGroup]);
    }
    
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDeleteGroup = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Biztosan törli ezt a csoportot?')) {
      saveGroups(groups.filter(g => g.id !== id));
      if (editingId === id) setIsFormOpen(false);
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleCopyStudents = (group, e) => {
    e.stopPropagation();
    if (!group.students || group.students.length === 0) return;
    navigator.clipboard.writeText(group.students.join('\n'));
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Tantárgyak listája a szűrőgombokhoz
  const availableSubjects = useMemo(() => {
    const subs = groups.map(g => g.subject).filter(Boolean);
    return Array.from(new Set(subs));
  }, [groups]);

  // Szűrt csoportok
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      // Tantárgyszűrő
      if (selectedSubject !== 'all' && g.subject !== selectedSubject) {
        return false;
      }
      // Keresőszűrő
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = (g.name || '').toLowerCase().includes(q);
      const matchSub = (g.subject || '').toLowerCase().includes(q);
      const matchStudent = (g.students || []).some(s => s.toLowerCase().includes(q));
      return matchName || matchSub || matchStudent;
    });
  }, [groups, selectedSubject, searchQuery]);

  // Statisztikák
  const totalStudents = useMemo(() => {
    const allSet = new Set();
    groups.forEach(g => (g.students || []).forEach(s => allSet.add(s)));
    return allSet.size;
  }, [groups]);

  return (
    <section className="card glass-panel animate-fade-in delay-1" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: '16px 20px', borderRadius: '4px', overflow: 'hidden' }}>
      
      {/* Fejléc: Cím, számláló, nézetváltó és Új csoport gomb (App dizájnhoz illeszkedve) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '500', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0 }}>
            Csoportok és Diákok
          </h2>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            padding: '2px 8px', 
            borderRadius: '4px', 
            background: 'var(--hover-bg)', 
            color: 'var(--text-secondary)',
            border: '1px solid var(--panel-border)'
          }}>
            {groups.length} csoport • {totalStudents} diák
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Nézetváltó (Rács / Lista) - minimál stílusban */}
          <div style={{ display: 'inline-flex', border: '1px solid var(--panel-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <button
              onClick={() => handleToggleView('grid')}
              style={{
                padding: '6px 12px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--panel-bg)',
                color: viewMode === 'grid' ? 'var(--bg-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              title="Kártya rács nézet"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Rács
            </button>
            <button
              onClick={() => handleToggleView('list')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderLeft: '1px solid var(--panel-border)',
                background: viewMode === 'list' ? 'var(--text-primary)' : 'var(--panel-bg)',
                color: viewMode === 'list' ? 'var(--bg-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              title="Lista nézet"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              Lista
            </button>
          </div>

          {!isFormOpen && (
            <button 
              className="btn-primary" 
              onClick={handleOpenAdd} 
              style={{ 
                padding: '6px 14px', 
                fontSize: '11px', 
                letterSpacing: '1px',
                textTransform: 'uppercase',
                width: 'auto',
                marginTop: 0,
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Új csoport
            </button>
          )}
        </div>
      </div>

      {/* Keresőmező és Tantárgy-szűrők (Monokróm, tiszta stílus) */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <svg 
            width="13" 
            height="13" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--text-secondary)" 
            strokeWidth="2"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text"
            placeholder="Keresés csoport, tantárgy vagy diák neve szerint..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '4px',
              border: '1px solid var(--panel-border)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Tantárgy gombok monokróm / natív dizájnban */}
        {availableSubjects.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', maxWidth: '100%' }}>
            <button
              onClick={() => setSelectedSubject('all')}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                border: '1px solid',
                borderColor: selectedSubject === 'all' ? 'var(--text-primary)' : 'var(--panel-border)',
                background: selectedSubject === 'all' ? 'var(--text-primary)' : 'transparent',
                color: selectedSubject === 'all' ? 'var(--bg-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: selectedSubject === 'all' ? '600' : '400',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              Mind ({groups.length})
            </button>
            {availableSubjects.map(sub => {
              const count = groups.filter(g => g.subject === sub).length;
              const isSel = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(isSel ? 'all' : sub)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    letterSpacing: '0.5px',
                    border: '1px solid',
                    borderColor: isSel ? 'var(--text-primary)' : 'var(--panel-border)',
                    background: isSel ? 'var(--text-primary)' : 'transparent',
                    color: isSel ? 'var(--bg-color)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: isSel ? '600' : '400',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{sub}</span>
                  <span style={{ opacity: 0.65, fontSize: '10px' }}>({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Létrehozás / Szerkesztés Űrlap (App form stílushoz igazítva) */}
      {isFormOpen && (
        <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '4px', border: '1px solid var(--text-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              {editingId ? 'Csoport Módosítása' : 'Új Csoport Létrehozása'}
            </h3>
            <button onClick={() => { setIsFormOpen(false); setEditingId(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <div>
              <label className="input-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Csoport Neve</label>
              <input 
                placeholder="Pl. 10.c MAT1 vagy 9.A" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="input-field"
                style={{ padding: '8px 10px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label className="input-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Tantárgy</label>
              <input 
                placeholder="Pl. Matematika, Fizika, tehetséggondozás" 
                value={newSubject} 
                onChange={e => setNewSubject(e.target.value)}
                className="input-field"
                style={{ padding: '8px 10px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="input-label" style={{ fontSize: '10px', marginBottom: 0 }}>
                Diákok Névsora (soronként 1 név)
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {newStudents.split('\n').filter(s => s.trim().length > 0).length} diák
              </span>
            </div>
            <textarea 
              placeholder="Illeszd be a diákok neveit (minden sorba egy név)..."
              value={newStudents}
              onChange={e => setNewStudents(e.target.value)}
              className="input-field"
              style={{ minHeight: '110px', resize: 'vertical', fontSize: '13px', lineHeight: '1.5', fontFamily: 'inherit', padding: '10px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button className="btn-outline" style={{ padding: '6px 14px', borderRadius: '4px' }} onClick={() => { setIsFormOpen(false); setEditingId(null); }}>Mégse</button>
            <button className="btn-primary" style={{ padding: '6px 18px', width: 'auto', marginTop: 0, borderRadius: '4px' }} onClick={handleSaveGroup}>Mentés</button>
          </div>
        </div>
      )}

      {/* Csoportok Kártya vagy Lista Konténere */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' }}>
        {filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>Nem található csoport</p>
            <p style={{ margin: 0, fontSize: '12px' }}>Próbálj más keresőszót vagy állítsd vissza a szűrőt.</p>
            {(searchQuery || selectedSubject !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setSelectedSubject('all'); }} 
                className="btn-outline" 
                style={{ marginTop: '12px', padding: '4px 10px', fontSize: '11px', borderRadius: '4px' }}
              >
                Szűrők törlése
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ======================================================== */
          /* RÁCS NÉZET: Minimalista, tiszta, szellős 2-3 oszlopos kártyák */
          /* ======================================================== */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '12px', 
            alignItems: 'start'
          }}>
            {filteredGroups.map(group => {
              const isExpanded = expandedId === group.id;
              const studentCount = group.students ? group.students.length : 0;
              const monogram = (group.name || '').split(/[\s_]/)[0] || 'Cs';

              return (
                <div 
                  key={group.id} 
                  className="glass-panel" 
                  style={{ 
                    borderRadius: '4px', 
                    overflow: 'hidden', 
                    border: isExpanded ? '1px solid var(--text-primary)' : '1px solid var(--panel-border)',
                    transition: 'border-color 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Kártya fejléc */}
                  <div 
                    style={{ 
                      padding: '14px 16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '10px',
                      cursor: 'pointer', 
                      background: isExpanded ? 'var(--hover-bg)' : 'transparent' 
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '4px', 
                          background: 'var(--hover-bg)', 
                          color: 'var(--text-primary)', 
                          border: '1px solid var(--panel-border)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: '600', 
                          fontSize: '11px',
                          letterSpacing: '0.5px',
                          flexShrink: 0
                        }}>
                          {monogram.slice(0, 4)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ 
                            margin: 0, 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: 'var(--text-primary)', 
                            lineHeight: '1.4',
                            wordBreak: 'break-word'
                          }}>
                            {group.name}
                          </h3>
                        </div>
                      </div>

                      {/* Tantárgy címke (Monokróm, tiszta) */}
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '600', 
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        padding: '3px 6px', 
                        borderRadius: '2px', 
                        background: 'var(--hover-bg)', 
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--panel-border)',
                        whiteSpace: 'nowrap'
                      }}>
                        {group.subject}
                      </span>
                    </div>

                    {/* Alsó sor: Diákok száma és akciógombok */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      paddingTop: '8px',
                      borderTop: '1px solid var(--panel-border)',
                      lineHeight: '1.5'
                    }}>
                      <span style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-secondary)'
                      }}>
                        <strong>{studentCount}</strong> diák
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          onClick={(e) => handleOpenEdit(group, e)} 
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--text-secondary)', 
                            cursor: 'pointer',
                            fontSize: '11px',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            padding: '2px 4px'
                          }} 
                          title="Szerkesztés"
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          Szerkesztés
                        </button>

                        <button 
                          onClick={(e) => handleDeleteGroup(group.id, e)} 
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--text-secondary)', 
                            cursor: 'pointer',
                            fontSize: '11px',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            padding: '2px 4px'
                          }} 
                          title="Törlés"
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          Törlés
                        </button>

                        <span style={{ 
                          fontSize: '10px', 
                          color: 'var(--text-secondary)',
                          marginLeft: '2px'
                        }}>
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Kinyitott Névsor Részlet */}
                  {isExpanded && (
                    <div style={{ 
                      padding: '12px 16px', 
                      borderTop: '1px solid var(--panel-border)', 
                      background: 'var(--hover-bg)' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          Névsor ({studentCount} fő)
                        </span>
                        {studentCount > 0 && (
                          <button
                            onClick={(e) => handleCopyStudents(group, e)}
                            className="btn-outline"
                            style={{
                              padding: '2px 6px',
                              borderRadius: '2px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              color: copiedId === group.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}
                            title="Névsor másolása vágólapra"
                          >
                            {copiedId === group.id ? '✓ Másolva' : 'Másolás'}
                          </button>
                        )}
                      </div>

                      {group.students && group.students.length > 0 ? (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                          gap: '4px 10px',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          paddingRight: '4px'
                        }}>
                          {group.students.map((student, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                fontSize: '12px', 
                                color: 'var(--text-primary)', 
                                lineHeight: '1.5',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', width: '16px', textAlign: 'right', flexShrink: 0 }}>
                                {idx + 1}.
                              </span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {student}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '12px' }}>
                          Nincsenek diákok a csoportban.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ======================================================== */
          /* LISTA NÉZET: Letisztult sorok, tökéletesen illeszkedve a Kréta témához */
          /* ======================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredGroups.map(group => {
              const isExpanded = expandedId === group.id;
              const studentCount = group.students ? group.students.length : 0;

              return (
                <div 
                  key={group.id} 
                  className="glass-panel" 
                  style={{ 
                    borderRadius: '4px', 
                    overflow: 'hidden', 
                    border: isExpanded ? '1px solid var(--text-primary)' : '1px solid var(--panel-border)',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div 
                    style={{ 
                      padding: '8px 16px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer', 
                      background: isExpanded ? 'var(--hover-bg)' : 'transparent',
                      gap: '16px'
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                  >
                    {/* Bal oldal: Osztálynév + Részletek (Bőséges sor- és betűtérközzel, levágás nélkül!) */}
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '13.5px', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)',
                        lineHeight: '1.25'
                      }}>
                        {group.name}
                      </h3>

                      {/* Részletek sora: Tantárgy és Diákszám - levágás nélkül */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', lineHeight: '1.3', paddingBottom: '2px' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: '600', 
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          padding: '1px 6px', 
                          borderRadius: '2px', 
                          background: 'var(--hover-bg)', 
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--panel-border)',
                          display: 'inline-block'
                        }}>
                          {group.subject}
                        </span>

                        <span style={{ 
                          fontSize: '11.5px', 
                          color: 'var(--text-secondary)'
                        }}>
                          • <strong>{studentCount}</strong> diák
                        </span>
                      </div>
                    </div>

                    {/* Jobb oldal: Akciógombok és lenyíló nyíl */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <button 
                        onClick={(e) => handleOpenEdit(group, e)} 
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--text-secondary)', 
                          cursor: 'pointer',
                          fontSize: '11px',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          padding: '4px 6px'
                        }} 
                        title="Szerkesztés"
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        Szerkesztés
                      </button>

                      <button 
                        onClick={(e) => handleDeleteGroup(group.id, e)} 
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--text-secondary)', 
                          cursor: 'pointer',
                          fontSize: '11px',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          padding: '4px 6px'
                        }} 
                        title="Törlés"
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        Törlés
                      </button>

                      <span style={{ color: 'var(--text-secondary)', fontSize: '10px', marginLeft: '2px' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Kinyitott Névsor Részlet */}
                  {isExpanded && (
                    <div style={{ padding: '14px 16px', borderTop: '1px solid var(--panel-border)', background: 'var(--hover-bg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          Tanulók névsora ({studentCount} fő)
                        </span>
                        {studentCount > 0 && (
                          <button
                            onClick={(e) => handleCopyStudents(group, e)}
                            className="btn-outline"
                            style={{
                              padding: '2px 8px',
                              borderRadius: '2px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              color: copiedId === group.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}
                          >
                            {copiedId === group.id ? '✓ Másolva' : 'Névsor másolása'}
                          </button>
                        )}
                      </div>

                      {group.students && group.students.length > 0 ? (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                          gap: '6px 14px',
                          maxHeight: '260px',
                          overflowY: 'auto'
                        }}>
                          {group.students.map((student, idx) => (
                            <div key={idx} style={{ padding: '2px 0', fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1.5' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', width: '18px', textAlign: 'right', flexShrink: 0 }}>
                                {idx + 1}.
                              </span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {student}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '12px' }}>
                          Nincsenek diákok a csoportban.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Groups;
