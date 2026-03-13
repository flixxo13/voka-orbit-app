// ============================================================
// VokaOrbit — Design Tokens
// EINE einzige Wahrheit für alle visuellen Werte.
// Für Redesign: nur diese Datei ändern.
// ============================================================

export const tokens = {

  // ── Farben ──────────────────────────────────────────────
  colors: {
    // Brand
    primary:      '#7c3aed',   // Orbit Purple
    primaryDark:  '#4f46e5',   // Orbit Indigo
    primaryLight: '#ede9fe',   // Heller Lila-Hintergrund
    primaryBg:    '#faf5ff',   // Sehr heller Lila-Hintergrund
    primaryViolet:'#a78bfa',   // Akzent-Violett (Progress, Glows)

    // Semantisch
    success:     '#16a34a',
    successBg:   '#f0fdf4',
    successLight:'#dcfce7',

    warning:     '#d97706',
    warningBg:   '#fef3c7',

    danger:      '#ef4444',
    dangerBg:    '#fef2f2',
    dangerLight: '#fecaca',

    info:        '#3b82f6',

    streak:      '#f97316',   // Orange für Streak/Gamification

    // Typografie
    textDark:    '#1e293b',   // Überschriften, Vokabeln
    textMid:     '#475569',   // Body, Übersetzungen
    textMuted:   '#94a3b8',   // Hilfstexte, Labels
    textLight:   '#64748b',   // Sekundäre Labels

    // Oberflächen
    surface:     '#ffffff',
    surfaceAlt:  '#f8fafc',
    bg:          '#f1f5f9',

    // Rahmen
    border:      '#e2e8f0',
    borderLight: '#f1f5f9',

    // Gradienten (als String für direkte CSS-Nutzung)
    gradient:          'linear-gradient(135deg, #7c3aed, #4f46e5)',
    gradientLight:     'linear-gradient(135deg, #a78bfa, #60a5fa)',
    gradientProgress:  'linear-gradient(90deg, #a78bfa, #60a5fa)',
    gradientSpace:     'linear-gradient(160deg, #0f0c29, #302b63)',

    // Sonstige
    badge:        '#fbbf24',  // Gelb für fällige-Karten-Badge
    overlay:      'rgba(0,0,0,0.45)',
  },

  // ── Border Radius ────────────────────────────────────────
  radius: {
    xs:   6,
    sm:   8,
    md:   10,
    lg:   12,
    xl:   14,
    card: 16,
    cardLg: 20,
    pill: 100,
  },

  // ── Abstände ─────────────────────────────────────────────
  spacing: {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  24,
    xxl: 40,
  },

  // ── Schatten ─────────────────────────────────────────────
  shadow: {
    sm:      '0 2px 8px rgba(0,0,0,0.06)',
    md:      '0 4px 20px rgba(0,0,0,0.08)',
    card:    '0 8px 32px rgba(0,0,0,0.12)',
    lg:      '0 8px 40px rgba(0,0,0,0.15)',
    primary: '0 4px 16px rgba(124,58,237,0.3)',
    nav:     '0 -4px 20px rgba(0,0,0,0.08)',
    badge:   '0 2px 8px rgba(251,191,36,0.4)',
  },

  // ── Typografie ───────────────────────────────────────────
  font: {
    family: "'system-ui', '-apple-system', sans-serif",
    // Für Sprint 4+: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif"

    size: {
      xs:     '0.65rem',
      sm:     '0.72rem',
      base:   '0.78rem',
      md:     '0.88rem',
      lg:     '1rem',
      xl:     '1.1rem',
      xxl:    '1.25rem',
      h2:     '1.5rem',
      h1:     '1.8rem',
      vokabel:'2.2rem',
    },

    weight: {
      normal:    400,
      medium:    500,
      semibold:  600,
      bold:      700,
      extrabold: 800,
      black:     900,
    },

    tracking: {
      tight:  '-0.02em',
      normal: '0',
      wide:   '0.04em',
      wider:  '0.06em',
      caps:   '0.08em',
    },
  },

  // ── Transitions ──────────────────────────────────────────
  transition: {
    fast:    'all 0.12s ease',
    default: 'all 0.15s ease',
    slow:    'all 0.2s ease',
  },

  // ── Z-Index Leiter ───────────────────────────────────────
  z: {
    nav:    100,
    modal:  1000,
    toast:  1100,
  },
}

// ── Abgeleitete Composite-Styles (häufig genutzte Kombinationen) ──
export const composite = {
  card: {
    background: tokens.colors.surface,
    borderRadius: tokens.radius.cardLg,
    boxShadow: tokens.shadow.card,
  },
  sectionCard: {
    background: tokens.colors.surface,
    borderRadius: tokens.radius.cardLg,
    padding: '1.25rem',
    marginBottom: tokens.spacing.lg,
    boxShadow: tokens.shadow.sm,
  },
  primaryBtn: {
    background: tokens.colors.gradient,
    color: tokens.colors.surface,
    border: 'none',
    borderRadius: tokens.radius.xl,
    fontSize: tokens.font.size.lg,
    fontWeight: tokens.font.weight.bold,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: tokens.shadow.primary,
    letterSpacing: tokens.font.tracking.tight,
    padding: '0.9rem',
    width: '100%',
  },
  label: {
    fontSize: tokens.font.size.sm,
    fontWeight: tokens.font.weight.bold,
    color: tokens.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: tokens.font.tracking.wider,
    display: 'block',
    margin: 0,
  },
  radioKreis: {
    width: 20, height: 20,
    borderRadius: '50%',
    border: '2px solid',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: tokens.transition.default,
  },
  radioKern: {
    width: 8, height: 8,
    borderRadius: '50%',
    background: tokens.colors.surface,
  },
}
