import type { Attribute } from "./characterSheet";

export const DEFAULT_FOCUS_BONUS = 2;

export interface AttributeRollOptions {
    /** Nome do foco usado na rolagem; aplica o bônus de foco do atributo */
    focusName?: string;
    /** Soma líquida de modificadores situacionais (+2, -1, etc.) */
    situationalModifier?: number;
}

export interface AttributeRollBreakdown {
    attributeValue: number;
    focusBonus: number;
    situationalModifier: number;
}

export function resolveFocusBonus(attribute: Attribute): number {
    return attribute.focusBonus ?? DEFAULT_FOCUS_BONUS;
}

/** Interpreta entradas como "+2, -1", "+1 +2 -3" ou "-2". */
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
