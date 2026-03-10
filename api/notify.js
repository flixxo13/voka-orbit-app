// ============================================================
// VokaOrbit — api/notify.js
// ============================================================

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore }                  from 'firebase-admin/firestore'
import { getMessaging }                  from 'firebase-admin/messaging'

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

const LISTEN_GROESSEN = {
  en_a1: 380,
  en_a2: 382,
  en_b1: 398,
  en_b2: 259,
  en_c1: 238,
}

const DEFAULT_NOTIF_TYPEN = {
  wiederholungen: { aktiv: true,  zeiten: [8, 12, 18] },
  neueKarten:     { aktiv: true,  zeiten: [8] },
  streak:         { aktiv: true,  zeiten: [20] },
  rueckblick:     { aktiv: false, zeiten: [21] },
}

function istJetztZeit(zeiten, stunde) {
  return (zeiten ?? []).includes(stunde)
}

function waehleVokabel(faellige, modus) {
  if (!faellige.length) return null
  if (modus === 'ueberfaelligste') {
    return faellige.sort((a, b) => (a.naechsteFaelligkeit ?? 0) - (b.naechsteFaelligkeit ?? 0))[0]
  }
  if (modus === 'zufaellig') {
    return faellige[Math.floor(Math.random() * faellige.length)]
  }
  return faellige.sort((a, b) => (a.stabilitaet ?? 99) - (b.stabilitaet ?? 99))[0]
}

async function sendeNotification(token, deviceId, { titel, body, vokabelId, richtung }) {
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
        actions: [{ action: 'lernen', title: '▶️ Jetzt lernen' }],
        tag:     `vokaorbit-${deviceId}-${vokabelId ?? 'general'}`,
        body,
      },
    },
  })
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const testModus   = req.query.test === '1'
    const jetzt       = Date.now()
    const jetztDatum  = new Date()
    const stunde      = jetztDatum.getHours()
    const minute      = jetztDatum.getMinutes()
    const heuteDatum  = jetztDatum.toISOString().split('T')[0]

    if (!testModus && minute >= 15) {
      return res.status(200).json({
        message: `Zu spät in der Stunde (${stunde}:${minute}) — nächste Chance :00`,
        gesendet: 0,
      })
    }

    const tokensSnap = await db.collection('fcmTokens').get()
    if (tokensSnap.empty) {
      return res.status(200).json({ message: 'Keine registrierten Geräte', gesendet: 0 })
    }

    const fortschrittSnap       = await db.collection('fortschritt').get()
    const alleEinstellungenSnap = await db.collection('einstellungen').get()

    const einstellungenMap = {}
    alleEinstellungenSnap.docs.forEach(d => { einstellungenMap[d.id] = d.data() })

    const fortschrittProGerät = {}
    fortschrittSnap.docs.forEach(d => {
      const data = d.data()
      if (!data.deviceId) return
      if (!fortschrittProGerät[data.deviceId]) fortschrittProGerät[data.deviceId] = []
      fortschrittProGerät[data.deviceId].push(data)
    })

    const ergebnisse = []

    for (const tokenDoc of tokensSnap.docs) {
      const { token, deviceId } = tokenDoc.data()
      if (!token || !deviceId) continue

      const einst           = einstellungenMap[deviceId] ?? {}
      const notifTypen      = { ...DEFAULT_NOTIF_TYPEN, ...(einst.notifTypen ?? {}) }
      const vokabelModus    = einst.vokabelModus     ?? 'schwerste'
      const neueKartenLimit = einst.neueKartenProTag ?? 10
      const aktiveListen    = einst.aktiveListen     ?? ['en_a1']

      const geraetFortschritt = fortschrittProGerät[deviceId] ?? []

      const faellige = geraetFortschritt.filter(f =>
        f.naechsteFaelligkeit && f.naechsteFaelligkeit <= jetzt && f.wiederholungen > 0
      )

      const heuteGelernt = geraetFortschritt.filter(f => {
        if (!f.letzteWiederholung) return false
        return new Date(f.letzteWiederholung).toISOString().split('T')[0] === heuteDatum
      })

      const gesamtListenGroesse = aktiveListen.reduce((sum, id) => sum + (LISTEN_GROESSEN[id] ?? 0), 0)
      const kartenMitProfil     = new Set(geraetFortschritt.map(f => f.vokabelId)).size
      const verbleibendeNeu     = Math.max(0, gesamtListenGroesse - kartenMitProfil)
      const heuteNeuGelernt     = heuteGelernt.filter(f => f.wiederholungen === 1).length
      const neuVerfuegbar       = heuteNeuGelernt < neueKartenLimit && verbleibendeNeu > 0
      const neuRestHeute        = neueKartenLimit - heuteNeuGelernt
      const heuteGelerntIrgendwas = heuteGelernt.length > 0

      let gesendet     = false
      let sendErgebnis = null

      // Typ 1: Fällige Wiederholungen
      const typ1 = notifTypen.wiederholungen
      if (!gesendet && typ1.aktiv && (testModus || istJetztZeit(typ1.zeiten, stunde)) && faellige.length > 0) {
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
      if (!gesendet && typ2.aktiv && (testModus || istJetztZeit(typ2.zeiten, stunde)) && neuVerfuegbar) {
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

      // Typ 3: Streak-Erinnerung
      const typ3 = notifTypen.streak
      if (!gesendet && typ3.aktiv && (testModus || istJetztZeit(typ3.zeiten, stunde)) && !heuteGelerntIrgendwas) {
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
      if (!gesendet && typ4.aktiv && (testModus || istJetztZeit(typ4.zeiten, stunde))) {
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
      message:  `${ergebnisse.length} Notifications gesendet`,
      stunde:   `${stunde}:${String(minute).padStart(2, '0')}`,
      testModus,
      gesendet: ergebnisse.length,
      details:  ergebnisse,
    })

  } catch (err) {
    console.error('notify.js Fehler:', err)
    return res.status(500).json({ error: err.message })
  }
}
