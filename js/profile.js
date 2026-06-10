/**
 * Profile definitions and rule queries for age-based profiles.
 */

export const PROFILE_KEYS = {
  EXPLORADOR: 'explorador',
  NAVEGANTE: 'navegante'
};

export const PLANETS = [
  { id: 1, key: 'criatividade', name: 'Criatividade', color: '#a8e600', theme: 'Pensamento divergente, invenção' },
  { id: 2, key: 'etica', name: 'Ética', color: '#5bc0de', theme: 'Certo vs errado, empatia' },
  { id: 3, key: 'seguranca', name: 'Segurança', color: '#f0ad4e', theme: 'Dados pessoais, privacidade' },
  { id: 4, key: 'pressa', name: 'Pressa', color: '#d9534f', theme: 'Tomada de decisão rápida' },
  { id: 5, key: 'confusoes', name: 'Confusões', color: '#9370db', theme: 'Perguntas contraditórias ou impossíveis' }
];

export const ATTRIBUTES = {
  faiscas: { name: 'Faíscas', icon: '⚡', color: '#f0c040', label: 'Criatividade' },
  brilho: { name: 'Brilho', icon: '✨', color: '#5bc0de', label: 'Confiança' },
  escudo: { name: 'Escudo', icon: '🛡️', color: '#5cb85c', label: 'Segurança' }
};

export const PROFILES = {
  explorador: {
    key: 'explorador',
    label: 'Explorador',
    ageRange: [6, 8],
    boardSize: 15,
    housesPerPlanet: 3,
    diceCount: 2,
    diceAgency: 'pick-one',     // roll 2, pick 1
    maxRerolls: 0,
    minAttr: 5,                 // attributes never go below 5
    maxPenalty: -5,             // single penalty cap
    modifierDisplay: 'icons-only',
    startingAttr: { faiscas: 60, brilho: 65, escudo: 50 },
    getTilePattern: function () {
      // 3 tiles per planet: Treino, Surpresa, Chefao
      return ['treino', 'surpresa', 'chefao'];
    }
  },
  navegante: {
    key: 'navegante',
    label: 'Navegante',
    ageRange: [9, 11],
    boardSize: 30,
    housesPerPlanet: 6,
    diceCount: 1,
    diceAgency: 'reroll',       // roll 1, reroll up to 3x with stars
    maxRerolls: 3,
    minAttr: 0,                 // attributes can go to 0
    maxPenalty: -15,
    modifierDisplay: 'vague-hint',
    startingAttr: { faiscas: 50, brilho: 60, escudo: 40 },
    getTilePattern: function () {
      // 6 tiles per planet: Treino, Surpresa, Treino, Evolucao, Treino, Chefao
      return ['treino', 'surpresa', 'treino', 'evolucao', 'treino', 'chefao'];
    }
  }
};

/**
 * Get profile object for a given age.
 * Returns null if age is outside supported ranges.
 */
export function getProfileForAge(age) {
  const numAge = Number(age);
  if (isNaN(numAge)) return null;
  if (numAge >= 6 && numAge <= 8) return PROFILES.explorador;
  if (numAge >= 9 && numAge <= 11) return PROFILES.navegante;
  return null;
}

/**
 * Get profile by key ('explorador' | 'navegante').
 */
export function getProfile(key) {
  return PROFILES[key] || null;
}

/**
 * Get the planet object by id (1-5).
 */
export function getPlanet(id) {
  return PLANETS.find(p => p.id === id) || null;
}

/**
 * Get the primary attribute for a planet.
 */
export function getPrimaryAttribute(planetKey) {
  const map = {
    criatividade: 'faiscas',
    etica: 'brilho',
    seguranca: 'escudo',
    pressa: 'faiscas',
    confusoes: 'brilho'
  };
  return map[planetKey] || 'faiscas';
}

/**
 * Get the boss recommended attribute threshold for a profile.
 */
export function getBossThreshold(profileKey) {
  return profileKey === 'explorador' ? 40 : 60;
}
