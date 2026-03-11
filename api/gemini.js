// ============================================================
// VokaOrbit — api/gemini.js (DEBUG & FALLBACK VERSION)
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

async function kiGenerieren({ wort, uebersetzung, richtung, niveau, lernziel }) {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error("API-Key fehlt! Bitte in Vercel 'OPENROUTER_API_KEY' anlegen und neu deployen.")
  }

  const url = 'https://openrouter.ai/api/v1/chat/completions'
  
  // Liste an kostenlosen Modellen (Fallback-Strategie für 2026)
  const models = [
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-24b-instruct:free',
    'google/gemma-3-27b:free'
  ]

  const prompt = `Du bist Sprach-Assistent. Vokabel: "${wort}" (${richtung}). Erstelle JSON: {"beispielSatz": "...", "beispielSatzUebersetzung": "...", "eselsBruecke": "..."}`

  for (const modelId of models) {
    try {
      console.log(`Versuche Modell: ${modelId}...`)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://voka-orbit-app.vercel.app',
          'X-Title': 'VokaOrbit',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content ?? ''
        const cleanJson = content.replace(/```json|```/g, '').trim()
        return JSON.parse(cleanJson)
      }
    } catch (e) {
      console.error(`Fehler mit ${modelId}:`, e.message)
      continue // Probiere das nächste Modell in der Liste
    }
  }
  
  throw new Error("Alle kostenlosen Modelle sind derzeit nicht erreichbar.")
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed')

  try {
    const { wort, uebersetzung, richtung } = req.body
    
    // Cache Check
    const cacheKey = `${wort.toLowerCase()}_${richtung}`
    const cacheRef = db.collection('vokabelHints').doc(cacheKey)
    const cacheSnap = await cacheRef.get()

    if (cacheSnap.exists) {
      return res.status(200).json({ ...cacheSnap.data(), cached: true })
    }

    const ergebnis = await kiGenerieren(req.body)
    await cacheRef.set({ ...ergebnis, erstellt: Date.now() })

    return res.status(200).json({ ...ergebnis, cached: false })
  } catch (err) {
    // Hier geben wir jetzt die exakte Fehlermeldung nach außen, damit du siehst, was schiefläuft
    return res.status(500).json({ 
      error: 'KI-Fehler', 
      details: err.message,
      hint: "Hast du nach dem Hinzufügen des Keys in Vercel neu deployt?"
    })
  }
}
