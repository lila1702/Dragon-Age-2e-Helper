import type { Attribute } from "@dragon-age/domain";
import type { AttributeRollOptions } from "@dragon-age/domain";
import type { AttackRollOptions, DamageRollResult } from "@dragon-age/domain";
import type { StuntRollResult } from "@dragon-age/domain";
import type { CharacterSheet } from "@dragon-age/domain";
import type { SelectionError } from "./selectionErrors";

export interface SelectionResult {
    tokenId: string | null;
    error: SelectionError;
}

export interface IOwlbearService {
    onReady(callback: () => void): void;
    resolveSelection(): Promise<SelectionResult>;
    resolveActiveToken(): Promise<SelectionResult>;
    getTokenDisplayName(tokenId: string): Promise<string | null>;
    isCurrentPlayerGm(): Promise<boolean>;
    canEditToken(tokenId: string): Promise<boolean>;
    rollAttributeTest(
        attribute: Attribute,
        options?: AttributeRollOptions
    ): Promise<StuntRollResult>;
    rollAttackTest(
        attackBonus: number | null,
        options?: AttackRollOptions
    ): Promise<StuntRollResult>;
    rollDamageTest(
        fullDamage: string,
        halve: boolean,
        options?: AttackRollOptions
    ): Promise<DamageRollResult>;
    loadCharacterSheet(tokenId: string): Promise<CharacterSheet | null>;
    saveCharacterSheet(tokenId: string, sheet: CharacterSheet): Promise<void>;
    updateTokenTrackers(
        tokenId: string,
        hpCurrent: number,
        hpMax: number,
        mpCurrent: number,
        mpMax: number
    ): Promise<void>;
}
