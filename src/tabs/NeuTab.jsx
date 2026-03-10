import { useState, useEffect } from 'react'
import {
  ladeEigeneListen, listeErstellen, listeLoeschen,
  ladeVokabelnFuerListe, vokabelZuListeHinzufuegen,
  vokabelAusListeLoeschen, migriereLegacyVokabeln
} from '../vokabeln'
import { speichereEinstellungen } from '../einstellungen'

export default function NeuTab({ einstellungen, setEinstellungen }) {
  const [ansicht, setAnsicht] = useState('listen')    // 'listen' | 'detail' | 'neu'
  const [listen, setListen]   = useState([])
  const [aktiveListe, setAktiveListe] = useState(null)
  const [vokabeln, setVokabeln]       = useState([])
  const [laden, setLaden]             = useState(true)
  const [vokLaden, setVokLaden]       = useState(false)

  // Neu-Liste-Formular
  const [neuerTitel, setNeuerTitel] = useState('')
  const [titelSpeichern, setTitelSpeichern] = useState(false)

  // Vokabel-Formular
  const [vorderseite, setVorderseite] = useState('')
  const [rueckseite, setRueckseite]   = useState('')
  const [vokSpeichern, setVokSpeichern] = useState(false)

  const [loescheListeId, setLoescheListeId]   = useState(null)
  const [loescheVokabelId, setLoescheVokabelId] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    async function init() {
      await migriereLegacyVokabeln()
      await ladeListen()
    }
    init()
  }, [])

  async function ladeListen() {
    setLaden(true)
    const l = await ladeEigeneListen()
    setListen(l)
    setLaden(false)
  }

  async function oeffneListe(liste) {
    setAktiveListe(liste)
    setAnsicht('detail')
    setVokLaden(true)
    const v = await ladeVokabelnFuerListe(liste.id)
    setVokabeln(v)
    setVokLaden(false)
  }

  async function handleListeErstellen() {
    if (!neuerTitel.trim()) return
    setTitelSpeichern(true)
    try {
      await listeErstellen(neuerTitel)
      setNeuerTitel('')
      setAnsicht('listen')
      zeigStatus('ok', '✅ Liste erstellt!')
      await ladeListen()
    } catch {
      zeigStatus('fehler', '❌ Fehler beim Erstellen')
    }
    setTitelSpeichern(false)
  }

  async function handleListeLoeschen(id) {
    setLoescheListeId(null)
    setListen(l => l.filter(x => x.id !== id))

    // Aus aktiveListen entfernen falls aktiv
    if (einstellungen && setEinstellungen) {
      const listenId = `eigen_list_${id}`
      const aktiv = einstellungen.aktiveListen ?? []
      if (aktiv.includes(listenId)) {
        const neu = { ...einstellungen, aktiveListen: aktiv.filter(l => l !== listenId) }
        setEinstellungen(neu)
      }
    }
    try {
      await listeLoeschen(id)
    } catch {
      await ladeListen()
    }
  }

  async function handleVokabelHinzufuegen() {
    if (!vorderseite.trim() || !rueckseite.trim()) {
      zeigStatus('fehler', 'Beide Felder ausfüllen!')
      return
    }
    setVokSpeichern(true)
    try {
      await vokabelZuListeHinzufuegen(aktiveListe.id, vorderseite, rueckseite)
      setVorderseite('')
      setRueckseite('')
      zeigStatus('ok', '✅ Vokabel gespeichert!')
      const v = await ladeVokabelnFuerListe(aktiveListe.id)
      setVokabeln(v)
      // Vokabelanzahl in Listen-State aktualisieren
      setListen(l => l.map(x => x.id === aktiveListe.id
        ? { ...x, vokabelAnzahl: v.length }
        : x
      ))
      setAktiveListe(a => ({ ...a, vokabelAnzahl: v.length }))
    } catch {
      zeigStatus('fehler', '❌ Fehler beim Speichern')
    }
    setVokSpeichern(false)
  }

  async function handleVokabelLoeschen(vokabelId) {
    setLoescheVokabelId(null)
    setVokabeln(v => v.filter(x => x.id !== vokabelId))
    try {
      await vokabelAusListeLoeschen(vokabelId, aktiveListe.id)
      setAktiveListe(a => ({ ...a, vokabelAnzahl: (a.vokabelAnzahl ?? 1) - 1 }))
      setListen(l => l.map(x => x.id === aktiveListe.id
        ? { ...x, vokabelAnzahl: Math.max(0, (x.vokabelAnzahl ?? 1) - 1) }
        : x
      ))
    } catch {
      const v = await ladeVokabelnFuerListe(aktiveListe.id)
      setVokabeln(v)
    }
  }

  function zeigStatus(typ, text) {
    setStatus({ typ, text })
    setTimeout(() => setStatus(null), 2500)
  }

  async function toggleListeAktiv(listenId) {
    if (!einstellungen || !setEinstellungen) return
    const aktiv = einstellungen.aktiveListen ?? []
    const neuAktiv = aktiv.includes(listenId)
      ? aktiv.filter(l => l !== listenId)
      : [...aktiv, listenId]
    const neuEinst = { ...einstellungen, aktiveListen: neuAktiv }
    setEinstellungen(neuEinst)
    await speichereEinstellungen(neuEinst)
  }

  // ── Ansicht: Neue Liste erstellen ──────────────────────────
  if (ansicht === 'neu') {
    return (
      <div style={styles.container}>
        <div style={styles.backRow}>
          <button onClick={() => setAnsicht('listen')} style={styles.backBtn}>← Zurück</button>
        </div>
        <div style={styles.karte}>
          <h2 style={styles.kartenTitel}>📝 Neue Liste</h2>
          <label style={styles.label}>Name der Liste</label>
          <input
            value={neuerTitel}
            onChange={e => setNeuerTitel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleListeErstellen()}
            placeholder="z.B. Spanisch Urlaub"
            style={styles.input}
            autoFocus
          />
          {status && (
            <div style={{ ...styles.statusBox, background: status.typ === 'ok' ? '#f0fdf4' : '#fef2f2', color: status.typ === 'ok' ? '#16a34a' : '#dc2626', border: `1px solid ${status.typ === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
              {status.text}
            </div>
          )}
          <button
            onClick={handleListeErstellen}
            disabled={titelSpeichern || !neuerTitel.trim()}
            style={{ ...styles.primaryBtn, marginTop: 16, opacity: (titelSpeichern || !neuerTitel.trim()) ? 0.6 : 1 }}
          >
            {titelSpeichern ? 'Wird erstellt...' : '✅ Liste erstellen'}
          </button>
        </div>
      </div>
    )
  }

  // ── Ansicht: Listen-Detail ─────────────────────────────────
  if (ansicht === 'detail' && aktiveListe) {
    return (
      <div style={styles.container}>
        <div style={styles.backRow}>
          <button onClick={() => { setAnsicht('listen'); setAktiveListe(null) }} style={styles.backBtn}>← Zurück</button>
          <span style={styles.detailTitel}>{aktiveListe.titel}</span>
        </div>

        {/* Vokabel hinzufügen */}
        <div style={styles.karte}>
          <h3 style={styles.kartenTitel}>➕ Vokabel hinzufügen</h3>
          <label style={styles.label}>Vorderseite</label>
          <input
            value={vorderseite}
            onChange={e => setVorderseite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('rs-input').focus()}
            placeholder="z.B. apple"
            style={styles.input}
            autoCapitalize="none" autoCorrect="off"
          />
          <label style={{ ...styles.label, marginTop: 12 }}>Rückseite</label>
          <input
            id="rs-input"
            value={rueckseite}
            onChange={e => setRueckseite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVokabelHinzufuegen()}
            placeholder="z.B. Apfel"
            style={{ ...styles.input, marginTop: 6 }}
            autoCapitalize="none" autoCorrect="off"
          />
          {status && (
            <div style={{ ...styles.statusBox, background: status.typ === 'ok' ? '#f0fdf4' : '#fef2f2', color: status.typ === 'ok' ? '#16a34a' : '#dc2626', border: `1px solid ${status.typ === 'ok' ? '#bbf7d0' : '#fecaca'}` }}>
              {status.text}
            </div>
          )}
          <button
            onClick={handleVokabelHinzufuegen}
            disabled={vokSpeichern}
            style={{ ...styles.primaryBtn, marginTop: 14, opacity: vokSpeichern ? 0.7 : 1 }}
          >
            {vokSpeichern ? 'Wird gespeichert...' : '+ Vokabel hinzufügen'}
          </button>
        </div>

        {/* Vokabelliste */}
        <div style={styles.listeHeader}>
          <span style={styles.listeTitel}>{aktiveListe.vokabelAnzahl ?? vokabeln.length} Vokabeln</span>
        </div>

        {vokLaden ? (
          <p style={styles.ladeText}>Lädt...</p>
        ) : vokabeln.length === 0 ? (
          <div style={styles.leerWrapper}>
            <p style={styles.leerEmoji}>📭</p>
            <p style={styles.leerText}>Noch keine Vokabeln.<br />Füge oben die erste hinzu!</p>
          </div>
        ) : (
          <div style={styles.liste}>
            {vokabeln.map(v => (
              <div key={v.id} style={styles.listeItem}>
                <div style={styles.listeItemInhalt}>
                  <span style={styles.listeWort}>{v.vorderseite}</span>
                  <span style={styles.listePfeil}>→</span>
                  <span style={styles.listeUebersetzung}>{v.rueckseite}</span>
                </div>
                <button onClick={() => setLoescheVokabelId(v.id)} style={styles.loeschBtn}>🗑️</button>
              </div>
            ))}
          </div>
        )}

        {/* Vokabel-Lösch-Dialog */}
        {loescheVokabelId && (
          <div style={styles.dialogOverlay} onClick={() => setLoescheVokabelId(null)}>
            <div style={styles.dialog} onClick={e => e.stopPropagation()}>
              <p style={styles.dialogText}>Vokabel löschen?</p>
              <p style={styles.dialogHinweis}>Der Lernfortschritt geht ebenfalls verloren.</p>
              <div style={styles.dialogButtons}>
                <button onClick={() => setLoescheVokabelId(null)} style={styles.abbrechenBtn}>Abbrechen</button>
                <button onClick={() => handleVokabelLoeschen(loescheVokabelId)} style={styles.bestaetigenBtn}>Löschen</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    )
  }

  // ── Ansicht: Listen-Übersicht ──────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitel}>📝 Meine Listen</h2>
        <button onClick={() => setAnsicht('neu')} style={styles.neuBtn}>+ Neu</button>
      </div>

      {status && (
        <div style={{ ...styles.statusBox, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', marginBottom: 12 }}>
          {status.text}
        </div>
      )}

      {laden ? (
        <p style={styles.ladeText}>Lädt...</p>
      ) : listen.length === 0 ? (
        <div style={styles.leerWrapper}>
          <p style={styles.leerEmoji}>📂</p>
          <p style={styles.leerText}>Noch keine eigenen Listen.<br />Erstelle deine erste Liste!</p>
          <button onClick={() => setAnsicht('neu')} style={{ ...styles.primaryBtn, marginTop: 16 }}>
            + Erste Liste erstellen
          </button>
        </div>
      ) : (
        <div style={styles.listenGrid}>
          {listen.map(liste => {
            const listenId = `eigen_list_${liste.id}`
            const istAktiv = (einstellungen?.aktiveListen ?? []).includes(listenId)
            return (
              <div key={liste.id} style={styles.listenKarte}>
                <div style={styles.listenKarteOben} onClick={() => oeffneListe(liste)}>
                  <div style={styles.listenKarteInfo}>
                    <span style={styles.listenKarteTitel}>{liste.titel}</span>
                    <span style={styles.listenKarteAnzahl}>{liste.vokabelAnzahl ?? 0} Vokabeln</span>
                  </div>
                  <span style={styles.listenPfeil}>›</span>
                </div>
                <div style={styles.listenKarteUnten}>
                  {/* Toggle: Lernen aktiv? */}
                  <div style={styles.toggleRow} onClick={() => toggleListeAktiv(listenId)}>
                    <span style={{ fontSize: '0.78rem', color: istAktiv ? '#7c3aed' : '#94a3b8', fontWeight: 600 }}>
                      {istAktiv ? '✓ Aktiv' : 'Inaktiv'}
                    </span>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: istAktiv ? '#7c3aed' : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 2, left: istAktiv ? 17 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                  <button onClick={() => setLoescheListeId(liste.id)} style={styles.loeschBtnKlein}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Listen-Lösch-Dialog */}
      {loescheListeId && (
        <div style={styles.dialogOverlay} onClick={() => setLoescheListeId(null)}>
          <div style={styles.dialog} onClick={e => e.stopPropagation()}>
            <p style={styles.dialogText}>Liste löschen?</p>
            <p style={styles.dialogHinweis}>Alle Vokabeln und der Lernfortschritt gehen verloren.</p>
            <div style={styles.dialogButtons}>
              <button onClick={() => setLoescheListeId(null)} style={styles.abbrechenBtn}>Abbrechen</button>
              <button onClick={() => handleListeLoeschen(loescheListeId)} style={styles.bestaetigenBtn}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 32 }} />
    </div>
  )
}

const styles = {
  container: { padding: '1.25rem' },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitel:  { fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 },
  neuBtn: {
    padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: 'white', border: 'none', borderRadius: 10,
    fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
  },

  backRow:    { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: {
    background: 'none', border: 'none', color: '#7c3aed',
    fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
    padding: '4px 0', fontFamily: 'inherit'
  },
  detailTitel: { fontSize: '1rem', fontWeight: 800, color: '#1e293b' },

  karte: { background: 'white', borderRadius: 20, padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 20 },
  kartenTitel: { fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 14px' },

  label: { fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 },
  input: { padding: '0.75rem 1rem', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1e293b', background: '#f8fafc' },
  statusBox: { marginTop: 10, padding: '0.65rem 1rem', borderRadius: 10, fontSize: '0.88rem', fontWeight: 600 },
  primaryBtn: { width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: 14, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' },

  listenGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  listenKarte: { background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' },
  listenKarteOben: { display: 'flex', alignItems: 'center', padding: '1rem 1.1rem', cursor: 'pointer' },
  listenKarteInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  listenKarteTitel: { fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' },
  listenKarteAnzahl: { fontSize: '0.78rem', color: '#94a3b8' },
  listenPfeil: { fontSize: '1.2rem', color: '#cbd5e1' },
  listenKarteUnten: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1.1rem', borderTop: '1px solid #f1f5f9', background: '#fafbfc' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  loeschBtnKlein: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.45, padding: '4px' },

  listeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listeTitel: { fontSize: '0.88rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  ladeText: { textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '0.9rem' },
  leerWrapper: { textAlign: 'center', padding: '2.5rem 1rem' },
  leerEmoji: { fontSize: '2.5rem', margin: '0 0 12px' },
  leerText: { color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 },

  liste: { display: 'flex', flexDirection: 'column', gap: 8 },
  listeItem: { display: 'flex', alignItems: 'center', background: 'white', borderRadius: 14, padding: '0.85rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', gap: 8 },
  listeItemInhalt: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  listeWort: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '42%' },
  listePfeil: { color: '#cbd5e1', fontSize: '0.85rem', flexShrink: 0 },
  listeUebersetzung: { color: '#475569', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '42%' },
  loeschBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 6px', borderRadius: 8, flexShrink: 0, opacity: 0.5 },

  dialogOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', zIndex: 1000, backdropFilter: 'blur(4px)' },
  dialog: { width: '100%', background: 'white', borderRadius: '20px 20px 0 0', padding: '1.75rem 1.5rem 2rem', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)' },
  dialogText: { fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px', textAlign: 'center' },
  dialogHinweis: { fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', margin: '0 0 20px' },
  dialogButtons: { display: 'flex', gap: 10 },
  abbrechenBtn: { flex: 1, padding: '0.9rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 14, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  bestaetigenBtn: { flex: 1, padding: '0.9rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 14, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
