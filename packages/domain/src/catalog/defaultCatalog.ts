import { ATTRIBUTE_DEFINITIONS } from "../entities/attributeDefinitions";
import { ARCANA_SCHOOLS, ARCANAS_BY_SCHOOL } from "../entities/arcanaDefinitions";
import { WEAPON_GROUP_SUGGESTIONS } from "../entities/weaponGroupDefinitions";
import { TALENT_DEGREES } from "../entities/talentos";
import type { RulesetCatalog } from "./types";

export const DEFAULT_RULESET_ID = "dragon-age-age";

export const DEFAULT_RULESET_CATALOG: RulesetCatalog = {
    rulesetId: DEFAULT_RULESET_ID,
    attributes: ATTRIBUTE_DEFINITIONS.map((attr, index) => ({
        id: `attr-${attr.abbreviation.toLowerCase()}`,
        name: attr.name,
        abbreviation: attr.abbreviation,
        sortOrder: index,
    })),
    schools: ARCANA_SCHOOLS.map((name, index) => ({
        id: `school-${slug(name)}`,
        name,
        sortOrder: index,
    })),
    arcanas: ARCANA_SCHOOLS.flatMap((school) => {
        const schoolId = `school-${slug(school)}`;
        return ARCANAS_BY_SCHOOL[school].map((name, index) => ({
            id: `arcana-${slug(name)}`,
            schoolId,
            name,
            sortOrder: index,
        }));
    }),
    weaponGroups: WEAPON_GROUP_SUGGESTIONS.map((name, index) => ({
        id: `wg-${slug(name)}`,
        name,
        sortOrder: index,
    })),
    degrees: TALENT_DEGREES.map((name, index) => ({
        id: `degree-${slug(name)}`,
        name,
        sortOrder: index,
    })),
};

function slug(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
