import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { DEVICE_ID } from './einstellungen'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const messaging = getMessaging(app)
export { collection, addDoc, getDocs, getToken, onMessage }

/**
 * Notifications aktivieren + FCM Token in Firestore speichern.
 * Nutzt DEVICE_ID als Dokument-Key → kein Duplikat möglich.
 */
export async function aktiviereNotifications() {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    })

    // setDoc mit DEVICE_ID als Key → überschreibt bei erneutem Aufruf
    await setDoc(doc(db, 'fcmTokens', DEVICE_ID), {
      token,
      deviceId: DEVICE_ID,
      geaendert: Date.now()
    })

    return token
  } catch (err) {
    console.error('Notification Fehler:', err)
    return null
  }
}
