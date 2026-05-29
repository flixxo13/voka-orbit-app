Gemini: 

Beispiele für die Sonnenanimation: 

<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocaOrbit - Sun Final Design Test</title>
  <style>
    /* ============================================================
       VOKAORBIT CORE STYLES (Aus deinem Design-System extrahiert)
       ============================================================ */
    :root {
      --bg-deep: #0A0A2E;
      --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
      --ease-orbit: cubic-bezier(0.23, 1, 0.32, 1);
      
      /* Exakte Größe aus deinem OrbitHintSystem React-Code (56px * Skalierung) */
      --sun-size: 70px; 
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-deep);
      /* Originaler localized Nebula-Glow hinter der Sonne */
      background-image: 
        radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 60%),
        radial-gradient(circle at center, #161245 0%, #060417 100px);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      font-family: var(--font-sans);
    }

    /* Localized Starfield Simulation */
    .starfield {
      position: absolute;
      inset: 0;
      opacity: 0.4;
      background-image: 
        radial-gradient(1px 1px at 20px


<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocaOrbit - Sun High-Contrast Test</title>
  <style>
    :root {
      --bg-deep: #0A0A2E;
      --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
      --sun-size: 100px; /* Etwas größer zum besseren Beurteilen */
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-deep);
      background-image: radial-gradient(circle at center, #161245 0%, #060417 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      font-family: var(--font-sans);
    }

    .sun-container {
      position: relative;
      width: var(--sun-size);
      height: var(--sun-size);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Pulsierende Aura / Korona */
    .sun-aura-container {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: sun-aura-pulse 4s ease-in-out infinite;
    }

    /* Die Kugel-Basis mit starkem Tiefenverlauf (Dunklerer Rand für 3D-Effekt) */
    .sun-sphere {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      overflow: hidden;
      background: radial-gradient(circle at 35% 35%, #ffffff 0%, #ffeb3b 25%, #ff6d00 60%, #b71c1c 90%, #3e0000 100%);
      transform-style: preserve-3d;
      box-shadow: inset -6px -6px 14px rgba(0, 0, 0, 0.6);
    }

    /* DEUTLICH SICHTBARE TEXTUR: Sichtbare, geschwungene Wellen-Bänder */
    .sun-layer-base {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        linear-gradient(
          45deg,
          transparent 0%,
          transparent 25%,
          rgba(255, 255, 255, 0.4) 28%, /* Helle, sichtbare Strömung */
          rgba(255, 235, 59, 0.5) 32%,
          transparent 38%,
          transparent 60%,
          rgba(230, 81, 0, 0.4) 65%,  /* Dunklere Plasma-Welle */
          transparent 72%
        ),
        linear-gradient(
          -25deg,
          transparent 10%,
          rgba(255, 255, 255, 0.3) 20%,
          transparent 35%,
          transparent 65%,
          rgba(183, 28, 28, 0.5) 75%,
          transparent 90%
        );
      
      filter: blur(2px); /* Etwas schärfer als vorher, damit man die Struktur sieht */
      mix-blend-mode: normal; /* "normal" statt "overlay" sorgt dafür, dass die Farben nicht verschlucken */
      opacity: 0.85;
      animation: sun-texture-flow 20s ease-in-out infinite alternate;
      will-change: transform;
    }

    /* Zusätzliche Kontrast-Schicht für Strukturen im Schattenbereich */
    .sun-layer-detail {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        linear-gradient(
          135deg,
          transparent 30%,
          rgba(255, 255, 255, 0.25) 35%,
          transparent 45%,
          rgba(0, 0, 0, 0.3) 70%,
          transparent 80%
        );
      filter: blur(3px);
      mix-blend-mode: overlay;
      opacity: 0.9;
      animation: sun-texture-flow 14s ease-in-out infinite alternate-reverse;
      will-change: transform;
    }

    /* Glühender Core-Flare im Zentrum */
    .sun-core-flare {
      position: absolute;
      width: 30%;
      height: 30%;
      border-radius: 50%;
      background: radial-gradient(circle, #ffffff 40%, rgba(255,255,255,0) 100%);
      filter: blur(1px);
      box-shadow: 0 0 14px 4px rgba(255, 255, 255, 1);
      z-index: 2;
    }

    /* ANIMATIONEN */
    @keyframes sun-texture-flow {
      0% { transform: translate(0, 0) scale(1) rotate(0deg); }
      50% { transform: translate(-8%, -4%) scale(1.06) rotate(8deg); }
      100% { transform: translate(-3%, -9%) scale(0.95) rotate(-6deg); }
    }

    @keyframes sun-aura-pulse {
      0%, 100% { 
        box-shadow: 
          inset 0 0 10px rgba(255, 255, 255, 0.5),
          0 0 20px rgba(255, 111, 0, 0.6),
          0 0 40px rgba(255, 61, 0, 0.35);
      }
      50% { 
        box-shadow: 
          inset 0 0 14px rgba(255, 255, 255, 0.6),
          0 0 30px rgba(255, 145, 0, 0.85),
          0 0 60px rgba(255, 87, 34, 0.5);
      }
    }
  </style>
</head>
<body>

  <div class="sun-container">
    <div class="sun-aura-container">
      <div class="sun-sphere">
        <div class="sun-layer-base"></div>
        <div class="sun-layer-detail"></div>
      </div>
      <div class="sun-core-flare"></div>
    </div>
  </div>

</body>
</html>


<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocaOrbit - Professional Sun Animation</title>
  <style>
    /* Globaler Design-System-Reset */
    body {
      margin: 0;
      padding: 0;
      background-color: #0A0A2E;
      background-image: radial-gradient(circle at center, #161245 0%, #060417 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      font-family: system-ui, sans-serif;
    }

    :root {
      --sun-size: 120px; /* Perfekt skalierbar */
    }

    .sun-container {
      position: relative;
      width: var(--sun-size);
      height: var(--sun-size);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 3D-KUGELBASIS (Mit starkem volumetrischen Schattenwurf) */
    .sun-sphere {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      overflow: hidden;
      /* Erzeugt die extreme Wölbung (Rim-Light oben links, Schatten unten rechts) */
      background: radial-gradient(circle at 30% 30%, #ffffff 0%, #ffeb3b 20%, #ff7600 55%, #d84315 85%, #4a0e00 100%);
      box-shadow: 
        inset -8px -8px 20px rgba(0, 0, 0, 0.7),
        inset 6px 6px 12px rgba(255, 255, 255, 0.6);
      transform-style: preserve-3d;
      z-index: 1;
    }

    /* TEXTUR-EBENE 1: Helle, fließende Plasmabänder */
    .sun-layer-base {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        repeating-linear-gradient(
          45deg,
          transparent 0px,
          transparent 15px,
          rgba(255, 255, 255, 0.25) 18px, /* Knackige, sichtbare Kante */
          rgba(255, 235, 59, 0.4) 24px,
          transparent 30px,
          transparent 55px,
          rgba(255, 145, 0, 0.25) 60px,
          transparent 70px
        );
      filter: blur(2px); /* Weich genug für Gas-Optik, scharf genug für Sichtbarkeit */
      mix-blend-mode: color-dodge; /* Holt das Maximum an Leuchtkraft heraus */
      opacity: 0.9;
      animation: sun-drift-left 28s linear infinite;
      will-change: transform;
    }

    /* TEXTUR-EBENE 2: Dunklere, rotierende Sturmbänder für plastische Tiefe */
    .sun-layer-detail {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        repeating-linear-gradient(
          -25deg,
          transparent 0px,
          transparent 25px,
          rgba(216, 67, 21, 0.4) 30px, /* Dunkelrot gegen die Monotonie */
          rgba(74, 14, 0, 0.5) 40px,
          transparent 45px,
          transparent 70px,
          rgba(255, 255, 255, 0.15) 75px,
          transparent 85px
        );
      filter: blur(3px);
      mix-blend-mode: multiply; /* Dunkelt die Täler organisch ab */
      opacity: 0.8;
      animation: sun-drift-right 20s linear infinite;
      will-change: transform;
    }

    /* STRUKTURIERTE AURA (Pulsierender Außen-Glow) */
    .sun-aura {
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      z-index: 0;
      animation: sun-aura-pulse 4s ease-in-out infinite alternate;
    }

    /* CORE LENS-FLARE (Macht das Zentrum unendlich heiß) */
    .sun-core-flare {
      position: absolute;
      width: 30%;
      height: 30%;
      border-radius: 50%;
      background: radial-gradient(circle, #ffffff 40%, rgba(255,255,255,0) 100%);
      filter: blur(1px);
      box-shadow: 0 0 20px 6px #ffffff;
      z-index: 2;
      opacity: 0.95;
    }


    /* ============================================================
       GPU-BESCHLEUNIGTE ANIMATIONEN (Schont den Akku komplett)
       ============================================================ */
    
    /* Nahtloser horizontaler Drift nach links */
    @keyframes sun-drift-left {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      100% { transform: translate3d(-15%, -5%, 0) rotate(360deg); }
    }

    /* Gegenläufiger Drift nach rechts für den 3D-Effekt */
    @keyframes sun-drift-right {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      100% { transform: translate3d(10%, 8%, 0) rotate(-360deg); }
    }

    /* Atmosphärisches Atmen */
    @keyframes sun-aura-pulse {
      0% {
        box-shadow: 
          0 0 25px rgba(255, 111, 0, 0.5),
          0 0 50px rgba(245, 158, 11, 0.3);
        transform: scale(0.98);
      }
      100% {
        box-shadow: 
          0 0 35px rgba(255, 145, 0, 0.85),
          0 0 75px rgba(255, 61, 0, 0.45);
        transform: scale(1.02);
      }
    }
  </style>
</head>
<body>

  <div class="sun-container">
    <div class="sun-aura"></div>
    <div class="sun-sphere">
      <div class="sun-layer-base"></div>
      <div class="sun-layer-detail"></div>
    </div>
    <div class="sun-core-flare"></div>
  </div>

</body>
</html>


<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocaOrbit - Perfect Cinematic Sun</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0A0A2E;
      background-image: radial-gradient(circle at center, #161245 0%, #060417 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    :root {
      --sun-size: 130px;
    }

    .sun-container {
      position: relative;
      width: var(--sun-size);
      height: var(--sun-size);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 3D-KUGELBASIS */
    .sun-sphere {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      overflow: hidden;
      /* Weichere Farbübergänge in der Basis, um harte Kanten abzufangen */
      background: radial-gradient(circle at 35% 35%, #ffffff 0%, #fff59d 15%, #ffb300 45%, #e65100 75%, #210400 100%);
      box-shadow: 
        inset -10px -10px 25px rgba(0, 0, 0, 0.75),
        inset 6px 6px 16px rgba(255, 255, 255, 0.5);
      transform-style: preserve-3d;
      z-index: 1;
    }

    /* TEXTUR-EBENE 1: Organisch fließende Plasmabänder (Weichere Winkel) */
    .sun-layer-base {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        linear-gradient(
          35deg,
          transparent 0%,
          transparent 30%,
          rgba(255, 255, 255, 0.22) 33%, 
          rgba(255, 235, 59, 0.35) 38%,
          transparent 44%,
          transparent 60%,
          rgba(255, 111, 0, 0.25) 66%,
          transparent 72%
        ),
        linear-gradient(
          -15deg,
          transparent 15%,
          rgba(255, 255, 255, 0.15) 25%,
          transparent 40%,
          transparent 60%,
          rgba(183, 28, 28, 0.35) 75%,
          transparent 90%
        );
      
      filter: blur(4px); /* Höherer Blur nimmt die metallische Härte raus */
      mix-blend-mode: color-dodge;
      opacity: 0.95;
      animation: sun-drift-left 32s linear infinite;
      will-change: transform;
    }

    /* TEXTUR-EBENE 2: Konvektionsströme für Tiefenwirkung */
    .sun-layer-detail {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        linear-gradient(
          145deg,
          transparent 25%,
          rgba(255, 255, 255, 0.15) 32%,
          transparent 45%,
          rgba(33, 4, 0, 0.4) 65%,
          transparent 80%
        );
      filter: blur(5px);
      mix-blend-mode: overlay;
      opacity: 0.9;
      animation: sun-drift-right 24s linear infinite;
      will-change: transform;
    }

    /* PULSIERENDE KORONA (Sanfter Übergang ins All ohne harte Begrenzung) */
    .sun-aura {
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      z-index: 0;
      mix-blend-mode: screen;
      animation: sun-aura-pulse 4s ease-in-out infinite alternate;
    }

    /* GLEIẞENDER CORE (Zentrum des Sterns) */
    .sun-core-flare {
      position: absolute;
      width: 28%;
      height: 28%;
      border-radius: 50%;
      background: radial-gradient(circle, #ffffff 50%, rgba(255,255,255,0) 100%);
      filter: blur(1px);
      box-shadow: 0 0 22px 8px #ffffff;
      z-index: 2;
      opacity: 0.95;
    }

    /* ============================================================
       KEYFRAMES
       ============================================================ */
    @keyframes sun-drift-left {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      100% { transform: translate3d(-10%, -3%, 0) rotate(360deg); }
    }

    @keyframes sun-drift-right {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      100% { transform: translate3d(8%, 5%, 0) rotate(-360deg); }
    }

    @keyframes sun-aura-pulse {
      0% {
        box-shadow: 
          0 0 20px 4px rgba(255, 111, 0, 0.6),
          0 0 40px 12px rgba(245, 158, 11, 0.35);
        transform: scale(0.97);
      }
      100% {
        box-shadow: 
          0 0 35px 8px rgba(255, 145, 0, 0.85),
          0 0 65px 20px rgba(255, 61, 0, 0.5);
        transform: scale(1.03);
      }
    }
  </style>
</head>
<body>

  <div class="sun-container">
    <div class="sun-aura"></div>
    <div class="sun-sphere">
      <div class="sun-layer-base"></div>
      <div class="sun-layer-detail"></div>
    </div>
    <div class="sun-core-flare"></div>
  </div>

</body>
</html>


<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocaOrbit - Natural Sun Animation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0A0A2E;
      background-image: radial-gradient(circle at center, #161245 0%, #060417 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    :root {
      --sun-size: 130px;
    }

    /* Der Hauptcontainer atmet jetzt als Ganzes mit, wodurch der "äußere Balken" komplett verschwindet */
    .sun-container {
      position: relative;
      width: var(--sun-size);
      height: var(--sun-size);
      display: flex;
      align-items: center;
      justify-content: center;
      /* Ein extrem weicher Schatten nach außen ersetzt die harte Begrenzungslinie */
      filter: drop-shadow(0 0 20px rgba(255, 111, 0, 0.4));
      animation: sun-global-pulse 5s ease-in-out infinite alternate;
    }

    /* 3D-KUGELBASIS (Kanten komplett aufgweicht) */
    .sun-sphere {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      overflow: hidden;
      /* Der radiale Verlauf blendet am äußersten Rand weich in das Rot-Braun über */
      background: radial-gradient(circle at 35% 35%, #ffffff 0%, #fff59d 18%, #ffb300 48%, #e65100 78%, #3d0a00 98%, transparent 100%);
      box-shadow: 
        inset -10px -10px 25px rgba(0, 0, 0, 0.8),
        inset 6px 6px 16px rgba(255, 255, 255, 0.4);
      transform-style: preserve-3d;
      z-index: 1;
    }

    /* TEXTUR-EBENE 1: Fließende Plasmabänder */
    .sun-layer-base {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        linear-gradient(
          35deg,
          transparent 0%,
          transparent 32%,
          rgba(255, 255, 255, 0.2) 35%, 
          rgba(255, 235, 59, 0.3) 40%,
          transparent 46%,
          transparent 62%,
          rgba(255, 111, 0, 0.2) 68%,
          transparent 74%
        ),
        linear-gradient(
          -15deg,
          transparent 15%,
          rgba(255, 255, 255, 0.12) 25%,
          transparent 40%,
          transparent 60%,
          rgba(183, 28, 28, 0.3) 75%,
          transparent 90%
        );
      
      filter: blur(4px);
      mix-blend-mode: color-dodge;
      opacity: 0.95;
      animation: sun-drift-left 32s linear infinite;
      will-change: transform;
    }

    /* TEXTUR-EBENE 2: Konvektionsströme */
    .sun-layer-detail {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        linear-gradient(
          145deg,
          transparent 25%,
          rgba(255, 255, 255, 0.12) 32%,
          transparent 45%,
          rgba(33, 4, 0, 0.35) 65%,
          transparent 80%
        );
      filter: blur(5px);
      mix-blend-mode: overlay;
      opacity: 0.9;
      animation: sun-drift-right 24s linear infinite;
      will-change: transform;
    }

    /* NATÜRLICH PULSIERENDER AUSSEN-GLOW (Verschmilzt nahtlos mit der Kugel) */
    .sun-aura {
      position: absolute;
      inset: -10px;
      border-radius: 50%;
      z-index: 0;
      mix-blend-mode: screen;
      /* Eigenes, leicht versetztes Atmen für organischen Flow */
      animation: sun-aura-breathing 4s ease-in-out infinite alternate;
    }

    /* NATÜRLICH PULSIERENDER CORE-FLARE (Gleißen im Zentrum) */
    .sun-core-flare {
      position: absolute;
      width: 26%;
      height: 26%;
      border-radius: 50%;
      background: radial-gradient(circle, #ffffff 50%, rgba(255,255,255,0) 100%);
      filter: blur(2px);
      z-index: 2;
      /* Das Herzstück der Sonne atmet phasenverschoben für maximalen Realismus */
      animation: sun-core-breathing 3.5s ease-in-out infinite alternate;
    }

    /* ============================================================
       ORGANISCHE & GPU-SCHONENDE ANIMATIONEN
       ============================================================ */
    
    /* 1. Globales Atmen (Löst den starren äußeren Ring auf) */
    @keyframes sun-global-pulse {
      0% {
        transform: scale(0.98);
      }
      100% {
        transform: scale(1.02);
      }
    }

    /* 2. Natürliches, weiches Atmen des Kerns (Wechselt Helligkeit und Strahlradius) */
    @keyframes sun-core-breathing {
      0% {
        transform: scale(0.9);
        box-shadow: 0 0 15px 4px rgba(255, 255, 255, 0.8);
        opacity: 0.8;
      }
      100% {
        transform: scale(1.15);
        box-shadow: 0 0 25px 10px rgba(255, 255, 255, 1);
        opacity: 1;
      }
    }

    /* 3. Atmen der Korona im Hintergrund */
    @keyframes sun-aura-breathing {
      0% {
        box-shadow: 
          0 0 20px 6px rgba(255, 111, 0, 0.5),
          0 0 40px 15px rgba(245, 158, 11, 0.3);
      }
      100% {
        box-shadow: 
          0 0 35px 12px rgba(255, 145, 0, 0.8),
          0 0 70px 25px rgba(255, 61, 0, 0.45);
      }
    }

    /* Textur-Drifts */
    @keyframes sun-drift-left {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      100% { transform: translate3d(-10%, -3%, 0) rotate(360deg); }
    }
    @keyframes sun-drift-right {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      100% { transform: translate3d(8%, 5%, 0) rotate(-360deg); }
    }
  </style>
</head>
<body>

  <div class="sun-container">
    <div class="sun-aura"></div>
    <div class="sun-sphere">
      <div class="sun-layer-base"></div>
      <div class="sun-layer-detail"></div>
    </div>
    <div class="sun-core-flare"></div>
  </div>

</body>
</html>


<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocaOrbit - Seamless Cinematic Sun</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0A0A2E;
      background-image: radial-gradient(circle at center, #161245 0%, #060417 100%);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    :root {
      --sun-size: 130px;
    }

    /* Der Hauptcontainer pulsiert sanft als Einheit */
    .sun-container {
      position: relative;
      width: var(--sun-size);
      height: var(--sun-size);
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 25px rgba(255, 145, 0, 0.5));
      animation: sun-global-pulse 5s ease-in-out infinite alternate;
    }

    /* 3D-KUGELBASIS – Jetzt absolut ohne harten Randbalken */
    .sun-sphere {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      overflow: hidden;
      /* Geändert: Der Verlauf endet bei 97% im tiefen Rotbraun und blendet bis 100% komplett auf transparent aus. Das killt den harten Balken! */
      background: radial-gradient(circle at 35% 35%, #ffffff 0%, #fff59d 15%, #ffb300 45%, #e65100 72%, #3d0a00 97%, transparent 100%);
      box-shadow: 
        inset -12px -12px 25px rgba(0, 0, 0, 0.85),
        inset 6px 6px 16px rgba(255, 255, 255, 0.4);
      transform-style: preserve-3d;
      z-index: 1;
    }

    /* TEXTUR-EBENE 1: Fließende Plasmabänder */
    .sun-layer-base {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        linear-gradient(
          35deg,
          transparent 0%,
          transparent 32%,
          rgba(255, 255, 255, 0.2) 35%, 
          rgba(255, 235, 59, 0.3) 40%,
          transparent 46%,
          transparent 62%,
          rgba(255, 111, 0, 0.2) 68%,
          transparent 74%
        ),
        linear-gradient(
          -15deg,
          transparent 15%,
          rgba(255, 255, 255, 0.12) 25%,
          transparent 40%,
          transparent 60%,
          rgba(183, 28, 28, 0.3) 75%,
          transparent 90%
        );
      
      filter: blur(4px);
      mix-blend-mode: color-dodge;
      opacity: 0.95;
      animation: sun-drift-left 32s linear infinite;
      will-change: transform;
    }

    /* TEXTUR-EBENE 2: Konvektionsströme */
    .sun-layer-detail {
      position: absolute;
      top: -50%; bottom: -50%; left: -100%; right: -100%;
      background-image: 
        linear-gradient(
          145deg,
          transparent 25%,
          rgba(255, 255, 255, 0.12) 32%,
          transparent 45%,
          rgba(33, 4, 0, 0.35) 65%,
          transparent 80%
        );
      filter: blur(5px);
      mix-blend-mode: overlay;
      opacity: 0.9;
      animation: sun-drift-right 24s linear infinite;
      will-change: transform;
    }

    /* REINES GLÜHEN IM HINTERGRUND – Drückt über die Kugelgrenzen hinaus */
    .sun-aura {
      position: absolute;
      inset: -12px; /* Schaut hinter der Kugel hervor */
      border-radius: 50%;
      z-index: 0;
      mix-blend-mode: screen;
      animation: sun-aura-breathing 4s ease-in-out infinite alternate;
    }

    /* PERSPEKTIVISCH RECHTER KERN (Solar Flare) */
    .sun-core-flare {
      position: absolute;
      width: 26%;
      height: 26%;
      border-radius: 50%;
      /* Absichtlicher Versatz nach oben links (35% / 35%), um mit dem Lichtkegel der Kugel zu verschmelzen */
      top: 35%;
      left: 35%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, #ffffff 50%, rgba(255,255,255,0) 100%);
      filter: blur(2px);
      z-index: 2;
      animation: sun-core-breathing 3.5s ease-in-out infinite alternate;
    }

    /* ============================================================
       ANIMATIONEN
       ============================================================ */
    @keyframes sun-global-pulse {
      0% { transform: scale(0.98); }
      100% { transform: scale(1.02); }
    }

    @keyframes sun-core-breathing {
      0% {
        transform: translate(-50%, -50%) scale(0.88);
        box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.85);
        opacity: 0.8;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.12);
        box-shadow: 0 0 25px 12px rgba(255, 255, 255, 1);
        opacity: 1;
      }
    }

    @keyframes sun-aura-breathing {
      0% {
        box-shadow: 
          0 0 25px 6px rgba(255, 111, 0, 0.6),
          0 0 45px 15px rgba(245, 158, 11, 0.4);
      }
      100% {
        box-shadow: 
          0 0 40px 14px rgba(255, 145, 0, 0.85),
          0 0 80px 28px rgba(255, 61, 0, 0.5);
      }
    }

    @keyframes sun-drift-left {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      100% { transform: translate3d(-10%, -3%, 0) rotate(360deg); }
    }
    @keyframes sun-drift-right {
      0% { transform: translate3d(0, 0, 0) rotate(0deg); }
      100% { transform: translate3d(8%, 5%, 0) rotate(-360deg); }
    }
  </style>
</head>
<body>

  <div class="sun-container">
    <div class="sun-aura"></div>
    <div class="sun-sphere">
      <div class="sun-layer-base"></div>
      <div class="sun-layer-detail"></div>
    </div>
    <div class="sun-core-flare"></div>
  </div>

</body>
</html>
