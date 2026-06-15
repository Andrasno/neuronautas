/**
 * Audio manager. Uses Howler.js from CDN or falls back to Web Audio API beeps.
 * Graceful degradation: game works fully without sound.
 */
class AudioManager {
  #enabled = true;
  #ctx = null;        // AudioContext (lazy)

  constructor() {
    // Detect reduced motion / audio preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#enabled = false;
    }
  }

  get enabled() { return this.#enabled; }

  toggle() {
    this.#enabled = !this.#enabled;
    return this.#enabled;
  }

  /** Play a simple tone via Web Audio (no files needed) */
  play(key) {
    if (!this.#enabled) return;

    const tones = {
      'drop-correct':  { freq: 523, duration: 0.12, type: 'sine' },   // C5
      'drop-wrong':    { freq: 200, duration: 0.2,  type: 'square' },  // low buzz
      'error':         { freq: 150, duration: 0.4,  type: 'sawtooth' },// descending
      'success':       { freq: 660, duration: 0.15, type: 'sine' },   // E5
      'celebrate':     { freq: 880, duration: 0.3,  type: 'triangle' },// A5
    };

    const tone = tones[key];
    if (!tone) return;

    try {
      if (!this.#ctx) this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = this.#ctx.createOscillator();
      const gain = this.#ctx.createGain();
      osc.type = tone.type;
      osc.frequency.value = tone.freq;
      gain.gain.setValueAtTime(0.15, this.#ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.#ctx.currentTime + tone.duration);
      osc.connect(gain);
      gain.connect(this.#ctx.destination);
      osc.start(this.#ctx.currentTime);
      osc.stop(this.#ctx.currentTime + tone.duration);
    } catch (e) {
      // Silently fail — audio is enhancement, not core
    }
  }
}

export default AudioManager;
