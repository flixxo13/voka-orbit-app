Beispiel Prompt: # VocaOrbit - Global App Constraints & UI/UX Rules

Dieses Dokument enthält die unumstößlichen funktionalen und visuellen Bedingungen für die Entwicklung der Vokabel-Lern-App **VocaOrbit**.

## 1. Tech-Stack & Architektur
- **Frontend:** React / TypeScript / Tailwind CSS
- **Backend/Database:** Supabase / Kotlin (Mobile-Schnittstellen)
- **Design-Ansatz:** Mobile-First, responsiv und hochgradig performant.

## 2. Gameplay-Mechaniken & Dynamic Difficulty
- **Vokabel-Limit:** Es gilt ein einstellbares Minimum und Maximum an Vokabeln während des Spiels, damit der Spieler auch bei steigender Geschwindigkeit stets den Überblick behält.
- **Dynamische Schwierigkeit:** Die Schwierigkeit (z. B. Geschwindigkeit, Frequenz) steigt während des laufenden Spiels dynamisch an.
- **3-Stufen-Lernsystem:** - *Stufe 1:* Reguläre Spiel-/Lernrunde.
  - *Stufe 2 (Spezialmodus):* Alle Vokabeln, die in der ersten Runde falsch beantwortet wurden, werden hier gezielt wiederholt und vertieft.
  - *Stufe 3:* Konsolidierung und Abschlussüberprüfung.

## 3. Strikte UI/UX & Animations-Regeln (Fehler-Feedback)
Wenn ein Benutzer einen Fehler macht (falsche Vokabel), greift folgende Logik:
- **Zufällige Positionierung:** Der visuelle Fehlerhinweis muss an einer zufälligen Position auf dem Bildschirm erscheinen.
- **Keine Überlagerung:** Die Hinweise dürfen sich niemals mit bestehenden UI-Elementen oder anderen aktiven Hinweisen überlagern.
- **Reduzierter Inhalt:** Der Hinweis zeigt *ausschließlich* die empfohlene Lerndauer an.
- **Fade-Out-Animation:** Der Hinweis muss nach und nach über eine flüssige Animation (Tailwind-basiert, ohne schwere externe Bibliotheken) ausbleichen und sich selbst zerstören.
