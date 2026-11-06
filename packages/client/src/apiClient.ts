import type {
    CharacterSheet,
    SheetPatch,
    RulesetCatalog,
} from "@dragon-age/domain";
import { createEmptySheet } from "@dragon-age/domain";

import type {
    ApiUser,
    CampaignPlayerProfile,
    CampaignSummary,
    CatalogEntryRecord,
    CharacterRecord,
    InitiativeRecord,
    OwlbearRoomProfilesResponse,
    SessionResponse,
    TokenLinkRecord,
} from "./types";

export class ApiError extends Error {
    readonly status: number;
    readonly body?: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

export interface ApiClientOptions {
    baseUrl: string;
    getToken: () => string | null;
    onUnauthorized?: () => void;
}

export class ApiClient {
    private readonly options: ApiClientOptions;

    constructor(options: ApiClientOptions) {
        this.options = options;
    }

    async register(email: string, password: string, displayName: string): Promise<SessionResponse> {
        return this.request<SessionResponse>("POST", "/users", {
            email,
            password,
            displayName,
        });
    }

    async login(login: string, password: string): Promise<SessionResponse> {
        return this.request<SessionResponse>("POST", "/sessions", { login, password });
    }

    async me(): Promise<ApiUser> {
        return this.request<ApiUser>("GET", "/me");
    }

    async listMyCampaigns(): Promise<CampaignSummary[]> {
        return this.request<CampaignSummary[]>("GET", "/me/campaigns");
    }

    async createCampaign(name: string): Promise<CampaignSummary> {
        return this.request<CampaignSummary>("POST", "/campaigns", {
            name,
            rulesetId: "dragon-age-age",
            diceRoller: "dice-plus",
        });
    }

    async listMyCharacters(): Promise<CharacterRecord[]> {
        return this.request<CharacterRecord[]>("GET", "/me/characters");
    }

    async listCampaignCharacters(
        campaignId: string,
        options?: { includeInactive?: boolean }
    ): Promise<CharacterRecord[]> {
        const query = options?.includeInactive ? "?includeInactive=1" : "";
        return this.request<CharacterRecord[]>(
            "GET",
            `/campaigns/${campaignId}/characters${query}`
        );
    }

    async updateCampaignSettings(
        campaignId: string,
        patch: { playersSeeOnlyOwnSheets?: boolean }
    ): Promise<CampaignSummary> {
        return this.request<CampaignSummary>("PATCH", `/campaigns/${campaignId}/settings`, patch);
    }

    async duplicateCharacter(id: string): Promise<CharacterRecord> {
        return this.request<CharacterRecord>("POST", `/characters/${id}/duplicate`);
    }

    async setCharacterStatus(
        id: string,
        status: "active" | "inactive"
    ): Promise<CharacterRecord> {
        return this.request<CharacterRecord>("PATCH", `/characters/${id}/status`, { status });
    }

    async assignCharacterPlayer(
        id: string,
        userId: string | null
    ): Promise<CharacterRecord> {
        return this.request<CharacterRecord>("PATCH", `/characters/${id}/assign-player`, {
            userId,
        });
    }

    async getCharacter(id: string): Promise<CharacterRecord> {
        return this.request<CharacterRecord>("GET", `/characters/${id}`);
    }

    async createCharacter(campaignId: string, sheet?: CharacterSheet): Promise<CharacterRecord> {
        const payload = sheet ?? createEmptySheet("");
        return this.request<CharacterRecord>("POST", "/characters", {
            campaignId,
            sheet: payload,
        });
    }

    async putCharacter(
        id: string,
        revision: number,
        sheet: CharacterSheet
    ): Promise<CharacterRecord> {
        return this.request<CharacterRecord>("PUT", `/characters/${id}`, {
            revision,
            sheet,
        });
    }

    async migrateCharacter(
        campaignId: string,
        sheet: CharacterSheet
    ): Promise<CharacterRecord> {
        return this.request<CharacterRecord>("POST", "/characters/migrate", {
            campaignId,
            sheet,
        });
    }

    async createTokenLink(
        characterId: string,
        obrRoomId: string,
        tokenId: string
    ): Promise<TokenLinkRecord> {
        return this.request<TokenLinkRecord>("POST", `/characters/${characterId}/token-links`, {
            obrRoomId,
            tokenId,
        });
    }

    async deleteTokenLink(characterId: string, tokenId: string): Promise<void> {
        await this.request<void>("DELETE", `/characters/${characterId}/token-links/${tokenId}`);
    }

    async listTokenLinks(characterId: string): Promise<TokenLinkRecord[]> {
        return this.request<TokenLinkRecord[]>("GET", `/characters/${characterId}/token-links`);
    }

    async findCharacterByToken(
        obrRoomId: string,
        tokenId: string
    ): Promise<CharacterRecord | null> {
        try {
            return await this.request<CharacterRecord>(
                "GET",
                `/token-links/lookup?obrRoomId=${encodeURIComponent(obrRoomId)}&tokenId=${encodeURIComponent(tokenId)}`
            );
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) return null;
            throw error;
        }
    }

    async linkOwlbearIdentity(obrPlayerId: string, obrRoomId: string): Promise<void> {
        await this.request("POST", "/me/owlbear-identities", {
            obrPlayerId,
            obrRoomId,
        });
    }

    async getCatalog(rulesetId: string): Promise<RulesetCatalog> {
        return this.request<RulesetCatalog>("GET", `/rulesets/${rulesetId}/catalog`);
    }

    async listCatalogEntries(
        rulesetId: string,
        options?: { kind?: string; q?: string }
    ): Promise<CatalogEntryRecord[]> {
        const params = new URLSearchParams();
        if (options?.kind) params.set("kind", options.kind);
        if (options?.q) params.set("q", options.q);
        const query = params.toString() ? `?${params.toString()}` : "";
        return this.request<CatalogEntryRecord[]>(
            "GET",
            `/rulesets/${rulesetId}/catalog-entries${query}`
        );
    }

    async createCatalogEntry(
        rulesetId: string,
        entry: {
            kind: string;
            name: string;
            summary?: string;
            body?: Record<string, unknown>;
            classTags?: string[];
            requirementTags?: string[];
            requirementsText?: string;
            sortOrder?: number;
        }
    ): Promise<CatalogEntryRecord> {
        return this.request<CatalogEntryRecord>(
            "POST",
            `/rulesets/${rulesetId}/catalog-entries`,
            entry
        );
    }

    async updateCatalogEntry(
        id: string,
        patch: {
            kind?: string;
            name?: string;
            summary?: string;
            body?: Record<string, unknown>;
            classTags?: string[];
            requirementTags?: string[];
            requirementsText?: string;
            sortOrder?: number;
        }
    ): Promise<CatalogEntryRecord> {
        return this.request<CatalogEntryRecord>("PATCH", `/catalog-entries/${id}`, patch);
    }

    async deleteCatalogEntry(id: string): Promise<void> {
        await this.request<void>("DELETE", `/catalog-entries/${id}`);
    }

    async listInitiative(campaignId: string): Promise<InitiativeRecord[]> {
        return this.request<InitiativeRecord[]>("GET", `/campaigns/${campaignId}/initiative`);
    }

    async setInitiative(
        campaignId: string,
        entries: Omit<InitiativeRecord, "campaignId">[]
    ): Promise<InitiativeRecord[]> {
        return this.request<InitiativeRecord[]>("PUT", `/campaigns/${campaignId}/initiative`, {
            entries,
        });
    }

    async applyPatch(patch: SheetPatch): Promise<{ revision: number }> {
        return this.request<{ revision: number }>(
            "POST",
            `/characters/${patch.characterId}/patches`,
            patch
        );
    }

    async createCampaignPlayer(
        campaignId: string,
        displayName: string,
        password: string,
        email?: string
    ): Promise<CampaignPlayerProfile> {
        return this.request<CampaignPlayerProfile>("POST", `/campaigns/${campaignId}/players`, {
            displayName,
            password,
            email,
        });
    }

    async listCampaignPlayers(campaignId: string): Promise<CampaignPlayerProfile[]> {
        return this.request<CampaignPlayerProfile[]>("GET", `/campaigns/${campaignId}/players`);
    }

    async updateCampaignPlayer(
        campaignId: string,
        profileId: string,
        patch: { displayName?: string; password?: string }
    ): Promise<CampaignPlayerProfile> {
        return this.request<CampaignPlayerProfile>(
            "PATCH",
            `/campaigns/${campaignId}/players/${profileId}`,
            patch
        );
    }

    async deleteCampaignPlayer(campaignId: string, profileId: string): Promise<void> {
        await this.request<void>("DELETE", `/campaigns/${campaignId}/players/${profileId}`);
    }

    async linkCampaignOwlbearRoom(
        campaignId: string,
        obrRoomId: string
    ): Promise<{ campaignId: string; obrRoomId: string; rooms: string[] }> {
        return this.request("PUT", `/campaigns/${campaignId}/owlbear-room`, { obrRoomId });
    }

    async getCampaignOwlbearRoom(
        campaignId: string
    ): Promise<{ campaignId: string; obrRoomId: string | null; rooms: string[] }> {
        return this.request("GET", `/campaigns/${campaignId}/owlbear-room`);
    }

    async unlinkCampaignOwlbearRoom(campaignId: string, obrRoomId: string): Promise<void> {
        await this.request(
            "DELETE",
            `/campaigns/${campaignId}/owlbear-room/${encodeURIComponent(obrRoomId)}`
        );
    }

    async listOwlbearRoomProfiles(obrRoomId: string): Promise<OwlbearRoomProfilesResponse> {
        return this.request<OwlbearRoomProfilesResponse>(
            "GET",
            `/owlbear/rooms/${encodeURIComponent(obrRoomId)}/profiles`
        );
    }

    async loginOwlbearRoomProfile(
        obrRoomId: string,
        userId: string,
        password: string
    ): Promise<SessionResponse & { campaignId: string }> {
        return this.request("POST", `/owlbear/rooms/${encodeURIComponent(obrRoomId)}/login`, {
            userId,
            password,
        });
    }

    websocketUrl(campaignId: string, token: string): string {
        const base = this.options.baseUrl.replace(/\/$/, "");
        const wsBase = base.replace(/^http/, "ws");
        return `${wsBase}/ws/campaigns/${campaignId}?token=${encodeURIComponent(token)}`;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown
    ): Promise<T> {
        const headers: Record<string, string> = {
            Accept: "application/json",
        };
        const token = this.options.getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        if (body !== undefined) headers["Content-Type"] = "application/json";

        const response = await fetch(`${this.options.baseUrl.replace(/\/$/, "")}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });

        if (response.status === 401) {
            this.options.onUnauthorized?.();
        }

        if (response.status === 204) {
            return undefined as T;
        }

        const text = await response.text();
        const data = text ? (JSON.parse(text) as unknown) : null;

        if (!response.ok) {
            const message =
                data && typeof data === "object" && "error" in data
                    ? String((data as { error: unknown }).error)
                    : `HTTP ${response.status}`;
            throw new ApiError(message, response.status, data);
        }

        return data as T;
    }
}
