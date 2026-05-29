# MeetPoint Database

Diese Dateien decken Dmytros heutige Arbeitspakete ab:

- `1.2 Benutzerdaten speichern`
- `5.1 Tabellen erstellen`

## Reihenfolge

```sql
\i backend-src/database/001_create_tables.sql
\i backend-src/database/002_seed_demo_data.sql
\i backend-src/database/003_postgrest_permissions.sql
\i backend-src/database/004_auth_functions.sql
```

## Registrierung

PostgREST soll das Schema `api` freigeben. Boris' Frontend sendet Registrierungen an:

```text
POST /api/users
```

Beispiel-Body:

```json
{
  "username": "boris",
  "email": "boris@example.com",
  "password": "MeetPoint123"
}
```

Die öffentliche View `api.users` nimmt das Feld `password` entgegen. Gespeichert wird es in
`app.users.password_hash`, nicht als Klartext.

## Login

Fabios Frontend ruft diese Funktion auf:

text
POST /api/rpc/login_user
Beispiel-Body:

{
  "user_email": "boris@example.com",
  "user_password": "MeetPoint123"
}
Bei korrekten Daten gibt die Funktion zurück:

{
  "id": "...",
  "username": "boris",
  "email": "boris@example.com"
}
Das Passwort wird mit crypt() gegen password_hash geprüft.