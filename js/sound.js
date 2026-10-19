/**
 * Web Audio 手続き生成の控えめな UI 音
 */

const STORAGE_KEY = 'prompt-notebook:muted';

/** @type {AudioContext|null} */
let ctx = null;
let muted = false;

export function initSound() {
  try {
    muted = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    muted = false;
  }
  return muted;
}

export function isMuted() {
  return muted;
}

export function setMuted(next) {
  muted = Boolean(next);
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
  return muted;
}

export function toggleMute() {
  return setMuted(!muted);
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/**
 * @param {number} freq
 * @param {number} duration
 * @param {{ type?: OscillatorType, gain?: number, attack?: number, decay?: number, delay?: number }} [opts]
 */
function beep(freq, duration, opts = {}) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const type = opts.type || 'sine';
  const gainLevel = (opts.gain ?? 0.04) * 0.7;
  const attack = opts.attack ?? 0.008;
  const decay = opts.decay ?? duration;
  const delay = opts.delay ?? 0;
  const t0 = ac.currentTime + delay;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainLevel, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + decay + 0.02);
}

export function playChip() {
  beep(660, 0.08, { type: 'triangle', gain: 0.035, attack: 0.004, decay: 0.07 });
}

export function playCopy() {
  beep(880, 0.1, { type: 'sine', gain: 0.04, decay: 0.1 });
  beep(1320, 0.12, { type: 'sine', gain: 0.03, delay: 0.05, decay: 0.12 });
}

export function playSave() {
  beep(520, 0.1, { type: 'sine', gain: 0.04, decay: 0.1 });
  beep(780, 0.14, { type: 'sine', gain: 0.035, delay: 0.07, decay: 0.14 });
}

export function playDelete() {
  beep(320, 0.16, { type: 'triangle', gain: 0.035, decay: 0.16 });
  beep(220, 0.18, { type: 'sine', gain: 0.03, delay: 0.06, decay: 0.18 });
}

export function playFavorite() {
  beep(740, 0.08, { type: 'sine', gain: 0.04, decay: 0.08 });
  beep(1110, 0.12, { type: 'sine', gain: 0.03, delay: 0.05, decay: 0.12 });
  beep(1480, 0.1, { type: 'triangle', gain: 0.02, delay: 0.1, decay: 0.1 });
}
