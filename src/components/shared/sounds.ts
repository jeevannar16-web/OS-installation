let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function play(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch {
    // AudioContext not available — silent fallback
  }
}

export function playUsbConnect() {
  play(880, 0.08, "sine", 0.12);
  setTimeout(() => play(1100, 0.1, "sine", 0.12), 80);
}

export function playUsbDisconnect() {
  play(1100, 0.08, "sine", 0.12);
  setTimeout(() => play(880, 0.1, "sine", 0.12), 80);
}

export function playPostBeep() {
  play(1000, 0.15, "square", 0.08);
}

export function playKeyClick() {
  play(600 + Math.random() * 200, 0.03, "square", 0.04);
}

export function playSuccess() {
  play(523, 0.12, "sine", 0.1);
  setTimeout(() => play(659, 0.12, "sine", 0.1), 120);
  setTimeout(() => play(784, 0.2, "sine", 0.1), 240);
}

export function playError() {
  play(200, 0.15, "sawtooth", 0.08);
  setTimeout(() => play(150, 0.2, "sawtooth", 0.08), 150);
}

export function playClick() {
  play(800, 0.02, "sine", 0.06);
}
