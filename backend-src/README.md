# MeetPoint Backend

Backend-Grundlage fuer PostgreSQL und PostgREST.

## Enthalten

- Datenbanktabellen fuer Benutzer, Gruppen, Mitglieder, Interessen, Aktivitaeten, Termine und Verfuegbarkeiten
- PostgREST-kompatibles `api`-Schema
- Registrierung ueber `POST /users` im PostgREST-Schema
- Beispiel-Konfiguration fuer PostgREST

## Dmytros heutige Arbeit

- `1.2 Benutzerdaten speichern`: `api.users` nimmt Registrierungsdaten entgegen und speichert sie in `app.users`.
- `5.1 Tabellen erstellen`: Die benoetigten Kern-Tabellen sind in `database/001_create_tables.sql` definiert.
