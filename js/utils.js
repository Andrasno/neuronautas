/**
 * Utilities: clamping, random, DOM helpers, formatting.
 */

/** Clamp value to [min, max] */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Roll `count` d6 dice, return array of results */
export function rollDice(count = 1) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * 6) + 1);
  }
  return results;
}

/** Format a numeric modifier as "+N" or "-N" */
export function formatModifier(value) {
  if (value >= 0) return `+${value}`;
  return `${value}`;
}

/** Check if value is positive, negative, or zero */
export function modifierSign(value) {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

/** Lightweight DOM element creator */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, val);
    } else if (key.startsWith('on')) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }
  return el;
}

/** Deep clone a plain object via JSON */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** Get pista arrow symbol: "↑" for positive, "↓" for negative, "→" for near-zero */
export function pistaArrow(value) {
  if (value >= 3) return '↑↑';
  if (value >= 1) return '↑';
  if (value <= -3) return '↓↓';
  if (value <= -1) return '↓';
  return '→';
}
