import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const DEVICE_ID = localStorage.getItem('vokaorbit_id') || (() => {
  const id = 'user_' + Math.random().toString(36).slice(2)
  localStorage.setItem('vokaorbit_id', id)
  return id
})()

export const DEFAULT_EINSTELLUNGEN = {
  notifHaeufigkeit: 3,        // 1, 2 oder 3x täglich
  notifZeiten: [8, 12, 18],   // Uhrzeiten
  vokabelModus: 'schwerste',  // zufällig | schwerste | ueberfaelligste
  notifAktiv: true,
}

export async function ladeEinstellungen() {
  try {
    const snap = await getDoc(doc(db, 'einstellungen', DEVICE_ID))
    if (snap.exists()) {
      return { ...DEFAULT_EINSTELLUNGEN, ...snap.data() }
    }
    return DEFAULT_EINSTELLUNGEN
  } catch {
    return DEFAULT_EINSTELLUNGEN
  }
}

export async function speichereEinstellungen(daten) {
  await setDoc(doc(db, 'einstellungen', DEVICE_ID), {
    ...daten,
    geaendert: Date.now()
  })
}

export { DEVICE_ID }
