import { parseNameAndAttribute } from "./attackBonus";
import { normalizeReloadAction } from "./weaponReload";
import { ATTRIBUTE_DEFINITIONS } from "./attributeDefinitions";
import {
    createEmptyHabilidades,
    createHabilidadeId,
} from "./habilidades";
import { createSheetId } from "./createEmptySheet";

import type {
    ClassAbility,
    Habilidades,
    MeleeAttack,
    RangedAttack,
} from "./habilidades";
import type { Attribute, CharacterSheet, CombatStats } from "./characterSheet";

/** @deprecated Legacy shape kept for migration from older saves. */
interface LegacyCharacterAbility {
    id: string;
    name: string;
    type?: string;
    attackBonus: number;
    damage: string;
    reload?: string;
    description?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseId(value: unknown): string {
    return typeof value === "string" && value.length > 0 ? value : createHabilidadeId();
}

function parseAttributeAbbreviation(value: unknown): string {
    if (typeof value !== "string") return "";
    const abbr = value.trim().toUpperCase();
    if (!abbr) return "";
    return ATTRIBUTE_DEFINITIONS.some((def) => def.abbreviation === abbr) ? abbr : "";
}

function parseMeleeAttacks(raw: unknown): MeleeAttack[] {
    if (!Array.isArray(raw)) return [];

    const attacks: MeleeAttack[] = [];
    for (const entry of raw) {
        if (!isRecord(entry)) continue;

        const rawName = typeof entry.name === "string" ? entry.name.trim() : "";
        if (!rawName) continue;

        const parsedAttribute = parseAttributeAbbreviation(entry.attributeAbbreviation);
        const fromName = parseNameAndAttribute(rawName);

        attacks.push({
            id: parseId(entry.id),
            name: parsedAttribute ? fromName.name || rawName : fromName.name || rawName,
            attributeAbbreviation: parsedAttribute || fromName.attributeAbbreviation,
            damageAttributeAbbreviation: parseAttributeAbbreviation(
                entry.damageAttributeAbbreviation
            ),
            weaponGroup: typeof entry.weaponGroup === "string" ? entry.weaponGroup.trim() : "",
            damage: typeof entry.damage === "string" ? entry.damage : "",
        });
    }
    return attacks;
}

function parseRangedAttacks(raw: unknown): RangedAttack[] {
    if (!Array.isArray(raw)) return [];

    const attacks: RangedAttack[] = [];
    for (const entry of raw) {
        if (!isRecord(entry)) continue;

        const rawName = typeof entry.name === "string" ? entry.name.trim() : "";
        if (!rawName) continue;

        const parsedAttribute = parseAttributeAbbreviation(entry.attributeAbbreviation);
        const fromName = parseNameAndAttribute(rawName);

        attacks.push({
            id: parseId(entry.id),
            name: parsedAttribute ? fromName.name || rawName : fromName.name || rawName,
            attributeAbbreviation: parsedAttribute || fromName.attributeAbbreviation,
            damageAttributeAbbreviation: parseAttributeAbbreviation(
                entry.damageAttributeAbbreviation
            ),
            weaponGroup: typeof entry.weaponGroup === "string" ? entry.weaponGroup.trim() : "",
            damage: typeof entry.damage === "string" ? entry.damage : "",
            shortRange: typeof entry.shortRange === "string" ? entry.shortRange : undefined,
            longRange: typeof entry.longRange === "string" ? entry.longRange : undefined,
            reload: normalizeReloadAction(
                typeof entry.reload === "string" ? entry.reload : undefined
            ) || undefined,
        });
    }
    return attacks;
}

function parseClassAbilities(raw: unknown): ClassAbility[] {
    if (!Array.isArray(raw)) return [];

    const abilities: ClassAbility[] = [];
    for (const entry of raw) {
        if (!isRecord(entry)) continue;
        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        if (!name) continue;

        abilities.push({
            id: parseId(entry.id),
            name,
            description: typeof entry.description === "string" ? entry.description : "",
        });
    }
    return abilities;
}

function migrateLegacyAbilities(raw: unknown): Habilidades {
    const result = createEmptyHabilidades();
    if (!Array.isArray(raw)) return result;

    for (const entry of raw) {
        if (!isRecord(entry)) continue;
        const legacy = entry as unknown as LegacyCharacterAbility;
        const name = typeof legacy.name === "string" ? legacy.name.trim() : "";
        if (!name) continue;

        const id = parseId(legacy.id);
        const type = typeof legacy.type === "string" ? legacy.type : "Melee";
        const hasAttack = Boolean(legacy.damage?.trim());

        if (type === "Other" || (!hasAttack && legacy.description)) {
            result.classAbilities.push({
                id,
                name,
                description: legacy.description ?? "",
            });
            continue;
        }

        if (type === "Melee") {
            const parsed = parseNameAndAttribute(name);
            result.meleeAttacks.push({
                id,
                name: parsed.name,
                attributeAbbreviation: parsed.attributeAbbreviation,
                damage: legacy.damage ?? "",
            });
            continue;
        }

        const parsed = parseNameAndAttribute(name);
        result.rangedAttacks.push({
            id,
            name: parsed.name,
            attributeAbbreviation: parsed.attributeAbbreviation,
            damage: legacy.damage ?? "",
            reload: legacy.reload,
        });
    }

    return result;
}

function parseHabilidades(data: Record<string, unknown>): Habilidades {
    if (isRecord(data.habilidades)) {
        const raw = data.habilidades;
        return {
            meleeAttacks: parseMeleeAttacks(raw.meleeAttacks),
            rangedAttacks: parseRangedAttacks(raw.rangedAttacks),
            weaponGroups: typeof raw.weaponGroups === "string" ? raw.weaponGroups : "",
            lutUsesWillpowerForDamage: raw.lutUsesWillpowerForDamage === true,
            arcaneWarriorOptionEnabled: raw.arcaneWarriorOptionEnabled === true,
            classAbilities: parseClassAbilities(raw.classAbilities),
        };
    }

    if (Array.isArray(data.abilities)) {
        return migrateLegacyAbilities(data.abilities);
    }

    return createEmptyHabilidades();
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
        habilidades: parseHabilidades(data),
    };
}
