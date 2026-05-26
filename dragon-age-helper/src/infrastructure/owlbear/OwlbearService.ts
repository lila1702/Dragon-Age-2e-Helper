import OBR from "@owlbear-rodeo/sdk";
import { calculateDicePlusStunt } from "../../domain/entities/diceRules";

import type { IOwlbearService } from "./IOwlbearService";
import type { Attribute } from "../../domain/entities/characterSheet";
import type { StuntRollResult } from "../../domain/entities/diceRules";

interface DicePlusRollEnvelope {
    orderedD6: number[];
    totalValue: number;
}

export class OwlbearService implements IOwlbearService {
    onReady(callback: () => void): void {
        OBR.onReady(() => {
            console.log("Owlbear Rodeo SDK is ready.");
            callback();
        });
    }

    async rollAttributeTest(attribute: Attribute): Promise<StuntRollResult> {
        const results: DicePlusRollEnvelope = await (OBR as any).dice.roll([
            { die: "D6", count: 1, name: "Vermelho" },
            { die: "D6", count: 1, name: "Vermelho" },
            { die: "D6", count: 1, name: "Dragão" }
        ]);

        const bonusTotal = attribute.value + attribute.focus;
        const resultadoCalculado = calculateDicePlusStunt(results.orderedD6, results.totalValue + bonusTotal);

        return resultadoCalculado;
    }

    async updateTokenTrackers( tokenId: string, hpCurrent: number, hpMax: number, mpCurrent: number, mpMax: number): Promise<void> {
        await OBR.scene.items.updateItems([tokenId], (items) => {
            for (const item of items) {
                if (item.type === "CHARACTER" || item.type === "PROP") {
                    if (!item.metadata) item.metadata = {};

                    item.metadata["com.dragonagehelper/trackers"] = {
                        hp: { current: hpCurrent, max: hpMax },
                        mp: { current: mpCurrent, max: mpMax }
                    };

                    (item as any).barValues = [
                        { current: hpCurrent, max: hpMax, color: "red" },
                        { current: mpCurrent, max: mpMax, color: "blue" }
                    ];
                }
            }
        });
    }
}

export const owlbearService = new OwlbearService();