/**
 * Sticker shop: definitions, purchase logic, passive effect engine.
 */

import { clamp } from './utils.js';

/** All upgrades (loaded from JSON) */
let upgradesDefs = [];
let loaded = false;

export function loadUpgrades(data) {
  upgradesDefs = data;
  loaded = true;
}

export function isLoaded() {
  return loaded;
}

/**
 * Get all upgrade definitions.
 */
export function getAllUpgrades() {
  return upgradesDefs;
}

/**
 * Get available upgrades (not yet purchased) that the player can afford.
 */
export function getAvailableUpgrades(gameState) {
  const owned = gameState.upgrades || [];
  return upgradesDefs.filter(u => !owned.includes(u.id) && gameState.stars >= u.custo);
}

/**
 * Purchase an upgrade. Deducts stars and adds to owned list.
 * @returns {boolean} True if purchase was successful
 */
export function purchaseUpgrade(upgradeId, gameState) {
  const upgrade = upgradesDefs.find(u => u.id === upgradeId);
  if (!upgrade) return false;

  const owned = gameState.upgrades || [];

  if (owned.includes(upgradeId)) return false; // already owned
  if (gameState.stars < upgrade.custo) return false; // can't afford

  gameState.stars -= upgrade.custo;
  owned.push(upgradeId);
  gameState.upgrades = owned;
  return true;
}

/**
 * Apply all passive effects that match a given trigger.
 * Modifies state in place.
 *
 * @param {string} trigger - The trigger event (after_roll, planet_start, recovery_check, before_boss, on_victory, before_event_penalty, check_shield)
 * @param {Object} state - Game state (mutated)
 * @param {Object} context - Optional context (e.g., { penalty: -8 })
 * @returns {Object} Summary of applied effects
 */
export function applyPassiveEffects(trigger, state, context = {}) {
  if (!state.upgrades || state.upgrades.length === 0) return {};

  const applied = {};

  for (const upgradeId of state.upgrades) {
    const upgrade = upgradesDefs.find(u => u.id === upgradeId);
    if (!upgrade) continue;

    const efeito = upgrade.efeito;
    if (efeito.gatilho !== trigger && !(trigger === 'always' && efeito.gatilho === 'always')) {
      continue;
    }

    switch (efeito.tipo) {
      case 'per_turn':
        if (efeito.atributo && efeito.valor) {
          state.attributes[efeito.atributo] = clamp(
            state.attributes[efeito.atributo] + efeito.valor, 0, 100
          );
          applied[efeito.atributo] = (applied[efeito.atributo] || 0) + efeito.valor;
        }
        break;

      case 'planet_start':
        if (efeito.atributo && efeito.valor) {
          state.attributes[efeito.atributo] = clamp(
            state.attributes[efeito.atributo] + efeito.valor, 0, 100
          );
          applied[efeito.atributo] = (applied[efeito.atributo] || 0) + efeito.valor;
        }
        break;

      case 'reduce_penalty':
        if (context.penalty && efeito.porcentagem) {
          const reduction = Math.ceil(Math.abs(context.penalty) * efeito.porcentagem / 100);
          context.reducedPenalty = context.penalty > 0 ? context.penalty : context.penalty + reduction;
          applied.reduced_by = reduction;
        }
        break;

      case 'recovery':
        if (efeito.atributo && efeito.condicao === 'below_30') {
          const current = state.attributes[efeito.atributo];
          if (current < 30 && current < (efeito.limite || 50)) {
            state.attributes[efeito.atributo] = clamp(
              current + efeito.valor, 0, efeito.limite || 50
            );
            applied[efeito.atributo] = (applied[efeito.atributo] || 0) + efeito.valor;
          }
        }
        break;

      case 'conditional_shield':
        if (state._shieldUsed) break; // once per phase
        if (efeito.atributo && efeito.condicao === 'below_20') {
          if (state.attributes[efeito.atributo] < 20) {
            state.attributes[efeito.atributo] = clamp(
              state.attributes[efeito.atributo] + efeito.valor, 0, 100
            );
            state._shieldUsed = true;
            applied[efeito.atributo] = (applied[efeito.atributo] || 0) + efeito.valor;
          }
        }
        break;

      case 'before_boss':
        if (efeito.atributo && efeito.valor) {
          if (efeito.atributo === 'all') {
            for (const key of ['faiscas', 'brilho', 'escudo']) {
              state.attributes[key] = clamp(state.attributes[key] + efeito.valor, 0, 100);
              applied[key] = (applied[key] || 0) + efeito.valor;
            }
          } else {
            state.attributes[efeito.atributo] = clamp(
              state.attributes[efeito.atributo] + efeito.valor, 0, 100
            );
            applied[efeito.atributo] = (applied[efeito.atributo] || 0) + efeito.valor;
          }
        }
        break;
    }
  }

  return applied;
}

/**
 * Reset once-per-phase flags (e.g., _shieldUsed).
 */
export function resetPhaseFlags(state) {
  state._shieldUsed = false;
}

/**
 * Get upgrade by ID.
 */
export function getUpgradeById(id) {
  return upgradesDefs.find(u => u.id === id) || null;
}
