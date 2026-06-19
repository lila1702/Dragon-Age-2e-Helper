export function sanitizeRelativeNumericInput(value: string): string {
    const trimmed = value.trimStart();
    const operator = trimmed[0];

    if (operator === "+" || operator === "-" || operator === "*" || operator === "/") {
        const digits = trimmed.slice(1).replace(/\D/g, "");
        return digits === "" ? operator : `${operator}${digits}`;
    }

    return value.replace(/\D/g, "");
}

export function parseNumericExpression(raw: string, current: number, fallback: number): number {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "+" || trimmed === "-" || trimmed === "*" || trimmed === "/") {
        return fallback;
    }

    if (trimmed.startsWith("+")) {
        const delta = Number.parseInt(trimmed.slice(1), 10);
        if (Number.isNaN(delta)) return fallback;
        return Math.max(0, current + delta);
    }

    if (trimmed.startsWith("-")) {
        const delta = Number.parseInt(trimmed.slice(1), 10);
        if (Number.isNaN(delta)) return fallback;
        return Math.max(0, current - delta);
    }

    if (trimmed.startsWith("*")) {
        const factor = Number.parseInt(trimmed.slice(1), 10);
        if (Number.isNaN(factor)) return fallback;
        return Math.max(0, Math.floor(current * factor));
    }

    if (trimmed.startsWith("/")) {
        const divisor = Number.parseInt(trimmed.slice(1), 10);
        if (Number.isNaN(divisor) || divisor <= 0) return fallback;
        return Math.max(0, Math.floor(current / divisor));
    }

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? fallback : Math.max(0, parsed);
}
