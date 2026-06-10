/**
 * Unit tests for profile.js - profile definitions and rules
 */
import { describe, it, expect } from 'vitest';
import {
  getProfileForAge,
  getProfile,
  getPlanet,
  getPrimaryAttribute,
  getBossThreshold,
  PROFILE_KEYS,
  PLANETS,
  PROFILES,
  ATTRIBUTES
} from '../../js/profile.js';

describe('getProfileForAge', () => {
  it('returns explorador for age 6', () => {
    expect(getProfileForAge(6).key).toBe('explorador');
  });
  it('returns explorador for age 7', () => {
    expect(getProfileForAge(7).key).toBe('explorador');
  });
  it('returns explorador for age 8', () => {
    expect(getProfileForAge(8).key).toBe('explorador');
  });
  it('returns navegante for age 9', () => {
    expect(getProfileForAge(9).key).toBe('navegante');
  });
  it('returns navegante for age 10', () => {
    expect(getProfileForAge(10).key).toBe('navegante');
  });
  it('returns navegante for age 11', () => {
    expect(getProfileForAge(11).key).toBe('navegante');
  });
  it('returns null for age 5', () => {
    expect(getProfileForAge(5)).toBeNull();
  });
  it('returns null for age 12', () => {
    expect(getProfileForAge(12)).toBeNull();
  });
  it('returns null for NaN', () => {
    expect(getProfileForAge('abc')).toBeNull();
  });
});

describe('getProfile', () => {
  it('returns explorador profile by key', () => {
    const p = getProfile('explorador');
    expect(p.key).toBe('explorador');
    expect(p.boardSize).toBe(15);
  });
  it('returns navegante profile by key', () => {
    const p = getProfile('navegante');
    expect(p.key).toBe('navegante');
    expect(p.boardSize).toBe(30);
  });
  it('returns null for unknown key', () => {
    expect(getProfile('unknown')).toBeNull();
  });
});

describe('PROFILES: explorador', () => {
  const p = PROFILES.explorador;
  it('has correct board size', () => expect(p.boardSize).toBe(15));
  it('has housesPerPlanet = 3', () => expect(p.housesPerPlanet).toBe(3));
  it('has diceCount = 2', () => expect(p.diceCount).toBe(2));
  it('has diceAgency = pick-one', () => expect(p.diceAgency).toBe('pick-one'));
  it('has minAttr = 5', () => expect(p.minAttr).toBe(5));
  it('has maxPenalty = -5', () => expect(p.maxPenalty).toBe(-5));
  it('has modifierDisplay = icons-only', () => expect(p.modifierDisplay).toBe('icons-only'));
  it('has maxRerolls = 0', () => expect(p.maxRerolls).toBe(0));
  it('has correct starting attributes', () => {
    expect(p.startingAttr).toEqual({ faiscas: 60, brilho: 65, escudo: 50 });
  });
  it('getTilePattern returns 3 tiles per planet', () => {
    expect(p.getTilePattern()).toHaveLength(3);
  });
  it('getTilePattern ends with chefao', () => {
    const pattern = p.getTilePattern();
    expect(pattern[pattern.length - 1]).toBe('chefao');
  });
});

describe('PROFILES: navegante', () => {
  const p = PROFILES.navegante;
  it('has correct board size', () => expect(p.boardSize).toBe(30));
  it('has housesPerPlanet = 6', () => expect(p.housesPerPlanet).toBe(6));
  it('has diceCount = 1', () => expect(p.diceCount).toBe(1));
  it('has diceAgency = reroll', () => expect(p.diceAgency).toBe('reroll'));
  it('has minAttr = 0', () => expect(p.minAttr).toBe(0));
  it('has maxPenalty = -15', () => expect(p.maxPenalty).toBe(-15));
  it('has modifierDisplay = vague-hint', () => expect(p.modifierDisplay).toBe('vague-hint'));
  it('has maxRerolls = 3', () => expect(p.maxRerolls).toBe(3));
  it('has correct starting attributes', () => {
    expect(p.startingAttr).toEqual({ faiscas: 50, brilho: 60, escudo: 40 });
  });
  it('getTilePattern returns 6 tiles per planet', () => {
    expect(p.getTilePattern()).toHaveLength(6);
  });
  it('getTilePattern ends with chefao', () => {
    const pattern = p.getTilePattern();
    expect(pattern[pattern.length - 1]).toBe('chefao');
  });
});

describe('PLANETS', () => {
  it('has 5 planets', () => {
    expect(PLANETS).toHaveLength(5);
  });
  it('each planet has id, key, name, color, theme', () => {
    PLANETS.forEach(p => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('key');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('color');
      expect(p).toHaveProperty('theme');
    });
  });
  it('planets have unique ids', () => {
    const ids = PLANETS.map(p => p.id);
    expect(new Set(ids).size).toBe(PLANETS.length);
  });
});

describe('getPlanet', () => {
  it('returns planet for id 1', () => {
    expect(getPlanet(1).key).toBe('criatividade');
  });
  it('returns planet for id 5', () => {
    expect(getPlanet(5).key).toBe('confusoes');
  });
  it('returns null for id 6', () => {
    expect(getPlanet(6)).toBeNull();
  });
});

describe('getPrimaryAttribute', () => {
  it('maps criatividade to faiscas', () => {
    expect(getPrimaryAttribute('criatividade')).toBe('faiscas');
  });
  it('maps etica to brilho', () => {
    expect(getPrimaryAttribute('etica')).toBe('brilho');
  });
  it('maps seguranca to escudo', () => {
    expect(getPrimaryAttribute('seguranca')).toBe('escudo');
  });
  it('maps pressa to faiscas', () => {
    expect(getPrimaryAttribute('pressa')).toBe('faiscas');
  });
  it('maps confusoes to brilho', () => {
    expect(getPrimaryAttribute('confusoes')).toBe('brilho');
  });
  it('returns faiscas for unknown key', () => {
    expect(getPrimaryAttribute('unknown')).toBe('faiscas');
  });
});

describe('getBossThreshold', () => {
  it('returns 40 for explorador', () => {
    expect(getBossThreshold('explorador')).toBe(40);
  });
  it('returns 60 for navegante', () => {
    expect(getBossThreshold('navegante')).toBe(60);
  });
});

describe('ATTRIBUTES', () => {
  it('has three attributes: faiscas, brilho, escudo', () => {
    expect(Object.keys(ATTRIBUTES)).toEqual(['faiscas', 'brilho', 'escudo']);
  });
  it('each attribute has name, icon, color, label', () => {
    Object.values(ATTRIBUTES).forEach(attr => {
      expect(attr).toHaveProperty('name');
      expect(attr).toHaveProperty('icon');
      expect(attr).toHaveProperty('color');
      expect(attr).toHaveProperty('label');
    });
  });
});
