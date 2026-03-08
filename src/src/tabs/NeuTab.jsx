import { useState, useEffect } from 'react'
import { ladeEigeneVokabeln, vokabelHinzufuegen, vokabelLoeschen } from '../vokabeln'

export default function NeuTab() {
  const [vorderseite, setVorderseite] = useState('')
  const [rueckseite, setRueckseite] = useState('')
  const [eigeneVokabeln, setEigeneVokabeln] = useState([])
  const [laden, setLaden] = useState(true)
  const [status, setStatus] = useState(null)       // { typ: 'ok'|'fehler', text }
  const [speichern, setSpeichern] = useState(false)
  const [loescheId, setLoescheId] = useState(null) // Bestätigungs-Dialog

  useEffect(() => { lade() }, [])

  async function lade() {
    setLaden(true)
    const liste = await ladeEigeneVokabeln()
    // Neueste zuerst
    liste.sort((a, b) => (b.erstellt ?? 0) - (a.erstellt ?? 0))
    setEigeneVokabeln(liste)
    setLaden(false)
  }

  async function handleHinzufuegen() {
    if (!vorderseite.trim() || !rueckseite.trim()) {
      setStatus({ typ: 'fehler', text: 'Beide Felder ausfüllen!' })
      return
    }
    setSpeichern(true)
    try {
      await vokabelHinzufuegen(vorderseite, rueckseite)
      setVorderseite('')
      setRueckseite('')
      setStatus({ typ: 'ok', text: '✅ Vokabel gespeichert!' })
      setTimeout(() => setStatus(null), 2500)
      await lade()
    } catch {
      setStatus({ typ: 'fehler', text: '❌ Fehler beim Speichern' })
    }
    setSpeichern(false)
  }

  async function handleLoeschen(id) {
    setLoescheId(null)
    setEigeneVokabeln(v => v.filter(x => x.id !== id)) // optimistisch entfernen
    try {
      await vokabelLoeschen(id)
    } catch {
      await lade() // bei Fehler neu laden
    }
  }

  return (
    <div style={styles.container}>

      {/* ── Eingabe ── */}
      <div style={styles.karte}>
        <h2 style={styles.titel}>➕ Neue Vokabel</h2>

        <div style={styles.feldWrapper}>
          <label style={styles.label}>Vorderseite</label>
          <input
            value={vorderseite}
            onChange={e => setVorderseite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('rueckseite-input').focus()}
            placeholder="z.B. apple"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <div style={{ ...styles.feldWrapper, marginTop: 12 }}>
          <label style={styles.label}>Rückseite</label>
          <input
            id="rueckseite-input"
            value={rueckseite}
            onChange={e => setRueckseite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleHinzufuegen()}
            placeholder="z.B. Apfel"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        {status && (
          <div style={{
            ...styles.statusBox,
            background: status.typ === 'ok' ? '#f0fdf4' : '#fef2f2',
            color: status.typ === 'ok' ? '#16a34a' : '#dc2626',
            border: `1px solid ${status.typ === 'ok' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {status.text}
          </div>
        )}

        <button
          onClick={handleHinzufuegen}
          disabled={speichern}
          style={{
            ...styles.primaryBtn,
            opacity: speichern ? 0.7 : 1,
            marginTop: 16
          }}
        >
          {speichern ? 'Wird gespeichert...' : '+ Vokabel hinzufügen'}
        </button>
      </div>

      {/* ── Liste ── */}
      <div style={styles.listeHeader}>
        <span style={styles.listeTitel}>Meine Vokabeln</span>
        <span style={styles.listeZaehler}>
          {eigeneVokabeln.length} {eigeneVokabeln.length === 1 ? 'Eintrag' : 'Einträge'}
        </span>
      </div>

      {laden ? (
        <p style={styles.ladeText}>Lädt...</p>
      ) : eigeneVokabeln.length === 0 ? (
        <div style={styles.leerWrapper}>
          <p style={styles.leerEmoji}>📭</p>
          <p style={styles.leerText}>Noch keine eigenen Vokabeln.<br />Füge oben deine erste hinzu!</p>
        </div>
      ) : (
        <div style={styles.liste}>
          {eigeneVokabeln.map(v => (
            <div key={v.id} style={styles.listeItem}>
              <div style={styles.listeItemInhalt}>
                <span style={styles.listeWort}>{v.wort}</span>
                <span style={styles.listePfeil}>→</span>
                <span style={styles.listeUebersetzung}>{v.uebersetzung}</span>
              </div>
              <button
                onClick={() => setLoescheId(v.id)}
                style={styles.loeschBtn}
                aria-label="Löschen"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Lösch-Dialog ── */}
      {loescheId && (
        <div style={styles.dialogOverlay} onClick={() => setLoescheId(null)}>
          <div style={styles.dialog} onClick={e => e.stopPropagation()}>
            <p style={styles.dialogText}>Vokabel wirklich löschen?</p>
            <p style={styles.dialogHinweis}>Der Lernfortschritt geht ebenfalls verloren.</p>
            <div style={styles.dialogButtons}>
              <button onClick={() => setLoescheId(null)} style={styles.abbrechenBtn}>
                Abbrechen
              </button>
              <button onClick={() => handleLoeschen(loescheId)} style={styles.bestaetigenBtn}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────
const styles = {
  container: {
    padding: '1.25rem',
  },

  karte: {
    background: 'white',
    borderRadius: 20,
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    marginBottom: 24,
  },

  titel: {
    fontSize: '1.1rem', fontWeight: 800, color: '#1e293b',
    margin: '0 0 1.25rem', letterSpacing: '-0.01em'
  },

  feldWrapper: { display: 'flex', flexDirection: 'column', gap: 6 },

  label: {
    fontSize: '0.75rem', fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.06em'
  },

  input: {
    padding: '0.75rem 1rem',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    fontSize: '1rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#1e293b',
    transition: 'border-color 0.15s',
    background: '#f8fafc',
  },

  statusBox: {
    marginTop: 12,
    padding: '0.65rem 1rem',
    borderRadius: 10,
    fontSize: '0.88rem',
    fontWeight: 600,
  },

  primaryBtn: {
    width: '100%',
    padding: '0.9rem',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
    letterSpacing: '-0.01em',
  },

  // Liste
  listeHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  listeTitel: {
    fontSize: '0.95rem', fontWeight: 700, color: '#334155'
  },
  listeZaehler: {
    fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600
  },

  ladeText: {
    textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '0.9rem'
  },

  leerWrapper: {
    textAlign: 'center', padding: '2.5rem 1rem'
  },
  leerEmoji: { fontSize: '2.5rem', margin: '0 0 12px' },
  leerText: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 },

  liste: {
    display: 'flex', flexDirection: 'column', gap: 8
  },

  listeItem: {
    display: 'flex', alignItems: 'center',
    background: 'white',
    borderRadius: 14,
    padding: '0.85rem 1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    gap: 8,
  },

  listeItemInhalt: {
    flex: 1, display: 'flex', alignItems: 'center',
    gap: 8, flexWrap: 'wrap', minWidth: 0,
  },

  listeWort: {
    fontWeight: 700, color: '#1e293b', fontSize: '0.95rem',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    maxWidth: '42%',
  },
  listePfeil: { color: '#cbd5e1', fontSize: '0.85rem', flexShrink: 0 },
  listeUebersetzung: {
    color: '#475569', fontSize: '0.9rem',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    maxWidth: '42%',
  },

  loeschBtn: {
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '1.1rem',
    padding: '4px 6px', borderRadius: 8,
    flexShrink: 0,
    opacity: 0.5,
    transition: 'opacity 0.15s',
  },

  // Dialog
  dialogOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'flex-end',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },

  dialog: {
    width: '100%',
    background: 'white',
    borderRadius: '20px 20px 0 0',
    padding: '1.75rem 1.5rem 2rem',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
  },

  dialogText: {
    fontSize: '1.1rem', fontWeight: 800, color: '#1e293b',
    margin: '0 0 6px', textAlign: 'center'
  },
  dialogHinweis: {
    fontSize: '0.85rem', color: '#94a3b8',
    textAlign: 'center', margin: '0 0 20px'
  },

  dialogButtons: { display: 'flex', gap: 10 },

  abbrechenBtn: {
    flex: 1, padding: '0.9rem',
    background: '#f1f5f9', color: '#475569',
    border: 'none', borderRadius: 14,
    fontSize: '0.95rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  bestaetigenBtn: {
    flex: 1, padding: '0.9rem',
    background: '#ef4444', color: 'white',
    border: 'none', borderRadius: 14,
    fontSize: '0.95rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
