import { MongoClient, type Db } from "mongodb";

import { config } from "../config.js";

const CHARACTERS = "characters";
const TOKEN_BINDINGS = "token_bindings";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
    if (db) return db;

    client = new MongoClient(config.mongodb.uri);
    await client.connect();
    db = client.db();

    await db.collection(CHARACTERS).createIndex({ updatedAt: -1 });
    await db
        .collection(TOKEN_BINDINGS)
        .createIndex({ roomId: 1, tokenId: 1 }, { unique: true });
    await db.collection(TOKEN_BINDINGS).createIndex({ roomId: 1, characterId: 1 });

    return db;
}

export function getDb(): Db {
    if (!db) {
        throw new Error("MongoDB not connected. Call connectMongo() first.");
    }
    return db;
}

export async function closeMongo(): Promise<void> {
    if (client) {
        await client.close();
    }
    client = null;
    db = null;
}

export const collections = {
    characters: CHARACTERS,
    tokenBindings: TOKEN_BINDINGS,
} as const;
