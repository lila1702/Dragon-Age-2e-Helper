import {
    ApiClient,
    clearSessionToken,
    readSessionToken,
    writeSessionToken,
} from "@dragon-age/client";

import { API_BASE_URL } from "./config";

let token = readSessionToken();

export const api = new ApiClient({
    baseUrl: API_BASE_URL,
    getToken: () => token,
    onUnauthorized: () => {
        token = null;
        clearSessionToken();
    },
});

export function setApiToken(next: string | null): void {
    token = next;
    if (next) writeSessionToken(next);
    else clearSessionToken();
}

export function getApiToken(): string | null {
    return token;
}
