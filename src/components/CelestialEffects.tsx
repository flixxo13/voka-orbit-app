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
  startX: number;  // % Bildschirmbreite
  startY: number;  // % Bildschirmhöhe
  fromRight: boolean;
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
  const T    = 0.85; // schnell — natürlich wirkende Geschwindigkeit
  const tail = 18;   // Schweiflänge in viewBox-Einheiten

  return (
    <motion.svg
      viewBox="0 0 100 177"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        {/* Gradient: bright am Kopf (x2=0), transparent am Schweifende (x1=-tail) */}
        <linearGradient id={`tg-${uid}`} gradientUnits="userSpaceOnUse"
          x1={-tail} y1={0} x2={0} y2={0}>
          <stop offset="0%"   stopColor="rgba(6,210,230,0)"    />
          <stop offset="40%"  stopColor="rgba(6,210,230,0.12)" />
          <stop offset="78%"  stopColor="rgba(80,235,255,0.60)"/>
          <stop offset="100%" stopColor="rgba(220,250,255,0.95)"/>
        </linearGradient>
        {/* Glow-Filter für den Kopf */}
        <filter id={`hf-${uid}`} x="-400%" y="-400%" width="900%" height="900%">
          <feGaussianBlur stdDeviation="0.9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* Weicher Blur-Layer für Schweif-Tapering */}
        <filter id={`tf-${uid}`} x="-20%" y="-400%" width="140%" height="900%">
          <feGaussianBlur stdDeviation="0.35"/>
        </filter>
      </defs>

      {/* Bewegte Gruppe: Schweif + Kopf fliegen zusammen, Kopf immer vorne */}
      <motion.g
        animate={{
          x: [pts[0][0], pts[1][0], pts[2][0], pts[3][0]],
          y: [pts[0][1], pts[1][1], pts[2][1], pts[3][1]],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: T,
          times: [0, 0.12, 0.78, 1.0],
          ease: [0.3, 0, 0.85, 1], // langsam einsteigen, beschleunigen
        }}
      >
        {/* Innere Gruppe: rotiert so dass Schweif hinter Kopf zeigt */}
        <g transform={`rotate(${travelAngle})`}>

          {/* Schweif Glow-Layer (breit + weich → Tapering-Illusion) */}
          <line x1={-tail} y1={0} x2={0} y2={0}
            stroke={`url(#tg-${uid})`} strokeWidth={1.2}
            strokeLinecap="round" filter={`url(#tf-${uid})`} opacity={0.8}
          />
          {/* Schweif Kern-Layer (dünn + scharf) */}
          <line x1={-tail} y1={0} x2={0} y2={0}
            stroke={`url(#tg-${uid})`} strokeWidth={0.3}
            strokeLinecap="round"
          />

          {/* Kopf: immer an Position 0,0 (Spitze der Bewegung) */}
          <g filter={`url(#hf-${uid})`}>
            <circle r={1.4} fill="rgba(6,220,240,0.45)" />
            <circle r={0.65} fill="white" />
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
      // Erste Erscheinung: 3–7s nach Laden (schnell sichtbar zum Testen)
      await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000));
      while (running) {
        const fromRight = Math.random() > 0.5;

        // Startpunkt: oberes Viertel des Screens, innerhalb des sichtbaren Bereichs
        // fromRight: startet rechts (60–82%), fromLeft: startet links (18–40%)
        const startX = fromRight
          ? 60 + Math.random() * 22  // 60–82%
          : 18 + Math.random() * 22; // 18–40%
        const startY = 4 + Math.random() * 22; // 4–26% vom oberen Rand

        shootingStarKey.current += 1;
        setShootingStar({ startX, startY, fromRight, key: shootingStarKey.current });

        // Sichtbar für ~2.2s (Animation-Dauer)
        await new Promise(r => setTimeout(r, 2400));
        if (!running) break;
        setShootingStar(null);

        // Pause bis zur nächsten: 20–40 Sekunden
        await new Promise(r => setTimeout(r, 20000 + Math.random() * 20000));
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