# MeetPoint 🎯

MeetPoint ist eine moderne Web-App, mit der du schnell und unkompliziert Termine für Gruppenaktivitäten finden kannst – ohne Chat-Chaos! Du kannst Gruppen erstellen, Interessen sammeln, Aktivitäten vorschlagen und für die besten Termine abstimmen.

Dieses Projekt wurde als moderne Single-Page-Application (SPA) mit **Vue 3** gebaut. Das Backend nutzt eine **PostgreSQL** Datenbank zusammen mit **PostgREST**, um blitzschnell und automatisch eine REST-API aus dem Datenbankschema bereitzustellen.

---

## 🚀 Features

- **Gruppen- & Mitgliederverwaltung**: Organisiere dich in verschiedenen Gruppen.
- **Interessen-Tracking**: Finde Aktivitäten, die zu euren Interessen passen (z.B. "Essen", "Sport").
- **Aktivitäten planen**: Schlage Events vor und hinterlege Terminvorschläge.
- **Intelligente Abstimmung**: Stimme mit 👍 / 👎 ab. Das System wertet automatisch alle Stimmen aus und kürt den **🏆 Besten Termin**!
- **Sicheres Löschen**: Nur Besitzer und Ersteller können Gruppen, Aktivitäten oder Termine löschen (doppelt gesichert in UI und Datenbank).
- **Stunning Design**: Ein modernes Dark-Theme mit Glassmorphism und Mikro-Animationen.

---

## 🛠️ Tech Stack

- **Frontend:** Vue 3 (Composition API), Vite, TypeScript, Vanilla CSS (Dark Mode & Glassmorphism)
- **Backend:** PostgreSQL (Datenbank), PostgREST (automatische REST-API)
- **Infrastruktur:** Docker & Docker Compose (für die lokale Datenbank)

---

## 💻 Lokales Setup & Installation

Damit das Projekt lokal auf deinem Rechner läuft, musst du das Backend (die Datenbank) und das Frontend starten.

### 1. Voraussetzungen
- [Node.js](https://nodejs.org/) (Version 18 oder neuer)
- [Docker](https://www.docker.com/products/docker-desktop) (für die Datenbank)

### 2. Backend starten (Datenbank)

Das Backend läuft komplett in Docker-Containern und muss nur einmal gestartet werden.

```bash
# 1. Wechsle in das Backend-Verzeichnis
cd backend-src

# 2. Starte die Datenbank und PostgREST
docker-compose up -d

# 3. Das Backend ist nun erreichbar unter: http://localhost:3000
```
*Tipp: Die Tabellen, Views und Sicherheits-Regeln (Policies/RPCs) werden beim ersten Start des DB-Containers automatisch über die Dateien im Ordner `backend-src/database` angelegt.*

### 3. Frontend starten (Web-App)

Das Frontend ist eine Vue 3 App, die mit Vite gebaut wird.

```bash
# 1. Wechsle in das Frontend-Verzeichnis
cd frontend-src/meetpoint

# 2. Installiere alle Abhängigkeiten
npm install

# 3. Starte den Development Server
npm run dev
```

Die App ist nun im Browser unter **`http://localhost:5173`** erreichbar!

---

## 🔐 Architektur & Sicherheit

Das System wurde als Prototyp gebaut. Die Authentifizierung erfolgt ohne JWT, stattdessen verlässt sich das System auf die Benutzer-ID (MVP-Phase). 
Um die Integrität dennoch sicherzustellen, wurde ein sicheres Lösch-System implementiert:
Das Frontend verbirgt Lösch-Buttons für normale Mitglieder. Zudem nutzt die App für alle Lösch-Vorgänge keine direkten `DELETE`-Requests, sondern schickt die Anfrage an gesicherte **RPC-Funktionen** (Remote Procedure Calls) in der PostgreSQL-Datenbank (`delete_activity`, `delete_group`, etc.). Diese prüfen direkt in der Datenbank auf Row-Level, ob der aufrufende User wirklich der Ersteller oder der Gruppenbesitzer ist.

## 👨‍💻 Entwickler

Entwickelt für eine saubere Code-Basis, moderne UX und einfache Erweiterbarkeit.
