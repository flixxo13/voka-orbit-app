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

