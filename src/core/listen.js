// ============================================================
// VokaOrbit — src/core/listen.js
// Listenverwaltung: JSON-Listen laden + eigene Listen (Firestore).
// Kein React. Einzige Abhängigkeit: firebase + einstellungen (DEVICE_ID).
// ============================================================

import { db } from '../firebase'
import {
  collection, getDocs, doc, setDoc, deleteDoc,
  addDoc, query, where, writeBatch
} from 'firebase/firestore'
import { DEVICE_ID } from '../einstellungen'


// ------------------------------------------------------------
// 1. Offizielle Listen aus JSON laden
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

export async function ladeAktiveListen(aktiveListen = []) {
  const offizielle = aktiveListen.filter(id => !id.startsWith('eigen_list_'))
  const eigene     = aktiveListen.filter(id => id.startsWith('eigen_list_'))

  const [offizielleKarten, eigeneKarten] = await Promise.all([
    Promise.all(offizielle.map(ladeListeAusJSON)).then(r => r.flat()),
    eigene.length > 0 ? ladeVokabelnFuerListen(eigene) : Promise.resolve([])
  ])

  return [...offizielleKarten, ...eigeneKarten]
}


// ------------------------------------------------------------
// 2. Eigene Listen (Firestore)
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
  // Vokabelanzahl in der Liste aktualisieren
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
    console.log(`Migration: ${legacy.length} Vokabeln → Meine Vokabeln`)
  } catch (err) {
    console.error('Migrationsfehler:', err)
  }
}


// ------------------------------------------------------------
// 3. Legacy-Kompatibilität (Abwärtskompatibel)
// ------------------------------------------------------------

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
