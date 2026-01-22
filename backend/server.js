// server.js - Backend Server mit Express und SQLite
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Datenbank initialisieren
const db = new sqlite3.Database('./messestand.db', (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Datenbank:', err);
  } else {
    console.log('Datenbank verbunden');
    initDatabase();
  }
});

// Datenbank-Schema erstellen
function initDatabase() {
  db.serialize(() => {
    // Benutzer-Tabelle
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Projekte-Tabelle
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      projektname TEXT NOT NULL,
      breite REAL,
      tiefe REAL,
      hoehe REAL,
      system TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Vorlagen/Templates-Tabelle für Aluvision
    db.run(`CREATE TABLE IF NOT EXISTS aluvision_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      typ TEXT,
      einheit TEXT,
      preis REAL,
      is_global INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Vorlagen/Templates-Tabelle für Pixlip
    db.run(`CREATE TABLE IF NOT EXISTS pixlip_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      typ TEXT,
      einheit TEXT,
      preis REAL,
      is_global INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Vorlagen/Templates-Tabelle für Zusatzausstattung
    db.run(`CREATE TABLE IF NOT EXISTS zusatz_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      kategorie TEXT,
      einheit TEXT,
      preis REAL,
      is_global INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Standard-Vorlagen einfügen
    insertDefaultTemplates();

    // Demo-Benutzer erstellen (nur wenn noch nicht vorhanden)
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, email, password, role) 
            VALUES ('demo', 'demo@messestand.de', ?, 'admin')`, [hashedPassword]);
  });
}

function insertDefaultTemplates() {
  // Aluvision Standard-Vorlagen
  const aluvisionDefaults = [
    ['Omni 55 Rahmen 496 x 2480 mm', 'Rahmen', 'Stück', 165],
    ['Omni 55 Rahmen 992 x 2480 mm', 'Rahmen', 'Stück', 245],
    ['Omni 55 Rahmen 992 x 2976 mm', 'Rahmen', 'Stück', 285],
    ['Omni 55 Rahmen 992 x 1984 mm', 'Rahmen', 'Stück', 215],
    ['Omni 55 Rahmen 992 x 992 mm', 'Rahmen', 'Stück', 125],
    ['Omni 55 Tür 992 x 2480 mm', 'Tür', 'Stück', 385],
    ['Omni 55 Lamellenrahmen 992 x 2480 mm', 'Lamellenrahmen', 'Stück', 295],
    ['Linearprofil', 'Profil', 'Stück', 15],
    ['T-Corner', 'Verbinder', 'Stück', 18],
    ['L-Corner', 'Verbinder', 'Stück', 16],
    ['X-Corner', 'Verbinder', 'Stück', 22],
    ['Monitorhalter', 'Halterung', 'Stück', 45],
    ['Kedertextil Durchlicht', 'Textil', 'm²', 35],
    ['Kedertextil Blockout', 'Textil', 'm²', 42]
  ];

  aluvisionDefaults.forEach(([name, typ, einheit, preis]) => {
    db.run(`INSERT OR IGNORE INTO aluvision_templates (name, typ, einheit, preis, is_global) 
            VALUES (?, ?, ?, ?, 1)`, [name, typ, einheit, preis]);
  });

  // Pixlip Standard-Vorlagen
  const pixlipDefaults = [
    ['Pixlip Rahmen 1000 x 2500 mm', 'Rahmen', 'Stück', 145],
    ['Pixlip Rahmen 500 x 2500 mm', 'Rahmen', 'Stück', 95],
    ['Kedertextil Durchlicht', 'Textil', 'm²', 32],
    ['Kedertextil Blockout', 'Textil', 'm²', 38]
  ];

  pixlipDefaults.forEach(([name, typ, einheit, preis]) => {
    db.run(`INSERT OR IGNORE INTO pixlip_templates (name, typ, einheit, preis, is_global) 
            VALUES (?, ?, ?, ?, 1)`, [name, typ, einheit, preis]);
  });

  // Zusatzausstattung Standard-Vorlagen
  const zusatzDefaults = [
    ['Theke Standard', 'Möbel', 'Stück', 185],
    ['Stehtisch', 'Möbel', 'Stück', 45],
    ['Barhocker', 'Möbel', 'Stück', 35],
    ['LED-Spot', 'Licht', 'Stück', 25],
    ['Monitor 55"', 'AV', 'Stück', 280],
    ['Teppich', 'Boden', 'm²', 12]
  ];

  zusatzDefaults.forEach(([name, kategorie, einheit, preis]) => {
    db.run(`INSERT OR IGNORE INTO zusatz_templates (name, kategorie, einheit, preis, is_global) 
            VALUES (?, ?, ?, ?, 1)`, [name, kategorie, einheit, preis]);
  });
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Zugriff verweigert' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Ungültiges Token' });
    }
    req.user = user;
    next();
  });
}

// ==================== AUTH ROUTES ====================

// Registrierung
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
          }
          return res.status(500).json({ error: 'Fehler bei der Registrierung' });
        }
        res.status(201).json({ message: 'Benutzer erfolgreich erstellt', userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server-Fehler' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server-Fehler' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });
});

// Benutzer-Info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server-Fehler' });
    }
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    res.json(user);
  });
});

// ==================== PROJEKT ROUTES ====================

// Alle Projekte des Benutzers
app.get('/api/projects', authenticateToken, (req, res) => {
  db.all('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id], (err, projects) => {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Laden der Projekte' });
    }
    res.json(projects.map(p => ({
      ...p,
      data: JSON.parse(p.data)
    })));
  });
});

// Projekt erstellen
app.post('/api/projects', authenticateToken, (req, res) => {
  const { projektname, breite, tiefe, hoehe, system, data } = req.body;

  db.run(
    `INSERT INTO projects (user_id, projektname, breite, tiefe, hoehe, system, data) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, projektname, breite, tiefe, hoehe, system, JSON.stringify(data)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Erstellen des Projekts' });
      }
      res.status(201).json({ id: this.lastID, message: 'Projekt erstellt' });
    }
  );
});

// Projekt aktualisieren
app.put('/api/projects/:id', authenticateToken, (req, res) => {
  const { projektname, breite, tiefe, hoehe, system, data } = req.body;
  const projectId = req.params.id;

  db.run(
    `UPDATE projects 
     SET projektname = ?, breite = ?, tiefe = ?, hoehe = ?, system = ?, data = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [projektname, breite, tiefe, hoehe, system, JSON.stringify(data), projectId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Aktualisieren des Projekts' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Projekt nicht gefunden' });
      }
      res.json({ message: 'Projekt aktualisiert' });
    }
  );
});

// Projekt löschen
app.delete('/api/projects/:id', authenticateToken, (req, res) => {
  const projectId = req.params.id;

  db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Fehler beim Löschen des Projekts' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Projekt nicht gefunden' });
    }
    res.json({ message: 'Projekt gelöscht' });
  });
});

// ==================== TEMPLATE ROUTES ====================

// Aluvision Templates
app.get('/api/templates/aluvision', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM aluvision_templates WHERE is_global = 1 OR user_id = ?',
    [req.user.id],
    (err, templates) => {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Laden der Vorlagen' });
      }
      res.json(templates);
    }
  );
});

app.post('/api/templates/aluvision', authenticateToken, (req, res) => {
  const { name, typ, einheit, preis, is_global } = req.body;
  
  db.run(
    'INSERT INTO aluvision_templates (user_id, name, typ, einheit, preis, is_global) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, name, typ, einheit, preis, is_global || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Erstellen der Vorlage' });
      }
      res.status(201).json({ id: this.lastID, message: 'Vorlage erstellt' });
    }
  );
});

// Pixlip Templates
app.get('/api/templates/pixlip', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM pixlip_templates WHERE is_global = 1 OR user_id = ?',
    [req.user.id],
    (err, templates) => {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Laden der Vorlagen' });
      }
      res.json(templates);
    }
  );
});

app.post('/api/templates/pixlip', authenticateToken, (req, res) => {
  const { name, typ, einheit, preis, is_global } = req.body;
  
  db.run(
    'INSERT INTO pixlip_templates (user_id, name, typ, einheit, preis, is_global) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, name, typ, einheit, preis, is_global || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Erstellen der Vorlage' });
      }
      res.status(201).json({ id: this.lastID, message: 'Vorlage erstellt' });
    }
  );
});

// Zusatz Templates
app.get('/api/templates/zusatz', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM zusatz_templates WHERE is_global = 1 OR user_id = ?',
    [req.user.id],
    (err, templates) => {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Laden der Vorlagen' });
      }
      res.json(templates);
    }
  );
});

app.post('/api/templates/zusatz', authenticateToken, (req, res) => {
  const { name, kategorie, einheit, preis, is_global } = req.body;
  
  db.run(
    'INSERT INTO zusatz_templates (user_id, name, kategorie, einheit, preis, is_global) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, name, kategorie, einheit, preis, is_global || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Erstellen der Vorlage' });
      }
      res.status(201).json({ id: this.lastID, message: 'Vorlage erstellt' });
    }
  );
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Demo-Login: Benutzername: demo, Passwort: demo123`);
});
