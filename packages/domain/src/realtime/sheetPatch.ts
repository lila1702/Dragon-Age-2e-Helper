import type { CharacterSheet } from "../entities/characterSheet";

export interface SheetPatch {
    characterId: string;
    baseRevision: number;
    opId: string;
    path: string;
    value: unknown;
}

export interface SheetSnapshot {
    characterId: string;
    revision: number;
    sheet: CharacterSheet;
}

export interface FieldPresence {
    characterId: string;
    path: string;
    userId: string;
    displayName: string;
}

export type CampaignEvent =
    | { type: "sheet.patch"; patch: SheetPatch; revision: number }
    | { type: "sheet.snapshot"; snapshot: SheetSnapshot }
    | { type: "sheet.presence"; presence: FieldPresence | null; path: string; characterId: string }
    | { type: "initiative.updated"; campaignId: string }
    | { type: "roll.result"; campaignId: string; payload: unknown };

export const LONG_TEXT_PATHS = [
    "historico",
    "spells/*/description",
    "talents/*/benefits/*",
    "arcanaSpecializations/*/benefits/*",
    "habilidades/classAbilities/*/description",
    "inventory/items/*/description",
] as const;

export function isLongTextPath(path: string): boolean {
    if (path === "historico") return true;
    if (/^spells\/[^/]+\/description$/.test(path)) return true;
    if (/^talents\/[^/]+\/benefits\/[^/]+$/.test(path)) return true;
    if (/^arcanaSpecializations\/[^/]+\/benefits\/[^/]+$/.test(path)) return true;
    if (/^habilidades\/classAbilities\/[^/]+\/description$/.test(path)) return true;
    if (/^inventory\/items\/[^/]+\/description$/.test(path)) return true;
    return false;
}

export function createOpId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function setByPath(target: Record<string, unknown>, segments: string[], value: unknown): void {
    if (segments.length === 0) return;
    const [head, ...rest] = segments;
    if (rest.length === 0) {
        target[head] = value;
        return;
    }

    const next = target[head];

    // Atributos são indexados por abbreviation (AST, VON…), não por id.
    if (head === "attributes" && Array.isArray(next)) {
        const abbr = String(rest[0]).toUpperCase();
        const index = next.findIndex(
            (entry) =>
                entry &&
                typeof entry === "object" &&
                "abbreviation" in entry &&
                String((entry as { abbreviation: string }).abbreviation).toUpperCase() === abbr
        );
        if (index < 0) return;
        if (rest.length === 1) {
            next[index] = value;
            return;
        }
        const item = next[index];
        if (!item || typeof item !== "object") return;
        setByPath(item as Record<string, unknown>, rest.slice(1), value);
        return;
    }

    if (Array.isArray(next)) {
        const id = rest[0];
        const index = next.findIndex(
            (entry) =>
                entry &&
                typeof entry === "object" &&
                "id" in entry &&
                (entry as { id: string }).id === id
        );
        if (index < 0) return;
        if (rest.length === 1) {
            next[index] = value;
            return;
        }
        const item = next[index];
        if (!item || typeof item !== "object") return;
        setByPath(item as Record<string, unknown>, rest.slice(1), value);
        return;
    }

    if (!next || typeof next !== "object" || Array.isArray(next)) {
        target[head] = {};
    }
    setByPath(target[head] as Record<string, unknown>, rest, value);
}

/**
 * Applies a single field patch to a sheet copy.
 * Paths use `/` separators. List items are addressed by `id`.
 * Attributes use abbreviation: `attributes/VON/value`.
 */
export function applySheetPatch(sheet: CharacterSheet, path: string, value: unknown): CharacterSheet {
    const clone = structuredClone(sheet) as unknown as Record<string, unknown>;
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) return sheet;

    if (segments[0] === "attributes") {
        setByPath(clone, segments, value);
        return clone as unknown as CharacterSheet;
    }

    if (
        segments[0] === "spells" ||
        segments[0] === "talents" ||
        segments[0] === "arcanaSpecializations" ||
        segments[0] === "inventory"
    ) {
        if (segments[0] === "inventory" && segments[1] === "items") {
            setByPath(clone, segments, value);
            return clone as unknown as CharacterSheet;
        }
        if (segments[0] === "inventory" && segments[1] === "currency") {
            setByPath(clone, segments, value);
            return clone as unknown as CharacterSheet;
        }
        setByPath(clone, segments, value);
        return clone as unknown as CharacterSheet;
    }

    if (segments[0] === "habilidades") {
        setByPath(clone, segments, value);
        return clone as unknown as CharacterSheet;
    }

    if (segments[0] === "combatStats") {
        setByPath(clone, segments, value);
        return clone as unknown as CharacterSheet;
    }

    setByPath(clone, segments, value);
    return clone as unknown as CharacterSheet;
}
