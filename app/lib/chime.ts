/**
 * Soft two-note chime for island notices that need a decision. Synthesised
 * with Web Audio, so there's no asset to load.
 *
 * Browsers won't start audio before the user has interacted with the page,
 * so the audio context is created on the first click or key press. Until
 * then the chime is silently skipped — the counter and the light pass still
 * carry the signal.
 */

let ctx: AudioContext | null = null;
let armed = false;

/** Create the audio context on the first user gesture. Safe to call often. */
export function armChime(): void {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const unlock = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    try {
      ctx ??= new AudioContext();
      void ctx.resume();
    } catch {
      // No Web Audio — stay silent.
    }
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

/**
 * A soft, bell-like two-note chime (~1.4s): a low major sixth (G4 → E5),
 * each note a sine with a faint octave overtone, eased in rather than struck
 * and left to ring out slowly, through a low-pass filter that rounds off
 * any edge.
 */
export function playChime(): void {
  if (!ctx || ctx.state !== "running") return;
  const notes = [
    { freq: 392, at: 0 }, // G4
    { freq: 659.25, at: 0.16 }, // E5
  ];
  const now = ctx.currentTime;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  filter.connect(ctx.destination);

  for (const { freq, at } of notes) {
    const begin = now + at;
    // Fundamental plus a quiet octave partial gives the bell colour.
    for (const [mult, level] of [
      [1, 0.16],
      [2, 0.035],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * mult;
      gain.gain.setValueAtTime(0, begin);
      gain.gain.linearRampToValueAtTime(level, begin + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, begin + 1.2);
      osc.connect(gain).connect(filter);
      osc.start(begin);
      osc.stop(begin + 1.25);
    }
  }
}
