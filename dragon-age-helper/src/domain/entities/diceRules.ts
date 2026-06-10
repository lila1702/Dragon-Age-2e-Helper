export interface RollModifiers {
  attribute: number;
  focus: number;
  situational: number;
}

export interface StuntRollResult {
  diceValues: number[];
  diceTotal: number;
  hasStunts: boolean;
  stuntPoints: number;
  finalResult: number;
  modifiers: RollModifiers;
}

export function calculateDicePlusStunt(
  orderedD6: number[],
  totalValueFromEnvelope: number,
  modifiers: RollModifiers
): StuntRollResult {
  const hasStunts =
    orderedD6[0] === orderedD6[1] ||
    orderedD6[0] === orderedD6[2] ||
    orderedD6[1] === orderedD6[2];

  const stuntDieValue = orderedD6[2] || 0;
  const stuntPoints = hasStunts ? stuntDieValue : 0;

  const diceTotal = orderedD6.reduce((sum, v) => sum + v, 0);

  return {
    diceValues: orderedD6,
    diceTotal,
    hasStunts,
    stuntPoints,
    finalResult: totalValueFromEnvelope,
    modifiers,
  };
}