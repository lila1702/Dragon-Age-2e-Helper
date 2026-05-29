import OBR from "@owlbear-rodeo/sdk";
import { calculateDicePlusStunt } from "../../domain/entities/diceRules";

import { METADATA_KEYS } from "./metadataKeys";
import { setTokenBarValues } from "./tokenBars";

import type { IOwlbearService } from "./IOwlbearService";
import { getAttributeRollBonus } from "../../domain/entities/attributeRoll";

import type { AttributeRollOptions } from "../../domain/entities/attributeRoll";
import type { Attribute } from "../../domain/entities/characterSheet";
import type { StuntRollResult } from "../../domain/entities/diceRules";
import type { OwlbearSdkWithDice } from "./owlbear-dice";

const obr = OBR as OwlbearSdkWithDice;

export class OwlbearService implements IOwlbearService {
    onReady(callback: () => void): void {
        OBR.onReady(() => {
            console.log("Owlbear Rodeo SDK is ready.");
            callback();
        });
    }

    async rollAttributeTest(
        attribute: Attribute,
        options?: AttributeRollOptions
    ): Promise<StuntRollResult> {
        const results = await obr.dice.roll([
            { die: "D6", count: 1, name: "Vermelho" },
            { die: "D6", count: 1, name: "Vermelho" },
            { die: "D6", count: 1, name: "Dragão" },
        ]);

        const bonusTotal = getAttributeRollBonus(attribute.value, attribute, options);
        const resultadoCalculado = calculateDicePlusStunt(
            results.orderedD6,
            results.totalValue + bonusTotal
        );

        return resultadoCalculado;
    }

    async updateTokenTrackers(
        tokenId: string,
        hpCurrent: number,
        hpMax: number,
        mpCurrent: number,
        mpMax: number
    ): Promise<void> {
        await OBR.scene.items.updateItems([tokenId], (items) => {
            for (const item of items) {
                if (item.type === "CHARACTER" || item.type === "PROP") {
                    if (!item.metadata) item.metadata = {};

                    item.metadata[METADATA_KEYS.TRACKERS] = {
                        hp: { current: hpCurrent, max: hpMax },
                        mp: { current: mpCurrent, max: mpMax },
                    };

                    setTokenBarValues(item, hpCurrent, hpMax, mpCurrent, mpMax);
                }
            }
        });
    }
}

export const owlbearService = new OwlbearService();
