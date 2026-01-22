# Messestand Kalkulator - Render.com Deployment

## 📦 Projekt-Struktur

```
messestand-kalkulator/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   └── App.css
│   ├── package.json
│   └── .gitignore
└── README.md
```

## 🚀 Schnellstart

### 1. GitHub Repository erstellen

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/messestand-kalkulator.git
git push -u origin main
```

### 2. Backend auf Render deployen

**Service-Konfiguration:**
- Name: `messestand-backend`
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  - `NODE_ENV`: `production`
  - `JWT_SECRET`: `DEIN-SICHERES-GEHEIMNIS`
  - `PORT`: `10000`

### 3. Frontend auf Render deployen

**Service-Konfiguration:**
- Name: `messestand-frontend`
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npx serve -s build -l 10000`
- Environment Variables:
  - `REACT_APP_API_URL`: `https://deine-backend-url.onrender.com/api`
  - `NODE_ENV`: `production`

### 4. CORS konfigurieren

Im Backend die Environment Variable hinzufügen:
- `FRONTEND_URL`: `https://deine-frontend-url.onrender.com`

## ✨ Features

- ✅ Multi-User mit Login/Register
- ✅ Projektmanagement (Speichern, Laden, Löschen)
- ✅ Aluvision + Pixlip kombinierbar
- ✅ **Linearprofil mit Längen-Faktor** (NEU!)
- ✅ Kedertextile mit freien Maßen
- ✅ Mietdauer-Faktor für Zusatzausstattung
- ✅ CSV/PDF Export
- ✅ Responsive Design

## 🔧 Lokale Entwicklung

### Backend starten:
```bash
cd backend
npm install
npm start
```
Server läuft auf: http://localhost:3001

### Frontend starten:
```bash
cd frontend
npm install
npm start
```
Frontend läuft auf: http://localhost:3000

## 📝 Hinweise

- Demo-Login: `demo` / `demo123`
- SQLite-Datenbank wird automatisch erstellt
- Alle Vorlagen sind vorinstalliert

## 🆕 Neue Features (v2)

### Linearprofil mit Längen-Faktor
- Eingabefeld für Länge in Metern
- Automatische Berechnung: Menge × Preis/m × Länge
- Visuelle Anzeige des Faktors
- Export mit Längen-Info im CSV

**Beispiel:**
- 3 Stück Linearprofil
- 15€/m
- 4,5m Länge
- = 3 × 15€ × 4,5m = **202,50€**

## 📞 Support

Bei Problemen:
1. Logs in Render Dashboard prüfen
2. Browser-Konsole (F12) auf Fehler prüfen
3. API-Calls im Network-Tab überprüfen

## 🔐 Sicherheit

**Wichtig für Produktion:**
- JWT_SECRET ändern!
- HTTPS verwenden
- Rate-Limiting implementieren
- Input-Validierung erweitern
