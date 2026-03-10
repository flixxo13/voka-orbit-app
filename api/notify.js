// ============================================================
// VokaOrbit — api/notify.js
// ============================================================
//
// Vercel Serverless Function — aufgerufen von cron-job.org
// alle 15 Minuten: https://voka-orbit-app.vercel.app/api/notify
//
// Firestore-Struktur (v2):
//   fcmTokens/{deviceId}       → token, deviceId
//   einstellungen/{deviceId}   → notifTypen, vokabelModus, neueKartenProTag...
//   fortschritt/{docId}        → deviceId, vokabelId, richtung, wort,
//                                uebersetzung, naechsteFaelligkeit, wiederholungen...
//
// Notification-Typen:
//   wiederholungen  → fällige Karten anzeigen (Wort + Übersetzung)
//   neueKarten      → Erinnerung wenn Tageslimit noch nicht erreicht
//   streak          → heute noch nicht gelernt
//   rueckblick      → Tagesrückblick abends
//
// Zeitlogik: Cron alle 15 min → sendet nur wenn Stunde in notifTypen.zeiten
//            UND Minute < 15 (erste Viertelstunde jeder Stunde)
// ============================================================

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore }                  from 'firebase-admin/firestore'
import { getMessaging }                  from 'firebase-admin/messaging'

// Firebase Admin einmalig initialisieren
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db        = getFirestore()
const messaging = getMessaging()

// ─── Listengrößen für "Neue Karten" Logik ──────────────────
// Server kann keine JSON-Dateien aus public/ laden →
// bekannte Größen als Konstante (muss bei neuen Listen ergänzt werden)
const LISTEN_GROESSEN = {
  en_a1: 380,
  en_a2: 382,
  en_b1: 398,
  en_b2: 259,
  en_c1: 238,
}

// ─── Default-Einstellungen (falls Gerät noch keine hat) ────
const DEFAULT_NOTIF_TYPEN = {
  wiederholungen: { aktiv: true,  zeiten: [8, 12, 18] },
  neueKarten:     { aktiv: true,  zeiten: [8] },
  streak:         { aktiv: true,  zeiten: [20] },
  rueckblick:     { aktiv: false, zeiten: [21] },
}

// ─── Hilfsfunktionen ───────────────────────────────────────

/** Prüft ob jetzt (Stunde) eine aktive Notification-Zeit ist */
function istJetztZeit(zeiten, stunde) {
  return (zeiten ?? []).includes(stunde)
}

/** Wählt die angezeigte Vokabel nach Modus */
function waehleVokabel(faellige, modus) {
  if (!faellige.length) return null

  if (modus === 'ueberfaelligste') {
    return faellige.sort((a, b) =>
      (a.naechsteFaelligkeit ?? 0) - (b.naechsteFaelligkeit ?? 0)
    )[0]
  }
  if (modus === 'zufaellig') {
    return faellige[Math.floor(Math.random() * faellige.length)]
  }
  // 'schwerste' (default): niedrigste Stabilität
  return faellige.sort((a, b) =>
    (a.stabilitaet ?? 99) - (b.stabilitaet ?? 99)
  )[0]
}

/** FCM Notification senden */
async function sendeNotification(token, deviceId, { titel, body, vokabelId, richtung }) {
  // Deep Link URL — öffnet App direkt bei der Vokabel
  const deepLink = vokabelId
    ? `https://voka-orbit-app.vercel.app/?vokabel=${vokabelId}&richtung=${richtung ?? 'en_de'}`
    : 'https://voka-orbit-app.vercel.app/'

  return messaging.send({
    token,
    notification: { title: titel, body },
    webpush: {
      fcmOptions: { link: deepLink },
      notification: {
        icon:    '/icon-192.png',
        badge:   '/icon-192.png',
        vibrate: [200, 100, 200],
        // Actions — "Jetzt lernen" Button
        actions: [
          { action: 'lernen', title: '▶️ Jetzt lernen' },
        ],
        // Tag verhindert mehrfache gleichzeitige Notifications desselben Typs
        tag: `vokaorbit-${deviceId}-${vokabelId ?? 'general'}`,
        // Body ist die Übersetzung — beim Aufziehen sichtbar
        body,
      },
    },
  })
}


// ─── Haupt-Handler ─────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const jetzt       = Date.now()
    const jetztDatum  = new Date()
    const stunde      = jetztDatum.getHours()
    const minute      = jetztDatum.getMinutes()
    const heuteDatum  = jetztDatum.toISOString().split('T')[0] // "2026-03-09"

    // Nur in der ersten Viertelstunde jeder Stunde senden
    // (Cron läuft alle 15 min → verhindert Doppelversand)
    if (minute >= 15) {
      return res.status(200).json({
        message: `Zu spät in der Stunde (${stunde}:${minute}) — nächste Chance :00`,
        gesendet: 0,
      })
    }

    // ── 1. Alle Geräte laden ──────────────────────────────
    const tokensSnap = await db.collection('fcmTokens').get()
    if (tokensSnap.empty) {
      return res.status(200).json({ message: 'Keine registrierten Geräte', gesendet: 0 })
    }

    // ── 2. Alle Fortschrittsdaten laden (einmal für alle) ─
    const fortschrittSnap = await db.collection('fortschritt').get()
    const alleEinstellungenSnap = await db.collection('einstellungen').get()

    // In Maps umwandeln für schnellen Zugriff
    const einstellungenMap = {}
    alleEinstellungenSnap.docs.forEach(d => {
      einstellungenMap[d.id] = d.data()
    })

    // Fortschritt pro Gerät gruppieren
    const fortschrittProGerät = {}
    fortschrittSnap.docs.forEach(d => {
      const data = d.data()
      if (!data.deviceId) return
      if (!fortschrittProGerät[data.deviceId]) {
        fortschrittProGerät[data.deviceId] = []
      }
      fortschrittProGerät[data.deviceId].push(data)
    })

    // ── 3. Pro Gerät Notifications senden ─────────────────
    const ergebnisse = []

    for (const tokenDoc of tokensSnap.docs) {
      const { token, deviceId } = tokenDoc.data()
      if (!token || !deviceId) continue

      const einst = einstellungenMap[deviceId] ?? {}
      const notifTypen = {
        ...DEFAULT_NOTIF_TYPEN,
        ...(einst.notifTypen ?? {}),
      }
      const vokabelModus    = einst.vokabelModus    ?? 'schwerste'
      const neueKartenLimit = einst.neueKartenProTag ?? 10
      const aktiveListen    = einst.aktiveListen    ?? ['en_a1']

      const geraetFortschritt = fortschrittProGerät[deviceId] ?? []

      // Fällige Wiederholungen dieses Geräts
      const faellige = geraetFortschritt.filter(f =>
        f.naechsteFaelligkeit && f.naechsteFaelligkeit <= jetzt && f.wiederholungen > 0
      )

      // Heute gelernte Karten (letzteWiederholung heute)
      const heuteGelernt = geraetFortschritt.filter(f => {
        if (!f.letzteWiederholung) return false
        const d = new Date(f.letzteWiederholung).toISOString().split('T')[0]
        return d === heuteDatum
      })

      // Neue Karten heute (kein Profil → zählen die bekannten ohne Profil)
      // Server-Approximation: Gesamtgröße der aktiven Listen - Karten mit Profil
      const gesamtListenGroesse = aktiveListen.reduce((sum, id) =>
        sum + (LISTEN_GROESSEN[id] ?? 0), 0
      )
      const kartenMitProfil = new Set(
        geraetFortschritt.map(f => f.vokabelId)
      ).size
      const verbleibendeNeu = Math.max(0, gesamtListenGroesse - kartenMitProfil)

      // Neue Karten heute schon gesehen (localStorage nicht verfügbar auf Server)
      // Approximation: heuteGelernt mit wiederholungen === 1 sind "neue" Karten
      const heuteNeuGelernt = heuteGelernt.filter(f => f.wiederholungen === 1).length
      const neuVerfuegbar   = heuteNeuGelernt < neueKartenLimit && verbleibendeNeu > 0
      const neuRestHeute    = neueKartenLimit - heuteNeuGelernt

      // Heute überhaupt gelernt?
      const heuteGelerntIrgendwas = heuteGelernt.length > 0

      // ── Notification-Typ auswählen + senden ─────────────
      let gesendet = false
      let sendErgebnis = null

      // Typ 1: Fällige Wiederholungen
      const typ1 = notifTypen.wiederholungen
      if (!gesendet && typ1.aktiv && istJetztZeit(typ1.zeiten, stunde) && faellige.length > 0) {
        const vokabel = waehleVokabel(faellige, vokabelModus)
        try {
          await sendeNotification(token, deviceId, {
            titel: `🔄 ${faellige.length} Vokabel${faellige.length > 1 ? 'n' : ''} fällig`,
            body:  `${vokabel.wort} = ${vokabel.uebersetzung}`,
            vokabelId: vokabel.vokabelId,
            richtung:  vokabel.richtung,
          })
          sendErgebnis = { typ: 'wiederholungen', vokabel: vokabel.wort, anzahl: faellige.length }
          gesendet = true
        } catch (err) {
          console.error(`Token ${deviceId} ungültig:`, err.message)
        }
      }

      // Typ 2: Neue Karten verfügbar
      const typ2 = notifTypen.neueKarten
      if (!gesendet && typ2.aktiv && istJetztZeit(typ2.zeiten, stunde) && neuVerfuegbar) {
        try {
          await sendeNotification(token, deviceId, {
            titel: `✨ Noch ${neuRestHeute} neue Karten heute`,
            body:  `Du hast heute noch ${neuRestHeute} von ${neueKartenLimit} neuen Karten übrig`,
            vokabelId: null,
            richtung:  null,
          })
          sendErgebnis = { typ: 'neueKarten', restHeute: neuRestHeute }
          gesendet = true
        } catch (err) {
          console.error(`Token ${deviceId} ungültig:`, err.message)
        }
      }

      // Typ 3: Streak-Erinnerung (heute noch nicht gelernt)
      const typ3 = notifTypen.streak
      if (!gesendet && typ3.aktiv && istJetztZeit(typ3.zeiten, stunde) && !heuteGelerntIrgendwas) {
        try {
          await sendeNotification(token, deviceId, {
            titel: '🔥 Heute noch nicht gelernt!',
            body:  faellige.length > 0
              ? `${faellige.length} Karte${faellige.length > 1 ? 'n' : ''} warten auf dich`
              : 'Halte deinen Streak aufrecht!',
            vokabelId: null,
            richtung:  null,
          })
          sendErgebnis = { typ: 'streak', faellig: faellige.length }
          gesendet = true
        } catch (err) {
          console.error(`Token ${deviceId} ungültig:`, err.message)
        }
      }

      // Typ 4: Tagesrückblick
      const typ4 = notifTypen.rueckblick
      if (!gesendet && typ4.aktiv && istJetztZeit(typ4.zeiten, stunde)) {
        // Morgen fällig: Karten die innerhalb 24h fällig werden
        const morgenFaellig = geraetFortschritt.filter(f =>
          f.naechsteFaelligkeit &&
          f.naechsteFaelligkeit > jetzt &&
          f.naechsteFaelligkeit <= jetzt + 24 * 60 * 60 * 1000
        ).length
        try {
          await sendeNotification(token, deviceId, {
            titel: `🌙 Heute: ${heuteGelernt.length} Karten gelernt`,
            body:  morgenFaellig > 0
              ? `Morgen kommen ${morgenFaellig} Karten zur Wiederholung`
              : 'Gute Arbeit heute — mach weiter so!',
            vokabelId: null,
            richtung:  null,
          })
          sendErgebnis = { typ: 'rueckblick', heute: heuteGelernt.length, morgen: morgenFaellig }
          gesendet = true
        } catch (err) {
          console.error(`Token ${deviceId} ungültig:`, err.message)
        }
      }

      if (sendErgebnis) ergebnisse.push({ deviceId, ...sendErgebnis })
    }

    return res.status(200).json({
      message:   `${ergebnisse.length} Notifications gesendet`,
      stunde:    `${stunde}:${String(minute).padStart(2, '0')}`,
      gesendet:  ergebnisse.length,
      details:   ergebnisse,
    })

  } catch (err) {
    console.error('notify.js Fehler:', err)
    return res.status(500).json({ error: err.message })
  }
}
