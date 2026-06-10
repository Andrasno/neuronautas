/**
 * Unit tests for mochila.js - backpack mechanic.
 */
import { describe, it, expect } from 'vitest';
import {
  hasStoredIdea,
  hasFreeSlot,
  storeIdea,
  getMochilaOption,
  clearMochilaAfterUse,
  clearMochila,
  createIdeaFromOption
} from '../../js/mochila.js';

function makeState(profile = 'explorador', upgrades = []) {
  return {
    profile,
    mochila: { storedIdea: null, storedIdea2: null },
    upgrades
  };
}

const sampleCard = {
  id: 'test_01',
  pedido: 'Test question',
  opcoes: [
    { texto_resposta: 'Answer A', modificadores_reais: { faiscas: 8, brilho: 2, escudo: -3 } },
    { texto_resposta: 'Answer B', modificadores_reais: { faiscas: 4, brilho: 4, escudo: 2 } }
  ]
};

describe('mochila.js', () => {
  describe('hasStoredIdea', () => {
    it('returns false when empty', () => {
      expect(hasStoredIdea(makeState())).toBe(false);
    });
    it('returns true when idea stored', () => {
      const state = makeState();
      storeIdea(state, { cardId: 'x', text: 'idea', modifiers: { faiscas: 5 } });
      expect(hasStoredIdea(state)).toBe(true);
    });
  });

  describe('hasFreeSlot', () => {
    it('returns true when mochila empty', () => {
      expect(hasFreeSlot(makeState())).toBe(true);
    });
    it('returns false when slot 1 full (no upgrade)', () => {
      const state = makeState();
      storeIdea(state, { cardId: 'x', text: 'idea', modifiers: {} });
      expect(hasFreeSlot(state)).toBe(false);
    });
    it('returns true when slot 1 full but have mochila_reforcada', () => {
      const state = makeState('explorador', ['mochila_reforcada']);
      storeIdea(state, { cardId: 'x', text: 'idea1', modifiers: {} });
      expect(hasFreeSlot(state)).toBe(true);
    });
    it('returns false when both slots full', () => {
      const state = makeState('explorador', ['mochila_reforcada']);
      storeIdea(state, { cardId: 'x', text: 'idea1', modifiers: {} });
      storeIdea(state, { cardId: 'y', text: 'idea2', modifiers: {} });
      expect(hasFreeSlot(state)).toBe(false);
    });
  });

  describe('storeIdea', () => {
    it('stores in slot 1 when empty', () => {
      const state = makeState();
      storeIdea(state, { cardId: 'x', text: 'idea', modifiers: { faiscas: 8 } });
      expect(state.mochila.storedIdea).toEqual({ cardId: 'x', text: 'idea', modifiers: { faiscas: 8 } });
    });

    it('overwrites slot 1 when full (no upgrade)', () => {
      const state = makeState();
      storeIdea(state, { cardId: 'x', text: 'first', modifiers: {} });
      storeIdea(state, { cardId: 'y', text: 'second', modifiers: {} });
      expect(state.mochila.storedIdea.text).toBe('second');
    });

    it('uses slot 2 with mochila_reforcada', () => {
      const state = makeState('explorador', ['mochila_reforcada']);
      storeIdea(state, { cardId: 'x', text: 'first', modifiers: {} });
      storeIdea(state, { cardId: 'y', text: 'second', modifiers: {} });
      expect(state.mochila.storedIdea.text).toBe('first');
      expect(state.mochila.storedIdea2.text).toBe('second');
    });
  });

  describe('getMochilaOption', () => {
    it('returns null when empty', () => {
      expect(getMochilaOption(makeState())).toBeNull();
    });

    it('applies 50% bonus to positive modifiers', () => {
      const state = makeState();
      storeIdea(state, { cardId: 'x', text: 'idea', modifiers: { faiscas: 8, brilho: 2 } });
      const option = getMochilaOption(state);
      expect(option.modifiers.faiscas).toBe(12); // ceil(8 * 1.5) = 12
      expect(option.modifiers.brilho).toBe(3);  // ceil(2 * 1.5) = 3
    });

    it('applies 50% bonus to negative modifiers', () => {
      const state = makeState();
      storeIdea(state, { cardId: 'x', text: 'idea', modifiers: { escudo: -3 } });
      const option = getMochilaOption(state);
      expect(option.modifiers.escudo).toBe(-4); // ceil(-3 * 1.5) = ceil(-4.5) = -4
    });

    it('does not consume the stored idea', () => {
      const state = makeState();
      storeIdea(state, { cardId: 'x', text: 'idea', modifiers: { faiscas: 5 } });
      getMochilaOption(state);
      expect(hasStoredIdea(state)).toBe(true); // still there
    });
  });

  describe('clearMochilaAfterUse', () => {
    it('clears slot 1 when only one stored', () => {
      const state = makeState();
      storeIdea(state, { cardId: 'x', text: 'idea', modifiers: {} });
      clearMochilaAfterUse(state);
      expect(hasStoredIdea(state)).toBe(false);
    });

    it('shifts slot 2 to slot 1 when both stored', () => {
      const state = makeState('explorador', ['mochila_reforcada']);
      storeIdea(state, { cardId: 'x', text: 'first', modifiers: {} });
      storeIdea(state, { cardId: 'y', text: 'second', modifiers: {} });
      clearMochilaAfterUse(state);
      expect(state.mochila.storedIdea.text).toBe('second');
      expect(state.mochila.storedIdea2).toBeNull();
    });
  });

  describe('clearMochila', () => {
    it('clears all slots', () => {
      const state = makeState('explorador', ['mochila_reforcada']);
      storeIdea(state, { cardId: 'x', text: 'first', modifiers: {} });
      storeIdea(state, { cardId: 'y', text: 'second', modifiers: {} });
      clearMochila(state);
      expect(state.mochila.storedIdea).toBeNull();
      expect(state.mochila.storedIdea2).toBeNull();
    });
  });

  describe('createIdeaFromOption', () => {
    it('creates idea from card option', () => {
      const idea = createIdeaFromOption(sampleCard, 0);
      expect(idea.cardId).toBe('test_01');
      expect(idea.text).toBe('Answer A');
      expect(idea.modifiers).toEqual({ faiscas: 8, brilho: 2, escudo: -3 });
    });

    it('returns null for invalid option index', () => {
      expect(createIdeaFromOption(sampleCard, 99)).toBeNull();
    });

    it('creates copy of modifiers (not reference)', () => {
      const idea = createIdeaFromOption(sampleCard, 0);
      idea.modifiers.faiscas = 999;
      expect(sampleCard.opcoes[0].modificadores_reais.faiscas).toBe(8); // unchanged
    });
  });
});
