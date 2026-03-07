import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()
const messaging = getMessaging()

function waehleVokabel(faellige, modus) {
  if (faellige.length === 0) return null
  if (modus === 'zufaellig') {
    return faellige[Math.floor(Math.random() * faellige.length)].data()
  }
  if (modus === 'schwerste') {
    return faellige.sort((a, b) =>
      (a.data().stabilitaet || 99) - (b.data().stabilitaet || 99)
    )[0].data()
  }
  if (modus === 'ueberfaelligste') {
    return faellige.sort((a, b) =>
      (a.data().naechsteFaelligkeit || 0) - (b.data().naechsteFaelligkeit || 0)
    )[0].data()
  }
  return faellige[0].data()
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const jetzt = Date.now()
    const jetztStunde = new Date().getHours()

    // Tokens laden
    const tokensSnap = await db.collection('fcmTokens').get()
    if (tokensSnap.empty) return res.status(200).json({ message: 'Keine Tokens' })

    // Einstellungen laden
    const einstSnap = await db.collection('einstellungen').get()

    // Vokabeln laden
    const vokabelnSnap = await db.collection('vokabeln').get()
    const faellige = vokabelnSnap.docs.filter(doc => {
      const d = doc.data()
      return !d.naechsteFaelligkeit || d.naechsteFaelligkeit <= jetzt
    })

    if (faellige.length === 0) return res.status(200).json({ message: 'Keine fälligen Vokabeln' })

    // Standard Einstellungen
    let einstellungen = {
      notifZeiten: [8, 12, 18],
      vokabelModus: 'schwerste',
    }

    if (!einstSnap.empty) {
      einstellungen = { ...einstellungen, ...einstSnap.docs[0].data() }
    }

    // Prüfen ob jetzt eine Notification Zeit ist (±14 Minuten)

    /* const istZeit = einstellungen.notifZeiten.some(z => Math.abs(z - jetztStunde) <= 0) */

const jetztMinute = new Date().getMinutes()
const istZeit = einstellungen.notifZeiten.some(z => 
  z === jetztStunde && jetztMinute < 15
)
    if (!istZeit) {
      return res.status(200).json({ message: `Nicht zur Notif-Zeit (jetzt: ${jetztStunde}:00)` })
    }

    const beispiel = waehleVokabel(faellige, einstellungen.vokabelModus)
    const anzahl = faellige.length
    const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean)
    const uniqueTokens = [...new Set(tokens)]

    const ergebnisse = await Promise.allSettled(
      uniqueTokens.map(token =>
        messaging.send({
          token,
          notification: {
            title: `🚀 VokaOrbit — ${anzahl} Vokabel${anzahl > 1 ? 'n' : ''} fällig!`,
            body: `${beispiel.wort} = ${beispiel.uebersetzung}`,
          },
          webpush: {
            fcmOptions: { link: 'https://voka-orbit-app.vercel.app' },
            notification: {
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              vibrate: [200, 100, 200],
            },
          },
        })
      )
    )

    const erfolgreich = ergebnisse.filter(r => r.status === 'fulfilled').length
    return res.status(200).json({
      message: `${erfolgreich} Notifications gesendet`,
      faellig: anzahl,
      vokabel: beispiel.wort,
      modus: einstellungen.vokabelModus,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}