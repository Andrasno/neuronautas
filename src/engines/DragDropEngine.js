/**
 * Drag & Drop engine with mouse + touch support.
 * No external dependencies.
 */
import { createElement } from '../utils/dom.js';

class DragDropEngine {
  #draggedItem = null;
  #dropZones = [];
  #dragGhost = null;   // touch ghost element
  #touchStartX = 0;
  #touchStartY = 0;

  registerDropZone(zoneEl, config) {
    const entry = { el: zoneEl, ...config };
    this.#dropZones.push(entry);
    this.#attachZoneListeners(zoneEl, entry);
  }

  unregisterDropZone(zoneEl) {
    this.#dropZones = this.#dropZones.filter(z => z.el !== zoneEl);
  }

  makeDraggable(itemEl, itemData) {
    itemEl.setAttribute('draggable', 'true');
    itemEl.setAttribute('aria-label', itemData.name || 'item');

    itemEl.addEventListener('dragstart', e => {
      this.#draggedItem = itemData;
      e.dataTransfer.setData('text/plain', itemData.id);
      e.dataTransfer.effectAllowed = 'move';
      itemEl.classList.add('dragging');
    });

    itemEl.addEventListener('dragend', () => {
      itemEl.classList.remove('dragging');
      this.#draggedItem = null;
    });

    // Touch support
    itemEl.addEventListener('touchstart', e => this.#onTouchStart(e, itemEl, itemData), { passive: false });
    itemEl.addEventListener('touchmove', e => this.#onTouchMove(e), { passive: false });
    itemEl.addEventListener('touchend', e => this.#onTouchEnd(e), { passive: false });
  }

  // ─── Touch handlers ───

  #onTouchStart(e, itemEl, itemData) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    this.#draggedItem = itemData;
    this.#touchStartX = touch.clientX;
    this.#touchStartY = touch.clientY;

    // Create ghost
    this.#dragGhost = itemEl.cloneNode(true);
    this.#dragGhost.style.cssText = `
      position: fixed;
      z-index: 999;
      pointer-events: none;
      opacity: 0.85;
      transform: translate(-50%, -50%) scale(1.1);
      width: ${itemEl.offsetWidth}px;
      height: ${itemEl.offsetHeight}px;
    `;
    document.body.appendChild(this.#dragGhost);
    this.#moveGhost(touch.clientX, touch.clientY);
    itemEl.classList.add('dragging');
    itemEl.style.opacity = '0.3';
    e.preventDefault();
  }

  #onTouchMove(e) {
    if (!this.#dragGhost || !this.#draggedItem) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.#moveGhost(touch.clientX, touch.clientY);

    // Highlight drop zone under finger
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    this.#dropZones.forEach(z => z.el.classList.remove('drop-zone--active'));
    if (elUnder) {
      const match = this.#dropZones.find(z => z.el.contains(elUnder));
      if (match) match.el.classList.add('drop-zone--active');
    }
  }

  #onTouchEnd(e) {
    e.preventDefault();
    this.#dropZones.forEach(z => z.el.classList.remove('drop-zone--active'));

    if (this.#dragGhost) {
      this.#dragGhost.remove();
      this.#dragGhost = null;
    }

    if (!this.#draggedItem) return;

    // Restore original element opacity
    const origEl = document.querySelector(`[data-item-id="${this.#draggedItem.id}"]`);
    if (origEl) {
      origEl.classList.remove('dragging');
      origEl.style.opacity = '';
    }

    // Hit-test drop zones at last touch position
    const touch = e.changedTouches[0];
    const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elUnder) {
      for (const zone of this.#dropZones) {
        if (zone.el.contains(elUnder)) {
          zone.onDrop(this.#draggedItem);
          break;
        }
      }
    }

    this.#draggedItem = null;
  }

  #moveGhost(x, y) {
    if (!this.#dragGhost) return;
    this.#dragGhost.style.left = `${x}px`;
    this.#dragGhost.style.top = `${y}px`;
  }

  // ─── Zone listeners ───

  #attachZoneListeners(zoneEl, config) {
    zoneEl.addEventListener('dragover', e => {
      e.preventDefault();
      if (config.accepts ? config.accepts(this.#draggedItem) : true) {
        zoneEl.classList.add('drop-zone--active');
      }
    });

    zoneEl.addEventListener('dragleave', () => {
      zoneEl.classList.remove('drop-zone--active');
    });

    zoneEl.addEventListener('drop', e => {
      e.preventDefault();
      zoneEl.classList.remove('drop-zone--active');
      if (this.#draggedItem && config.onDrop) {
        config.onDrop(this.#draggedItem);
      }
      this.#draggedItem = null;
    });
  }
}

export default DragDropEngine;
