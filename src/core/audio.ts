// Web Audio API Synthesis for ultra-lightweight, zero-dependency offline sounds.

let audioCtx: AudioContext | null = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTapSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

export function playCorrectSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getContext();
  
  // A pleasant chime (two sine waves, major third interval)
  [523.25, 659.25].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02 + (i * 0.05));
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4 + (i * 0.1));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + (i * 0.05));
    osc.stop(ctx.currentTime + 0.6);
  });
}

export function playWrongSound(enabled: boolean) {
  if (!enabled) return;
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // A low, muted thud
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  // Add a lowpass filter to muffle it
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

// Haptic feedback wrappers
export function vibrateTap() {
  if (navigator.vibrate) navigator.vibrate(15);
}

export function vibrateCorrect() {
  if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
}

export function vibrateWrong() {
  if (navigator.vibrate) navigator.vibrate([30, 50, 40]);
}

export function vibrateCombo() {
  if (navigator.vibrate) navigator.vibrate([10, 20, 10, 20, 30, 20, 40]);
}
