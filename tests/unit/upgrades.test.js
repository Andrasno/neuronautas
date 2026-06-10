/**
 * Unit tests for upgrades.js - sticker shop and passive effects.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadUpgrades,
  getAvailableUpgrades,
  purchaseUpgrade,
  applyPassiveEffects,
  resetPhaseFlags,
  getAllUpgrades,
  getUpgradeById,
  isLoaded
} from '../../js/upgrades.js';

const sampleUpgrades = [
  { id: 'cerebro_relampago', nome: 'Cérebro Relâmpago', icone: '🧠⚡', custo: 5,
    descricao: 'Pensa mais rápido!',
    efeito: { tipo: 'per_turn', atributo: 'faiscas', valor: 2, gatilho: 'after_roll' } },
  { id: 'coracao_forte', nome: 'Coração Forte', icone: '❤️💪', custo: 4,
    descricao: 'Confiança extra',
    efeito: { tipo: 'planet_start', atributo: 'brilho', valor: 3, gatilho: 'planet_start' } },
  { id: 'escudo_diamante', nome: 'Escudo de Diamante', icone: '🛡️💎', custo: 6,
    descricao: 'Proteção duradoura',
    efeito: { tipo: 'reduce_penalty', atributo: 'escudo', porcentagem: 20, gatilho: 'before_event_penalty' } },
  { id: 'antenas_hiperativas', nome: 'Antenas Hiperativas', icone: '📡', custo: 8,
    descricao: 'Melhor sorte',
    efeito: { tipo: 'extra_dice', valor: 1, gatilho: 'always' } },
  { id: 'escudo_reativo', nome: 'Escudo Reativo', icone: '🛡️⚡', custo: 9,
    descricao: 'Proteção automática',
    efeito: { tipo: 'conditional_shield', atributo: 'escudo', valor: 10, condicao: 'below_20', gatilho: 'check_shield' } },
  { id: 'farol_confianca', nome: 'Farol de Confiança', icone: '🔦', custo: 7,
    descricao: 'Recupera autoestima',
    efeito: { tipo: 'recovery', atributo: 'brilho', valor: 3, condicao: 'below_30', limite: 50, gatilho: 'recovery_check' } },
  { id: 'gerador_faiscas', nome: 'Gerador de Faíscas', icone: '🔋', custo: 5,
    descricao: 'Energia renovável',
    efeito: { tipo: 'planet_start', atributo: 'faiscas', valor: 15, gatilho: 'planet_start' } },
  { id: 'sabio_estelar', nome: 'Sábio Estelar', icone: '🧙', custo: 10,
    descricao: 'Preparado para o desafio',
    efeito: { tipo: 'before_boss', atributo: 'all', valor: 5, gatilho: 'before_boss' } }
];

function mockState(attrs = { faiscas: 60, brilho: 65, escudo: 50 }, stars = 10, upgrades = []) {
  return {
    profile: 'explorador',
    attributes: { ...attrs },
    stars,
    upgrades: [...upgrades]
  };
}

describe('upgrades.js', () => {
  beforeAll(() => {
    loadUpgrades(sampleUpgrades);
  });

  describe('loadUpgrades', () => {
    it('loads correctly', () => expect(isLoaded()).toBe(true));
    it('has 8 sample upgrades', () => expect(getAllUpgrades()).toHaveLength(8));
  });

  describe('getAvailableUpgrades', () => {
    it('returns affordable unowned upgrades', () => {
      const state = mockState(undefined, 10);
      const available = getAvailableUpgrades(state);
      expect(available.map(u => u.id)).toContain('cerebro_relampago');
      expect(available.map(u => u.id)).toContain('antenas_hiperativas');
    });

    it('excludes owned upgrades', () => {
      const state = mockState(undefined, 10, ['cerebro_relampago']);
      const available = getAvailableUpgrades(state);
      expect(available.map(u => u.id)).not.toContain('cerebro_relampago');
    });

    it('excludes unaffordable upgrades', () => {
      const state = mockState(undefined, 2);
      const available = getAvailableUpgrades(state);
      expect(available).toHaveLength(0);
    });
  });

  describe('purchaseUpgrade', () => {
    it('successfully purchases an upgrade', () => {
      const state = mockState(undefined, 10);
      expect(purchaseUpgrade('cerebro_relampago', state)).toBe(true);
      expect(state.upgrades).toContain('cerebro_relampago');
      expect(state.stars).toBe(5); // 10 - 5
    });

    it('fails if already owned', () => {
      const state = mockState(undefined, 10, ['cerebro_relampago']);
      expect(purchaseUpgrade('cerebro_relampago', state)).toBe(false);
    });

    it('fails if insufficient stars', () => {
      const state = mockState(undefined, 2);
      expect(purchaseUpgrade('cerebro_relampago', state)).toBe(false);
      expect(state.stars).toBe(2); // unchanged
    });

    it('fails for nonexistent upgrade', () => {
      const state = mockState();
      expect(purchaseUpgrade('nonexistent', state)).toBe(false);
    });
  });

  describe('applyPassiveEffects', () => {
    it('cerebro_relampago: adds +2 faiscas after roll', () => {
      const state = mockState(undefined, 10, ['cerebro_relampago']);
      const result = applyPassiveEffects('after_roll', state);
      expect(state.attributes.faiscas).toBe(62);
      expect(result.faiscas).toBe(2);
    });

    it('coracao_forte: adds +3 brilho on planet start', () => {
      const state = mockState(undefined, 10, ['coracao_forte']);
      applyPassiveEffects('planet_start', state);
      expect(state.attributes.brilho).toBe(68);
    });

    it('gerador_faiscas: adds +15 faiscas on planet start', () => {
      const state = mockState(undefined, 10, ['gerador_faiscas']);
      applyPassiveEffects('planet_start', state);
      expect(state.attributes.faiscas).toBe(75);
    });

    it('multiple planet_start upgrades apply correctly', () => {
      const state = mockState(undefined, 10, ['gerador_faiscas', 'coracao_forte']);
      applyPassiveEffects('planet_start', state);
      expect(state.attributes.faiscas).toBe(75);  // 60 + 15
      expect(state.attributes.brilho).toBe(68);   // 65 + 3
    });

    it('escudo_diamante: reduces penalty', () => {
      const state = mockState(undefined, 10, ['escudo_diamante']);
      const context = { penalty: -10 };
      applyPassiveEffects('before_event_penalty', state, context);
      expect(context.reducedPenalty).toBe(-8); // reduced by ceil(10 * 0.2) = 2
    });

    it('farol_confianca: recovers brilho below 30 up to 50', () => {
      const state = mockState({ faiscas: 50, brilho: 20, escudo: 50 }, 10, ['farol_confianca']);
      applyPassiveEffects('recovery_check', state);
      expect(state.attributes.brilho).toBe(23); // 20 + 3
    });

    it('farol_confianca: does not exceed 50', () => {
      const state = mockState({ faiscas: 50, brilho: 49, escudo: 50 }, 10, ['farol_confianca']);
      // 49 < 50 (limite) and 49 < 30 (condicao)? No! 49 >= 30, so condition fails
      // The recovery only triggers when brilho < 30
      applyPassiveEffects('recovery_check', state);
      expect(state.attributes.brilho).toBe(49); // unchanged, 49 >= 30
    });

    it('farol_confianca: does not boost above 30 normally (already ok)', () => {
      const state = mockState({ faiscas: 50, brilho: 35, escudo: 50 }, 10, ['farol_confianca']);
      applyPassiveEffects('recovery_check', state);
      expect(state.attributes.brilho).toBe(35); // unchanged, 35 >= 30
    });

    it('escudo_reativo: gives +10 when escudo < 20', () => {
      const state = mockState({ faiscas: 50, brilho: 50, escudo: 15 }, 10, ['escudo_reativo']);
      applyPassiveEffects('check_shield', state);
      expect(state.attributes.escudo).toBe(25); // 15 + 10
      expect(state._shieldUsed).toBe(true);
    });

    it('escudo_reativo: fires only once per phase', () => {
      const state = mockState({ faiscas: 50, brilho: 50, escudo: 15 }, 10, ['escudo_reativo']);
      applyPassiveEffects('check_shield', state);
      const afterFirst = state.attributes.escudo;
      applyPassiveEffects('check_shield', state);
      expect(state.attributes.escudo).toBe(afterFirst); // unchanged
    });

    it('resetPhaseFlags clears _shieldUsed', () => {
      const state = mockState({ faiscas: 50, brilho: 50, escudo: 15 }, 10, ['escudo_reativo']);
      applyPassiveEffects('check_shield', state);
      expect(state._shieldUsed).toBe(true);
      resetPhaseFlags(state);
      expect(state._shieldUsed).toBe(false);
    });

    it('sabio_estelar: adds +5 to all attributes before boss', () => {
      const state = mockState({ faiscas: 60, brilho: 65, escudo: 50 }, 10, ['sabio_estelar']);
      applyPassiveEffects('before_boss', state);
      expect(state.attributes.faiscas).toBe(65);
      expect(state.attributes.brilho).toBe(70);
      expect(state.attributes.escudo).toBe(55);
    });

    it('sabio_estelar: clamps at 100', () => {
      const state = mockState({ faiscas: 98, brilho: 65, escudo: 50 }, 10, ['sabio_estelar']);
      applyPassiveEffects('before_boss', state);
      expect(state.attributes.faiscas).toBe(100); // 98 + 5 = 103, clamped
    });
  });

  describe('getUpgradeById', () => {
    it('finds upgrade by id', () => {
      expect(getUpgradeById('antenas_hiperativas').nome).toBe('Antenas Hiperativas');
    });
    it('returns null for unknown', () => {
      expect(getUpgradeById('unknown')).toBeNull();
    });
  });
});
