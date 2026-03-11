// ============================================================
// VokaOrbit — api/gemini.js (STABLE VERSION 2026.03.11)
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

// Aktuelle Free-Modelle für OpenRouter
const MODELLE = [
  'google/gemini-2.0-flash-lite:free', // Sehr schnell, war in deinem Log erfolgreich
  'mistralai/mistral-small-24b-instruct:free',
  'google/gemma-3-27b:free',
  'openrouter/auto'
]

async function kiGenerieren(body) {
  const { wort, uebersetzung, richtung, niveau, lernziel } = body
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) throw new Error("API-Key 'OPENROUTER_API_KEY' nicht gefunden!")

  const url = 'https://openrouter.ai/api/v1/chat/completions'
  const vonSprache = richtung === 'en_de' ? 'Englisch' : 'Deutsch'
  const nachSprache = richtung === 'en_de' ? 'Deutsch' : 'Englisch'
  const lernwort = richtung === 'en_de' ? wort : uebersetzung
  const zielbegriff = richtung === 'en_de' ? uebersetzung : wort

  // VERBESSERTER PROMPT gegen Verwechslungen (wie plane/plan)
  const prompt = `Du bist ein präziser Sprachlern-Assistent.
Vokabel: "${lernwort}"
Übersetzung: "${zielbegriff}"
WICHTIG: Erstelle den Beispielsatz NUR für die Bedeutung "${zielbegriff}". Verwechsle es nicht mit ähnlich klingenden Wörtern!

Gib NUR ein JSON-Objekt aus:
{
  "beispielSatz": "Ein Satz auf ${vonSprache} mit '${lernwort}', Niveau ${niveau ?? 'B1'}.",
  "beispielSatzUebersetzung": "Übersetzung auf ${nachSprache}",
  "eselsBruecke": "Deutsche Eselsbrücke für '${lernwort}' = '${zielbegriff}', max. 2 Sätze."
}`

  for (const modell of MODELLE) {
    try {
      console.log(`Versuche: ${modell}`)
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.toString().trim()}`, // Sicherer als nur .trim()
          'HTTP-Referer': 'https://voka-orbit-app.vercel.app',
          'X-Title': 'VokaOrbit',
        },
        body: JSON.stringify({
          model: modell,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4, // Niedriger für mehr Präzision
          response_format: { type: "json_object" } // Zwingt viele Modelle zu JSON
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content ?? ''
        
        // Findet das JSON-Objekt, selbst wenn Text drumherum steht
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start === -1 || end === -1) throw new Error("Kein JSON gefunden")
        
        const jsonString = text.substring(start, end + 1)
        return JSON.parse(jsonString)
      }
    } catch (e) {
      console.error(`Fehlgeschlagen mit ${modell}: ${e.message}`)
    }
  }
  throw new Error('Alle KI-Modelle haben versagt.')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const { wort, uebersetzung, richtung } = req.body
    if (!wort || !uebersetzung) throw new Error("Daten unvollständig")

    const cacheKey = `${wort.toLowerCase()}_${richtung}`
    const cacheRef = db.collection('vokabelHints').doc(cacheKey)
    const cacheSnap = await cacheRef.get()

    if (cacheSnap.exists) {
      return res.status(200).json({ ...cacheSnap.data(), cached: true })
    }

    const ergebnis = await kiGenerieren(req.body)
    const finalData = { ...ergebnis, wort, uebersetzung, richtung, erstellt: Date.now() }
    
    await cacheRef.set(finalData)
    return res.status(200).json({ ...finalData, cached: false })

  } catch (err) {
    console.error('SERVER ERROR:', err.message)
    return res.status(500).json({ error: 'KI-Fehler', details: err.message })
  }
}
