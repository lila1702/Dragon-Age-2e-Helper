import { collections, getDb } from "../db/mongo.js";

export interface TokenBinding {
    roomId: string;
    tokenId: string;
    characterId: string;
    updatedAt: string;
}

interface TokenBindingDocument {
    roomId: string;
    tokenId: string;
    characterId: string;
    updatedAt: Date;
}

function toBinding(doc: TokenBindingDocument): TokenBinding {
    return {
        roomId: doc.roomId,
        tokenId: doc.tokenId,
        characterId: doc.characterId,
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export async function upsertTokenBinding(
    roomId: string,
    tokenId: string,
    characterId: string
): Promise<TokenBinding> {
    const now = new Date();
    await getDb()
        .collection<TokenBindingDocument>(collections.tokenBindings)
        .updateOne(
            { roomId, tokenId },
            {
                $set: {
                    roomId,
                    tokenId,
                    characterId,
                    updatedAt: now,
                },
            },
            { upsert: true }
        );

    return {
        roomId,
        tokenId,
        characterId,
        updatedAt: now.toISOString(),
    };
}

export async function findTokenBinding(
    roomId: string,
    tokenId: string
): Promise<TokenBinding | null> {
    const doc = await getDb()
        .collection<TokenBindingDocument>(collections.tokenBindings)
        .findOne({ roomId, tokenId });

    return doc ? toBinding(doc) : null;
}

export async function listRoomBindings(roomId: string): Promise<TokenBinding[]> {
    const docs = await getDb()
        .collection<TokenBindingDocument>(collections.tokenBindings)
        .find({ roomId })
        .toArray();

    return docs.map(toBinding);
}
