import { useState, useEffect } from 'react'
import { db, collection, addDoc, getDocs } from './firebase'

export default function App() {
  const [vokabeln, setVokabeln] = useState([])
  const [status, setStatus] = useState('Verbinde...')

  useEffect(() => {
    ladeVokabeln()
  }, [])

  async function ladeVokabeln() {
    try {
      const snapshot = await getDocs(collection(db, 'vokabeln'))
      const liste = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setVokabeln(liste)
      setStatus('✅ Firebase verbunden!')
    } catch (err) {
      setStatus('❌ Fehler: ' + err.message)
    }
  }

  async function testeEintrag() {
    try {
      await addDoc(collection(db, 'vokabeln'), {
        wort: 'Hallo',
        uebersetzung: 'Hello',
        erstellt: new Date().toISOString()
      })
      setStatus('✅ Testvokabel gespeichert!')
      ladeVokabeln()
    } catch (err) {
      setStatus('❌ Fehler: ' + err.message)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🚀 VokaOrbit</h1>
      <p style={{ margin: '1rem 0', color: '#666' }}>{status}</p>
      <button
        onClick={testeEintrag}
        style={{
          background: '#5c35d4',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}>
        Testvokabel speichern
      </button>
      <ul style={{ marginTop: '2rem' }}>
        {vokabeln.map(v => (
          <li key={v.id} style={{ padding: '0.5rem 0' }}>
            <strong>{v.wort}</strong> → {v.uebersetzung}
          </li>
        ))}
      </ul>
    </div>
  )
}