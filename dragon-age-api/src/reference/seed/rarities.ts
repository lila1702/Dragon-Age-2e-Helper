import type { Rarity } from "../../schemas/reference.js";

/** Raridade de mercado — quanto acima do “preço justo” o item é cotado. */
export const RARITIES: Rarity[] = [
    {
        id: "comum",
        name: "Comum",
        description: "Disponível na maioria das cidades.",
        priceMultiplier: 1,
    },
    {
        id: "incomum",
        name: "Incomum",
        description: "Exige ferreiro ou mercador especializado.",
        priceMultiplier: 1.3,
    },
    {
        id: "raro",
        name: "Raro",
        description: "Difícil de encontrar fora de centros maiores.",
        priceMultiplier: 1.75,
    },
    {
        id: "exotico",
        name: "Exótico",
        description: "Material ou origem incomum (Tevinter, Waking Sea…).",
        priceMultiplier: 2.5,
    },
    {
        id: "unico",
        name: "Único",
        description: "Peça singular; leilão ou relíquia.",
        priceMultiplier: 4,
    },
];
