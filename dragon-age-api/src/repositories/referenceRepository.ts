import { REFERENCE_COLLECTION, REFERENCE_SEED } from "../reference/seed/index.js";
import type {
    BaseItem,
    Material,
    Quality,
    Rarity,
    SpellCatalogEntry,
} from "../schemas/reference.js";
import { getDb } from "../db/mongo.js";

interface ReferenceCatalogDocument {
    _id: "catalog";
    version: number;
    items: BaseItem[];
    materials: Material[];
    qualities: Quality[];
    rarities: Rarity[];
    spells: SpellCatalogEntry[];
    attributes: typeof REFERENCE_SEED.attributes;
    weaponGroups: typeof REFERENCE_SEED.weaponGroups;
    arcanaSchools: typeof REFERENCE_SEED.arcanaSchools;
    arcanasBySchool: typeof REFERENCE_SEED.arcanasBySchool;
    extraArcanas: typeof REFERENCE_SEED.extraArcanas;
    spellDegreeLabels: typeof REFERENCE_SEED.spellDegreeLabels;
    talentDegrees: typeof REFERENCE_SEED.talentDegrees;
    currencyRules: typeof REFERENCE_SEED.currencyRules;
    generalStunts: typeof REFERENCE_SEED.generalStunts;
    defaultModifierIds: typeof REFERENCE_SEED.defaultModifierIds;
    updatedAt: Date;
}

const CATALOG_VERSION = 1;

let cachedCatalog: ReferenceCatalogDocument | null = null;

async function loadCatalogFromDb(): Promise<ReferenceCatalogDocument | null> {
    const doc = await getDb()
        .collection<ReferenceCatalogDocument>(REFERENCE_COLLECTION)
        .findOne({ _id: "catalog" });
    return doc ?? null;
}

export async function ensureReferenceCatalogSeeded(): Promise<ReferenceCatalogDocument> {
    if (cachedCatalog) return cachedCatalog;

    const existing = await loadCatalogFromDb();
    if (existing) {
        cachedCatalog = existing;
        return existing;
    }

    const now = new Date();
    const catalog: ReferenceCatalogDocument = {
        _id: "catalog",
        version: CATALOG_VERSION,
        items: [...REFERENCE_SEED.items],
        materials: [...REFERENCE_SEED.materials],
        qualities: [...REFERENCE_SEED.qualities],
        rarities: [...REFERENCE_SEED.rarities],
        spells: [...REFERENCE_SEED.spells],
        attributes: REFERENCE_SEED.attributes,
        weaponGroups: REFERENCE_SEED.weaponGroups,
        arcanaSchools: REFERENCE_SEED.arcanaSchools,
        arcanasBySchool: REFERENCE_SEED.arcanasBySchool,
        extraArcanas: REFERENCE_SEED.extraArcanas,
        spellDegreeLabels: REFERENCE_SEED.spellDegreeLabels,
        talentDegrees: REFERENCE_SEED.talentDegrees,
        currencyRules: REFERENCE_SEED.currencyRules,
        generalStunts: REFERENCE_SEED.generalStunts,
        defaultModifierIds: REFERENCE_SEED.defaultModifierIds,
        updatedAt: now,
    };

    await getDb()
        .collection<ReferenceCatalogDocument>(REFERENCE_COLLECTION)
        .replaceOne({ _id: "catalog" }, catalog, { upsert: true });
    cachedCatalog = catalog;
    return catalog;
}

export async function getReferenceCatalog(): Promise<ReferenceCatalogDocument> {
    return ensureReferenceCatalogSeeded();
}

export async function listItems(filter?: {
    category?: string;
    weaponGroup?: string;
    tag?: string;
}): Promise<BaseItem[]> {
    const catalog = await getReferenceCatalog();
    return catalog.items.filter((item) => {
        if (filter?.category && item.category !== filter.category) return false;
        if (filter?.weaponGroup && item.weaponGroup !== filter.weaponGroup) return false;
        if (filter?.tag && !item.tags.includes(filter.tag)) return false;
        return true;
    });
}

export async function getItemById(id: string): Promise<BaseItem | null> {
    const catalog = await getReferenceCatalog();
    return catalog.items.find((item) => item.id === id) ?? null;
}

export async function getMaterialById(id: string): Promise<Material | null> {
    const catalog = await getReferenceCatalog();
    return catalog.materials.find((entry) => entry.id === id) ?? null;
}

export async function getQualityById(id: string): Promise<Quality | null> {
    const catalog = await getReferenceCatalog();
    return catalog.qualities.find((entry) => entry.id === id) ?? null;
}

export async function getRarityById(id: string): Promise<Rarity | null> {
    const catalog = await getReferenceCatalog();
    return catalog.rarities.find((entry) => entry.id === id) ?? null;
}

export async function listSpells(filter?: {
    school?: string;
    arcana?: string;
    degree?: string;
    q?: string;
}): Promise<SpellCatalogEntry[]> {
    const catalog = await getReferenceCatalog();
    const query = filter?.q?.trim().toLowerCase();

    return catalog.spells.filter((spell) => {
        if (filter?.school && spell.school !== filter.school) return false;
        if (filter?.arcana && spell.arcana !== filter.arcana) return false;
        if (filter?.degree && spell.degree !== filter.degree) return false;
        if (query) {
            const haystack = `${spell.name} ${spell.description} ${spell.arcana}`.toLowerCase();
            if (!haystack.includes(query)) return false;
        }
        return true;
    });
}

export async function getSpellById(id: string): Promise<SpellCatalogEntry | null> {
    const catalog = await getReferenceCatalog();
    return catalog.spells.find((spell) => spell.id === id) ?? null;
}
