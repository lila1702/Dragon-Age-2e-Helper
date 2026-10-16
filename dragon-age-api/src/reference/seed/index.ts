import { ATTRIBUTE_DEFINITIONS } from "./attributes.js";
import { ARCANA_SCHOOLS, ARCANAS_BY_SCHOOL, EXTRA_ARCANAS } from "./arcanas.js";
import { BASE_ITEMS } from "./items.js";
import { MATERIALS } from "./materials.js";
import { QUALITIES } from "./qualities.js";
import { RARITIES } from "./rarities.js";
import { SPELL_CATALOG } from "./spells.js";
import {
    CURRENCY_RULES,
    DEFAULT_MODIFIER_IDS,
    GENERAL_STUNTS,
    SPELL_DEGREE_LABELS,
    TALENT_DEGREES,
} from "./tables.js";
import { WEAPON_GROUP_SUGGESTIONS } from "./weaponGroups.js";

export const REFERENCE_SEED = {
    items: BASE_ITEMS,
    materials: MATERIALS,
    qualities: QUALITIES,
    rarities: RARITIES,
    spells: SPELL_CATALOG,
    attributes: ATTRIBUTE_DEFINITIONS,
    weaponGroups: WEAPON_GROUP_SUGGESTIONS,
    arcanaSchools: ARCANA_SCHOOLS,
    arcanasBySchool: ARCANAS_BY_SCHOOL,
    extraArcanas: EXTRA_ARCANAS,
    spellDegreeLabels: SPELL_DEGREE_LABELS,
    talentDegrees: TALENT_DEGREES,
    currencyRules: CURRENCY_RULES,
    generalStunts: GENERAL_STUNTS,
    defaultModifierIds: DEFAULT_MODIFIER_IDS,
} as const;

export const REFERENCE_COLLECTION = "reference_catalog";
