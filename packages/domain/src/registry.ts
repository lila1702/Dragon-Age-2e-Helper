import { LocalRoller } from "./ports/localRoller";
import type { DiceRoller } from "./ports/diceRoller";
import type { Ruleset } from "./ports/ruleset";
import { AgeRuleset, AGE_RULESET_ID } from "./rulesets/ageRuleset";

const rulesets: Record<string, Ruleset> = {
    [AGE_RULESET_ID]: new AgeRuleset(),
};

const rollers: Record<string, DiceRoller> = {
    local: new LocalRoller(),
};

export function registerDiceRoller(roller: DiceRoller): void {
    rollers[roller.id] = roller;
}

export function getDiceRoller(id: string): DiceRoller {
    return rollers[id] ?? rollers.local;
}

export function getRuleset(id: string): Ruleset {
    return rulesets[id] ?? rulesets[AGE_RULESET_ID];
}
