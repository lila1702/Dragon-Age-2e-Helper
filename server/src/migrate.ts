import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPool, query } from "./db.js";

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

async function ensureMigrationsTable(): Promise<void> {
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
}

async function appliedFiles(): Promise<Set<string>> {
    const result = await query<{ filename: string }>("SELECT filename FROM schema_migrations");
    return new Set(result.rows.map((row) => row.filename));
}

async function main(): Promise<void> {
    await ensureMigrationsTable();
    const applied = await appliedFiles();
    const files = readdirSync(migrationsDir)
        .filter((name) => name.endsWith(".sql"))
        .sort();

    for (const filename of files) {
        if (applied.has(filename)) {
            console.log(`skip ${filename}`);
            continue;
        }
        const sql = readFileSync(path.join(migrationsDir, filename), "utf8");
        const client = await getPool().connect();
        try {
            await client.query("BEGIN");
            await client.query(sql);
            await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
            await client.query("COMMIT");
            console.log(`applied ${filename}`);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    await getPool().end();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
