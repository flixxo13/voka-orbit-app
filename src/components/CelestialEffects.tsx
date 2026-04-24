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
  // Referenz-Koordinatenraum: 100×177 (Hochformat-Handy, ~9:16)
  // startX/Y sind bereits in 0-100, Y-Achse auf 177 skalieren
  const sx = s.startX;
  const sy = s.startY * 1.77;

  // Reisevektor (in Referenz-Einheiten)
  const dx = s.fromRight ? -48 : 48;
  const dy = 30;
  const ex = sx + dx;
  const ey = sy + dy;

  // Bezier-Kontrollpunkt: leichter Bogen (Atmosphäreneintritt-Kurve)
  // Der Meteor "flacht" am Anfang ab, dann steilt er sich ein — natürliche Parabel
  const ctrlX = sx + dx * 0.28;
  const ctrlY = sy + dy * 0.18 - 5;

  // Kopf-Keyframes entlang der Bezier (für akkurates Path-Following)
  const [h0, h1, h2, h3, h4] = [0, 0.25, 0.55, 0.82, 1.0].map(
    t => bezierPt(t, sx, sy, ctrlX, ctrlY, ex, ey)
  );

  const uid = s.key;
  const d   = `M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${ex} ${ey}`;

  // Timing-Kurve: langsam einsteigen, beschleunigen, kurz aufglühen, verpuffen
  // Phase: [Eintritt] [Aufglühen] [Zug]   [Verblassen]
  const T    = 2.6;
  const KF   = [0, 0.10, 0.70, 1.0] as const;

  return (
    <motion.svg
      viewBox="0 0 100 177"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: T, times: [...KF] }}
    >
      <defs>
        {/* Gradient: Schweifende (transparent) → Kopf (weiß) */}
        <linearGradient id={`sg-${uid}`} gradientUnits="userSpaceOnUse"
          x1={sx} y1={sy} x2={ex} y2={ey}>
          <stop offset="0%"   stopColor="rgba(6,210,230,0)"    />
          <stop offset="30%"  stopColor="rgba(6,210,230,0.08)" />
          <stop offset="70%"  stopColor="rgba(80,235,255,0.55)"/>
          <stop offset="92%"  stopColor="rgba(210,250,255,0.88)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.97)"/>
        </linearGradient>
        {/* Weicher Blur für den Glow-Layer (erzeugt Breiten-Tapering visuell) */}
        <filter id={`blur-${uid}`} x="-50%" y="-300%" width="200%" height="700%">
          <feGaussianBlur stdDeviation="0.6"/>
        </filter>
        {/* Starker Glow für den Kopf */}
        <filter id={`head-${uid}`} x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="1.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Layer 1: Glow-Schweif (breit + weich = Tapering-Illusion) */}
      <motion.path d={d} fill="none"
        stroke={`url(#sg-${uid})`} strokeWidth={1.4} strokeLinecap="round"
        filter={`url(#blur-${uid})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 0, 1, 1], opacity: [0, 0.7, 0.7, 0] }}
        transition={{ duration: T, times: [...KF], ease: [0.2, 0, 0.6, 1] }}
      />

      {/* Layer 2: Kern-Schweif (dünn + scharf) */}
      <motion.path d={d} fill="none"
        stroke={`url(#sg-${uid})`} strokeWidth={0.35} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 0, 1, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: T, times: [...KF], ease: [0.2, 0, 0.6, 1] }}
      />

      {/* Layer 3: Meteor-Kopf folgt der Bezier-Kurve (kein Besenstiel) */}
      <motion.g filter={`url(#head-${uid})`}
        animate={{
          x: [h0[0], h1[0], h2[0], h3[0], h4[0]],
          y: [h0[1], h1[1], h2[1], h3[1], h4[1]],
          opacity: [0, 1, 1, 0.4, 0],
        }}
        transition={{ duration: T, times: [0, 0.10, 0.55, 0.85, 1.0], ease: [0.25, 0, 0.75, 1] }}
      >
        <circle r={1.5} fill="rgba(6,220,240,0.5)" />
        <circle r={0.7} fill="white" />
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
