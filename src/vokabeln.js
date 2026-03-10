// ============================================================
// VokaOrbit — vokabeln.js
// ============================================================

import { db } from './firebase'
import {
  collection, getDocs, doc, setDoc, deleteDoc,
  addDoc, query, where, writeBatch
} from 'firebase/firestore'
import { DEVICE_ID } from './einstellungen'
import { erstelleStartProfil, handleRichtungswechsel, waehleRichtung } from './fsrs'


// ------------------------------------------------------------
// 1. Listen-Karten aus JSON laden
// ------------------------------------------------------------

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

async function ladeAktiveListen(aktiveListen = []) {
  const offizielle = aktiveListen.filter(id => !id.startsWith('eigen_list_'))
  const eigene     = aktiveListen.filter(id => id.startsWith('eigen_list_'))

  const [offizielleKarten, eigeneKarten] = await Promise.all([
    Promise.all(offizielle.map(ladeListeAusJSON)).then(r => r.flat()),
    eigene.length > 0 ? ladeVokabelnFuerListen(eigene) : Promise.resolve([])
  ])

  return [...offizielleKarten, ...eigeneKarten]
}


// ------------------------------------------------------------
// 2. Eigene Listen
// ------------------------------------------------------------

export async function ladeEigeneListen() {
  try {
    const q = query(collection(db, 'eigeneListen'), where('deviceId', '==', DEVICE_ID))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: d.id,
      listenId: `eigen_list_${d.id}`,
      ...d.data()
    })).sort((a, b) => (a.erstellt ?? 0) - (b.erstellt ?? 0))
  } catch (err) {
    console.error('Fehler beim Laden eigener Listen:', err)
    return []
  }
}

export async function listeErstellen(titel) {
  const docRef = await addDoc(collection(db, 'eigeneListen'), {
    deviceId:      DEVICE_ID,
    titel:         titel.trim(),
    vokabelAnzahl: 0,
    erstellt:      Date.now()
  })
  return `eigen_list_${docRef.id}`
}

export async function listeLoeschen(firestoreListenId) {
  const batch = writeBatch(db)
  const vokQ = query(
    collection(db, 'eigeneVokabeln'),
    where('listenId', '==', firestoreListenId),
    where('deviceId', '==', DEVICE_ID)
  )
  const vokSnap = await getDocs(vokQ)
  vokSnap.docs.forEach(d => batch.delete(d.ref))
  batch.delete(doc(db, 'eigeneListen', firestoreListenId))
  await batch.commit()
}

export async function ladeVokabelnFuerListe(firestoreListenId) {
  try {
    const q = query(
      collection(db, 'eigeneVokabeln'),
      where('listenId', '==', firestoreListenId),
      where('deviceId', '==', DEVICE_ID)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })).sort((a, b) => (a.erstellt ?? 0) - (b.erstellt ?? 0))
  } catch (err) {
    console.error('Fehler beim Laden der Vokabeln:', err)
    return []
  }
}

async function ladeVokabelnFuerListen(listenIds) {
  const alle = await Promise.all(
    listenIds.map(async listenId => {
      const firestoreId = listenId.replace('eigen_list_', '')
      const vokabeln = await ladeVokabelnFuerListe(firestoreId)
      return vokabeln.map((v, index) => ({
        id: `${listenId}_${String(index).padStart(3, '0')}`,
        typ: 'eigen',
        wort: v.vorderseite,
        uebersetzung: v.rueckseite,
        listenId,
      }))
    })
  )
  return alle.flat()
}

export async function vokabelZuListeHinzufuegen(firestoreListenId, vorderseite, rueckseite) {
  const docRef = await addDoc(collection(db, 'eigeneVokabeln'), {
    deviceId:    DEVICE_ID,
    listenId:    firestoreListenId,
    vorderseite: vorderseite.trim(),
    rueckseite:  rueckseite.trim(),
    erstellt:    Date.now()
  })
  getDocs(query(
    collection(db, 'eigeneVokabeln'),
    where('listenId', '==', firestoreListenId),
    where('deviceId', '==', DEVICE_ID)
  )).then(snap => {
    setDoc(doc(db, 'eigeneListen', firestoreListenId), { vokabelAnzahl: snap.size }, { merge: true })
  })
  return docRef.id
}

export async function vokabelAusListeLoeschen(vokabelFirestoreId, firestoreListenId) {
  await deleteDoc(doc(db, 'eigeneVokabeln', vokabelFirestoreId))
  getDocs(query(
    collection(db, 'eigeneVokabeln'),
    where('listenId', '==', firestoreListenId),
    where('deviceId', '==', DEVICE_ID)
  )).then(snap => {
    setDoc(doc(db, 'eigeneListen', firestoreListenId), { vokabelAnzahl: snap.size }, { merge: true })
  })
}

export async function migriereLegacyVokabeln() {
  try {
    const q = query(collection(db, 'eigeneVokabeln'), where('deviceId', '==', DEVICE_ID))
    const snap = await getDocs(q)
    const legacy = snap.docs.filter(d => !d.data().listenId)
    if (legacy.length === 0) return
    const listenRef = await addDoc(collection(db, 'eigeneListen'), {
      deviceId:      DEVICE_ID,
      titel:         'Meine Vokabeln',
      vokabelAnzahl: legacy.length,
      erstellt:      Date.now() - 1,
      migriert:      true
    })
    const batch = writeBatch(db)
    legacy.forEach(d => batch.update(d.ref, { listenId: listenRef.id }))
    await batch.commit()
    console.log(`Migration: ${legacy.length} Vokabeln -> Meine Vokabeln`)
  } catch (err) {
    console.error('Migrationsfehler:', err)
  }
}

// Abwaertskompatibilitaet
export async function ladeEigeneVokabeln() {
  try {
    const q = query(collection(db, 'eigeneVokabeln'), where('deviceId', '==', DEVICE_ID))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: `eigen_${d.id}`, firestoreId: d.id, typ: 'eigen',
      wort: d.data().vorderseite, uebersetzung: d.data().rueckseite, erstellt: d.data().erstellt
    }))
  } catch { return [] }
}

export async function vokabelHinzufuegen(vorderseite, rueckseite) {
  const docRef = await addDoc(collection(db, 'eigeneVokabeln'), {
    deviceId: DEVICE_ID, vorderseite: vorderseite.trim(),
    rueckseite: rueckseite.trim(), erstellt: Date.now()
  })
  return `eigen_${docRef.id}`
}

export async function vokabelLoeschen(vokabelId) {
  await deleteDoc(doc(db, 'eigeneVokabeln', vokabelId.replace('eigen_', '')))
}


// ------------------------------------------------------------
// 3. Fortschritt
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

export async function speichereFortschritt(vokabelId, richtung, profilDaten, meta = {}) {
  const docId = `${DEVICE_ID}_${vokabelId}_${richtung}`
  await setDoc(doc(db, 'fortschritt', docId), {
    deviceId: DEVICE_ID, vokabelId, richtung,
    wort: meta.wort ?? '', uebersetzung: meta.uebersetzung ?? '',
    ...profilDaten
  })
}


// ------------------------------------------------------------
// 4. Lernkarten
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
    for (const karte of alleKarten) {
      const richtung = waehleRichtung(
        { en_de: karte.profil_en_de, de_en: karte.profil_de_en }, lernrichtung
      )
      lernkarten.push(erstelleLernkarte(karte, richtung))
    }
  }
  return { alleKarten, lernkarten }
}

export async function verarbeiteRichtungswechsel(vorher, nachher, aktiveListen) {
  if (vorher === nachher) return
  const [listenKarten, alleProfile] = await Promise.all([
    ladeAktiveListen(aktiveListen), ladeFortschritt()
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
