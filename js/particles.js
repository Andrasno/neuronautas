/**
 * Lightweight canvas-based particle system for reward effects.
 */

export class ParticleSystem {
  constructor(canvasId = 'particle-canvas') {
    // Canvas is created lazily on first emission
    this._canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this._rafId = null;
    this._lastTime = null;
    this._resizeHandler = null;
    this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  _ensureCanvas() {
    if (this.canvas) return;
    this.canvas = document.getElementById(this._canvasId);
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = this._canvasId;
      this.canvas.style.cssText =
        'position:fixed;inset:0;z-index:150;pointer-events:none;width:100%;height:100%';
      document.body.appendChild(this.canvas);
    }
    this.ctx = this.canvas.getContext('2d');
    this._resize();
    this._resizeHandler = () => this._resize();
    window.addEventListener('resize', this._resizeHandler);
  }

  _resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Emit a particle burst at viewport coordinates.
   * @param {number} x - Viewport X
   * @param {number} y - Viewport Y
   * @param {Object} config
   */
  emit(x, y, config = {}) {
    if (this._reducedMotion) return;
    this._ensureCanvas();

    const {
      count = 12,
      colors = ['#f0c040', '#ffdd57', '#5bc0de', '#5cb85c'],
      speed = 100,
      size = 4,
      gravity = 80,
      life = 1.2
    } = config;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const spd = speed * (0.6 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - speed * 0.3,
        life,
        maxLife: life,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: size * (0.5 + Math.random()),
        gravity
      });
    }

    if (!this._rafId) this._tick();
  }

  _tick(timestamp) {
    if (!this._lastTime) this._lastTime = timestamp;
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05);
    this._lastTime = timestamp;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) return false;

      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * (0.3 + 0.7 * alpha), 0, Math.PI * 2);
      this.ctx.fill();
      return true;
    });

    this.ctx.globalAlpha = 1;

    if (this.particles.length > 0) {
      this._rafId = requestAnimationFrame(t => this._tick(t));
    } else {
      this._rafId = null;
      this._lastTime = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    this.particles.length = 0;
  }
}

/** Singleton instance */
let instance = null;

export function getParticleSystem() {
  if (!instance) instance = new ParticleSystem();
  return instance;
}
