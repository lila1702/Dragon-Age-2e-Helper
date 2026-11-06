import { existsSync, readFileSync } from "node:fs";

import pg from "pg";

import { loadSettings } from "./settings.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function isLocalDatabaseUrl(databaseUrl: string): boolean {
    try {
        const host = new URL(databaseUrl).hostname;
        return host === "localhost" || host === "127.0.0.1";
    } catch {
        return databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    }
}

function stripSslQueryParams(databaseUrl: string): string {
    try {
        const url = new URL(databaseUrl);
        for (const key of [...url.searchParams.keys()]) {
            if (/^ssl/i.test(key) || key.toLowerCase() === "uselibpqcompat") {
                url.searchParams.delete(key);
            }
        }
        return url.toString();
    } catch {
        return databaseUrl
            .replace(/([?&])(ssl[^&=]*|uselibpqcompat)=[^&]*/gi, "$1")
            .replace(/\?&/, "?")
            .replace(/[?&]$/, "");
    }
}

function resolveSslCa(explicitCa?: string): string | undefined {
    const fromEnv = process.env.DATABASE_SSL_CA?.trim();
    if (fromEnv) return fromEnv.replace(/\\n/g, "\n");

    if (explicitCa?.trim()) return explicitCa.trim().replace(/\\n/g, "\n");

    const caPath = process.env.DATABASE_SSL_CA_PATH?.trim();
    if (caPath && existsSync(caPath)) {
        return readFileSync(caPath, "utf8");
    }

    return undefined;
}

function poolConfig(databaseUrl: string, sslCa?: string): pg.PoolConfig {
    if (isLocalDatabaseUrl(databaseUrl)) {
        return { connectionString: databaseUrl };
    }

    const ca = resolveSslCa(sslCa);
    if (!ca) {
        throw new Error(
            "SSL do banco remoto exige a CA. Defina DATABASE_SSL_CA (conteúdo do .pem do Aiven) ou DATABASE_SSL_CA_PATH."
        );
    }

    return {
        connectionString: stripSslQueryParams(databaseUrl),
        ssl: {
            rejectUnauthorized: true,
            ca,
        },
    };
}

export function getPool(): pg.Pool {
    if (!pool) {
        const settings = loadSettings();
        pool = new Pool(poolConfig(settings.databaseUrl, settings.databaseSslCa));
    }
    return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<pg.QueryResult<T>> {
    return getPool().query<T>(text, params);
}
