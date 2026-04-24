import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export type CelestialMode = 'epic' | 'ambient' | 'active' | 'focus';

// ─── Sternschnuppe (SVG Path Tracer) ─────────────────────────────────────────
// Löst alle 4 KI-Sternschnuppen-Probleme:
// 1. Kein Besenstiel: Schweif wird über pathLength progressiv AUFGEDECKT
// 2. Kein linearer Pfad: Quadratische Bezier-Kurve = natürlicher Bogen
// 3. Tapering: Gradient (Opacity) + Blur-Layer (Breite) simulieren Verjüngung
// 4. Physik-Timing: easeIn-Kurve = Meteor beschleunigt beim Eintauchen

// Quadratic Bezier: Punkt bei Parameter t (0→1)
function bezierPt(t: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number): [number, number] {
  const mt = 1 - t;
  return [mt*mt*x0 + 2*mt*t*cx + t*t*x1, mt*mt*y0 + 2*mt*t*cy + t*t*y1];
}

type ShootingStarState = {
  startX: number;   // % Bildschirmbreite
  startY: number;   // % Bildschirmhöhe
  fromRight: boolean;
  speed: 'slow' | 'medium' | 'fast';
  key: number;
};

function ShootingStar({ s }: { s: ShootingStarState }) {
  // viewBox 100×177 (9:16 Hochformat)
  const sx = s.startX;
  const sy = s.startY * 1.77;

  // Große Reisedistanz: Sternschnuppe fliegt von einer Bildschirmkante zur anderen
  const dx = s.fromRight ? -115 : 115;
  const dy = 50;
  const ex = sx + dx;
  const ey = sy + dy;

  // Winkel des Schweifs: entgegengesetzt zur Reiserichtung
  // Der Schweif zeigt HINTER den Kopf → Winkel = Reisewinkel + 180°
  const travelAngle = Math.atan2(dy, dx) * 180 / Math.PI; // z.B. fromRight ≈ 156°

  // Bezier-Kontrollpunkt für natürlichen Bogen
  const ctrlX = sx + dx * 0.3;
  const ctrlY = sy + dy * 0.2 - 6;

  // Keyframe-Positionen des Kopfes entlang der Bezier-Kurve
  const pts = [0, 0.28, 0.62, 1.0].map(
    t => bezierPt(t, sx, sy, ctrlX, ctrlY, ex, ey)
  );

  const uid  = s.key;
  // 3 Geschwindigkeiten: slow=atmosphärisch, medium=standard, fast=blitz
  const T    = s.speed === 'fast' ? 0.55 : s.speed === 'slow' ? 1.3 : 0.85;
  const tail = s.speed === 'fast' ? 14 : s.speed === 'slow' ? 22 : 18;

  return (
    <motion.svg
      viewBox="0 0 100 177"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        {/* Gradient: nahtlos von transparent (Schweifende) → kühles Weiß (Kopf) */}
        <linearGradient id={`tg-${uid}`} gradientUnits="userSpaceOnUse"
          x1={-tail} y1={0} x2={0} y2={0}>
          <stop offset="0%"   stopColor="rgba(255,255,255,0)"    />
          <stop offset="45%"  stopColor="rgba(200,220,255,0.10)" />
          <stop offset="80%"  stopColor="rgba(220,235,255,0.55)"/>
          <stop offset="100%" stopColor="rgba(245,250,255,0.92)"/>
        </linearGradient>
        {/* Subtiler Glow: nur minimales Aufleuchten am Kopf */}
        <filter id={`hf-${uid}`} x="-500%" y="-500%" width="1100%" height="1100%">
          <feGaussianBlur stdDeviation="0.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Weicher Blur für Schweif-Tapering */}
        <filter id={`tf-${uid}`} x="-20%" y="-400%" width="140%" height="900%">
          <feGaussianBlur stdDeviation="0.28"/>
        </filter>
      </defs>

      {/* Bewegte Gruppe: konstante lineare Geschwindigkeit (kein Easing-Ruckeln) */}
      <motion.g
        animate={{
          x:       [pts[0][0], pts[1][0], pts[2][0], pts[3][0]],
          y:       [pts[0][1], pts[1][1], pts[2][1], pts[3][1]],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: T,
          // x & y: linear → konstante Geschwindigkeit, kein Ruckeln
          x:       { ease: 'linear', times: [0, 0.28, 0.62, 1.0] },
          y:       { ease: 'linear', times: [0, 0.28, 0.62, 1.0] },
          // opacity: eigene sanfte Kurve unabhängig von Position
          opacity: { ease: 'easeInOut', times: [0, 0.08, 0.88, 1.0] },
        }}
      >
        {/* Innere Gruppe: rotiert so dass Schweif hinter Kopf zeigt */}
        <g transform={`rotate(${travelAngle})`}>

          {/* Schweif Glow-Layer: löst sich während des Fluges auf (Dissipation) */}
          <motion.line x1={-tail} y1={0} x2={0} y2={0}
            stroke={`url(#tg-${uid})`} strokeWidth={1.2}
            strokeLinecap="round" filter={`url(#tf-${uid})`}
            animate={{ opacity: [0.85, 0.85, 0.2, 0] }}
            transition={{ duration: T, times: [0, 0.18, 0.75, 1.0], ease: 'easeIn' }}
          />
          {/* Schweif Kern-Layer: verblasst sanfter (Nachleuchten) */}
          <motion.line x1={-tail} y1={0} x2={0} y2={0}
            stroke={`url(#tg-${uid})`} strokeWidth={0.3}
            strokeLinecap="round"
            animate={{ opacity: [1, 1, 0.35, 0.08] }}
            transition={{ duration: T, times: [0, 0.20, 0.78, 1.0], ease: 'easeIn' }}
          />

          {/* Kopf: bleibt stabil hell bis zum globalen Fade-Out */}
          <g filter={`url(#hf-${uid})`}>
            <circle r={0.28} fill="rgba(245,250,255,0.95)" />
          </g>

        </g>
      </motion.g>
    </motion.svg>
  );
}



// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export const CelestialEffects = ({
  mode = 'ambient',
  testMode: _testMode = false,
}: {
  mode?: CelestialMode;
  testMode?: boolean;
}) => {
  const starCount = mode === 'focus' ? 12 : 30;

  const stars = useMemo(() =>
    Array.from({ length: starCount }).map((_, i) => {
      const depth = Math.random(); // 0 = weit weg/klein, 1 = nah/groß

      const tier: 'sparkle' | 'breath' | 'rest' =
        mode === 'focus'                       ? 'rest'
        : i < Math.floor(starCount * 0.15)    ? 'sparkle'
        : i < Math.floor(starCount * 0.40)    ? 'breath'
        : 'rest';

      const size = mode === 'focus'
        ? depth * 0.7 + 0.4   // focus: 0.4 – 1.1 px  (sehr fern, ruhig)
        : depth * 1.0 + 0.4;  // ambient+: 0.4 – 1.4 px (nadelfein, tief)

      return {
        x: Math.random() * 96 + 2,
        y: Math.random() * 96 + 2,
        size,
        depth,
        baseOpacity:
          mode === 'focus'     ? 0.06 + depth * 0.14
          : tier === 'sparkle' ? 0.30 + depth * 0.30
          : tier === 'breath'  ? 0.28 + depth * 0.48
          :                      0.22 + depth * 0.52,
        cycleDuration:
          tier === 'sparkle' ? 1.5 + Math.random() * 1.0
          : tier === 'breath' ? 4   + Math.random() * 4
          :                     8   + Math.random() * 8,
        delay: Math.random() * 7,
        repeatDelay: tier === 'sparkle' ? 4 + Math.random() * 11 : 0,
        glowR: size * 3.5 + 3,
        glowS: size * 1.0 + 0.5,
        rayHalf: size * 1.4 + 1.5,
        tier,
      };
    }),
  [starCount, mode]);

  // ── Diamant-Sparkle ──────────────────────────────────────────────────────
  const [diamondIdx, setDiamondIdx] = useState<number | null>(null);

  useEffect(() => {
    if (mode === 'focus') return;
    let running = true;

    const cycle = async () => {
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      while (running) {
        const idx = Math.floor(Math.random() * starCount);
        setDiamondIdx(idx);
        await new Promise(r => setTimeout(r, 2200 + Math.random() * 1000));
        if (!running) break;
        setDiamondIdx(null);
        await new Promise(r => setTimeout(r, 9000 + Math.random() * 14000));
      }
    };

    cycle();
    return () => { running = false; };
  }, [mode, starCount]);

  // ── Sternschnuppe ────────────────────────────────────────────────────────
  // Nur im ambient-Modus, alle 25–50 Sekunden einmal.
  const [shootingStar, setShootingStar] = useState<ShootingStarState | null>(null);
  const shootingStarKey = useRef(0);

  useEffect(() => {
    if (mode !== 'ambient') return;
    let running = true;

    const cycle = async () => {
      // Erste Erscheinung: 1–3s nach Laden (schnell sichtbar)
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      while (running) {
        const fromRight = Math.random() > 0.5;

        // 3 Geschwindigkeiten zufällig gewählt (fast häufiger als slow)
        const speedRoll = Math.random();
        const speed: ShootingStarState['speed'] =
          speedRoll < 0.35 ? 'fast' : speedRoll < 0.70 ? 'medium' : 'slow';

        // Animationsdauer je nach Geschwindigkeit + kleiner Puffer
        const animDuration = speed === 'fast' ? 700 : speed === 'slow' ? 1500 : 1000;

        const startX = fromRight
          ? 62 + Math.random() * 20  // 62–82% von links
          : 18 + Math.random() * 20; // 18–38%
        const startY = 3 + Math.random() * 20; // 3–23% vom oberen Rand

        shootingStarKey.current += 1;
        setShootingStar({ startX, startY, fromRight, speed, key: shootingStarKey.current });

        await new Promise(r => setTimeout(r, animDuration));
        if (!running) break;
        setShootingStar(null);

        // Pause zwischen Events: 8–18 Sekunden
        await new Promise(r => setTimeout(r, 8000 + Math.random() * 10000));
      }
    };

    cycle();
    return () => { running = false; };
  }, [mode]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">

      {stars.map((s, i) => {
        if (s.tier === 'rest') return (
          <motion.div
            key={`star-${mode}-${i}`}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
            animate={{ opacity: [s.baseOpacity * 0.82, s.baseOpacity, s.baseOpacity * 0.82] }}
            transition={{ duration: s.cycleDuration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        );

        if (s.tier === 'breath') return (
          <motion.div
            key={`star-${mode}-${i}`}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
            animate={{
              opacity: [s.baseOpacity * 0.45, s.baseOpacity * 1.55, s.baseOpacity * 0.45],
              scale:   [0.88, 1.22, 0.88],
            }}
            transition={{ duration: s.cycleDuration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        );

        // Sparkle: Glow-Ring
        const off = `0 0 0px 0px rgba(255,255,255,0), 0 0 0px 0px rgba(255,255,255,0)`;
        const on  = `0 0 ${s.glowR}px ${s.glowS}px rgba(255,255,255,0.80), 0 0 ${s.glowR * 2.2}px ${s.glowS * 1.5}px rgba(255,255,255,0.28)`;
        return (
          <motion.div
            key={`star-${mode}-${i}`}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
            animate={{ opacity: [s.baseOpacity, 1.0, s.baseOpacity], scale: [1, 1.45, 1], boxShadow: [off, on, off] }}
            transition={{ duration: s.cycleDuration, delay: s.delay, repeat: Infinity, repeatDelay: s.repeatDelay, ease: 'easeInOut' }}
          />
        );
      })}

      {/* ✦ Diamant-Sparkle: ein Stern zur Zeit, tiefenproportional */}
      <AnimatePresence>
        {diamondIdx !== null && (() => {
          const s = stars[diamondIdx];
          if (!s) return null;
          const r = s.rayHalf;
          const trans = { duration: 2.2, times: [0, 0.25, 0.75, 1], ease: 'easeInOut' as const };
          const rayStyle = { borderRadius: 99, position: 'absolute' as const, left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%,-50%)' };
          return (
            <>
              <motion.div key={`dh-${diamondIdx}`} style={{ ...rayStyle, height: 1, width: r * 2, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)' }}
                initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0,1,1,0], opacity: [0,0.85,0.85,0] }} exit={{ scaleX: 0, opacity: 0 }} transition={trans} />
              <motion.div key={`dv-${diamondIdx}`} style={{ ...rayStyle, width: 1, height: r * 2, background: 'linear-gradient(180deg,transparent,rgba(255,255,255,0.85),transparent)' }}
                initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: [0,1,1,0], opacity: [0,0.85,0.85,0] }} exit={{ scaleY: 0, opacity: 0 }} transition={trans} />
            </>
          );
        })()}
      </AnimatePresence>

      {/* ☄ Sternschnuppe: ambient-Modus, selten, natürlich */}
      <AnimatePresence>
        {shootingStar && (
          <ShootingStar key={shootingStar.key} s={shootingStar} />
        )}
      </AnimatePresence>

    </div>
  );
};
