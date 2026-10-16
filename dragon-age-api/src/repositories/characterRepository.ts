import { collections, getDb } from "../db/mongo.js";
import type { CharacterRecord, CharacterSheetPayload } from "../schemas/characterSheet.js";

interface CharacterDocument {
    _id: string;
    sheet: CharacterSheetPayload;
    createdAt: Date;
    updatedAt: Date;
}

function toRecord(doc: CharacterDocument): CharacterRecord {
    return {
        id: doc._id,
        sheet: doc.sheet,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export async function findCharacterById(id: string): Promise<CharacterRecord | null> {
    const doc = await getDb()
        .collection<CharacterDocument>(collections.characters)
        .findOne({ _id: id });

    return doc ? toRecord(doc) : null;
}

export async function insertCharacter(
    id: string,
    sheet: CharacterSheetPayload
): Promise<CharacterRecord> {
    const now = new Date();
    const payload = { ...sheet, id };

    await getDb().collection<CharacterDocument>(collections.characters).insertOne({
        _id: id,
        sheet: payload,
        createdAt: now,
        updatedAt: now,
    });

    return {
        id,
        sheet: payload,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };
}

export async function updateCharacter(
    id: string,
    sheet: CharacterSheetPayload,
    expectedUpdatedAt?: string
): Promise<CharacterRecord | "conflict" | null> {
    const collection = getDb().collection<CharacterDocument>(collections.characters);
    const existing = await collection.findOne({ _id: id });
    if (!existing) return null;

    const currentUpdatedAt = existing.updatedAt.toISOString();
    if (expectedUpdatedAt && currentUpdatedAt !== expectedUpdatedAt) {
        return "conflict";
    }

    const now = new Date();
    const payload = { ...sheet, id };

    const result = await collection.findOneAndUpdate(
        { _id: id, updatedAt: existing.updatedAt },
        {
            $set: {
                sheet: payload,
                updatedAt: now,
            },
        },
        { returnDocument: "after" }
    );

    if (!result) {
        return "conflict";
    }

    return toRecord(result);
}

export async function upsertCharacter(
    id: string,
    sheet: CharacterSheetPayload,
    expectedUpdatedAt?: string
): Promise<CharacterRecord | "conflict"> {
    const existing = await findCharacterById(id);

    if (!existing) {
        return insertCharacter(id, sheet);
    }

    const updated = await updateCharacter(id, sheet, expectedUpdatedAt);
    if (updated === "conflict") return "conflict";
    if (!updated) {
        throw new Error("Failed to update character.");
    }

    return updated;
}
