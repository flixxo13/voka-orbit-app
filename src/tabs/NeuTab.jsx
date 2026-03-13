// ============================================================
// VokaOrbit — tabs/NeuTab.jsx
// Eigene Listen verwalten: erstellen, Vokabeln hinzufügen, löschen.
// Nutzt useEinstellungen() Context statt Props.
// ============================================================

import { useState, useEffect } from 'react'
import { useEinstellungen } from '../hooks/useEinstellungen'
import {
  ladeEigeneListen, listeErstellen, listeLoeschen,
  ladeVokabelnFuerListe, vokabelZuListeHinzufuegen,
  vokabelAusListeLoeschen, migriereLegacyVokabeln
} from '../core/listen'
import { speichereEinstellungen } from '../einstellungen'
import { tokens, composite } from '../design/tokens'

export default function NeuTab() {
  // Context statt Props
  const { einstellungen, setEinstellungen } = useEinstellungen()

  const [ansicht, setAnsicht] = useState('listen')
  const [listen,  setListen]  = useState([])
  const [aktiveListe,  setAktiveListe]  = useState(null)
  const [vokabeln,     setVokabeln]     = useState([])
  const [laden,        setLaden]        = useState(true)
  const [vokLaden,     setVokLaden]     = useState(false)
  const [neuerTitel,   setNeuerTitel]   = useState('')
  const [titelSpeichern, setTitelSpeichern] = useState(false)
  const [vorderseite,  setVorderseite]  = useState('')
  const [rueckseite,   setRueckseite]   = useState('')
  const [vokSpeichern, setVokSpeichern] = useState(false)
  const [loescheListeId,   setLoescheListeId]   = useState(null)
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
    // Aus aktiveListen entfernen
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
      setListen(l => l.map(x => x.id === aktiveListe.id ? { ...x, vokabelAnzahl: v.length } : x))
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
      setAktiveListe(a => ({ ...a, vokabelAnzahl: Math.max(0, (a.vokabelAnzahl ?? 1) - 1) }))
      setListen(l => l.map(x => x.id === aktiveListe.id ? { ...x, vokabelAnzahl: Math.max(0, (x.vokabelAnzahl ?? 1) - 1) } : x))
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
    const aktiv   = einstellungen.aktiveListen ?? []
    const neuAktiv = aktiv.includes(listenId)
      ? aktiv.filter(l => l !== listenId)
      : [...aktiv, listenId]
    const neuEinst = { ...einstellungen, aktiveListen: neuAktiv }
    setEinstellungen(neuEinst)
    await speichereEinstellungen(neuEinst)
  }

  // ── Ansicht: Neue Liste ───────────────────────────────────
  if (ansicht === 'neu') {
    return (
      <div style={styles.container}>
        <div style={styles.backRow}>
          <button onClick={() => setAnsicht('listen')} style={styles.backBtn}>← Zurück</button>
        </div>
        <div style={styles.karte}>
          <h2 style={styles.kartenTitel}>📝 Neue Liste</h2>
          <label style={composite.label}>Name der Liste</label>
          <input
            value={neuerTitel}
            onChange={e => setNeuerTitel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleListeErstellen()}
            placeholder="z.B. Spanisch Urlaub"
            style={styles.input}
            autoFocus
          />
          {status && <div style={{ ...styles.statusBox, background: status.typ === 'ok' ? tokens.colors.successBg : tokens.colors.dangerBg, color: status.typ === 'ok' ? tokens.colors.success : tokens.colors.danger, border: `1px solid ${status.typ === 'ok' ? tokens.colors.successLight : tokens.colors.dangerLight}` }}>{status.text}</div>}
          <button onClick={handleListeErstellen} disabled={titelSpeichern || !neuerTitel.trim()} style={{ ...composite.primaryBtn, marginTop: 16, opacity: (titelSpeichern || !neuerTitel.trim()) ? 0.6 : 1 }}>
            {titelSpeichern ? 'Wird erstellt...' : '✅ Liste erstellen'}
          </button>
        </div>
      </div>
    )
  }

  // ── Ansicht: Listen-Detail ────────────────────────────────
  if (ansicht === 'detail' && aktiveListe) {
    return (
      <div style={styles.container}>
        <div style={styles.backRow}>
          <button onClick={() => { setAnsicht('listen'); setAktiveListe(null) }} style={styles.backBtn}>← Zurück</button>
          <span style={styles.detailTitel}>{aktiveListe.titel}</span>
        </div>

        <div style={styles.karte}>
          <h3 style={styles.kartenTitel}>➕ Vokabel hinzufügen</h3>
          <label style={composite.label}>Vorderseite</label>
          <input value={vorderseite} onChange={e => setVorderseite(e.target.value)} onKeyDown={e => e.key === 'Enter' && document.getElementById('rs-input').focus()} placeholder="z.B. apple" style={styles.input} autoCapitalize="none" autoCorrect="off" />
          <label style={{ ...composite.label, marginTop: 12 }}>Rückseite</label>
          <input id="rs-input" value={rueckseite} onChange={e => setRueckseite(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVokabelHinzufuegen()} placeholder="z.B. Apfel" style={{ ...styles.input, marginTop: 6 }} autoCapitalize="none" autoCorrect="off" />
          {status && <div style={{ ...styles.statusBox, background: status.typ === 'ok' ? tokens.colors.successBg : tokens.colors.dangerBg, color: status.typ === 'ok' ? tokens.colors.success : tokens.colors.danger, border: `1px solid ${status.typ === 'ok' ? tokens.colors.successLight : tokens.colors.dangerLight}` }}>{status.text}</div>}
          <button onClick={handleVokabelHinzufuegen} disabled={vokSpeichern} style={{ ...composite.primaryBtn, marginTop: 14, opacity: vokSpeichern ? 0.7 : 1 }}>
            {vokSpeichern ? 'Wird gespeichert...' : '+ Vokabel hinzufügen'}
          </button>
        </div>

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

  // ── Ansicht: Listen-Übersicht ─────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitel}>📝 Meine Listen</h2>
        <button onClick={() => setAnsicht('neu')} style={styles.neuBtn}>+ Neu</button>
      </div>

      {status && (
        <div style={{ ...styles.statusBox, background: tokens.colors.successBg, color: tokens.colors.success, border: `1px solid ${tokens.colors.successLight}`, marginBottom: 12 }}>
          {status.text}
        </div>
      )}

      {laden ? (
        <p style={styles.ladeText}>Lädt...</p>
      ) : listen.length === 0 ? (
        <div style={styles.leerWrapper}>
          <p style={styles.leerEmoji}>📂</p>
          <p style={styles.leerText}>Noch keine eigenen Listen.<br />Erstelle deine erste Liste!</p>
          <button onClick={() => setAnsicht('neu')} style={{ ...composite.primaryBtn, marginTop: 16 }}>
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
                  <div style={styles.toggleRow} onClick={() => toggleListeAktiv(listenId)}>
                    <span style={{ fontSize: '0.78rem', color: istAktiv ? tokens.colors.primary : tokens.colors.textMuted, fontWeight: 600 }}>
                      {istAktiv ? '✓ Aktiv' : 'Inaktiv'}
                    </span>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: istAktiv ? tokens.colors.primary : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: tokens.transition.slow, flexShrink: 0 }}>
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
  pageTitel:  { fontSize: tokens.font.size.xl, fontWeight: tokens.font.weight.extrabold, color: tokens.colors.textDark, margin: 0 },
  neuBtn: { padding: '0.5rem 1rem', background: tokens.colors.gradient, color: 'white', border: 'none', borderRadius: tokens.radius.md, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  backRow:    { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { background: 'none', border: 'none', color: tokens.colors.primary, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' },
  detailTitel: { fontSize: tokens.font.size.lg, fontWeight: tokens.font.weight.extrabold, color: tokens.colors.textDark },
  karte: { background: tokens.colors.surface, borderRadius: tokens.radius.cardLg, padding: '1.5rem', boxShadow: tokens.shadow.md, marginBottom: 20 },
  kartenTitel: { fontSize: tokens.font.size.lg, fontWeight: tokens.font.weight.extrabold, color: tokens.colors.textDark, margin: '0 0 14px' },
  input: { padding: '0.75rem 1rem', borderRadius: tokens.radius.lg, border: `2px solid ${tokens.colors.border}`, fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', color: tokens.colors.textDark, background: tokens.colors.surfaceAlt },
  statusBox: { marginTop: 10, padding: '0.65rem 1rem', borderRadius: tokens.radius.md, fontSize: '0.88rem', fontWeight: 600 },
  listenGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  listenKarte: { background: tokens.colors.surface, borderRadius: tokens.radius.card, boxShadow: tokens.shadow.sm, overflow: 'hidden' },
  listenKarteOben: { display: 'flex', alignItems: 'center', padding: '1rem 1.1rem', cursor: 'pointer' },
  listenKarteInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  listenKarteTitel: { fontWeight: 700, fontSize: '0.95rem', color: tokens.colors.textDark },
  listenKarteAnzahl: { fontSize: '0.78rem', color: tokens.colors.textMuted },
  listenPfeil: { fontSize: '1.2rem', color: '#cbd5e1' },
  listenKarteUnten: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1.1rem', borderTop: `1px solid ${tokens.colors.borderLight}`, background: '#fafbfc' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  loeschBtnKlein: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.45, padding: '4px' },
  listeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listeTitel: { fontSize: '0.88rem', fontWeight: 700, color: tokens.colors.textLight, textTransform: 'uppercase', letterSpacing: '0.05em' },
  ladeText: { textAlign: 'center', color: tokens.colors.textMuted, padding: '2rem 0', fontSize: '0.9rem' },
  leerWrapper: { textAlign: 'center', padding: '2.5rem 1rem' },
  leerEmoji: { fontSize: '2.5rem', margin: '0 0 12px' },
  leerText: { color: tokens.colors.textMuted, fontSize: '0.9rem', lineHeight: 1.6, margin: 0 },
  liste: { display: 'flex', flexDirection: 'column', gap: 8 },
  listeItem: { display: 'flex', alignItems: 'center', background: tokens.colors.surface, borderRadius: tokens.radius.xl, padding: '0.85rem 1rem', boxShadow: tokens.shadow.sm, gap: 8 },
  listeItemInhalt: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  listeWort: { fontWeight: 700, color: tokens.colors.textDark, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '42%' },
  listePfeil: { color: '#cbd5e1', fontSize: '0.85rem', flexShrink: 0 },
  listeUebersetzung: { color: tokens.colors.textMid, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '42%' },
  loeschBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 6px', borderRadius: tokens.radius.sm, flexShrink: 0, opacity: 0.5 },
  dialogOverlay: { position: 'fixed', inset: 0, background: tokens.colors.overlay, display: 'flex', alignItems: 'flex-end', zIndex: tokens.z.modal, backdropFilter: 'blur(4px)' },
  dialog: { width: '100%', background: tokens.colors.surface, borderRadius: '20px 20px 0 0', padding: '1.75rem 1.5rem 2rem', boxShadow: tokens.shadow.lg },
  dialogText: { fontSize: '1.1rem', fontWeight: 800, color: tokens.colors.textDark, margin: '0 0 6px', textAlign: 'center' },
  dialogHinweis: { fontSize: '0.85rem', color: tokens.colors.textMuted, textAlign: 'center', margin: '0 0 20px' },
  dialogButtons: { display: 'flex', gap: 10 },
  abbrechenBtn: { flex: 1, padding: '0.9rem', background: tokens.colors.borderLight, color: tokens.colors.textMid, border: 'none', borderRadius: tokens.radius.xl, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  bestaetigenBtn: { flex: 1, padding: '0.9rem', background: tokens.colors.danger, color: 'white', border: 'none', borderRadius: tokens.radius.xl, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
}
