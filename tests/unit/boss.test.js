/**
 * Unit tests for boss battle logic.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { loadCards, getBossByPlanet, checkBossBonus } from '../../js/cards.js';

const bossCardsData = [
  {
    id: 'boss_cria',
    planeta: 'criatividade',
    personagem_nome: 'Test Boss',
    personagem_icone: '👑',
    pedido: 'Boss fight!',
    isBoss: true,
    atributo_recomendado: 'faiscas',
    opcoes: [
      { icone: '⭐', rotulo: 'Best', texto_resposta: 'Best',
        pistas: ['⚡↑↑', '✨↑', '🛡️↓'],
        modificadores_reais: { faiscas: 20, brilho: 5, escudo: -8 }, tipo: 'criativo' },
      { icone: '🛡️', rotulo: 'Safe', texto_resposta: 'Safe',
        pistas: ['⚡→', '✨↑', '🛡️↑↑'],
        modificadores_reais: { faiscas: 1, brilho: 4, escudo: 12 }, tipo: 'seguro' },
      { icone: '💪', rotulo: 'Risky', texto_resposta: 'Risky',
        pistas: ['⚡↑↑', '✨↓', '🛡️↓↓'],
        modificadores_reais: { faiscas: 20, brilho: -10, escudo: -15 }, tipo: 'arriscado' }
    ]
  }
];

describe('boss battles', () => {
  beforeAll(() => {
    loadCards(bossCardsData);
  });

  describe('getBossByPlanet', () => {
    it('finds boss by planet key', () => {
      const boss = getBossByPlanet('criatividade');
      expect(boss).not.toBeNull();
      expect(boss.id).toBe('boss_cria');
      expect(boss.isBoss).toBe(true);
    });

    it('returns null for planet without boss', () => {
      expect(getBossByPlanet('etica')).toBeNull();
    });
  });

  describe('boss bonus thresholds', () => {
    it('activates at 40 for explorador', () => {
      const boss = getBossByPlanet('criatividade');
      const result = checkBossBonus(
        { faiscas: 45, brilho: 30, escudo: 30 },
        boss,
        'explorador'
      );
      expect(result.bonusActive).toBe(true);
      expect(result.multiplier).toBe(1.5);
    });

    it('does not activate below 40 for explorador', () => {
      const boss = getBossByPlanet('criatividade');
      const result = checkBossBonus(
        { faiscas: 35, brilho: 30, escudo: 30 },
        boss,
        'explorador'
      );
      expect(result.bonusActive).toBe(false);
    });

    it('activates at 60 for navegante', () => {
      const boss = getBossByPlanet('criatividade');
      const result = checkBossBonus(
        { faiscas: 60, brilho: 30, escudo: 30 },
        boss,
        'navegante'
      );
      expect(result.bonusActive).toBe(true);
    });

    it('does not activate at 55 for navegante', () => {
      const boss = getBossByPlanet('criatividade');
      const result = checkBossBonus(
        { faiscas: 55, brilho: 30, escudo: 30 },
        boss,
        'navegante'
      );
      expect(result.bonusActive).toBe(false);
    });
  });

  describe('boss cards have required structure', () => {
    it('has 3 options each', () => {
      const boss = getBossByPlanet('criatividade');
      expect(boss.opcoes).toHaveLength(3);
    });

    it('options have modifiers between -25 and +25', () => {
      const boss = getBossByPlanet('criatividade');
      boss.opcoes.forEach(o => {
        Object.values(o.modificadores_reais).forEach(v => {
          expect(v).toBeGreaterThanOrEqual(-25);
          expect(v).toBeLessThanOrEqual(25);
        });
      });
    });

    it('has required fields', () => {
      const boss = getBossByPlanet('criatividade');
      expect(boss.personagem_nome).toBeTruthy();
      expect(boss.personagem_icone).toBeTruthy();
      expect(boss.pedido).toBeTruthy();
      expect(boss.atributo_recomendado).toBeTruthy();
    });
  });
});
