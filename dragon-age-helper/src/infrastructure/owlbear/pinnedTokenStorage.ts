const STORAGE_PREFIX = "com.dragonagehelper/pinnedToken";

function storageKey(roomId: string, playerId: string): string {
    return `${STORAGE_PREFIX}:${roomId}:${playerId}`;
}

export function readPinnedToken(roomId: string, playerId: string): string | null {
    try {
        return localStorage.getItem(storageKey(roomId, playerId));
    } catch {
        return null;
    }
}

export function writePinnedToken(roomId: string, playerId: string, tokenId: string): void {
    try {
        localStorage.setItem(storageKey(roomId, playerId), tokenId);
    } catch {
        // localStorage may be unavailable in some embed contexts
    }
}

export function clearPinnedToken(roomId: string, playerId: string): void {
    try {
        localStorage.removeItem(storageKey(roomId, playerId));
    } catch {
        // ignore
    }
}
