import type { Item } from "@owlbear-rodeo/sdk";

import type { TokenBarValue } from "./owlbear-dice";

type ItemWithBars = Item & { barValues?: TokenBarValue[] };

export function setTokenBarValues(
    item: Item,
    hpCurrent: number,
    hpMax: number,
    mpCurrent: number,
    mpMax: number
): void {
    const itemWithBars = item as ItemWithBars;

    itemWithBars.barValues = [
        { current: hpCurrent, max: hpMax, color: "red" },
        { current: mpCurrent, max: mpMax, color: "blue" },
    ];
}
