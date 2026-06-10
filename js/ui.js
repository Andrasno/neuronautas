/**
 * UI rendering module: DOM manipulation, modals, animations.
 * All visual output goes through this module.
 */

import { createElement, formatModifier } from './utils.js';
import { ATTRIBUTES, PLANETS, PROFILES } from './profile.js';
import { getDisplayPistas } from './cards.js';

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

export const AVATARS = [
  { id: 'inventor', emoji: '🧑‍🚀', nome: 'Inventor', desc: 'Cria coisas novas' },
  { id: 'guardiao', emoji: '🦸', nome: 'Guardião', desc: 'Protege os amigos' },
  { id: 'explorador', emoji: '🔭', nome: 'Explorador', desc: 'Descobre o universo' },
  { id: 'diplomata', emoji: '🕊️', nome: 'Diplomata', desc: 'Resolve conversando' }
];

/**
 * Render avatar selection after profile choice.
 * @param {Function} onSelect - callback(avatarEmoji)
 */
export function renderAvatarPicker(onSelect) {
  const root = getRoot();
  root.innerHTML = '';

  const container = createElement('div', { className: 'profile-selector' },
    createElement('h1', { className: 'game-title' }, 'Escolha seu Neuronauta'),
    createElement('p', { className: 'age-question' }, 'Quem vai viajar pela galáxia?'),
    createElement('div', { className: 'avatar-grid' },
      ...AVATARS.map(a =>
        createElement('button', {
          className: 'avatar-btn',
          onClick: () => onSelect(a.emoji)
        },
          createElement('span', { className: 'avatar-emoji' }, a.emoji),
          createElement('span', { className: 'avatar-nome' }, a.nome),
          createElement('span', { className: 'avatar-desc' }, a.desc)
        )
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

  // Resource bar: stars + energia + mochila
  const resourceBar = createElement('div', { className: 'resource-bar' },
    createElement('div', { className: 'stars-display', id: 'stars-display' },
      createElement('span', { className: 'stars-icon' }, '⭐'),
      createElement('span', { className: 'stars-count' }, String(state.stars))
    ),
    createElement('div', { className: 'energia-display', id: 'energia-display' },
      createElement('span', { className: 'energia-icon' }, '⚡'),
      createElement('span', { className: 'energia-count' }, String(state.energia || 0))
    ),
    createElement('div', { className: 'mochila-badge', id: 'mochila-badge', title: 'Mochila de Ideias' },
      createElement('span', {}, '🎒'),
      createElement('span', { className: 'mochila-count', id: 'mochila-count' },
        (state.mochila?.storedIdea ? 1 : 0) + (state.mochila?.storedIdea2 ? 1 : 0) > 0
          ? String((state.mochila?.storedIdea ? 1 : 0) + (state.mochila?.storedIdea2 ? 1 : 0))
          : ''
      )
    )
  );

  // Dice area
  const diceArea = createElement('div', { className: 'dice-area', id: 'dice-area' });

  // Board area (hub view by default)
  const boardArea = createElement('div', { className: 'board-area', id: 'board-area' });

  // Neuronauta + companion (use avatar if chosen)
  const avatarEmoji = state.avatar || '💡';
  const characterRow = createElement('div', { className: 'character-row' },
    createElement('div', { className: 'neuronauta-character', id: 'neuronauta' },
      createElement('div', { className: 'neuronauta-body' }, avatarEmoji)
    ),
    createElement('div', { className: 'companion', id: 'companion' },
      createElement('div', { className: 'companion-body', id: 'companion-body' }, '🤖'),
      createElement('div', { className: 'companion-bubble', id: 'companion-bubble' }, 'Vamos lá!')
    )
  );

  root.appendChild(header);
  root.appendChild(attrPanel);
  root.appendChild(resourceBar);
  root.appendChild(characterRow);
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

/** Get pistas display string based on profile (delegates to cards.js) */
function getPistasDisplay(opcao, profileKey) {
  // Use the cards.js function which handles visual stars for Explorador
  return getDisplayPistas(opcao, profileKey);
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

/**
 * Animate a star flying from source coordinates to the star counter.
 * @param {number} sourceX - Viewport X of source
 * @param {number} sourceY - Viewport Y of source
 * @param {Function} onArrive - callback after star lands
 */
export function animateStarEarned(sourceX, sourceY, onArrive) {
  const targetEl = document.querySelector('.stars-display');
  if (!targetEl) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (onArrive) onArrive();
    return;
  }

  const star = document.createElement('div');
  star.style.cssText = `
    position: fixed;
    left: ${sourceX - 16}px;
    top: ${sourceY - 16}px;
    font-size: 2rem;
    z-index: 300;
    pointer-events: none;
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transform: scale(1);
  `;
  star.textContent = '⭐';
  document.body.appendChild(star);

  const targetRect = targetEl.getBoundingClientRect();
  const targetX = targetRect.left + targetRect.width / 2 - 16;
  const targetY = targetRect.top + targetRect.height / 2 - 16;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      star.style.left = `${targetX}px`;
      star.style.top = `${targetY}px`;
      star.style.transform = 'scale(0.5)';
      star.style.opacity = '0.8';
    });
  });

  star.addEventListener('transitionend', () => {
    star.remove();
    targetEl.style.transform = 'scale(1.3)';
    targetEl.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    requestAnimationFrame(() => {
      targetEl.style.transform = 'scale(1)';
    });
    if (onArrive) onArrive();
  });
}

/**
 * Update energia display.
 */
export function updateEnergiaDisplay(energia) {
  const el = document.querySelector('.energia-count');
  if (el) el.textContent = String(energia);
}

/**
 * Update mochila badge count.
 */
export function updateMochilaBadge(mochila) {
  const el = document.querySelector('.mochila-count');
  if (!el) return;
  const count = (mochila?.storedIdea ? 1 : 0) + (mochila?.storedIdea2 ? 1 : 0);
  el.textContent = count > 0 ? String(count) : '';
  const badge = document.querySelector('.mochila-badge');
  if (badge) {
    badge.style.display = count > 0 ? 'flex' : 'flex'; // always show
    badge.style.opacity = count > 0 ? '1' : '0.4';
  }
}

/**
 * Make the companion react with an emotion and message.
 * @param {'celebrate'|'think'|'brave'|'warn'|'neutral'} emotion
 * @param {string} message
 */
export function reactCompanion(emotion, message) {
  const body = document.getElementById('companion-body');
  const bubble = document.getElementById('companion-bubble');
  if (!body || !bubble) return;

  const expressions = {
    celebrate: { icon: '🎉', anim: 'companion-bounce' },
    think: { icon: '🤔', anim: 'companion-tilt' },
    brave: { icon: '💪', anim: 'companion-grow' },
    warn: { icon: '😰', anim: 'companion-shake' },
    neutral: { icon: '🤖', anim: '' }
  };

  const expr = expressions[emotion] || expressions.neutral;
  body.textContent = expr.icon;

  // Reset animations
  body.className = 'companion-body';
  if (expr.anim) {
    void body.offsetWidth; // force reflow
    body.classList.add(expr.anim);
  }

  // Update bubble
  bubble.textContent = message;
  bubble.style.opacity = '1';
  bubble.style.transform = 'scale(1)';

  // Auto-hide bubble after delay
  clearTimeout(body._bubbleTimer);
  body._bubbleTimer = setTimeout(() => {
    bubble.style.opacity = '0';
    bubble.style.transform = 'scale(0.8)';
  }, 2500);
}

/** Planet mission node icons */
const MISSION_ICONS = { treino: '⭐', surpresa: '❓', evolucao: '🏪', chefao: '👑' };
const MISSION_LABELS = { treino: 'Missão', surpresa: 'Surpresa', evolucao: 'Loja', chefao: 'Chefão' };

/**
 * Render planet hub view (circular mission nodes) instead of linear board.
 * @param {Array} tiles - Planet tiles
 * @param {number} currentPos - Current position
 * @param {string} planetColor - CSS color
 * @param {Function} onMissionClick - callback(index, type)
 */
export function renderPlanetHub(tiles, currentPos, planetColor, onMissionClick) {
  const area = document.getElementById('board-area');
  if (!area) return;
  area.innerHTML = '';

  const hub = createElement('div', { className: 'planet-hub' });
  const surface = createElement('div', {
    className: 'planet-surface',
    style: `background: radial-gradient(circle at 40% 40%, ${planetColor}, ${planetColor}44)`
  });

  // Orbit ring
  const orbit = createElement('div', { className: 'orbit-ring',
    style: `border-color: ${planetColor}44`
  });

  // Position nodes in a circle
  const cx = 50, cy = 50, radius = 38;
  tiles.forEach((tile, idx) => {
    const angle = (idx / tiles.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const isCurrent = idx === currentPos;
    const isDone = idx < currentPos;
    const isChefao = tile.type === 'chefao';

    const node = createElement('div', {
      className: `planet-node node-${tile.type}${isCurrent ? ' current' : ''}${isDone ? ' done' : ''}${isChefao ? ' boss-node' : ''}`,
      style: `left:${x}%;top:${y}%`,
      onClick: () => onMissionClick(idx, tile.type)
    },
      createElement('span', { className: 'node-icon' }, MISSION_ICONS[tile.type] || '?'),
      createElement('span', { className: 'node-label' }, MISSION_LABELS[tile.type] || tile.type)
    );

    if (isCurrent) {
      const marker = createElement('div', { className: 'node-marker' }, '📍');
      node.appendChild(marker);
    }

    surface.appendChild(node);
  });

  hub.appendChild(surface);
  area.appendChild(hub);
}

/**
 * Speak text using SpeechSynthesis (if enabled).
 */
let narrationEnabled = false;
export function toggleNarration() {
  narrationEnabled = !narrationEnabled;
  if (narrationEnabled) window.speechSynthesis?.cancel();
  return narrationEnabled;
}
export function isNarrationEnabled() { return narrationEnabled; }

export function speakText(text) {
  if (!narrationEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'pt-BR';
  u.rate = 0.85;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

/**
 * Render a drag-to-order mini-game for cards with tipo 'ordenar'.
 * @param {Array} items - Items to reorder [{text, id}]
 * @param {Function} onSubmit - callback(orderedIds)
 */
export function renderDragOrderModal(items, onSubmit) {
  const content = createElement('div', { className: 'drag-order-modal' },
    createElement('h3', {}, 'Organize na ordem certa!'),
    createElement('p', { className: 'drag-hint' }, 'Arraste os itens para ordenar')
  );

  const list = createElement('div', { className: 'drag-order-list' });
  // Shuffle initially
  const shuffled = [...items].sort(() => Math.random() - 0.5);

  shuffled.forEach((item, idx) => {
    const itemEl = createElement('div', {
      className: 'drag-item',
      draggable: 'true',
      dataset: { id: item.id }
    }, `${idx + 1}. ${item.text}`);

    itemEl.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.id);
      itemEl.classList.add('dragging');
    });
    itemEl.addEventListener('dragend', () => itemEl.classList.remove('dragging'));
    itemEl.addEventListener('dragover', e => {
      e.preventDefault();
      const dragging = list.querySelector('.dragging');
      if (dragging && dragging !== itemEl) {
        const rect = itemEl.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          list.insertBefore(dragging, itemEl);
        } else {
          list.insertBefore(dragging, itemEl.nextSibling);
        }
      }
    });

    list.appendChild(itemEl);
  });

  content.appendChild(list);

  const submitBtn = createElement('button', {
    className: 'drag-submit-btn',
    onClick: () => {
      const ordered = [...list.querySelectorAll('.drag-item')].map(el => el.dataset.id);
      closeModal();
      onSubmit(ordered);
    }
  }, '✅ Confirmar');

  content.appendChild(submitBtn);
  showModal(content, { closable: false });
}
