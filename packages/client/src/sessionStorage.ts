const SESSION_KEY = "dragon-age.sessionToken";

export function readSessionToken(storage: Storage = localStorage): string | null {
    try {
        return storage.getItem(SESSION_KEY);
    } catch {
        return null;
    }
}

export function writeSessionToken(token: string, storage: Storage = localStorage): void {
    storage.setItem(SESSION_KEY, token);
}

export function clearSessionToken(storage: Storage = localStorage): void {
    storage.removeItem(SESSION_KEY);
}
