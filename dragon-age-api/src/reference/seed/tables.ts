/** Tabelas auxiliares úteis na mesa e na extensão. */
export const SPELL_DEGREE_LABELS = {
    Novato: "Magias Novatas",
    Experiente: "Magias Experientes",
    Mestre: "Magias Mestre",
} as const;

export const TALENT_DEGREES = ["Novato", "Experiente", "Mestre"] as const;

export const CURRENCY_RULES = {
    copperPerSilver: 100,
    silverPerGold: 100,
    displayOrder: ["gold", "silver", "copper"],
    labels: { copper: "cobre", silver: "prata", gold: "ouro" },
} as const;

/** Façanhas gerais (custo em PF) — referência rápida. */
export const GENERAL_STUNTS = [
    { id: "ataque-poderoso", name: "Ataque Poderoso", pfCost: 2, effect: "−2 acerto, +3 dano" },
    { id: "ataque-preciso", name: "Ataque Preciso", pfCost: 2, effect: "+2 acerto" },
    { id: "golpe-poderoso", name: "Golpe Poderoso", pfCost: 1, effect: "+2 dano" },
    { id: "derrubar", name: "Derrubar", pfCost: 2, effect: "Alvo cai se falhar teste" },
    { id: "desarmar", name: "Desarmar", pfCost: 2, effect: "Arma sai da mão do alvo" },
] as const;

export const DEFAULT_MODIFIER_IDS = {
    materialId: "aco",
    qualityId: "comum",
    rarityId: "comum",
} as const;
