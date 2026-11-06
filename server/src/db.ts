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

export function getPool(): pg.Pool {
    if (!pool) {
        const settings = loadSettings();
        const local = isLocalDatabaseUrl(settings.databaseUrl);
        pool = new Pool({
            connectionString: settings.databaseUrl,
            ssl: local ? undefined : { rejectUnauthorized: false },
        });
    }
    return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<pg.QueryResult<T>> {
    return getPool().query<T>(text, params);
}
