import { ATTRIBUTE_DEFINITIONS } from "./attributeDefinitions";
import { createEmptyHabilidades } from "./habilidades";
import { createEmptyInventory } from "./inventario";

import type { Attribute, CharacterSheet, CombatStats } from "./characterSheet";

const DEFAULT_COMBAT: CombatStats = {
    speed: 10,
    defense: 10,
    armor: 0,
    armorPenalty: 0,
};

function createEmptyAttributes(): Attribute[] {
    return ATTRIBUTE_DEFINITIONS.map((def) => ({
        name: def.name,
        abbreviation: def.abbreviation,
        value: 0,
        focusNames: [],
    }));
}

export function createSheetId(): string {
    return crypto.randomUUID();
}

export function createEmptySheet(tokenId: string): CharacterSheet {
    return {
        id: createSheetId(),
        tokenId,
        name: "",
        historico: "",
        className: "",
        level: 1,
        idade: "",
        sexo: "",
        combatStats: { ...DEFAULT_COMBAT },
        hpCurrent: 10,
        hpMax: 10,
        mpCurrent: 10,
        mpMax: 10,
        attributes: createEmptyAttributes(),
        habilidades: createEmptyHabilidades(),
        talents: [],
        arcanaSpecializations: [],
        spells: [],
        inventory: createEmptyInventory(),
    };
}
