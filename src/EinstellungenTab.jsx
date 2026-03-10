import { useState, useEffect } from 'react'
import { speichereEinstellungen, aktualisiereLernrichtung, DEFAULT_EINSTELLUNGEN } from '../einstellungen'
import { verarbeiteRichtungswechsel } from '../vokabeln'

const ZEITEN_OPTIONEN = [6,7,8,9,10,12,14,16,18,20,21,22]

const RICHTUNGEN = [
  { wert: 'smart', label: '🧠 Smart', beschreibung: 'Schwächere Richtung bekommt mehr Karten — automatisch', empfohlen: true },
  { wert: 'beide', label: '↔️ Beide gleich', beschreibung: 'EN→DE und DE→EN gleichwertig, Session-Abstand-Regel aktiv' },
  { wert: 'en_de', label: '🇬🇧 → 🇩🇪 Nur EN→DE', beschreibung: 'Immer Englisch auf Vorderseite' },
  { wert: 'de_en', label: '🇩🇪 → 🇬🇧 Nur DE→EN', beschreibung: 'Immer Deutsch auf Vorderseite' },
  { wert: 'abwechselnd', label: '🎲 Abwechselnd', beschreibung: 'Richtung wird zufällig gewürfelt — ein gemeinsamer Fortschritt' },
]

const VOKABEL_MODI = [
  { wert: 'schwerste', label: '🔥 Schwerste zuerst', beschreibung: 'Niedrigste Stabilität' },
  { wert: 'ueberfaelligste', label: '⏰ Am längsten überfällig', beschreibung: 'Wartet am längsten' },
  { wert: 'zufaellig', label: '🎲 Zufällig', beschreibung: 'Zufällige fällige Vokabel' },
]

const NOTIF_TYPEN = [
  { key: 'wiederholungen', icon: '🔄', label: 'Fällige Wiederholungen', beschreibung: 'Erinnerung wenn Vokabeln zur Wiederholung fällig sind', defaultAktiv: true, defaultZeiten: [8, 12, 18] },
  { key: 'neueKarten', icon: '✨', label: 'Neue Karten verfügbar', beschreibung: 'Erinnerung wenn du heute noch neue Karten lernen kannst', defaultAktiv: true, defaultZeiten: [8] },
  { key: 'streak', icon: '🔥', label: 'Streak-Erinnerung', beschreibung: 'Erinnerung wenn du heute noch nicht gelernt hast', defaultAktiv: true, defaultZeiten: [20] },
  { key: 'rueckblick', icon: '🌙', label: 'Tagesrückblick', beschreibung: 'Zusammenfassung: was gelernt, was morgen fällig', defaultAktiv: false, defaultZeiten: [21] },
]

function AuswahlKarte({ aktiv, onClick, children }) {
  return (
    <div onClick={onClick} style={{ padding: '0.85rem 1rem', borderRadius: 14, border: `2px solid ${aktiv ? '#7c3aed' : '#e2e8f0'}`, background: aktiv ? '#faf5ff' : 'white', cursor: 'pointer', marginBottom: 8, transition: 'all 0.15s ease' }}>
      {children}
    </div>
  )
}

export default function EinstellungenTab({ einstellungen, setEinstellungen, notifAktiv, handleNotifAktivieren, statistik }) {
  const [einst, setEinst] = useState(einstellungen ?? DEFAULT_EINSTELLUNGEN)
  const [gespeichert, setGespeichert] = useState(false)
  const [richtungLaed, setRichtungLaed] = useState(false)
  const [fehler, setFehler] = useState(null)

  useEffect(() => { if (einstellungen) setEinst(einstellungen) }, [einstellungen])

  function toggleZeitFuerTyp(typ, z) {
    const typen = einst.notifTypen ?? {}
    const typEinst = typen[typ] ?? {}
    const aktuell = typEinst.zeiten ?? []
    let neueZeiten
    if (aktuell.includes(z)) {
      if (aktuell.length <= 1) return
      neueZeiten = aktuell.filter(t => t !== z)
    } else {
      neueZeiten = [...aktuell, z].sort((a, b) => a - b)
    }
    setEinst({ ...einst, notifTypen: { ...typen, [typ]: { ...typEinst, zeiten: neueZeiten } } })
  }

  function toggleTypAktiv(typ) {
    const typen = einst.notifTypen ?? {}
    const typEinst = typen[typ] ?? {}
    setEinst({ ...einst, notifTypen: { ...typen, [typ]: { ...typEinst, aktiv: !(typEinst.aktiv ?? true) } } })
  }

  async function handleRichtungWechseln(neueRichtung) {
    if (neueRichtung === einst.lernrichtung) return
    setRichtungLaed(true)
    setFehler(null)
    try {
      await verarbeiteRichtungswechsel(einst.lernrichtung, neueRichtung, einst.aktiveListen ?? ['en_a1'])
      const aktualisiert = await aktualisiereLernrichtung(einst, neueRichtung)
      setEinst(aktualisiert)
      setEinstellungen(aktualisiert)
    } catch (err) {
      setFehler('Fehler beim Wechseln der Richtung')
      console.error(err)
    }
    setRichtungLaed(false)
  }

  async function handleSpeichern() {
    try {
      await speichereEinstellungen(einst)
      setEinstellungen(einst)
      setGespeichert(true)
      setTimeout(() => setGespeichert(false), 2500)
    } catch {
      setFehler('Fehler beim Speichern')
    }
  }


return (
    <div style={styles.container}>

      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>🧭 Lernrichtung</h3>
        {richtungLaed && <div style={styles.ladeHinweis}>⏳ Profile werden vorbereitet...</div>}
        {RICHTUNGEN.map(r => (
          <AuswahlKarte key={r.wert} aktiv={einst.lernrichtung === r.wert} onClick={() => !richtungLaed && handleRichtungWechseln(r.wert)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: einst.lernrichtung === r.wert ? '#7c3aed' : '#1e293b' }}>{r.label}</span>
                  {r.empfohlen && <span style={styles.empfohlenBadge}>Empfohlen</span>}
                </div>
                <p style={styles.auswahlBeschreibung}>{r.beschreibung}</p>
              </div>
              <div style={{ ...styles.radioKreis, borderColor: einst.lernrichtung === r.wert ? '#7c3aed' : '#cbd5e1', background: einst.lernrichtung === r.wert ? '#7c3aed' : 'white' }}>
                {einst.lernrichtung === r.wert && <div style={styles.radioKern} />}
              </div>
            </div>
          </AuswahlKarte>
        ))}
      </div>

      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>✨ Neue Karten</h3>
        <p style={{ ...styles.label, marginBottom: 8 }}>Neue Karten pro Tag</p>
        <div style={styles.sliderWrapper}>
          <input type="range" min={1} max={50} value={einst.neueKartenProTag ?? 10} onChange={e => setEinst({ ...einst, neueKartenProTag: Number(e.target.value) })} style={styles.slider} />
          <span style={styles.sliderWert}>{einst.neueKartenProTag ?? 10}</span>
        </div>
        <div style={styles.sliderLabels}><span>1</span><span>10</span><span>25</span><span>50</span></div>
        <p style={{ ...styles.label, marginTop: 16, marginBottom: 8 }}>Reihenfolge</p>
        {[
          { wert: 'getrennt', label: '📋 Getrennt', beschreibung: 'Erst alle Wiederholungen, dann neue Karten' },
          { wert: 'gemischt', label: '🔀 Gemischt', beschreibung: 'Neue und alte Karten abwechselnd (wie Duolingo)' },
        ].map(m => (
          <AuswahlKarte key={m.wert} aktiv={einst.neueKartenModus === m.wert} onClick={() => setEinst({ ...einst, neueKartenModus: m.wert })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: einst.neueKartenModus === m.wert ? '#7c3aed' : '#1e293b' }}>{m.label}</span>
                <p style={styles.auswahlBeschreibung}>{m.beschreibung}</p>
              </div>
              <div style={{ ...styles.radioKreis, borderColor: einst.neueKartenModus === m.wert ? '#7c3aed' : '#cbd5e1', background: einst.neueKartenModus === m.wert ? '#7c3aed' : 'white' }}>
                {einst.neueKartenModus === m.wert && <div style={styles.radioKern} />}
              </div>
            </div>
          </AuswahlKarte>
        ))}
      </div>

      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>🔔 Benachrichtigungen</h3>
        {!notifAktiv ? (
          <button onClick={handleNotifAktivieren} style={styles.primaryBtn}>🔔 Notifications aktivieren</button>
        ) : (
          <div style={styles.aktivBox}>✅ Notifications sind aktiv</div>
        )}
        <p style={{ ...styles.label, marginTop: 16, marginBottom: 10 }}>Welche Erinnerungen möchtest du?</p>
        {NOTIF_TYPEN.map(typ => {
          const typEinst = (einst.notifTypen ?? {})[typ.key] ?? { aktiv: typ.defaultAktiv, zeiten: typ.defaultZeiten }
          const istAktiv = typEinst.aktiv ?? typ.defaultAktiv
          return (
            <div key={typ.key} style={{ border: `2px solid ${istAktiv ? '#7c3aed' : '#e2e8f0'}`, borderRadius: 14, padding: '0.9rem 1rem', marginBottom: 10, background: istAktiv ? '#faf5ff' : '#f8fafc', transition: 'all 0.15s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: istAktiv ? '#7c3aed' : '#64748b' }}>{typ.icon} {typ.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>{typ.beschreibung}</div>
                </div>
                <div onClick={() => toggleTypAktiv(typ.key)} style={{ width: 42, height: 24, borderRadius: 12, background: istAktiv ? '#7c3aed' : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ position: 'absolute', top: 3, left: istAktiv ? 20 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              {istAktiv && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600, marginBottom: 6 }}>Uhrzeiten:</div>
                  <div style={styles.zeitenGrid}>
                    {ZEITEN_OPTIONEN.map(z => {
                      const zeitAktiv = (typEinst.zeiten ?? []).includes(z)
                      return (
                        <button key={z} onClick={() => toggleZeitFuerTyp(typ.key, z)} style={{ ...styles.zeitBtn, borderColor: zeitAktiv ? '#7c3aed' : '#e2e8f0', background: zeitAktiv ? '#7c3aed' : 'white', color: zeitAktiv ? 'white' : '#475569', fontWeight: zeitAktiv ? 700 : 400 }}>
                          {z}:00
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Gewählt: {(typEinst.zeiten ?? []).map(z => `${z}:00`).join(', ')}</div>
                </div>
              )}
            </div>
          )
        })}
        <p style={{ ...styles.label, marginTop: 12, marginBottom: 8 }}>Welche Vokabel in der Meldung?</p>
        {VOKABEL_MODI.map(m => (
          <AuswahlKarte key={m.wert} aktiv={einst.vokabelModus === m.wert} onClick={() => setEinst({ ...einst, vokabelModus: m.wert })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: einst.vokabelModus === m.wert ? '#7c3aed' : '#1e293b' }}>{m.label}</span>
                <p style={styles.auswahlBeschreibung}>{m.beschreibung}</p>
              </div>
              <div style={{ ...styles.radioKreis, borderColor: einst.vokabelModus === m.wert ? '#7c3aed' : '#cbd5e1', background: einst.vokabelModus === m.wert ? '#7c3aed' : 'white' }}>
                {einst.vokabelModus === m.wert && <div style={styles.radioKern} />}
              </div>
            </div>
          </AuswahlKarte>
        ))}
      </div>

      <div style={styles.sektion}>
        <h3 style={styles.sektionTitel}>📊 Statistik</h3>
        <div style={styles.statistikGrid}>
          <div style={styles.statistikKarte}><span style={styles.statistikZahl}>{statistik?.gesamt ?? 0}</span><span style={styles.statistikLabel}>Gesamt</span></div>
          <div style={styles.statistikKarte}><span style={{ ...styles.statistikZahl, color: '#f97316' }}>{statistik?.faellig ?? 0}</span><span style={styles.statistikLabel}>Fällig</span></div>
          <div style={styles.statistikKarte}><span style={{ ...styles.statistikZahl, color: '#22c55e' }}>{statistik?.gelernt ?? 0}</span><span style={styles.statistikLabel}>Gelernt</span></div>
        </div>
      </div>

      {fehler && <div style={styles.fehlerBox}>{fehler}</div>}
      <button onClick={handleSpeichern} style={{ ...styles.primaryBtn, marginBottom: 8 }}>💾 Einstellungen speichern</button>
      {gespeichert && <p style={styles.gespeichertText}>✅ Gespeichert!</p>}
      <div style={{ height: 32 }} />
    </div>
  )
}
