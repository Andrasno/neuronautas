/**
 * Mochila (Backpack) mechanic: store answers and deploy on boss with 50% bonus.
 */

/**
 * Check if the mochila has any stored ideas.
 */
export function hasStoredIdea(gameState) {
  return !!(gameState.mochila?.storedIdea);
}

/**
 * Check if there's an available slot for storing a new idea.
 */
export function hasFreeSlot(gameState) {
  if (!gameState.mochila?.storedIdea) return true;
  if (gameState.upgrades?.includes('mochila_reforcada') && !gameState.mochila?.storedIdea2) return true;
  return false;
}

/**
 * Store an idea in the mochila.
 * @param {Object} gameState - Current game state (mutated)
 * @param {Object} idea - { cardId, text, modifiers }
 * @returns {boolean} True if stored successfully
 */
export function storeIdea(gameState, idea) {
  if (!gameState.mochila) {
    gameState.mochila = { storedIdea: null, storedIdea2: null };
  }

  if (!gameState.mochila.storedIdea) {
    gameState.mochila.storedIdea = idea;
    return true;
  }

  if (gameState.upgrades?.includes('mochila_reforcada') && !gameState.mochila.storedIdea2) {
    gameState.mochila.storedIdea2 = idea;
    return true;
  }

  // Overwrite slot 1 if no space
  gameState.mochila.storedIdea = idea;
  return true;
}

/**
 * Get the stored idea for boss deployment, with 50% bonus applied.
 * Returns null if no idea stored.
 */
export function getMochilaOption(gameState) {
  const idea = gameState.mochila?.storedIdea;
  if (!idea) return null;

  const boostedModifiers = {};
  for (const [key, value] of Object.entries(idea.modifiers)) {
    boostedModifiers[key] = Math.ceil(value * 1.5);
  }

  return {
    text: idea.text,
    modifiers: boostedModifiers
  };
}

/**
 * Clear the used mochila slot after boss deployment.
 * Shifts slot 2 -> slot 1 if available.
 */
export function clearMochilaAfterUse(gameState) {
  if (!gameState.mochila) return;

  if (gameState.mochila.storedIdea2) {
    gameState.mochila.storedIdea = gameState.mochila.storedIdea2;
    gameState.mochila.storedIdea2 = null;
  } else {
    gameState.mochila.storedIdea = null;
  }
}

/**
 * Clear all stored ideas (end of planet).
 */
export function clearMochila(gameState) {
  if (!gameState.mochila) return;
  gameState.mochila.storedIdea = null;
  gameState.mochila.storedIdea2 = null;
}

/**
 * Create an idea object from a card's selected option.
 */
export function createIdeaFromOption(card, optionIndex) {
  const opcao = card.opcoes[optionIndex];
  if (!opcao) return null;

  return {
    cardId: card.id,
    text: opcao.texto_resposta || card.pedido,
    modifiers: { ...opcao.modificadores_reais }
  };
}
