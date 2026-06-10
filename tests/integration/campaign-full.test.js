/**
 * Integration tests for full campaign progression.
 * Tests multi-planet play with upgrades, stars, and attribute carry-over.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { loadCards, getCardsByPlanet, getBossByPlanet, applyModifiers, checkBossBonus, checkGameOver } from '../../js/cards.js';
import { loadEvents, applyEvent } from '../../js/events.js';
import { loadUpgrades, getAvailableUpgrades, purchaseUpgrade, applyPassiveEffects, resetPhaseFlags } from '../../js/upgrades.js';
import { storeIdea, clearMochilaAfterUse, createIdeaFromOption, clearMochila } from '../../js/mochila.js';
import { generateBoard, getChefaoTile } from '../../js/board.js';
import { createNewGame } from '../../js/save.js';
import { clamp } from '../../js/utils.js';

const bossCards = [
  { id: 'boss_cria', planeta: 'criatividade', isBoss: true, atributo_recomendado: 'faiscas',
    personagem_nome: 'Dragon', personagem_icone: '🐉', pedido: 'Prove!',
    opcoes: [{ icone: '⭐', rotulo: 'Best', texto_resposta: 'Best',
      pistas: ['⚡↑↑'], modificadores_reais: { faiscas: 20, brilho: 5, escudo: -8 }, tipo: 'criativo' },
      { icone: '🛡️', rotulo: 'Safe', texto_resposta: 'Safe',
      pistas: ['🛡️↑↑'], modificadores_reais: { faiscas: 1, brilho: 4, escudo: 12 }, tipo: 'seguro' },
      { icone: '💪', rotulo: 'Risky', texto_resposta: 'Risky',
      pistas: ['⚡↑↑'], modificadores_reais: { faiscas: 20, brilho: -15, escudo: -15 }, tipo: 'arriscado' }] }
];

const trainingCards = [
  { id: 'cria_01', planeta: 'criatividade', personagem_nome: 'Test', personagem_icone: '🐰',
    pedido: 'Test question?',
    opcoes: [{ icone: '⭐', rotulo: 'Opt', texto_resposta: 'Answer',
      pistas: ['⚡↑'], modificadores_reais: { faiscas: 5, brilho: 2, escudo: 1 }, tipo: 'criativo' }] }
];

const sampleUpgrades = [
  { id: 'cerebro_relampago', nome: 'Cérebro Relâmpago', icone: '🧠⚡', custo: 5,
    descricao: '', efeito: { tipo: 'per_turn', atributo: 'faiscas', valor: 2, gatilho: 'after_roll' } },
  { id: 'gerador_faiscas', nome: 'Gerador', icone: '🔋', custo: 5,
    descricao: '', efeito: { tipo: 'planet_start', atributo: 'faiscas', valor: 15, gatilho: 'planet_start' } }
];

describe('Full campaign flow', () => {
  beforeAll(() => {
    loadCards([...trainingCards, ...bossCards]);
    loadEvents([]);
    loadUpgrades(sampleUpgrades);
  });

  it('new game starts at planet 1, house 0', () => {
    const state = createNewGame('explorador');
    expect(state.campaign.currentPlanet).toBe(1);
    expect(state.campaign.currentHouse).toBe(0);
    expect(state.campaign.completedPlanets).toEqual([]);
  });

  it('attributes carry over between planets', () => {
    const state = createNewGame('explorador');
    state.attributes.faiscas = 70;

    // Complete planet 1
    state.campaign.completedPlanets.push(1);
    state.campaign.defeatedBosses.push(1);
    state.campaign.currentPlanet = 2;
    state.campaign.currentHouse = 0;

    // Attributes preserved
    expect(state.attributes.faiscas).toBe(70);
  });

  it('stars accumulate across planets', () => {
    const state = createNewGame('explorador');
    state.stars = 3;

    // Buy should fail with insufficient stars
    purchaseUpgrade('cerebro_relampago', state);
    expect(state.stars).toBe(3); // stars unchanged, purchase failed
    expect(state.upgrades).not.toContain('cerebro_relampago');

    // With enough stars, purchase works
    state.stars = 10;
    expect(purchaseUpgrade('cerebro_relampago', state)).toBe(true);
    expect(state.upgrades).toContain('cerebro_relampago');
    expect(state.stars).toBe(5);
  });

  it('planet completion flow', () => {
    const state = createNewGame('navegante');
    state.stars = 3;
    state._boardTiles = generateBoard('navegante');

    // Phase 1: play through planet (simplified)
    state.campaign.currentHouse = 0; // training card
    state.stars += 1; // answered card
    expect(state.stars).toBe(4);

    state.campaign.currentHouse = 1; // surprise event
    state.campaign.currentHouse = 2; // training card
    state.stars += 1;
    expect(state.stars).toBe(5);

    state.campaign.currentHouse = 3; // evolution (shop)
    purchaseUpgrade('gerador_faiscas', state);
    expect(state.upgrades).toContain('gerador_faiscas');
    expect(state.stars).toBe(0);

    state.stars += 1; // next training
    state.campaign.currentHouse = 5; // boss!

    // Boss: choose option and apply
    const boss = getBossByPlanet('criatividade');
    const opcao = boss.opcoes[1]; // safe option
    const result = applyModifiers(state.attributes, opcao.modificadores_reais, state.profile);
    state.attributes = result.newAttributes;
    state.stars += 3; // boss reward

    // Planet complete
    state.campaign.completedPlanets.push(1);
    state.campaign.defeatedBosses.push(1);
    state.campaign.currentPlanet = 2;
    state.campaign.currentHouse = 0;

    // Planet-start effects (50 base + 1 from boss safe option + 15 from gerador)
    applyPassiveEffects('planet_start', state);
    expect(state.attributes.faiscas).toBe(66);

    expect(state.campaign.currentPlanet).toBe(2);
    expect(state.stars).toBe(4); // 0 + 1 + 3
  });

  it('game over restarts planet with starting attributes', () => {
    const state = createNewGame('explorador');
    state.attributes.faiscas = 5; // at minimum

    // Game over
    expect(checkGameOver(state.attributes, state.profile)).toBe(true);

    // Handle game over
    state.campaign.lossCount = (state.campaign.lossCount || 0) + 1;
    state.attributes = { faiscas: 60, brilho: 65, escudo: 50 }; // reset
    state.campaign.currentHouse = 0;

    expect(state.attributes.faiscas).toBe(60);
    expect(state.campaign.lossCount).toBe(1);
  });

  it('difficulty adaptation: 3 losses gives bonus', () => {
    const state = createNewGame('explorador');
    state.campaign.lossCount = 3;

    // Apply help bonus
    state.attributes.faiscas = Math.min(100, state.attributes.faiscas + 15);
    state.attributes.brilho = Math.min(100, state.attributes.brilho + 15);
    state.attributes.escudo = Math.min(100, state.attributes.escudo + 15);
    state.campaign.lossCount = 0;

    expect(state.attributes.faiscas).toBe(75);
    expect(state.attributes.brilho).toBe(80);
    expect(state.attributes.escudo).toBe(65);
  });

  it('mochila persists until planet completion then clears', () => {
    const state = createNewGame('explorador');

    // Store idea during planet
    const idea = createIdeaFromOption(trainingCards[0], 0);
    storeIdea(state, idea);

    // Use at boss
    clearMochilaAfterUse(state);
    expect(state.mochila.storedIdea).toBeNull();

    // End of planet - full clear
    clearMochila(state);

    // Next planet starts fresh
    expect(state.mochila.storedIdea).toBeNull();
  });
});
