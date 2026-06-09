import React from 'react';
import { motion } from 'framer-motion';

interface LogoAnimationProps {
  scale?: number;
  className?: string;
}

export const LogoAnimation: React.FC<LogoAnimationProps> = ({ scale = 1, className = '' }) => {
  return (
    <div 
      className={`logo-canvas-area ${className}`} 
      style={{ transform: `scale(${scale})` }}
    >
      <div className="ambient-orbit-rings">
        <div className="ring-wrapper ring-outer">
          <div className="ring-spin"></div>
        </div>
        <div className="ring-wrapper ring-middle">
          <div className="ring-spin"></div>
        </div>
        <div className="ring-wrapper ring-inner">
          <div className="ring-spin"></div>
        </div>
      </div>
      
      <div className="logo-orbit-container">
        <div className="mini-planet planet-purple planet-1">
          <div className="letter-inner"></div>
        </div>
        <div className="mini-planet planet-cyan planet-2">
          <div className="letter-inner"></div>
        </div>
        <div className="mini-planet planet-violet planet-3">
          <div className="letter-inner"></div>
        </div>
      </div>
    </div>
  );
};
