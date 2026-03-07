import { useState, useEffect } from 'react'
import { db, collection, addDoc, getDocs, messaging, aktiviereNotifications, onMessage } from './firebase'
import { berechneNaechsteWiederholung, sindFaellig } from './fsrs'
import { doc, updateDoc } from 'firebase/firestore'
import EinstellungenTab from './EinstellungenTab'

const FARBEN = { 1: '#e74c3c', 2: '#e67e22', 3: '#2ecc71', 4: '#3498db' }

export default function App() {
  const [ansicht, setAnsicht] = useState('lernen')
  const [vokabeln, setVokabeln] = useState([])
  const [faellige, setFaellige] = useState([])
  const [aktuelleKarte, setAktuelleKarte] = useState(null)
  const [zeigeAntwort, setZeigeAntwort] = useState(false)
  const [neuesWort, setNeuesWort] = useState('')
  const [neueUebersetzung, setNeueUebersetzung] = useState('')
  const [status, setStatus] = useState('')
  const [notifStatus, setNotifStatus] = useState('')
  const [notifAktiv, setNotifAktiv] = useState(false)

  useEffect(() => {
    ladeVokabeln()
    if (Notification.permission === 'granted') setNotifAktiv(true)
    onMessage(messaging, (payload) => {
      setStatus('🔔 ' + payload.notification.title)
    })
  }, [])

  async function ladeVokabeln() {
    const snapshot = await getDocs(collection(db, 'vokabeln'))
    const liste = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setVokabeln(liste)
    const faelligeListe = sindFaellig(liste)
    setFaellige(faelligeListe)
    if (faelligeListe.length > 0) setAktuelleKarte(faelligeListe[0])
  }

  async function bewerteKarte(bewertung) {
    const updates = berechneNaechsteWiederholung(aktuelleKarte, bewertung)
    await updateDoc(doc(db, 'vokabeln', aktuelleKarte.id), updates)
    setZeigeAntwort(false)
    const naechste = faellige.filter(v => v.id !== aktuelleKarte.id)
    setFaellige(naechste)
    setAktuelleKarte(naechste.length > 0 ? naechste[0] : null)
  }

  async function vokabelHinzufuegen() {
    if (!neuesWort.trim() || !neueUebersetzung.trim()) return
    await addDoc(collection(db, 'vokabeln'), {
      wort: neuesWort.trim(),
      uebersetzung: neueUebersetzung.trim(),
      erstellt: Date.now(),
      intervall: 0,
      wiederholungen: 0,
      stabilitaet: 1,
      naechsteFaelligkeit: Date.now()
    })
    setNeuesWort('')
    setNeueUebersetzung('')
    setStatus('✅ Gespeichert!')
    setTimeout(() => setStatus(''), 2000)
    ladeVokabeln()
  }

  async function handleNotifAktivieren() {
    setNotifStatus('⏳ Wird aktiviert...')
    const token = await aktiviereNotifications()
    if (token) {
      setNotifAktiv(true)
      setNotifStatus('✅ Notifications aktiv!')
      setTimeout(async () => {
        const reg = await navigator.serviceWorker.ready
        reg.showNotification('🚀 VokaOrbit', {
          body: 'Super! Du wirst ab jetzt an fällige Vokabeln erinnert.',
          icon: '/icon-192.png',
          vibrate: [200, 100, 200]
        })
      }, 3000)
    } else {
      setNotifStatus('❌ Nicht erlaubt. Bitte in Browser-Einstellungen aktivieren.')
    }
    setTimeout(() => setNotifStatus(''), 4000)
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui', minHeight: '100vh', background: '#f0eeff' }}>

      {/* Header */}
      <div style={{ background: '#5c35d4', padding: '1.2rem', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🚀 VokaOrbit</h1>
        <p style={{ margin: '0.2rem 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
          {faellige.length} fällig · {vokabeln.length} gesamt
        </p>
      </div>

      {/* Notification Banner */}
      {!notifAktiv && (
        <div style={{
          background: '#fff3cd', padding: '0.9rem 1.2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #ffc107'
        }}>
          <span style={{ fontSize: '0.9rem', color: '#856404' }}>
            🔔 Aktiviere Erinnerungen!
          </span>
          <button onClick={handleNotifAktivieren} style={{
            background: '#ffc107', border: 'none', borderRadius: 6,
            padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 'bold',
            fontSize: '0.85rem'
          }}>
            Aktivieren
          </button>
        </div>
      )}
      {notifStatus && (
        <div style={{ background: '#e8f5e9', padding: '0.7rem 1.2rem', fontSize: '0.9rem', color: '#2e7d32' }}>
          {notifStatus}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '2px solid #eee' }}>
        {['lernen', 'hinzufuegen', 'einstellungen'].map(a => (
          <button key={a} onClick={() => setAnsicht(a)} style={{
            flex: 1, padding: '0.8rem', border: 'none', cursor: 'pointer',
            background: ansicht === a ? '#f0eeff' : 'white',
            color: ansicht === a ? '#5c35d4' : '#666',
            fontWeight: ansicht === a ? 'bold' : 'normal',
            borderBottom: ansicht === a ? '2px solid #5c35d4' : '2px solid transparent',
            fontSize: '0.85rem'
          }}>
            {a === 'lernen' ? '🧠 Lernen' : a === 'hinzufuegen' ? '➕ Neu' : '⚙️ Einst.'}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem' }}>

        {/* LERNEN */}
        {ansicht === 'lernen' && (
          <>
            {aktuelleKarte ? (
              <div>
                <div style={{
                  background: 'white', borderRadius: 16, padding: '2rem',
                  textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  minHeight: 200, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <p style={{ color: '#999', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    Was bedeutet...
                  </p>
                  <h2 style={{ fontSize: '2rem', color: '#5c35d4', margin: '0 0 1rem' }}>
                    {aktuelleKarte.wort}
                  </h2>
                  {zeigeAntwort ? (
                    <p style={{ fontSize: '1.4rem', color: '#333' }}>
                      {aktuelleKarte.uebersetzung}
                    </p>
                  ) : (
                    <button onClick={() => setZeigeAntwort(true)} style={{
                      background: '#5c35d4', color: 'white', border: 'none',
                      padding: '0.75rem 2rem', borderRadius: 8, fontSize: '1rem', cursor: 'pointer'
                    }}>
                      Antwort zeigen
                    </button>
                  )}
                </div>

                {zeigeAntwort && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ textAlign: 'center', color: '#666', marginBottom: '0.75rem' }}>
                      Wie gut wusstest du es?
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {[
                        { wert: 1, label: '😰 Nochmal' },
                        { wert: 2, label: '😕 Schwer' },
                        { wert: 3, label: '🙂 Gut' },
                        { wert: 4, label: '😄 Leicht' },
                      ].map(b => (
                        <button key={b.wert} onClick={() => bewerteKarte(b.wert)} style={{
                          padding: '0.85rem', border: 'none', borderRadius: 10,
                          background: FARBEN[b.wert], color: 'white',
                          fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'
                        }}>
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ fontSize: '3rem' }}>🎉</p>
                <h2 style={{ color: '#5c35d4' }}>Alles gelernt!</h2>
                <p style={{ color: '#666' }}>Keine fälligen Vokabeln.<br />Komm morgen wieder!</p>
              </div>
            )}
          </>
        )}

        {/* HINZUFÜGEN */}
        {ansicht === 'hinzufuegen' && (
          <div>
            <h2 style={{ color: '#5c35d4', marginBottom: '1.5rem' }}>Neue Vokabel</h2>
            <input value={neuesWort} onChange={e => setNeuesWort(e.target.value)}
              placeholder="Wort (z.B. apple)" style={inputStyle} />
            <input value={neueUebersetzung} onChange={e => setNeueUebersetzung(e.target.value)}
              placeholder="Übersetzung (z.B. Apfel)" style={{ ...inputStyle, marginTop: '0.75rem' }} />
            <button onClick={vokabelHinzufuegen} style={{
              width: '100%', marginTop: '1rem', padding: '0.9rem',
              background: '#5c35d4', color: 'white', border: 'none',
              borderRadius: 10, fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'
            }}>
              ➕ Vokabel speichern
            </button>
            {status && <p style={{ textAlign: 'center', marginTop: '1rem', color: 'green' }}>{status}</p>}
          </div>
        )}

        {/* EINSTELLUNGEN */}
        {ansicht === 'einstellungen' && (
          <EinstellungenTab
            notifAktiv={notifAktiv}
            handleNotifAktivieren={handleNotifAktivieren}
            vokabeln={vokabeln}
            faellige={faellige}
          />
        )}

      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.85rem', borderRadius: 10,
  border: '2px solid #e0d9ff', fontSize: '1rem',
  outline: 'none', boxSizing: 'border-box'
}