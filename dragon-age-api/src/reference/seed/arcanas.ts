/** Espelha `arcanaDefinitions.ts` do helper. */
export const ARCANA_SCHOOLS = ["Criação", "Entropia", "Primal", "Espírito"] as const;

export const ARCANAS_BY_SCHOOL: Record<(typeof ARCANA_SCHOOLS)[number], readonly string[]> = {
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

/** Homebrew comum na campanha (ex.: Nohmei). */
export const EXTRA_ARCANAS = ["Arcana de Sangue"] as const;
