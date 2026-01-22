import React, { useState, useEffect } from 'react';
import { Calculator, LogOut, Save, FolderOpen, Download, Plus, Trash2 } from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Template-Daten (verkürzt - nur wichtigste)
const TEMPLATES = {
  aluvision: [
    { name: 'Omni 55 Rahmen 992 x 2480 mm', typ: 'Rahmen', preis: 245 },
    { name: 'Linearprofil', typ: 'Profil', preis: 15 },
    { name: 'Kedertextil Durchlicht', typ: 'Textil', preis: 35 }
  ],
  pixlip: [
    { name: 'Pixlip Rahmen 1000 x 2500 mm', typ: 'Rahmen', preis: 145 }
  ],
  zusatz: [
    { name: 'Theke Standard', typ: 'Möbel', preis: 185 },
    { name: 'LED-Spot', typ: 'Licht', preis: 25 }
  ]
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showProjects, setShowProjects] = useState(false);

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projektData, setProjektData] = useState({
    projektname: '',
    breite: '',
    tiefe: '',
    hoehe: '',
    system: 'both'
  });

  const [aluvisionKomponenten, setAluvisionKomponenten] = useState([]);
  const [pixlipKomponenten, setPixlipKomponenten] = useState([]);
  const [zusatzausstattung, setZusatzausstattung] = useState([]);
  const [mietdauer, setMietdauer] = useState(1);

  useEffect(() => {
    if (token) fetchUserData();
  }, [token]);

  useEffect(() => {
    if (isLoggedIn) loadProjects();
  }, [isLoggedIn]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(await res.json());
        setIsLoggedIn(true);
      } else logout();
    } catch (e) {
      logout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsLoggedIn(true);
      } else alert(data.error);
    } catch (e) {
      alert('Verbindungsfehler');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      if (res.ok) {
        alert('Erfolgreich registriert!');
        setShowLogin(true);
        setRegisterData({ username: '', email: '', password: '' });
      } else alert((await res.json()).error);
    } catch (e) {
      alert('Verbindungsfehler');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
  };

  const loadProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProjects(await res.json());
    } catch (e) {}
  };

  const saveProject = async () => {
    if (!projektData.projektname) return alert('Projektname fehlt!');
    
    const data = {
      ...projektData,
      data: { aluvisionKomponenten, pixlipKomponenten, zusatzausstattung, mietdauer }
    };

    try {
      const url = currentProjectId ? `${API_URL}/projects/${currentProjectId}` : `${API_URL}/projects`;
      const res = await fetch(url, {
        method: currentProjectId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        if (!currentProjectId) setCurrentProjectId(result.id);
        alert('Gespeichert!');
        loadProjects();
      }
    } catch (e) {
      alert('Fehler');
    }
  };

  const loadProject = (p) => {
    setProjektData({ projektname: p.projektname, breite: p.breite, tiefe: p.tiefe, hoehe: p.hoehe, system: p.system });
    setAluvisionKomponenten(p.data?.aluvisionKomponenten || []);
    setPixlipKomponenten(p.data?.pixlipKomponenten || []);
    setZusatzausstattung(p.data?.zusatzausstattung || []);
    setMietdauer(p.data?.mietdauer || 1);
    setCurrentProjectId(p.id);
    setShowProjects(false);
  };

  const deleteProject = async (id) => {
    if (!confirm('Löschen?')) return;
    try {
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadProjects();
        if (currentProjectId === id) newProject();
      }
    } catch (e) {}
  };

  const newProject = () => {
    setProjektData({ projektname: '', breite: '', tiefe: '', hoehe: '', system: 'both' });
    setAluvisionKomponenten([]);
    setPixlipKomponenten([]);
    setZusatzausstattung([]);
    setMietdauer(1);
    setCurrentProjectId(null);
  };

  const addTemplate = (type, name) => {
    const t = TEMPLATES[type].find(x => x.name === name);
    const item = { bezeichnung: t.name, typ: t.typ, menge: 1, einzelpreis: t.preis, laenge: '' };
    if (type === 'aluvision') setAluvisionKomponenten([...aluvisionKomponenten, item]);
    else if (type === 'pixlip') setPixlipKomponenten([...pixlipKomponenten, item]);
    else setZusatzausstattung([...zusatzausstattung, item]);
  };

  const update = (list, set, i, field, val) => {
    const n = [...list];
    n[i][field] = val;
    set(n);
  };

  const remove = (list, set, i) => set(list.filter((_, idx) => idx !== i));

  const calc = (list, mitMiet = false, isAlu = false) => {
    return list.reduce((sum, item) => {
      const isLP = isAlu && (item.typ === 'Profil' || item.bezeichnung.includes('Linearprofil'));
      const len = parseFloat(item.laenge) || 1;
      const factor = isLP ? len : 1;
      const price = item.menge * item.einzelpreis * factor;
      return sum + (mitMiet ? price * mietdauer : price);
    }, 0);
  };

  const kalk = {
    alu: calc(aluvisionKomponenten, false, true),
    pix: calc(pixlipKomponenten),
    zus: calc(zusatzausstattung, true)
  };
  kalk.gesamt = kalk.alu + kalk.pix + kalk.zus;

  const exportCSV = () => {
    let csv = 'Kategorie;Bezeichnung;Menge;Preis;Total\n';
    aluvisionKomponenten.forEach(x => {
      const isLP = x.typ === 'Profil';
      const len = parseFloat(x.laenge) || 1;
      csv += `Aluvision;${x.bezeichnung};${x.menge};${x.einzelpreis};${(x.menge * x.einzelpreis * (isLP ? len : 1)).toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${projektData.projektname || 'Projekt'}.csv`;
    link.click();
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <Calculator size={64} />
            <h1>Messestand Kalkulator</h1>
            <p>Professionelle Team-Lösung</p>
          </div>
          <div className="login-content">
            <div className="tab-container">
              <button className={showLogin ? 'tab active' : 'tab'} onClick={() => setShowLogin(true)}>Anmelden</button>
              <button className={!showLogin ? 'tab active' : 'tab'} onClick={() => setShowLogin(false)}>Registrieren</button>
            </div>
            {showLogin ? (
              <form onSubmit={handleLogin}>
                <input type="text" placeholder="Benutzername" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
                <input type="password" placeholder="Passwort" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
                <button type="submit">Anmelden</button>
                <p className="demo">Demo: <strong>demo / demo123</strong></p>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <input type="text" placeholder="Benutzername" value={registerData.username} onChange={e => setRegisterData({...registerData, username: e.target.value})} required />
                <input type="email" placeholder="E-Mail" value={registerData.email} onChange={e => setRegisterData({...registerData, email: e.target.value})} required />
                <input type="password" placeholder="Passwort (min. 6 Zeichen)" value={registerData.password} onChange={e => setRegisterData({...registerData, password: e.target.value})} required minLength="6" />
                <button type="submit" className="register">Registrieren</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="app-container">
      <div className="app-content">
        <header className="app-header">
          <div>
            <h1><Calculator size={32} /> Messestand Kalkulator</h1>
            <p>Angemeldet als: {user?.username}</p>
          </div>
          <div className="header-actions">
            <button onClick={newProject} className="btn secondary"><Plus size={20} /> Neu</button>
            <button onClick={() => setShowProjects(true)} className="btn secondary"><FolderOpen size={20} /> Projekte</button>
            <button onClick={saveProject} className="btn success"><Save size={20} /> Speichern</button>
            <button onClick={logout} className="btn danger"><LogOut size={20} /> Abmelden</button>
          </div>
        </header>

        <div className="content">
          <section className="section">
            <h2>Projektdaten</h2>
            <div className="form-grid">
              <input type="text" placeholder="Projektname" value={projektData.projektname} onChange={e => setProjektData({...projektData, projektname: e.target.value})} />
              <input type="number" placeholder="Breite (m)" value={projektData.breite} onChange={e => setProjektData({...projektData, breite: e.target.value})} step="0.5" />
              <input type="number" placeholder="Tiefe (m)" value={projektData.tiefe} onChange={e => setProjektData({...projektData, tiefe: e.target.value})} step="0.5" />
              <input type="number" placeholder="Höhe (m)" value={projektData.hoehe} onChange={e => setProjektData({...projektData, hoehe: e.target.value})} step="0.5" />
            </div>
          </section>

          <section className="section">
            <h2>Aluvision</h2>
            <div className="templates">
              {TEMPLATES.aluvision.map(t => (
                <button key={t.name} className="template-btn" onClick={() => addTemplate('aluvision', t.name)}>+ {t.name} ({t.preis}€)</button>
              ))}
            </div>
            {aluvisionKomponenten.map((item, i) => {
              const isLP = item.typ === 'Profil';
              const len = parseFloat(item.laenge) || 1;
              const total = item.menge * item.einzelpreis * (isLP ? len : 1);
              return (
                <div key={i} className="row">
                  <input value={item.bezeichnung} onChange={e => update(aluvisionKomponenten, setAluvisionKomponenten, i, 'bezeichnung', e.target.value)} placeholder="Bezeichnung" />
                  {isLP && <input type="number" value={item.laenge} onChange={e => update(aluvisionKomponenten, setAluvisionKomponenten, i, 'laenge', e.target.value)} placeholder="Länge (m)" step="0.1" />}
                  <input type="number" value={item.menge} onChange={e => update(aluvisionKomponenten, setAluvisionKomponenten, i, 'menge', parseFloat(e.target.value))} />
                  <input type="number" value={item.einzelpreis} onChange={e => update(aluvisionKomponenten, setAluvisionKomponenten, i, 'einzelpreis', parseFloat(e.target.value))} />
                  {isLP && <span className="factor">× {len}m</span>}
                  <span className="total">{total.toFixed(2)}€</span>
                  <button className="btn-delete" onClick={() => remove(aluvisionKomponenten, setAluvisionKomponenten, i)}><Trash2 size={16} /></button>
                </div>
              );
            })}
          </section>

          <section className="section">
            <h2>Pixlip</h2>
            <div className="templates">
              {TEMPLATES.pixlip.map(t => (
                <button key={t.name} className="template-btn" onClick={() => addTemplate('pixlip', t.name)}>+ {t.name} ({t.preis}€)</button>
              ))}
            </div>
            {pixlipKomponenten.map((item, i) => (
              <div key={i} className="row">
                <input value={item.bezeichnung} onChange={e => update(pixlipKomponenten, setPixlipKomponenten, i, 'bezeichnung', e.target.value)} />
                <input type="number" value={item.menge} onChange={e => update(pixlipKomponenten, setPixlipKomponenten, i, 'menge', parseFloat(e.target.value))} />
                <input type="number" value={item.einzelpreis} onChange={e => update(pixlipKomponenten, setPixlipKomponenten, i, 'einzelpreis', parseFloat(e.target.value))} />
                <span className="total">{(item.menge * item.einzelpreis).toFixed(2)}€</span>
                <button className="btn-delete" onClick={() => remove(pixlipKomponenten, setPixlipKomponenten, i)}><Trash2 size={16} /></button>
              </div>
            ))}
          </section>

          <section className="section">
            <h2>Zusatzausstattung</h2>
            <div className="mietdauer">
              <label>Mietdauer (Tage):</label>
              <input type="number" value={mietdauer} onChange={e => setMietdauer(parseInt(e.target.value))} min="1" />
            </div>
            <div className="templates">
              {TEMPLATES.zusatz.map(t => (
                <button key={t.name} className="template-btn" onClick={() => addTemplate('zusatz', t.name)}>+ {t.name} ({t.preis}€)</button>
              ))}
            </div>
            {zusatzausstattung.map((item, i) => (
              <div key={i} className="row">
                <input value={item.bezeichnung} onChange={e => update(zusatzausstattung, setZusatzausstattung, i, 'bezeichnung', e.target.value)} />
                <input type="number" value={item.menge} onChange={e => update(zusatzausstattung, setZusatzausstattung, i, 'menge', parseFloat(e.target.value))} />
                <input type="number" value={item.einzelpreis} onChange={e => update(zusatzausstattung, setZusatzausstattung, i, 'einzelpreis', parseFloat(e.target.value))} />
                <span className="factor">× {mietdauer}</span>
                <span className="total">{(item.menge * item.einzelpreis * mietdauer).toFixed(2)}€</span>
                <button className="btn-delete" onClick={() => remove(zusatzausstattung, setZusatzausstattung, i)}><Trash2 size={16} /></button>
              </div>
            ))}
          </section>

          <div className="kalkulation">
            <h2>Gesamtkalkulation</h2>
            <div className="kalk-grid">
              <div className="kalk-card"><span>Aluvision</span><strong>{kalk.alu.toFixed(2)}€</strong></div>
              <div className="kalk-card"><span>Pixlip</span><strong>{kalk.pix.toFixed(2)}€</strong></div>
              <div className="kalk-card"><span>Zusatz</span><strong>{kalk.zus.toFixed(2)}€</strong></div>
            </div>
            <div className="kalk-total">
              <span>GESAMT</span>
              <strong>{kalk.gesamt.toFixed(2)}€</strong>
            </div>
          </div>

          <div className="export-actions">
            <button className="btn success" onClick={exportCSV}><Download size={20} /> CSV Export</button>
            <button className="btn primary" onClick={() => window.print()}><Download size={20} /> PDF Drucken</button>
          </div>
        </div>

        {showProjects && (
          <div className="modal" onClick={() => setShowProjects(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Meine Projekte</h2>
              <button className="btn-close" onClick={() => setShowProjects(false)}>×</button>
              <div className="project-list">
                {projects.map(p => (
                  <div key={p.id} className="project-card">
                    <div>
                      <h3>{p.projektname}</h3>
                      <p>{p.breite}×{p.tiefe}×{p.hoehe}m</p>
                    </div>
                    <div className="project-actions">
                      <button className="btn primary" onClick={() => loadProject(p)}>Öffnen</button>
                      <button className="btn danger" onClick={() => deleteProject(p.id)}>Löschen</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
