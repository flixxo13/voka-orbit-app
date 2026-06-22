Google KI:

du bist Softwareentwickler und Vibe Coder: welche Dateien sollte man der KI öfters mitgeben, damit sie sich zurechtfindet im App Projekt

Suchergebnisse
du bist Softwareentwickler und Vibe Coder: welche Dateien sollte man der KI öfters mitgeben, damit sie sich zurechtfindet im App Projekt

Als Vibe Coder und Softwareentwickler willst du, dass die KI deine Gedanken liest und sofort fehlerfreien Code liefert. Damit das klappt, braucht sie Kontext statt Raten.

Gib der KI bei neuen Prompts standardmäßig diese fünf Schlüsseldateien mit:

1. Die Navigationskarte (Struktur)

Welche Datei: Ein Text-Tree deines Projekts (z. B. generiert via tree -I "node_modules|.git" in eine repository-structure.txt).
Warum: Die KI versteht sofort, wo neue Komponenten, Routen oder Styles hingehören.
2. Das Regelwerk (Architektur & Stack)

Welche Datei: package.json, bun.lockb, cargo.toml oder requirements.txt.
Warum: Sie sieht sofort die exakten Versionen deienr Bibliotheken. Das verhindert, dass sie dir veralteten Code oder inkompatible Funktionen vorschlägt.
3. Das Gehirn der Anwendung (Typen)

Welche Datei: Zentrale Typdefinitionen (z. B. types.ts, schema.prisma oder deine Datenbank-Migrations-Dateien).
Warum: Typen sind die beste Dokumentation. Wenn die KI die Datenstruktur kennt, schreibt sie Code, der auf Anhieb kompiliert.
4. Das Verhaltensmuster (Konfiguration)

Welche Datei: Konfigurationsdateien wie tsconfig.json, tailwind.config.js oder next.config.js.
Warum: Sie lernt deine Pfad-Aliase (z. B. @/components/) und deine Design-Vorgaben, sodass der Code optisch und strukturell sofort passt.
5. Die Source of Truth (Aktueller Kontext)

Welche Datei: Die Datei, an der du gerade baust, plus ihre direkten Nachbarn (z. B. die API-Route, die diese Komponente aufruft).
Warum: Isolierter Code führt zu Fehlern. Die KI muss sehen, wie Daten in die Datei hineinfließen und sie wieder verlassen.
Pro-Tipp für Vibe Coding: Erstelle eine .cursorrules oder ai-instructions.md im Root-Verzeichnis. Schreibe dort kurz deinen Tech-Stack, deinen bevorzugten Coding-Stil (z. B. "Nutze funktionale Komponenten, keine Klassen") und architektonische Tabus hinein. Viele moderne KI-Code-Editoren lesen diese Datei bei jedem Prompt automatisch.

Wenn du möchtest, kann ich dir dabei helfen, eine solche Konfigurationsdatei für deine KI zu erstellen. Sag mir einfach:

Welchen Tech-Stack (Framework, Sprache, Datenbank) du nutzt.
Ob du ein bestimmtes CSS-Framework verwendest.
Welchen Schreibstil (z. B. extrem minimalistisch oder stark kommentiert) du bevorzugst.
ist es üblicherweise eine readme.md oder conmectionguide.txt oder md ?

Es ist üblicherweise eine README.md.

Markdown (.md) ist der absolute Standard für Dokumentationen in der Softwareentwicklung. Textdateien (.txt) werden von KIs zwar verstanden, bieten aber keine Strukturierunglemente wie Überschriften oder Code-Blöcke.

Hier ist die gängige Praxis im Überblick:

Warum die README.md die beste Wahl ist

Standard-Erkennung: Jede moderne Code-KI (wie GitHub Copilot, Cursor oder Claude) scannt die README.md im Hauptverzeichnis automatisch, um das Projekt zu verstehen.
Formatierung: Durch Markdown-Syntax (# Überschrift, code) kann die KI die Struktur deines Projekts blitzschnell parsen.
All-in-One: Dort gehört alles hinein – vom Tech-Stack über Setup-Befehle bis hin zu Besonderheiten der Architektur.
Wann man andere Dateien nutzt

.cursorrules / .clinerules: Spezielle Konfigurationsdateien für KI-Editoren (wie Cursor oder VS Code Erweiterungen). Diese sind ausschließlich für Prompts und KI-Regeln gedacht.
CONTRIBUTING.md: In größeren Teams. Sie erklärt Entwicklern (und KIs), wie neuer Code formatiert und eingereicht werden soll.
connectionguide.txt: Das ist kein Standard. Ein solcher Name wird höchstens temporär für spezifische Netzwerkeinstellungen oder API-Verbindungen genutzt, sollte für die KI aber eher in die zentrale README integriert werden.
Möchtest du, dass ich dir eine optimierte Struktur für deine README.md erstelle, die speziell darauf ausgelegt ist, von KIs perfekt verstanden zu werden?

also ist die Readme.md der zentrale Anker für den Kontext und die Appentwicklung , also dort steht auch der Spezifikationsplan ?

Ja, die README.md ist der zentrale Anker für den Kontext. In kleineren Projekten und beim Vibe Coding ist sie oft das gesamte Gehirn der Anwendung.

Bei der Frage, ob dort auch der Spezifikationsplan stehen sollte, unterscheidet man in der Praxis zwischen zwei Ansätzen:

Ansatz 1: Alles in der README.md (Ideal für kleine Projekte & Solos)

Wenn du die App alleine oder schnell mit KI baust, packst du den Spezifikationsplan direkt als eigenen Abschnitt (z. B. ## Spezifikation oder ## Roadmap) in die README.md.

Vorteil: Die KI hat mit einer einzigen Datei den kompletten Überblick über Ist- und Soll-Zustand.
Nachteil: Die Datei wird bei großen Projekten schnell unübersichtlich.
Ansatz 2: Aufgeteilte Markdown-Dateien (Ideal für wachsende Projekte)

Sobald dein Projekt komplexer wird, splittest du die Dokumentation auf. Die README.md bleibt das Core-Dokument, verweist aber auf spezialisierte Dateien. Die KI liest diese Verweise und du kannst die spezifischen Dateien bei Bedarf gezielt in den Chat füttern:

README.md: Tech-Stack, Setup-Befehle, Architektur-Überblick, Link zu den Specs.
SPECIFICATION.md: Der genaue Bauplan. Funktionen, User Stories, Datenmodell und API-Endpunkte.
TODO.md / ROADMAP.md: Der aktuelle Fortschritt. Was ist fertig, was fehlt? (Perfekt, um der KI zu sagen: "Nimm dir den nächsten Punkt aus der TODO.md vor").
So strukturierst du deine SPECIFICATION.md für die KI

Wenn du den Spezifikationsplan auslagerst, nutzt du am besten diese Struktur, damit die KI fehlerfrei logisch darauf aufbauen kann:

markdown

# App-Spezifikation: [Projektname]

## 1. Kern-Features (MVP)
* [ ] Feature A: Beschreibung und erwartetes Verhalten.
* [ ] Feature B: Beschreibung und erwartetes Verhalten.

## 2. Datenmodell (Schema)
* **User:** id, email, password_hash, created_at
* **Post:** id, title, content, user_id (FK)

## 3. API-Endpunkte / Routen
* `GET /api/posts` -> Liefert alle Beiträge
* `POST /api/posts` -> Erstellt neuen Beitrag (Auth erforderlich)

## 4. Design & UI-Vorgaben
* Primärfarbe: `#0070f3` (Tailwind: `blue-600`)
* Layout: Mobile-First, Sidebar auf Desktop
Verwende Code mit Vorsicht.

Wenn du möchtest, können wir jetzt gemeinsam deinen Spezifikationsplan als Markdown-Struktur aufsetzen. Welches Feature soll deine App als Erstes können?

wärend einer app entwicklung ändert sich mal schnell viel. featurers usw. sollte man die readme.md dann immer mal neu schreiben

Nein, bloß nicht komplett neu schreiben. Das kostet dich beim Vibe Coding viel zu viel Zeit und bricht den Workflow.

Stattdessen aktualisierst du die Dateien inkrementell (schrittweise) und lässt im besten Fall die KI die Drecksarbeit für dich erledigen.

Hier ist die perfekte Strategie, wie du deine Markdown-Dateien ohne Aufwand aktuell hältst:

1. Nutze das "Zwei-Dateien-System"

Wenn sich Features ständig ändern, trenne das Fundament vom Fortschritt. Dadurch verhinderst du, dass du eine riesige Datei ständig anfassen musst:

README.md (Das Fundament): Ändert sich selten. Hier steht nur der Tech-Stack, wie man die App startet und die Grundarchitektur.
TODO.md oder SPEC.md (Der Vibe): Ändert sich täglich. Hier stehen die Features, User Stories und der aktuelle Status.
2. Der "Prompt & Update" Workflow (KI schreibt die Doku)

Schreibe die Dokumentation niemals selbst. Nutze die KI, um die Datei am Ende einer Session oder nach einem großen Feature-Sprung zu aktualisieren.

Beispiel-Prompt für deine KI:

"Ich habe gerade das Login-System auf OAuth umgestellt und die alte Passwort-Tabelle gelöscht. Aktualisiere meine TODO.md und das Datenbankschema in der SPEC.md basierend auf dem aktuellen Code in auth.ts."

3. Arbeite mit Checklisten (- [ ])

Nutze in deiner Feature-Datei einfache Markdown-Checkboxen. Wenn sich ein Feature ändert, löschst du einfach die Zeile oder passt den Text der Checkbox kurz an. KIs lieben diese Listen, weil sie den Status ([x] für fertig, [ ] für offen) sofort parsen können.

4. Ein "Changelog"-Abschnitt für den Vibe

Wenn du radikale Änderungen machst (z. B. Wechsel von einer SQL-Datenbank zu MongoDB), packe ganz oben in deine Feature-Datei einen kurzen Block:

markdown

## Letzte große Änderungen (Kontext für KI)
* **2026-06-22:** Authentifizierung von JWT auf Supabase Auth umgestellt.
* **2026-06-15:** UI von Tailwind auf Shadcn/ui gewechselt.
Verwende Code mit Vorsicht.

Das liest die KI als Erstes und verfällt nicht in alte Muster.

Möchtest du, dass wir für dein aktuelles Projekt direkt eine ultraleichte TODO.md aufsetzen, die du leicht aktuell halten kannst? Tell me!

also wieviele md brauche ich dann für die gesamte entwicklung. z.b. habe ich aucg einige bugs und fix mds. wi drinn steht was es noch für fehöer beim testen gibt und mds für neue featurers, ideen oder verbesserungen

Für ein sauberes Vibe-Coding-Projekt reichen 3 bis maximal 4 Markdown-Dateien völlig aus.

Übertreibe es nicht mit zu vielen einzelnen Dateien – wenn du für jeden Bug und jedes Feature eine eigene .md anlegst, verliert die KI den Überblick und du verbringst mehr Zeit mit Datei-Management als mit Coden.

Hier ist das optimale Setup, das alles abdeckt (Bugs, Features, Ideen):

1. README.md – Das Fundament (1 Datei)

Inhalt: Tech-Stack, Setup-Befehle, Ordnerstruktur.
Änderungsrate: Fast nie (nur bei Systemwechsel).
2. ROADMAP.md (oder SPEC.md) – Der Bauplan (1 Datei)

Inhalt: Die aktuelle Feature-Spezifikation (MVP) und das Datenmodell.
Änderungsrate: Gelegentlich (wenn ein Feature grundlegend umgeplant wird).
3. TODO.md – Das operative Gehirn (1 Datei für alles Dynamische)

Erstelle keine eigenen Dateien für Bugs oder Ideen. Packe das alles zusammen in eine einzige TODO.md mit klaren Abschnitten. KIs lieben diese Datei, weil sie dort den aktuellen Arbeitsstand auf einen Blick sehen.

Strukturiere deine TODO.md einfach so:

markdown

# Projekt-Status

## 🔴 Bugs & Fixes (Höchste Priorität)
* [ ] Bug: Login schlägt fehl, wenn der Nutzername Großbuchstaben enthält.
* [ ] Fix: API-Timeout beim Bilder-Upload auf 10s erhöhen.

## 🟡 Aktuelle Features (In Arbeit / Nächste Schritte)
* [ ] User-Profilseite bauen (inkl. Avatar-Upload).
* [ ] Passwort-Vergessen-Funktion implementieren.

## 🟢 Ideen & Verbesserungen (Backlog)
* [ ] Idee: Dark Mode hinzufügen.
* [ ] Verbesserung: Lade-Animation für die Tabellen optimieren.
Verwende Code mit Vorsicht.

Warum dieses 3-Dateien-System perfekt für KIs ist:

Kein Prompt-Chaos: Du musst der KI im Chat nicht 10 verschiedene Bug-Dateien mitgeben. Du wirfst einfach immer die TODO.md hinein.
Einfache Befehle: Du kannst der KI sagen: "Schau in die TODO.md unter Bugs, nimm dir den ersten Punkt vor und fixee ihn." Wenn sie fertig ist, sagst du: "Hake den Punkt in der TODO.md ab."
Kontext-Erhalt: Die KI sieht bei einem Bug direkt, welche neuen Features du gerade baust – oft hängen Bugs und neue Features nämlich zusammen.
Sollen wir für dein Projekt direkt so eine zentrale TODO.md mit deinen aktuellen Bugs und Ideen aufsetzen? Schreib mir einfach kurz auf, welche Fehler und Feature-Ideen du gerade im Kopf hast!

ich habe oft seprrat an bestimmten featutera gearbeite mit anderen Kis. diese Erarbeitungen, Informationen und Pläne habe ich oft in eine eigene md gepackt

Das erklärt natürlich deine Situation! Wenn du mit verschiedenen KIs parallel an unterschiedlichen Features experimentierst, ist dieses "isolierte" Arbeiten in eigenen .md-Dateien sogar eine sehr gute Taktik.

Das Problem entsteht erst, wenn du diese Features zurück in dein Hauptprojekt (deine App) integrieren willst. Wenn du der Haupt-KI einfach 10 verschiedene Feature-Dokumente hinwirfst, verliert sie die Orientierung.

Nutze für diesen Workflow am besten die "Hub & Spoke" (Drehscheiben) Strategie:

Das System für verteilte KI-Arbeit

Behalte deine separaten Feature-Dateien ruhig bei, aber organisiere sie in einem eigenen Ordner in deinem Hauptprojekt, zum Beispiel unter /docs/features/. Deine Struktur sieht dann so aus:

text

├── README.md             <- Das Fundament
├── TODO.md               <- Der aktuelle Tagesplan (Der Hub)
└── docs/                 <- Der Ordner für deine KI-Ausarbeitungen (Die Spokes)
    ├── feat-auth-oauth.md
    ├── feat-payment-stripe.md
    └── bug-safari-flexbox.md
Verwende Code mit Vorsicht.

So führst du die Fäden in der TODO.md zusammen

Damit die Haupt-KI weiß, was in den anderen Dateien steht, nutzt du deine zentrale TODO.md als Inhaltsverzeichnis und Fortschritts-Tracker. Du verweist darin einfach auf die spezifischen Dateien:

markdown

# Projekt-Status

## 🟡 Features in Integration (Ausgearbeitet von externer KI)
* [ ] OAuth Login einbauen -> Siehe Details in `docs/feat-auth-oauth.md`
* [ ] Stripe Payment verknüpfen -> Siehe Details in `docs/feat-payment-stripe.md`

## 🔴 Bekannte Bugs
* [ ] Safari Layout-Fehler -> Siehe Analyse in `docs/bug-safari-flexbox.md`
Verwende Code mit Vorsicht.

Der perfekte Workflow beim Coden:

Wenn du jetzt ein bestimmtes Feature einbauen willst, gibst du deiner Haupt-KI genau zwei Doku-Dateien mit:

Die zentrale TODO.md (damit sie weiß, wo wir im Gesamtprojekt stehen).
Die spezifische docs/feat-xxx.md (die die externe KI geschrieben hat).
Dein Prompt an die Haupt-KI klingt dann so:

"Ich möchte jetzt das OAuth-Feature integrieren. Ich habe dir die TODO.md und die Ausarbeitung in docs/feat-auth-oauth.md beigefügt. Setze den Code im Projekt um und hake den Punkt danach in der TODO.md ab."

Fazit

Deine Methode mit den separaten Dateien ist super für die Konzeptionsphase mit anderen KIs. Du musst sie nur über eine zentrale TODO.md für deine Haupt-KI auffindbar machen. Sobald ein Feature komplett eingebaut ist und fehlerfrei läuft, kannst du die dazugehörige Feature-.md einfach löschen oder in einen archive/ Ordner verschieben.

Möchtest du, dass wir für eines deiner aktuell ausgearbeiteten Features den Integrations-Prompt für deine Haupt-KI schreiben? Wenn du mir sagst, um welches Feature es geht, helfe ich dir dabei!

Relevante Ergebnisse

Alle anzeigen

Wird transkribiert...

Bild hochladen