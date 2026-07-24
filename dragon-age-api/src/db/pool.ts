import fs from "node:fs";
import mysql from "mysql2/promise";

import { config } from "../config.js";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
    if (pool) return pool;

    pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        ssl: {
            ca: fs.readFileSync(config.db.sslCaPath),
            rejectUnauthorized: true,
        },
        waitForConnections: true,
        connectionLimit: 10,
        timezone: "Z",
    });

    return pool;
}

export async function closePool(): Promise<void> {
    if (!pool) return;
    await pool.end();
    pool = null;
}
