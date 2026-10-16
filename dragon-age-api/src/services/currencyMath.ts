/** Mesmas regras do helper (`inventario.ts`): 100 cobre = 1 prata, 100 prata = 1 ouro. */
export const COPPER_PER_SILVER = 100;
export const SILVER_PER_GOLD = 100;

export interface Currency {
    copper: number;
    silver: number;
    gold: number;
}

export function copperToCurrency(totalCopper: number): Currency {
    let copper = Math.max(0, Math.floor(totalCopper));

    let silver = Math.floor(copper / COPPER_PER_SILVER);
    copper %= COPPER_PER_SILVER;

    let gold = Math.floor(silver / SILVER_PER_GOLD);
    silver %= SILVER_PER_GOLD;

    return { copper, silver, gold };
}

export function formatCurrencyDisplay(currency: Currency): string {
    const parts: string[] = [];
    if (currency.gold > 0) parts.push(`${currency.gold} ouro`);
    if (currency.silver > 0) parts.push(`${currency.silver} prata`);
    if (currency.copper > 0 || parts.length === 0) parts.push(`${currency.copper} cobre`);
    return parts.join(", ");
}
