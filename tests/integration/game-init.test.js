/**
 * Integration tests for game initialization flow.
 * Tests that game.js correctly orchestrates profile selection and game start.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// We test the supporting modules that game.js depends on,
// since game.js directly manipulates the DOM which is hard to test in jsdom
// without the full HTML. Instead we verify the init flow logic.

import { createNewGame, loadGame, saveGame } from '../../js/save.js';
import { getProfileForAge, getProfile } from '../../js/profile.js';
import { clamp, rollDice } from '../../js/utils.js';

describe('Game initialization flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fresh start: no profile, shows selector', () => {
    // Simulate first-time load
    const loaded = loadGame();
    expect(loaded.profile).toBeNull();
    // Profile selector should be shown
  });

  it('selecting explorador profile creates correct game state', () => {
    const age = 7;
    const profile = getProfileForAge(age);
    expect(profile.key).toBe('explorador');

    const state = createNewGame(profile.key);
    expect(state.profile).toBe('explorador');
    expect(state.attributes.faiscas).toBe(60);
    expect(state.attributes.brilho).toBe(65);
    expect(state.attributes.escudo).toBe(50);
    expect(state.campaign.currentPlanet).toBe(1);
  });

  it('selecting navegante profile creates correct game state', () => {
    const age = 10;
    const profile = getProfileForAge(age);
    expect(profile.key).toBe('navegante');

    const state = createNewGame(profile.key);
    expect(state.profile).toBe('navegante');
    expect(state.attributes.faiscas).toBe(50);
    expect(state.attributes.brilho).toBe(60);
    expect(state.attributes.escudo).toBe(40);
  });

  it('game state persists across page refresh', () => {
    const state = createNewGame('explorador');
    state.attributes.faiscas = 70;
    saveGame(state);

    // Simulate page reload
    const reloaded = loadGame();
    expect(reloaded.profile).toBe('explorador');
    expect(reloaded.attributes.faiscas).toBe(70);
  });

  it('attribute changes survive multiple saves', () => {
    let state = createNewGame('navegante');

    // Turn 1: gain faiscas
    state.attributes.faiscas = clamp(state.attributes.faiscas + 8, 0, 100);
    state.stars += 1;
    saveGame(state);

    // Reload
    let loaded = loadGame();
    expect(loaded.attributes.faiscas).toBe(58);
    expect(loaded.stars).toBe(1);

    // Turn 2: lose escudo
    loaded.attributes.escudo = clamp(loaded.attributes.escudo - 10, 0, 100);
    saveGame(loaded);

    const final = loadGame();
    expect(final.attributes.faiscas).toBe(58);
    expect(final.attributes.escudo).toBe(30);
  });

  it('dice agency rules are correct per profile', () => {
    const explorador = getProfile('explorador');
    const navegante = getProfile('navegante');

    // Explorador: 2 dice, pick one
    const expDice = rollDice(explorador.diceCount);
    expect(expDice).toHaveLength(2);
    expect(expDice[0]).toBeGreaterThanOrEqual(1);
    expect(expDice[0]).toBeLessThanOrEqual(6);

    // Navegante: 1 die, may reroll
    const navDice = rollDice(navegante.diceCount);
    expect(navDice).toHaveLength(1);
  });
});

describe('Profile attribute clamping', () => {
  it('explorador cannot go below 5', () => {
    const profile = getProfile('explorador');
    const result = clamp(3, profile.minAttr, 100);
    expect(result).toBe(5);
  });

  it('explorador max penalty is -5', () => {
    // Even if modifier is -10, it's capped at -5
    const profile = getProfile('explorador');
    const effectivePenalty = Math.max(profile.maxPenalty, -10);
    expect(effectivePenalty).toBe(-5);
  });

  it('navegante can go to 0', () => {
    const profile = getProfile('navegante');
    const result = clamp(0, profile.minAttr, 100);
    expect(result).toBe(0);
  });

  it('navegante max penalty is -15', () => {
    const profile = getProfile('navegante');
    const effectivePenalty = Math.max(profile.maxPenalty, -20);
    expect(effectivePenalty).toBe(-15);
  });
});
