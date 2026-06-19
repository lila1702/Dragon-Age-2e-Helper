import { parseNameAndAttribute } from "./attackBonus";
import { normalizeReloadAction } from "./weaponReload";
import { ATTRIBUTE_DEFINITIONS } from "./attributeDefinitions";
import { createEmptyHabilidades, createHabilidadeId } from "./habilidades";
import {
    createArcanaSpecializationId,
    createEmptySpecializationBenefits,
    isSpecializationDegree,
    type ArcanaSpecialization,
    type SpecializationBenefits,
} from "./especializacoesArcanas";
import { isSpellDegree, type Spell } from "./magias";
import {
    createEmptyTalentBenefits,
    isTalentDegree,
    TALENT_DEGREES,
    type Talent,
    type TalentBenefits,
} from "./talentos";
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

function parseTalentBenefits(entry: Record<string, unknown>): TalentBenefits {
    const benefits = createEmptyTalentBenefits();

    if (isRecord(entry.benefits)) {
        for (const degree of TALENT_DEGREES) {
            const value = entry.benefits[degree];
            if (typeof value === "string") {
                benefits[degree] = value;
            }
        }
        return benefits;
    }

    for (const degree of TALENT_DEGREES) {
        const key = degree.toLowerCase();
        if (typeof entry[key] === "string") {
            benefits[degree] = entry[key];
        }
    }

    const degreeRaw = typeof entry.degree === "string" ? entry.degree : "";
    const degree = isTalentDegree(degreeRaw) ? degreeRaw : null;
    const legacyBenefit = typeof entry.benefit === "string" ? entry.benefit : "";

    if (degree && legacyBenefit) {
        benefits[degree] = legacyBenefit;
    }

    return benefits;
}

function mergeTalentRows(existing: Talent, incoming: Talent): Talent {
    const benefits = { ...existing.benefits };

    for (const degree of TALENT_DEGREES) {
        if (incoming.benefits[degree].trim() && !benefits[degree].trim()) {
            benefits[degree] = incoming.benefits[degree];
        }
    }

    return {
        ...existing,
        name: existing.name || incoming.name,
        benefits,
    };
}

function parseTalents(raw: unknown): Talent[] {
    if (!Array.isArray(raw)) return [];

    const byKey = new Map<string, Talent>();
    const order: string[] = [];

    for (const entry of raw) {
        if (!isRecord(entry)) continue;

        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        const benefits = parseTalentBenefits(entry);
        const hasContent =
            name.length > 0 || TALENT_DEGREES.some((degree) => benefits[degree].trim().length > 0);

        if (!hasContent) continue;

        const parsed: Talent = {
            id: parseId(entry.id),
            name,
            benefits,
        };

        const key = name ? name.toLowerCase() : parsed.id;
        const existing = byKey.get(key);

        if (existing) {
            byKey.set(key, mergeTalentRows(existing, parsed));
        } else {
            byKey.set(key, parsed);
            order.push(key);
        }
    }

    return order.map((key) => byKey.get(key)!);
}

function parseSpecializationBenefits(entry: Record<string, unknown>): SpecializationBenefits {
    const benefits = createEmptySpecializationBenefits();

    if (isRecord(entry.benefits)) {
        for (const degree of TALENT_DEGREES) {
            const value = entry.benefits[degree];
            if (typeof value === "string") {
                benefits[degree] = value;
            }
        }
        return benefits;
    }

    for (const degree of TALENT_DEGREES) {
        const key = degree.toLowerCase();
        if (typeof entry[key] === "string") {
            benefits[degree] = entry[key];
        }
    }

    const degreeRaw = typeof entry.degree === "string" ? entry.degree : "";
    const degree = isSpecializationDegree(degreeRaw) ? degreeRaw : null;
    const legacyBenefit = typeof entry.benefit === "string" ? entry.benefit : "";

    if (degree && legacyBenefit) {
        benefits[degree] = legacyBenefit;
    }

    return benefits;
}

function mergeSpecializationRows(
    existing: ArcanaSpecialization,
    incoming: ArcanaSpecialization
): ArcanaSpecialization {
    const benefits = { ...existing.benefits };

    for (const degree of TALENT_DEGREES) {
        if (incoming.benefits[degree].trim() && !benefits[degree].trim()) {
            benefits[degree] = incoming.benefits[degree];
        }
    }

    return {
        ...existing,
        name: existing.name || incoming.name,
        benefits,
    };
}

function parseArcanaSpecializations(raw: unknown): ArcanaSpecialization[] {
    if (!Array.isArray(raw)) return [];

    const byKey = new Map<string, ArcanaSpecialization>();
    const order: string[] = [];

    for (const entry of raw) {
        if (!isRecord(entry)) continue;

        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        const benefits = parseSpecializationBenefits(entry);
        const hasContent =
            name.length > 0 ||
            TALENT_DEGREES.some((degree) => benefits[degree].trim().length > 0);

        if (!hasContent) continue;

        const parsed: ArcanaSpecialization = {
            id: parseId(entry.id),
            name,
            benefits,
        };

        const key = name ? name.toLowerCase() : parsed.id;
        const existing = byKey.get(key);

        if (existing) {
            byKey.set(key, mergeSpecializationRows(existing, parsed));
        } else {
            byKey.set(key, parsed);
            order.push(key);
        }
    }

    return order.map((key) => byKey.get(key)!);
}

function legacySpecializationFromSpell(entry: Record<string, unknown>): string {
    return typeof entry.specialization === "string" ? entry.specialization.trim() : "";
}

function mergeLegacySpellSpecializations(
    specializations: ArcanaSpecialization[],
    spellsRaw: unknown
): ArcanaSpecialization[] {
    if (!Array.isArray(spellsRaw)) return specializations;

    const knownNames = new Set(specializations.map((entry) => entry.name.toLowerCase()));
    const merged = [...specializations];

    for (const entry of spellsRaw) {
        if (!isRecord(entry)) continue;

        const legacyName = legacySpecializationFromSpell(entry);
        if (!legacyName) continue;

        const key = legacyName.toLowerCase();
        if (knownNames.has(key)) continue;

        knownNames.add(key);
        merged.push({
            id: createArcanaSpecializationId(),
            name: legacyName,
            benefits: createEmptySpecializationBenefits(),
        });
    }

    return merged;
}

function parseSpells(raw: unknown): Spell[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .map((entry) => {
            if (!isRecord(entry)) return null;

            const name = typeof entry.name === "string" ? entry.name.trim() : "";
            if (!name) return null;

            const cost =
                typeof entry.cost === "number" && Number.isFinite(entry.cost) ? entry.cost : 0;
            const tn = typeof entry.tn === "number" && Number.isFinite(entry.tn) ? entry.tn : 10;

            const school = typeof entry.school === "string" ? entry.school.trim() : "";
            const arcanaRaw = typeof entry.arcana === "string" ? entry.arcana.trim() : "";
            const legacySpecialization = legacySpecializationFromSpell(entry);
            const arcana =
                arcanaRaw ||
                (legacySpecialization && !school ? legacySpecialization : "");

            const degreeRaw = typeof entry.degree === "string" ? entry.degree : "Novato";
            const degree = isSpellDegree(degreeRaw) ? degreeRaw : "Novato";

            return {
                id: parseId(entry.id),
                degree,
                name,
                school,
                arcana,
                cost,
                time: typeof entry.time === "string" ? entry.time : "",
                tn,
                test: typeof entry.test === "string" ? entry.test : "",
                description: typeof entry.description === "string" ? entry.description : "",
            };
        })
        .filter((entry): entry is Spell => entry !== null);
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
        talents: parseTalents(data.talents),
        arcanaSpecializations: mergeLegacySpellSpecializations(
            parseArcanaSpecializations(data.arcanaSpecializations),
            data.spells
        ),
        spells: parseSpells(data.spells),
    };
}
