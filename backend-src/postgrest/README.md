# PostgREST

Beispiel-Konfiguration fuer die lokale PostgREST-Anbindung.

1. PostgreSQL-Datenbank `meetpoint` erstellen.
2. SQL-Dateien aus `backend-src/database` ausfuehren.
3. `postgrest.conf.example` kopieren und Zugangsdaten anpassen.
4. PostgREST starten.

Das Frontend erwartet lokal eine API unter `/api`. In der Entwicklung kann Vite spaeter auf
PostgREST weiterleiten.
