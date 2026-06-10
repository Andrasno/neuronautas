/**
 * Integration tests for the turn flow: board + dice + movement + tile resolution.
 */
import { describe, it, expect } from 'vitest';
import {
  generateBoard,
  resolveLanding,
  getTileType,
  rollDiceWithAgency,
  TILE_TYPES
} from '../../js/board.js';
import { getProfile } from '../../js/profile.js';
import { createNewGame, saveGame, loadGame } from '../../js/save.js';
import { clamp } from '../../js/utils.js';

/**
 * Simulate a full turn: roll dice -> move -> resolve tile type.
 * This tests the logic without DOM interaction.
 */
function simulateTurn(state, chosenDiceValue) {
  const profile = getProfile(state.profile);
  const tiles = state._boardTiles || generateBoard(state.profile);
  state._boardTiles = tiles;

  // Get global position
  const perPlanet = profile.housesPerPlanet;
  const globalPos = (state.campaign.currentPlanet - 1) * perPlanet + state.campaign.currentHouse;

  // Calculate landing
  const newGlobalPos = resolveLanding(tiles, globalPos, chosenDiceValue, state);

  // Update state
  state.campaign.currentPlanet = Math.floor(newGlobalPos / perPlanet) + 1;
  state.campaign.currentHouse = newGlobalPos % perPlanet;

  return {
    tileType: getTileType(tiles, newGlobalPos),
    newPlanet: state.campaign.currentPlanet,
    newHouse: state.campaign.currentHouse
  };
}

describe('Turn flow - Explorador', () => {
  it('turn 1: treino tile', () => {
    const state = createNewGame('explorador');
    state._boardTiles = generateBoard('explorador');

    // Roll 1: move from 0 to 1 (surpresa)
    let result = simulateTurn(state, 1);
    expect(result.tileType).toBe(TILE_TYPES.SURPRESA);
    expect(result.newPlanet).toBe(1);
    expect(result.newHouse).toBe(1);

    // Save and reload
    saveGame(state);
    const loaded = loadGame();
    expect(loaded.campaign.currentHouse).toBe(1);
  });

  it('turn 2: from position 1, roll 1 lands on chefao', () => {
    const state = createNewGame('explorador');
    state.campaign.currentHouse = 1;
    state._boardTiles = generateBoard('explorador');

    const result = simulateTurn(state, 1);
    expect(result.tileType).toBe(TILE_TYPES.CHEFAO);
    expect(result.newHouse).toBe(2);
  });

  it('overshoot chefao: from 0, roll 5 clamps to 2', () => {
    const state = createNewGame('explorador');
    state._boardTiles = generateBoard('explorador');

    const result = simulateTurn(state, 5);
    expect(result.tileType).toBe(TILE_TYPES.CHEFAO);
    expect(result.newHouse).toBe(2);
  });

  it('dice values always 1-6', () => {
    for (let i = 0; i < 30; i++) {
      const result = rollDiceWithAgency('explorador');
      result.values.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(6);
      });
    }
  });
});

describe('Turn flow - Navegante', () => {
  it('turn 1: treino tile', () => {
    const state = createNewGame('navegante');
    state._boardTiles = generateBoard('navegante');

    // Roll 1 from position 0 -> 1 (surpresa)
    let result = simulateTurn(state, 1);
    expect(result.tileType).toBe(TILE_TYPES.SURPRESA);
    expect(result.newHouse).toBe(1);
  });

  it('land on evolucao tile', () => {
    const state = createNewGame('navegante');
    state.campaign.currentHouse = 2; // at treino
    state._boardTiles = generateBoard('navegante');

    // Roll 1 -> position 3 (evolucao)
    const result = simulateTurn(state, 1);
    expect(result.tileType).toBe(TILE_TYPES.EVOLUCAO);
    expect(result.newHouse).toBe(3);
  });

  it('overshoot chefao: from 4, roll 3 clamps to 5', () => {
    const state = createNewGame('navegante');
    state.campaign.currentHouse = 4;
    state._boardTiles = generateBoard('navegante');

    const result = simulateTurn(state, 3);
    expect(result.tileType).toBe(TILE_TYPES.CHEFAO);
    expect(result.newHouse).toBe(5);
  });

  it('cross planet boundary: from planet 1 chefao to planet 2', () => {
    const state = createNewGame('navegante');
    state.campaign.currentPlanet = 1;
    state.campaign.currentHouse = 5;  // planet 1 chefao
    state.campaign.defeatedBosses = [1];
    state._boardTiles = generateBoard('navegante');

    // Roll 3 from glob pos 5 -> 8 (planet 2, house 2 = treino)
    const result = simulateTurn(state, 3);
    expect(result.newPlanet).toBe(2);
    expect(result.newHouse).toBe(2);
    expect(result.tileType).toBe(TILE_TYPES.TREINO);
  });
});

describe('Save/load mid-game', () => {
  it('preserves board state after several turns', () => {
    const state = createNewGame('explorador');
    state._boardTiles = generateBoard('explorador');

    // Play 3 turns
    simulateTurn(state, 1);  // house 0 -> 1
    simulateTurn(state, 1);  // house 1 -> 2 (chefao)
    saveGame(state);

    const loaded = loadGame();
    expect(loaded.campaign.currentPlanet).toBe(1);
    expect(loaded.campaign.currentHouse).toBe(2);
    expect(loaded.attributes.faiscas).toBe(state.attributes.faiscas);
  });
});

describe('Attribute persistence across turns', () => {
  it('attributes track correctly', () => {
    const state = createNewGame('explorador');
    state._boardTiles = generateBoard('explorador');

    // Simulate gaining faiscas
    state.attributes.faiscas = clamp(state.attributes.faiscas + 8, 0, 100);
    expect(state.attributes.faiscas).toBe(68);

    // Simulate losing escudo
    state.attributes.escudo = clamp(state.attributes.escudo - 3, 5, 100);
    expect(state.attributes.escudo).toBe(47);
  });

  it('explorador attributes clamped at 5', () => {
    const state = createNewGame('explorador');
    state.attributes.escudo = clamp(0, 5, 100);
    expect(state.attributes.escudo).toBe(5);

    state.attributes.faiscas = clamp(-10, 5, 100);
    expect(state.attributes.faiscas).toBe(5);
  });

  it('navegante attributes can reach 0', () => {
    const state = createNewGame('navegante');
    state.attributes.escudo = clamp(0, 0, 100);
    expect(state.attributes.escudo).toBe(0);
  });
});
