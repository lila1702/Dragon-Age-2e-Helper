import type { Attribute } from "../../domain/entities/characterSheet";
import type { AttributeRollOptions } from "../../domain/entities/attributeRoll";
import type { StuntRollResult } from "../../domain/entities/diceRules";
import type { CharacterSheet } from "../../domain/entities/characterSheet";
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
