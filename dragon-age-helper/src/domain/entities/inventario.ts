export interface InventoryItem {
    id: string;
    name: string;
    saleValue: string;
    description: string;
    /** null = quantidade indeterminada (exibido como "--") */
    quantity: number | null;
}

export interface Currency {
    copper: number;
    silver: number;
    gold: number;
}

export interface Inventory {
    items: InventoryItem[];
    currency: Currency;
}

export function createInventoryItemId(): string {
    return crypto.randomUUID();
}

export function createEmptyCurrency(): Currency {
    return { copper: 0, silver: 0, gold: 0 };
}

export function createEmptyInventoryItem(): InventoryItem {
    return {
        id: createInventoryItemId(),
        name: "",
        saleValue: "",
        description: "",
        quantity: 1,
    };
}

export function createEmptyInventory(): Inventory {
    return {
        items: [],
        currency: createEmptyCurrency(),
    };
}

export function formatInventoryQuantity(quantity: number | null): string {
    return quantity === null ? "--" : String(quantity);
}

const COPPER_PER_SILVER = 100;
const SILVER_PER_GOLD = 100;

/** Converte cobre→prata e prata→ouro; ouro pode ultrapassar 100. */
export function normalizeCurrency(currency: Currency): Currency {
    let { copper, silver, gold } = currency;

    copper = Math.max(0, Math.floor(copper));
    silver = Math.max(0, Math.floor(silver));
    gold = Math.max(0, Math.floor(gold));

    if (copper >= COPPER_PER_SILVER) {
        silver += Math.floor(copper / COPPER_PER_SILVER);
        copper %= COPPER_PER_SILVER;
    }

    if (silver >= SILVER_PER_GOLD) {
        gold += Math.floor(silver / SILVER_PER_GOLD);
        silver %= SILVER_PER_GOLD;
    }

    return { copper, silver, gold };
}
