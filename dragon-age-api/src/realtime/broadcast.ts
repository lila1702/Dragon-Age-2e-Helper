import type { Server } from "socket.io";

import type { CharacterRecord } from "../schemas/characterSheet.js";

let io: Server | null = null;

export function setRealtimeServer(server: Server): void {
    io = server;
}

export function characterRoom(characterId: string): string {
    return `character:${characterId}`;
}

export function roomChannel(roomId: string): string {
    return `room:${roomId}`;
}

export function broadcastCharacterUpdated(record: CharacterRecord): void {
    io?.to(characterRoom(record.id)).emit("character:updated", record);
}

export function broadcastRoomBinding(
    roomId: string,
    payload: { tokenId: string; characterId: string }
): void {
    io?.to(roomChannel(roomId)).emit("room:binding", { roomId, ...payload });
}
