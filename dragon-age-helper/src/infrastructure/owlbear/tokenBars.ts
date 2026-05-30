import type { Item } from "@owlbear-rodeo/sdk";

import { applyHpMpToOwlTrackers } from "./owlTrackersSync";

export function setTokenBarValues(
    item: Item,
    hpCurrent: number,
    hpMax: number,
    mpCurrent: number,
    mpMax: number
): void {
    applyHpMpToOwlTrackers(item, hpCurrent, hpMax, mpCurrent, mpMax);
}
