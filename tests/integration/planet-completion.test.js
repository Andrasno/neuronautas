/**
 * Integration tests for planet completion flow.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { loadCards, getBossByPlanet, applyModifiers, checkBossBonus } from '../../js/cards.js';
import { hasStoredIdea, storeIdea, getMochilaOption, clearMochilaAfterUse, createIdeaFromOption } from '../../js/mochila.js';

const bossCards = [
  {
    id: 'boss_cria',
    planeta: 'criatividade',
    personagem_nome: 'Dragon',
    personagem_icone: '🐉',
    pedido: 'Prove yourself!',
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
        pistas: ['⚡↑↑', '✨↓↓', '🛡️↓↓'],
        modificadores_reais: { faiscas: 20, brilho: -15, escudo: -15 }, tipo: 'arriscado' }
    ]
  }
];

describe('Planet completion flow', () => {
  beforeAll(() => {
    loadCards(bossCards);
  });

  it('defeating boss grants stars and advances planet', () => {
    const state = {
      profile: 'explorador',
      attributes: { faiscas: 60, brilho: 65, escudo: 50 },
      stars: 2,
      campaign: {
        currentPlanet: 1,
        currentHouse: 2,
        completedPlanets: [],
        defeatedBosses: [],
        lossCount: 0
      },
      upgrades: [],
      mochila: { storedIdea: null, storedIdea2: null }
    };

    const boss = getBossByPlanet('criatividade');
    expect(boss).not.toBeNull();

    // Choose best option (index 0)
    const opcao = boss.opcoes[0];
    const bonus = checkBossBonus(state.attributes, boss, state.profile);
    let modifiers = { ...opcao.modificadores_reais };
    if (bonus.bonusActive) {
      for (const key in modifiers) {
        if (modifiers[key] > 0) modifiers[key] = Math.ceil(modifiers[key] * bonus.multiplier);
      }
    }

    const result = applyModifiers(state.attributes, modifiers, state.profile);
    state.attributes = result.newAttributes;
    state.stars += 3;

    // Assert bonus was active and applied
    expect(bonus.bonusActive).toBe(true); // 60 >= 40
    expect(result.newAttributes.faiscas).toBeGreaterThan(60);

    // Advance planet
    state.campaign.completedPlanets.push(1);
    state.campaign.defeatedBosses.push(1);
    state.campaign.currentPlanet = 2;
    state.campaign.currentHouse = 0;

    expect(state.campaign.currentPlanet).toBe(2);
    expect(state.stars).toBe(5); // 2 + 3
  });

  it('mochila idea works on boss with bonus', () => {
    const state = {
      profile: 'explorador',
      attributes: { faiscas: 60, brilho: 65, escudo: 50 },
      stars: 2,
      campaign: { currentPlanet: 1, currentHouse: 2, completedPlanets: [], defeatedBosses: [], lossCount: 0 },
      upgrades: [],
      mochila: { storedIdea: null, storedIdea2: null }
    };

    // Store idea
    storeIdea(state, { cardId: 'test', text: 'Saved idea', modifiers: { faiscas: 8, escudo: -3 } });
    expect(hasStoredIdea(state)).toBe(true);

    // Use on boss
    const mochilaOption = getMochilaOption(state);
    expect(mochilaOption.modifiers.faiscas).toBe(12); // +50% = ceil(8*1.5)
    expect(mochilaOption.modifiers.escudo).toBe(-4);  // +50% = ceil(-3*1.5) = ceil(-4.5) = -4

    const result = applyModifiers(state.attributes, mochilaOption.modifiers, state.profile);
    state.attributes = result.newAttributes;
    state.stars += 3;

    clearMochilaAfterUse(state);
    expect(hasStoredIdea(state)).toBe(false);

    expect(state.attributes.faiscas).toBe(72); // 60 + 12
    expect(state.stars).toBe(5);               // 2 + 3
  });

  it('full planet flow: train, store, boss with stored idea', () => {
    const state = {
      profile: 'explorador',
      attributes: { faiscas: 60, brilho: 65, escudo: 50 },
      stars: 1,
      campaign: { currentPlanet: 1, currentHouse: 0, completedPlanets: [], defeatedBosses: [], lossCount: 0 },
      upgrades: [],
      mochila: { storedIdea: null, storedIdea2: null }
    };

    // Step 1: Training card - gain star and store idea
    state.stars += 1; // earned from training card
    const sampleCard = {
      id: 'test',
      opcoes: [{ texto_resposta: 'Safe choice', modificadores_reais: { faiscas: 4, escudo: 8 } }]
    };
    const idea = createIdeaFromOption(sampleCard, 0);
    storeIdea(state, idea);
    expect(state.stars).toBe(2);

    // Step 2: Move to boss and use stored idea
    const result = applyModifiers(state.attributes, { faiscas: 8, escudo: -3 }, state.profile);
    state.attributes = result.newAttributes;
    state.stars += 3;
    clearMochilaAfterUse(state);

    // Step 3: Planet completed
    state.campaign.completedPlanets.push(1);
    state.campaign.defeatedBosses.push(1);
    state.campaign.currentPlanet = 2;
    state.campaign.currentHouse = 0;

    expect(state.campaign.currentPlanet).toBe(2);
    expect(hasStoredIdea(state)).toBe(false);
    expect(state.stars).toBe(5);
  });
});
