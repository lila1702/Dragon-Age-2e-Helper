export interface CatalogAttribute {
    id: string;
    name: string;
    abbreviation: string;
    sortOrder: number;
}

export interface CatalogSchool {
    id: string;
    name: string;
    sortOrder: number;
}

export interface CatalogArcana {
    id: string;
    schoolId: string;
    name: string;
    sortOrder: number;
}

export interface CatalogWeaponGroup {
    id: string;
    name: string;
    sortOrder: number;
}

export interface CatalogDegree {
    id: string;
    name: string;
    sortOrder: number;
}

export interface RulesetCatalog {
    rulesetId: string;
    attributes: CatalogAttribute[];
    schools: CatalogSchool[];
    arcanas: CatalogArcana[];
    weaponGroups: CatalogWeaponGroup[];
    degrees: CatalogDegree[];
}
