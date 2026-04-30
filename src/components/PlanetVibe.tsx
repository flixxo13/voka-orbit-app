import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface PlanetVibeProps {
  letter: string;
  colorFrom: string;
  colorTo: string;
  isDead: boolean;
  isWrong: boolean;
  onTap?: () => void;
  className?: string;
  layoutId?: string; // Optional for framer motion shared layout transitions
}

export function PlanetVibe({
  letter,
  colorFrom,
  colorTo,
  isDead,
  isWrong,
  onTap,
  className = '',
  layoutId
}: PlanetVibeProps) {
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  // Device orientation for mobile tilt effect
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!e.beta || !e.gamma) return;
      // beta is front-to-back tilt in degrees, where front is positive
      // gamma is left-to-right tilt in degrees, where right is positive
      const maxTilt = 30;
      
      // Clamp values
      const gamma = Math.max(-maxTilt, Math.min(maxTilt, e.gamma));
      const beta = Math.max(-maxTilt, Math.min(maxTilt, e.beta - 45)); // Offset assuming holding at 45deg
      
      // Smooth lerp would be ideal, but direct setting is fine if the browser triggers it smoothly
      setTiltX(gamma);
      setTiltY(beta);
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      // Note: iOS 13+ requires permission for this, which must be requested on user interaction.
      // We will gracefully fall back to zero tilt if permission is not granted/requested.
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  const baseStyle = {
    '--planet-base-color': colorFrom,
  } as React.CSSProperties;

  const tiltTransform = `rotateX(${-tiltY}deg) rotateY(${tiltX}deg)`;

  return (
    <motion.div
      layoutId={layoutId}
      className={`planet-vibe-container ${isDead ? 'planet-dead' : ''} ${className}`}
      style={baseStyle}
      onClick={isDead ? undefined : onTap}
      whileTap={isDead ? {} : { scale: 0.85 }}
      animate={isWrong ? {
        x: [-8, 8, -8, 8, 0],
        transition: { duration: 0.4 }
      } : {}}
    >
      {/* Halo for Rim Lighting and Atmosphere Scattering */}
      <div 
        className="planet-halo"
        style={{
          background: `radial-gradient(circle, ${colorFrom} 0%, transparent 70%)`
        }}
      />

      {/* The 3D Sphere */}
      <div 
        className="planet-sphere"
        style={{ transform: tiltTransform }}
      >
        <div className="planet-layer-base" />
        <div className="planet-layer-detail" />
      </div>

      {/* Surface-Mounted Letter */}
      <div 
        className="planet-letter"
        style={{ 
          transform: `translateZ(20px) ${tiltTransform}`,
          textShadow: isDead ? 'none' : `0 0 8px ${colorTo}, 0 2px 4px rgba(0,0,0,0.8)`
        }}
      >
        {letter}
      </div>
    </motion.div>
  );
}
