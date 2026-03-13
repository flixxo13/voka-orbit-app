// ============================================================
// VokaOrbit — src/core/fsrs.js
// Reiner FSRS-Algorithmus. Kein React, kein Firebase.
// Nur pure Functions — vollständig testbar ohne Side Effects.
// ============================================================


// ------------------------------------------------------------
// 1. FSRS Kern — Bewertung berechnen
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
// 2. Startprofil anlegen
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
    return {
      intervall: 0,
      wiederholungen: 0,
      stabilitaet: 1,
      naechsteFaelligkeit: jetzt,
      letzteWiederholung: null
    }
  }

  const neueStabilitaet = Math.max(0.5, quellProfil.stabilitaet * faktor)
  const neuesIntervall  = Math.max(1, Math.round(quellProfil.intervall * faktor))

  return {
    intervall:           neuesIntervall,
    wiederholungen:      Math.max(0, quellProfil.wiederholungen - 1),
    stabilitaet:         neueStabilitaet,
    naechsteFaelligkeit: jetzt + neuesIntervall * 24 * 60 * 60 * 1000,
    letzteWiederholung:  null
  }
}


// ------------------------------------------------------------
// 3. Richtungswechsel — alle 12 Kombinationen
// ------------------------------------------------------------

/**
 * Verwaltet den Übergang zwischen Lernrichtungen.
 * @param {string} vorher  - "en_de" | "de_en" | "beide" | "abwechselnd"
 * @param {string} nachher - "en_de" | "de_en" | "beide" | "abwechselnd"
 * @param {object} vorhandeneProfile - { en_de, de_en, abwechselnd }
 * @returns {{ aktiv: string[], neuAnlegen: { richtung, profil }[] }}
 */
export function handleRichtungswechsel(vorher, nachher, vorhandeneProfile) {
  const { en_de, de_en, abwechselnd } = vorhandeneProfile
  const aktiv = []
  const neuAnlegen = []

  if (nachher === 'en_de') {
    aktiv.push('en_de')
    if (!en_de) {
      const quelle = vorher === 'de_en' ? de_en : vorher === 'abwechselnd' ? abwechselnd : null
      const faktor = vorher === 'abwechselnd' ? 0.7 : 0.5
      neuAnlegen.push({ richtung: 'en_de', profil: erstelleStartProfil(quelle, faktor) })
    }
  }

  else if (nachher === 'de_en') {
    aktiv.push('de_en')
    if (!de_en) {
      const quelle = vorher === 'en_de' ? en_de : vorher === 'abwechselnd' ? abwechselnd : null
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
      let quelle = null
      let faktor = 0.5
      if (en_de && de_en) {
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
 * @param {{ en_de, de_en }} profile
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
  if (!en_de && !de_en) return 'en_de'
  if (!en_de) return 'en_de'
  if (!de_en) return 'de_en'

  const schwaeche_en_de = 1 / Math.max(0.1, en_de.stabilitaet)
  const schwaeche_de_en = 1 / Math.max(0.1, de_en.stabilitaet)
  const gesamt = schwaeche_en_de + schwaeche_de_en

  return Math.random() < (schwaeche_en_de / gesamt) ? 'en_de' : 'de_en'
}


// ------------------------------------------------------------
// 5. Fällige Karten bestimmen
// ------------------------------------------------------------

/**
 * Bestimmt welche Karten fällig sind.
 * Session-Abstand-Regel: beide Richtungen einer Vokabel können
 * nicht in derselben Session erscheinen — schwächere hat Vorrang.
 *
 * @param {Array} karten
 * @param {string} lernrichtung
 * @returns {Array} - fällige Karten
 */
export function sindFaellig(karten, lernrichtung = 'smart') {
  const jetzt = Date.now()

  const faellig = karten.filter(k =>
    !k.naechsteFaelligkeit || k.naechsteFaelligkeit <= jetzt
  )

  if (lernrichtung === 'beide' || lernrichtung === 'smart') {
    const nachVokabel = {}
    for (const karte of faellig) {
      if (!nachVokabel[karte.vokabelId]) nachVokabel[karte.vokabelId] = []
      nachVokabel[karte.vokabelId].push(karte)
    }

    const ergebnis = []
    for (const richtungen of Object.values(nachVokabel)) {
      if (richtungen.length <= 1) {
        ergebnis.push(...richtungen)
      } else {
        const schwaecher = richtungen.reduce((a, b) =>
          (a.stabilitaet ?? 1) <= (b.stabilitaet ?? 1) ? a : b
        )
        ergebnis.push(schwaecher)
      }
    }
    return ergebnis
  }

  return faellig
}


// ------------------------------------------------------------
// 6. Hilfsfunktion: Profilstatus
// ------------------------------------------------------------

export function profilStatus(en_de, de_en) {
  const fmt = (p) => p
    ? `Stab: ${p.stabilitaet?.toFixed(1)}, Int: ${p.intervall}d`
    : 'nicht vorhanden'
  return { en_de: fmt(en_de), de_en: fmt(de_en) }
}
