export interface Attribute {
    name: string;
    abbreviation: string;
    value: number;
    focus: number;
    activeFocusName?: string;
}

export interface CharacterSheet {
    id: string;
    tokenId?: string;
    name: string;
    className: string;
    level: number;
    hpCurrent: number;
    hpMax: number;
    mpCurrent: number;
    mpMax: number;
    attributes: Attribute[];
}