/**
 * Speech bubble with reactive text and animations.
 */
class SpeechBubble {
  #el = null;
  #visible = false;

  constructor(containerEl) {
    this.#el = document.createElement('div');
    this.#el.className = 'speech-bubble';
    this.#el.setAttribute('role', 'status');
    this.#el.setAttribute('aria-live', 'polite');
    containerEl.appendChild(this.#el);
  }

  show(text) {
    this.#el.textContent = text;
    if (!this.#visible) {
      this.#el.classList.add('visible');
      this.#visible = true;
    } else {
      // Re-trigger animation for subsequent messages
      this.#el.classList.remove('visible');
      void this.#el.offsetWidth; // force reflow
      this.#el.classList.add('visible');
    }
  }

  hide() {
    this.#el.classList.remove('visible');
    this.#visible = false;
  }

  get el() { return this.#el; }
}

export default SpeechBubble;
