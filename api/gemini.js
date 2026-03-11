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

async function kiGenerieren(body) {
  const { wort, uebersetzung, richtung, niveau, lernziel } = body
  // WICHTIG: Prüfe hier, ob der Name in Vercel exakt übereinstimmt!
  const apiKey = process.env.OPENROUTER_API_KEY 
  const url = 'https://openrouter.ai/api/v1/chat/completions'
  
  // Aktuelle Gratis-Modelle (Stand März 2026)
  const models = [
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-small-24b-instruct:free',
    'google/gemma-3-27b:free',
    'openrouter/auto' // Letzter Rettungsanker: OpenRouter wählt selbst
  ]

  const prompt = `Erstelle für die Vokabel "${wort}" (${richtung}) ein JSON-Objekt: 
  {"beispielSatz": "...", "beispielSatzUebersetzung": "...", "eselsBruecke": "..."}. 
  Nur das JSON ausgeben, kein Text.`

  for (const modelId of models) {
    try {
      console.log(`📡 TESTE MODELL: ${modelId}`)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://voka-orbit.vercel.app', // Deine echte URL oder localhost
          'X-Title': 'VokaOrbit App',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5, // Etwas niedriger für stabileres JSON
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content ?? ''
        const cleanJson = content.replace(/```json|```/g, '').trim()
        console.log(`✅ ERFOLG mit ${modelId}`)
        return JSON.parse(cleanJson)
      } else {
        const errorText = await response.text()
        console.error(`❌ FEHLER bei ${modelId}: Status ${response.status} - ${errorText}`)
      }
    } catch (e) {
      console.error(`💥 CRASH bei ${modelId}:`, e.message)
    }
  }
  throw new Error("Keines der KI-Modelle hat geantwortet. Prüfe deine OpenRouter Keys.")
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const { wort, uebersetzung, richtung } = req.body
    const cacheKey = `${(wort || 'empty').toLowerCase()}_${richtung}`
    const cacheRef = db.collection('vokabelHints').doc(cacheKey)
    const cacheSnap = await cacheRef.get()

    if (cacheSnap.exists) {
      console.log("📦 Cache-Treffer!")
      return res.status(200).json({ ...cacheSnap.data(), cached: true })
    }

    const ergebnis = await kiGenerieren(req.body)
    const finalData = { ...ergebnis, wort, uebersetzung, richtung, erstellt: Date.now() }
    
    await cacheRef.set(finalData)
    return res.status(200).json({ ...finalData, cached: false })

  } catch (err) {
    console.error('API GLOBAL ERROR:', err.message)
    return res.status(500).json({ 
      error: 'KI-Fehler', 
      details: err.message,
      check: "Schau in die Vercel-Logs (Logs -> Functions) für Details zu Status 401/402."
    })
  }
}
