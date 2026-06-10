import { ATTRIBUTE_DEFINITIONS } from "./attributeDefinitions";
import { createSheetId } from "./createEmptySheet";

import type { Attribute, CharacterSheet, CombatStats } from "./characterSheet";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeAttributes(raw: unknown): Attribute[] {
    const byAbbr = new Map<string, Partial<Attribute>>();

    if (Array.isArray(raw)) {
        for (const entry of raw) {
            if (!isRecord(entry)) continue;
            const abbr = typeof entry.abbreviation === "string" ? entry.abbreviation : "";
            if (abbr) byAbbr.set(abbr.toUpperCase(), entry as Partial<Attribute>);
        }
    }

    return ATTRIBUTE_DEFINITIONS.map((def) => {
        const saved = byAbbr.get(def.abbreviation);
        const value =
            typeof saved?.value === "number" && Number.isFinite(saved.value) ? saved.value : 0;

        return {
            name: def.name,
            abbreviation: def.abbreviation,
            value,
            isPrimary: saved?.isPrimary === true,
            focusBonus:
                typeof saved?.focusBonus === "number" && Number.isFinite(saved.focusBonus)
                    ? saved.focusBonus
                    : undefined,
            focusNames: Array.isArray(saved?.focusNames)
                ? saved.focusNames.filter((n): n is string => typeof n === "string")
                : [],
        };
    });
}

function parseCombatStats(raw: unknown): CombatStats {
    const base: CombatStats = { speed: 10, defense: 10, armor: 0, armorPenalty: 0 };
    if (!isRecord(raw)) return base;

    return {
        speed: typeof raw.speed === "number" ? raw.speed : base.speed,
        defense: typeof raw.defense === "number" ? raw.defense : base.defense,
        armor: typeof raw.armor === "number" ? raw.armor : base.armor,
        armorPenalty: typeof raw.armorPenalty === "number" ? raw.armorPenalty : base.armorPenalty,
    };
}

function parseNumber(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeCharacterSheet(data: unknown, tokenId: string): CharacterSheet | null {
    if (!isRecord(data)) return null;

    const hpMax = parseNumber(data.hpMax, 10);
    const mpMax = parseNumber(data.mpMax, 10);

    return {
        id: typeof data.id === "string" && data.id.length > 0 ? data.id : createSheetId(),
        tokenId,
        name: typeof data.name === "string" ? data.name : "",
        historico: typeof data.historico === "string" ? data.historico : "",
        className: typeof data.className === "string" ? data.className : "",
        level: Math.max(1, parseNumber(data.level, 1)),
        idade: typeof data.idade === "string" ? data.idade : "",
        sexo: typeof data.sexo === "string" ? data.sexo : "",
        combatStats: parseCombatStats(data.combatStats),
        hpMax,
        hpCurrent: Math.min(parseNumber(data.hpCurrent, hpMax), hpMax),
        mpMax,
        mpCurrent: Math.min(parseNumber(data.mpCurrent, mpMax), mpMax),
        attributes: mergeAttributes(data.attributes),
    };
}
