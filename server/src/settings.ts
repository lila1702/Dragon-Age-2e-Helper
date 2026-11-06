import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface ServerSettings {
    port: number;
    databaseUrl: string;
    sessionSecret: string;
}

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(rootDir, "..");

function fromEnv(): Partial<ServerSettings> {
    return {
        port: process.env.PORT ? Number(process.env.PORT) : undefined,
        databaseUrl: process.env.DATABASE_URL,
        sessionSecret: process.env.SESSION_SECRET,
    };
}

function fromFile(): Partial<ServerSettings> {
    const localPath = path.join(serverDir, "settings.local.json");
    if (!existsSync(localPath)) return {};
    const raw = JSON.parse(readFileSync(localPath, "utf8")) as Partial<ServerSettings>;
    return raw;
}

export function loadSettings(): ServerSettings {
    const merged = {
        port: 3001,
        databaseUrl: "",
        sessionSecret: "",
        ...fromFile(),
        ...Object.fromEntries(
            Object.entries(fromEnv()).filter(([, value]) => value !== undefined && value !== "")
        ),
    } as ServerSettings;

    if (!merged.databaseUrl) {
        throw new Error(
            "databaseUrl ausente. Crie server/settings.local.json a partir de settings.example.json ou defina DATABASE_URL."
        );
    }
    if (!merged.sessionSecret) {
        throw new Error(
            "sessionSecret ausente. Crie server/settings.local.json a partir de settings.example.json ou defina SESSION_SECRET."
        );
    }

    return merged;
}
