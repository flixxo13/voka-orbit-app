# 📘 Prompt Engineering Foundations & AI Workflow Guide

Dieses Dokument fasst die fundamentalen Prinzipien des Prompt Engineerings und der KI-gestützten Softwareentwicklung (Vibe Coding) zusammen. Es dient als "Single Source of Truth" für die Interaktion zwischen Entwickler und KI-Agenten, um deterministische, fehlerfreie und hocheffiziente Ergebnisse zu erzielen.

---

## 1. Die Anatomie eines perfekten Prompts
Ein robuster Prompt besteht aus vier Kernkomponenten. Wenn KI-Outputs ungenau werden, liegt es meist an der Schwäche einer dieser Komponenten (insbesondere des Kontextes):

1. **Rolle & Persona ("Wer"):** Definiert die Identität und das Fachwissen (schränkt den Suchraum im Modell ein).
2. **Instruktion/Aufgabe ("Was"):** Die klare, unmissverständliche Handlungsaufforderung.
3. **Kontext & Daten ("Womit"):** Das Rohmaterial, bestehender Code, API-Dokumentationen oder Architektur-Vorgaben. *Dies ist der größte Hebel, um zu verhindern, dass die KI im Vakuum operiert.*
4. **Output-Formatierung ("Wie"):** Die exakte Strukturvorgabe (z. B. JSON-Schema, Code-Block ohne Erklärung, tabellarisch).

---

## 2. Die 3 fundamentalen Prompting-Techniken

### A. Zero-Shot Prompting
- **Konzept:** Direkte Aufgabe ohne Beispiele.
- **Anwendung:** Einfache Standardaufgaben, bekannte Algorithmen, Texttransformationen.

### B. Few-Shot Prompting (In-Context Learning)
- **Konzept:** Übergabe von Beispielen (Eingabe -> Ausgabe) vor der eigentlichen Aufgabe.
- **Anwendung:** Strikte Formatierungsvorgaben, Durchsetzung eines spezifischen Programmierstils.

### C. Chain-of-Thought (CoT) Prompting
- **Konzept:** Das Modell wird gezwungen, seine Denkschritte explizit zu formulieren, bevor es das Endergebnis ausgibt ("Denke Schritt für Schritt").
- **Anwendung:** *Der Goldstandard für Debugging, komplexe mathematische Probleme und logische UI-Kollisionsprüfungen.* Verhindert, dass sich das Modell zu früh auf einen falschen Pfad festlegt.

---

## 3. Das Interaktions-Paradigma: Planung vor Ausführung
Um Over-Engineering, Code-Zerstörung und voreilige Code-Generierung zu verhindern, wird eine strikte Phasentrennung durchgesetzt:

* **Phase 1: Planungsmodus (Analyse & Logik)**
    * Die KI analysiert die Vision oder das Problem im aktuellen Kontext.
    * Sie dokumentiert die logischen Schritte, prüft Einschränkungen (Constraints) und erstellt einen nummerierten Fahrplan.
    * **Constraint:** In dieser Phase wird *kein finaler Programmcode* generiert.
* **Phase 2: Ausführungsmodus (Implementierung)**
    * Erst nach Freigabe oder Bestätigung des Plans wird der Code exakt nach den definierten Schritten umgesetzt.
    * Es wird immer nur **eine** Änderung bzw. ein einzelner Schritt auf einmal implementiert (inkrementelles Arbeiten).

---

## 4. Constraint- & Kontextmanagement (Safety Nets)

- **Negative Constraints:** Explizite Verbote (z. B. *"Installiere keine externen Bibliotheken"*, *"Verändere nicht das bestehende State-Management"*), um das Modell im Zaum zu halten.
- **Anker-Dateien (Connection Guide):** Eine zentrale Datei (`ConnectionGuide.txt`), die als technischer Klebstoff dient. Sie enthält Datenbankschemata, API-Kontrakte und Systemgrenzen und muss bei jeder Schnittstellenänderung konsultiert werden.
- **Test-Driven Cadence:** Nach *jeder einzelnen Änderung* fordert die KI den Entwickler auf, die Anwendung` zu testen, bevor der nächste Schritt eingeleitet wird.
- **Loop Breaker (Endlosschleifen-Schutz):** Wenn eine KI in einer Schleife hängt (denselben Fehler wiederholt vorschlägt), muss sie sofort stoppen, alle Annahmen zurücksetzen und den Benutzer informieren, anstatt weiter zu raten.

---

## 5. Meta-Prompting (Systematische Iteration)
Die effizienteste Methode zur Prompt-Optimierung ist die Nutzung der KI selbst. Wenn ein Prompt oder eine Regel ungenau wird, fungiert das Modell als "Prompt-Architekt":

> **Meta-Prompt-Schema:**
> "Du bist LLM-Architekt. Hier ist mein aktueller Prompt: `[...]`. Das Problem ist, dass die KI dabei Fehler `X` macht. Optimiere den Prompt unter Nutzung von klaren Blockstrukturen (Markdown/XML) und unmissverständlichen Constraints, um dieses Fehlverhalten komplett zu eliminieren."

---

## 6. Das „Consultant- & Architekten“-Pattern (Für alle Level)
Dieses Pattern übersetzt komplexe Chain-of-Thought-Architektur in einfache, natürliche Sprache. Es zwingt die KI in den Beratermodus und schützt Entwickler (unabhängig von ihrer Erfahrung) vor voreiligem und fehlerhaftem Code.

### Universal-Schablone für neue Features / Probleme:
```markdown
# 🧠 MASTER-PROMPT: PLANUNG VOR AUSFÜHRUNG

## 👤 ROLLE & PERSONA
Du agierst als Senior Softwarearchitekt und Tech-Consultant. Führe mich strategisch durch die Umsetzung. Erkläre technische Konzepte verständlich in natürlicher Sprache und vermeide unnötigen Jargon.

## 🎯 AUSGANGSLAGE & ZIEL
- **Mein Projekt / Tech-Stack:** [Projekt & Technologien eintragen, z.B. VokaOrbit App]
- **Mein Problem / Gewünschtes Feature:** [Problem in einfachen Worten beschreiben]

## 🚫 STRIKTE EINSCHRÄNKUNGEN (CONSTRAINTS)
- Nutze die einfachste und sauberste Standardlösung. Vermeide schwere externe Bibliotheken.
- Generiere in deiner ersten Antwort **AUF KEINEN FALL** finalen Programmiercode.

## ⏱️ ARBEITSMODUS (Strikte Phasentrennung)
1. **PHASE 1: RECHERCHE:** Nenne 2-3 gängige Lösungswege mit Vor-/Nachteilen und einer Empfehlung.
2. **PHASE 2: PLANUNG:** Erstelle einen präzisen, nummerierten Step-by-Step Fahrplan für die Umsetzung.
3. **PHASE 3: STOPP-SIGNAL:** Halte sofort an. Schreibe keinen Code. Stelle mir zwei Fragen: 
   1. "Ist der Plan für dich logisch nachvollziehbar?"
   2. "Sollen wir genau so mit Schritt 1 starten?"
   Warte auf meine explizite Freigabe, bevor du Code generierst.
