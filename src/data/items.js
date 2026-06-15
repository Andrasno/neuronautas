/**
 * Item catalog for the game.
 * Each item has: id, name, emoji, type, color, biasPhase
 * - biasPhase: 1 = appears in original collection (all red fruits)
 * - biasPhase: 2 = appears in retraining (diverse colors)
 * - biasPhase: null = always available (distractors)
 */
export const ITEMS = [
  // Fruits — phase 1 bias (ALL RED)
  { id: "maca",     name: "Maçã",     emoji: "🍎", type: "fruta",    color: "vermelho", biasPhase: 1 },
  { id: "morango",  name: "Morango",  emoji: "🍓", type: "fruta",    color: "vermelho", biasPhase: 1 },
  { id: "cereja",   name: "Cereja",   emoji: "🍒", type: "fruta",    color: "vermelho", biasPhase: 1 },

  // Fruits — phase 2 retraining (DIVERSE COLORS)
  { id: "banana",   name: "Banana",   emoji: "🍌", type: "fruta",    color: "amarelo",  biasPhase: 2 },
  { id: "uva",      name: "Uva",      emoji: "🍇", type: "fruta",    color: "roxo",     biasPhase: 2 },
  { id: "laranja",  name: "Laranja",  emoji: "🍊", type: "fruta",    color: "laranja",  biasPhase: 2 },
  { id: "melancia", name: "Melancia", emoji: "🍉", type: "fruta",    color: "verde",    biasPhase: 2 },
  { id: "kiwi",     name: "Kiwi",     emoji: "🥝", type: "fruta",    color: "marrom",   biasPhase: 2 },

  // Distractors
  { id: "caminhao", name: "Caminhão", emoji: "🚛", type: "brinquedo", color: "vermelho", biasPhase: null },
  { id: "urso",     name: "Urso",     emoji: "🧸", type: "brinquedo", color: "marrom",   biasPhase: null },
  { id: "bola",     name: "Bola",     emoji: "⚽", type: "brinquedo", color: "preto",    biasPhase: null },
  { id: "tesoura",  name: "Tesoura",  emoji: "✂️", type: "objeto",   color: "cinza",    biasPhase: null },
  { id: "lapis",    name: "Lápis",    emoji: "✏️", type: "objeto",   color: "amarelo",  biasPhase: null },
];

/** Get items available for a given bias phase */
export function getItemsForPhase(phase) {
  if (phase === 1) {
    return ITEMS.filter(i => i.biasPhase === 1 || i.biasPhase === null);
  }
  return ITEMS.filter(i => i.biasPhase === 2 || i.biasPhase === null || i.biasPhase === 1);
}
