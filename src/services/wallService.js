import { API_BASE } from '../config';

const LOCAL_STORAGE_KEY = 'schola_padlet_wall_data';

const DEFAULT_WALL_DATA = {
  topic: 'Gondolatok & Kérdések a mai óráról',
  notes: [
    {
      id: 'demo-1',
      author: 'Példa Diák',
      text: 'Nagyon tetszett a mai órai kísérlet! Érthetőbb lett az összefüggés.',
      color: 'yellow',
      timestamp: '10:15',
      likes: 3
    },
    {
      id: 'demo-2',
      author: 'Névtelen',
      text: 'A 3. feladat megoldási lépését át tudjuk még egyszer ismételni a végén?',
      color: 'blue',
      timestamp: '10:18',
      likes: 1
    }
  ]
};

function getLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_WALL_DATA;
  } catch {
    return DEFAULT_WALL_DATA;
  }
}

function saveLocalData(data) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('schola_wall_updated'));
  } catch (err) {
    console.error('Failed to save local wall data:', err);
  }
}

export const wallService = {
  async getWall() {
    try {
      const res = await fetch(`${API_BASE}/api/wall`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData({ topic: json.topic, notes: json.notes });
          return { topic: json.topic, notes: json.notes };
        }
      }
    } catch {
      // Offline or server not reachable: use local data
    }
    return getLocalData();
  },

  async addNote({ author, text, color }) {
    const payload = {
      author: author && author.trim() ? author.trim() : 'Névtelen',
      text: text.trim(),
      color: color || 'yellow'
    };

    try {
      const res = await fetch(`${API_BASE}/api/wall/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData({ ...getLocalData(), notes: json.notes });
          return json.notes;
        }
      }
    } catch {
      // Fallback local
    }

    const current = getLocalData();
    const newNote = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      author: payload.author,
      text: payload.text,
      color: payload.color,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: 0
    };
    const updatedNotes = [newNote, ...(current.notes || [])];
    const updated = { ...current, notes: updatedNotes };
    saveLocalData(updated);
    return updatedNotes;
  },

  async setTopic(topic) {
    const trimmed = topic.trim();
    try {
      const res = await fetch(`${API_BASE}/api/wall/topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmed })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData({ ...getLocalData(), topic: json.topic });
          return json.topic;
        }
      }
    } catch {
      // Fallback
    }

    const current = getLocalData();
    const updated = { ...current, topic: trimmed };
    saveLocalData(updated);
    return trimmed;
  },

  async likeNote(id) {
    try {
      const res = await fetch(`${API_BASE}/api/wall/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData({ ...getLocalData(), notes: json.notes });
          return json.notes;
        }
      }
    } catch {
      // Fallback
    }

    const current = getLocalData();
    const updatedNotes = (current.notes || []).map(n =>
      n.id === id ? { ...n, likes: (n.likes || 0) + 1 } : n
    );
    saveLocalData({ ...current, notes: updatedNotes });
    return updatedNotes;
  },

  async deleteNote(id) {
    try {
      const res = await fetch(`${API_BASE}/api/wall/note/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData({ ...getLocalData(), notes: json.notes });
          return json.notes;
        }
      }
    } catch {
      // Fallback
    }

    const current = getLocalData();
    const updatedNotes = (current.notes || []).filter(n => n.id !== id);
    saveLocalData({ ...current, notes: updatedNotes });
    return updatedNotes;
  },

  async clearWall() {
    try {
      const res = await fetch(`${API_BASE}/api/wall/clear`, {
        method: 'POST'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          saveLocalData({ ...getLocalData(), notes: [] });
          return [];
        }
      }
    } catch {
      // Fallback
    }

    const current = getLocalData();
    saveLocalData({ ...current, notes: [] });
    return [];
  }
};
