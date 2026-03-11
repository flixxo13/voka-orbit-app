// ============================================================
// VokaOrbit — api/gemini.js
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

// Fallback-Liste: erstes verfügbares Modell gewinnt
const MODELLE = [
  'deepseek/deepseek-chat-v3-0324:free',
  'mistralai/mistral-small-24b-instruct:free',
  'google/gemma-3-27b:free',
  'meta-llama/llama-4-scout:free',
]

async function kiGenerieren({ wort, uebersetzung, richtung, niveau, lernziel }) {
  const apiKey = process.env.OPENROUTER_API_KEY
  const url = 'https://openrouter.ai/api/v1/chat/completions'

  const vonSprache  = richtung === 'en_de' ? 'Englisch' : 'Deutsch'
  const nachSprache = richtung === 'en_de' ? 'Deutsch'  : 'Englisch'
  const lernwort    = richtung === 'en_de' ? wort : uebersetzung
  const zielbegriff = richtung === 'en_de' ? uebersetzung : wort

  const lernzielText = {
    reisen: 'Reisen & Urlaub', business: 'Business & Karriere',
    studium: 'Studium & Schule', alltag: 'Kultur & Alltag',
  }[lernziel] ?? 'Alltag'

  const prompt = `Du bist ein Sprachlern-Assistent für deutsche Muttersprachler die ${vonSprache} lernen.

Vokabel: "${lernwort}" → "${zielbegriff}" (${vonSprache} → ${nachSprache})
Niveau: ${niveau ?? 'B1'}, Kontext: ${lernzielText}

Antworte NUR mit diesem JSON, kein Markdown, kein Text drumherum:
{"beispielSatz":"Ein ${vonSprache}er Satz mit '${lernwort}' passend zu Niveau ${niveau ?? 'B1'} und ${lernzielText}","beispielSatzUebersetzung":"Genaue ${nachSprache} Übersetzung des Satzes","eselsBruecke":"Kreative deutsche Eselsbrücke die '${lernwort}' mit '${zielbegriff}' verknüpft. Klang, Bild oder Geschichte. Max 2 Sätze."}`

  for (const modell of MODELLE) {
    try {
      console.log(`Teste Modell: ${modell}`)
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://voka-orbit-app.vercel.app',
          'X-Title': 'VokaOrbit',
        },
        body: JSON.stringify({
          model: modell,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 400,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content ?? ''
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        console.log(`Erfolg mit ${modell}`)
        return parsed
      } else {
        const err = await res.text()
        console.error(`Fehler bei ${modell}: ${res.status} — ${err}`)
      }
    } catch (e) {
      console.error(`Crash bei ${modell}: ${e.message}`)
    }
  }
  throw new Error('Kein Modell verfügbar — alle Fallbacks fehlgeschlagen')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { vokabelId, wort, uebersetzung, richtung, niveau, lernziel } = req.body ?? {}

  if (!wort || !uebersetzung || !richtung) {
    return res.status(400).json({ error: 'wort, uebersetzung und richtung sind Pflichtfelder' })
  }

  try {
    // Cache prüfen
    const cacheKey = `${vokabelId ?? wort.toLowerCase()}_${richtung}`
    const cacheRef = db.collection('vokabelHints').doc(cacheKey)
    const cacheSnap = await cacheRef.get()

    if (cacheSnap.exists) {
      return res.status(200).json({ ...cacheSnap.data(), cached: true })
    }

    // KI aufrufen
    const ergebnis = await kiGenerieren({ wort, uebersetzung, richtung, niveau, lernziel })

    // Cachen
    const finalData = { ...ergebnis, wort, uebersetzung, richtung, erstellt: Date.now() }
    await cacheRef.set(finalData)

    return res.status(200).json({ ...finalData, cached: false })

  } catch (err) {
    console.error('gemini.js Fehler:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
