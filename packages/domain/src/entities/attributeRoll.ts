import type { Attribute } from "./characterSheet";

export const DEFAULT_FOCUS_BONUS = 2;
export const MAX_FOCUS_BONUS = 4;
export const FOCUS_IMPROVEMENT_LEVEL = 11;

export interface AttributeRollOptions {
    focusName?: string;
    situationalModifier?: number;
}

export interface AttributeRollBreakdown {
    attributeValue: number;
    focusBonus: number;
    situationalModifier: number;
}

export function resolveFocusBonus(attribute: Attribute): number {
    const raw = attribute.focusBonus ?? DEFAULT_FOCUS_BONUS;
    return Math.min(MAX_FOCUS_BONUS, Math.max(DEFAULT_FOCUS_BONUS, raw));
}

export function canImproveFocusBonus(level: number, attribute: Attribute): boolean {
    return level >= FOCUS_IMPROVEMENT_LEVEL && resolveFocusBonus(attribute) < MAX_FOCUS_BONUS;
}

export function canReduceFocusBonus(level: number, attribute: Attribute): boolean {
    return level >= FOCUS_IMPROVEMENT_LEVEL && resolveFocusBonus(attribute) > DEFAULT_FOCUS_BONUS;
}

export function nextFocusBonus(attribute: Attribute): number {
    return Math.min(MAX_FOCUS_BONUS, resolveFocusBonus(attribute) + 1);
}

export function previousFocusBonus(attribute: Attribute): number {
    return Math.max(DEFAULT_FOCUS_BONUS, resolveFocusBonus(attribute) - 1);
}

export function parseSituationalModifiers(input: string): number {
    const trimmed = input.trim();
    if (!trimmed) return 0;

    const tokens = trimmed.match(/[+-]?\d+/g);
    if (!tokens) return 0;

    return tokens.reduce((sum, token) => sum + Number.parseInt(token, 10), 0);
}

export function getAttributeRollBreakdown(
    attribute: Attribute,
    options?: AttributeRollOptions
): AttributeRollBreakdown {
    const isFocusTest = Boolean(options?.focusName);

    return {
        attributeValue: attribute.value,
        focusBonus: isFocusTest ? resolveFocusBonus(attribute) : 0,
        situationalModifier: options?.situationalModifier ?? 0,
    };
}

export function getAttributeRollBonus(
    attribute: Attribute,
    options?: AttributeRollOptions
): number {
    const breakdown = getAttributeRollBreakdown(attribute, options);
    return (
        breakdown.attributeValue + breakdown.focusBonus + breakdown.situationalModifier
    );
}

const BASE_ATTRIBUTE_TEST_NOTATION =
    "1d6{Vermelho} + 1d6{Vermelho} + 1d6{Dragão}";

function formatFlatModifier(value: number): string {
    const sign = value >= 0 ? "+" : "-";
    return ` ${sign} ${Math.abs(value)}`;
}

export function buildAttributeTestDiceNotation(breakdown: AttributeRollBreakdown): string {
    const modifierTotal =
        breakdown.attributeValue + breakdown.focusBonus + breakdown.situationalModifier;

    if (modifierTotal === 0) {
        return BASE_ATTRIBUTE_TEST_NOTATION;
    }

    return `${BASE_ATTRIBUTE_TEST_NOTATION}${formatFlatModifier(modifierTotal)}`;
}
