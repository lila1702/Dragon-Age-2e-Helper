import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

loadEnv();

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(moduleDir, "..");

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function resolveSslCaPath(): string {
    const configured = process.env.DB_SSL_CA_PATH ?? path.join(apiRoot, "certs", "aiven-ca.pem");
    const resolved = path.isAbsolute(configured)
        ? configured
        : path.resolve(apiRoot, configured);

    if (!fs.existsSync(resolved)) {
        throw new Error(`MySQL CA certificate not found at: ${resolved}`);
    }

    return resolved;
}

export const config = {
    port: Number.parseInt(process.env.PORT ?? "3001", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigins: (process.env.CORS_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    db: {
        host: requireEnv("DB_HOST"),
        port: Number.parseInt(requireEnv("DB_PORT"), 10),
        user: requireEnv("DB_USER"),
        password: requireEnv("DB_PASSWORD"),
        database: requireEnv("DB_NAME"),
        sslCaPath: resolveSslCaPath(),
    },
} as const;
