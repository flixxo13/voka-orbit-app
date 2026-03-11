// ============================================================
// VokaOrbit — api/gemini.js (Optimiert für OpenRouter Free)
// ============================================================

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// ── Firebase Admin Initialisierung ─────────────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

// ── KI-Generierung via OpenRouter ──────────────────────────
async function kiGenerieren({ wort, uebersetzung, richtung, niveau, lernziel }) {
  // WICHTIG: Nutzt den Key, den du in Vercel als OPENROUTER_API_KEY angelegt hast
  const apiKey = process.env.OPENROUTER_API_KEY
  const url = 'https://openrouter.ai/api/v1/chat/completions'

  const vonSprache = richtung === 'en_de' ? 'Englisch' : 'Deutsch'
  const nachSprache = richtung === 'en_de' ? 'Deutsch' : 'Englisch'
  const lernwort = richtung === 'en_de' ? wort : uebersetzung
  const zielbegriff = richtung === 'en_de' ? uebersetzung : wort

  const lernzielText = {
    reisen:   'Reisen & Urlaub',
    business: 'Business & Karriere',
    studium:  'Studium & Schule',
    alltag:   'Kultur & Alltag',
  }[lernziel] ?? 'Alltag'

  const prompt = `Du bist ein Sprachlern-Assistent für deutsche Muttersprachler.
Vokabel: "${lernwort}" bedeutet auf ${nachSprache} "${zielbegriff}"
Niveau: ${niveau ?? 'B1'} | Kontext: ${lernzielText}

Erstelle genau dieses JSON-Objekt (kein Text drumherum):
{
  "beispielSatz": "Ein Beispielsatz in ${vonSprache} mit '${lernwort}', Niveau ${niveau ?? 'B1'}.",
  "beispielSatzUebersetzung": "Deutsche Übersetzung des Satzes",
  "eselsBruecke": "Eine kreative deutsche Eselsbrücke (Klang/Bild), max. 2 Sätze."
}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://voka-orbit-app.vercel.app',
      'X-Title': 'VokaOrbit',
    },
    body: JSON.stringify({
      // Nutzt das kostenlose Gemini 2.0 Modell über OpenRouter
      model: 'google/gemini-2.0-flash-exp:free', 
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter Fehler: ${response.status} — ${errText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? ''

  // Bereinigt Markdown-Code-Blöcke, falls die KI welche mitsendet
  const cleanJson = content.replace(/```json|```/g, '').trim()
  return JSON.parse(cleanJson)
}

// ── Haupt-Handler (API Route) ──────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' })
  }

  const { vokabelId, wort, uebersetzung, richtung, niveau, lernziel } = req.body ?? {}

  if (!wort || !uebersetzung) {
    return res.status(400).json({ error: 'Fehlende Daten (wort/uebersetzung)' })
  }

  try {
    // 1. Im Firestore-Cache nachsehen
    const cacheKey = `${vokabelId || wort.toLowerCase()}_${richtung}`
    const cacheRef = db.collection('vokabelHints').doc(cacheKey)
    const cacheSnap = await cacheRef.get()

    if (cacheSnap.exists) {
      return res.status(200).json({ ...cacheSnap.data(), cached: true })
    }

    // 2. Neue Daten generieren
    const ergebnis = await kiGenerieren({ wort, uebersetzung, richtung, niveau, lernziel })

    // 3. Ergebnis für die Zukunft speichern
    const safeData = {
      beispielSatz: ergebnis.beispielSatz,
      beispielSatzUebersetzung: ergebnis.beispielSatzUebersetzung,
      eselsBruecke: ergebnis.eselsBruecke,
      wort,
      uebersetzung,
      richtung,
      erstellt: Date.now(),
    }
    await cacheRef.set(safeData)

    return res.status(200).json({ ...safeData, cached: false })

  } catch (err) {
    console.error('VokaOrbit API Error:', err.message)
    return res.status(500).json({ error: 'KI-Generierung fehlgeschlagen', details: err.message })
  }
}
