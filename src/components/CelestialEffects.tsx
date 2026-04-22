export const CelestialEffects = () => {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999, background: 'rgba(255,0,0,0.1)' }}>
      <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-yellow-400 animate-bounce">
        DEBUG: ICH BIN DA!
      </div>
    </div>
  );
};
