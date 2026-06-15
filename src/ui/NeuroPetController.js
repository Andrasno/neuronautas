/**
 * NeuroPet mascot controller — emotional states and animations.
 * Emoji-based for MVP. Swappable to sprite sheet / Lottie later.
 */

const ANIMATIONS = {
  sleeping:   { frames: ['😴', '😴', '💤'], interval: 800 },
  curious:    { frames: ['🤖', '👀', '🤖'], interval: 400 },
  thinking:   { frames: ['🤔', '⚙️', '💭'], interval: 200 },
  happy:      { frames: ['😊', '⭐', '😊'], interval: 300 },
  confused:   { frames: ['😕', '❓', '😕'], interval: 500 },
  celebrating:{ frames: ['🎉', '😄', '✨'], interval: 150 },
};

class NeuroPetController {
  #el = null;
  #state = 'sleeping';
  #frameIdx = 0;
  #timer = null;

  constructor(containerEl) {
    this.#el = document.createElement('div');
    this.#el.className = 'neuropet';
    this.#el.setAttribute('role', 'img');
    this.#el.setAttribute('aria-live', 'polite');
    containerEl.appendChild(this.#el);
    this.setState('sleeping');
  }

  setState(state) {
    if (!ANIMATIONS[state]) return;
    this.#state = state;
    this.#frameIdx = 0;
    this.#render();
    this.#startAnimation();
  }

  #render() {
    const anim = ANIMATIONS[this.#state];
    this.#el.textContent = anim.frames[this.#frameIdx];
    this.#el.className = `neuropet neuropet--${this.#state}`;
    this.#el.setAttribute('aria-label', `NeuroPet está ${this.#state}`);
  }

  #startAnimation() {
    clearInterval(this.#timer);
    const anim = ANIMATIONS[this.#state];
    if (anim.frames.length <= 1) return;
    this.#timer = setInterval(() => {
      this.#frameIdx = (this.#frameIdx + 1) % anim.frames.length;
      this.#el.textContent = anim.frames[this.#frameIdx];
    }, anim.interval);
  }

  get state() { return this.#state; }

  get el() { return this.#el; }

  destroy() {
    clearInterval(this.#timer);
    if (this.#el.parentNode) this.#el.parentNode.removeChild(this.#el);
  }
}

export default NeuroPetController;
