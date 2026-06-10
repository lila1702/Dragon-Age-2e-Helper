export interface Attribute {
    name: string;
    abbreviation: string;
    value: number;
    isPrimary?: boolean;
    focusBonus?: number;
    activeFocusName?: string;
    focusNames?: string[];
}

export interface CombatStats {
    speed: number;
    defense: number;
    armor: number;
    armorPenalty: number;
}

export interface CharacterSheet {
    id: string;
    tokenId?: string;
    name: string;
    historico?: string;
    className: string;
    level: number;
    idade?: string;
    sexo?: string;
    combatStats?: CombatStats;
    hpCurrent: number;
    hpMax: number;
    mpCurrent: number;
    mpMax: number;
    attributes: Attribute[];
}