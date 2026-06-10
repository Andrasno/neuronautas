/**
 * Unit tests for utils.js - dice rolling, clamping, formatting.
 */
import { describe, it, expect } from 'vitest';
import { clamp, rollDice, formatModifier, modifierSign, pistaArrow } from '../../js/utils.js';

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
  it('clamps to minimum', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });
  it('clamps to maximum', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });
  it('clamps to min=5', () => {
    expect(clamp(3, 5, 100)).toBe(5);
  });
});

describe('rollDice', () => {
  it('returns array with correct number of dice', () => {
    expect(rollDice(1)).toHaveLength(1);
    expect(rollDice(2)).toHaveLength(2);
    expect(rollDice(3)).toHaveLength(3);
  });

  it('returns values between 1 and 6', () => {
    for (let i = 0; i < 100; i++) {
      const results = rollDice(5);
      results.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(6);
      });
    }
  });

  it('returns integer values', () => {
    for (let i = 0; i < 50; i++) {
      rollDice(3).forEach(v => {
        expect(Number.isInteger(v)).toBe(true);
      });
    }
  });

  it('produces roughly uniform distribution', () => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const trials = 6000;
    for (let i = 0; i < trials; i++) {
      const v = rollDice(1)[0];
      counts[v]++;
    }
    // Each face should appear ~1000 times. Allow 30% margin.
    for (let face = 1; face <= 6; face++) {
      expect(counts[face]).toBeGreaterThan(trials / 6 * 0.7);
      expect(counts[face]).toBeLessThan(trials / 6 * 1.3);
    }
  });
});

describe('formatModifier', () => {
  it('adds + for positive', () => {
    expect(formatModifier(8)).toBe('+8');
  });
  it('keeps - for negative', () => {
    expect(formatModifier(-3)).toBe('-3');
  });
  it('handles zero with +', () => {
    expect(formatModifier(0)).toBe('+0');
  });
});

describe('modifierSign', () => {
  it('returns positive for > 0', () => expect(modifierSign(5)).toBe('positive'));
  it('returns negative for < 0', () => expect(modifierSign(-2)).toBe('negative'));
  it('returns neutral for 0', () => expect(modifierSign(0)).toBe('neutral'));
});

describe('pistaArrow', () => {
  it('returns double up for >= 3', () => expect(pistaArrow(5)).toBe('↑↑'));
  it('returns single up for 1-2', () => expect(pistaArrow(2)).toBe('↑'));
  it('returns right for 0', () => expect(pistaArrow(0)).toBe('→'));
  it('returns single down for -1 to -2', () => expect(pistaArrow(-2)).toBe('↓'));
  it('returns double down for <= -3', () => expect(pistaArrow(-5)).toBe('↓↓'));
});
