// ============================================================
// VokaOrbit — Design Tokens v2.0
// EINE einzige Wahrheit für alle visuellen Werte.
//
// Struktur:
//   tokens        → Theme-unabhängige Werte (Radius, Spacing, Font, Z, Easing)
//   lightColors   → Orbit Light (Tag-Modus)
//   darkColors    → Orbit Dark / Space (Nacht-Modus)
//   composite(c)  → Abgeleitete Styles — nimmt colors als Argument
//
// Verwendung mit useTheme():
//   const { colors, isDark } = useTheme()
//   <div style={{ background: colors.surface }}>
// ============================================================


// ── Theme-unabhängige Basis-Tokens ──────────────────────────
export const tokens = {

  // ── Brand Colors (immer gleich, egal ob Light oder Dark) ──
  brand: {
    purple:    '#7C3AED',   // Orbit Purple — Primärfarbe
    indigo:    '#4F46E5',   // Orbit Indigo — Sekundär, Gradients
    violet:    '#A78BFA',   // Orbit Violet — Highlights, Glows, Progress
    cyan:      '#06B6D4',   // Satellite Cyan — Hint-Labels, Links
    cyanDark:  '#0891B2',   // Cyan dunkel — Leicht-Bewertung, Info
    streak:    '#F97316',   // Streak Orange — Gamification
    forbidden: '#4C1D95',   // Forbidden Zone Purple
  },

  // ── Border Radius ─────────────────────────────────────────
  radius: {
    xs:     6,
    sm:     8,
    md:     10,
    lg:     12,
    xl:     14,
    card:   16,
    cardLg: 20,
    card3x: 28,   // Vokabelkarte — "sehr rund" laut Design System
    pill:   100,
  },

  // ── Abstände ──────────────────────────────────────────────
  spacing: {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  24,
    xxl: 40,
    xxxl: 64,
  },

  // ── Typografie ────────────────────────────────────────────
  font: {
    // Plus Jakarta Sans: moderner, gewichtig — ideal für Vokabel-Dominanz
    // Fallback auf system-ui solange Font nicht geladen
    family: "'Plus Jakarta Sans', 'DM Sans', system-ui, -apple-system, sans-serif",

    size: {
      xs:      '0.65rem',   // 10px — Widget-Labels (CAPS)
      sm:      '0.72rem',   // 11px — Screen-Labels, Hint-Labels (CAPS)
      base:    '0.78rem',   // 12px — Akkordeon-Labels
      md:      '0.88rem',   // 14px — Body-Text, Hints, Eselsbrücken
      lg:      '1rem',      // 16px — Button-Text
      xl:      '1.1rem',    // 17px
      xxl:     '1.25rem',   // 20px
      h2:      '1.5rem',    // 24px — Übersetzung nach Aufdecken
      h1:      '1.8rem',    // 29px
      widget:  '1.75rem',   // 28px — Widget-Zahl (Streak, Session)
      vokabel: '2.2rem',    // 35px — Hauptwort auf der Karte
      vokabelLg: '3rem',    // 48px — Großes Vokabel (kurze Wörter)
    },

    weight: {
      normal:    400,
      medium:    500,
      semibold:  600,
      bold:      700,
      extrabold: 800,
      black:     900,   // Für das Hauptvokabel
    },

    tracking: {
      tight:  '-0.02em',   // Große Überschriften
      normal: '0',
      wide:   '0.04em',
      wider:  '0.06em',    // Akkordeon-Labels
      caps:   '0.08em',    // Hint-Labels, Screen-Labels (CAPS)
      widest: '0.12em',    // Buchstaben-Hint (Monospace)
    },
  },

  // ── Animationskurven (Orbit-Sprache) ──────────────────────
  // Aus Design System: "Kurven wie Planetenbewegungen"
  easing: {
    orbitEnter: 'cubic-bezier(0.23, 1, 0.32, 1)',       // Karte erscheint, Hint slide-in
    orbitExit:  'cubic-bezier(0.4, 0, 1, 1)',            // Karte verschwindet, Tab wechselt
    orbitFloat: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)', // Hintergrund-Elemente, Rakete
    spring:     'cubic-bezier(0.34, 1.56, 0.64, 1)',     // Button-Press, Bewertungs-Feedback
    linear:     'linear',                                 // Progress-Bar Füllen
  },

  // ── Animationsdauern ──────────────────────────────────────
  duration: {
    instant:  '80ms',
    fast:     '150ms',
    default:  '250ms',
    medium:   '350ms',
    slow:     '500ms',
    cardFlip: '600ms',   // 3D-Card-Flip
    celebrate: '3000ms', // Session-Ende Konfetti
  },

  // ── Transitions (fertige Strings für style-Prop) ──────────
  transition: {
    fast:    'all 0.12s ease',
    default: 'all 0.15s ease',
    slow:    'all 0.2s ease',
    orbit:   'all 0.25s cubic-bezier(0.23, 1, 0.32, 1)',   // Orbit Enter
    spring:  'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring
  },

  // ── Z-Index Leiter ────────────────────────────────────────
  z: {
    base:       1,
    widget:    10,
    card:      20,
    hint:      30,
    nav:      100,
    overlay:  500,
    modal:   1000,
    toast:   1100,
    stars:     -1,   // Hinter allem
  },
}


// ── Light Theme: Orbit Light (Tag) ───────────────────────────
// "Weiches blaues Weltall bei Tage. Klar, fokussiert, professionell."
export const lightColors = {

  // Hintergrund
  bgGradient:     'linear-gradient(160deg, #C7D9FF 0%, #E8D5FF 100%)',
  bg:             '#EEF2FF',   // Fallback wenn Gradient nicht lädt

  // Karten & Oberflächen
  surface:        '#FFFFFF',   // Hauptkarte, Widgets
  surfaceFrosted: '#F0F4FF',   // Sekundäre Karten, Hint-Box
  surfaceAlt:     '#F8FAFC',   // Hintergrund-Karten
  surfaceHover:   '#F1F5FF',   // Hover-Zustand

  // Text
  textDark:       '#1E293B',   // Überschriften, Vokabeln
  textMid:        '#475569',   // Übersetzungen, Body
  textMuted:      '#94A3B8',   // Hilfstexte, Timestamps
  textLight:      '#64748B',   // Sekundäre Labels

  // Brand (im Light-Kontext)
  primary:        '#7C3AED',   // Orbit Purple
  primaryDark:    '#4F46E5',   // Hover, Gradients
  primaryLight:   '#EDE9FE',   // Hintergrund-Tint
  primaryBg:      '#FAF5FF',   // Sehr heller Tint
  primaryViolet:  '#A78BFA',   // Progress, Glows
  cyan:           '#06B6D4',   // Hint-Label "QUICK HINT"

  // Semantisch
  success:        '#16A34A',
  successBg:      '#F0FDF4',
  successLight:   '#DCFCE7',
  warning:        '#D97706',
  warningBg:      '#FEF3C7',
  danger:         '#EF4444',
  dangerBg:       '#FEF2F2',
  dangerLight:    '#FECACA',
  info:           '#3B82F6',
  streak:         '#F97316',

  // Rahmen
  border:         '#E2E8F0',
  borderLight:    '#F1F5F9',
  borderFocus:    '#A78BFA',   // Fokus-Ring

  // Gradienten
  gradient:           'linear-gradient(135deg, #7C3AED, #4F46E5)',
  gradientLight:      'linear-gradient(135deg, #A78BFA, #60A5FA)',
  gradientProgress:   'linear-gradient(90deg, #A78BFA, #60A5FA)',
  gradientForbidden:  'linear-gradient(160deg, #4C1D95, #1E1B4B)',
  gradientHint:       'linear-gradient(135deg, #EDE9FE, #DBEAFE)',

  // Schatten
  shadowSm:       '0 2px 8px rgba(0, 0, 0, 0.06)',
  shadowMd:       '0 4px 20px rgba(0, 0, 0, 0.08)',
  shadowCard:     '0 20px 60px rgba(0, 0, 0, 0.10)',   // Design System: "Karte schwebt"
  shadowLg:       '0 8px 40px rgba(0, 0, 0, 0.15)',
  shadowPrimary:  '0 4px 16px rgba(124, 58, 237, 0.30)',
  shadowNav:      '0 -4px 20px rgba(0, 0, 0, 0.08)',
  shadowBadge:    '0 2px 8px rgba(251, 191, 36, 0.40)',

  // Sonstige
  badge:          '#FBBF24',
  overlay:        'rgba(0, 0, 0, 0.45)',
  navBg:          '#FFFFFF',
  navBorder:      '#E2E8F0',

  // Rocket
  rocketBg:       '#7C3AED',
  rocketIcon:     '#FFFFFF',
}


// ── Dark Theme: Orbit Dark / Space (Nacht) ───────────────────
// "Tiefer Weltraum. Sterne als Hintergrund. Wie ein Cockpit bei Nacht."
export const darkColors = {

  // Hintergrund — Deep Space
  bgGradient:     'linear-gradient(160deg, #080818 0%, #0D0D1F 100%)',
  bg:             '#080818',   // Space Black

  // Karten & Oberflächen — Glassmorphism
  surface:        'rgba(26, 26, 53, 0.85)',    // Card Dark + Glassmorphism
  surfaceFrosted: 'rgba(37, 37, 69, 0.75)',    // Sekundäre Karten
  surfaceAlt:     '#0D0D1F',                   // Space Navy — Hintergrundkarten
  surfaceHover:   'rgba(26, 26, 53, 0.95)',    // Hover-Zustand

  // Glassmorphism-Spezifika
  cardBlur:       'blur(20px)',                // backdrop-filter
  cardBorder:     'rgba(167, 139, 250, 0.20)', // Lila Glow-Border
  cardBorderHover:'rgba(167, 139, 250, 0.40)', // Hover

  // Text — Hell auf Dunkel
  textDark:       '#FFFFFF',   // Überschriften (invertiert — jetzt hell)
  textMid:        '#CBD5E1',   // Übersetzungen, Body
  textMuted:      '#64748B',   // Hilfstexte im Dark Mode
  textLight:      '#94A3B8',   // Sekundäre Labels

  // Brand (im Dark-Kontext — Cyan wird zur Primär-Akzentfarbe)
  primary:        '#A78BFA',   // Orbit Violet — im Dark mehr Leuchtkraft
  primaryDark:    '#7C3AED',   // Hover
  primaryLight:   'rgba(167, 139, 250, 0.15)', // Hintergrund-Tint
  primaryBg:      'rgba(124, 58, 237, 0.10)',  // Sehr dunkler Tint
  primaryViolet:  '#A78BFA',   // Glow-Akzent
  cyan:           '#06B6D4',   // "SATELLITE SIGNAL" — bleibt Cyan

  // Semantisch (leicht aufgehellt für Dark-Kontrast)
  success:        '#22C55E',
  successBg:      'rgba(34, 197, 94, 0.10)',
  successLight:   'rgba(34, 197, 94, 0.20)',
  warning:        '#F59E0B',
  warningBg:      'rgba(245, 158, 11, 0.10)',
  danger:         '#F87171',
  dangerBg:       'rgba(248, 113, 113, 0.10)',
  dangerLight:    'rgba(248, 113, 113, 0.20)',
  info:           '#60A5FA',
  streak:         '#FB923C',   // Etwas heller für Dark-Modus

  // Rahmen — subtil auf dunklem Grund
  border:         'rgba(255, 255, 255, 0.08)',
  borderLight:    'rgba(255, 255, 255, 0.04)',
  borderFocus:    'rgba(167, 139, 250, 0.60)',

  // Gradienten
  gradient:           'linear-gradient(135deg, #7C3AED, #4F46E5)',
  gradientLight:      'linear-gradient(135deg, #A78BFA, #60A5FA)',
  gradientProgress:   'linear-gradient(90deg, #A78BFA, #06B6D4)',  // Lila → Cyan im Dark
  gradientForbidden:  'linear-gradient(160deg, #4C1D95, #1E1B4B)',
  gradientHint:       'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(6,182,212,0.10))',

  // Schatten — mit Glow-Effekten
  shadowSm:       '0 2px 8px rgba(0, 0, 0, 0.40)',
  shadowMd:       '0 4px 20px rgba(0, 0, 0, 0.50)',
  shadowCard:     '0 20px 60px rgba(0, 0, 0, 0.60), 0 0 0 1px rgba(167, 139, 250, 0.15)',
  shadowLg:       '0 8px 40px rgba(0, 0, 0, 0.70)',
  shadowPrimary:  '0 4px 20px rgba(167, 139, 250, 0.35)',  // Violet Glow
  shadowCyan:     '0 4px 20px rgba(6, 182, 212, 0.25)',    // Cyan Glow
  shadowNav:      '0 -4px 20px rgba(0, 0, 0, 0.60)',
  shadowBadge:    '0 2px 12px rgba(251, 191, 36, 0.50)',

  // Sterne (für Star-Field Canvas)
  starColor:      '#E2E8F0',   // Basis-Sternfarbe
  starOpacityMin: 0.15,
  starOpacityMax: 0.60,

  // Sonstige
  badge:          '#FBBF24',
  overlay:        'rgba(0, 0, 0, 0.70)',
  navBg:          'rgba(13, 13, 31, 0.95)',  // Space Navy + blur
  navBorder:      'rgba(255, 255, 255, 0.06)',

  // Rocket
  rocketBg:       '#7C3AED',   // Lila im Dark
  rocketIcon:     '#FFFFFF',
}


// ── Composite Styles — theme-aware ──────────────────────────
// Nimmt das aktive colors-Objekt als Argument.
// Verwendung: composite(colors).card
export const composite = (colors) => ({

  card: {
    background:   colors.surface,
    borderRadius: tokens.radius.card3x,
    boxShadow:    colors.shadowCard,
    // Dark Mode: Glassmorphism via inline backdropFilter
  },

  sectionCard: {
    background:   colors.surface,
    borderRadius: tokens.radius.cardLg,
    padding:      '1.25rem',
    marginBottom: tokens.spacing.lg,
    boxShadow:    colors.shadowSm,
  },

  primaryBtn: {
    background:    colors.gradient,
    color:         '#FFFFFF',
    border:        'none',
    borderRadius:  tokens.radius.xl,
    fontSize:      tokens.font.size.lg,
    fontWeight:    tokens.font.weight.bold,
    cursor:        'pointer',
    fontFamily:    'inherit',
    boxShadow:     colors.shadowPrimary,
    letterSpacing: tokens.font.tracking.tight,
    padding:       '0.9rem',
    width:         '100%',
    transition:    tokens.transition.spring,
  },

  label: {
    fontSize:      tokens.font.size.sm,
    fontWeight:    tokens.font.weight.bold,
    color:         colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: tokens.font.tracking.caps,
    display:       'block',
    margin:        0,
  },

  // Caps-Label in Cyan — für Hint-Labels
  hintLabel: {
    fontSize:      tokens.font.size.sm,
    fontWeight:    tokens.font.weight.bold,
    color:         colors.cyan,
    textTransform: 'uppercase',
    letterSpacing: tokens.font.tracking.caps,
  },

  radioKreis: {
    width:          20,
    height:         20,
    borderRadius:   '50%',
    border:         '2px solid',
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    transition:     tokens.transition.default,
  },

  radioKern: {
    width:        8,
    height:       8,
    borderRadius: '50%',
    background:   '#FFFFFF',
  },

  pill: {
    background:   colors.surface,
    borderRadius: tokens.radius.pill,
    boxShadow:    colors.shadowMd,
    border:       `1px solid ${colors.border}`,
  },

  glassmorphism: {
    background:     colors.surface,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border:         `1px solid ${colors.cardBorder ?? colors.border}`,
    borderRadius:   tokens.radius.card3x,
    boxShadow:      colors.shadowCard,
  },
})


// ── Rückwärts-Kompatibilität ──────────────────────────────────
// Bestehender Code der `tokens.colors.X` oder `composite.X` nutzt
// funktioniert weiterhin — zeigt Light-Mode-Werte.
// DEPRECATED: Bitte auf useTheme() migrieren.
export { lightColors as defaultColors }
