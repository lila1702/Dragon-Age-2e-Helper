import type { Attribute, CharacterSheet } from "../entities/characterSheet";
import type { MeleeAttack, RangedAttack } from "../entities/habilidades";
import type { RollModifiers, StuntRollResult } from "../entities/diceRules";
import type { RolledDie } from "./diceRoller";

export interface Ruleset {
    id: string;
    interpretTest(dice: RolledDie[], modifiers: RollModifiers): StuntRollResult;
    spellpower(attributes: Attribute[]): number | null;
    attackBonus(
        sheet: CharacterSheet,
        attack: MeleeAttack | RangedAttack
    ): number | null;
}
