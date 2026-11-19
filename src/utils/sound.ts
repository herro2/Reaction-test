let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.08,
  delaySec = 0
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export function playGoSignal(muted: boolean): void {
  if (muted) return;
  playTone(740, 0.09, 'triangle', 0.09, 0);
  playTone(987.77, 0.12, 'triangle', 0.08, 0.04);
}

export function playSuccessChime(muted: boolean): void {
  if (muted) return;
  playTone(587.33, 0.09, 'sine', 0.08, 0);
  playTone(880, 0.16, 'sine', 0.08, 0.06);
}

export function playErrorBuzz(muted: boolean): void {
  if (muted) return;
  playTone(190, 0.12, 'sawtooth', 0.055, 0);
}

export function playEarlyWarning(muted: boolean): void {
  if (muted) return;
  playTone(260, 0.11, 'square', 0.045, 0);
  playTone(195, 0.15, 'square', 0.045, 0.09);
}

export function playRoundComplete(muted: boolean): void {
  if (muted) return;
  playTone(523.25, 0.1, 'triangle', 0.075, 0);
  playTone(659.25, 0.1, 'triangle', 0.075, 0.08);
  playTone(783.99, 0.12, 'triangle', 0.075, 0.16);
  playTone(1046.5, 0.24, 'triangle', 0.08, 0.24);
}
