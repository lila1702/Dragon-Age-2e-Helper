import {
    createEmptyTalentBenefits,
    TALENT_DEGREES,
    isTalentDegree,
    type TalentDegree,
} from "./talentos";

export { TALENT_DEGREES as SPECIALIZATION_DEGREES };
export type SpecializationDegree = TalentDegree;
export type SpecializationBenefits = Record<SpecializationDegree, string>;

export interface ArcanaSpecialization {
    id: string;
    name: string;
    benefits: SpecializationBenefits;
}

export function createArcanaSpecializationId(): string {
    return crypto.randomUUID();
}

export function createEmptySpecializationBenefits(): SpecializationBenefits {
    return createEmptyTalentBenefits();
}

export function createEmptyArcanaSpecialization(): ArcanaSpecialization {
    return {
        id: createArcanaSpecializationId(),
        name: "",
        benefits: createEmptySpecializationBenefits(),
    };
}

export function isSpecializationDegree(value: string): value is SpecializationDegree {
    return isTalentDegree(value);
}
