import type { Attribute } from "../../domain/entities/characterSheet";
import type { StuntRollResult } from "../../domain/entities/diceRules";

export interface IOwlbearService {
    onReady(callback: () => void): void;
    rollAttributeTest(attribute: Attribute): Promise<StuntRollResult>;
    updateTokenTrackers(tokenId: string, hpCurrent: number, hpMax: number, mpCurrent: number, mpMax: number): Promise<void>;
}