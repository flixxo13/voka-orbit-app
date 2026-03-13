// ============================================================
// VokaOrbit — src/vokabeln.js
// BARREL-DATEI — Re-Exports aus core/listen.js + core/storage.js
// Ermöglicht Abwärtskompatibilität während der Migration.
// NEU: Direkt aus src/core/listen.js und src/core/storage.js importieren.
// ============================================================

export {
  ladeAktiveListen,
  ladeEigeneListen,
  listeErstellen,
  listeLoeschen,
  ladeVokabelnFuerListe,
  vokabelZuListeHinzufuegen,
  vokabelAusListeLoeschen,
  migriereLegacyVokabeln,
  ladeEigeneVokabeln,
  vokabelHinzufuegen,
  vokabelLoeschen,
} from './core/listen'

export {
  speichereFortschritt,
  ladeAlleKarten,
  verarbeiteRichtungswechsel,
} from './core/storage'
