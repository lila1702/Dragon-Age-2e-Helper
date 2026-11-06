export const ARCANA_SCHOOLS = ["Criação", "Entropia", "Primal", "Espírito"] as const;

export type ArcanaSchool = (typeof ARCANA_SCHOOLS)[number];

export const ARCANAS_BY_SCHOOL: Record<ArcanaSchool, readonly string[]> = {
    Criação: [
        "Arcana da Besta",
        "Arcana da Cura",
        "Arcana do Herói",
        "Arcana da Madeira",
    ],
    Entropia: [
        "Arcana da Morte",
        "Arcana do Destino",
        "Arcana da Mente",
        "Arcana da Sombra",
    ],
    Primal: [
        "Arcana do Ar",
        "Arcana do Gelo",
        "Arcana do Fogo",
        "Arcana do Raio",
        "Arcana da Água",
    ],
    Espírito: [
        "Arcana da Divinação",
        "Arcana do Encantamento",
        "Arcana da Ilusão",
        "Arcana do Poder",
        "Arcana da Proteção",
    ],
};

export function isArcanaSchool(value: string): value is ArcanaSchool {
    return (ARCANA_SCHOOLS as readonly string[]).includes(value);
}

export function getArcanasForSchool(school: string): readonly string[] {
    if (!isArcanaSchool(school)) return [];
    return ARCANAS_BY_SCHOOL[school];
}

export function resolveSchoolForArcana(arcana: string): ArcanaSchool | "" {
    const trimmed = arcana.trim();
    if (!trimmed) return "";

    for (const school of ARCANA_SCHOOLS) {
        if ((ARCANAS_BY_SCHOOL[school] as readonly string[]).includes(trimmed)) {
            return school;
        }
    }

    return "";
}
