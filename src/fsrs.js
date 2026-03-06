// Vereinfachter FSRS Algorithmus
export function berechneNaechsteWiederholung(karte, bewertung) {
  const jetzt = Date.now()
  let { intervall = 1, wiederholungen = 0, stabilitaet = 1 } = karte

  if (bewertung === 1) {
    // Nochmal - zurücksetzen
    intervall = 1
    wiederholungen = 0
    stabilitaet = Math.max(1, stabilitaet * 0.5)
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

  const naechsteFaelligkeit = jetzt + intervall * 24 * 60 * 60 * 1000

  return {
    intervall,
    wiederholungen,
    stabilitaet,
    naechsteFaelligkeit,
    letzteWiederholung: jetzt
  }
}

export function sindFaellig(vokabeln) {
  const jetzt = Date.now()
  return vokabeln.filter(v => 
    !v.naechsteFaelligkeit || v.naechsteFaelligkeit <= jetzt
  )
}