import { resolveFocusBonus } from "./attributeRoll";

import type { Attribute } from "./characterSheet";

const UNTRAINED_ATTACK_PENALTY = 2;

const DICE_WITH_FLAT_MODIFIER = /^(\d+d\d+)([+-]\d+)?$/i;

export function getAttributeValue(
    attributes: Attribute[],
    abbreviation: string
): number | null {
    const abbr = abbreviation.trim().toUpperCase();
    if (!abbr) return null;

    const attribute = attributes.find(
        (entry) => entry.abbreviation.toUpperCase() === abbr
    );
    return attribute?.value ?? null;
}

function normalizeLabel(value: string): string {
    return value.trim().toLocaleLowerCase("pt-BR");
}

export function parseWeaponGroups(weaponGroups: string): string[] {
    return weaponGroups
        .split(/[;,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
}

export function isWeaponGroupTrained(
    weaponGroup: string,
    characterWeaponGroups: string
): boolean {
    const group = weaponGroup.trim();
    if (!group) return true;

    const normalizedGroup = normalizeLabel(group);
    return parseWeaponGroups(characterWeaponGroups).some(
        (trainedGroup) => normalizeLabel(trainedGroup) === normalizedGroup
    );
}

export function isAttackUntrained(
    weaponGroup: string | undefined,
    characterWeaponGroups: string
): boolean {
    const group = weaponGroup?.trim();
    if (!group) return false;

    return !isWeaponGroupTrained(group, characterWeaponGroups);
}

export function hasWeaponFocus(
    attributes: Attribute[],
    attackAttributeAbbreviation: string,
    weaponGroup: string
): boolean {
    const group = weaponGroup.trim();
    if (!group) return false;

    const attackAttr = attackAttributeAbbreviation.trim().toUpperCase();
    if (!attackAttr) return false;

    const attribute = attributes.find(
        (entry) => entry.abbreviation.toUpperCase() === attackAttr
    );
    if (!attribute) return false;

    const normalizedGroup = normalizeLabel(group);
    return (attribute.focusNames ?? []).some(
        (focusName) => normalizeLabel(focusName) === normalizedGroup
    );
}

export function computeAttackBonus(
    attributes: Attribute[],
    attributeAbbreviation: string,
    untrained: boolean,
    weaponGroup?: string
): number | null {
    const base = getAttributeValue(attributes, attributeAbbreviation);
    if (base === null) return null;

    let total = untrained ? base - UNTRAINED_ATTACK_PENALTY : base;

    if (hasWeaponFocus(attributes, attributeAbbreviation, weaponGroup ?? "")) {
        const attribute = attributes.find(
            (entry) =>
                entry.abbreviation.toUpperCase() ===
                attributeAbbreviation.trim().toUpperCase()
        );
        if (attribute) {
            total += resolveFocusBonus(attribute);
        }
    }

    return total;
}

export function formatAttackBonus(value: number | null): string {
    if (value === null) return "—";
    if (value > 0) return `+${value}`;
    return String(value);
}

export interface DamageCalculationOptions {
    attributes: Attribute[];
    attackAttributeAbbreviation: string;
    damageAttributeAbbreviation?: string;
    lutUsesWillpowerForDamage?: boolean;
}

export function resolveDamageAttributeAbbreviation(
    options: DamageCalculationOptions
): string {
    const override = options.damageAttributeAbbreviation?.trim().toUpperCase();
    if (override) return override;

    const attackAttr = options.attackAttributeAbbreviation.trim().toUpperCase();
    if (attackAttr === "PRE") return "PER";
    if (attackAttr === "LUT") {
        return options.lutUsesWillpowerForDamage ? "VON" : "FOR";
    }

    return "";
}

export function appendAttributeModifier(
    baseDamage: string,
    attributeValue: number
): string {
    const trimmed = baseDamage.trim();
    if (!trimmed) return trimmed;

    const match = trimmed.match(DICE_WITH_FLAT_MODIFIER);
    if (match) {
        const dice = match[1];
        const existingFlat = match[2] ? Number.parseInt(match[2], 10) : 0;
        const totalFlat = existingFlat + attributeValue;

        if (totalFlat === 0) return dice;
        if (totalFlat > 0) return `${dice}+${totalFlat}`;
        return `${dice}${totalFlat}`;
    }

    if (attributeValue === 0) return trimmed;
    if (attributeValue > 0) return `${trimmed}+${attributeValue}`;
    return `${trimmed}${attributeValue}`;
}

export function computeDamageWithAttribute(
    baseDamage: string,
    options: DamageCalculationOptions
): string {
    const trimmed = baseDamage.trim();
    if (!trimmed) return "";

    const damageAttr = resolveDamageAttributeAbbreviation(options);
    if (!damageAttr) return trimmed;

    const modifier = getAttributeValue(options.attributes, damageAttr);
    if (modifier === null) return trimmed;

    return appendAttributeModifier(trimmed, modifier);
}

export function formatEffectiveDamage(
    fullDamage: string,
    untrained: boolean
): string | null {
    const trimmed = fullDamage.trim();
    if (!trimmed || !untrained) return null;
    return `${trimmed}/2`;
}

export function parseNameAndAttribute(name: string): {
    name: string;
    attributeAbbreviation: string;
} {
    const match = name.match(/^(.+?)\s*\(([A-Za-z]{3})\)\s*$/);
    if (!match) {
        return { name: name.trim(), attributeAbbreviation: "" };
    }

    return {
        name: match[1].trim(),
        attributeAbbreviation: match[2].toUpperCase(),
    };
}
