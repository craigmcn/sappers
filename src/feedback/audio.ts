let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!audioContext) audioContext = new AudioContextCtor();
  // Suspended until a user gesture resumes it — long-press/tap already is one.
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

/**
 * iOS Safari only creates/resumes an AudioContext when that call happens
 * synchronously inside a user-gesture event handler — a setTimeout callback
 * (e.g. the long-press flag timer) fires too late to count, leaving the
 * context stuck "suspended" and silent. Call this directly from the
 * pointerdown/touchstart handler itself, before any delay, so the context
 * is already running by the time a later playTone() call needs it.
 */
export function primeAudio(): void {
  getAudioContext();
}

/** Synthesizes a short tone — no audio asset to license or fetch. */
export function playTone(frequencyHz: number, durationMs: number): void {
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequencyHz;

  const now = context.currentTime;
  const durationSeconds = durationMs / 1000;
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + durationSeconds);
}
