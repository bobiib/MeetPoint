# MeetPoint Backend

Backend-Grundlage fuer PostgreSQL und PostgREST.

## Enthalten

- Datenbanktabellen fuer Benutzer, Gruppen, Mitglieder, Interessen, Aktivitaeten, Termine und Verfuegbarkeiten
- PostgREST-kompatibles `api`-Schema
- Registrierung ueber `POST /users` im PostgREST-Schema
- Beispiel-Konfiguration fuer PostgREST

## Lokal starten

```powershell
cd backend-src
docker compose up -d
```

PostgREST laeuft danach auf:

```text
http://127.0.0.1:3001
```

Das Vue-Frontend leitet `/api` automatisch an `http://127.0.0.1:3001` weiter.

Demo-Login:

```text
E-Mail: boris@example.com
Passwort: MeetPoint123
```

Weitere Testbenutzer:

```text
dmytro@example.com
fabio@example.com
noel@example.com
```

Alle Demo-Benutzer haben das Passwort `MeetPoint123`.

## Frontend starten

```powershell
cd frontend-src\meetpoint
npm run dev
```

## Dmytros heutige Arbeit

- `1.2 Benutzerdaten speichern`: `api.users` nimmt Registrierungsdaten entgegen und speichert sie in `app.users`.
- `5.1 Tabellen erstellen`: Die benoetigten Kern-Tabellen sind in `database/001_create_tables.sql` definiert.
