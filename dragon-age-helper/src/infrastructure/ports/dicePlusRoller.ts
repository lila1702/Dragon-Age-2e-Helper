import type { DiceRoller, RollRequest, RolledDie } from "@dragon-age/domain";

import { rollDicePlus, rollDicePlusGeneric } from "../owlbear/dicePlusClient";

export class DicePlusRoller implements DiceRoller {
    readonly id = "dice-plus";

    async roll(request: RollRequest): Promise<RolledDie[]> {
        const isAttributeLike = /Dragão|Vermelho/i.test(request.notation);

        if (isAttributeLike) {
            const envelope = await rollDicePlus(request.notation);
            return [
                { value: envelope.orderedD6[0], faces: 6, label: "Vermelho" },
                { value: envelope.orderedD6[1], faces: 6, label: "Vermelho" },
                {
                    value: envelope.orderedD6[2],
                    faces: 6,
                    label: "Dragão",
                    stunt: true,
                },
            ];
        }

        const generic = await rollDicePlusGeneric(request.notation);
        return generic.diceValues.map((value) => ({
            value,
            faces: 6,
            label: request.label,
        }));
    }
}
