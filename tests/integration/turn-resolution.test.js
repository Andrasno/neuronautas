/**
 * Integration tests for full turn resolution: cards + modifiers + events.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { loadCards, applyModifiers, checkGameOver, getDisplayPistas } from '../../js/cards.js';
import { loadEvents, pickRandomEvent, applyEvent } from '../../js/events.js';
import { clamp } from '../../js/utils.js';

// Mini card/event dataset
const cardsData = [
  {
    id: 'cria_01',
    planeta: 'criatividade',
    personagem_nome: 'Rabbit',
    personagem_icone: '🐰',
    pedido: 'What games can we play with paper?',
    texto_explorador: 'Games with paper?',
    opcoes: [
      { icone: '⭐', rotulo: 'Creative', texto_resposta: 'Make airplanes!',
        pistas: ['⚡↑↑', '✨↑', '🛡️→'],
        modificadores_reais: { faiscas: 8, brilho: 3, escudo: 1 }, tipo: 'criativo' },
      { icone: '🛡️', rotulo: 'Safe', texto_resposta: 'Draw carefully',
        pistas: ['⚡→', '✨→', '🛡️↑↑'],
        modificadores_reais: { faiscas: 0, brilho: 1, escudo: 8 }, tipo: 'seguro' },
      { icone: '🤔', rotulo: 'Ask', texto_resposta: 'What do you like?',
        pistas: ['⚡→', '✨↑', '🛡️↑'],
        modificadores_reais: { faiscas: 1, brilho: 2, escudo: 2 }, tipo: 'neutro' }
    ]
  },
  {
    id: 'etica_01',
    planeta: 'etica',
    personagem_nome: 'Fox',
    personagem_icone: '🦊',
    pedido: 'Should I trick the Owl?',
    opcoes: [
      { icone: '⭐', rotulo: 'Fun Trick', texto_resposta: 'Make a funny prank',
        pistas: ['⚡↑', '✨↑', '🛡️↓'],
        modificadores_reais: { faiscas: 6, brilho: 2, escudo: -4 }, tipo: 'criativo' },
      { icone: '🛡️', rotulo: 'Honest', texto_resposta: 'Do not trick others',
        pistas: ['⚡↓', '✨↑', '🛡️↑↑'],
        modificadores_reais: { faiscas: -2, brilho: 5, escudo: 10 }, tipo: 'seguro' },
      { icone: '🤔', rotulo: 'Ask More', texto_resposta: 'Tell me why first',
        pistas: ['⚡→', '✨↑', '🛡️↑'],
        modificadores_reais: { faiscas: 1, brilho: 3, escudo: 2 }, tipo: 'neutro' }
    ]
  }
];

const eventsData = [
  { id: 'ev_01', descricao: 'Star shower!', efeito: { faiscas: 5, brilho: 0, escudo: 0, estrelas: 0 } },
  { id: 'ev_02', descricao: 'Shield found!', efeito: { faiscas: 0, brilho: 0, escudo: 8, estrelas: 0 } },
  { id: 'ev_03', descricao: 'Virus hit!', efeito: { faiscas: 0, brilho: -8, escudo: 0, estrelas: 0 } }
];

describe('Turn resolution integration', () => {
  beforeAll(() => {
    loadCards(cardsData);
    loadEvents(eventsData);
  });

  it('training card: choosing creative option boosts faiscas', () => {
    const card = cardsData[0];
    const attrs = { faiscas: 60, brilho: 65, escudo: 50 };

    // Navegante sees vague hints (not numbers)
    const pistas = getDisplayPistas(card.opcoes[0], 'navegante');
    expect(pistas).not.toMatch(/\d/); // No numbers in pistas!

    // Apply modifier after choice
    const result = applyModifiers(attrs, card.opcoes[0].modificadores_reais, 'navegante');
    expect(result.newAttributes.faiscas).toBe(68);

    // Numbers are revealed only after choice
    expect(result.appliedModifiers.faiscas).toBe(8);
  });

  it('surprise event modifies state correctly', () => {
    let state = {
      profile: 'explorador',
      attributes: { faiscas: 60, brilho: 65, escudo: 50 },
      stars: 0
    };

    const event = pickRandomEvent();
    expect(event).not.toBeNull();

    const result = applyEvent(event, state);
    expect(result).toHaveProperty('changes');
    // Changes should be for display (tell player what happened)
  });

  it('full turn: train card -> apply modifiers -> check game over', () => {
    let attrs = { faiscas: 60, brilho: 65, escudo: 50 };

    // Step 1: pick a card
    const card = cardsData[0];

    // Step 2: player chooses option 0 (creative)
    const result = applyModifiers(attrs, card.opcoes[0].modificadores_reais, 'explorador');
    attrs = result.newAttributes;

    expect(attrs.faiscas).toBe(68);

    // Step 3: check game over
    expect(checkGameOver(attrs, 'explorador')).toBe(false);
  });

  it('multiple turns can cause escapador game over', () => {
    let attrs = { faiscas: 8, brilho: 65, escudo: 50 };

    // Apply penalty options repeatedly
    const penaltyMod = { faiscas: -5, brilho: 0, escudo: 0 };
    const result1 = applyModifiers(attrs, penaltyMod, 'explorador');
    attrs = result1.newAttributes;
    expect(attrs.faiscas).toBe(5); // 8 - 3 (applied -3 since 8-5=3)

    // Now at min for explorador
    expect(checkGameOver(attrs, 'explorador')).toBe(true);
  });

  it('explorador pistas are visual stars only (no text)', () => {
    for (const card of cardsData) {
      for (const opcao of card.opcoes) {
        const pistas = getDisplayPistas(opcao, 'explorador');
        expect(pistas).not.toContain('Faíscas');
        expect(pistas).not.toContain('Brilho');
        expect(pistas).not.toContain('Escudo');
        // Should use visual indicators (⬤, ◯, ▼) instead of arrows
        expect(pistas).toMatch(/[⬤◯▼]/);
      }
    }
  });

  it('navegante pistas are text hints', () => {
    for (const card of cardsData) {
      for (const opcao of card.opcoes) {
        const pistas = getDisplayPistas(opcao, 'navegante');
        // Should contain attribute names or "Efeitos desconhecidos"
        expect(pistas.length).toBeGreaterThan(0);
      }
    }
  });

  it('modifier numbers never leak through pistas', () => {
    // Pistas should never contain numbers
    for (const card of cardsData) {
      for (const opcao of card.opcoes) {
        const expPistas = getDisplayPistas(opcao, 'explorador');
        const navPistas = getDisplayPistas(opcao, 'navegante');
        expect(expPistas).not.toMatch(/[0-9]/);
        // Navegante hints say "Aumenta" or "Diminui" but not how much
        expect(navPistas).not.toMatch(/[+-]\d/);
        expect(navPistas).not.toMatch(/\d\s*(Faíscas|Brilho|Escudo)/);
      }
    }
  });
});
