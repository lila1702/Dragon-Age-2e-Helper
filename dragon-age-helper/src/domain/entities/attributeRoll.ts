import type { Attribute } from "./characterSheet";

export const DEFAULT_FOCUS_BONUS = 2;

export interface AttributeRollOptions {
    /** Nome do foco usado na rolagem; aplica o bônus de foco do atributo */
    focusName?: string;
}

export function resolveFocusBonus(attribute: Attribute): number {
    return attribute.focusBonus ?? DEFAULT_FOCUS_BONUS;
}

export function getAttributeRollBonus(
    attributeValue: number,
    attribute: Attribute,
    options?: AttributeRollOptions
): number {
    if (options?.focusName) {
        return attributeValue + resolveFocusBonus(attribute);
    }
    return attributeValue;
}
