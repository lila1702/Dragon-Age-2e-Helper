import { z } from "zod";

export const currencySchema = z.object({
    copper: z.number().int().min(0),
    silver: z.number().int().min(0),
    gold: z.number().int().min(0),
});

export const itemCategorySchema = z.enum([
    "arma_corpo_a_corpo",
    "arma_distancia",
    "armadura",
    "escudo",
    "equipamento",
    "consumivel",
]);

export const baseItemSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: itemCategorySchema,
    description: z.string().optional(),
    weaponGroup: z.string().optional(),
    basePriceCopper: z.number().int().min(0),
    baseDamage: z.string().optional(),
    armorRating: z.number().int().min(0).optional(),
    armorPenalty: z.number().int().max(0).optional(),
    tags: z.array(z.string()).default([]),
});

export const materialSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    /** Multiplicador sobre o preço base (1 = mesmo que o item padrão em aço). */
    priceMultiplier: z.number().positive(),
    /** Multiplicador de dano (1 = igual ao base). */
    damageMultiplier: z.number().positive().default(1),
    /** Dado extra somado ao dano (ex.: "+1d6"). */
    extraDamageDice: z.string().optional(),
    /** Bônus flat ao dano (ex.: +2). */
    damageFlatBonus: z.number().int().default(0),
});

export const qualitySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    priceMultiplier: z.number().positive(),
    damageMultiplier: z.number().positive().default(1),
    damageFlatBonus: z.number().int().default(0),
});

export const raritySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    priceMultiplier: z.number().positive(),
});

export const spellCatalogEntrySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    degree: z.enum(["Novato", "Experiente", "Mestre"]),
    school: z.string().min(1),
    arcana: z.string().min(1),
    cost: z.number().int().min(0),
    time: z.string(),
    tn: z.number().int().min(0),
    test: z.string().optional().default(""),
    description: z.string(),
});

export const calculateItemBodySchema = z.object({
    itemId: z.string().min(1),
    materialId: z.string().min(1).optional(),
    qualityId: z.string().min(1).optional(),
    rarityId: z.string().min(1).optional(),
});

export type BaseItem = z.infer<typeof baseItemSchema>;
export type Material = z.infer<typeof materialSchema>;
export type Quality = z.infer<typeof qualitySchema>;
export type Rarity = z.infer<typeof raritySchema>;
export type SpellCatalogEntry = z.infer<typeof spellCatalogEntrySchema>;
