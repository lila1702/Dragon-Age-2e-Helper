import { config as loadEnv } from "dotenv";

loadEnv();

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const config = {
    port: Number.parseInt(process.env.PORT ?? "3001", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",
    corsOrigins: (process.env.CORS_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    mongodb: {
        uri:
            process.env.MONGODB_URI ??
            (process.env.NODE_ENV === "production"
                ? requireEnv("MONGODB_URI")
                : "mongodb://127.0.0.1:27017/dragon_age"),
    },
} as const;

export function corsOriginPolicy(): boolean | string[] {
    if (config.corsOrigins.length > 0) {
        return config.corsOrigins;
    }
    return config.nodeEnv === "development";
}
