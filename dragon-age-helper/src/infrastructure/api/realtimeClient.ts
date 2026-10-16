import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "./config";
import type { CharacterRecord } from "./types";

type CharacterUpdatedHandler = (record: CharacterRecord) => void;

class RealtimeClient {
    private socket: Socket | null = null;
    private characterHandlers = new Set<CharacterUpdatedHandler>();

    connect(): Socket | null {
        const baseUrl = getApiBaseUrl();
        if (!baseUrl) return null;

        if (this.socket?.connected) return this.socket;

        if (!this.socket) {
            this.socket = io(baseUrl, {
                transports: ["websocket", "polling"],
                autoConnect: true,
            });

            this.socket.on("character:updated", (record: CharacterRecord) => {
                for (const handler of this.characterHandlers) {
                    handler(record);
                }
            });
        } else if (!this.socket.connected) {
            this.socket.connect();
        }

        return this.socket;
    }

    disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }

    subscribeCharacter(characterId: string): void {
        const socket = this.connect();
        socket?.emit("subscribe:character", { characterId });
    }

    unsubscribeCharacter(characterId: string): void {
        this.socket?.emit("unsubscribe:character", { characterId });
    }

    onCharacterUpdated(handler: CharacterUpdatedHandler): () => void {
        this.characterHandlers.add(handler);
        return () => {
            this.characterHandlers.delete(handler);
        };
    }
}

export const realtimeClient = new RealtimeClient();
