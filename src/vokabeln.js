// ============================================================
// VokaOrbit — vokabeln.js
// ============================================================
//
// Lädt und kombiniert alle Vokabeln:
//   - Listen-Karten: aus public/listen/*.json (statisch)
//   - Eigene Karten: aus Firestore (eigeneVokabeln)
//
// Fortschritt (FSRS-Profile) kommt immer aus Firestore.
//
// Exports:
//   ladeAlleKarten()           → Lernkarten mit Profilen + Richtung
//   speichereFortschritt()     → FSRS-Ergebnis zurückschreiben
//   verarbeiteRichtungswechsel() → Profile anlegen bei Richtungsänderung
//   ladeEigeneVokabeln()       → für den "Neu"-Tab
//   vokabelHinzufuegen()       → neue eigene Vokabel speichern
//   vokabelLoeschen()          → eigene Vokabel löschen
// ============================================================

import { db } from './firebase'
import {
  collection, getDocs, doc, setDoc, deleteDoc,
  addDoc, query, where
} from 'firebase/firestore'
import { DEVICE_ID } from './einstellungen'
import { erstelleStartProfil, handleRichtungswechsel, waehleRichtung } from './fsrs'


// ------------------------------------------------------------
// 1. Listen-Karten aus JSON laden
// ------------------------------------------------------------

/**
 * Lädt eine einzelne Vokabelliste aus public/listen/
 * @param {string} listenId - z.B. "en_a1"
 * @returns {Array} - [{ id: "en_a1_000", wort, uebersetzung }, ...]
 */
async function ladeListeAusJSON(listenId) {
  try {
    const res = await fetch(`/listen/${listenId}.json`)
    if (!res.ok) throw new Error(`Liste ${listenId} nicht gefunden`)
    const daten = await res.json()
    return daten.map((v, index) => ({
      id: `${listenId}_${String(index).padStart(3, '0')}`,
      typ: 'liste',
      wort: v.wort,
      uebersetzung: v.uebersetzung,
      listenId,
      index
    }))
  } catch (err) {
    console.error(`Fehler beim Laden von ${listenId}:`, err)
    return []
  }
}

/**
 * Lädt alle aktiven Listen
 * @param {string[]} aktiveListen - z.B. ["en_a1", "en_b1"]
 * @returns {Array} - alle Karten aus allen aktiven Listen
 */
async function ladeAktiveListen(aktiveListen = []) {
  const ergebnisse = await Promise.all(aktiveListen.map(ladeListeAusJSON))
  return ergebnisse.flat()
}


// ------------------------------------------------------------
// 2. Eigene Vokabeln aus Firestore laden
// ------------------------------------------------------------

/**
 * Lädt alle eigenen Vokabeln dieses Geräts.
 * @returns {Array} - [{ id: "eigen_xxx", typ: "eigen", wort, uebersetzung }, ...]
 */
export async function ladeEigeneVokabeln() {
  try {
    const q = query(
      collection(db, 'eigeneVokabeln'),
      where('deviceId', '==', DEVICE_ID)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: `eigen_${d.id}`,
      firestoreId: d.id,
      typ: 'eigen',
      wort: d.data().vorderseite,
      uebersetzung: d.data().rueckseite,
      erstellt: d.data().erstellt
    }))
  } catch (err) {
    console.error('Fehler beim Laden eigener Vokabeln:', err)
    return []
  }
}

/**
 * Speichert eine neue eigene Vokabel.
 * @param {string} vorderseite
 * @param {string} rueckseite
 */
export async function vokabelHinzufuegen(vorderseite, rueckseite) {
  const docRef = await addDoc(collection(db, 'eigeneVokabeln'), {
    deviceId: DEVICE_ID,
    vorderseite: vorderseite.trim(),
    rueckseite: rueckseite.trim(),
    erstellt: Date.now()
  })
  return `eigen_${docRef.id}`
}

/**
 * Löscht eine eigene Vokabel.
 * @param {string} vokabelId - z.B. "eigen_xK9mP2qR"
 */
export async function vokabelLoeschen(vokabelId) {
  const firestoreId = vokabelId.replace('eigen_', '')
  await deleteDoc(doc(db, 'eigeneVokabeln', firestoreId))
}


// ------------------------------------------------------------
// 3. Fortschritt (FSRS-Profile) aus Firestore laden
// ------------------------------------------------------------

/**
 * Lädt alle FSRS-Profile dieses Geräts.
 * @returns {object} - { "en_a1_042_en_de": profilDaten, ... }
 */
async function ladeFortschritt() {
  try {
    const q = query(
      collection(db, 'fortschritt'),
      where('deviceId', '==', DEVICE_ID)
    )
    const snap = await getDocs(q)

    const profile = {}
    snap.docs.forEach(d => {
      const daten = d.data()
      const schluessel = `${daten.vokabelId}_${daten.richtung}`
      profile[schluessel] = {
        intervall: daten.intervall ?? 0,
        wiederholungen: daten.wiederholungen ?? 0,
        stabilitaet: daten.stabilitaet ?? 1,
        naechsteFaelligkeit: daten.naechsteFaelligkeit ?? Date.now(),
        letzteWiederholung: daten.letzteWiederholung ?? null,
        firestoreId: d.id
      }
    })
    return profile
  } catch (err) {
    console.error('Fehler beim Laden des Fortschritts:', err)
    return {}
  }
}


// ------------------------------------------------------------
// 4. Fortschritt speichern
// ------------------------------------------------------------

/**
 * Speichert ein FSRS-Profil nach einer Bewertung.
 * @param {string} vokabelId - z.B. "en_a1_042" oder "eigen_xK9mP2qR"
 * @param {string} richtung  - "en_de" | "de_en" | "abwechselnd"
 * @param {object} profilDaten - { intervall, wiederholungen, stabilitaet, naechsteFaelligkeit, letzteWiederholung }
 */
export async function speichereFortschritt(vokabelId, richtung, profilDaten, meta = {}) {
  // Dokument-ID ist immer deterministisch → kein Duplikat möglich
  const docId = `${DEVICE_ID}_${vokabelId}_${richtung}`
  await setDoc(doc(db, 'fortschritt', docId), {
    deviceId: DEVICE_ID,
    vokabelId,
    richtung,
    // wort + uebersetzung für Server-Notifications mitspeichern
    wort:         meta.wort         ?? '',
    uebersetzung: meta.uebersetzung ?? '',
    ...profilDaten
  })
}


// ------------------------------------------------------------
// 5. Profile zusammenführen
// ------------------------------------------------------------

/**
 * Hängt FSRS-Profile an eine Karte.
 * @param {object} karte - { id, wort, uebersetzung, ... }
 * @param {object} alleProfile - gesamtes Fortschritt-Objekt
 * @returns {object} - Karte mit profil_en_de, profil_de_en, profil_abwechselnd
 */
function haengeProfileAn(karte, alleProfile) {
  return {
    ...karte,
    profil_en_de:       alleProfile[`${karte.id}_en_de`]       ?? null,
    profil_de_en:       alleProfile[`${karte.id}_de_en`]       ?? null,
    profil_abwechselnd: alleProfile[`${karte.id}_abwechselnd`] ?? null,
  }
}


// ------------------------------------------------------------
// 6. Lernkarte erstellen (mit Richtung + Vorderseite/Rückseite)
// ------------------------------------------------------------

/**
 * Erstellt eine Lernkarte aus einer Karte + gewählter Richtung.
 * @param {object} karte - Karte mit Profilen
 * @param {string} richtung - "en_de" | "de_en"
 * @returns {object} - Lernkarte mit vorderseite, rueckseite, aktivProfil
 */
function erstelleLernkarte(karte, richtung) {
  const aktivProfil = richtung === 'en_de'
    ? (karte.profil_en_de ?? erstelleStartProfil())
    : (karte.profil_de_en ?? erstelleStartProfil())

  return {
    ...karte,
    richtung,
    vorderseite: richtung === 'en_de' ? karte.wort        : karte.uebersetzung,
    rueckseite:  richtung === 'en_de' ? karte.uebersetzung : karte.wort,
    aktivProfil
  }
}


// ------------------------------------------------------------
// 7. Hauptfunktion: Alle Karten laden
// ------------------------------------------------------------

/**
 * Lädt alle Karten (Listen + eigene) mit Profilen,
 * bestimmt die Lernrichtung und gibt Lernkarten zurück.
 *
 * @param {string[]} aktiveListen - aktive Listen-IDs
 * @param {string} lernrichtung   - "smart"|"beide"|"en_de"|"de_en"|"abwechselnd"
 * @returns {object} - { alleKarten, lernkarten }
 *   alleKarten:  alle Karten mit Profilen (für Statistik/Entdecken)
 *   lernkarten:  Karten bereit zum Lernen (mit vorderseite/rueckseite/aktivProfil)
 */
export async function ladeAlleKarten(aktiveListen = [], lernrichtung = 'smart') {
  // Parallel laden
  const [listenKarten, eigeneKarten, alleProfile] = await Promise.all([
    ladeAktiveListen(aktiveListen),
    ladeEigeneVokabeln(),
    ladeFortschritt()
  ])

  // Profile anhängen
  const alleKarten = [
    ...listenKarten.map(k => haengeProfileAn(k, alleProfile)),
    ...eigeneKarten.map(k => haengeProfileAn(k, alleProfile))
  ]

  // Lernkarten erstellen je nach Richtungseinstellung
  const lernkarten = []

  if (lernrichtung === 'abwechselnd') {
    // Ein Profil, Richtung per Zufall beim Anzeigen
    for (const karte of alleKarten) {
      const profil = karte.profil_abwechselnd ?? erstelleStartProfil()
      lernkarten.push({
        ...karte,
        richtung: 'abwechselnd', // wird in LernenTab beim Anzeigen gewürfelt
        vorderseite: karte.wort,
        rueckseite: karte.uebersetzung,
        aktivProfil: profil
      })
    }
  } else if (lernrichtung === 'en_de') {
    for (const karte of alleKarten) {
      lernkarten.push(erstelleLernkarte(karte, 'en_de'))
    }
  } else if (lernrichtung === 'de_en') {
    for (const karte of alleKarten) {
      lernkarten.push(erstelleLernkarte(karte, 'de_en'))
    }
  } else {
    // "smart" oder "beide" → waehleRichtung pro Karte
    for (const karte of alleKarten) {
      const richtung = waehleRichtung(
        { en_de: karte.profil_en_de, de_en: karte.profil_de_en },
        lernrichtung
      )
      lernkarten.push(erstelleLernkarte(karte, richtung))
    }
  }

  return { alleKarten, lernkarten }
}


// ------------------------------------------------------------
// 8. Richtungswechsel verarbeiten
// ------------------------------------------------------------

/**
 * Wird aufgerufen wenn der Nutzer die Lernrichtung ändert.
 * Legt fehlende FSRS-Profile an — bestehende bleiben erhalten.
 *
 * @param {string} vorher - alte Richtungseinstellung
 * @param {string} nachher - neue Richtungseinstellung
 * @param {string[]} aktiveListen - aktive Listen
 */
export async function verarbeiteRichtungswechsel(vorher, nachher, aktiveListen) {
  if (vorher === nachher) return

  // Alle Karten + Profile laden
  const [listenKarten, eigeneKarten, alleProfile] = await Promise.all([
    ladeAktiveListen(aktiveListen),
    ladeEigeneVokabeln(),
    ladeFortschritt()
  ])

  const alleKarten = [
    ...listenKarten.map(k => haengeProfileAn(k, alleProfile)),
    ...eigeneKarten.map(k => haengeProfileAn(k, alleProfile))
  ]

  // Für jede Karte prüfen ob neue Profile angelegt werden müssen
  const schreibVorgaenge = []

  for (const karte of alleKarten) {
    const { neuAnlegen } = handleRichtungswechsel(vorher, nachher, {
      en_de:       karte.profil_en_de,
      de_en:       karte.profil_de_en,
      abwechselnd: karte.profil_abwechselnd
    })

    for (const { richtung, profil } of neuAnlegen) {
      schreibVorgaenge.push(speichereFortschritt(karte.id, richtung, profil))
    }
  }

  // Alle parallel schreiben
  await Promise.all(schreibVorgaenge)
  console.log(`✅ Richtungswechsel ${vorher} → ${nachher}: ${schreibVorgaenge.length} neue Profile angelegt`)
}
