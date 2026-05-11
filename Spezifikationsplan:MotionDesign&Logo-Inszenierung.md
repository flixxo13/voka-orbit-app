Gemini: 

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>VokaOrbit - Pure Deep Orbit Loop (v2.2 Refined)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
    
    <style>
        /* DESIGN TOKENS (Design System v2.0) */
        :root {
            --color-orbit-purple: #7C3AED;
            --color-orbit-violet: #A78BFA;
            --color-orbit-cyan: #06B6D4;
            --bg-deep: #0A0A2E;
            --radius-orbit-card: 28px;
            --ease-orbit: cubic-bezier(0.23, 1, 0.32, 1);
            
            --glow-purple: rgba(124, 58, 237, 0.5);
            --glow-cyan: rgba(6, 182, 212, 0.4);
            --glow-violet: rgba(167, 139, 250, 0.4);
        }

        /* RESET & BACKGROUND */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            user-select: none;
        }

        body {
            background-color: var(--bg-deep);
            /* Ambient background stars (Design System 5.2) */
            background-image: 
                radial-gradient(1.5px 1.5px at 20px 30px, rgba(255, 255, 255, 0.35), rgba(0,0,0,0)),
                radial-gradient(1px 1px at 75px 140px, rgba(255, 255, 255, 0.25), rgba(0,0,0,0)),
                radial-gradient(2px 2px at 150px 60px, rgba(255, 255, 255, 0.3), rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 220px 280px, rgba(255, 255, 255, 0.35), rgba(0,0,0,0)),
                radial-gradient(1px 1px at 280px 180px, rgba(255, 255, 255, 0.2), rgba(0,0,0,0)),
                radial-gradient(2px 2px at 310px 40px, rgba(255, 255, 255, 0.4), rgba(0,0,0,0));
            background-size: 320px 320px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            font-family: "Plus Jakarta Sans", sans-serif;
        }

        /* GLASS CARD CONTAINER (Design System 3.1) */
        .glass-card {
            background: rgba(255, 255, 255, 0.04);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: var(--radius-orbit-card);
            width: 320px;
            height: 320px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        /* 3D CANVAS PERSPECTIVE */
        .canvas-area {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            perspective: 1000px;
            transform-style: preserve-3d;
        }

        /* ==========================================================================
           --- 3D GYROSCOPIC AMBIENT ORBIT RINGS (Design System 3.3) ---
           ========================================================================== */
        .ambient-orbit-rings {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 0;
            transform-style: preserve-3d;
        }

        .ring-wrapper {
            position: absolute;
            border-radius: 50%;
            transform-style: preserve-3d;
        }

        .ring-spin {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            transform-style: preserve-3d;
        }

        /* Ring 1: Outer / Violet */
        @keyframes sway-ring-outer {
            0%, 100% { transform: rotateZ(-30deg) rotateX(66deg) rotateY(-5deg); }
            50%      { transform: rotateZ(-30deg) rotateX(72deg) rotateY(5deg); }
        }
        .ring-outer {
            width: 220px;
            height: 220px;
            animation: sway-ring-outer 18s ease-in-out infinite;
        }
        @keyframes spin-clockwise {
            0% { transform: rotateZ(0deg); }
            100% { transform: rotateZ(360deg); }
        }
        .ring-outer .ring-spin {
            border: 1px solid rgba(124, 58, 237, 0.03);
            border-top: 1.5px solid rgba(167, 139, 250, 0.12); /* Bright-Spot */
            box-shadow: inset 0 0 15px rgba(124, 58, 237, 0.01);
            animation: spin-clockwise 45s linear infinite;
        }

        /* Ring 2: Middle / Cyan */
        @keyframes sway-ring-middle {
            0%, 100% { transform: rotateZ(40deg) rotateX(74deg) rotateY(4deg); }
            50%      { transform: rotateZ(40deg) rotateX(66deg) rotateY(-4deg); }
        }
        .ring-middle {
            width: 175px;
            height: 175px;
            animation: sway-ring-middle 24s ease-in-out infinite;
        }
        @keyframes spin-counter-clockwise {
            0% { transform: rotateZ(360deg); }
            100% { transform: rotateZ(0deg); }
        }
        .ring-middle .ring-spin {
            border: 1px solid rgba(6, 182, 212, 0.02);
            border-left: 1.5px solid rgba(6, 182, 212, 0.10); /* Bright-Spot */
            box-shadow: inset 0 0 12px rgba(6, 182, 212, 0.01);
            animation: spin-counter-clockwise 60s linear infinite;
        }

        /* Ring 3: Inner / White-Violet */
        @keyframes sway-ring-inner {
            0%, 100% { transform: rotateZ(-10deg) rotateX(58deg) rotateY(-6deg); }
            50%      { transform: rotateZ(-10deg) rotateX(64deg) rotateY(6deg); }
        }
        .ring-inner {
            width: 130px;
            height: 130px;
            animation: sway-ring-inner 15s ease-in-out infinite;
        }
        .ring-inner .ring-spin {
            border: 1px solid rgba(255, 255, 255, 0.015);
            border-bottom: 1.5px solid rgba(255, 255, 255, 0.08); /* Bright-Spot */
            box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.01);
            animation: spin-clockwise 30s linear infinite;
        }

        /* ==========================================================================
           --- 3D ROTATING PLANETS WITH TRUE FOCUS DEPTH (Design System 3.2 & 4.4) ---
           ========================================================================== */
        .orbit-container {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transform-style: preserve-3d;
            z-index: 10;
        }

        .mini-planet {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
            color: #FFFFFF;
            text-shadow: 0 1.5px 3px rgba(0,0,0,0.6);
            /* Specular Highlights */
            background-image: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 65%);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transform-style: preserve-3d;
            transition: box-shadow 0.3s ease;
        }

        /* CSS-Glow-Zuweisung für Keyframe-Vererbung */
        .planet-purple {
            background-color: var(--color-orbit-purple);
            border: 1px solid rgba(167, 139, 250, 0.3);
            --glow-active: var(--glow-purple);
        }

        .planet-cyan {
            background-color: var(--color-orbit-cyan);
            border: 1px solid rgba(6, 182, 212, 0.3);
            --glow-active: var(--glow-cyan);
        }

        .planet-violet {
            background-color: var(--color-orbit-violet);
            border: 1px solid rgba(255, 255, 255, 0.4);
            color: #1E1B4B;
            text-shadow: none;
            --glow-active: var(--glow-violet);
        }

        /* 3D Ellipse mit dramatischer Spotlight-Verstärkung im Vordergrund (75%) */
        @keyframes deep-orbit {
            0% { 
                transform: translate3d(-75px, -10px, 10px) scale(0.9); 
                opacity: 0.8; 
                z-index: 10; 
                filter: blur(0.2px) brightness(0.9);
                box-shadow: 0 0 12px var(--glow-active), inset 0 -4px 10px rgba(0,0,0,0.4);
            }
            25% { 
                /* Hinterer Totpunkt (Weit weg, verschwommen, dunkel) */
                transform: translate3d(0px, -28px, -45px) scale(0.55); 
                opacity: 0.25; 
                z-index: 1; 
                filter: blur(2px) brightness(0.5);
                box-shadow: 0 0 4px var(--glow-active), inset 0 -4px 10px rgba(0,0,0,0.4);
            }
            50% { 
                transform: translate3d(75px, -10px, -20px) scale(0.85); 
                opacity: 0.6; 
                z-index: 5; 
                filter: blur(0.8px) brightness(0.8);
                box-shadow: 0 0 8px var(--glow-active), inset 0 -4px 10px rgba(0,0,0,0.4);
            }
            75% { 
                /* Vorderes Spotlight (Ganz nah, riesig, extrem hell, scharf) */
                transform: translate3d(0px, 22px, 80px) scale(1.4); 
                opacity: 1; 
                z-index: 100; 
                filter: blur(0px) brightness(1.25);
                box-shadow: 0 0 32px var(--glow-active), inset 0 -4px 10px rgba(0,0,0,0.4);
            }
            100% { 
                transform: translate3d(-75px, -10px, 10px) scale(0.9); 
                opacity: 0.8; 
                z-index: 10; 
                filter: blur(0.2px) brightness(0.9);
                box-shadow: 0 0 12px var(--glow-active), inset 0 -4px 10px rgba(0,0,0,0.4);
            }
        }

        /* Perfekte Phasenverschiebung der 3 Körper */
        .planet-1 {
            animation: deep-orbit 5s infinite var(--ease-orbit);
            animation-delay: 0s;
        }

        .planet-2 {
            animation: deep-orbit 5s infinite var(--ease-orbit);
            animation-delay: -1.66s;
        }

        .planet-3 {
            animation: deep-orbit 5s infinite var(--ease-orbit);
            animation-delay: -3.33s;
        }

        /* ==========================================================================
           --- COORDINTATED 3D LETTER FLIPPING & CONTENT SEQUENCE ---
           Spells out V-O-K -> A-O-R -> B-I-T sequentially
           ========================================================================== */
        
        .letter-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            backface-visibility: visible;
        }

        /* Rotations-Flips der Buchstaben exakt beim Buchstabenwechsel (alle 5s) */
        @keyframes letter-flip {
            0%, 92% { transform: rotateY(0deg); }
            97%, 100% { transform: rotateY(360deg); }
        }

        .planet-1 .letter-inner {
            animation: letter-flip 5s infinite var(--ease-orbit);
            animation-delay: 0s;
        }
        .planet-2 .letter-inner {
            animation: letter-flip 5s infinite var(--ease-orbit);
            animation-delay: -1.66s;
        }
        .planet-3 .letter-inner {
            animation: letter-flip 5s infinite var(--ease-orbit);
            animation-delay: -3.33s;
        }

        /* Pseudo-Element zur performanten Steuerung des Text-Contents */
        .letter-inner::after {
            display: block;
            backface-visibility: hidden;
        }

        /* Planet 1 Sequenz: V -> A -> B */
        @keyframes spell-planet-1 {
            0%, 33.33% { content: "V"; }
            33.34%, 66.66% { content: "A"; }
            66.67%, 100% { content: "B"; }
        }
        .planet-1 .letter-inner::after {
            content: "V";
            animation: spell-planet-1 15s infinite steps(1);
            animation-delay: 0s;
        }

        /* Planet 2 Sequenz: O -> O -> I */
        @keyframes spell-planet-2 {
            0%, 33.33% { content: "O"; }
            33.34%, 66.66% { content: "O"; }
            66.67%, 100% { content: "I"; }
        }
        .planet-2 .letter-inner::after {
            content: "O";
            animation: spell-planet-2 15s infinite steps(1);
            animation-delay: -1.66s;
        }

        /* Planet 3 Sequenz: K -> R -> T */
        @keyframes spell-planet-3 {
            0%, 33.33% { content: "K"; }
            33.34%, 66.66% { content: "R"; }
            66.67%, 100% { content: "T"; }
        }
        .planet-3 .letter-inner::after {
            content: "K";
            animation: spell-planet-3 15s infinite steps(1);
            animation-delay: -3.33s;
        }
    </style>
</head>
<body>

    <div class="glass-card">
        <div class="canvas-area">
            
            <div class="ambient-orbit-rings">
                <div class="ring-wrapper ring-outer">
                    <div class="ring-spin"></div>
                </div>
                <div class="ring-wrapper ring-middle">
                    <div class="ring-spin"></div>
                </div>
                <div class="ring-wrapper ring-inner">
                    <div class="ring-spin"></div>
                </div>
            </div>
            
            <div class="orbit-container">
                <div class="mini-planet planet-purple planet-1">
                    <div class="letter-inner"></div>
                </div>
                <div class="mini-planet planet-cyan planet-2">
                    <div class="letter-inner"></div>
                </div>
                <div class="mini-planet planet-violet planet-3">
                    <div class="letter-inner"></div>
                </div>
            </div>

        </div>
    </div>

</body>
</html>


In der App-Entwicklung und im UI/UX-Design gibt es für diese Bewegungen ganz präzise Fachbegriffe. Wenn man sich mit Designern und Entwicklern darüber unterhält, nutzt man meistens englische Bezeichnungen, da diese sich als Industriestandard etabliert haben.
​Hier ist die Übersicht, wie man diese Phänomene allgemein nennt und warum sie psychologisch so wichtig sind:
​1. Der Überbegriff: Functional Animation (Funktionale Animation)
​Wenn Animationen in einer App nicht nur „Deko“ sind, sondern dem Nutzer helfen, die App besser zu verstehen, spricht man von Functional Animation (oder UX Motion Design).
​Sie dient dazu, dem Nutzer visuelle Hinweise zu geben, woher Daten kommen, wohin sie gehen und was die App gerade tut.
​2. Für Wartezeiten (Loading States)
​Wenn die App Daten lädt, berechnet oder rendert, nutzt man Animationen, um das Phänomen der Perceived Performance (gefühlte Performance) zu optimieren.
​Perceived Performance (Subjektive Wartezeit): Das ist die psychologische Wahrnehmung von Zeit. Wenn ein Nutzer auf einen starren Bildschirm starrt, fühlen sich 2 Sekunden wie 5 Sekunden an. Ein harmonischer Loop – wie deine Deep Orbit Animation – beschäftigt das Auge. Die Wartezeit fühlt sich dadurch um bis zu 40 % kürzer an, obwohl die App physikalisch nicht schneller lädt.
​Activity Indicators / Loader / Spinners: Der klassische, sich drehende Kreis (wie man ihn von früher kennt). Er ist heute verpönt, weil er dem Nutzer signalisiert: „Ich blockiere dich jetzt und du musst warten.“
​Skeleton Screens (Shimmer-Effekt): Das ist der heutige Industriestandard für Inhalts-Ladezeiten (bekannt von YouTube, Facebook oder LinkedIn). Statt eines Ladebalkens sieht man grau-weiß pulsierende Platzhalter-Blöcke, die die Struktur der kommenden Inhalte bereits andeuten. Das Gehirn stellt sich auf den Inhalt ein, noch bevor er da ist.
​3. Für Übergänge (Transitions)
​Wenn der Nutzer von einem Screen zum nächsten springt, sprechen Designer von Motion Choreography (Bewegungs-Choreografie). Die wichtigsten Begriffe hierbei sind:
​Screen Transitions (Bildschirmübergänge): Der Wechsel zwischen zwei Ansichten. Früher schoben sich Seiten oft einfach nur stumpf von rechts nach links (Slide-In). Heute werden Übergänge räumlich inszeniert.
​Shared Element Transition (auch: Hero Animation): Das ist der heilige Gral der flüssigen UI. Wenn ein Element auf Screen A (z.B. ein kleiner Planet auf dem Dashboard) beim Wechsel nahtlos zu einem großen Element auf Screen B (z.B. dem großen interaktiven Planeten im Quiz) anwächst. Es gibt keinen harten Schnitt; das Auge kann dem Objekt physisch folgen.
​Visual Continuity (Visuelle Kontinuität): Die Animation sorgt dafür, dass der Nutzer den räumlichen Bezug in der App nicht verliert. Er weiß intuitiv: „Ich bin gerade tiefer in das Element hineingeflogen und wenn ich auf 'Zurück' drücke, fliege ich wieder heraus.“
​Direct Blast / Explosion / Particle Bursts: Ein Übergangstyp, der speziell im Gaming und in gamifizierten Apps genutzt wird, um einen Zustand radikal zu beenden (wie dein v2.5 Burst). Er bricht das vorherige UI auf und leitet den Fokus direkt auf das neue, einfliegende UI um.
​Warum das für VokaOrbit so genial ist
​Mit deiner v2.2 (Deep Orbit Loop) hast du einen perfekten Activity Indicator für die Perceived Performance geschaffen, und mit v2.5 (Direct Blast) eine meisterhafte Screen Transition, die visuelle Kontinuität wahrt, weil die Planeten nicht einfach verschwinden, sondern logisch aus dem Bild geschleudert werden.
​Welche dieser Fachbereiche der funktionalen Animation reizt dich für dein nächstes App-Projekt am meisten: die nahtlose Shared Element Transition (wo ein Element direkt mitfliegt) oder das clevere Design von Skeleton Screens für Offline-Daten?