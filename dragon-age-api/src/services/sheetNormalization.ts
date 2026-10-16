import type { CharacterSheetPayload } from "../schemas/characterSheet.js";

/** RN-001: limites HP/MP — 0 ≤ current ≤ max */
export function applyResourceRules(sheet: CharacterSheetPayload): CharacterSheetPayload {
    const hpMax = Math.max(0, sheet.hpMax);
    const mpMax = Math.max(0, sheet.mpMax);

    return {
        ...sheet,
        hpMax,
        mpMax,
        hpCurrent: Math.min(Math.max(0, sheet.hpCurrent), hpMax),
        mpCurrent: Math.min(Math.max(0, sheet.mpCurrent), mpMax),
    };
}
