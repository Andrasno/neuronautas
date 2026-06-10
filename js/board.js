/**
 * Board generation, tile management, movement logic, and dice agency.
 */

import { getProfile } from './profile.js';

export const TILE_TYPES = {
  TREINO: 'treino',
  SURPRESA: 'surpresa',
  EVOLUCAO: 'evolucao',
  CHEFAO: 'chefao'
};

/**
 * Generate the board for a given profile key.
 * Returns an array of tile objects: { type, index, planetId }.
 */
export function generateBoard(profileKey) {
  const profile = getProfile(profileKey);
  if (!profile) throw new Error(`Unknown profile: ${profileKey}`);

  const tiles = [];
  const pattern = profile.getTilePattern();
  const numPlanets = 5;

  for (let planet = 1; planet <= numPlanets; planet++) {
    for (let i = 0; i < pattern.length; i++) {
      tiles.push({
        type: pattern[i],
        index: tiles.length,
        planetId: planet
      });
    }
  }

  // Validate constraint: no more than 2 consecutive same type
  validateBoardConstraints(tiles);

  return tiles;
}

/**
 * Validate that no tile type appears more than 2 times consecutively.
 * Throws if constraint violated.
 */
function validateBoardConstraints(tiles) {
  for (let i = 2; i < tiles.length; i++) {
    if (tiles[i].type === tiles[i - 1].type && tiles[i].type === tiles[i - 2].type) {
      throw new Error(
        `Board constraint violated: 3 consecutive "${tiles[i].type}" tiles at index ${i - 2}`
      );
    }
  }
}

/**
 * Generate a free-mode board with procedural tile placement.
 * Uses weighted random generation with backtracking to respect constraints.
 *
 * @param {string} profileKey - 'explorador' or 'navegante'
 * @param {number} planetOverride - if set, generate just for this planet (1-5)
 * @returns {Array} tiles array
 */
export function generateFreeBoard(profileKey, planetOverride = null) {
  const profile = getProfile(profileKey);
  if (!profile) throw new Error(`Unknown profile: ${profileKey}`);

  const numPlanets = planetOverride ? 1 : 5;
  const planetStart = planetOverride || 1;
  const tiles = [];

  for (let planet = planetStart; planet < planetStart + numPlanets; planet++) {
    const planetTiles = generatePlanetTiles(profile);
    // Set proper indices and planetId
    const offset = tiles.length;
    planetTiles.forEach((tile, i) => {
      tile.index = offset + i;
      tile.planetId = planet;
    });
    tiles.push(...planetTiles);
  }

  validateBoardConstraints(tiles);
  return tiles;
}

/**
 * Generate tiles for a single planet with tile type constraints.
 * Ensures: exactly one chefao (last tile), at most 2 consecutive same type,
 * at least one surpresa, at least one treino.
 */
function generatePlanetTiles(profile, maxAttempts = 1000) {
  const count = profile.housesPerPlanet;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tiles = [];
    // Last tile is always chefao
    const nonBossCount = count - 1;

    // Available types (excluding boss)
    const types = [TILE_TYPES.TREINO, TILE_TYPES.SURPRESA, TILE_TYPES.EVOLUCAO];

    for (let i = 0; i < nonBossCount; i++) {
      let candidate;
      const candidates = [];

      for (const type of types) {
        // Check 2-consecutive constraint
        if (i >= 1 && tiles[i - 1].type === type && i >= 2 && tiles[i - 2]?.type === type) {
          continue;
        }
        candidates.push(type);
      }

      if (candidates.length === 0) {
        // Backtracking failed, retry whole planet
        break;
      }

      // Weighted random: slightly prefer treino, then surpresa, then evolucao (least frequent)
      candidate = weightedPick(candidates, { treino: 3, surpresa: 2, evolucao: 1 });
      tiles.push({ type: candidate });
    }

    if (tiles.length === nonBossCount) {
      // Add chefao at end
      tiles.push({ type: TILE_TYPES.CHEFAO });

      // Validate we have at least one treino and one surpresa
      const typesPresent = new Set(tiles.map(t => t.type));
      if (typesPresent.has(TILE_TYPES.TREINO) && typesPresent.has(TILE_TYPES.SURPRESA)) {
        return tiles;
      }
    }
  }

  // Fallback: use fixed pattern
  return profile.getTilePattern().map(type => ({ type }));
}

/** Weighted random selection from an array */
function weightedPick(items, weights) {
  const totalWeight = items.reduce((sum, item) => sum + (weights[item] || 1), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= (weights[item] || 1);
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * Calculate the landing position after moving `diceValue` steps from `currentPosition`.
 * If the move would pass a Chefao tile, stop at the Chefao.
 * If already at/after a Chefao, normal movement.
 *
 * @param {Array} tiles - Full board tiles array
 * @param {number} currentPosition - Current tile index
 * @param {number} diceValue - Dice roll result
 * @param {Object} state - Game state (for checking boss defeated)
 * @returns {number} New position
 */
export function resolveLanding(tiles, currentPosition, diceValue, state) {
  const targetPosition = currentPosition + diceValue;
  const profile = getProfile(state.profile);
  const tilesPerPlanet = profile.housesPerPlanet;

  // Find the current planet's boss position
  const currentPlanet = state.campaign.currentPlanet;
  const planetStart = (currentPlanet - 1) * tilesPerPlanet;
  const chefaoPosition = planetStart + tilesPerPlanet - 1;

  // If we're not yet at the boss, and target would overshoot boss, clamp to boss
  if (currentPosition < chefaoPosition && targetPosition >= chefaoPosition) {
    return chefaoPosition;
  }

  // Cap at board end
  return Math.min(targetPosition, tiles.length - 1);
}

/**
 * Check if a player can leave their current tile.
 * For Chefao tiles: only after defeating the boss.
 */
export function canLeaveTile(position, tiles, state) {
  const tile = tiles[position];
  if (!tile) return true;

  if (tile.type === TILE_TYPES.CHEFAO) {
    return state.campaign.defeatedBosses.includes(tile.planetId);
  }

  return true;
}

/**
 * Get the type of the tile at a given position.
 */
export function getTileType(tiles, position) {
  return tiles[position]?.type || null;
}

/**
 * Get tiles belonging to a specific planet.
 */
export function getPlanetTiles(tiles, planetId) {
  return tiles.filter(t => t.planetId === planetId);
}

/**
 * Get the chefao tile for a planet.
 */
export function getChefaoTile(tiles, planetId) {
  return tiles.find(t => t.planetId === planetId && t.type === TILE_TYPES.CHEFAO);
}

/**
 * Roll dice with agency rules applied.
 * @param {string} profileKey - Profile key
 * @param {Array} upgrades - Owned upgrade IDs
 * @returns {Object} { values: number[], agency: 'pick-one'|'reroll', maxRerolls: number }
 */
export function rollDiceWithAgency(profileKey, upgrades = []) {
  const profile = getProfile(profileKey);
  let count = profile.diceCount;

  // Antenas Hiperativas upgrade
  if (upgrades.includes('antenas_hiperativas')) {
    count = profile.key === 'explorador' ? 3 : 2;
  }

  const values = [];
  for (let i = 0; i < count; i++) {
    values.push(Math.floor(Math.random() * 6) + 1);
  }

  return {
    values,
    agency: profile.diceAgency,
    maxRerolls: profile.maxRerolls
  };
}

/**
 * Convert a global tile index to planet-relative position.
 */
export function globalToPlanet(tileIndex, profileKey) {
  const profile = getProfile(profileKey);
  const perPlanet = profile.housesPerPlanet;
  return {
    planetId: Math.floor(tileIndex / perPlanet) + 1,
    houseIndex: tileIndex % perPlanet
  };
}
