export const TALENT_DEGREES = ["Novato", "Experiente", "Mestre"] as const;

export type TalentDegree = (typeof TALENT_DEGREES)[number];

export type TalentBenefits = Record<TalentDegree, string>;

export interface Talent {
    id: string;
    name: string;
    benefits: TalentBenefits;
}

export function createEmptyTalentBenefits(): TalentBenefits {
    return { Novato: "", Experiente: "", Mestre: "" };
}

export function createTalentId(): string {
    return crypto.randomUUID();
}

export function createEmptyTalent(): Talent {
    return {
        id: createTalentId(),
        name: "",
        benefits: createEmptyTalentBenefits(),
    };
}

export function isTalentDegree(value: string): value is TalentDegree {
    return (TALENT_DEGREES as readonly string[]).includes(value);
}

export function hasAnyTalentContent(talent: Talent): boolean {
    if (talent.name.trim()) return true;
    return TALENT_DEGREES.some((degree) => talent.benefits[degree].trim().length > 0);
}
