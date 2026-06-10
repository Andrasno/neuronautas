/**
 * Game orchestrator: state management, turn loop, mode switching.
 */

import { clamp } from './utils.js';
import { getProfile, PLANETS, ATTRIBUTES, getPrimaryAttribute, getBossThreshold } from './profile.js';
import { saveGame, loadGame, clearSave, createNewGame } from './save.js';
import { generateBoard, resolveLanding, getTileType, rollDiceWithAgency } from './board.js';
import { loadCards, getCardsByPlanet, getBossByPlanet, getDisplayPistas, applyModifiers, checkGameOver, checkBossBonus } from './cards.js';
import { loadEvents, pickRandomEvent, applyEvent } from './events.js';
import { hasStoredIdea, hasFreeSlot, storeIdea, getMochilaOption, clearMochilaAfterUse, clearMochila, createIdeaFromOption } from './mochila.js';
import { loadUpgrades, getAvailableUpgrades, purchaseUpgrade, applyPassiveEffects as applyUpgradeEffects, resetPhaseFlags, getAllUpgrades } from './upgrades.js';
import {
  renderProfileSelector,
  renderGameScreen,
  renderDiceArea,
  renderBoard,
  showModal,
  closeModal,
  renderCardModal,
  showPostChoiceAnimation,
  updateAttributeBars,
  updateStarsDisplay
} from './ui.js';

/** @type {Object} Global game state */
let state = null;

/** Current game mode: 'profile-select' | 'playing' | 'paused' */
let screen = 'profile-select';

/** Data loaded flags */
let dataLoaded = false;

/**
 * Load game data (cards, events) from JSON files.
 */
async function loadGameData() {
  if (dataLoaded) return;
  try {
    const [cardsRes, eventsRes, upgradesRes] = await Promise.all([
      fetch('data/cards.json'),
      fetch('data/events.json'),
      fetch('data/upgrades.json')
    ]);
    const cardsData = await cardsRes.json();
    const eventsData = await eventsRes.json();
    const upgradesData = await upgradesRes.json();
    loadCards(cardsData);
    loadEvents(eventsData);
    loadUpgrades(upgradesData);
    dataLoaded = true;
  } catch (e) {
    console.error('Failed to load game data:', e);
  }
}

/**
 * Initialize the game: load save or show profile selector.
 */
export async function init() {
  await loadGameData();

  const savedState = loadGame();

  if (savedState.profile) {
    state = savedState;
    startGameLoop();
  } else {
    state = null;
    renderProfileSelector(handleProfileSelected);
  }
}

/**
 * Handle profile selection from the age screen.
 */
function handleProfileSelected(profileKey) {
  state = createNewGame(profileKey);
  saveGame(state);
  startGameLoop();
}

/**
 * Start or resume the main game loop.
 */
function startGameLoop() {
  const profile = getProfile(state.profile);
  if (!profile) {
    renderProfileSelector(handleProfileSelected);
    return;
  }

  screen = 'playing';
  renderGameScreen(state);
  renderCurrentBoard();
  startTurn();
}

/**
 * Render the board for the full game.
 */
function renderCurrentBoard() {
  if (!state._boardTiles) {
    state._boardTiles = generateBoard(state.profile);
  }
  renderBoard(state._boardTiles, getGlobalPosition());
}

/**
 * Get global board position (planet-relative to global).
 */
function getGlobalPosition() {
  const profile = getProfile(state.profile);
  const perPlanet = profile.housesPerPlanet;
  return (state.campaign.currentPlanet - 1) * perPlanet + state.campaign.currentHouse;
}

/**
 * Start a new turn: roll dice.
 */
function startTurn() {
  const profile = getProfile(state.profile);

  if (profile.diceAgency === 'pick-one') {
    startPickOneDice(profile);
  } else {
    startRerollDice(profile);
  }
}

/**
 * Explorador dice: roll 2, pick 1.
 */
function startPickOneDice(profile) {
  const result = rollDiceWithAgency(state.profile, state.upgrades);

  renderDiceArea(
    result.values,
    'pick-one',
    state.stars,
    0,
    0,
    (chosenIndex) => {
      const chosenValue = result.values[chosenIndex];
      handleDiceResult(chosenValue);
    }
  );
}

/**
 * Navegante dice: roll 1, may reroll with stars.
 */
function startRerollDice(profile, rerollsUsed = 0) {
  const result = rollDiceWithAgency(state.profile, state.upgrades);

  renderDiceArea(
    result.values,
    'reroll',
    state.stars,
    rerollsUsed,
    profile.maxRerolls,
    null,
    () => {
      // Reroll
      state.stars -= 1;
      saveGame(state);
      startRerollDice(profile, rerollsUsed + 1);
    },
    () => {
      // Accept
      handleDiceResult(result.values[0]);
    }
  );
}

// Remove old rollDiceWithUpgrades and getDiceCount - now handled by board.js

/**
 * Handle the chosen dice value: move token, resolve tile.
 */
function handleDiceResult(diceValue) {
  const profile = getProfile(state.profile);

  // Apply after-roll passive effects
  applyPassiveEffects('after_roll');

  // Calculate new position using board.js resolveLanding
  const globalPos = getGlobalPosition();
  const tiles = state._boardTiles || generateBoard(state.profile);
  state._boardTiles = tiles;

  let newGlobalPos = resolveLanding(tiles, globalPos, diceValue, state);

  // Convert back to planet-relative
  const perPlanet = profile.housesPerPlanet;
  state.campaign.currentPlanet = Math.floor(newGlobalPos / perPlanet) + 1;
  state.campaign.currentHouse = newGlobalPos % perPlanet;

  // Animate movement
  renderCurrentBoard();
  updateAttributeBars(state.attributes);
  saveGame(state);

  // Resolve the tile type
  setTimeout(() => {
    const tileType = getTileType(tiles, newGlobalPos);
    resolveTile(tileType, profile);
  }, 300);
}

/**
 * Resolve what happens when landing on a tile.
 */
function resolveTile(tileType, profile) {
  switch (tileType) {
    case 'treino':
      resolveTrainingCard(profile);
      break;
    case 'surpresa':
      resolveSurpriseEvent(profile);
      break;
    case 'evolucao':
      resolveEvolutionShop(profile);
      break;
    case 'chefao':
      resolveBossFight(profile);
      break;
    default:
      nextTurn();
  }
}

/** Resolve training card */
function resolveTrainingCard(profile) {
  const planetObj = PLANETS.find(p => p.id === state.campaign.currentPlanet);
  if (!planetObj) { nextTurn(); return; }

  const cards = getCardsByPlanet(planetObj.key);
  if (cards.length === 0) {
    // No cards for this planet - stub
    showModal(placeholderContent('🟢 Treino', 'Nenhuma carta disponível ainda.'),
      { closable: true, onClose: () => { state.stars += 1; saveGame(state); nextTurn(); } }
    );
    return;
  }

  // Pick a random card for this planet in campaign mode
  // Use used card tracking to avoid repeats
  if (!state._usedCards) state._usedCards = [];
  const available = cards.filter(c => !state._usedCards.includes(c.id));
  if (available.length === 0) { state._usedCards = []; } // Reset if all used

  const card = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : cards[Math.floor(Math.random() * cards.length)];

  if (available.length > 0) {
    state._usedCards.push(card.id);
  }

  renderCardModal(
    card,
    state.profile,
    (optionIndex) => {
      // Player chose an option
      const opcao = card.opcoes[optionIndex];
      const result = applyModifiers(state.attributes, opcao.modificadores_reais, state.profile);
      state.attributes = result.newAttributes;

      // Reward: 1 star per training card
      state.stars += 1;

      // Check for +1 extra star from Amigo Estrela upgrade
      if (state.upgrades.includes('amigo_estrela')) {
        state.stars += 1;
      }

      saveGame(state);
      updateAttributeBars(state.attributes);
      updateStarsDisplay(state.stars);

      showPostChoiceAnimation(result.appliedModifiers, () => {
        if (checkGameOver(state.attributes, state.profile)) {
          handleGameOver(profile);
        } else {
          nextTurn();
        }
      });
    },
    {
      onStore: () => {
        // Store selected answer in mochila
        storeIdeaInMochila(card);
      }
    }
  );
}

/** Resolve surprise event */
function resolveSurpriseEvent(profile) {
  const event = pickRandomEvent();
  if (!event) { nextTurn(); return; }

  const result = applyEvent(event, state);
  saveGame(state);

  const content = document.createElement('div');
  content.className = 'placeholder-modal';
  content.innerHTML = `
    <h2>🟡 Surpresa!</h2>
    <p style="font-size:1.1rem">${event.descricao}</p>
    ${formatEventChanges(result.changes)}
    <button id="event-ok-btn" style="
      margin-top:1rem; padding:0.5rem 2rem; font-size:1rem;
      background:#5cb85c; border:none; border-radius:8px;
      color:white; cursor:pointer;">OK</button>
  `;

  showModal(content, { closable: false });

  document.getElementById('event-ok-btn')?.addEventListener('click', () => {
    closeModal();
    updateAttributeBars(state.attributes);
    updateStarsDisplay(state.stars);
    if (checkGameOver(state.attributes, state.profile)) {
      handleGameOver(profile);
    } else {
      nextTurn();
    }
  });
}

/** Format event changes for display */
function formatEventChanges(changes) {
  let html = '<div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;margin-top:0.5rem">';
  for (const [key, value] of Object.entries(changes)) {
    if (value === 0) continue;
    const sign = value >= 0 ? '+' : '';
    const icon = key === 'estrelas' ? '⭐' :
                 key === 'faiscas' ? '⚡' :
                 key === 'brilho' ? '✨' :
                 key === 'escudo' ? '🛡️' : '';
    const color = value >= 0 ? '#5cb85c' : '#d9534f';
    html += `<span style="color:${color};font-weight:700;font-size:1.1rem">${sign}${value}${icon}</span>`;
  }
  html += '</div>';
  return html;
}

/** Resolve evolution shop */
function resolveEvolutionShop(profile) {
  const available = getAvailableUpgrades(state);
  const all = getAllUpgrades();

  const content = document.createElement('div');
  content.className = 'shop-modal';

  const header = document.createElement('h2');
  header.innerHTML = '🔵 Loja de Adesivos';
  content.appendChild(header);

  const starsInfo = document.createElement('p');
  starsInfo.className = 'shop-stars';
  starsInfo.textContent = `⭐ ${state.stars} estrelas disponíveis`;
  content.appendChild(starsInfo);

  const grid = document.createElement('div');
  grid.className = 'shop-grid';

  all.forEach(upgrade => {
    const owned = (state.upgrades || []).includes(upgrade.id);
    const affordable = state.stars >= upgrade.custo;
    const canBuy = !owned && affordable;

    const card = document.createElement('div');
    card.className = `shop-card ${owned ? 'owned' : ''} ${canBuy ? 'available' : 'locked'}`;

    card.innerHTML = `
      <div class="shop-icon">${upgrade.icone}</div>
      <div class="shop-name">${upgrade.nome}</div>
      <div class="shop-desc">${upgrade.descricao}</div>
      <div class="shop-cost">${owned ? '✅ Comprado' : `⭐ ${upgrade.custo}`}</div>
    `;

    if (canBuy) {
      const buyBtn = document.createElement('button');
      buyBtn.className = 'shop-buy-btn';
      buyBtn.textContent = 'Comprar';
      buyBtn.addEventListener('click', () => {
        if (purchaseUpgrade(upgrade.id, state)) {
          saveGame(state);
          updateStarsDisplay(state.stars);
          closeModal();
          nextTurn();
        }
      });
      card.appendChild(buyBtn);
    }

    grid.appendChild(card);
  });

  content.appendChild(grid);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'shop-close-btn';
  closeBtn.textContent = 'Sair da loja';
  closeBtn.addEventListener('click', () => {
    closeModal();
    nextTurn();
  });
  content.appendChild(closeBtn);

  showModal(content, { closable: false });
}

/** Resolve boss fight */
function resolveBossFight(profile) {
  const planetObj = PLANETS.find(p => p.id === state.campaign.currentPlanet);
  if (!planetObj) { completePlanet(profile); return; }

  const bossCard = getBossByPlanet(planetObj.key);
  if (!bossCard) {
    // Fallback if no boss card defined yet
    completePlanet(profile);
    return;
  }

  renderCardModal(
    bossCard,
    state.profile,
    (optionIndex) => {
      const opcao = bossCard.opcoes[optionIndex];

      // Check boss bonus
      const bonus = checkBossBonus(state.attributes, bossCard, state.profile);
      let modifiers = { ...opcao.modificadores_reais };
      if (bonus.bonusActive && optionIndex === 0) {
        // Best option gets amplified with bonus
        for (const key in modifiers) {
          if (modifiers[key] > 0) modifiers[key] = Math.ceil(modifiers[key] * bonus.multiplier);
        }
      }

      const result = applyModifiers(state.attributes, modifiers, state.profile);
      state.attributes = result.newAttributes;

      // Reward: 3 stars for defeating boss
      state.stars += 3;
      if (state.upgrades.includes('amigo_estrela')) {
        state.stars += 1;
      }

      saveGame(state);
      updateAttributeBars(state.attributes);
      updateStarsDisplay(state.stars);

      showPostChoiceAnimation(result.appliedModifiers, () => {
        completePlanet(profile);
      });
    },
    {
      storedOption: hasStoredIdea(state) ? state.mochila.storedIdea : null,
      onUseStored: () => {
        const mochilaOption = getMochilaOption(state);
        if (mochilaOption) {
          const result = applyModifiers(state.attributes, mochilaOption.modifiers, state.profile);
          state.attributes = result.newAttributes;
          state.stars += 3;
          clearMochilaAfterUse(state);
          saveGame(state);
          updateAttributeBars(state.attributes);
          updateStarsDisplay(state.stars);
          showPostChoiceAnimation(result.appliedModifiers, () => completePlanet(profile));
        }
      }
    }
  );
}

/** Store an idea in the mochila */
function storeIdeaInMochila(card) {
  if (!hasFreeSlot(state)) return;

  const idea = createIdeaFromOption(card, 0); // Store option 0 as representative
  if (idea) {
    storeIdea(state, idea);
    saveGame(state);
  }
}

/** Create placeholder content for stub modals */
function createPlaceholderContent(icon, text) {
  const div = document.createElement('div');
  div.className = 'placeholder-modal';
  div.innerHTML = `<h2>${icon}</h2><p>${text}</p>`;
  return div;
}

/**
 * Complete the current planet and advance.
 */
function completePlanet(profile) {
  state.campaign.completedPlanets.push(state.campaign.currentPlanet);
  state.campaign.defeatedBosses.push(state.campaign.currentPlanet);
  state.campaign.lossCount = 0;

  // Clear mochila between planets per spec
  clearMochila(state);

  if (state.campaign.currentPlanet >= 5) {
    // Game complete!
    showModal(
      createPlaceholderContent('🏆', 'Parabéns! Você completou a jornada!'),
      { closable: true, onClose: () => { /* restart or free mode */ } }
    );
  } else {
    state.campaign.currentPlanet += 1;
    state.campaign.currentHouse = 0;
    // Rebuild board for new planet
    state._boardTiles = generateBoard(state.profile);
    // Apply planet-start effects
    applyPassiveEffects('planet_start');
    saveGame(state);
    renderGameScreen(state);
    renderCurrentBoard();
    updateAttributeBars(state.attributes);
    updateStarsDisplay(state.stars);
    nextTurn();
  }
}

/**
 * Begin the next turn.
 */
function nextTurn() {
  const profile = getProfile(state.profile);
  const tilesPerPlanet = profile.housesPerPlanet;

  // Check game over
  const minAttr = profile.minAttr;
  for (const [key, value] of Object.entries(state.attributes)) {
    if (value <= minAttr) {
      handleGameOver(profile);
      return;
    }
  }

  // Check if boss defeated (player has completed this planet's boss)
  const chefaoPos = tilesPerPlanet - 1;
  if (state.campaign.currentHouse >= chefaoPos) {
    // Already at/defeated chefao, advance planet
    completePlanet(profile);
    return;
  }

  // Apply recovery effects
  applyPassiveEffects('recovery_check');

  saveGame(state);
  startTurn();
}

/**
 * Handle game over.
 */
function handleGameOver(profile) {
  state.campaign.lossCount = (state.campaign.lossCount || 0) + 1;
  state.campaign.currentHouse = 0;

  // Restore attributes to starting values
  state.attributes = { ...profile.startingAttr };

  // Difficulty adaptation: offer help after 3 losses
  if (state.campaign.lossCount >= 3) {
    state.attributes.faiscas = Math.min(100, state.attributes.faiscas + 15);
    state.attributes.brilho = Math.min(100, state.attributes.brilho + 15);
    state.attributes.escudo = Math.min(100, state.attributes.escudo + 15);
    state.campaign.lossCount = 0;
  }

  saveGame(state);
  renderGameScreen(state);
  renderCurrentBoard();
  updateAttributeBars(state.attributes);
}

/**
 * Apply passive effects from purchased upgrades (delegates to upgrades module).
 */
function applyPassiveEffects(trigger, context = {}) {
  return applyUpgradeEffects(trigger, state, context);
}

/**
 * Get the current game state (for testing).
 */
export function getState() {
  return state;
}

/**
 * Set state directly (for testing).
 */
export function setState(newState) {
  state = newState;
}

/**
 * Get current screen.
 */
export function getScreen() {
  return screen;
}
