# UI/UX-Analyse & Konzept: VocaOrbit Lernquizmodus

Dieses Dokument fasst die professionelle UI/UX-Analyse, Marktstandards (Stand 2026) und konkrete Optimierungsvorschläge für die App **VocaOrbit** zusammen. Fokus liegt hierbei auf einer perfekten, barrierefreien User Experience für eine **lokale App ohne Login und externe Datenbank**.

---

## 1. Status Quo: Was absolut passt (Best Practices)

* **Visuelle Hierarchie:** Das Hauptwort („vorausgesetzt, dass“) sticht sofort ins Auge. Der Kontrast zwischen Text und der Card ist perfekt lesbar und modern.
* **Fortschrittsanzeige:** Die obere Leiste (`10 / 14` inkl. des Progress-Bars) gibt sofortiges, klares Feedback über den aktuellen Stand der Session.
* **Daumenfreundliche Touch-Ziele:** Die Antwort-Buttons im unteren Bereich sind groß genug für eine problemlose, einhändige Bedienung (z.B. unterwegs).
* **Kontext-Feature („Beispielsatz anzeigen“):** Dezent unter der Vokabel platziert. Es lenkt nicht ab, ist aber bei Bedarf sofort griffbereit.
* **Visueller Stil:** Das Darkmode-Design (Deep Violet/Blue) wirkt extrem hochwertig und entspricht dem aktuellen Premium-Trend im App-Markt.

---

## 2. Optimierungspotenzial & Markttrends

### A. Button-Layout: Symmetrie statt Asymmetrie
* **Problem:** Die aktuelle Anordnung (zwei kleinere Buttons oben, ein breiter zentrierter Button unten) stört das visuelle Gleichgewicht. Der untere Button wirkt fälschlicherweise „wichtiger“.
* **Marktlösung (Duolingo, Babbel):** Eine rein **vertikale Liste von untereinander angeordneten Optionen**. Das sorgt für ein ruhiges Schriftbild, konstante Klickflächen und verhindert, dass das Auge unruhig springen muss.

### B. Scrollen vs. Alles auf einen Blick (Screen Fitting)
* **Marktstandard:** Ein **„Single Screen Setup“ (kein Scrollen)** ist für mobile Quiz-Modi absolute Pflicht. 
* **Umsetzung:** Die UI-Elemente müssen sich dynamisch (per Flexbox/Grid) an die Bildschirmgröße anpassen. Längere Texte (wie Beispielsätze) bleiben standardmäßig eingeklappt, damit alle Antwort-Buttons ohne Scrollen im sichtbaren Bereich (Viewport) liegen.

### C. Der „Prüfen / Weiter“-Button
* **Ist ein Button Pflicht?** **Ja.** Ein automatisches Weiterspringen direkt nach dem Klick (ohne Bestätigung) zerstört den Lerneffekt, da der Nutzer bei Fehlern keine Zeit hat, die richtige Lösung einzuprägen. Zudem führt es zu frustrierenden Fehllinks.
* **Best-Practice-Flow:**
  1. *Auswahl:* Nutzer tippt Option an -> Button wird farblich markiert (z.B. lila Rahmen). Unten erscheint der Button **„PRÜFEN“**.
  2. *Auflösung:* Klick auf Prüfen -> Option wird Grün (richtig) oder Rot (falsch). Der untere Button verwandelt sich in **„WEITER“**.
  3. *Nächste Karte:* Erst beim Klick auf „Weiter“ slidet die nächste Aufgabe herein. Der Nutzer bestimmt sein Lerntempo selbst.

---

## 3. Die perfekte Top-Bar im Quiz-Modus

Während eines aktiven Quizzes gilt: **Fokus und minimale Ablenkung.** Zu viele Statistiken erzeugen kognitive Last.

### Der Zurück-Button (`<-`) vs. `X`
* **Optimierung:** Ersetze den Pfeil nach links (`<-`) durch ein **X-Icon**. Ein Pfeil suggeriert das Zurückgehen im Menü, ein `X` steht für das Abbrechen einer aktiven Session.
* **UX-Schutzmechanismus (Wichtig ohne DB):** Da Fortschritte lokal verloren gehen, muss bei Klick auf das `X` zwingend eine Sicherheitsabfrage erscheinen: *„Runde abbrechen? Dein aktueller Fortschritt geht verloren.“*

### XP- und Streak-Anzeige (`⚡ 2150`)
* **Bedeutung im Quiz:** Es ist im Markt unüblich, die Gesamt-XP live während des Quizzes hochzuzählen. Das lenkt ab. Belohnungen gehören auf den End-Screen.
* **Der psychologische Anker:** Nutze in der Top-Bar stattdessen die **Flamme (`🔥`) für den Tages-Streak** (z. B. `🔥 5`). Da deine App kein Login hat, ist der sichtbare Tages-Streak das stärkste Tool, um den Nutzer emotional an die App zu binden und zum täglichen Öffnen zu bewegen.

---

## 4. Empfohlenes UI-Template (Drahtmodell)

Dieses Layout ist responsiv, verzichtet komplett auf Scrollen und bündelt die Aktionszone im daumenfreundlichen unteren Drittel.

```text
+-------------------------------------------------------------+
|   ( X )       [||||||||||||||| 10/14 ]                🔥 5  |  <- Top-Bar (Fest)
+-------------------------------------------------------------+
|                                                             |
|                         VOCAORBIT                           |
|                                                             |
|                 vorausgesetzt, dass                         |  <- Hauptkarte
|                                                             |     (Flexibler Raum,
|                    [ Beispielsatz ]                         |      zentriert)
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|  [ A ]  provided that                                       |  <- Option 1 (Vertikal)
|                                                             |
|  [ B ]  unless                                              |  <- Option 2 (Vertikal)
|                                                             |
|  [ C ]  nonetheless                                         |  <- Option 3 (Vertikal)
|                                                             |
+-------------------------------------------------------------+
|                                                             |  <- Aktionszone
|    =================== [ PRÜFEN ] ===================      |  <- Aktiviert sich nach
|                                                             |     Auswahl einer Option
+-------------------------------------------------------------+


Gemini: Screenshot Lernquiz und Du bist Appentwickler für Vokabel Lernapps. Schaue dir die UI und UX des Lernquizmodus an. Schau dir an wie das der Markt regelt. Gehe kritisch vo und schau was optimiert werden könnte oder was auch absolut passt für eine Vokabel Lern app ohne Login und ohne Datenbank: 

Das UI-Design deiner App „VocaOrbit“ sieht bereits sehr modern, clean und professionell aus! Die Farbwahl im Darkmode (Deep Violet/Blue) trifft genau den aktuellen Zeitgeist, den man auch bei großen Playern sieht, wenn sie sich vom klassischen „hellen Kinder-Look“ abheben wollen.
​Da deine App ohne Login und ohne externe Datenbank auskommt, ist die User Experience (UX) das absolut entscheidende Kriterium: Der Nutzer muss sofort abgeholt werden, die App muss flüssig laufen und die Bedienung muss blind und intuitiv funktionieren.
​Hier ist eine professionelle UI/UX-Analyse, aufgeteilt in das, was super funktioniert, und das, was wir für den Markt optimieren können.
​🟢 Was absolut passt (Best Practices erfüllt)
​Hervorragendes visuelles Hierarchie-Gefühl: Das Hauptwort („vorausgesetzt, dass“) sticht sofort ins Auge. Der Kontrast zwischen Text und der Card ist perfekt lesbar.
​Klare Fortschrittsanzeige: Die obere Leiste (10 / 14 inkl. des lilafarbenen Progress-Bars) gibt dem Nutzer sofort Feedback, wo er steht. Die "Streak"- oder "Punkte"-Anzeige (2150) rechts oben motiviert direkt.
​Daumenfreundliche Touch-Ziele: Die Antwort-Buttons im unteren Bereich sind groß genug, um sie auch einhändig beim Busfahren ohne Fehlklicks zu treffen.
​Kontext-Feature („Beispielsatz anzeigen“): Dass dieser Button direkt unter der Vokabel sitzt, aber optisch dezent gehalten ist, ist genial. Er lenkt nicht ab, ist aber sofort griffbereit, wenn man hakt.
​🔴 Optimierungspotenzial (UI/UX-Kritik)
​Schauen wir uns an, wie der Markt (Duolingo, Babbel, Quizlet) Usability-Hürden minimiert. Hier sind 4 konkrete Heuristiken, die deine App noch besser machen:
​1. Die Asymmetrie der Antwort-Buttons (Layout-Struktur)
​Problem: Du hast aktuell zwei Spalten oben (provided that / unless) und einen zentrierten, riesigen Button darunter (nonetheless). Das stört das visuelle Gleichgewicht. Das Auge muss springen, und der untere Button wirkt fälschlicherweise „wichtiger“, weil er breiter ist.
​Marktlösung: Entweder ein klassisches 2x2 Grid (vierte Option als Platzhalter/Ablenkung hinzufügen) oder alle Antwortmöglichkeiten als vollflächige, untereinander gelistete Reihen (List-Items) anbieten. Für 3 Optionen bietet sich eine vertikale Liste an.
​2. Fehlende Tastatur-Affinität / Schnelligkeit
​Problem: Am unteren Bildschirmrand sieht man drei kleine Punkte (Pagination-Dots oder Indikatoren). Wenn der Nutzer schnell lernen will, möchte er nach dem Klick auf eine Option sofort weiter.
​Marktlösung: Sobald eine Antwort angeklickt wird, sollte sich der Zustand des Buttons ändern (Grün für richtig, Rot für falsch) und zeitgleich ein großer, unübersehbarer „Weiter“ / „Next“-Button am unteren Bildschirmrand einblenden (oder die nächste Karte slidet sofort automatisch herein).
​3. Zustand der Buttons (State Design)
​Problem: Die Buttons für die Antworten sehen optisch exakt so aus wie die Hauptkarte, nur kleiner.
​Marktlösung: Um dem Nutzer visuell zu signalisieren „Ich bin klickbar“, arbeiten moderne Apps bei Buttons oft mit einer leichten 3D-Kante (Schatten nach unten) oder einem minimal helleren Rand als der Hintergrund.
​4. Barrierefreiheit (Accessibility) bei "Wähle die Lösung"
​Problem: Der Text ganz unten („WÄHLE DIE LÖSUNG“) ist in einem sehr dunklen Grau auf fast schwarzem Grund geschrieben. Der Kontrastwert ist hier zu niedrig.
​Marktlösung: Den Kontrast leicht anheben. Da es sich um eine Handlungsanweisung (Instruction) handelt, kann diese auch weiter nach oben wandern – direkt über oder unter das Hauptwort.
​🛠️ Spezifischer UX-Vorschlag für eine "No-Login/No-DB"-App
​Da du keine Nutzerdaten in der Cloud speicherst, ist jede Sekunde, die der Nutzer in der App verbringt, lokal kostbar. Wenn der Nutzer eine falsche Antwort wählt (z. B. er klickt auf unless), solltest du folgendes UX-Muster anwenden:
​Sofortiges haptisches & visuelles Feedback: Der Button vibriert kurz (Haptic Feedback) und färbt sich rot.
​Fehler-Animation (Dein VocaOrbit-Prinzip): Da du ein System ohne Überlagerung willst, blende den Fehlerhinweis dezent und animiert (Fade-out nach x Sekunden) direkt über oder unter der betroffenen Option ein.
​Wiederholungs-Loop: Da du lokal im RAM/LocalSettings trackst, welche Wörter falsch waren, wandert diese Karte direkt in deinen Stufe-2-Pool (Special Mode für falsche Vokabeln), ohne dass der Nutzer durch ein Login-Popup unterbrochen wird.
​📐 Zusammenfassung der visuellen Änderung
​So könnte die Struktur im Vergleich aussehen:

Hier ist die Analyse dazu, wie der moderne Markt (Duolingo, Memrise, Babbel) und die Softwareentwicklung diese Fragen im Jahr 2026 lösen, gefolgt von einer konkreten UI-Skizze.
​1. Ist ein "Weiter"-Button Pflicht oder noch üblich?
​Die klare Antwort: Ja, er ist absolut üblich und aus UX-Sicht bei Multiple-Choice meistens Pflicht.
​Es gibt auf dem Markt zwei Ansätze, aber einer dominiert klar:
​Ansatz A: Sofortiges automatisches Weiterspringen (Ohne Button)
​Wie es funktioniert: Du klickst auf eine Antwort. Sie leuchtet kurz grün oder rot auf, und nach 500ms slidet die nächste Karte rein.
​Das Problem: Lerneffekt gleich null. Wenn der Nutzer einen Fehler macht, wird ihm die richtige Lösung sofort wieder weggerrissen. Er hat keine Zeit, kurz innezuhalten, den Fehler zu registrieren und die Vokabel gedanklich abzuspeichern. Zudem führt es bei schnellem Tippen zu "Accidental Clicks" (man tippt aus Versehen doppelt und überspringt die nächste Karte ungelesen).
​Ansatz B: Der Best-Practice-Marktstandard (Mit Bestätigen/Weiter-Button)
​Wie es funktioniert: Du tippst eine Option an. Der Button wird als „ausgewählt“ markiert (z. B. lila umrandet). Unten erscheint ein großer „Prüfen“-Button. Klickt man darauf, färbt sich die Option grün oder rot. Der Button unten verwandelt sich in „Weiter“.
​Warum das besser ist: Es zwingt das Gehirn zu einer bewussten Entscheidung („Ja, das ist meine finale Antwort“) und gibt dem Nutzer nach der Auflösung die volle Kontrolle über die Zeit, die er zum Verstehen des Fehlers braucht.
​2. Scrollen vs. "Alles auf einen Blick" (Screen Fitting)
​Der Markt sagt ganz klar: "Single Screen Setup" (Alles auf einen Blick ohne Scrollen) ist Standard für Quiz-Modi.
​Warum kein Scrollen? Ein Vokabelquiz ist ein Mikrolern-Moment (oft einhändig in der Bahn). Scrollen erzeugt kognitive Last. Wenn Buttons unter dem Bildschirmrand verschwinden, verliert die App an Leichtigkeit und wirkt "schlecht optimiert".
​Wie löst man Platzprobleme in der Softwareentwicklung?
​Dynamisches Layout (Flexbox/Grid): Die UI-Elemente müssen sich der Bildschirmgröße anpassen. Auf kleinen Handys wird die Hauptkarte automatisch flacher, die Textgröße schrumpft minimal, und die Abstände (Paddings) werden kleiner.
​Begrenzung der Inhalte: Längere Beispielsätze werden standardmäßig eingeklappt (deshalb ist dein Button „Beispielsatz anzeigen“ perfekt!).
​Vertikale Listen statt Boxen: Wenn du 3-4 Optionen untereinander listest, verbrauchen sie bei geschicktem Padding weniger Platz und sind extrem responsiv für jede Bildschirmgröße.
​3. UI-Template / Text-Skizze (Responsive & Marktkonform)
​Dieses Layout ist so konzipiert, dass es auf jedem Smartphone ohne Scrollen perfekt in den Viewport passt. Der Hauptfokus liegt unten auf einer fest verankerten "Aktionszone".

4. Der perfekte UX-Flow (Schritt für Schritt)
​Da deine App ohne Login und Datenbank auskommt, muss sich die App extrem "snappy" (knackig und schnell) anfühlen. So setzt du den Flow technisch um:
​Zustand 1: Warten auf Eingabe
​Die Antwort-Optionen 1, 2 und 3 sind im Standard-Design.
​Der Button ganz unten ist entweder deaktiviert (ausgegraut, z. B. Text: „Wähle eine Option“) oder komplett unsichtbar.
​Zustand 2: Option ausgewählt
​Der Nutzer tippt auf provided that.
​Die Option bekommt einen lila Rahmen (Zustand: Selected).
​Der Button unten poppt elegant auf (kleine Scale-In-Animation) mit dem Text: „PRÜFEN“ (in auffälligem Lila oder Weiß).
​Zustand 3: Die Auflösung (Nach Klick auf "Prüfen")
​Wenn richtig: Der ausgewählte Button wird grün. Ein kurzer, positiver Sound ertönt. Der untere Button verwandelt sich in „WEITER“ (Grün).
​Wenn falsch: Der ausgewählte Button wird rot. Der eigentlich richtige Button blinkt ganz dezent grün auf. Dein animierter Fehlerhinweis (VocaOrbit-Prinzip) blendet sich ein und fade-outet nach der empfohlenen Dauer. Der untere Button wird zu „WEITER“.
​Zustand 4: Nächste Karte
​Erst wenn der Nutzer jetzt aktiv auf „WEITER“ tippt, slidet die aktuelle Karte nach links weg und die neue kommt von rechts herein.
​Warum das für deine App perfekt ist:
​Du nutzt den LocalStorage des Handys. Wenn der Nutzer bei Zustand 3 merkt: „Ah, falsch!“, und auf „Weiter“ drückt, packt dein Code im Hintergrund die Vokabel-ID sofort in das lokale Array für die nächste Lernstufe. Der Nutzer bleibt komplett im Flow, wird nicht durch Ladezeiten blockiert und behält die volle Kontrolle.
​Möchtest du Unterstützung bei der konkreten Umsetzung dieses Button-Wechsels oder der responsiven Anordnung im Code (z.B. für CSS, Flutter oder React Native)?

Hier ist der direkte Blick auf deine Top-Bar (oberer Bildschirmrand) durch die Brille eines UI/UX-Designers und im Vergleich mit dem aktuellen Markt:
​1. Die Punkte- und Streak-Anzeige (⚡ 2150)
​Das ist gut:
Die Platzierung oben rechts ist absolut markttypisch und gelernt. Nutzer schauen automatisch nach rechts oben, um ihren Status (Leben, Flammen, Punkte) zu sehen. Das Icon (Blitz) triggert sofort das Gefühl von Energie, Schnelligkeit oder "Streak".
​Das fehlt oder könnte optimiert werden:
​Die Maßeinheit fehlt im Kopf: Was bedeuten die 2150? Sind das die Gesamtpunkte? Ist das die aktuelle Punkteanzahl dieser Runde? Oder ist es der Tages-Streak (2150 Tage wäre utopisch, also sind es vermutlich Punkte).
​Markt-Lösung: Wenn es Punkte (Score) sind, nutzen Apps oft ein Stern- oder Münz-Icon (⭐ oder 🪙). Wenn es ein Tages-Streak ist (wie viele Tage man infolge gelernt hat), nutzt der Markt fast ausnahmslos die Flamme (🔥). Der Blitz (⚡) wird meistens für "Energie/Leben" genutzt (die abnehmen, wenn man Fehler macht).
​UX-Tipp für "Kein Login": Da du keine Datenbank hast, ist der Tages-Streak (🔥) die mächtigste Waffe, die du hast, um Nutzer ohne Account zum täglichen Wiederkommen zu bewegen (gespeichert im LocalStorage). Wenn die 2150 für Punkte stehen, könntest du überlegen, daneben oder stattdessen eine kleine Flamme für die Tage anzuzeigen (z. B. 🔥 5).
​2. Der Zurück-Button (<-)
​Ist er noch üblich?
Ja, absolut. Selbst in Zeiten von Wischgesten (Swipe-to-go-back) auf iOS und Android ist ein visueller Zurück-Button Pflicht. Er gibt dem Nutzer Sicherheit, besonders in einer Quiz-Situation, wo man nicht aus Versehen durch eine falsche Geste das Quiz abbrechen will.
​Ist er richtig positioniert?
Ja, oben links ist die standardisierte Position für "Abbrechen" oder "Zurück". Allerdings gibt es hier ein UX-Detail, das du bei einer Quiz-App beachten musst:
​Das Problem („Accidental Quit“): Wenn der Nutzer bei Aufgabe 10 von 14 ist (wie auf deinem Screenshot) und aus Versehen oben links auf den Pfeil tippt, darf die App niemals sofort ohne Nachfrage das Quiz schließen. Da du keine Datenbank hast, wären die ungespeicherten Fortschritte dieser Runde sofort verloren, was extrem frustrierend ist.
​Die visuelle Optimierung: Viele moderne Lern-Apps (wie Duolingo) ersetzen den Pfeil nach links (<-) während eines aktiven Quiz durch ein X-Icon (Kreuz).
​Ein Pfeil nach links bedeutet oft: "Ich gehe eine Ebene zurück (z.B. in den vorherigen Ordner)".
​Ein X bedeutet: "Ich möchte diese aktive Session jetzt abbrechen".
​🛠️ Konkreter Optimierungsvorschlag für deine Top-Bar
​Um die UI noch cleaner zu machen und logische UX-Fehler zu vermeiden, könntest du die Top-Bar wie folgt anpassen:

Auf dem Markt der Lern-Apps gilt bei der Anzeige im Quiz eine goldene UX-Regel: Weniger ist mehr. Während eines aktiven Quizzes ist der Bildschirmplatz kostbar und die Aufmerksamkeit des Nutzers sollte zu 100 % auf der aktuellen Aufgabe liegen. Zu viele Zahlen lenken ab und erzeugen kognitive Last.
​Hier ist der Standard, wie erfolgreiche Apps (Duolingo, Quizlet, Memrise) das im Jahr 2026 aufteilen:
​1. Was wird während des Quizzes oben angezeigt?
​Der Markt reduziert die Anzeige im Quiz-Modus meistens auf maximal zwei Metriken:
​Der aktuelle Tages-Streak (🔥): Das ist die wichtigste Kennzahl. Sie erinnert den Nutzer in jedem Moment daran: "Ich tue das hier gerade, um meine Kette an erfolgreichen Tagen nicht zu verlieren."
​Die Währung/Gesamt-XP (⭐ oder XP): Wenn du Gesamt-Punkte anzeigen willst, dann wird hier üblicherweise der Gesamtspielstand (deine 2150) angezeigt.
​Warum man die Punkte innerhalb der Runde dort nicht anzeigt:
​Es ist unüblich, oben rechts "+10", "+20" Punkte live hochzählen zu lassen. Das lenkt vom Lesen der Vokabel ab. Dass man Punkte gesammelt hat, feiert man stattdessen mit einer fetten Animation auf dem Ergebnis-Bildschirm (End-Screen), sobald das Quiz vorbei ist.
​2. Der Unterschied: Quiz-Modus vs. Normaler Lernmodus
​Die Softwareentwicklung unterscheidet stark zwischen der Lernphase (Fokus, keine Ablenkung) und dem Dashboard/Hauptmenü (Belohnung, Statistiken).
​Im Quiz-Modus (Dein Screenshot)
​Empfohlene Angaben: * [ X ] (Abbrechen)
​[ Progress-Bar (10/14) ] (Wo stehe ich in dieser Session?)
​[ 🔥 Streak ] ODER [ ⭐ Gesamt-XP ] (Nicht beides, das wird zu voll!).
​Markt-Tipp: Nutze die Flamme (🔥) für den Tages-Streak. Warum? Da deine App kein Login hat, ist der Streak der einzige psychologische Anker, der den Nutzer morgen wieder die App öffnen lässt. Deine 2150 XP zeigst du stolz im Hauptmenü und am Ende der Runde.
​Im normalen Lernmodus / Hauptmenü (Dashboard)
​Hier darfst du glänzen und den Nutzer mit Daten belohnen! Da keine Vokabel im Weg steht, zeigt man hier die gesamte Palette:
​Gesamt-XP: Deine 2150 XP.
​Tages-Streak: 5 Tage in Folge.
​Heutiger Fortschritt: 20 / 50 XP für heute erreicht (Ein kleiner Tagesziel-Kreis).
​Vokabel-Zähler: 120 Wörter gelernt (Super wichtig für Apps ohne Login, damit der Nutzer sieht, was lokal auf seinem Handy schon vollbracht wurde).
​3. Konkrete Empfehlung für VocaOrbit
​Da du alles auf einen Blick und ohne Scrollen designst, empfehle ich dir für die Top-Bar im Quiz diese ultra-cleane Variante:


5. Aufteilung der Daten: Quiz vs. Hauptmenü
​Im aktiven Quiz (Reduziert)
​[ X ] (Abbrechen mit Abfrage)
​[ Progress-Bar (10/14) ] (Aktueller Rundenfortschritt)
​[ 🔥 Streak ] (Tagesmotivation)
​Im Hauptmenü / Dashboard (Belohnung & Statistik)
​Hier hat der Nutzer Zeit und will seinen Fleiß sehen:
​Gesamt-XP: Deine 2150 XP (Stolz platziert als Gesamtfortschritt).
​Tagesziel: 20 / 50 XP heute gesammelt (Visueller Fortschrittskreis).
​Wort-Statistik: 120 Wörter gelernt (Gibt dem lokalen Speicher Relevanz und zeigt den permanenten Fortschritt).
​Ergebnis-Screen (Nach Frage 14): Hier werden die Gesamt-XP effektvoll hochgezählt: „Runde geschafft! +50 XP. Neuer Stand: 2200 XP ⭐“.
"""
​Write content to file
​file_path = "vocaorbit_ui_ux_konzept.md"
with open(file_path, "w", encoding="utf-8") as file:
file.write(markdown_content.strip())
​print(f"File successfully created: {file_path}")

