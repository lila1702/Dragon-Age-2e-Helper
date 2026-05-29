import type { Attribute } from "../../domain/entities/characterSheet";
import type { AttributeRollOptions } from "../../domain/entities/attributeRoll";
import type { StuntRollResult } from "../../domain/entities/diceRules";

export interface IOwlbearService {
    onReady(callback: () => void): void;
    rollAttributeTest(
        attribute: Attribute,
        options?: AttributeRollOptions
    ): Promise<StuntRollResult>;
    updateTokenTrackers(tokenId: string, hpCurrent: number, hpMax: number, mpCurrent: number, mpMax: number): Promise<void>;
}