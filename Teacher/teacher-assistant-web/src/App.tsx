import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Camera, ListTodo, Users as UsersIcon, BarChart2, Plus, Mic, Edit3, CalendarDays, MapPin, MoreHorizontal, X, Calculator, Wrench } from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeToUserData, migrateLocalDataToCloud } from './lib/db';
import Login from './components/Login';
import Scanner from './components/Scanner';
import List from './components/List';
import Groups from './components/Groups';
import Analytics from './components/Analytics';
import ManualEntry from './components/ManualEntry';
import VoiceEntry from './components/VoiceEntry';
import Timetable from './components/Timetable';
import Settings from './components/Settings';
import GradeCalculator from './components/GradeCalculator';
import SpinWheel from './components/SpinWheel';
import TeamGenerator from './components/TeamGenerator';
import PlusPoints from './components/PlusPoints';
import Tools from './components/Tools';
import Timer from './components/Timer';
import { getCurrentClass } from './utils/currentClassHelper';
import { useNotifications } from './hooks/useNotifications';
import './App.css';

const InAppNotification = () => {
    const [notifications, setNotifications] = useState<{id: string, title: string, body: string}[]>([]);

    useEffect(() => {
        const handleEvent = (e: any) => {
            const { title, body } = e.detail;
            const id = Date.now().toString() + Math.random().toString();
            setNotifications(prev => [...prev, { id, title, body }]);
            
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 6000);
        };
        window.addEventListener('app-notification', handleEvent);
        return () => window.removeEventListener('app-notification', handleEvent);
    }, []);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed-overlay" style={{ top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', width: '90%', maxWidth: '400px' }}>
            {notifications.map(n => (
                <div key={n.id} style={{
                    background: 'rgba(30, 30, 35, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--accent-purple)',
                    borderRadius: '12px',
                    padding: '16px',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    animation: 'slide-up 0.3s ease-out' // Reuse the slide-up or a similar animation from context
                }}>
                    <strong style={{ display: 'block', color: 'var(--accent-purple)', marginBottom: '6px', fontSize: '16px' }}>{n.title}</strong>
                    <span style={{ fontSize: '14px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{n.body}</span>
                </div>
            ))}
        </div>
    );
};

const CurrentClassBanner = () => {
  const [currentInfo, setCurrentInfo] = useState<any>(null);

  useEffect(() => {
    const unsub = subscribeToUserData('teacher_timetable_v2', (data) => {
      if (data) setCurrentInfo(getCurrentClass(data));
      else setCurrentInfo(null);
    });

    const interval = setInterval(() => {
       // Just to trigger a re-render and recalculate based on time
       setCurrentInfo((prev: any) => prev ? { ...prev } : null);
    }, 30000);

    return () => {
       unsub();
       clearInterval(interval);
    };
  }, []);

  if (!currentInfo) return null;

  return (
    <div style={{
      background: 'var(--bg-surface-glass)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-glass)',
      padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <MapPin size={18} color="var(--accent-blue)" />
      {currentInfo.status === 'active' && currentInfo.entry ? (
        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
          📍 Most: {currentInfo.entry.className} ({currentInfo.entry.groupCode ? currentInfo.entry.groupCode + ' ' : ''}{currentInfo.entry.subject})
          <span style={{ color: 'var(--text-secondary)', marginLeft:'4px', fontWeight:'normal' }}>
            — {currentInfo.info.period}. óra {currentInfo.entry.room ? `(${currentInfo.entry.room})` : ''}
          </span>
        </span>
      ) : currentInfo.status === 'break' && currentInfo.nextEntry ? (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          ☕ Szünet. Következő: {currentInfo.nextEntry.className} ({currentInfo.nextEntry.subject}) — {currentInfo.info.nextPeriod}. óra
        </span>
      ) : currentInfo.status === 'break' ? (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>☕ Szünet. Következő: Lyukasóra</span>
      ) : currentInfo.status === 'free' ? (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🏠 {currentInfo.info.period}. óra: Lyukasóra</span>
      ) : (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{currentInfo.info.message}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {auth.currentUser?.photoURL && (
              <Link to="/settings" style={{ display: 'flex', alignItems: 'center' }}>
                <img src={auth.currentUser.photoURL} alt="Profile" style={{ width: '30px', height: '30px', borderRadius: '15px', border: '2px solid var(--accent-purple)', cursor: 'pointer', transition: 'all 0.2s' }} title="Beállítások" />
              </Link>
          )}
      </div>
    </div>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const [listCount, setListCount] = useState(0);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Reactive state using Firestore
  useEffect(() => {
    const unsub = subscribeToUserData('scanned_tests', (data) => {
      setListCount((data || []).length);
    });
    return unsub;
  }, []);
  
  return (
    <>
      {/* Dim overlay */}
      {isFabOpen && (
         <div 
           className="fixed-overlay"
           style={{ top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 15, backdropFilter: 'blur(4px)', borderRadius: 'inherit' }}
           onClick={() => setIsFabOpen(false)}
         />
      )}

      {/* FABs */}
      <div className="fixed-overlay" style={{
         bottom: '100px', left: '50%', transform: 'translateX(-50%)',
         display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-end', zIndex: 20,
         pointerEvents: isFabOpen ? 'auto' : 'none', width: '200px'
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', transform: isFabOpen ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(40px)', opacity: isFabOpen ? 1 : 0, transition: 'all 0.2s ease-out', transitionDelay: isFabOpen ? '0s' : '0.1s' }}>
            <span style={{ color: 'white', background: '#0d1117', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>Diktálás</span>
            <Link to="/voice" onClick={() => setIsFabOpen(false)} style={{ background: '#161b22', border: '1px solid #30363d', width: '60px', height: '60px', borderRadius: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', textDecoration: 'none' }}>
               <Mic size={28} color="#a371f7" />
            </Link>
         </div>
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', transform: isFabOpen ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(40px)', opacity: isFabOpen ? 1 : 0, transition: 'all 0.2s ease-out', transitionDelay: isFabOpen ? '0.05s' : '0.05s' }}>
            <span style={{ color: 'white', background: '#0d1117', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>Manuális</span>
            <Link to="/manual" onClick={() => setIsFabOpen(false)} style={{ background: '#161b22', border: '1px solid #30363d', color: 'white', width: '60px', height: '60px', borderRadius: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', textDecoration: 'none' }}>
               <Edit3 size={28} color="#3fb950" />
            </Link>
         </div>
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', transform: isFabOpen ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(40px)', opacity: isFabOpen ? 1 : 0, transition: 'all 0.2s ease-out', transitionDelay: isFabOpen ? '0.1s' : '0s' }}>
            <span style={{ color: 'white', background: '#0d1117', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>Szkennelés</span>
            <Link to="/scanner" onClick={() => setIsFabOpen(false)} style={{ background: '#161b22', border: '1px solid #30363d', color: 'white', width: '60px', height: '60px', borderRadius: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', textDecoration: 'none' }}>
               <Camera size={28} color="#58a6ff" />
            </Link>
         </div>
      </div>

      <div className="fixed-overlay" style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '12px 0',
        background: 'var(--bg-surface-glass)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--border-color)',
        bottom: 0, left: 0, right: 0, zIndex: 10, borderRadius: '0 0 inherit inherit'
      }}>
        <Link to="/groups" style={{ flex: 1, color: location.pathname === '/groups' ? 'var(--accent-blue)' : 'var(--text-secondary)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <UsersIcon size={24} />
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Csoportok</span>
        </Link>
        <Link to="/list" style={{ flex: 1, color: location.pathname === '/list' ? 'var(--accent-blue)' : 'var(--text-secondary)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <ListTodo size={24} />
            {listCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-10px', background: 'var(--accent-green)', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                {listCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Lista</span>
        </Link>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignSelf: 'center' }}>
          <button onClick={() => setIsFabOpen(!isFabOpen)} style={{
              width: '56px', height: '56px', borderRadius: '28px', backgroundColor: 'var(--accent-blue)', color: 'white',
              border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 0 15px rgba(47,129,247,0.4)', zIndex: 25, cursor: 'pointer',
              transform: isFabOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease'
          }}>
              <Plus size={32} />
          </button>
        </div>

        <Link to="/" style={{ flex: 1, color: location.pathname === '/' || location.pathname === '/timetable' ? 'var(--accent-blue)' : 'var(--text-secondary)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <CalendarDays size={24} />
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Órarend</span>
        </Link>
        <button onClick={() => setIsMoreOpen(!isMoreOpen)} style={{ flex: 1, color: isMoreOpen ? 'var(--accent-blue)' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: 0 }}>
          {isMoreOpen ? <X size={24} /> : <MoreHorizontal size={24} />}
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Több</span>
        </button>
      </div>

      {/* Több panel */}
      {isMoreOpen && (
        <>
          <div 
            className="fixed-overlay"
            style={{ top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 14, backdropFilter: 'blur(4px)', borderRadius: 'inherit' }}
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="fixed-overlay" style={{
            bottom: '80px', left: '12px', right: '12px', zIndex: 16,
            background: 'var(--bg-surface-glass)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-glass)', borderRadius: '16px',
            padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px',
            animation: 'slide-up 0.2s ease-out',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.4)'
          }}>
            <Link to="/analytics" onClick={() => setIsMoreOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
              borderRadius: '12px', textDecoration: 'none',
              color: location.pathname === '/analytics' ? 'var(--accent-blue)' : 'var(--text-primary)',
              background: location.pathname === '/analytics' ? 'rgba(88,166,255,0.1)' : 'transparent',
              transition: 'background 0.15s'
            }}>
              <BarChart2 size={22} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Eredmények</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Statisztika és archívum</div>
              </div>
            </Link>
            <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0 8px' }} />
            <Link to="/calculator" onClick={() => setIsMoreOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
              borderRadius: '12px', textDecoration: 'none',
              color: location.pathname === '/calculator' ? 'var(--accent-blue)' : 'var(--text-primary)',
              background: location.pathname === '/calculator' ? 'rgba(88,166,255,0.1)' : 'transparent',
              transition: 'background 0.15s'
            }}>
              <Calculator size={22} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Ponthatárok</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Dolgozat ponthatár számító</div>
              </div>
            </Link>
            <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0 8px' }} />
            <Link to="/tools" onClick={() => setIsMoreOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
              borderRadius: '12px', textDecoration: 'none',
              color: location.pathname === '/tools' ? 'var(--accent-blue)' : 'var(--text-primary)',
              background: location.pathname === '/tools' ? 'rgba(88,166,255,0.1)' : 'transparent',
              transition: 'background 0.15s'
            }}>
              <Wrench size={22} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Segédeszközök</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Időzítő, Csapat, Névsor</div>
              </div>
            </Link>
          </div>
        </>
      )}
    </>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      
      if (currentUser) {
         // Futtassuk le a lokális adat migrációt az adott eszközön, mielőtt bármi betölt
         const migrated = await migrateLocalDataToCloud(currentUser.uid);
         if (migrated) {
            alert('A korábbi, telefonon tárolt adataidat sikeresen átszinkronizáltuk a felhős fiókodba! 🚀');
         }
      }
      
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useNotifications();

  if (authLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'white' }}>Betöltés...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="desktop-shell">
        <div className="phone-frame">
          <div className="app-container">
            <InAppNotification />
            <CurrentClassBanner />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Timetable />} />
            <Route path="/scanner" element={<div style={{ flex: 1 }}><Scanner /></div>} />
            <Route path="/list" element={<List />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/manual" element={<ManualEntry />} />
            <Route path="/voice" element={<VoiceEntry />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/calculator" element={<GradeCalculator />} />
            <Route path="/spinwheel" element={<div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}><SpinWheel /></div>} />
            <Route path="/teams" element={<TeamGenerator />} />
            <Route path="/pluspoints" element={<PlusPoints />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="*" element={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}><h2 style={{ color: 'var(--text-primary)' }}>404</h2><p>Az oldal nem található.</p></div>} />
          </Routes>
        </div>

        <BottomNav />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
