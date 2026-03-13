// ============================================================
// VokaOrbit — Global Styles
// Zentrale CSS-Animationen und globale Resets.
// Wird via <style>{spinnerCSS}</style> in App.jsx eingebunden.
// ============================================================

export const spinnerCSS = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }

  * { -webkit-tap-highlight-color: transparent; }

  input:focus {
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }

  button:active { transform: scale(0.97); }
`
// Hinweis für Sprint 4 (Framer Motion):
// Wenn Framer Motion eingebunden wird, werden die CSS-Animationen
// schrittweise durch motion.div-Komponenten aus src/design/animations.js ersetzt.
// spinnerCSS bleibt für native Spinner erhalten.
