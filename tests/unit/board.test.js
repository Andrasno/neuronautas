/**
 * Unit tests for board.js - board generation, movement, tile constraints.
 */
import { describe, it, expect } from 'vitest';
import {
  generateBoard,
  generateFreeBoard,
  resolveLanding,
  canLeaveTile,
  getTileType,
  getPlanetTiles,
  getChefaoTile,
  globalToPlanet,
  rollDiceWithAgency,
  TILE_TYPES
} from '../../js/board.js';

// Helper: create mock game state
function mockState(profile, planet = 1, house = 0, defeatedBosses = []) {
  return {
    profile,
    campaign: {
      currentPlanet: planet,
      currentHouse: house,
      defeatedBosses,
      completedPlanets: []
    }
  };
}

describe('generateBoard', () => {
  it('creates 15 tiles for explorador', () => {
    const tiles = generateBoard('explorador');
    expect(tiles).toHaveLength(15);
  });

  it('creates 30 tiles for navegante', () => {
    const tiles = generateBoard('navegante');
    expect(tiles).toHaveLength(30);
  });

  it('each tile has type, index, planetId', () => {
    const tiles = generateBoard('explorador');
    tiles.forEach(tile => {
      expect(tile).toHaveProperty('type');
      expect(tile).toHaveProperty('index');
      expect(tile).toHaveProperty('planetId');
      expect(tile.index).toBeGreaterThanOrEqual(0);
      expect(tile.planetId).toBeGreaterThanOrEqual(1);
      expect(tile.planetId).toBeLessThanOrEqual(5);
    });
  });

  it('tile indices are sequential starting at 0', () => {
    const tiles = generateBoard('navegante');
    tiles.forEach((tile, idx) => {
      expect(tile.index).toBe(idx);
    });
  });

  it('no 3 consecutive same type', () => {
    for (const profile of ['explorador', 'navegante']) {
      const tiles = generateBoard(profile);
      for (let i = 2; i < tiles.length; i++) {
        const same = tiles[i].type === tiles[i - 1].type && tiles[i].type === tiles[i - 2].type;
        expect(same).toBe(false);
      }
    }
  });

  it('chefao tiles at correct positions for explorador', () => {
    // 3 tiles per planet, chefao at index 2, 5, 8, 11, 14
    const tiles = generateBoard('explorador');
    const chefaoPositions = [2, 5, 8, 11, 14];
    chefaoPositions.forEach(pos => {
      expect(tiles[pos].type).toBe(TILE_TYPES.CHEFAO);
    });
  });

  it('chefao tiles at correct positions for navegante', () => {
    // 6 tiles per planet, chefao at index 5, 11, 17, 23, 29
    const tiles = generateBoard('navegante');
    const chefaoPositions = [5, 11, 17, 23, 29];
    chefaoPositions.forEach(pos => {
      expect(tiles[pos].type).toBe(TILE_TYPES.CHEFAO);
    });
  });

  it('throws for unknown profile', () => {
    expect(() => generateBoard('unknown')).toThrow();
  });
});

describe('generateFreeBoard', () => {
  it('creates correct tile count', () => {
    const expTiles = generateFreeBoard('explorador');
    expect(expTiles).toHaveLength(15);

    const navTiles = generateFreeBoard('navegante');
    expect(navTiles).toHaveLength(30);
  });

  it('ends each planet segment with chefao', () => {
    const tiles = generateFreeBoard('navegante');
    const chefaoPositions = [5, 11, 17, 23, 29];
    chefaoPositions.forEach(pos => {
      expect(tiles[pos].type).toBe(TILE_TYPES.CHEFAO);
    });
  });

  it('respects 2-consecutive constraint', () => {
    for (const profile of ['explorador', 'navegante']) {
      for (let trial = 0; trial < 20; trial++) {
        const tiles = generateFreeBoard(profile);
        for (let i = 2; i < tiles.length; i++) {
          const same = tiles[i].type === tiles[i - 1].type && tiles[i].type === tiles[i - 2].type;
          expect(same).toBe(false);
        }
      }
    }
  });

  it('each planet has at least one treino and one surpresa', () => {
    for (const profile of ['explorador', 'navegante']) {
      const tiles = generateFreeBoard(profile);
      const profileObj = {
        explorador: { housesPerPlanet: 3 },
        navegante: { housesPerPlanet: 6 }
      }[profile];

      for (let planet = 1; planet <= 5; planet++) {
        const planetTiles = getPlanetTiles(tiles, planet);
        const types = planetTiles.map(t => t.type);
        expect(types).toContain(TILE_TYPES.TREINO);
        expect(types).toContain(TILE_TYPES.SURPRESA);
        expect(types).toContain(TILE_TYPES.CHEFAO);
      }
    }
  });

  it('single planet generation works', () => {
    const tiles = generateFreeBoard('explorador', 3);
    expect(tiles).toHaveLength(3);
    expect(tiles[2].type).toBe(TILE_TYPES.CHEFAO);
    expect(tiles[0].planetId).toBe(3);
  });
});

describe('resolveLanding', () => {
  it('normal move without overshoot', () => {
    const tiles = generateBoard('explorador');
    const state = mockState('explorador', 1, 0);  // planet 1, house 0 = global pos 0
    expect(resolveLanding(tiles, 0, 2, state)).toBe(2);
  });

  it('clamps to chefao when overshooting', () => {
    const tiles = generateBoard('explorador');
    // planet 1, house 0, roll 3: target = 3, but chefao at 2, so clamp to 2
    const state = mockState('explorador', 1, 0);
    expect(resolveLanding(tiles, 0, 3, state)).toBe(2);
  });

  it('normal move past chefao if already at chefao', () => {
    const tiles = generateBoard('explorador');
    // planet 1 chefao is at global position 2
    // If already at position 2 and boss defeated, should move normally
    // But resolveLanding only handles clamping, not movement restriction
    // Movement restriction is handled by canLeaveTile
    const state = mockState('explorador', 1, 2, [1]); // at chefao, boss defeated
    // Actually, resolveLanding checks if currentPos < chefaoPos.
    // If currentPos === chefaoPos (2), it won't clamp because 2 is not < 2.
    expect(resolveLanding(tiles, 2, 2, state)).toBe(4);
  });

  it('clamp at board end', () => {
    const tiles = generateBoard('navegante');
    // Last position is 29, so 28 + 6 = 34 -> should clamp to 29
    const state = mockState('navegante', 5, 4);  // planet 5, house 4 = global 28
    expect(resolveLanding(tiles, 28, 6, state)).toBe(29);
  });

  it('works for navegante with chefao overlap', () => {
    const tiles = generateBoard('navegante');
    // planet 1, houses 0-5, chefao at 5. Current at 4, roll 3 => 7, chefao at 5, clamp to 5
    const state = mockState('navegante', 1, 4);
    expect(resolveLanding(tiles, 4, 3, state)).toBe(5);
  });

  it('does not clamp if not overshooting chefao', () => {
    const tiles = generateBoard('navegante');
    // planet 1, houses 0-5. Current at 0, roll 2 => 2, chefao at 5, no overshoot
    const state = mockState('navegante', 1, 0);
    expect(resolveLanding(tiles, 0, 2, state)).toBe(2);
  });
});

describe('canLeaveTile', () => {
  it('can leave non-chefao tile', () => {
    const tiles = generateBoard('explorador');
    expect(canLeaveTile(0, tiles, mockState('explorador'))).toBe(true);
    expect(canLeaveTile(1, tiles, mockState('explorador'))).toBe(true);
  });

  it('cannot leave undefeated chefao', () => {
    const tiles = generateBoard('explorador');
    const state = mockState('explorador', 1, 2); // at chefao, but not defeated
    expect(canLeaveTile(2, tiles, state)).toBe(false);
  });

  it('can leave defeated chefao', () => {
    const tiles = generateBoard('explorador');
    const state = mockState('explorador', 1, 2, [1]); // boss of planet 1 defeated
    expect(canLeaveTile(2, tiles, state)).toBe(true);
  });

  it('handles out of bounds', () => {
    const tiles = generateBoard('explorador');
    expect(canLeaveTile(99, tiles, mockState('explorador'))).toBe(true);
  });
});

describe('getTileType', () => {
  it('returns tile type', () => {
    const tiles = generateBoard('explorador');
    expect(getTileType(tiles, 0)).toBe(TILE_TYPES.TREINO);
    expect(getTileType(tiles, 1)).toBe(TILE_TYPES.SURPRESA);
    expect(getTileType(tiles, 2)).toBe(TILE_TYPES.CHEFAO);
  });

  it('returns null for out of bounds', () => {
    const tiles = generateBoard('explorador');
    expect(getTileType(tiles, -1)).toBeNull();
    expect(getTileType(tiles, 100)).toBeNull();
  });
});

describe('getPlanetTiles', () => {
  it('returns correct number of tiles per planet', () => {
    const tiles = generateBoard('explorador');
    for (let p = 1; p <= 5; p++) {
      expect(getPlanetTiles(tiles, p)).toHaveLength(3);
    }
  });
});

describe('getChefaoTile', () => {
  it('finds chefao tile for planet', () => {
    const tiles = generateBoard('navegante');
    const chefao = getChefaoTile(tiles, 1);
    expect(chefao).not.toBeNull();
    expect(chefao.type).toBe(TILE_TYPES.CHEFAO);
    expect(chefao.planetId).toBe(1);
    expect(chefao.index).toBe(5);
  });
});

describe('globalToPlanet', () => {
  it('converts correctly for explorador', () => {
    expect(globalToPlanet(0, 'explorador')).toEqual({ planetId: 1, houseIndex: 0 });
    expect(globalToPlanet(2, 'explorador')).toEqual({ planetId: 1, houseIndex: 2 });
    expect(globalToPlanet(3, 'explorador')).toEqual({ planetId: 2, houseIndex: 0 });
    expect(globalToPlanet(14, 'explorador')).toEqual({ planetId: 5, houseIndex: 2 });
  });

  it('converts correctly for navegante', () => {
    expect(globalToPlanet(0, 'navegante')).toEqual({ planetId: 1, houseIndex: 0 });
    expect(globalToPlanet(5, 'navegante')).toEqual({ planetId: 1, houseIndex: 5 });
    expect(globalToPlanet(6, 'navegante')).toEqual({ planetId: 2, houseIndex: 0 });
    expect(globalToPlanet(29, 'navegante')).toEqual({ planetId: 5, houseIndex: 5 });
  });
});

describe('rollDiceWithAgency', () => {
  it('returns correct structure for explorador', () => {
    const result = rollDiceWithAgency('explorador');
    expect(result.agency).toBe('pick-one');
    expect(result.values).toHaveLength(2);
    expect(result.maxRerolls).toBe(0);
    result.values.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    });
  });

  it('returns correct structure for navegante', () => {
    const result = rollDiceWithAgency('navegante');
    expect(result.agency).toBe('reroll');
    expect(result.values).toHaveLength(1);
    expect(result.maxRerolls).toBe(3);
  });

  it('antenas_hiperativas upgrade adds dice', () => {
    const expResult = rollDiceWithAgency('explorador', ['antenas_hiperativas']);
    expect(expResult.values).toHaveLength(3);

    const navResult = rollDiceWithAgency('navegante', ['antenas_hiperativas']);
    expect(navResult.values).toHaveLength(2);
  });
});
