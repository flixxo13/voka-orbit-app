// ============================================================
// VokaOrbit — einstellungen.js
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
  // Notifications — globaler Schalter
  notifAktiv: true,
  vokabelModus: 'schwerste',   // schwerste | ueberfaelligste | zufaellig

  // Notification-Typen — je eigene Zeiten + Schalter
  notifTypen: {
    wiederholungen: { aktiv: true,  zeiten: [8, 12, 18] },
    neueKarten:     { aktiv: true,  zeiten: [8] },
    streak:         { aktiv: true,  zeiten: [20] },
    rueckblick:     { aktiv: false, zeiten: [21] },
  },

  // Lerneinstellungen
  aktiveListen: ['en_a1'],
  lernrichtung: 'smart',
  lernrichtungVorher: null,

  // Neue Karten
  neueKartenProTag: 10,
  neueKartenModus: 'getrennt',

  // Onboarding
  onboardingAbgeschlossen: false,
}


// ------------------------------------------------------------
// Einstellungen laden
// ------------------------------------------------------------
export async function ladeEinstellungen() {
  try {
    const snap = await getDoc(doc(db, 'einstellungen', DEVICE_ID))
    if (snap.exists()) {
      const gespeichert = snap.data()
      // Deep merge für notifTypen — damit neue Typen nicht verloren gehen
      return {
        ...DEFAULT_EINSTELLUNGEN,
        ...gespeichert,
        notifTypen: {
          ...DEFAULT_EINSTELLUNGEN.notifTypen,
          ...(gespeichert.notifTypen ?? {}),
        }
      }
    }
    return { ...DEFAULT_EINSTELLUNGEN }
  } catch (err) {
    console.error('Fehler beim Laden der Einstellungen:', err)
    return { ...DEFAULT_EINSTELLUNGEN }
  }
}


// ------------------------------------------------------------
// Einstellungen speichern
// ------------------------------------------------------------
export async function speichereEinstellungen(daten) {
  try {
    await setDoc(
      doc(db, 'einstellungen', DEVICE_ID),
      { ...daten, geaendert: Date.now() },
      { merge: true }
    )
  } catch (err) {
    console.error('Fehler beim Speichern:', err)
    throw err
  }
}


// ------------------------------------------------------------
// Hilfsfunktionen
// ------------------------------------------------------------

export async function onboardingAbschliessen(ersteEinstellungen) {
  await speichereEinstellungen({
    ...ersteEinstellungen,
    onboardingAbgeschlossen: true,
    lernrichtungVorher: ersteEinstellungen.lernrichtung
  })
}

export async function aktualisiereLernrichtung(aktuelleEinst, neueRichtung) {
  const aktualisiert = {
    ...aktuelleEinst,
    lernrichtungVorher: aktuelleEinst.lernrichtung,
    lernrichtung: neueRichtung
  }
  await speichereEinstellungen(aktualisiert)
  return aktualisiert
}

export async function toggleListe(aktuelleEinst, listenId) {
  const aktuell = aktuelleEinst.aktiveListen ?? []
  let neu
  if (aktuell.includes(listenId)) {
    neu = aktuell.filter(id => id !== listenId)
  } else {
    neu = [...aktuell, listenId]
  }
  const aktualisiert = { ...aktuelleEinst, aktiveListen: neu }
  await speichereEinstellungen(aktualisiert)
  return aktualisiert
}
