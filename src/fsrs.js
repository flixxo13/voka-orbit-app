// ============================================================
// VokaOrbit — FSRS Algorithmus + Smart Direction
// ============================================================
//
// Jede Vokabel hat bis zu 3 Profile in Firestore:
//   en_de        → eigenes FSRS-Profil
//   de_en        → eigenes FSRS-Profil
//   abwechselnd  → eigenes FSRS-Profil (Richtung per Zufall)
//
// Profile werden NIE gelöscht — nur pausiert oder aktiv.
// ============================================================


// ------------------------------------------------------------
// 1. FSRS Kern — richtungsunabhängig
// ------------------------------------------------------------

/**
 * Berechnet das neue FSRS-Profil nach einer Bewertung.
 * @param {object} profil - { intervall, wiederholungen, stabilitaet }
 * @param {number} bewertung - 1 (Nochmal) bis 4 (Leicht)
 * @returns {object} - neues { intervall, wiederholungen, stabilitaet, naechsteFaelligkeit, letzteWiederholung }
 */
export function berechneNaechsteWiederholung(profil, bewertung) {
  const jetzt = Date.now()
  let { intervall = 1, wiederholungen = 0, stabilitaet = 1 } = profil

  if (bewertung === 1) {
    // Nochmal — zurücksetzen
    intervall = 1
    wiederholungen = 0
    stabilitaet = Math.max(0.5, stabilitaet * 0.5)
  } else if (bewertung === 2) {
    // Schwer
    intervall = Math.max(1, Math.round(intervall * 1.2))
    stabilitaet = stabilitaet * 1.1
    wiederholungen += 1
  } else if (bewertung === 3) {
    // Gut
    if (wiederholungen === 0) intervall = 1
    else if (wiederholungen === 1) intervall = 3
    else intervall = Math.round(intervall * 2.5)
    stabilitaet = stabilitaet * 1.5
    wiederholungen += 1
  } else if (bewertung === 4) {
    // Leicht
    if (wiederholungen === 0) intervall = 3
    else intervall = Math.round(intervall * 3.5)
    stabilitaet = stabilitaet * 2
    wiederholungen += 1
  }

  return {
    intervall,
    wiederholungen,
    stabilitaet,
    naechsteFaelligkeit: jetzt + intervall * 24 * 60 * 60 * 1000,
    letzteWiederholung: jetzt
  }
}


// ------------------------------------------------------------
// 2. Startprofil anlegen beim Richtungswechsel
// ------------------------------------------------------------

/**
 * Erstellt ein neues FSRS-Startprofil basierend auf einem vorhandenen.
 * @param {object|null} quellProfil - vorhandenes Profil (oder null für Neuling)
 * @param {number} faktor - 0.5 oder 0.7 je nach Kombination
 * @returns {object} - neues Startprofil
 */
export function erstelleStartProfil(quellProfil = null, faktor = 0.5) {
  const jetzt = Date.now()

  if (!quellProfil) {
    // Komplett neue Vokabel — FSRS Standard
    return {
      intervall: 0,
      wiederholungen: 0,
      stabilitaet: 1,
      naechsteFaelligkeit: jetzt,
      letzteWiederholung: null
    }
  }

  const neueStabilitaet = Math.max(0.5, quellProfil.stabilitaet * faktor)
  const neuesIntervall = Math.max(1, Math.round(quellProfil.intervall * faktor))

  return {
    intervall: neuesIntervall,
    wiederholungen: Math.max(0, quellProfil.wiederholungen - 1),
    stabilitaet: neueStabilitaet,
    naechsteFaelligkeit: jetzt + neuesIntervall * 24 * 60 * 60 * 1000,
    letzteWiederholung: null
  }
}


// ------------------------------------------------------------
// 3. Richtungswechsel — alle 12 Kombinationen
// ------------------------------------------------------------

/**
 * Verwaltet den Übergang zwischen Lernrichtungen.
 * Gibt zurück welche Profile aktiv sind und was neu angelegt werden soll.
 *
 * @param {string} vorher - "en_de" | "de_en" | "beide" | "abwechselnd"
 * @param {string} nachher - "en_de" | "de_en" | "beide" | "abwechselnd"
 * @param {object} vorhandeneProfile - { en_de: Profil|null, de_en: Profil|null, abwechselnd: Profil|null }
 * @returns {object} - { aktiv: string[], neuAnlegen: { richtung, profil }[] }
 */
export function handleRichtungswechsel(vorher, nachher, vorhandeneProfile) {
  const { en_de, de_en, abwechselnd } = vorhandeneProfile
  const aktiv = []
  const neuAnlegen = []

  if (nachher === 'en_de') {
    aktiv.push('en_de')
    if (!en_de) {
      // Quelle bestimmen
      const quelle = vorher === 'de_en' ? de_en
                   : vorher === 'abwechselnd' ? abwechselnd
                   : null
      const faktor = vorher === 'abwechselnd' ? 0.7 : 0.5
      neuAnlegen.push({ richtung: 'en_de', profil: erstelleStartProfil(quelle, faktor) })
    }
  }

  else if (nachher === 'de_en') {
    aktiv.push('de_en')
    if (!de_en) {
      const quelle = vorher === 'en_de' ? en_de
                   : vorher === 'abwechselnd' ? abwechselnd
                   : null
      const faktor = vorher === 'abwechselnd' ? 0.7 : 0.5
      neuAnlegen.push({ richtung: 'de_en', profil: erstelleStartProfil(quelle, faktor) })
    }
  }

  else if (nachher === 'beide') {
    aktiv.push('en_de', 'de_en')

    if (!en_de) {
      const quelle = de_en ?? abwechselnd ?? null
      const faktor = abwechselnd ? 0.7 : 0.5
      neuAnlegen.push({ richtung: 'en_de', profil: erstelleStartProfil(quelle, faktor) })
    }
    if (!de_en) {
      const quelle = en_de ?? abwechselnd ?? null
      const faktor = abwechselnd ? 0.7 : 0.5
      neuAnlegen.push({ richtung: 'de_en', profil: erstelleStartProfil(quelle, faktor) })
    }
  }

  else if (nachher === 'abwechselnd') {
    aktiv.push('abwechselnd')

    if (!abwechselnd) {
      // Bestes vorhandenes Profil als Quelle
      let quelle = null
      let faktor = 0.5

      if (en_de && de_en) {
        // Beide vorhanden → MAX Stabilität × 0.7
        quelle = en_de.stabilitaet >= de_en.stabilitaet ? en_de : de_en
        faktor = 0.7
      } else if (en_de || de_en) {
        quelle = en_de ?? de_en
        faktor = 0.5
      }

      neuAnlegen.push({ richtung: 'abwechselnd', profil: erstelleStartProfil(quelle, faktor) })
    }
  }

  return { aktiv, neuAnlegen }
}


// ------------------------------------------------------------
// 4. Smart Direction — Richtung auswählen
// ------------------------------------------------------------

/**
 * Wählt die Lernrichtung für eine Karte.
 * @param {object} profile - { en_de: Profil|null, de_en: Profil|null }
 * @param {string} einstellung - "smart" | "abwechselnd" | "en_de" | "de_en"
 * @returns {string} - "en_de" oder "de_en"
 */
export function waehleRichtung(profile, einstellung) {
  const { en_de, de_en } = profile

  if (einstellung === 'en_de') return 'en_de'
  if (einstellung === 'de_en') return 'de_en'

  if (einstellung === 'abwechselnd') {
    return Math.random() < 0.5 ? 'en_de' : 'de_en'
  }

  // "smart" — schwächere Richtung bekommt mehr Karten
  if (!en_de && !de_en) return 'en_de' // beide neu → zuerst en_de
  if (!en_de) return 'en_de'           // en_de noch nie gelernt
  if (!de_en) return 'de_en'           // de_en noch nie gelernt

  // Gewichteter Zufall nach Schwäche (niedrige Stabilität = schwächer)
  const schwaeche_en_de = 1 / Math.max(0.1, en_de.stabilitaet)
  const schwaeche_de_en = 1 / Math.max(0.1, de_en.stabilitaet)
  const gesamt = schwaeche_en_de + schwaeche_de_en

  return Math.random() < (schwaeche_en_de / gesamt) ? 'en_de' : 'de_en'
}


// ------------------------------------------------------------
// 5. Fällige Karten bestimmen (mit Session-Abstand-Regel)
// ------------------------------------------------------------

/**
 * Bestimmt welche Karten fällig sind.
 * Session-Abstand-Regel: beide Richtungen einer Vokabel können
 * nicht in derselben Session erscheinen — schwächere hat Vorrang.
 *
 * @param {Array} karten - [{ id, vokabelId, richtung, ...profilDaten }]
 * @param {string} lernrichtung - "smart" | "beide" | "en_de" | "de_en" | "abwechselnd"
 * @returns {Array} - fällige Karten [{ id, vokabelId, richtung, ... }]
 */
export function sindFaellig(karten, lernrichtung = 'smart') {
  const jetzt = Date.now()

  // Alle fälligen Karten filtern
  const faellig = karten.filter(k =>
    !k.naechsteFaelligkeit || k.naechsteFaelligkeit <= jetzt
  )

  // Bei "beide" und "smart": Session-Abstand-Regel anwenden
  if (lernrichtung === 'beide' || lernrichtung === 'smart') {
    // Gruppiere nach vokabelId
    const nachVokabel = {}
    for (const karte of faellig) {
      if (!nachVokabel[karte.vokabelId]) nachVokabel[karte.vokabelId] = []
      nachVokabel[karte.vokabelId].push(karte)
    }

    const ergebnis = []
    for (const [vokabelId, richtungen] of Object.entries(nachVokabel)) {
      if (richtungen.length <= 1) {
        // Nur eine Richtung fällig → kein Konflikt
        ergebnis.push(...richtungen)
      } else {
        // Beide Richtungen fällig → schwächere (niedrigere Stabilität) bevorzugen
        const schwaecher = richtungen.reduce((a, b) =>
          (a.stabilitaet ?? 1) <= (b.stabilitaet ?? 1) ? a : b
        )
        ergebnis.push(schwaecher)
        // Die stärkere Richtung wird NICHT in diese Session aufgenommen
      }
    }
    return ergebnis
  }

  // Einfache Richtung → alle fälligen zurückgeben
  return faellig
}


// ------------------------------------------------------------
// 6. Session zusammenstellen (Wiederholungen + Neue Karten)
// ------------------------------------------------------------

/**
 * Stellt eine komplette Lern-Session zusammen.
 *
 * Neue Karten = Karten ohne aktives Profil für die gewählte Richtung.
 * Wiederholungen = Karten mit Profil die heute fällig sind.
 *
 * Modi:
 *   'getrennt'  — erst alle Wiederholungen, dann Neue
 *   'gemischt'  — abwechselnd Wiederholung / Neu (wie Duolingo)
 *
 * @param {Array}  alleKarten        - aus ladeAlleKarten() (mit Profilen)
 * @param {object} einstellungen     - { lernrichtung, neueKartenProTag, neueKartenModus }
 * @param {object} heuteGesehen      - { [vokabelId]: true } bereits heute eingeführte neue Karten
 * @returns {{ session, wiederholungAnzahl, neuAnzahl }}
 */
export function ladeSessionKarten(alleKarten, einstellungen, heuteGesehen = {}) {
  const {
    lernrichtung    = 'smart',
    neueKartenProTag = 10,
    neueKartenModus  = 'getrennt',
  } = einstellungen

  // 1. Lernkarten aus alleKarten ableiten (mit Richtung + aktivProfil)
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
      // smart / beide → waehleRichtung pro Karte
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
      // Noch nie gesehen → Neue Karte
      neuKandidaten.push(karte)
    } else if (karte.aktivProfil.naechsteFaelligkeit <= jetzt) {
      // Profil vorhanden + fällig → Wiederholung
      wiederholungen.push(karte)
    }
    // Profil vorhanden aber noch nicht fällig → gar nicht in Session
  }

  // 3. Session-Abstand-Regel für Wiederholungen (smart/beide)
  const wiederholungenGefiltert =
    (lernrichtung === 'beide' || lernrichtung === 'smart')
      ? _sessionAbstandRegel(wiederholungen)
      : wiederholungen

  // 4. Neue Karten: max. neueKartenProTag, heute noch nicht gesehen
  // Round-Robin über alle Listen → faire Verteilung bei mehreren aktiven Listen
  const bereitsHeuteNeu = Object.keys(heuteGesehen).length
  const nochErlaubt     = Math.max(0, neueKartenProTag - bereitsHeuteNeu)
  const neuGefiltert    = neuKandidaten.filter(k => !heuteGesehen[k.id])
  const neueKarten      = _roundRobin(neuGefiltert, nochErlaubt)

  // 5. Session zusammenstellen
  let session
  if (neueKartenModus === 'gemischt') {
    session = _mischen(wiederholungenGefiltert, neueKarten)
  } else {
    // getrennt: erst Wiederholungen, dann Neue
    session = [...wiederholungenGefiltert, ...neueKarten]
  }

  return {
    session,
    wiederholungAnzahl: wiederholungenGefiltert.length,
    neuAnzahl:          neueKarten.length,
  }
}

/**
 * Verteilt neue Karten fair über alle Listen (Round-Robin).
 * Verhindert dass bei Limit=3 alle 3 aus der ersten Liste kommen.
 */
function _roundRobin(karten, limit) {
  if (limit <= 0) return []
  // Gruppiere nach listenId
  const gruppen = {}
  for (const k of karten) {
    const lid = k.listenId ?? '__eigen__'
    if (!gruppen[lid]) gruppen[lid] = []
    gruppen[lid].push(k)
  }
  const queues = Object.values(gruppen)
  const ergebnis = []
  let i = 0
  while (ergebnis.length < limit) {
    let fortschritt = false
    for (const q of queues) {
      if (ergebnis.length >= limit) break
      if (i < q.length) { ergebnis.push(q[i]); fortschritt = true }
    }
    if (!fortschritt) break
    i++
  }
  return ergebnis
}

/**
 * Session-Abstand-Regel intern (aus sindFaellig extrahiert).
 */
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

/**
 * Mischt zwei Arrays abwechselnd: [W, N, W, N, W, W, W...]
 * Wiederholungen und Neue wechseln sich ab, Rest wird angehängt.
 */
function _mischen(a, b) {
  const ergebnis = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length) ergebnis.push(a[i])
    if (i < b.length) ergebnis.push(b[i])
  }
  return ergebnis
}


// ------------------------------------------------------------
// 7. Hilfsfunktion: Profilstatus für eine Vokabel
// ------------------------------------------------------------

/**
 * Gibt einen lesbaren Status für Debug/Statistik zurück.
 */
export function profilStatus(en_de, de_en) {
  const fmt = (p) => p
    ? `Stab: ${p.stabilitaet?.toFixed(1)}, Int: ${p.intervall}d`
    : 'nicht vorhanden'

  return {
    en_de: fmt(en_de),
    de_en: fmt(de_en)
  }
}
