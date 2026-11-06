import type {
    CatalogEntry,
    CatalogEntryKind,
    CharacterSheet,
    RulesetCatalog,
} from "@dragon-age/domain";

export interface ApiUser {
    id: string;
    email: string;
    displayName: string;
}

export interface SessionResponse {
    token: string;
    user: ApiUser;
}

export interface CampaignSummary {
    id: string;
    name: string;
    rulesetId: string;
    diceRoller: "dice-plus" | "local";
    playersSeeOnlyOwnSheets?: boolean;
    role: "GM" | "PLAYER";
}

export interface CharacterRecord {
    id: string;
    campaignId: string;
    ownerUserId: string;
    assignedPlayerUserId?: string | null;
    status?: "active" | "inactive";
    rulesetId: string;
    revision: number;
    sheet: CharacterSheet;
    name: string;
}

export interface TokenLinkRecord {
    id: string;
    characterId: string;
    obrRoomId: string;
    tokenId: string;
}

export interface InitiativeRecord {
    id: string;
    campaignId: string;
    characterId: string | null;
    label: string;
    value: number;
    order: number;
}

export interface CampaignPlayerProfile {
    id: string;
    userId: string;
    displayName: string;
    email: string;
}

export interface OwlbearRoomProfile {
    id: string;
    userId: string;
    displayName: string;
    kind: "gm" | "player";
}

export interface OwlbearRoomProfilesResponse {
    campaignId: string;
    campaignName: string;
    profiles: OwlbearRoomProfile[];
}

export type CatalogEntryRecord = CatalogEntry;

export type { RulesetCatalog, CatalogEntryKind };
