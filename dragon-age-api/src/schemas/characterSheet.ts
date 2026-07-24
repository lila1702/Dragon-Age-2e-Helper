import { z } from "zod";

const attributeSchema = z
    .object({
        name: z.string(),
        abbreviation: z.string(),
        value: z.number(),
    })
    .passthrough();

const inventorySchema = z
    .object({
        items: z.array(z.unknown()),
        currency: z.object({
            copper: z.number().int().min(0),
            silver: z.number().int().min(0),
            gold: z.number().int().min(0),
        }),
    })
    .passthrough();

/** Validação na borda da API — espelha o mínimo de CharacterSheet do helper. */
export const characterSheetSchema = z
    .object({
        id: z.string().min(1),
        tokenId: z.string().optional(),
        name: z.string(),
        historico: z.string().optional(),
        className: z.string(),
        level: z.number().int().min(1),
        idade: z.string().optional(),
        sexo: z.string().optional(),
        combatStats: z
            .object({
                speed: z.number(),
                defense: z.number(),
                armor: z.number(),
                armorPenalty: z.number(),
            })
            .passthrough()
            .optional(),
        hpCurrent: z.number().int().min(0),
        hpMax: z.number().int().min(0),
        mpCurrent: z.number().int().min(0),
        mpMax: z.number().int().min(0),
        attributes: z.array(attributeSchema).min(1),
        habilidades: z.unknown().optional(),
        talents: z.array(z.unknown()).default([]),
        arcanaSpecializations: z.array(z.unknown()).default([]),
        spells: z.array(z.unknown()).default([]),
        inventory: inventorySchema,
    })
    .passthrough();

export type CharacterSheetPayload = z.infer<typeof characterSheetSchema>;

export const createCharacterBodySchema = z.object({
    id: z.string().uuid().optional(),
    sheet: characterSheetSchema,
});

export const updateCharacterBodySchema = z.object({
    sheet: characterSheetSchema,
    /** ISO 8601 — se enviado, rejeita PUT quando o registro mudou desde então. */
    expectedUpdatedAt: z.string().datetime().optional(),
});

export type CharacterRecord = {
    id: string;
    sheet: CharacterSheetPayload;
    createdAt: string;
    updatedAt: string;
};
