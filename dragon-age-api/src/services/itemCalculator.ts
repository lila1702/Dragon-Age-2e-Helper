import type { BaseItem, Material, Quality, Rarity } from "../schemas/reference.js";
import { copperToCurrency, formatCurrencyDisplay, type Currency } from "./currencyMath.js";

export interface ItemVariantInput {
    item: BaseItem;
    material: Material;
    quality: Quality;
    rarity: Rarity;
}

export interface ComputedItemVariant {
    itemId: string;
    itemName: string;
    material: Pick<Material, "id" | "name">;
    quality: Pick<Quality, "id" | "name">;
    rarity: Pick<Rarity, "id" | "name">;
    priceCopperTotal: number;
    price: Currency;
    priceDisplay: string;
    multipliers: {
        materialPrice: number;
        qualityPrice: number;
        rarityPrice: number;
        combinedPrice: number;
    };
    damage: {
        base: string | null;
        computed: string | null;
        notes: string[];
    };
    armor: {
        rating: number | null;
        penalty: number | null;
    };
}

function roundCopper(value: number): number {
    return Math.max(0, Math.round(value));
}

function applyDamageMultipliers(
    baseDamage: string,
    quality: Quality,
    material: Material
): { expression: string; notes: string[] } {
    const flatTotal = quality.damageFlatBonus + material.damageFlatBonus;
    const notes: string[] = [];

    let expression = baseDamage.trim();

    if (material.damageMultiplier !== 1 || quality.damageMultiplier !== 1) {
        const combined = material.damageMultiplier * quality.damageMultiplier;
        notes.push(`Multiplicador de dano ×${combined.toFixed(2)} (material × qualidade).`);
    }

    if (material.extraDamageDice) {
        if (material.extraDamageDice.startsWith("+")) {
            expression = `${expression}${material.extraDamageDice}`;
        } else {
            notes.push(material.extraDamageDice);
        }
    }

    if (flatTotal !== 0) {
        if (flatTotal > 0) {
            expression = `${expression}+${flatTotal}`;
        } else {
            notes.push(`Penalidade flat de dano: ${flatTotal}.`);
        }
    }

    return { expression, notes };
}

export function computeItemVariant(input: ItemVariantInput): ComputedItemVariant {
    const { item, material, quality, rarity } = input;

    const materialPrice = material.priceMultiplier;
    const qualityPrice = quality.priceMultiplier;
    const rarityPrice = rarity.priceMultiplier;
    const combinedPrice = materialPrice * qualityPrice * rarityPrice;

    const priceCopperTotal = roundCopper(item.basePriceCopper * combinedPrice);
    const price = copperToCurrency(priceCopperTotal);

    let damageNotes: string[] = [];
    let computedDamage: string | null = null;

    if (item.baseDamage) {
        const rolled = applyDamageMultipliers(item.baseDamage, quality, material);
        computedDamage = rolled.expression;
        damageNotes = rolled.notes;
    }

    return {
        itemId: item.id,
        itemName: item.name,
        material: { id: material.id, name: material.name },
        quality: { id: quality.id, name: quality.name },
        rarity: { id: rarity.id, name: rarity.name },
        priceCopperTotal,
        price,
        priceDisplay: formatCurrencyDisplay(price),
        multipliers: {
            materialPrice,
            qualityPrice,
            rarityPrice,
            combinedPrice,
        },
        damage: {
            base: item.baseDamage ?? null,
            computed: computedDamage,
            notes: damageNotes,
        },
        armor: {
            rating: item.armorRating ?? null,
            penalty: item.armorPenalty ?? null,
        },
    };
}
