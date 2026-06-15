/**
 * Collects gameplay data for the session report.
 * Persists to localStorage, exportable as JSON.
 */

const STORAGE_PREFIX = 'neuronautas:session:';

class SessionTracker {
  #sessionId = null;
  #phases = [];
  #phaseStart = null;

  constructor() {
    this.#sessionId = crypto.randomUUID();
  }

  get sessionId() { return this.#sessionId; }

  startPhase(phaseId) {
    this.#phaseStart = Date.now();
    this.#phases.push({
      phaseId,
      itemsDropped: [],
      durationMs: 0,
      biasDetected: false
    });
  }

  recordDrop(itemId, correct) {
    const phase = this.#phases[this.#phases.length - 1];
    if (!phase) return;
    phase.itemsDropped.push({
      itemId,
      correct,
      timestampMs: Date.now()
    });
  }

  endPhase(biasDetected = false) {
    const phase = this.#phases[this.#phases.length - 1];
    if (!phase) return;
    phase.durationMs = Date.now() - (this.#phaseStart || Date.now());
    if (biasDetected) phase.biasDetected = true;
  }

  getReport() {
    return {
      sessionId: this.#sessionId,
      timestamp: new Date().toISOString(),
      phases: this.#phases
    };
  }

  save() {
    try {
      const key = STORAGE_PREFIX + this.#sessionId;
      localStorage.setItem(key, JSON.stringify(this.getReport()));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }

  exportJSON() {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

export default SessionTracker;
