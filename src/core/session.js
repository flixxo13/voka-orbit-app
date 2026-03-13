// ============================================================
// VokaOrbit — src/core/session.js
// Session-Zusammenstellung: Round-Robin, Mischen, Abstand-Regel.
// Kein React, kein Firebase. Pure Functions.
// ============================================================

import { waehleRichtung } from './fsrs'


// ------------------------------------------------------------
// Session zusammenstellen
// ------------------------------------------------------------

/**
 * Stellt eine komplette Lern-Session zusammen.
 *
 * @param {Array}  alleKarten     - aus ladeAlleKarten() (mit Profilen)
 * @param {object} einstellungen  - { lernrichtung, neueKartenProTag, neueKartenModus }
 * @param {object} heuteGesehen   - { [vokabelId]: true }
 * @returns {{ session, wiederholungAnzahl, neuAnzahl }}
 */
export function ladeSessionKarten(alleKarten, einstellungen, heuteGesehen = {}) {
  const {
    lernrichtung    = 'smart',
    neueKartenProTag = 10,
    neueKartenModus  = 'getrennt',
  } = einstellungen

  // 1. Lernkarten ableiten
  const lernkarten = []
  for (const karte of alleKarten) {
    if (lernrichtung === 'abwechselnd') {
      const profil = karte.profil_abwechselnd ?? null
      lernkarten.push({ ...karte, richtung: 'abwechselnd', aktivProfil: profil })
    } else if (lernrichtung === 'en_de') {
      lernkarten.push({ ...karte, richtung: 'en_de', aktivProfil: karte.profil_en_de ?? null })
    } else if (lernrichtung === 'de_en') {
      lernkarten.push({ ...karte, richtung: 'de_en', aktivProfil: karte.profil_de_en ?? null })
    } else {
      // smart / beide
      const richtung = waehleRichtung(
        { en_de: karte.profil_en_de, de_en: karte.profil_de_en },
        lernrichtung
      )
      const profil = richtung === 'en_de' ? karte.profil_en_de : karte.profil_de_en
      lernkarten.push({ ...karte, richtung, aktivProfil: profil ?? null })
    }
  }

  // 2. Trennen: Wiederholungen vs. Neue
  const jetzt = Date.now()
  const wiederholungen = []
  const neuKandidaten  = []

  for (const karte of lernkarten) {
    if (!karte.aktivProfil) {
      neuKandidaten.push(karte)
    } else if (karte.aktivProfil.naechsteFaelligkeit <= jetzt) {
      wiederholungen.push(karte)
    }
  }

  // 3. Session-Abstand-Regel für Wiederholungen (smart/beide)
  const wiederholungenGefiltert =
    (lernrichtung === 'beide' || lernrichtung === 'smart')
      ? _sessionAbstandRegel(wiederholungen)
      : wiederholungen

  // 4. Neue Karten: max. neueKartenProTag, heute noch nicht gesehen
  const bereitsHeuteNeu = Object.keys(heuteGesehen).length
  const nochErlaubt     = Math.max(0, neueKartenProTag - bereitsHeuteNeu)
  const neuGefiltert    = neuKandidaten.filter(k => !heuteGesehen[k.id])
  const neueKarten      = _roundRobin(neuGefiltert, nochErlaubt)

  // 5. Session zusammenstellen
  const session = neueKartenModus === 'gemischt'
    ? _mischen(wiederholungenGefiltert, neueKarten)
    : [...wiederholungenGefiltert, ...neueKarten]

  return {
    session,
    wiederholungAnzahl: wiederholungenGefiltert.length,
    neuAnzahl:          neueKarten.length,
  }
}


// ------------------------------------------------------------
// Intern: Round-Robin mit Gewichtung
// ------------------------------------------------------------

/**
 * Verteilt neue Karten gewichtet nach Listengröße.
 * Proportionale Slots + Minimum 1 pro Liste.
 */
function _roundRobin(karten, limit) {
  if (limit <= 0) return []

  const gruppen = {}
  for (const k of karten) {
    const lid = k.listenId ?? '__eigen__'
    if (!gruppen[lid]) gruppen[lid] = []
    gruppen[lid].push(k)
  }

  const eintraege = Object.values(gruppen)
  if (eintraege.length === 0) return []
  if (eintraege.length === 1) return eintraege[0].slice(0, limit)

  const anzahlListen = eintraege.length

  // Minimum 1 pro Liste reservieren
  const minimum    = Math.min(1, Math.floor(limit / anzahlListen))
  const restLimit  = limit - minimum * anzahlListen
  const gesamtKarten = eintraege.reduce((s, q) => s + q.length, 0)

  const slots = eintraege.map(q => {
    const anteil = gesamtKarten > 0 ? q.length / gesamtKarten : 1 / anzahlListen
    return minimum + Math.round(anteil * restLimit)
  })

  // Rundungsfehler korrigieren
  let diff = limit - slots.reduce((s, x) => s + x, 0)
  const groessteIdx = eintraege.reduce((bi, q, i) => q.length > eintraege[bi].length ? i : bi, 0)
  slots[groessteIdx] = Math.max(minimum, slots[groessteIdx] + diff)

  // Ungenutzte Slots umverteilen
  for (let i = 0; i < eintraege.length; i++) {
    const uebrig = slots[i] - eintraege[i].length
    if (uebrig > 0) {
      slots[i] = eintraege[i].length
      if (i !== groessteIdx) slots[groessteIdx] += uebrig
    }
  }

  // Interleaved ausgeben: A[0], B[0], C[0], A[1], B[1], ...
  const interleaved = []
  const maxSlot = Math.max(...slots)
  for (let i = 0; i < maxSlot; i++) {
    for (let j = 0; j < eintraege.length; j++) {
      if (i < slots[j] && eintraege[j][i]) interleaved.push(eintraege[j][i])
    }
  }

  return interleaved.slice(0, limit)
}


// ------------------------------------------------------------
// Intern: Session-Abstand-Regel
// ------------------------------------------------------------

function _sessionAbstandRegel(karten) {
  const nachVokabel = {}
  for (const k of karten) {
    const vid = k.vokabelId ?? k.id
    if (!nachVokabel[vid]) nachVokabel[vid] = []
    nachVokabel[vid].push(k)
  }
  const ergebnis = []
  for (const richtungen of Object.values(nachVokabel)) {
    if (richtungen.length <= 1) {
      ergebnis.push(...richtungen)
    } else {
      const schwaecher = richtungen.reduce((a, b) =>
        (a.aktivProfil?.stabilitaet ?? 1) <= (b.aktivProfil?.stabilitaet ?? 1) ? a : b
      )
      ergebnis.push(schwaecher)
    }
  }
  return ergebnis
}


// ------------------------------------------------------------
// Intern: Mischen (Wiederholungen + Neue abwechselnd)
// ------------------------------------------------------------

function _mischen(a, b) {
  const ergebnis = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length) ergebnis.push(a[i])
    if (i < b.length) ergebnis.push(b[i])
  }
  return ergebnis
}
