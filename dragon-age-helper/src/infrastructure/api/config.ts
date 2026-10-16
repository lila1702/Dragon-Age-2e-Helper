export function getApiBaseUrl(): string | null {
    const raw = import.meta.env.VITE_DRAGON_AGE_API_URL;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim().replace(/\/+$/, "");
    return trimmed.length > 0 ? trimmed : null;
}

export function isApiEnabled(): boolean {
    return getApiBaseUrl() !== null;
}
