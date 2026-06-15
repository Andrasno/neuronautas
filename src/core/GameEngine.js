/**
 * Finite state machine for Neuronautas game flow.
 * Guards invalid transitions, emits state-change events.
 */
import EventBus from './EventBus.js';

export const STATES = {
  MENU:           'menu',
  BRIEFING:       'briefing',
  COLLECTION_1:   'collection_1',
  BIAS_TEST:      'bias_test',
  ERROR_FEEDBACK: 'error_feedback',
  COLLECTION_2:   'collection_2',
  FINAL_TEST:     'final_test',
  VICTORY:        'victory'
};

const TRANSITIONS = {
  [STATES.MENU]:           [STATES.BRIEFING],
  [STATES.BRIEFING]:       [STATES.COLLECTION_1],
  [STATES.COLLECTION_1]:   [STATES.BIAS_TEST],
  [STATES.BIAS_TEST]:      [STATES.ERROR_FEEDBACK],
  [STATES.ERROR_FEEDBACK]: [STATES.COLLECTION_2],
  [STATES.COLLECTION_2]:   [STATES.FINAL_TEST],
  [STATES.FINAL_TEST]:     [STATES.VICTORY],
  [STATES.VICTORY]:        [STATES.MENU]
};

class GameEngine {
  #state = STATES.MENU;

  transition(to) {
    const allowed = TRANSITIONS[this.#state] ?? [];
    if (!allowed.includes(to)) {
      console.warn(`[GameEngine] Transição inválida: ${this.#state} → ${to}`);
      return false;
    }
    const from = this.#state;
    this.#state = to;
    EventBus.emit('game:state:change', { from, to });
    return true;
  }

  get state() { return this.#state; }
}

export default GameEngine;
