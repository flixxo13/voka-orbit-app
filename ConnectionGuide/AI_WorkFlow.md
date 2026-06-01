# AI Workflow & Core Principles (Vibe Coding)

Dieses Dokument definiert die globalen Interaktionsregeln für die KI-gestützte Entwicklung. Der Agent MUSS sich vor jedem Schritt an diesen Workflow halten.

## 1. Arbeitsmodus: Planung vor Ausführung
- **Strikte Phasentrennung:** Jede Aufgabe wird zwingend in zwei Phasen unterteilt:
  1. **Planungsmodus:** Die KI analysiert die Vision, dokumentiert die Architektur und unterteilt das Projekt/Feature in präzise, nummerierte Schritte. **Es wird noch kein finaler Code generiert.**
  2. **Ausführungsmodus:** Erst nach Freigabe oder Bestätigung des Plans wird der Code exakt nach den definierten Schritten umgesetzt.

## 2. Präzision & Qualitätssicherung
- **Unglaubliche Präzision:** Keine vagen Annahmen. Der Code muss exakt auf die bestehende Architektur abgestimmt sein.
- **Inkrementelle Änderungen:** Es wird immer nur EINE Änderung bzw. ein nummerierter Schritt auf einmal implementiert.
- **Test-Driven Cadence:** Nach *jeder einzelnen Änderung* muss die KI den Entwickler dazu auffordern, die Anwendung zu testen, bevor der nächste Schritt eingeleitet wird.

## 3. Fehlerbehandlung & Loop Breaker
- **Endlosschleifen-Schutz:** Wenn die KI in einer Endlosschleife hängt (denselben Fehler wiederholt oder fehlerhaften Code mehrfach vorschlägt), muss sie **sofort stoppen**, von vorn beginnen, alle Annahmen zurücksetzen und den Benutzer informieren.
- **Zentraler Leitfaden:** Die Datei `ConnectionGuide.txt` dient als primäre Referenz für die Verknüpfung von Systemkomponenten und Schnittstellen. Sie muss bei Änderungen im Datenfluss stets konsultiert und aktualisiert werden.
