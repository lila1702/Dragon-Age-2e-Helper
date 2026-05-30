import type { DicePlusRollEnvelope } from "./owlbear-dice";

function rollD6(): number {
    return Math.floor(Math.random() * 6) + 1;
}

export function devDiceRoll(): DicePlusRollEnvelope {
    const orderedD6 = [rollD6(), rollD6(), rollD6()];
    return {
        orderedD6,
        totalValue: orderedD6.reduce((sum, value) => sum + value, 0),
    };
}
