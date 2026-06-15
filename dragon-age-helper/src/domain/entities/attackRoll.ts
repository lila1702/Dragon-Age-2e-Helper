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
