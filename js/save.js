/**
 * LocalStorage save/load/clear with schema validation.
 */

import { deepClone } from './utils.js';

const STORAGE_KEY = 'neuronautas_save';
const SCHEMA_VERSION = 1;

/** Default state for a new game */
function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: null,
    mode: 'campaign',
    attributes: {
      faiscas: 0,
      brilho: 0,
      escudo: 0
    },
    stars: 0,
    campaign: {
      currentPlanet: 1,
      currentHouse: 0,
      completedPlanets: [],
      defeatedBosses: [],
      lossCount: 0
    },
    upgrades: [],
    mochila: {
      storedIdea: null,
      storedIdea2: null
    },
    settings: {
      soundEnabled: false,
      narrationEnabled: false
    }
  };
}

/**
 * Validate that a loaded state object has the required structure.
 * Returns true if valid, false otherwise.
 */
export function validateState(state) {
  if (!state || typeof state !== 'object') return false;
  if (state.schemaVersion !== SCHEMA_VERSION) return false;
  if (!state.attributes || typeof state.attributes !== 'object') return false;
  if (!state.campaign || typeof state.campaign !== 'object') return false;
  if (!Array.isArray(state.upgrades)) return false;
  if (!state.mochila || typeof state.mochila !== 'object') return false;
  return true;
}

/**
 * Save current game state to LocalStorage.
 */
export function saveGame(state) {
  try {
    const data = deepClone(state);
    data.schemaVersion = SCHEMA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save game:', e);
    return false;
  }
}

/**
 * Load game state from LocalStorage.
 * Returns default state if no save exists or data is corrupted.
 */
export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const state = JSON.parse(raw);
    if (!validateState(state)) return defaultState();
    return state;
  } catch (e) {
    console.error('Failed to load game:', e);
    return defaultState();
  }
}

/**
 * Delete the saved game from LocalStorage.
 */
export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear save:', e);
    return false;
  }
}

/**
 * Create a fresh game state for a given profile.
 */
export function createNewGame(profileKey) {
  const startingAttr = profileKey === 'explorador'
    ? { faiscas: 60, brilho: 65, escudo: 50 }
    : { faiscas: 50, brilho: 60, escudo: 40 };

  const state = defaultState();
  state.profile = profileKey;
  state.attributes = { ...startingAttr };
  return state;
}

export { defaultState, STORAGE_KEY, SCHEMA_VERSION };
