/**
 * Card deck management and modifier resolution.
 */

import { clamp } from './utils.js';
import { getProfile, getPrimaryAttribute, getBossThreshold } from './profile.js';

/** All training cards (lazy-loaded from JSON) */
let trainingCards = [];
let bossCards = [];
let loaded = false;

/**
 * Load cards from JSON data.
 * The cards.json file should have training cards (isBoss not set or false)
 * and boss cards (isBoss: true).
 */
export function loadCards(cardsData) {
  trainingCards = cardsData.filter(c => !c.isBoss);
  bossCards = cardsData.filter(c => c.isBoss);
  loaded = true;
}

/**
 * Check if cards have been loaded.
 */
export function isLoaded() {
  return loaded;
}

/**
 * Get all training cards for a specific planet.
 */
export function getCardsByPlanet(planetKey) {
  return trainingCards.filter(c => c.planeta === planetKey);
}

/**
 * Get a specific training card by ID.
 */
export function getCardById(cardId) {
  return trainingCards.find(c => c.id === cardId) || null;
}

/**
 * Get the boss card for a specific planet.
 */
export function getBossByPlanet(planetKey) {
  return bossCards.find(c => c.planeta === planetKey) || null;
}

/**
 * Pick a random training card for a planet, excluding certain IDs.
 */
export function pickRandomCard(planetKey, excludeIds = []) {
  const available = trainingCards.filter(
    c => c.planeta === planetKey && !excludeIds.includes(c.id)
  );
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get the display text for a card based on profile.
 */
export function getCardText(card, profileKey) {
  if (profileKey === 'explorador' && card.texto_explorador) {
    return card.texto_explorador;
  }
  return card.pedido;
}

/**
 * Get the pistas (hints) display for an option, formatted per profile.
 * - explorador: icon symbols only (e.g., "⚡↑ ✨→ 🛡️↓")
 * - navegante: short vague text hints
 */
export function getDisplayPistas(opcao, profileKey) {
  const pistas = opcao.pistas || [];

  if (profileKey === 'explorador') {
    return pistas.join(' ');
  }

  // Navegante: convert pistas to vague text
  const attrMap = {
    '⚡': 'Faíscas',
    '✨': 'Brilho',
    '🛡️': 'Escudo'
  };

  const parts = [];
  for (const p of pistas) {
    let text = '';
    for (const [icon, name] of Object.entries(attrMap)) {
      if (p.includes(icon)) {
        if (p.includes('↑↑')) text = `Aumenta muito ${name}`;
        else if (p.includes('↑')) text = `Aumenta ${name}`;
        else if (p.includes('↓↓')) text = `Diminui muito ${name}`;
        else if (p.includes('↓')) text = `Diminui ${name}`;
        else text = `${name} estável`;
        break;
      }
    }
    if (text) parts.push(text);
  }

  return parts.length > 0 ? parts.join(', ') : 'Efeitos desconhecidos';
}

/**
 * Apply option modifiers to game attributes with profile-aware clamping.
 *
 * @param {Object} attributes - Current attributes { faiscas, brilho, escudo }
 * @param {Object} modifiers - Option modifiers { faiscas, brilho, escudo }
 * @param {string} profileKey - 'explorador' | 'navegante'
 * @returns {Object} { newAttributes, appliedModifiers, warnings }
 */
export function applyModifiers(attributes, modifiers, profileKey) {
  const profile = getProfile(profileKey);
  if (!profile) throw new Error(`Unknown profile: ${profileKey}`);

  const newAttributes = { ...attributes };
  const appliedModifiers = { ...modifiers };
  const warnings = [];

  for (const [key, mod] of Object.entries(modifiers)) {
    if (mod === 0) continue;

    // Apply max penalty cap (per spec)
    let effectiveMod = mod;
    if (effectiveMod < profile.maxPenalty) {
      warnings.push(`${key}: penalty capped from ${mod} to ${profile.maxPenalty}`);
      effectiveMod = profile.maxPenalty;
    }

    const newVal = clamp(
      newAttributes[key] + effectiveMod,
      profile.minAttr,
      100
    );

    // Track actual applied
    appliedModifiers[key] = newVal - newAttributes[key];
    newAttributes[key] = newVal;
  }

  return { newAttributes, appliedModifiers, warnings };
}

/**
 * Check if any attribute is at or below minimum (game over).
 */
export function checkGameOver(attributes, profileKey) {
  const profile = getProfile(profileKey);
  if (!profile) return false;

  for (const [key, value] of Object.entries(attributes)) {
    if (value <= profile.minAttr) return true;
  }
  return false;
}

/**
 * Check boss bonus threshold and return multiplier for the recommended option.
 *
 * @param {Object} attributes - Current attributes
 * @param {Object} bossCard - Boss card
 * @param {string} profileKey - Profile key
 * @returns {Object} { bonusActive, multiplier, recommendedAttr }
 */
export function checkBossBonus(attributes, bossCard, profileKey) {
  const primaryAttr = bossCard.atributo_recomendado || getPrimaryAttribute(bossCard.planeta);
  const threshold = getBossThreshold(profileKey);
  const currentValue = attributes[primaryAttr] || 0;
  const bonusActive = currentValue >= threshold;

  return {
    bonusActive,
    multiplier: bonusActive ? 1.5 : 1.0,
    recommendedAttr: primaryAttr,
    currentValue,
    threshold
  };
}

/**
 * Apply the mochila (backpack) bonus: +50% on all modifiers (rounded up).
 */
export function applyMochilaBonus(modifiers) {
  const boosted = {};
  for (const [key, value] of Object.entries(modifiers)) {
    // arredondado para cima: Math.ceil works for both positive and negative
    // ceil(-4.5) = -4 (up toward zero), ceil(12) = 12
    boosted[key] = Math.ceil(value * 1.5);
  }
  return boosted;
}
