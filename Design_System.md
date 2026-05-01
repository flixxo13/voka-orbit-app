# VokaOrbit Design System
**Version:** 2.0  
**Status:** Living Document  
**Zuletzt aktualisiert:** 2026-05-01  
**Verantwortlich:** Felix (Product) + Antigravity AI (Engineering)

---

## 1. Philosophie & Designsprache

### 1.1 Leitprinzip: „Physikalischer Surrealismus"

VokaOrbit nutzt eine Designphilosophie die wir intern als **„Physikalischer Surrealismus"** bezeichnen. Das bedeutet:

- Elemente verhalten sich wie Objekte mit Masse, Schwerkraft und Trägheit
- Animationen folgen physikalischen Gesetzen (Federkraft, Orbit, Gravitation)
- Die Umgebung ist surreal (Weltraum, Schwarze Löcher, Planeten), fühlt sich aber durch konsistente Physik real an
- Gamification ist eingebettet, nicht aufgesetzt

> **Analogie:** Ein Planetensystem ist physikalisch präzise – aber es ist trotzdem fremdartig schön. VokaOrbit soll sich genauso anfühlen.

### 1.2 Design-Ziele (Priorisiert)

| Priorität | Ziel | Beschreibung |
|-----------|------|-------------|
| 1 | **Fokus fördern** | UI lenkt nie vom Lernen ab – alles dient dem Lernfluss |
| 2 | **Belohnung spürbar machen** | Fortschritt wird sichtbar, hörbar, fühlbar (Haptik) |
| 3 | **Atmosphäre schaffen** | Weltraum-Ambiente erzeugt Immersion ohne Ablenkung |
| 4 | **Premium wirken** | Jede Interaktion fühlt sich wertig an |

### 1.3 Emotional Zoning (Kontext-bewusste Atmosphäre)

VokaOrbit definiert **4 emotionale Zonen** mit bewusst unterschiedlicher visueller Energie:

```
┌─────────────────────────────────────────────────────────────────┐
│  ZONE         │ ENERGIE      │ VISUELLER STIL         │ STERNE  │
├─────────────────────────────────────────────────────────────────┤
│ 🏠 Dashboard  │ Ruhig        │ Ambient, Glassmorphism │ Funkeln │
│ 🎮 Hint-Mode  │ Fokus        │ Weich, diffus, tief    │ Statisch│
│ 🚀 Launch     │ Energie      │ Volle Visuell-Power    │ Aktiv   │
│ ✅ Abschluss  │ Triumph      │ Particles, Glow-Burst  │ Explosion│
└─────────────────────────────────────────────────────────────────┘
```

> **Design-Entscheidung (2026-05-01):** Hint-System-Sterne bleiben bewusst weich und statisch (diffuse `radial-gradient` Punkte). Dashboard-Sterne haben scharfe 4-Punkt-Diamant-Funkeln. **Dies ist kein Fehler, es ist „Emotional Zoning"** – die Stimmung passt sich dem Kontext an.  
> Die globale Design Language (Farben, Typografie, Spacing, Cards) bleibt in allen Zonen identisch.

---

## 2. Design Tokens

### 2.1 Farb-System

#### Brand Colors (Primärpalette)

```css
--color-orbit-purple:  #7C3AED;   /* Primärfarbe – Zustände, UI, Ringe */
--color-orbit-indigo:  #4F46E5;   /* Hover/Active-Variante von Purple */
--color-orbit-violet:  #A78BFA;   /* Helle Akzent-Variante */
--color-orbit-cyan:    #06B6D4;   /* Sekundärfarbe – Ringe, Highlights */
--color-orbit-amber:   #F59E0B;   /* XP, Gold, Combo-Belohnung */
--color-orbit-streak:  #F97316;   /* Streak/Feuer-Indicator */
```

#### Semantisches 3-Farben-System (Gamification)

> **WICHTIG:** Dieses System ist verbindlich für alle Feedback-Elemente im Hint-System.

| Farbe | Hex | Semantik | Verwendung |
|-------|-----|----------|-----------|
| 🩷 **Pink** | `#EC4899` | Fehler / Error | Falsche Buchstaben, Error-Glow, Fehler-Slots |
| 🟣 **Purple** | `#7C3AED` | Neutral / Zustand | Aktive Slots, Ring-UI, Reveal-State |
| 🥇 **Gold** | `#F59E0B` | Combo / Erfolg | Streak-Bonus, XP-Toast, Black-Hole-Dots |

#### Hintergrund-Palette

```css
--bg-deep:      #0A0A2E;   /* Haupt-Hintergrund (Dark Mode) */
--bg-deep-alt:  #080820;   /* Alternativer tiefer Hintergrund */
--bg-card:      rgba(255, 255, 255, 0.04);  /* Glass Card Standard */
--bg-card-hover:rgba(255, 255, 255, 0.07);  /* Glass Card Hover */
```

#### Planet Colors

```css
--color-planet-orange: #FB923C;
--color-planet-teal:   #2DD4BF;
--color-planet-pink:   #EC4899;
--color-planet-blue:   #60A5FA;
--color-planet-red:    #F87171;
--color-planet-lime:   #A3E635;
```

#### Glow Values

```css
--glow-purple:  rgba(124, 58, 237, 0.5);
--glow-cyan:    rgba(6, 182, 212, 0.4);
--glow-amber:   rgba(245, 158, 11, 0.5);
--glow-orange:  rgba(251, 146, 60, 0.5);
--glow-pink:    rgba(236, 72, 153, 0.4);
```

### 2.2 Typografie

```
Font Family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif
Source:      Google Fonts (geladen via @import)
```

| Gewicht | Token | Verwendung |
|---------|-------|-----------|
| 300 | Light | Subtexte, Metadaten |
| 400 | Regular | Fließtext |
| 500 | Medium | Labels |
| 600 | SemiBold | UI-Text |
| 700 | Bold | Primäre Buttons |
| 800 | ExtraBold | Headlines, Scores |

**Typografische Skalierung (Tailwind-Klassen):**
- `text-[9px]` – Micro-Labels (XP-Kosten, Tracking-Infos)
- `text-xs` – Caption, Buttons
- `text-sm` – Body, Beschreibungen
- `text-base` – Standard-Text
- `text-xl` – Subheadlines
- `text-3xl` – Primäre Vokabel-Anzeige
- `font-black` – Alle Primär-Labels (Uppercase + Tracking)

### 2.3 Spacing & Radii

```css
--radius-orbit-card: 28px;   /* Haupt-Cards */
--radius-orbit-pill: 100px;  /* Buttons, Tags */
```

**Spacing Scale:** Tailwind-Standard (4px base) – bevorzugte Abstände: `gap-1.5`, `gap-3`, `gap-4`, `px-4`, `py-2.5`

### 2.4 Easing Curves

```css
--ease-orbit:   cubic-bezier(0.23, 1, 0.32, 1);    /* Smooth deceleration */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot/bounce */
```

| Curve | Verwendung |
|-------|-----------|
| `ease-orbit` | Card-Transitions, Fly-in Animationen |
| `ease-spring` | Letter Fly-in, Planet-Tap Feedback |
| `linear` | Orbit-Rotation (kontinuierliche Schleifen) |
| `easeInOut` | Pendel-Bewegungen (Sway, Tilt) |

---

## 3. Komponenten-Bibliothek

### 3.1 Glass Card

```css
.glass-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
}
```

**Regeln:**
- Immer `backdrop-filter: blur(20px)` – kein blur = kein Glassmorphism
- Border-Opacity max. `0.12` – sonst zu dominant
- Kein `box-shadow` auf Glass Cards (flacht das Glassgefühl ab)

### 3.2 Planet Vibe (Buchstaben-Planeten)

**Anatomie:**
```
PlanetVibe
├── .planet-halo         – Atmosphärischer Glow (blur, pulsiert)
├── .planet-sphere       – Die eigentliche 3D-Kugel
│   ├── .planet-layer-base    – Textur (rotiert, overlay blend)
│   └── .planet-layer-detail  – Spekulares Highlight (color-dodge)
└── .planet-letter       – Buchstabe (translateZ für 3D-Effekt)
```

**States:**
- `isDead` – Graue Kugel, kein Halo, kein Glow → falsch getippt
- `isWrong` – Shake-Animation (`x: [-8, 8, -8, 8, 0]`, 0.4s)
- Default – Volle Farbe, Halo pulsiert

**Parallax-Faktoren je Zone:**
```ts
{ x: 0.8, y: 1.2 }  // Zone 0 – oben-links
{ x: 1.2, y: 0.8 }  // Zone 1 – oben-rechts
{ x: 1.0, y: 1.5 }  // Zone 2 – unten-links
{ x: 1.5, y: 1.0 }  // Zone 3 – unten-rechts
```

### 3.3 Orbit Ringe (Hint-System Hintergrund)

**Architektur:** Zwei verschachtelte Elemente – **Tilt** (außen) + **Spin** (innen).

```
motion.div (outer) – rotateX/rotateY Pendel
└── motion.div (inner) – rotateZ kontinuierlich + Border/Bright-Spot
```

**Warum zwei Ebenen?**
Framer Motion kombiniert alle Transforms auf einem Element zu einer Matrix. Dadurch ist `borderTopColor` (der helle Spot) relativ zur DOM-Achse fest – der Spot wirkt statisch. Durch Trennung in zwei Elemente dreht das innere Element den hellen Spot physikalisch korrekt um die Ellipse.

**Ring-Konfiguration:**

| Ring | Größe | Farbe | Spin-Dauer | Tilt-Achsen |
|------|-------|-------|-----------|-------------|
| Outer | 95% | Violet | 45s | rotateX 18s, rotateY 22s |
| Middle | 75% | Cyan | 60s (reverse) | rotateX 24s, rotateY 19s |
| Inner | 55% | White | 30s | rotateX 20s, rotateY 15s |

**Opacity-Richtlinie:**
- Basis-Border: `0.02–0.03` – kaum sichtbar
- Bright-Spot (eine Seite): `0.07–0.10` – subtil erkennbar
- **Niemals über `0.15`** – sonst zu dominant für Hintergrund-Element

### 3.4 Schwarzes Loch (Black Hole)

**Mechanik:**
- Tap-Counter: +15% Charge pro Tap, ~7 Taps bis Auslösung
- Decay: -2% alle 150ms (nur wenn 0 < charge < 100)
- Max. Nutzungen: **3 pro Vokabel** (analog zu Shuffle)
- Guard: Blockiert wenn `animatingOrbId !== null` (verhindert Race Condition)

**Stale-Closure-Lösung:**
```ts
// Refs für aktuellen State in Event-Handlern
const poolRef = useRef(pool);
const deadOrbIdsRef = useRef(deadOrbIds);
const animatingOrbIdRef = useRef(animatingOrbId);
useEffect(() => { poolRef.current = pool; }, [pool]);
```

**UI:**
- 3 lila Punkte zeigen verbleibende Nutzungen
- Schwarze Kugel wächst mit Charge (scale: bhCharge/100)
- Fade-out via `AnimatePresence` + `exit: { scale: 0, opacity: 0, duration: 0.5s }`

### 3.5 XP Toast System

**Toast-Typen:**

| Typ | Farbe | Trigger |
|-----|-------|---------|
| Positiv | Gold `#F59E0B` | Richtige Antworten, Combo |
| Negativ | Red/Pink | Falsche Antworten, Kosten |
| Warning | Orange | Eskalation (3+ Fehler) |
| Summary | Violet | Wort abgeschlossen (Bilanz) |

**Regeln:**
- Max. 2 gleichzeitige reguläre Toasts im Stack
- Summary-Toast ersetzt alle anderen (`isSummary: true` → replace all)
- Position: `absolute top-14 right-0` – nie über UI-Elemente

---

## 4. Animations-System

### 4.1 Animations-Hierarchie

```
LEVEL 1 – GLOBAL AMBIENT (immer aktiv, nie störend)
  └── Nebula-Drift, Sterne-Sparkle (Dashboard), Orbit-Ringe

LEVEL 2 – KONTEXTUELL (nur in der jeweiligen Zone aktiv)
  └── Planeten-Float, Halo-Pulse, Ring-Glow

LEVEL 3 – REAKTIV (triggered durch User-Interaktion)
  └── Planet-Tap, Comet-Fly, Black-Hole, Shake-Shuffle

LEVEL 4 – MOMENTAN (einmalig, dann weg)
  └── XP-Toast, Spark-Burst, Grade-Feedback
```

### 4.2 Comet-Animation (Buchstabe fliegt in Slot)

**Richtungs-Logik:**
```ts
const isLeftZone = orb.zone === 0 || orb.zone === 2;
const targetX = isLeftZone ? +130 : -130;  // Linke Planeten → rechts, rechte → links
// animate: { x: targetX, y: 180, scale: 0.25, opacity: 0 }
```

**Warum Transform statt `left`-Animation:**
CSS `left` ist eine Layout-Property. Framer Motion animiert sie als Interpolation zwischen CSS-Werten, was auf mobilen Geräten zu Jank führt. Transform-only (`x`, `y`) läuft auf dem Compositor-Thread = 60fps garantiert.

### 4.3 Orbit-Ring Bright-Spot Bewegung

Der helle Spot (höhere Border-Opacity auf einer Seite) bewegt sich mit dem Spin des inneren Elements. Durch die separaten Tilt/Spin-Elemente ist die Bewegung physikalisch korrekt.

**Timing-Diversität** (wichtig für organisches Wirken):
- Alle 3 Ringe haben unterschiedliche Spin-Dauern (45s, 60s, 30s)
- Alle Tilt-Animationen haben unterschiedliche Perioden (15–24s)
- Keine zwei Perioden haben ein ganzzahliges Verhältnis → nie synchron

### 4.4 Float-Animationen (Planeten)

```css
@keyframes planet-float {
  0%, 100% { transform: translateY(0px); }
  33%       { transform: translateY(-8px); }
  66%       { transform: translateY(-4px); }
}
/* Varianten: 4s (fast), 6s (normal), 9s (slow) */
```

**Asynchronität:** Jeder Planet bekommt eine andere Variante → nie synchrones Heben/Senken.

---

## 5. Sterne & Ambient-Systeme

### 5.1 Dashboard-Sterne (Global Ambient)

**Technik:** CSS `radial-gradient` statische Sterne + JS-getriggerte Sparkle-Animation  
**Stil:** Scharf, 4-Punkt-Diamant, kristallin  
**Verhalten:** Sporadisches Funkeln – der User soll beim Browsen Entdeckungen machen

```css
/* Sparkle: 4-Punkt-Diamant via clip-path */
clip-path: polygon(50% 0%, 52% 48%, 100% 50%, 52% 52%, 50% 100%, 48% 52%, 0% 50%, 48% 48%);
```

**Design-Intention:** „Erkunde, schau dich um" – lebendige, einladende Atmosphäre.

### 5.2 Hint-System-Sterne (Lokal, Kontextuell)

**Technik:** Statisches CSS `background-image` mit `radial-gradient` Punkten (1–1.5px)  
**Stil:** Weich, diffus, ambient – kein Sparkle, kein Aufflackern  
**Verhalten:** Komplett statisch

```css
backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), ...'
backgroundSize: '200px 200px'
opacity: 0.40
```

**Design-Intention:** „Konzentriere dich" – Umgebung unterstützt ohne abzulenken.

### 5.3 Warum der Unterschied bewusst ist (Emotional Zoning)

> Diese Entscheidung wurde am 2026-05-01 explizit festgelegt.

Der Unterschied zwischen scharfen Dashboard-Sternen und weichen Hint-Sternen ist **kein Inkonsistenz-Bug, sondern intentionales Emotional Zoning**.

**Referenz aus der Industrie:**
- **Apple iOS:** Home-Screen Wallpaper = weich & tief. Dynamic Island = scharf & präzise.
- **Duolingo:** Lernflow = clean & minimal. Erfolgsscreen = Konfetti-Explosion.
- **Raycast:** Command Bar = scharf verglast. Hintergrund dahinter = weich gebluret.

**Regel für VokaOrbit:**
```
Global Design Language = IMMER GLEICH
  → Farben, Typografie, Spacing, Glass Cards, Tonalität

Emotional Zone Expression = KONTEXTABHÄNGIG
  → Sterne-Stil, Animation-Dichte, Glow-Intensität, Partikel-Effekte
```

---

## 6. XP-Ökonomie & Gamification

### 6.1 XP-Belohnungen

```ts
XP_REWARDS = {
  CARD_CORRECT:         5,   // Karte korrekt bewertet
  CARD_EASY:            2,   // Zusatz für "Leicht"
  CARD_NO_HINT:         3,   // Bonus ohne Hint gelöst
  HINT_CORRECT_LETTER:  1,   // Richtiger Buchstabe im Hint
  HINT_STREAK_BONUS:    1,   // Ab 2. richtigem in Folge
  HINT_COMPLETION_BONUS:1,   // Wort vollständig gelöst
}
```

### 6.2 XP-Kosten

```ts
XP_COSTS = {
  HINT_ENTRY:           3,   // Hint-Modus starten
  HINT_EXAMPLE_SENTENCE:2,   // Beispielsatz anzeigen
  HINT_WRONG_LETTER:    1,   // Falscher Buchstabe
  HINT_ESCALATION:      2,   // 3+ Fehler in Folge
}
```

### 6.3 Lockdown-Mechanik

- **Force Nochmal:** Bei Hint-Nutzung → max. "Schwer" als beste Bewertung
- **XP-Depleted:** Bei 0 XP → automatischer Abbruch + Bilanz-Toast
- **Reveal-Kosten:** Skalierend nach verbleibenden Buchstaben: `getRevealCost(remaining)`

### 6.4 Black Hole & Shuffle Limits

| Feature | Max. Nutzungen | Zweck |
|---------|---------------|-------|
| Schütteln | 3 | Planeten neu anordnen |
| Schwarzes Loch | 3 | Distractor-Planet eliminieren |

---

## 7. Technische Entscheidungen & Patterns

### 7.1 State Management

- **Global:** `useSettings` Hook (XP, Streak, Sound, Callsign)
- **Session:** `useSession` Hook (aktuelle Karte, Fortschritt, FSRS)
- **Lokal:** Component-State via `useState`/`useReducer`

### 7.2 Stale Closure Prevention Pattern

Für Event-Handler die auf frischen State angewiesen sind:

```ts
// ✅ Pattern: Ref als "Live-Fenster" zum aktuellen State
const valueRef = useRef(value);
useEffect(() => { valueRef.current = value; }, [value]);

// Im Handler:
const handleEvent = useCallback(() => {
  const currentValue = valueRef.current; // Immer frisch
}, []); // Keine State-Dep nötig
```

**Anwendung:** Black Hole Handler (`pool`, `deadOrbIds`, `animatingOrbId`)

### 7.3 Animation Performance

**Regeln:**
- Ausschließlich `transform` und `opacity` für Animationen – läuft auf GPU Compositor
- Nie `left`, `top`, `width`, `height` animieren (Layout-Thrashing)
- `will-change: transform, opacity` auf animierten Elementen
- `AnimatePresence` mit `key` für korrekte Exit-Animationen

### 7.4 Mobile-First Constraints

- **Referenzgerät:** Samsung Galaxy S23
- Tap-Zonen: mindestens `44x44px` (`w-11 h-11`)
- Kein `:hover` als primäres Feedback (Touch hat kein Hover)
- `touch-manipulation` auf allen tappbaren Elementen
- `whileTap` statt `whileHover` als primäres Feedback

---

## 8. Audio-System

**Kopplung:** Sound ist immer an `settings.soundEnabled` gebunden.  
**Haptik:** Parallel zu jedem Sound – unterschiedliche Vibrations-Intensitäten:

| Event | Sound | Haptik |
|-------|-------|--------|
| Planet-Tap (korrekt) | `playTapSound` | `vibrateTap` (kurz) |
| Planet gelandet | `playCorrectSound` | `vibrateCorrect` |
| Falscher Planet | `playWrongSound` | `vibrateWrong` (doppelt) |
| Combo | – | `vibrateCombo` (rhythmisch) |
| Shuffle / Black Hole | `playShuffleSound` | `vibrateShake` (lang) |

---

## 9. Komponenten-Entscheidungslog

| Datum | Entscheidung | Begründung |
|-------|-------------|-----------|
| 2026-04-23 | Sterne: 4-Punkt-Diamant statt Kreise | Kristallines Weltraum-Feeling |
| 2026-04-24 | Callsign-System eingeführt | Personalisierung ohne Onboarding-Friction |
| 2026-04-27 | XP-Lockdown bei Hint-Nutzung | Keine Lösung "spiken" – echtes Lernen fördern |
| 2026-04-28 | Bilanz-Toast am Wort-Ende | Klarer Abschluss des Hint-Flows |
| 2026-04-30 | 3-Farben-System festgelegt | Pink=Error, Purple=State, Gold=Combo |
| 2026-05-01 | Orbit-Ringe in 2 Elemente aufgeteilt | Bright-Spot bewegt sich nun physikalisch korrekt |
| 2026-05-01 | Hint-Sterne bleiben statisch | Emotional Zoning – Fokus-Kontext erfordert Ruhe |
| 2026-05-01 | Comet-Richtung zone-aware | Links-Planeten fliegen rechts, rechts-Planeten links |
| 2026-05-01 | Black Hole max. 3 Nutzungen | Konsistenz mit Shuffle-Limit |

---

## 10. Offene Punkte & Roadmap

### Phase 1 (aktuell)
- [x] Offline-First (IndexedDB)
- [x] FSRS-Algorithmus
- [x] Orbit-Puzzle (Hint-System)
- [x] XP-Ökonomie
- [x] Callsign-Profil
- [ ] PWA-Installation-Prompt optimieren
- [ ] `navigator.storage.persist()` implementieren

### Phase 2 (Telegram)
- [ ] Telegram CloudStorage (XP, Streak, Settings)
- [ ] Bot-Backup (JSON in User-Chat)
- [ ] Mini App Wrapper

### Phase 3 (Monetarisierung)
- [ ] Telegram Stars für Premium-Decks
- [ ] KI-Vokabelgenerierung (kostenpflichtig)
- [ ] Supabase für Deck-Bibliothek

---

*Dieses Dokument folgt dem Prinzip: „Ein gutes Design-System erklärt nicht nur WAS, sondern vor allem WARUM."*
