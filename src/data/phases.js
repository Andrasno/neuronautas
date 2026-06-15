/**
 * Phase configuration. Defines rules and dialogue for each game phase.
 */
export const PHASES = {
  collection_1: {
    id: "collection_1",
    instruction: "Me ensine o que é uma FRUTA! Arraste as frutas para minha memória.",
    targetType: "fruta",
    biasPhase: 1,
    minCorrectToProceed: 3,
    biasTestItem: "banana",
    biasExpectedError: "color",
    neuroPetDialogue: {
      start: "Me ensine o que é uma FRUTA! Arraste as frutas para minha memória.",
      itemDropped_correct: "Isso! É uma fruta!",
      itemDropped_wrong: "Hmm... isso não parece uma fruta.",
      complete: "Aprendi! Agora sei o que é fruta!"
    }
  },
  collection_2: {
    id: "collection_2",
    instruction: "Mostre para o NeuroPet TODAS as frutas! Ele precisa ver frutas de todas as cores!",
    targetType: "fruta",
    biasPhase: 2,
    minFruitColors: 2,
    minFruitCount: 4,
    neuroPetDialogue: {
      start: "Me ajude a aprender de novo! Quais são as frutas DE VERDADE?",
      itemDropped_correct: "Ah! Então fruta também pode ser dessa cor!",
      itemDropped_wrong: "Isso não é fruta...",
      complete: "Agora eu entendi! Frutas podem ser de muitas cores!"
    }
  }
};
