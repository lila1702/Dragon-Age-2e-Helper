import type { RowDataPacket } from "mysql2";
import { closePool, getPool } from "./pool.js";
import { MIGRATIONS } from "./migrations.js";

async function migrate(): Promise<void> {
    const pool = getPool();

    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id VARCHAR(128) NOT NULL PRIMARY KEY,
            applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        )
    `);

    for (const migration of MIGRATIONS) {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM schema_migrations WHERE id = ?",
            [migration.id]
        );

        if (rows.length > 0) continue;

        console.log(`Applying ${migration.id}...`);
        const statements = Array.isArray(migration.sql) ? migration.sql : [migration.sql];
        for (const statement of statements) {
            await pool.query(statement);
        }
        await pool.query("INSERT INTO schema_migrations (id) VALUES (?)", [migration.id]);
    }

    console.log("Migrations complete.");
}

migrate()
    .catch((error) => {
        console.error("Migration failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closePool();
    });
