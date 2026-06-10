/**
 * UI rendering module: DOM manipulation, modals, animations.
 * All visual output goes through this module.
 */

import { createElement, formatModifier } from './utils.js';
import { ATTRIBUTES, PLANETS, PROFILES } from './profile.js';

let appRoot = null;

/** Get or locate the root app container */
function getRoot() {
  if (!appRoot) {
    appRoot = document.getElementById('app');
  }
  return appRoot;
}

/** Clear the app container */
export function clearUI() {
  const root = getRoot();
  if (root) root.innerHTML = '';
}

/**
 * Render the profile/age selection screen.
 * @param {Function} onSelect - callback(profileKey)
 */
export function renderProfileSelector(onSelect) {
  const root = getRoot();
  root.innerHTML = '';

  const container = createElement('div', { className: 'profile-selector' },
    createElement('h1', { className: 'game-title' }, '🧠 Neuronautas'),
    createElement('h2', { className: 'game-subtitle' }, 'A Jornada do Pensamento'),
    createElement('p', { className: 'age-question' }, 'Qual é a sua idade?'),
    createElement('div', { className: 'profile-buttons' },
      createElement('button', {
        className: 'profile-btn explorador-btn',
        onClick: () => onSelect('explorador')
      },
        createElement('span', { className: 'profile-icon' }, '🚀'),
        createElement('span', { className: 'profile-label' }, 'Tenho 6 a 8 anos'),
        createElement('span', { className: 'profile-desc' }, 'Explorador')
      ),
      createElement('button', {
        className: 'profile-btn navegante-btn',
        onClick: () => onSelect('navegante')
      },
        createElement('span', { className: 'profile-icon' }, '🌟'),
        createElement('span', { className: 'profile-label' }, 'Tenho 9 a 11 anos'),
        createElement('span', { className: 'profile-desc' }, 'Navegante')
      )
    )
  );

  root.appendChild(container);
}

/**
 * Render the game screen: attribute bars, game header, dice area, board placeholder.
 * @param {Object} state - Full GameState
 */
export function renderGameScreen(state) {
  const root = getRoot();
  root.innerHTML = '';

  // Header
  const planet = PLANETS.find(p => p.id === state.campaign.currentPlanet);
  const header = createElement('header', { className: 'game-header' },
    createElement('div', { className: 'planet-info' },
      createElement('span', { className: 'planet-name' }, planet ? planet.name : '?'),
      createElement('span', { className: 'house-num' }, `Casa ${state.campaign.currentHouse}`)
    ),
    createElement('div', { className: 'header-buttons' },
      createElement('button', { className: 'icon-btn', id: 'btn-album', title: 'Álbum de Adesivos' }, '🏆'),
      createElement('button', { className: 'icon-btn', id: 'btn-menu', title: 'Menu' }, '☰')
    )
  );

  // Attribute bars
  const attrPanel = createElement('div', { className: 'attribute-panel' });
  for (const [key, attr] of Object.entries(ATTRIBUTES)) {
    const value = state.attributes[key] || 0;
    const bar = createElement('div', { className: 'attr-bar-container' },
      createElement('div', { className: 'attr-label' },
        createElement('span', { className: 'attr-icon' }, attr.icon),
        createElement('span', { className: 'attr-name' }, attr.name)
      ),
      createElement('div', { className: 'attr-bar-bg' },
        createElement('div', {
          className: 'attr-bar-fill',
          style: `width: ${value}%; background-color: ${attr.color};`
        })
      ),
      createElement('span', { className: 'attr-value' }, `${value}/100`)
    );
    attrPanel.appendChild(bar);
  }

  // Stars display
  const starsDisplay = createElement('div', { className: 'stars-display' },
    createElement('span', { className: 'stars-icon' }, '⭐'),
    createElement('span', { className: 'stars-count' }, String(state.stars))
  );

  // Dice area (placeholder - actual dice rendered by renderDiceArea)
  const diceArea = createElement('div', { className: 'dice-area', id: 'dice-area' });

  // Board area (placeholder - actual board rendered by renderBoard)
  const boardArea = createElement('div', { className: 'board-area', id: 'board-area' });

  // Neuronauta visual
  const character = createElement('div', { className: 'neuronauta-character', id: 'neuronauta' },
    createElement('div', { className: 'neuronauta-body' }, '💡')
  );

  root.appendChild(header);
  root.appendChild(attrPanel);
  root.appendChild(starsDisplay);
  root.appendChild(character);
  root.appendChild(diceArea);
  root.appendChild(boardArea);
}

/**
 * Render dice area with agency controls.
 * @param {Array} diceValues - Array of rolled dice values
 * @param {string} agency - 'pick-one' or 'reroll'
 * @param {number} stars - Current star count
 * @param {number} rerollsUsed - Rerolls used this turn
 * @param {number} maxRerolls - Max rerolls allowed
 * @param {Function} onPick - callback(index) for pick-one mode
 * @param {Function} onReroll - callback() for reroll mode
 * @param {Function} onAccept - callback() for reroll mode (accept current)
 */
export function renderDiceArea(diceValues, agency, stars, rerollsUsed, maxRerolls, onPick, onReroll, onAccept) {
  const area = document.getElementById('dice-area');
  if (!area) return;
  area.innerHTML = '';

  const diceContainer = createElement('div', { className: 'dice-container' });

  if (agency === 'pick-one') {
    // Explorador: show all dice, pick one
    diceValues.forEach((val, idx) => {
      const die = createElement('div', {
        className: 'die clickable',
        onClick: () => onPick(idx)
      }, String(val));
      diceContainer.appendChild(die);
    });
    const hint = createElement('p', { className: 'dice-hint' }, 'Clique no dado que quer usar!');
    area.appendChild(diceContainer);
    area.appendChild(hint);
  } else {
    // Navegante: show one die with reroll option
    const die = createElement('div', { className: 'die' }, String(diceValues[0]));
    diceContainer.appendChild(die);

    const rerollAvailable = rerollsUsed < maxRerolls && stars > 0;
    const controls = createElement('div', { className: 'dice-controls' },
      createElement('button', {
        className: 'dice-btn accept-btn',
        onClick: () => onAccept()
      }, 'Usar este valor'),
      createElement('button', {
        className: 'dice-btn reroll-btn',
        disabled: !rerollAvailable ? 'disabled' : null,
        onClick: () => onReroll()
      }, '🎲 Rerrolar ⭐')
    );

    // Show remaining rerolls as stars
    const starsLeft = maxRerolls - rerollsUsed;
    const starsDisplay = createElement('div', { className: 'reroll-stars' });
    for (let i = 0; i < maxRerolls; i++) {
      starsDisplay.appendChild(
        createElement('span', {
          className: i < starsLeft ? 'reroll-star active' : 'reroll-star used'
        }, '⭐')
      );
    }

    area.appendChild(diceContainer);
    area.appendChild(controls);
    area.appendChild(starsDisplay);
  }
}

/**
 * Render the board with tiles.
 * @param {Array} tiles - Array of tile objects {type, index, planetId}
 * @param {number} currentPosition - Current token position
 */
export function renderBoard(tiles, currentPosition) {
  const area = document.getElementById('board-area');
  if (!area) return;
  area.innerHTML = '';

  const boardContainer = createElement('div', { className: 'board-container' });

  tiles.forEach((tile, idx) => {
    const isCurrent = idx === currentPosition;
    const tileEl = createElement('div', {
      className: `tile tile-${tile.type}${isCurrent ? ' current' : ''}${idx < currentPosition ? ' passed' : ''}`,
      dataset: { index: idx, type: tile.type }
    },
      createElement('span', { className: 'tile-icon' }, TILE_ICONS[tile.type] || '?'),
      createElement('span', { className: 'tile-num' }, String(idx))
    );

    if (isCurrent && tile.type !== 'chefao') {
      tileEl.appendChild(
        createElement('div', { className: 'token' }, '💡')
      );
    }
    if (isCurrent && tile.type === 'chefao') {
      tileEl.appendChild(
        createElement('div', { className: 'token boss-token' }, '⚔️')
      );
    }

    boardContainer.appendChild(tileEl);
  });

  area.appendChild(boardContainer);
}

const TILE_ICONS = {
  treino: '🟢',
  surpresa: '🟡',
  evolucao: '🔵',
  chefao: '🟣'
};

export { TILE_ICONS };

/**
 * Show a modal overlay. Returns the modal element.
 */
export function showModal(content, options = {}) {
  const { closable = true, onClose = null } = options;

  const overlay = createElement('div', { className: 'modal-overlay' });
  const modal = createElement('div', { className: 'modal' });

  if (closable) {
    const closeBtn = createElement('button', {
      className: 'modal-close',
      onClick: () => {
        closeModal();
        if (onClose) onClose();
      }
    }, '✕');
    modal.appendChild(closeBtn);
  }

  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus trap
  modal.focus();

  return { overlay, modal };
}

/** Close any open modal */
export function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
}

/**
 * Render a card modal for training challenges.
 * @param {Object} card - The card object
 * @param {string} profileKey - Current profile
 * @param {Function} onChoose - callback(optionIndex)
 * @param {Object} mochila - { hasStoredIdea, onStore }
 */
export function renderCardModal(card, profileKey, onChoose, mochilaOpts = {}) {
  const isBoss = card.isBoss || false;
  const text = (profileKey === 'explorador' && card.texto_explorador)
    ? card.texto_explorador
    : card.pedido;

  const content = createElement('div', { className: 'card-modal' },
    createElement('div', { className: 'card-character' },
      createElement('span', { className: 'card-char-icon' }, card.personagem_icone || '👤'),
      createElement('span', { className: 'card-char-name' }, card.personagem_nome || 'Habitante')
    ),
    createElement('div', { className: `card-request ${isBoss ? 'boss-request' : ''}` },
      createElement('p', { className: 'card-text' }, text)
    ),
    createElement('div', { className: 'card-options', id: 'card-options' })
  );

  const { overlay } = showModal(content, { closable: false });

  // Render option buttons
  const optionsContainer = document.getElementById('card-options');
  card.opcoes.forEach((opcao, idx) => {
    const pistas = getPistasDisplay(opcao, profileKey);
    const btn = createElement('button', {
      className: 'option-btn',
      onClick: () => {
        closeModal();
        onChoose(idx);
      }
    },
      createElement('span', { className: 'option-icon' }, opcao.icone || '▶'),
      createElement('span', { className: 'option-label' }, opcao.rotulo),
      createElement('span', { className: 'option-pistas' }, pistas)
    );
    optionsContainer.appendChild(btn);
  });

  // Mochila button
  if (mochilaOpts.onStore && !isBoss) {
    const storeBtn = createElement('button', {
      className: 'option-btn mochila-btn',
      onClick: () => {
        mochilaOpts.onStore();
      }
    },
      createElement('span', { className: 'option-icon' }, '📦'),
      createElement('span', { className: 'option-label' }, 'Guardar esta resposta'),
      createElement('span', { className: 'option-pistas' }, 'Usar no chefão com +50%')
    );
    optionsContainer.appendChild(storeBtn);
  }

  // Mochila option for boss
  if (mochilaOpts.storedOption && isBoss) {
    const storedBtn = createElement('button', {
      className: 'option-btn mochila-option-btn',
      onClick: () => {
        closeModal();
        mochilaOpts.onUseStored();
      }
    },
      createElement('span', { className: 'option-icon' }, '📦'),
      createElement('span', { className: 'option-label' }, 'Usar ideia guardada'),
      createElement('span', { className: 'option-pistas' }, 'Bônus de +50%!')
    );
    optionsContainer.appendChild(storedBtn);
  }

  return overlay;
}

/** Get pistas display string based on profile */
function getPistasDisplay(opcao, profileKey) {
  if (profileKey === 'explorador') {
    // Icons only
    return opcao.pistas ? opcao.pistas.join(' ') : '';
  }
  // Navegante: vague text hint
  if (!opcao.pistas) return 'Efeitos desconhecidos';
  const hints = opcao.pistas.map(p => pistaToText(p));
  return hints.join(', ');
}

/** Convert a single pista icon to a short text hint */
function pistaToText(pista) {
  const map = {
    '⚡↑↑': 'Aumenta muito Faíscas',
    '⚡↑': 'Aumenta Faíscas',
    '⚡↓': 'Diminui Faíscas',
    '⚡↓↓': 'Diminui muito Faíscas',
    '⚡→': 'Faíscas estável',
    '✨↑↑': 'Aumenta muito Brilho',
    '✨↑': 'Aumenta Brilho',
    '✨↓': 'Diminui Brilho',
    '✨↓↓': 'Diminui muito Brilho',
    '✨→': 'Brilho estável',
    '🛡️↑↑': 'Aumenta muito Escudo',
    '🛡️↑': 'Aumenta Escudo',
    '🛡️↓': 'Diminui Escudo',
    '🛡️↓↓': 'Diminui muito Escudo',
    '🛡️→': 'Escudo estável'
  };
  return map[pista] || pista;
}

/**
 * Show post-choice animation with numeric modifiers.
 * @param {Object} modifiers - { faiscas, brilho, escudo }
 * @param {Function} onComplete - callback after animation
 */
export function showPostChoiceAnimation(modifiers, onComplete) {
  const annContainer = createElement('div', { className: 'choice-animation' });

  for (const [key, value] of Object.entries(modifiers)) {
    if (value === 0) continue;
    const attr = ATTRIBUTES[key];
    const sign = value >= 0 ? '+' : '';
    const ann = createElement('div', {
      className: `anim-modifier ${value >= 0 ? 'positive' : 'negative'}`
    }, `${sign}${value} ${attr.icon}`);
    annContainer.appendChild(ann);
  }

  document.body.appendChild(annContainer);

  // Trigger animation sequence
  requestAnimationFrame(() => {
    annContainer.classList.add('show');
    const items = annContainer.querySelectorAll('.anim-modifier');
    items.forEach((item, i) => {
      item.style.animationDelay = `${i * 0.3}s`;
    });
  });

  // Remove after ~2 seconds
  setTimeout(() => {
    annContainer.classList.add('hide');
    setTimeout(() => {
      annContainer.remove();
      if (onComplete) onComplete();
    }, 300);
  }, 1500 + Object.keys(modifiers).length * 300);
}

/**
 * Update attribute bars in the UI.
 */
export function updateAttributeBars(attributes) {
  for (const [key, value] of Object.entries(attributes)) {
    const fill = document.querySelector(`.attr-bar-fill[style*="${ATTRIBUTES[key]?.color}"]`);
    if (fill) {
      fill.style.width = `${value}%`;
    }
    // Find the value span
    const containers = document.querySelectorAll('.attr-bar-container');
    containers.forEach(c => {
      const icon = c.querySelector('.attr-icon');
      if (icon && icon.textContent === ATTRIBUTES[key]?.icon) {
        const valSpan = c.querySelector('.attr-value');
        if (valSpan) valSpan.textContent = `${value}/100`;
      }
    });
  }
}

/**
 * Update star count display.
 */
export function updateStarsDisplay(stars) {
  const el = document.querySelector('.stars-count');
  if (el) el.textContent = String(stars);
}
