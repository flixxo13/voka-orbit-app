importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyC0ZxizXiK3WuUCxRTSZvkKmji7AxZQ4oM",
  authDomain: "vokaorbit.firebaseapp.com",
  projectId: "vokaorbit",
  storageBucket: "vokaorbit.firebasestorage.app",
  messagingSenderId: "135885246717",
  appId: "1:135885246717:web:491e2c3554e28164f8ee94"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: '/' }
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})