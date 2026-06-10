/**
 * Unit tests for events.js - surprise events.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadEvents,
  pickRandomEvent,
  applyEvent,
  getAllEvents,
  getEventCount,
  isLoaded
} from '../../js/events.js';

const sampleEvents = [
  { id: 'ev_01', descricao: 'Test positive event', efeito: { faiscas: 5, brilho: 0, escudo: 0, estrelas: 0 } },
  { id: 'ev_02', descricao: 'Test negative event', efeito: { faiscas: 0, brilho: -8, escudo: 0, estrelas: 0 } },
  { id: 'ev_03', descricao: 'Test star event', efeito: { faiscas: 0, brilho: 0, escudo: 0, estrelas: 3 } },
  { id: 'ev_04', descricao: 'Test mixed event', efeito: { faiscas: 6, brilho: 0, escudo: 2, estrelas: 0 } },
  { id: 'ev_05', descricao: 'Test big negative', efeito: { faiscas: 0, brilho: 0, escudo: -12, estrelas: 0 } }
];

function mockState(profileKey = 'explorador', overrides = {}) {
  return {
    profile: profileKey,
    attributes: {
      faiscas: 60,
      brilho: 65,
      escudo: 50
    },
    stars: 2,
    ...overrides
  };
}

describe('events.js', () => {
  beforeAll(() => {
    loadEvents(sampleEvents);
  });

  describe('loadEvents and counts', () => {
    it('loads events', () => expect(isLoaded()).toBe(true));
    it('has correct count', () => expect(getEventCount()).toBe(5));
  });

  describe('pickRandomEvent', () => {
    it('returns an event', () => {
      const event = pickRandomEvent();
      expect(event).not.toBeNull();
      expect(event).toHaveProperty('descricao');
      expect(event).toHaveProperty('efeito');
    });

    it('returns all events over many picks', () => {
      const seen = new Set();
      for (let i = 0; i < 100; i++) {
        seen.add(pickRandomEvent().id);
      }
      expect(seen.size).toBe(5); // all events should appear
    });
  });

  describe('applyEvent', () => {
    it('applies positive attribute modifier', () => {
      const state = mockState();
      applyEvent(sampleEvents[0], state);
      expect(state.attributes.faiscas).toBe(65); // 60 + 5
    });

    it('applies negative attribute modifier', () => {
      const state = mockState();
      applyEvent(sampleEvents[1], state);
      expect(state.attributes.brilho).toBe(57); // 65 - 8
    });

    it('grants stars', () => {
      const state = mockState();
      applyEvent(sampleEvents[2], state);
      expect(state.stars).toBe(5); // 2 + 3
    });

    it('applies mixed effects', () => {
      const state = mockState();
      applyEvent(sampleEvents[3], state);
      expect(state.attributes.faiscas).toBe(66);
      expect(state.attributes.escudo).toBe(52);
    });

    it('explorador: attributes floor at 5 even from event', () => {
      const state = mockState('explorador', { attributes: { faiscas: 10, brilho: 65, escudo: 50 } });
      const event = { id: 'test', descricao: 'Big hit', efeito: { faiscas: -12, brilho: 0, escudo: 0, estrelas: 0 } };
      applyEvent(event, state);
      expect(state.attributes.faiscas).toBe(5); // floor at 5
    });

    it('navegante: attributes can reach 0 from event', () => {
      const state = mockState('navegante', { attributes: { faiscas: 8, brilho: 60, escudo: 40 } });
      const event = { id: 'test', descricao: 'Big hit', efeito: { faiscas: -10, brilho: 0, escudo: 0, estrelas: 0 } };
      applyEvent(event, state);
      expect(state.attributes.faiscas).toBe(0); // can go to 0
    });

    it('event caps at -20 per attribute', () => {
      const state = mockState('navegante', { attributes: { faiscas: 50, brilho: 60, escudo: 50 } });
      const event = { id: 'test', descricao: 'Massive hit', efeito: { escudo: -30, brilho: 0, faiscas: 0, estrelas: 0 } };
      applyEvent(event, state);
      expect(state.attributes.escudo).toBe(30); // 50 - 20 (capped from -30)
    });

    it('events never cause instant game over', () => {
      // Even a big hit can't take all attributes to min at once.
      // Event caps at -20 per attr, and we start at 50-60+, so no single event can kill.
      const state = mockState();
      const event = { id: 'test', descricao: 'Big hit', efeito: { faiscas: -20, brilho: 0, escudo: 0, estrelas: 0 } };
      applyEvent(event, state);
      // faiscas: 60 - 20 = 40, which is > 5 (explorador min). NOT game over.
      expect(state.attributes.faiscas).toBe(40);
      expect(state.attributes.faiscas).toBeGreaterThan(5);
    });

    it('returns changes for display', () => {
      const state = mockState();
      const result = applyEvent(sampleEvents[0], state);
      expect(result.changes.faiscas).toBe(5);
      expect(result.event.descricao).toBe('Test positive event');
    });
  });

  describe('getAllEvents', () => {
    it('returns a copy of all events', () => {
      const all = getAllEvents();
      expect(all).toHaveLength(5);
      all[0].descricao = 'modified';
      expect(getAllEvents()[0].descricao).not.toBe('modified'); // copy
    });
  });
});
