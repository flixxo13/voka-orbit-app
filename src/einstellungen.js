// ============================================================
// VokaOrbit — einstellungen.js
// ============================================================
//
// Lädt und speichert Nutzereinstellungen in Firestore.
// Jedes Gerät hat ein eigenes Dokument (DEVICE_ID als Schlüssel).
//
// Neu in v2:
//   - aktiveListen: welche Vokabellisten aktiv sind
//   - lernrichtung: "smart" | "beide" | "en_de" | "de_en" | "abwechselnd"
//   - onboardingAbgeschlossen: ob der Erststart-Screen gezeigt wurde
//   - lernrichtungVorher: für handleRichtungswechsel in vokabeln.js
// ============================================================

import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

// ------------------------------------------------------------
// Geräte-ID — eindeutig pro Browser/Gerät
// ------------------------------------------------------------
export const DEVICE_ID = localStorage.getItem('vokaorbit_id') || (() => {
  const id = 'user_' + Math.random().toString(36).slice(2)
  localStorage.setItem('vokaorbit_id', id)
  return id
})()


// ------------------------------------------------------------
// Standard-Einstellungen
// ------------------------------------------------------------
export const DEFAULT_EINSTELLUNGEN = {
  // Notifications
  notifAktiv: true,
  notifZeiten: [8, 12, 18],
  vokabelModus: 'schwerste',   // schwerste | ueberfaelligste | zufaellig

  // Lerneinstellungen (NEU)
  aktiveListen: ['en_a1'],     // mindestens eine Liste aktiv beim Start
  lernrichtung: 'smart',       // smart | beide | en_de | de_en | abwechselnd
  lernrichtungVorher: null,    // merkt sich die letzte Richtung für Wechsel-Logik

  // Neue Karten
  neueKartenProTag: 10,        // 1–50
  neueKartenModus: 'getrennt', // getrennt | gemischt

  // Onboarding (NEU)
  onboardingAbgeschlossen: false,
}


// ------------------------------------------------------------
// Einstellungen laden
// ------------------------------------------------------------

/**
 * Lädt Einstellungen aus Firestore.
 * Fehlende Felder werden mit DEFAULT_EINSTELLUNGEN aufgefüllt.
 * @returns {object} - vollständige Einstellungen
 */
export async function ladeEinstellungen() {
  try {
    const snap = await getDoc(doc(db, 'einstellungen', DEVICE_ID))
    if (snap.exists()) {
      // Merge: Firestore-Daten überschreiben Defaults
      // Neue Felder (die noch nicht in Firestore sind) bekommen Default-Wert
      return { ...DEFAULT_EINSTELLUNGEN, ...snap.data() }
    }
    // Noch keine Einstellungen → Defaults zurückgeben
    return { ...DEFAULT_EINSTELLUNGEN }
  } catch (err) {
    console.error('Fehler beim Laden der Einstellungen:', err)
    return { ...DEFAULT_EINSTELLUNGEN }
  }
}


// ------------------------------------------------------------
// Einstellungen speichern
// ------------------------------------------------------------

/**
 * Speichert Einstellungen in Firestore.
 * Überschreibt das gesamte Dokument (setDoc mit merge).
 * @param {object} daten - zu speichernde Einstellungen
 */
export async function speichereEinstellungen(daten) {
  try {
    await setDoc(
      doc(db, 'einstellungen', DEVICE_ID),
      {
        ...daten,
        geaendert: Date.now()
      },
      { merge: true }  // vorhandene Felder nicht löschen
    )
  } catch (err) {
    console.error('Fehler beim Speichern der Einstellungen:', err)
    throw err
  }
}


// ------------------------------------------------------------
// Hilfsfunktionen
// ------------------------------------------------------------

/**
 * Markiert Onboarding als abgeschlossen.
 */
export async function onboardingAbschliessen(ersteEinstellungen) {
  await speichereEinstellungen({
    ...ersteEinstellungen,
    onboardingAbgeschlossen: true,
    lernrichtungVorher: ersteEinstellungen.lernrichtung
  })
}

/**
 * Aktualisiert nur die Lernrichtung und merkt sich die alte.
 * @param {object} aktuelleEinst - aktuelle Einstellungen
 * @param {string} neueRichtung  - neue Lernrichtung
 * @returns {object}             - aktualisierte Einstellungen
 */
export async function aktualisiereLernrichtung(aktuelleEinst, neueRichtung) {
  const aktualisiert = {
    ...aktuelleEinst,
    lernrichtungVorher: aktuelleEinst.lernrichtung,
    lernrichtung: neueRichtung
  }
  await speichereEinstellungen(aktualisiert)
  return aktualisiert
}

/**
 * Schaltet eine Liste an oder aus.
 * @param {object} aktuelleEinst - aktuelle Einstellungen
 * @param {string} listenId      - z.B. "en_a1"
 * @returns {object}             - aktualisierte Einstellungen
 */
export async function toggleListe(aktuelleEinst, listenId) {
  const aktuell = aktuelleEinst.aktiveListen ?? []
  let neu

  if (aktuell.includes(listenId)) {
    // Mindestens eine Liste muss aktiv bleiben
    if (aktuell.length <= 1) return aktuelleEinst
    neu = aktuell.filter(id => id !== listenId)
  } else {
    neu = [...aktuell, listenId]
  }

  const aktualisiert = { ...aktuelleEinst, aktiveListen: neu }
  await speichereEinstellungen(aktualisiert)
  return aktualisiert
}
