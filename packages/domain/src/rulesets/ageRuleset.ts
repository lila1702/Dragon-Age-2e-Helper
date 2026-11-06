import {
    computeAttackBonus,
    isAttackUntrained,
} from "../entities/attackBonus";
import { calculateDicePlusStunt } from "../entities/diceRules";
import { computeSpellpower } from "../entities/magias";
import type { Attribute, CharacterSheet } from "../entities/characterSheet";
import type { MeleeAttack, RangedAttack } from "../entities/habilidades";
import type { RollModifiers, StuntRollResult } from "../entities/diceRules";
import type { RolledDie } from "../ports/diceRoller";
import type { Ruleset } from "../ports/ruleset";
import { DEFAULT_RULESET_ID } from "../catalog/defaultCatalog";

export const AGE_RULESET_ID = DEFAULT_RULESET_ID;

export class AgeRuleset implements Ruleset {
    readonly id = AGE_RULESET_ID;

    interpretTest(dice: RolledDie[], modifiers: RollModifiers): StuntRollResult {
        const ordered = orderAgeDice(dice);
        const diceTotal = ordered.reduce((sum, value) => sum + value, 0);
        const modifierTotal = modifiers.attribute + modifiers.focus + modifiers.situational;
        return calculateDicePlusStunt(ordered, diceTotal + modifierTotal, modifiers);
    }

    spellpower(attributes: Attribute[]): number | null {
        return computeSpellpower(attributes);
    }

    attackBonus(sheet: CharacterSheet, attack: MeleeAttack | RangedAttack): number | null {
        const habilidades = sheet.habilidades;
        const weaponGroups = habilidades?.weaponGroups ?? "";
        const untrained = isAttackUntrained(attack.weaponGroup, weaponGroups);
        return computeAttackBonus(
            sheet.attributes,
            attack.attributeAbbreviation,
            untrained,
            attack.weaponGroup
        );
    }
}

function orderAgeDice(dice: RolledDie[]): [number, number, number] {
    const stunt = dice.find((die) => die.stunt);
    const others = dice.filter((die) => die !== stunt).map((die) => die.value);
    while (others.length < 2) others.push(0);
    const stuntValue = stunt?.value ?? dice[2]?.value ?? 0;
    return [others[0] ?? 0, others[1] ?? 0, stuntValue];
}
