import type { GenericDiceRollResult } from "./owlbear-dice";

const DAMAGE_NOTATION = /^(\d+)d(\d+)([+-]\d+)?$/i;

function rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
}

function rollD6(): number {
    return rollDie(6);
}

export function devDiceRoll(): { orderedD6: number[]; totalValue: number } {
    const orderedD6 = [rollD6(), rollD6(), rollD6()];
    return {
        orderedD6,
        totalValue: orderedD6.reduce((sum, value) => sum + value, 0),
    };
}

export function devGenericDiceRoll(diceNotation: string): GenericDiceRollResult {
    const trimmed = diceNotation.trim();
    const match = trimmed.match(DAMAGE_NOTATION);
    if (!match) {
        throw new Error(`Notação de dano inválida: ${diceNotation}`);
    }

    const count = Number.parseInt(match[1], 10);
    const sides = Number.parseInt(match[2], 10);
    const modifier = match[3] ? Number.parseInt(match[3], 10) : 0;
    const diceValues = Array.from({ length: count }, () => rollDie(sides));
    const diceTotal = diceValues.reduce((sum, value) => sum + value, 0);

    return {
        diceValues,
        totalValue: diceTotal + modifier,
    };
}
