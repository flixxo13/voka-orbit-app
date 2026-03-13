// ============================================================
// VokaOrbit — src/core/storage.js
// Firestore-Abstraktionsschicht: Alle DB-Aufrufe zentral.
// UI-Komponenten und Hooks greifen NUR über diese Datei auf Firestore zu.
// ============================================================

import { db } from '../firebase'
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore'
import { DEVICE_ID } from '../einstellungen'
import { erstelleStartProfil, waehleRichtung, handleRichtungswechsel } from './fsrs'
import { ladeAktiveListen } from './listen'


// ------------------------------------------------------------
// 1. Fortschritt laden
// ------------------------------------------------------------

async function ladeFortschritt() {
  try {
    const q = query(collection(db, 'fortschritt'), where('deviceId', '==', DEVICE_ID))
    const snap = await getDocs(q)
    const profile = {}
    snap.docs.forEach(d => {
      const daten = d.data()
      profile[`${daten.vokabelId}_${daten.richtung}`] = {
        intervall:           daten.intervall ?? 0,
        wiederholungen:      daten.wiederholungen ?? 0,
        stabilitaet:         daten.stabilitaet ?? 1,
        naechsteFaelligkeit: daten.naechsteFaelligkeit ?? Date.now(),
        letzteWiederholung:  daten.letzteWiederholung ?? null,
        firestoreId:         d.id
      }
    })
    return profile
  } catch (err) {
    console.error('Fehler beim Laden des Fortschritts:', err)
    return {}
  }
}


// ------------------------------------------------------------
// 2. Fortschritt speichern
// ------------------------------------------------------------

export async function speichereFortschritt(vokabelId, richtung, profilDaten, meta = {}) {
  const docId = `${DEVICE_ID}_${vokabelId}_${richtung}`
  await setDoc(doc(db, 'fortschritt', docId), {
    deviceId: DEVICE_ID, vokabelId, richtung,
    wort: meta.wort ?? '', uebersetzung: meta.uebersetzung ?? '',
    ...profilDaten
  })
}


// ------------------------------------------------------------
// 3. Alle Karten laden (Listen + Fortschritt zusammenführen)
// ------------------------------------------------------------

function haengeProfileAn(karte, alleProfile) {
  return {
    ...karte,
    profil_en_de:       alleProfile[`${karte.id}_en_de`]       ?? null,
    profil_de_en:       alleProfile[`${karte.id}_de_en`]       ?? null,
    profil_abwechselnd: alleProfile[`${karte.id}_abwechselnd`] ?? null,
  }
}

function erstelleLernkarte(karte, richtung) {
  const aktivProfil = richtung === 'en_de'
    ? (karte.profil_en_de ?? erstelleStartProfil())
    : (karte.profil_de_en ?? erstelleStartProfil())
  return {
    ...karte, richtung,
    vorderseite: richtung === 'en_de' ? karte.wort         : karte.uebersetzung,
    rueckseite:  richtung === 'en_de' ? karte.uebersetzung : karte.wort,
    aktivProfil
  }
}

export async function ladeAlleKarten(aktiveListen = [], lernrichtung = 'smart') {
  const [listenKarten, alleProfile] = await Promise.all([
    ladeAktiveListen(aktiveListen),
    ladeFortschritt()
  ])
  const alleKarten = listenKarten.map(k => haengeProfileAn(k, alleProfile))
  const lernkarten = []

  if (lernrichtung === 'abwechselnd') {
    for (const karte of alleKarten) {
      lernkarten.push({
        ...karte, richtung: 'abwechselnd',
        vorderseite: karte.wort, rueckseite: karte.uebersetzung,
        aktivProfil: karte.profil_abwechselnd ?? erstelleStartProfil()
      })
    }
  } else if (lernrichtung === 'en_de') {
    for (const karte of alleKarten) lernkarten.push(erstelleLernkarte(karte, 'en_de'))
  } else if (lernrichtung === 'de_en') {
    for (const karte of alleKarten) lernkarten.push(erstelleLernkarte(karte, 'de_en'))
  } else {
    // smart / beide
    for (const karte of alleKarten) {
      const richtung = waehleRichtung(
        { en_de: karte.profil_en_de, de_en: karte.profil_de_en }, lernrichtung
      )
      lernkarten.push(erstelleLernkarte(karte, richtung))
    }
  }

  return { alleKarten, lernkarten }
}


// ------------------------------------------------------------
// 4. Richtungswechsel verarbeiten
// ------------------------------------------------------------

export async function verarbeiteRichtungswechsel(vorher, nachher, aktiveListen) {
  if (vorher === nachher) return
  const [listenKarten, alleProfile] = await Promise.all([
    ladeAktiveListen(aktiveListen),
    ladeFortschritt()
  ])
  const alleKarten = listenKarten.map(k => haengeProfileAn(k, alleProfile))
  const schreibVorgaenge = []
  for (const karte of alleKarten) {
    const { neuAnlegen } = handleRichtungswechsel(vorher, nachher, {
      en_de: karte.profil_en_de, de_en: karte.profil_de_en, abwechselnd: karte.profil_abwechselnd
    })
    for (const { richtung, profil } of neuAnlegen) {
      schreibVorgaenge.push(speichereFortschritt(karte.id, richtung, profil))
    }
  }
  await Promise.all(schreibVorgaenge)
}
