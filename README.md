# VokaOrbit - Offline-First Vokabeltrainer

VokaOrbit ist ein moderner Vokabeltrainer, der komplett offline funktioniert und den FSRS-Algorithmus (Free Spaced Repetition Scheduler) nutzt, um deinen Lernerfolg zu maximieren.

## Starten des Projekts

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

3. **PWA nutzen:**
   Die App ist als Progressive Web App (PWA) konzipiert. Nach dem ersten Laden im Browser kann sie über das "Installieren"-Icon (meist in der Adressleiste) als App auf dem Desktop oder Smartphone gespeichert werden und funktioniert danach komplett ohne Internetverbindung.

## Erste Schritte

1. **Erstes Deck anlegen:**
   - Klicke auf dem Dashboard auf das `+` Icon oben rechts.
   - Gib dem Deck einen Namen (z.B. "Spanisch") und wähle die Sprache.
   - Klicke auf "Erstellen".

2. **Vokabeln importieren mit KI:**
   - Gehe zum Tab "Import".
   - Wähle dein Ziel-Deck aus.
   - Nutze den **KI-Vokabel-Prompt**: Gib ein Thema ein (z.B. "Im Restaurant") und klicke auf "Kopieren".
   - Füge diesen Prompt in eine KI deiner Wahl (Gemini, ChatGPT, Claude) ein.
   - Kopiere die Antwort der KI (die Liste im Textformat).
   - Füge die Liste in das Feld "Vokabeln einfügen" ein.
   - Klicke auf "Prüfen" und dann auf "Jetzt anlegen".

3. **Lernen:**
   - Klicke auf dein Deck im Dashboard.
   - Nutze die Orbit-Karten: "Aufdecken" zeigt die Lösung.
   - Bewerte deinen Lernerfolg (Nochmal, Schwer, Gut, Leicht). Der Algorithmus berechnet automatisch den nächsten optimalen Zeitpunkt für die Wiederholung.

Viel Erfolg beim Lernen im Orbit! 🚀
