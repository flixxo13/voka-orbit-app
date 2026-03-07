import { useState, useEffect } from 'react'
import { ladeEinstellungen, speichereEinstellungen, DEFAULT_EINSTELLUNGEN } from './einstellungen'

const ZEITEN_OPTIONEN = [
  { label: '6:00', wert: 6 },
  { label: '7:00', wert: 7 },
  { label: '8:00', wert: 8 },
  { label: '9:00', wert: 9 },
  { label: '10:00', wert: 10 },
  { label: '12:00', wert: 12 },
  { label: '14:00', wert: 14 },
  { label: '16:00', wert: 16 },
  { label: '18:00', wert: 18 },
  { label: '20:00', wert: 20 },
  { label: '21:00', wert: 21 },
  { label: '22:00', wert: 22 },
  { label: '22:20', wert: 23 },
]

export default function EinstellungenTab({ notifAktiv, handleNotifAktivieren, vokabeln, faellige }) {
  const [einst, setEinst] = useState(DEFAULT_EINSTELLUNGEN)
  const [gespeichert, setGespeichert] = useState(false)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    ladeEinstellungen().then(e => {
      setEinst(e)
      setLaden(false)
    })
  }, [])

  function toggleZeit(wert) {
    const aktuell = einst.notifZeiten
    if (aktuell.includes(wert)) {
      if (aktuell.length <= 1) return // mindestens 1
      setEinst({ ...einst, notifZeiten: aktuell.filter(z => z !== wert) })
    } else {
      setEinst({ ...einst, notifZeiten: [...aktuell, wert].sort((a, b) => a - b) })
    }
  }

  async function handleSpeichern() {
    await speichereEinstellungen(einst)
    setGespeichert(true)
    setTimeout(() => setGespeichert(false), 2500)
  }

  if (laden) return <p style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Lädt...</p>

  return (
    <div>
      <h2 style={{ color: '#5c35d4', marginBottom: '1.5rem' }}>⚙️ Einstellungen</h2>

      {/* Notifications */}
      <div style={karteStyle}>
        <h3 style={titelStyle}>🔔 Benachrichtigungen</h3>
        {!notifAktiv ? (
          <button onClick={handleNotifAktivieren} style={primaryBtn}>
            🔔 Notifications aktivieren
          </button>
        ) : (
          <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '0.6rem', textAlign: 'center', color: '#2e7d32', fontSize: '0.9rem' }}>
            ✅ Notifications sind aktiv
          </div>
        )}
      </div>

      {/* Uhrzeiten */}
      <div style={karteStyle}>
        <h3 style={titelStyle}>🕐 Erinnerungszeiten</h3>
        <p style={beschriftungStyle}>Zu welchen Zeiten möchtest du erinnert werden?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {ZEITEN_OPTIONEN.map(z => (
            <button
              key={z.wert}
              onClick={() => toggleZeit(z.wert)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 20,
                border: '2px solid',
                borderColor: einst.notifZeiten.includes(z.wert) ? '#5c35d4' : '#ddd',
                background: einst.notifZeiten.includes(z.wert) ? '#5c35d4' : 'white',
                color: einst.notifZeiten.includes(z.wert) ? 'white' : '#666',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: einst.notifZeiten.includes(z.wert) ? 'bold' : 'normal',
              }}
            >
              {z.label}
            </button>
          ))}
        </div>
        <p style={{ ...beschriftungStyle, marginTop: '0.75rem' }}>
          Ausgewählt: <strong>{einst.notifZeiten.map(z => z + ':00').join(', ')}</strong>
        </p>
      </div>

      {/* Vokabel Modus */}
      <div style={karteStyle}>
        <h3 style={titelStyle}>🧠 Welche Vokabel in der Meldung?</h3>
        {[
          { wert: 'schwerste', label: '🔥 Schwerste zuerst', beschreibung: 'Die Vokabel mit der niedrigsten Stabilität' },
          { wert: 'ueberfaelligste', label: '⏰ Am längsten überfällig', beschreibung: 'Die Vokabel die am längsten wartet' },
          { wert: 'zufaellig', label: '🎲 Zufällig', beschreibung: 'Eine zufällige fällige Vokabel' },
        ].map(m => (
          <div
            key={m.wert}
            onClick={() => setEinst({ ...einst, vokabelModus: m.wert })}
            style={{
              padding: '0.85rem',
              borderRadius: 10,
              border: '2px solid',
              borderColor: einst.vokabelModus === m.wert ? '#5c35d4' : '#eee',
              background: einst.vokabelModus === m.wert ? '#f0eeff' : 'white',
              marginBottom: '0.6rem',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 'bold', color: einst.vokabelModus === m.wert ? '#5c35d4' : '#333' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '0.2rem' }}>
              {m.beschreibung}
            </div>
          </div>
        ))}
      </div>

      {/* Statistik */}
      <div style={karteStyle}>
        <h3 style={titelStyle}>📊 Statistik</h3>
        <p style={beschriftungStyle}>Gesamt: <strong>{vokabeln.length}</strong> Vokabeln</p>
        <p style={beschriftungStyle}>Fällig: <strong>{faellige.length}</strong> Vokabeln</p>
        <p style={beschriftungStyle}>Gelernt: <strong>{vokabeln.filter(v => v.wiederholungen > 0).length}</strong> Vokabeln</p>
      </div>

      {/* Speichern */}
      <button onClick={handleSpeichern} style={{ ...primaryBtn, marginTop: '0.5rem' }}>
        💾 Einstellungen speichern
      </button>
      {gespeichert && (
        <p style={{ textAlign: 'center', color: '#2e7d32', marginTop: '0.75rem', fontWeight: 'bold' }}>
          ✅ Gespeichert!
        </p>
      )}
    </div>
  )
}

const karteStyle = {
  background: 'white', borderRadius: 12, padding: '1.2rem',
  marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
}
const titelStyle = { margin: '0 0 0.5rem', fontSize: '1rem', color: '#333' }
const beschriftungStyle = { color: '#666', fontSize: '0.9rem', margin: '0.2rem 0' }
const primaryBtn = {
  width: '100%', padding: '0.9rem', background: '#5c35d4',
  color: 'white', border: 'none', borderRadius: 10,
  fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'
}