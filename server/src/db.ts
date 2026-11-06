import pg from "pg";

import { loadSettings } from "./settings.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
    if (!pool) {
        const settings = loadSettings();
        pool = new Pool({ connectionString: settings.databaseUrl });
    }
    return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<pg.QueryResult<T>> {
    return getPool().query<T>(text, params);
}
