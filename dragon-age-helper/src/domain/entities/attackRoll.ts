import type { RollModifiers } from "./diceRules";

const BASE_ATTRIBUTE_TEST_NOTATION =
    "1d6{Vermelho} + 1d6{Vermelho} + 1d6{Dragão}";

const DAMAGE_NOTATION = /^(\d+)d(\d+)([+-]\d+)?$/i;

function formatFlatModifier(value: number): string {
    const sign = value >= 0 ? "+" : "-";
    return ` ${sign} ${Math.abs(value)}`;
}

export function buildAttackTestDiceNotation(
    attackBonus: number | null,
    situationalModifier = 0
): string {
    const modifierTotal = (attackBonus ?? 0) + situationalModifier;

    if (modifierTotal === 0) {
        return BASE_ATTRIBUTE_TEST_NOTATION;
    }

    return `${BASE_ATTRIBUTE_TEST_NOTATION}${formatFlatModifier(modifierTotal)}`;
}

export function buildAttackRollModifiers(
    attackBonus: number | null,
    situationalModifier = 0
): RollModifiers {
    return {
        attribute: attackBonus ?? 0,
        focus: 0,
        situational: situationalModifier,
    };
}

export function buildDamageDiceNotation(fullDamage: string): string | null {
    return buildDamageRollNotation(fullDamage, 0);
}

export function buildDamageRollNotation(
    fullDamage: string,
    situationalModifier = 0
): string | null {
    const trimmed = fullDamage.trim();
    const match = trimmed.match(DAMAGE_NOTATION);
    if (!match) return null;

    const dice = `${match[1]}d${match[2]}`;
    const baseModifier = match[3] ? Number.parseInt(match[3], 10) : 0;
    const totalModifier = baseModifier + situationalModifier;

    if (totalModifier === 0) return dice;
    return `${dice}${formatFlatModifier(totalModifier)}`;
}

const HALVED_DICE_NOTATION = /^\((.+)\)\s*\/\s*2(?:\s*#.*)?$/i;

export function buildDamageRollNotationForDicePlus(
    fullDamage: string,
    situationalModifier = 0,
    halve = false
): string | null {
    const baseNotation = buildDamageRollNotation(fullDamage, situationalModifier);
    if (!baseNotation) return null;
    if (!halve) return baseNotation;

    return `(${baseNotation}) / 2 # Sem treinamento`;
}

export function computeDamageRawTotal(
    diceValues: number[],
    fullDamage: string,
    situationalModifier = 0
): number {
    const diceSum = diceValues.reduce((sum, value) => sum + value, 0);
    const match = fullDamage.trim().match(DAMAGE_NOTATION);
    const baseModifier = match?.[3] ? Number.parseInt(match[3], 10) : 0;
    return diceSum + baseModifier + situationalModifier;
}

export function parseHalvedDiceNotation(diceNotation: string): {
    innerNotation: string;
    halve: boolean;
} {
    const trimmed = diceNotation.trim();
    const match = trimmed.match(HALVED_DICE_NOTATION);
    if (!match) {
        return { innerNotation: trimmed, halve: false };
    }
    return { innerNotation: match[1].trim(), halve: true };
}

export function halveDamageTotal(total: number): number {
    return Math.floor(total / 2);
}

export interface AttackRollOptions {
    situationalModifier?: number;
}

export interface DamageRollResult {
    diceValues: number[];
    total: number;
    rawTotal: number;
    halved: boolean;
}
