import { useState, useEffect } from 'react'
import { toggleListe } from '../einstellungen'
import { ladeEigeneListen } from '../vokabeln'

const NIVEAU_FARBE = {
  A1: { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
  A2: { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' },
  B1: { bg: '#fef9c3', text: '#ca8a04', border: '#fef08a' },
  B2: { bg: '#ffedd5', text: '#ea580c', border: '#fed7aa' },
  C1: { bg: '#fce7f3', text: '#db2777', border: '#fbcfe8' },
}

function NiveauBadge({ niveau }) {
  const farbe = NIVEAU_FARBE[niveau] ?? { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' }
  return (
    <span style={{ background: farbe.bg, color: farbe.text, border: `1px solid ${farbe.border}`, borderRadius: 8, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em' }}>
      {niveau}
    </span>
  )
}

function VorschauModal({ liste, aktiv, onSchliessen, onToggle }) {
  const [vokabeln, setVokabeln] = useState([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function lade() {
      try {
        const res = await fetch(`/listen/${liste.id}.json`)
        const daten = await res.json()
        setVokabeln(daten.slice(0, 12))
      } catch { setVokabeln([]) }
      setLaden(false)
    }
    lade()
  }, [liste.id])

  return (
    <div style={styles.modalOverlay} onClick={onSchliessen}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={styles.modalFlagge}>{liste.flagge}</span>
              <NiveauBadge niveau={liste.niveau} />
            </div>
            <h3 style={styles.modalTitel}>{liste.beschreibung}</h3>
            <p style={styles.modalAnzahl}>{liste.anzahl} Vokabeln</p>
          </div>
          <button onClick={onSchliessen} style={styles.schliessenBtn}>✕</button>
        </div>
        <div style={styles.vorschauListe}>
          {laden ? (
            <p style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>Lädt...</p>
          ) : (
            vokabeln.map((v, i) => (
              <div key={i} style={styles.vorschauItem}>
                <span style={styles.vorschauWort}>{v.wort}</span>
                <span style={styles.vorschauPfeil}>→</span>
                <span style={styles.vorschauUebersetzung}>{v.uebersetzung}</span>
              </div>
            ))
          )}
          {!laden && vokabeln.length > 0 && (
            <p style={styles.vorschauMehr}>+ {liste.anzahl - vokabeln.length} weitere Vokabeln...</p>
          )}
        </div>
        <button onClick={onToggle} style={{ ...styles.toggleBtn, background: aktiv ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: aktiv ? '0 4px 16px rgba(239,68,68,0.3)' : '0 4px 16px rgba(124,58,237,0.3)' }}>
          {aktiv ? '✕ Liste deaktivieren' : '✓ Liste aktivieren'}
        </button>
      </div>
    </div>
  )
}

export default function EntdeckenTab({ einstellungen, setEinstellungen }) {
  const [index, setIndex]           = useState(null)
  const [listen, setListen]         = useState([])
  const [eigeneListen, setEigeneListen] = useState([])
  const [laden, setLaden]           = useState(true)
  const [toggleAnim, setToggleAnim] = useState(null)

  const aktiveListen = einstellungen?.aktiveListen ?? ['en_a1']

  useEffect(() => {
    async function ladeAlles() {
      try {
        const [res, eigene] = await Promise.all([
          fetch('/listen/index.json').then(r => r.json()),
          ladeEigeneListen()
        ])
        setListen(res)
        setEigeneListen(eigene)
      } catch { setListen([]) }
      setLaden(false)
    }
    ladeAlles()
  }, [])

  async function handleToggle(listenId) {
    setToggleAnim(listenId)
    const aktualisiert = await toggleListe(einstellungen, listenId)
    setEinstellungen(aktualisiert)
    setTimeout(() => setToggleAnim(null), 400)
    setIndex(null)
  }

  function toggleEigeneListe(listenId) {
    const aktiv = aktiveListen.includes(listenId)
    const neu = aktiv
      ? aktiveListen.filter(l => l !== listenId)
      : [...aktiveListen, listenId]
    setEinstellungen({ ...einstellungen, aktiveListen: neu })
  }

  if (laden) {
    return <div style={styles.container}><p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem', fontSize: '0.9rem' }}>Lädt Listen...</p></div>
  }

  const nachSprache = {}
  listen.forEach(l => {
    if (!nachSprache[l.sprache]) nachSprache[l.sprache] = []
    nachSprache[l.sprache].push(l)
  })

  const ausgewaehlteListe = index !== null ? listen[index] : null

  return (
    <div style={styles.container}>

      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitel}>📚 Vokabellisten</h2>
        <p style={styles.pageUntertitel}>Wähle welche Listen du lernen möchtest</p>
      </div>

      {/* Offizielle Listen */}
      {Object.entries(nachSprache).map(([sprache, sprachListen]) => (
        <div key={sprache} style={styles.sprachGruppe}>
          <div style={styles.sprachHeader}>
            <span style={styles.sprachFlagge}>{sprachListen[0].flagge}</span>
            <span style={styles.sprachName}>{sprache}</span>
            <span style={styles.aktivZaehler}>
              {sprachListen.filter(l => aktiveListen.includes(l.id)).length} aktiv
            </span>
          </div>
          {sprachListen.map(liste => {
            const istAktiv = aktiveListen.includes(liste.id)
            const istGlobal = listen.indexOf(liste)
            const animiert = toggleAnim === liste.id
            return (
              <div key={liste.id} onClick={() => setIndex(istGlobal)} style={{ ...styles.listenKarte, borderColor: istAktiv ? '#a78bfa' : '#e2e8f0', background: istAktiv ? '#faf5ff' : 'white', transform: animiert ? 'scale(0.97)' : 'scale(1)', transition: 'all 0.2s ease' }}>
                <div style={styles.listenKarteLinks}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <NiveauBadge niveau={liste.niveau} />
                    {istAktiv && <span style={styles.aktivBadge}>✓ Aktiv</span>}
                  </div>
                  <p style={styles.listenBeschreibung}>{liste.beschreibung}</p>
                  <p style={styles.listenAnzahl}>{liste.anzahl} Vokabeln</p>
                </div>
                <div onClick={e => { e.stopPropagation(); handleToggle(liste.id) }} style={{ ...styles.toggleSwitch, background: istAktiv ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#e2e8f0' }}>
                  <div style={{ ...styles.toggleKnopf, transform: istAktiv ? 'translateX(20px)' : 'translateX(2px)' }} />
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Eigene Listen */}
      {eigeneListen.length > 0 && (
        <div style={styles.sprachGruppe}>
          <div style={styles.sprachHeader}>
            <span style={styles.sprachFlagge}>✏️</span>
            <span style={styles.sprachName}>Meine Listen</span>
            <span style={styles.aktivZaehler}>
              {eigeneListen.filter(l => aktiveListen.includes(l.listenId)).length} aktiv
            </span>
          </div>
          {eigeneListen.map(liste => {
            const istAktiv = aktiveListen.includes(liste.listenId)
            return (
              <div key={liste.id} style={{ ...styles.listenKarte, borderColor: istAktiv ? '#a78bfa' : '#e2e8f0', background: istAktiv ? '#faf5ff' : 'white' }}>
                <div style={styles.listenKarteLinks}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={styles.eigeneBadge}>Eigene</span>
                    {istAktiv && <span style={styles.aktivBadge}>✓ Aktiv</span>}
                  </div>
                  <p style={styles.listenBeschreibung}>{liste.titel}</p>
                  <p style={styles.listenAnzahl}>{liste.vokabelAnzahl ?? 0} Vokabeln</p>
                </div>
                <div onClick={() => toggleEigeneListe(liste.listenId)} style={{ ...styles.toggleSwitch, background: istAktiv ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#e2e8f0' }}>
                  <div style={{ ...styles.toggleKnopf, transform: istAktiv ? 'translateX(20px)' : 'translateX(2px)' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={styles.infoBox}>
        <p style={styles.infoText}>💡 Tippe auf eine offizielle Liste für eine Vorschau</p>
      </div>

      {ausgewaehlteListe && (
        <VorschauModal
          liste={ausgewaehlteListe}
          aktiv={aktiveListen.includes(ausgewaehlteListe.id)}
          onSchliessen={() => setIndex(null)}
          onToggle={() => handleToggle(ausgewaehlteListe.id)}
        />
      )}

    </div>
  )
}

const styles = {
  container: { padding: '1.25rem' },
  pageHeader: { marginBottom: 20 },
  pageTitel: { fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', margin: '0 0 4px', letterSpacing: '-0.02em' },
  pageUntertitel: { fontSize: '0.85rem', color: '#94a3b8', margin: 0 },
  sprachGruppe: { marginBottom: 24 },
  sprachHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  sprachFlagge: { fontSize: '1.3rem' },
  sprachName: { fontSize: '0.95rem', fontWeight: 700, color: '#334155', flex: 1 },
  aktivZaehler: { fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, background: '#f5f3ff', padding: '2px 8px', borderRadius: 8 },
  listenKarte: { display: 'flex', alignItems: 'center', background: 'white', borderRadius: 16, padding: '1rem 1.1rem', marginBottom: 8, border: '2px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', gap: 12 },
  listenKarteLinks: { flex: 1, minWidth: 0 },
  aktivBadge: { fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '1px 8px', borderRadius: 6 },
  eigeneBadge: { fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '1px 8px', borderRadius: 6, border: '1px solid #bae6fd' },
  listenBeschreibung: { fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  listenAnzahl: { fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontWeight: 500 },
  toggleSwitch: { width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s ease' },
  toggleKnopf: { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s ease' },
  infoBox: { background: '#f8fafc', borderRadius: 12, padding: '0.85rem 1rem', marginTop: 8, border: '1px solid #e2e8f0' },
  infoText: { fontSize: '0.82rem', color: '#94a3b8', margin: 0, textAlign: 'center' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { width: '100%', background: 'white', borderRadius: '24px 24px 0 0', padding: '1.5rem 1.5rem 2rem', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', maxHeight: '80vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalFlagge: { fontSize: '1.4rem' },
  modalTitel: { fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 2px', letterSpacing: '-0.01em' },
  modalAnzahl: { fontSize: '0.8rem', color: '#94a3b8', margin: 0, fontWeight: 500 },
  schliessenBtn: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  vorschauListe: { background: '#f8fafc', borderRadius: 14, padding: '0.5rem', marginBottom: 16, maxHeight: '40vh', overflowY: 'auto' },
  vorschauItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.75rem', borderRadius: 10 },
  vorschauWort: { fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', minWidth: 80, flex: 1 },
  vorschauPfeil: { color: '#cbd5e1', fontSize: '0.8rem', flexShrink: 0 },
  vorschauUebersetzung: { color: '#475569', fontSize: '0.9rem', flex: 1 },
  vorschauMehr: { textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', padding: '0.5rem', margin: 0 },
  toggleBtn: { width: '100%', padding: '0.95rem', color: 'white', border: 'none', borderRadius: 14, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em' },
}
