// Sound effects for the game using Web Audio API
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!ctx) ctx = createAudioContext();
  return ctx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "square", volume = 0.15) {
  const ac = getCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch {
    // ignore audio errors
  }
}

export const sounds = {
  move: () => playTone(440, 0.08, "square", 0.1),
  attack: () => {
    playTone(200, 0.1, "sawtooth", 0.2);
    setTimeout(() => playTone(150, 0.15, "sawtooth", 0.15), 80);
  },
  win: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, "triangle", 0.2), i * 120));
  },
  fail: () => {
    playTone(300, 0.15, "sawtooth", 0.2);
    setTimeout(() => playTone(200, 0.25, "sawtooth", 0.2), 120);
  },
  step: () => playTone(880, 0.05, "square", 0.05),
  coin: () => {
    playTone(1047, 0.08, "sine", 0.15);
    setTimeout(() => playTone(1319, 0.12, "sine", 0.12), 60);
  },
  purchase: () => {
    const notes = [392, 494, 587];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.1, "sine", 0.15), i * 80));
  },
};
