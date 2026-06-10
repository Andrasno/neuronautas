/**
 * Surprise event repository and random picker.
 */

import { clamp } from './utils.js';
import { getProfile } from './profile.js';

/** All events (loaded from data/events.json) */
let events = [];
let loaded = false;

export function loadEvents(eventsData) {
  events = eventsData;
  loaded = true;
}

export function isLoaded() {
  return loaded;
}

/**
 * Pick a random event uniformly.
 */
export function pickRandomEvent() {
  if (events.length === 0) return null;
  return events[Math.floor(Math.random() * events.length)];
}

/**
 * Apply a surprise event's effects to the game state.
 * Events NEVER cause instant game over (max -20 per attribute).
 * Applies stars, attribute modifiers with profile-aware clamping.
 *
 * @param {Object} event - The event object from events.json
 * @param {Object} state - Game state (mutated in place)
 * @returns {Object} The changes applied for display
 */
export function applyEvent(event, state) {
  const profile = getProfile(state.profile);
  if (!profile) return { changes: {} };

  const changes = {};

  // Apply attribute modifiers
  for (const [key, value] of Object.entries(event.efeito)) {
    if (key === 'estrelas') {
      state.stars += value;
      changes.estrelas = value;
      continue;
    }

    if (key in state.attributes) {
      // Cap single penalty to maxPenalty (but events spec says max -20)
      // The event system respects the profile's minAttr but not maxPenalty
      // Events can be up to -20 per the spec
      let effectiveVal = value;
      if (effectiveVal < -20) effectiveVal = -20;

      const newVal = clamp(
        state.attributes[key] + effectiveVal,
        profile.minAttr,
        100
      );

      changes[key] = newVal - state.attributes[key];
      state.attributes[key] = newVal;
    }
  }

  return { event, changes };
}

/**
 * Get all events (for testing).
 */
export function getAllEvents() {
  return events.map(e => ({ ...e, efeito: { ...e.efeito } }));
}

/**
 * Get event count.
 */
export function getEventCount() {
  return events.length;
}
