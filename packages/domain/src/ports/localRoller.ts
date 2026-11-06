import type { DiceRoller, RollRequest, RolledDie } from "./diceRoller";

function parseNotation(notation: string): Array<{ count: number; faces: number; label?: string }> {
    const parts = notation.split("+").map((part) => part.trim());
    const dice: Array<{ count: number; faces: number; label?: string }> = [];

    for (const part of parts) {
        const match = part.match(/^(\d+)d(\d+)(?:\{([^}]+)\})?/i);
        if (!match) continue;
        dice.push({
            count: Number.parseInt(match[1], 10),
            faces: Number.parseInt(match[2], 10),
            label: match[3],
        });
    }

    return dice;
}

function rollDie(faces: number): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % faces) + 1;
}

export class LocalRoller implements DiceRoller {
    readonly id = "local";

    async roll(request: RollRequest): Promise<RolledDie[]> {
        const groups = parseNotation(request.notation);
        const results: RolledDie[] = [];

        for (const group of groups) {
            for (let i = 0; i < group.count; i++) {
                const label = group.label;
                results.push({
                    value: rollDie(group.faces),
                    faces: group.faces,
                    label,
                    stunt: label === "Dragão" || label?.toLowerCase() === "dragon",
                });
            }
        }

        if (results.length === 0) {
            results.push(
                { value: rollDie(6), faces: 6, label: "Vermelho" },
                { value: rollDie(6), faces: 6, label: "Vermelho" },
                { value: rollDie(6), faces: 6, label: "Dragão", stunt: true }
            );
        }

        return results;
    }
}
