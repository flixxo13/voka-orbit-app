// ============================================================
// VokaOrbit — api/gemini.js
// ============================================================
// Vercel Serverless Function
// POST /api/gemini
//
// Body: { vokabelId, wort, uebersetzung, richtung, niveau, lernziel }
// Response: { beispielSatz, beispielSatzUebersetzung, eselsBruecke }
//
// Caching: Firestore vokabelHints/{vokabelId}_{richtung}
// ============================================================

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

// ── Gemini Flash aufrufen ─────────────────────────────────
async function geminiGenerieren({ wort, uebersetzung, richtung, niveau, lernziel }) {
  const apiKey = process.env.GEMINI_API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  // Richtungsabhängige Prompt-Logik
  const vonSprache = richtung === 'en_de' ? 'Englisch' : 'Deutsch'
  const nachSprache = richtung === 'en_de' ? 'Deutsch' : 'Englisch'
  const lernwort = richtung === 'en_de' ? wort : uebersetzung
  const zielbegriff = richtung === 'en_de' ? uebersetzung : wort

  // Lernziel auf Deutsch
  const lernzielText = {
    reisen:   'Reisen & Urlaub',
    business: 'Business & Karriere',
    studium:  'Studium & Schule',
    alltag:   'Kultur & Alltag',
  }[lernziel] ?? 'Alltag'

  const prompt = `Du bist ein Sprachlern-Assistent für deutsche Muttersprachler die ${vonSprache} lernen.

Vokabel: "${lernwort}" bedeutet auf ${nachSprache} "${zielbegriff}"
Niveau des Lernenden: ${niveau ?? 'B1'}
Lernziel: ${lernzielText}
Lernrichtung: ${vonSprache} → ${nachSprache}

Erstelle genau das folgende JSON-Objekt (kein Markdown, keine Erklärung, nur JSON):
{
  "beispielSatz": "Ein ${vonSprache}er Beispielsatz mit dem Wort '${lernwort}', angepasst an Niveau ${niveau ?? 'B1'} und Kontext ${lernzielText}. Nicht zu schwer, nicht zu einfach.",
  "beispielSatzUebersetzung": "Die genaue ${nachSprache} Übersetzung des Beispielsatzes",
  "eselsBruecke": "Eine kreative deutsche Eselsbrücke die hilft '${lernwort}' mit '${zielbegriff}' zu verknüpfen. Nutze Klang-Ähnlichkeiten, Bilder oder Geschichten. Auf Deutsch! Maximal 2 Sätze."
}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API Fehler: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // JSON aus Antwort extrahieren (auch wenn Gemini Backticks liefert)
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── Haupt-Handler ─────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { vokabelId, wort, uebersetzung, richtung, niveau, lernziel } = req.body ?? {}

  if (!wort || !uebersetzung || !richtung) {
    return res.status(400).json({ error: 'wort, uebersetzung und richtung sind Pflichtfelder' })
  }

  try {
    // ── 1. Cache prüfen ──────────────────────────────────
    const cacheKey = `${vokabelId ?? wort}_${richtung}`
    const cacheRef = db.collection('vokabelHints').doc(cacheKey)
    const cacheSnap = await cacheRef.get()

    if (cacheSnap.exists) {
      const cached = cacheSnap.data()
      return res.status(200).json({
        ...cached,
        cached: true,
      })
    }

    // ── 2. Gemini aufrufen ───────────────────────────────
    const ergebnis = await geminiGenerieren({ wort, uebersetzung, richtung, niveau, lernziel })

    // ── 3. In Firestore cachen ───────────────────────────
    await cacheRef.set({
      beispielSatz: ergebnis.beispielSatz,
      beispielSatzUebersetzung: ergebnis.beispielSatzUebersetzung,
      eselsBruecke: ergebnis.eselsBruecke,
      wort,
      uebersetzung,
      richtung,
      erstellt: Date.now(),
    })

    return res.status(200).json({
      ...ergebnis,
      cached: false,
    })

  } catch (err) {
    console.error('gemini.js Fehler:', err)
    return res.status(500).json({ error: err.message })
  }
}
