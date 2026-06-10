/**
 * Unit tests for cards.js - card management and modifier resolution.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadCards,
  getCardsByPlanet,
  getCardById,
  getDisplayPistas,
  applyModifiers,
  checkGameOver,
  checkBossBonus,
  applyMochilaBonus,
  isLoaded
} from '../../js/cards.js';

// Sample card data for testing
const sampleCards = [
  {
    id: 'test_01',
    planeta: 'criatividade',
    personagem_nome: 'Test Rabbit',
    personagem_icone: '🐰',
    pedido: 'Test question?',
    texto_explorador: 'Short version',
    opcoes: [
      {
        icone: '⭐',
        rotulo: 'Creative',
        texto_resposta: 'Creative answer',
        pistas: ['⚡↑↑', '✨↑', '🛡️→'],
        modificadores_reais: { faiscas: 8, brilho: 3, escudo: 1 },
        tipo: 'criativo'
      },
      {
        icone: '🛡️',
        rotulo: 'Safe',
        texto_resposta: 'Safe answer',
        pistas: ['⚡→', '✨↑', '🛡️↑↑'],
        modificadores_reais: { faiscas: 0, brilho: 4, escudo: 12 },
        tipo: 'seguro'
      },
      {
        icone: '⚠️',
        rotulo: 'Risky',
        texto_resposta: 'Risky answer',
        pistas: ['⚡↑', '✨↓↓', '🛡️↓↓'],
        modificadores_reais: { faiscas: 3, brilho: -8, escudo: -12 },
        tipo: 'arriscado'
      }
    ]
  },
  {
    id: 'test_02',
    planeta: 'etica',
    personagem_nome: 'Test Fox',
    personagem_icone: '🦊',
    pedido: 'Ethics question?',
    opcoes: [
      {
        icone: '⭐',
        rotulo: 'Ethical',
        texto_resposta: 'Ethical answer',
        pistas: ['⚡↑', '✨↑↑', '🛡️↑'],
        modificadores_reais: { faiscas: 4, brilho: 8, escudo: 6 },
        tipo: 'criativo'
      }
    ]
  },
  {
    id: 'boss_test',
    planeta: 'criatividade',
    personagem_nome: 'Boss',
    personagem_icone: '👑',
    pedido: 'Boss fight!',
    isBoss: true,
    atributo_recomendado: 'faiscas',
    opcoes: [
      {
        icone: '⭐',
        rotulo: 'Attack',
        texto_resposta: 'Attack boss',
        pistas: ['⚡↑↑', '✨↓', '🛡️↓'],
        modificadores_reais: { faiscas: 20, brilho: -10, escudo: -8 },
        tipo: 'arriscado'
      }
    ]
  }
];

describe('cards.js', () => {
  beforeAll(() => {
    loadCards(sampleCards);
  });

  describe('loadCards', () => {
    it('loads cards and separates training from bosses', () => {
      expect(isLoaded()).toBe(true);
    });
  });

  describe('getCardsByPlanet', () => {
    it('returns cards for a planet', () => {
      const cards = getCardsByPlanet('criatividade');
      expect(cards).toHaveLength(1); // should NOT include the boss card
      expect(cards[0].id).toBe('test_01');
    });

    it('returns empty array for unknown planet', () => {
      expect(getCardsByPlanet('unknown')).toHaveLength(0);
    });
  });

  describe('getCardById', () => {
    it('finds card by id', () => {
      expect(getCardById('test_01').personagem_nome).toBe('Test Rabbit');
    });

    it('returns null for unknown id', () => {
      expect(getCardById('nonexistent')).toBeNull();
    });
  });

  describe('getDisplayPistas', () => {
    it('explorador: shows icons only', () => {
      const pistas = getDisplayPistas(sampleCards[0].opcoes[0], 'explorador');
      expect(pistas).toContain('⚡↑↑');
      expect(pistas).toContain('✨↑');
      expect(pistas).not.toContain('Faíscas'); // no text labels
    });

    it('navegante: shows vague text hints', () => {
      const pistas = getDisplayPistas(sampleCards[0].opcoes[0], 'navegante');
      expect(pistas).toContain('Faíscas');
      expect(pistas).toContain('Brilho');
      expect(pistas).toContain('Escudo');
    });

    it('navegante: shows "estável" for neutral pistas', () => {
      const pistas = getDisplayPistas(sampleCards[0].opcoes[0], 'navegante');
      expect(pistas).toContain('estável');
    });
  });

  describe('applyModifiers', () => {
    it('applies positive modifiers', () => {
      const attrs = { faiscas: 60, brilho: 65, escudo: 50 };
      const mods = { faiscas: 8, brilho: 3, escudo: 1 };
      const result = applyModifiers(attrs, mods, 'explorador');
      expect(result.newAttributes.faiscas).toBe(68);
      expect(result.newAttributes.brilho).toBe(68);
      expect(result.newAttributes.escudo).toBe(51);
    });

    it('applies negative modifiers', () => {
      const attrs = { faiscas: 60, brilho: 65, escudo: 50 };
      const mods = { faiscas: -4, brilho: -2, escudo: -8 };
      const result = applyModifiers(attrs, mods, 'explorador');
      // escudo -8 capped at -5 for explorador
      expect(result.newAttributes.escudo).toBe(45); // 50 - 5 (capped)
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('explorador: penalty capped at -5', () => {
      const attrs = { faiscas: 60, brilho: 65, escudo: 50 };
      const mods = { escudo: -10 };
      const result = applyModifiers(attrs, mods, 'explorador');
      expect(result.appliedModifiers.escudo).toBe(-5);
      expect(result.newAttributes.escudo).toBe(45);
    });

    it('explorador: attributes floor at 5', () => {
      const attrs = { faiscas: 8, brilho: 65, escudo: 50 };
      const mods = { faiscas: -5 };
      const result = applyModifiers(attrs, mods, 'explorador');
      expect(result.newAttributes.faiscas).toBe(5); // 8 - 5 = 3, floor at 5
      expect(result.appliedModifiers.faiscas).toBe(-3); // actually applied -3 (8->5)
    });

    it('navegante: penalty up to -15', () => {
      const attrs = { faiscas: 50, brilho: 60, escudo: 40 };
      const mods = { escudo: -12 };
      const result = applyModifiers(attrs, mods, 'navegante');
      expect(result.newAttributes.escudo).toBe(28); // 40 - 12
    });

    it('navegante: penalty capped at -15', () => {
      const attrs = { faiscas: 50, brilho: 60, escudo: 40 };
      const mods = { escudo: -20 };
      const result = applyModifiers(attrs, mods, 'navegante');
      expect(result.appliedModifiers.escudo).toBe(-15); // capped from -20
    });

    it('navegante: attributes can reach 0', () => {
      const attrs = { faiscas: 10, brilho: 60, escudo: 40 };
      const mods = { faiscas: -12 };
      const result = applyModifiers(attrs, mods, 'navegante');
      expect(result.newAttributes.faiscas).toBe(0);
    });

    it('clamps at 100 max', () => {
      const attrs = { faiscas: 95, brilho: 60, escudo: 40 };
      const mods = { faiscas: 15 };
      const result = applyModifiers(attrs, mods, 'explorador');
      expect(result.newAttributes.faiscas).toBe(100);
    });
  });

  describe('checkGameOver', () => {
    it('detects game over for explorador at min 5', () => {
      expect(checkGameOver({ faiscas: 5, brilho: 65, escudo: 50 }, 'explorador')).toBe(true);
      expect(checkGameOver({ faiscas: 6, brilho: 65, escudo: 50 }, 'explorador')).toBe(false);
    });

    it('detects game over for navegante at min 0', () => {
      expect(checkGameOver({ faiscas: 0, brilho: 60, escudo: 40 }, 'navegante')).toBe(true);
      expect(checkGameOver({ faiscas: 1, brilho: 60, escudo: 40 }, 'navegante')).toBe(false);
    });
  });

  describe('checkBossBonus', () => {
    it('activates bonus when attribute >= threshold', () => {
      // explorador threshold = 40
      const result = checkBossBonus(
        { faiscas: 45, brilho: 30, escudo: 30 },
        { atributo_recomendado: 'faiscas', planeta: 'criatividade' },
        'explorador'
      );
      expect(result.bonusActive).toBe(true);
      expect(result.multiplier).toBe(1.5);
    });

    it('no bonus when attribute below threshold', () => {
      const result = checkBossBonus(
        { faiscas: 35, brilho: 30, escudo: 30 },
        { atributo_recomendado: 'faiscas', planeta: 'criatividade' },
        'explorador'
      );
      expect(result.bonusActive).toBe(false);
      expect(result.multiplier).toBe(1.0);
    });

    it('navegante threshold is 60', () => {
      const result = checkBossBonus(
        { faiscas: 55, brilho: 30, escudo: 30 },
        { atributo_recomendado: 'faiscas', planeta: 'criatividade' },
        'navegante'
      );
      expect(result.bonusActive).toBe(false);
    });
  });

  describe('applyMochilaBonus', () => {
    it('applies 50% bonus rounded up for positive', () => {
      const result = applyMochilaBonus({ faiscas: 8, brilho: 2 });
      expect(result.faiscas).toBe(12); // ceil(8 * 1.5) = 12
      expect(result.brilho).toBe(3);   // ceil(2 * 1.5) = 3
    });

    it('applies 50% bonus rounded down in magnitude for negative', () => {
      const result = applyMochilaBonus({ escudo: -3 });
      expect(result.escudo).toBe(-4);  // floor(-3 * 1.5) = -4
    });
  });
});
