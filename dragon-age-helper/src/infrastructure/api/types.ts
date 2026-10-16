import type { CharacterSheet } from "../../domain/entities/characterSheet";

export interface CharacterRecord {
    id: string;
    sheet: CharacterSheet;
    createdAt: string;
    updatedAt: string;
}

export interface TokenBinding {
    roomId: string;
    tokenId: string;
    characterId: string;
    updatedAt: string;
}
