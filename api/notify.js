import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

// Firebase Admin initialisieren
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

export default async function handler(req, res) {
  // Sicherheit: nur GET erlauben
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const jetzt = Date.now()

    // Alle Vokabeln laden
    const vokabelnSnap = await db.collection('vokabeln').get()
    const faelligeVokabeln = vokabelnSnap.docs.filter(doc => {
      const data = doc.data()
      return !data.naechsteFaelligkeit || data.naechsteFaelligkeit <= jetzt
    })

    if (faelligeVokabeln.length === 0) {
      return res.status(200).json({ message: 'Keine fälligen Vokabeln' })
    }

    // Alle FCM Tokens laden
    const tokensSnap = await db.collection('fcmTokens').get()
    if (tokensSnap.empty) {
      return res.status(200).json({ message: 'Keine Tokens vorhanden' })
    }

    const tokens = tokensSnap.docs.map(doc => doc.data().token).filter(Boolean)
    const anzahl = faelligeVokabeln.length
    const beispiel = faelligeVokabeln[0].data()

    // Notification senden
    const ergebnisse = await Promise.allSettled(
      tokens.map(token =>
        messaging.send({
          token,
          notification: {
            title: `🚀 VokaOrbit — ${anzahl} Vokabel${anzahl > 1 ? 'n' : ''} fällig!`,
            body: `Z.B. "${beispiel.wort}" — Jetzt lernen!`,
          },
          webpush: {
            fcmOptions: { link: '/' },
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
    const fehlgeschlagen = ergebnisse.filter(r => r.status === 'rejected').length

    return res.status(200).json({
      message: `${erfolgreich} Notifications gesendet, ${fehlgeschlagen} fehlgeschlagen`,
      faellig: anzahl,
    })
  } catch (err) {
    console.error('Notify Fehler:', err)
    return res.status(500).json({ error: err.message })
  }
}