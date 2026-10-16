import { normalizeCharacterSheet } from "../../domain/entities/normalizeCharacterSheet";
import { getApiBaseUrl } from "./config";

import type { CharacterSheet } from "../../domain/entities/characterSheet";
import type { CharacterRecord, TokenBinding } from "./types";

export class ApiError extends Error {
    status: number;
    body?: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return undefined;
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
}

function normalizeApiSheet(sheet: CharacterSheet, tokenId?: string): CharacterSheet {
    const resolvedTokenId = tokenId ?? sheet.tokenId ?? "";
    const normalized = normalizeCharacterSheet(sheet, resolvedTokenId);
    return normalized ?? sheet;
}

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl ?? getApiBaseUrl() ?? "";
    }

    get isConfigured(): boolean {
        return this.baseUrl.length > 0;
    }

    private url(path: string): string {
        return `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    }

    private async request<T>(path: string, init?: RequestInit): Promise<T> {
        const response = await fetch(this.url(path), {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...(init?.headers ?? {}),
            },
        });

        const body = await parseJsonResponse(response);

        if (!response.ok) {
            const message =
                typeof body === "object" &&
                body !== null &&
                "error" in body &&
                typeof (body as { error: unknown }).error === "string"
                    ? (body as { error: string }).error
                    : `API error ${response.status}`;
            throw new ApiError(message, response.status, body);
        }

        return body as T;
    }

    async getCharacter(id: string): Promise<CharacterRecord> {
        const record = await this.request<CharacterRecord>(`/characters/${encodeURIComponent(id)}`);
        return {
            ...record,
            sheet: normalizeApiSheet(record.sheet, record.sheet.tokenId),
        };
    }

    async createCharacter(sheet: CharacterSheet, id?: string): Promise<CharacterRecord> {
        const record = await this.request<CharacterRecord>("/characters", {
            method: "POST",
            body: JSON.stringify({ id, sheet }),
        });
        return {
            ...record,
            sheet: normalizeApiSheet(record.sheet, record.sheet.tokenId),
        };
    }

    async saveCharacter(
        id: string,
        sheet: CharacterSheet,
        expectedUpdatedAt?: string
    ): Promise<CharacterRecord> {
        const record = await this.request<CharacterRecord>(`/characters/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify({ sheet: { ...sheet, id }, expectedUpdatedAt }),
        });
        return {
            ...record,
            sheet: normalizeApiSheet(record.sheet, record.sheet.tokenId),
        };
    }

    async putTokenBinding(
        roomId: string,
        tokenId: string,
        characterId: string
    ): Promise<TokenBinding> {
        return this.request<TokenBinding>(
            `/rooms/${encodeURIComponent(roomId)}/tokens/${encodeURIComponent(tokenId)}/binding`,
            {
                method: "PUT",
                body: JSON.stringify({ characterId }),
            }
        );
    }

    async getTokenBinding(roomId: string, tokenId: string): Promise<TokenBinding | null> {
        try {
            return await this.request<TokenBinding>(
                `/rooms/${encodeURIComponent(roomId)}/tokens/${encodeURIComponent(tokenId)}/binding`
            );
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) return null;
            throw error;
        }
    }
}

export const apiClient = new ApiClient();
