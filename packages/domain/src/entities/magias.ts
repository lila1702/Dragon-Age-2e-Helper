import { getAttributeValue } from "./attackBonus";
import { TALENT_DEGREES, isTalentDegree, type TalentDegree } from "./talentos";

import type { Attribute } from "./characterSheet";

export type SpellDegree = TalentDegree;
export const SPELL_DEGREES = TALENT_DEGREES;

export const SPELL_DEGREE_LABELS: Record<SpellDegree, string> = {
    Novato: "Magias Novatas",
    Experiente: "Magias Experientes",
    Mestre: "Magias Mestre",
};

export interface Spell {
    id: string;
    degree: SpellDegree;
    name: string;
    school: string;
    arcana: string;
    cost: number;
    time: string;
    tn: number;
    test: string;
    description: string;
}

export function createSpellId(): string {
    return crypto.randomUUID();
}

export function createEmptySpell(degree: SpellDegree = "Novato"): Spell {
    return {
        id: createSpellId(),
        degree,
        name: "",
        school: "",
        arcana: "",
        cost: 0,
        time: "",
        tn: 10,
        test: "",
        description: "",
    };
}

export function isSpellDegree(value: string): value is SpellDegree {
    return isTalentDegree(value);
}

export function computeSpellpower(attributes: Attribute[]): number | null {
    const willpower = getAttributeValue(attributes, "VON");
    if (willpower === null) return null;
    return 10 + willpower;
}

export {
    ARCANA_SCHOOLS,
    ARCANAS_BY_SCHOOL,
    getArcanasForSchool,
    isArcanaSchool,
    resolveSchoolForArcana,
} from "./arcanaDefinitions";

export type { ArcanaSchool } from "./arcanaDefinitions";
