import {
    createEmptyArcanaSpecialization,
    type ArcanaSpecialization,
} from "../entities/especializacoesArcanas";
import {
    createEmptyClassAbility,
    createEmptyHabilidades,
    type ClassAbility,
} from "../entities/habilidades";
import {
    createEmptyInventoryItem,
    type InventoryItem,
} from "../entities/inventario";
import {
    createEmptySpell,
    isSpellDegree,
    type Spell,
    type SpellDegree,
} from "../entities/magias";
import {
    createEmptyTalent,
    createEmptyTalentBenefits,
    isTalentDegree,
    type Talent,
    type TalentBenefits,
} from "../entities/talentos";
import type { CharacterSheet } from "../entities/characterSheet";

export const CATALOG_ENTRY_KINDS = [
    "item",
    "spell",
    "talent",
    "class_ability",
    "class_specialization",
] as const;

export type CatalogEntryKind = (typeof CATALOG_ENTRY_KINDS)[number];

export const CATALOG_ENTRY_KIND_LABELS: Record<CatalogEntryKind, string> = {
    item: "Item",
    spell: "Magia",
    talent: "Talento",
    class_ability: "Habilidade de classe",
    class_specialization: "Especialização",
};

export interface CatalogEntry {
    id: string;
    rulesetId: string;
    kind: CatalogEntryKind;
    name: string;
    summary: string;
    body: Record<string, unknown>;
    classTags: string[];
    requirementTags: string[];
    requirementsText: string;
    sortOrder: number;
}

export function isCatalogEntryKind(value: string): value is CatalogEntryKind {
    return (CATALOG_ENTRY_KINDS as readonly string[]).includes(value);
}

function asString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseBenefits(raw: unknown): TalentBenefits {
    const benefits = createEmptyTalentBenefits();
    if (!raw || typeof raw !== "object") return benefits;
    const record = raw as Record<string, unknown>;
    for (const degree of Object.keys(benefits) as (keyof TalentBenefits)[]) {
        benefits[degree] = asString(record[degree]);
    }
    return benefits;
}

export function catalogEntryToInventoryItem(entry: CatalogEntry): InventoryItem {
    const item = createEmptyInventoryItem();
    const quantityRaw = entry.body.quantity;
    return {
        ...item,
        name: entry.name,
        saleValue: asString(entry.body.saleValue),
        description: asString(entry.body.description, entry.summary),
        quantity:
            quantityRaw === null
                ? null
                : typeof quantityRaw === "number"
                  ? quantityRaw
                  : 1,
    };
}

export function catalogEntryToSpell(entry: CatalogEntry): Spell {
    const degreeRaw = asString(entry.body.degree, "Novato");
    const degree: SpellDegree = isSpellDegree(degreeRaw) ? degreeRaw : "Novato";
    const spell = createEmptySpell(degree);
    return {
        ...spell,
        name: entry.name,
        school: asString(entry.body.school),
        arcana: asString(entry.body.arcana),
        cost: asNumber(entry.body.cost),
        time: asString(entry.body.time),
        tn: asNumber(entry.body.tn, 10),
        test: asString(entry.body.test),
        description: asString(entry.body.description, entry.summary),
    };
}

export function catalogEntryToTalent(entry: CatalogEntry): Talent {
    const talent = createEmptyTalent();
    return {
        ...talent,
        name: entry.name,
        benefits: parseBenefits(entry.body.benefits),
    };
}

export function catalogEntryToClassAbility(entry: CatalogEntry): ClassAbility {
    const ability = createEmptyClassAbility();
    return {
        ...ability,
        name: entry.name,
        description: asString(entry.body.description, entry.summary),
    };
}

export function catalogEntryToSpecialization(entry: CatalogEntry): ArcanaSpecialization {
    const specialization = createEmptyArcanaSpecialization();
    return {
        ...specialization,
        name: entry.name,
        benefits: parseBenefits(entry.body.benefits),
    };
}

export function applyCatalogEntryToSheet(
    sheet: CharacterSheet,
    entry: CatalogEntry
): CharacterSheet {
    switch (entry.kind) {
        case "item": {
            const item = catalogEntryToInventoryItem(entry);
            return {
                ...sheet,
                inventory: {
                    ...sheet.inventory,
                    items: [...sheet.inventory.items, item],
                },
            };
        }
        case "spell":
            return {
                ...sheet,
                spells: [...sheet.spells, catalogEntryToSpell(entry)],
            };
        case "talent":
            return {
                ...sheet,
                talents: [...sheet.talents, catalogEntryToTalent(entry)],
            };
        case "class_ability": {
            const habilidades = sheet.habilidades ?? createEmptyHabilidades();
            return {
                ...sheet,
                habilidades: {
                    ...habilidades,
                    classAbilities: [
                        ...habilidades.classAbilities,
                        catalogEntryToClassAbility(entry),
                    ],
                },
            };
        }
        case "class_specialization":
            return {
                ...sheet,
                arcanaSpecializations: [
                    ...sheet.arcanaSpecializations,
                    catalogEntryToSpecialization(entry),
                ],
            };
        default:
            return sheet;
    }
}

export function defaultCatalogBody(kind: CatalogEntryKind): Record<string, unknown> {
    switch (kind) {
        case "item":
            return { saleValue: "", description: "", quantity: 1 };
        case "spell":
            return {
                degree: "Novato",
                school: "",
                arcana: "",
                cost: 0,
                time: "",
                tn: 10,
                test: "",
                description: "",
            };
        case "talent":
        case "class_specialization":
            return { benefits: createEmptyTalentBenefits() };
        case "class_ability":
            return { description: "" };
    }
}

export function parseTagList(value: string): string[] {
    return value
        .split(/[,;\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean);
}

export { isTalentDegree, isSpellDegree };
