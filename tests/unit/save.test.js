/**
 * Unit tests for save.js - LocalStorage persistence.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveGame,
  loadGame,
  clearSave,
  validateState,
  createNewGame,
  STORAGE_KEY,
  SCHEMA_VERSION
} from '../../js/save.js';

// Mock state for testing
function makeTestState(overrides = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: 'explorador',
    mode: 'campaign',
    attributes: { faiscas: 60, brilho: 65, escudo: 50 },
    stars: 5,
    campaign: {
      currentPlanet: 2,
      currentHouse: 3,
      completedPlanets: [1],
      defeatedBosses: [1],
      lossCount: 0
    },
    upgrades: ['cerebro_relampago'],
    mochila: { storedIdea: null, storedIdea2: null },
    settings: { soundEnabled: false, narrationEnabled: false },
    ...overrides
  };
}

describe('saveGame and loadGame', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a complete state', () => {
    const state = makeTestState();
    saveGame(state);
    const loaded = loadGame();
    expect(loaded.profile).toBe('explorador');
    expect(loaded.attributes).toEqual({ faiscas: 60, brilho: 65, escudo: 50 });
    expect(loaded.campaign.currentPlanet).toBe(2);
    expect(loaded.upgrades).toContain('cerebro_relampago');
  });

  it('round-trips navegante profile', () => {
    const state = makeTestState({ profile: 'navegante' });
    saveGame(state);
    expect(loadGame().profile).toBe('navegante');
  });

  it('returns default state when no save exists', () => {
    const loaded = loadGame();
    expect(loaded.profile).toBeNull();
    expect(loaded.campaign.currentPlanet).toBe(1);
    expect(loaded.campaign.currentHouse).toBe(0);
  });

  it('preserves mochila state', () => {
    const state = makeTestState();
    state.mochila = {
      storedIdea: { text: 'Test idea', modifiers: { faiscas: 5 } },
      storedIdea2: null
    };
    saveGame(state);
    const loaded = loadGame();
    expect(loaded.mochila.storedIdea).toEqual({ text: 'Test idea', modifiers: { faiscas: 5 } });
    expect(loaded.mochila.storedIdea2).toBeNull();
  });
});

describe('validateState', () => {
  it('accepts valid state', () => {
    expect(validateState(makeTestState())).toBe(true);
  });

  it('rejects null', () => {
    expect(validateState(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(validateState('string')).toBe(false);
  });

  it('rejects missing schemaVersion', () => {
    const s = makeTestState();
    delete s.schemaVersion;
    expect(validateState(s)).toBe(false);
  });

  it('rejects wrong schemaVersion', () => {
    const s = makeTestState({ schemaVersion: 999 });
    expect(validateState(s)).toBe(false);
  });

  it('rejects missing attributes', () => {
    const s = makeTestState();
    delete s.attributes;
    expect(validateState(s)).toBe(false);
  });

  it('rejects missing campaign', () => {
    const s = makeTestState();
    delete s.campaign;
    expect(validateState(s)).toBe(false);
  });

  it('rejects missing mochila', () => {
    const s = makeTestState();
    delete s.mochila;
    expect(validateState(s)).toBe(false);
  });

  it('rejects upgrades not an array', () => {
    const s = makeTestState();
    s.upgrades = 'not-array';
    expect(validateState(s)).toBe(false);
  });
});

describe('loadGame with corrupted data', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default when localStorage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');
    const loaded = loadGame();
    expect(loaded.profile).toBeNull();
  });

  it('returns default when schema version mismatch', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 0, profile: 'explorador' }));
    const loaded = loadGame();
    expect(loaded.profile).toBeNull();
  });
});

describe('clearSave', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes saved data', () => {
    saveGame(makeTestState());
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearSave();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('createNewGame', () => {
  it('creates explorador game with correct attributes', () => {
    const state = createNewGame('explorador');
    expect(state.profile).toBe('explorador');
    expect(state.attributes).toEqual({ faiscas: 60, brilho: 65, escudo: 50 });
    expect(state.campaign.currentPlanet).toBe(1);
    expect(state.campaign.currentHouse).toBe(0);
    expect(state.stars).toBe(0);
    expect(state.upgrades).toEqual([]);
  });

  it('creates navegante game with correct attributes', () => {
    const state = createNewGame('navegante');
    expect(state.profile).toBe('navegante');
    expect(state.attributes).toEqual({ faiscas: 50, brilho: 60, escudo: 40 });
  });
});
