import type { Quality } from "../../schemas/reference.js";

export const QUALITIES: Quality[] = [
    {
        id: "rudimentar",
        name: "Rudimentar",
        description: "Fabricação apressada ou desgaste severo.",
        priceMultiplier: 0.5,
        damageMultiplier: 0.85,
        damageFlatBonus: -1,
    },
    {
        id: "comum",
        name: "Comum",
        description: "Qualidade típica de mercado.",
        priceMultiplier: 1,
        damageMultiplier: 1,
        damageFlatBonus: 0,
    },
    {
        id: "trabalhada",
        name: "Trabalhada",
        description: "Bom acabamento; confiável.",
        priceMultiplier: 1.25,
        damageMultiplier: 1,
        damageFlatBonus: 0,
    },
    {
        id: "superior",
        name: "Superior",
        description: "Forjada por artífice competente.",
        priceMultiplier: 1.6,
        damageMultiplier: 1.05,
        damageFlatBonus: 1,
    },
    {
        id: "mestre",
        name: "Obra de Mestre",
        description: "Peça excepcional; poucas existem.",
        priceMultiplier: 2.25,
        damageMultiplier: 1.1,
        damageFlatBonus: 2,
    },
];
