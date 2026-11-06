import type { WebSocket } from "ws";

import type { CampaignEvent, FieldPresence, SheetPatch } from "@dragon-age/domain";

interface Client {
    socket: WebSocket;
    userId: string;
    displayName: string;
    campaignId: string;
}

export class RealtimeHub {
    private readonly clients = new Set<Client>();
    private readonly presence = new Map<string, FieldPresence>();

    add(client: Client): void {
        this.clients.add(client);
        client.socket.on("close", () => {
            this.clients.delete(client);
            this.clearPresenceForUser(client.userId, client.campaignId);
        });
    }

    broadcast(campaignId: string, event: CampaignEvent, except?: WebSocket): void {
        const payload = JSON.stringify(event);
        for (const client of this.clients) {
            if (client.campaignId !== campaignId) continue;
            if (except && client.socket === except) continue;
            if (client.socket.readyState === client.socket.OPEN) {
                client.socket.send(payload);
            }
        }
    }

    setPresence(
        campaignId: string,
        characterId: string,
        path: string | null,
        userId: string,
        displayName: string
    ): void {
        for (const [key, value] of this.presence) {
            if (value.userId === userId && value.characterId === characterId) {
                this.presence.delete(key);
                this.broadcast(campaignId, {
                    type: "sheet.presence",
                    characterId,
                    path: value.path,
                    presence: null,
                });
            }
        }

        if (!path) return;

        const presence: FieldPresence = {
            characterId,
            path,
            userId,
            displayName,
        };
        const key = `${characterId}:${path}`;
        this.presence.set(key, presence);
        this.broadcast(campaignId, {
            type: "sheet.presence",
            characterId,
            path,
            presence,
        });
    }

    publishPatch(campaignId: string, patch: SheetPatch, revision: number): void {
        this.broadcast(campaignId, {
            type: "sheet.patch",
            patch,
            revision,
        });
    }

    private clearPresenceForUser(userId: string, campaignId: string): void {
        for (const [key, value] of this.presence) {
            if (value.userId !== userId) continue;
            this.presence.delete(key);
            this.broadcast(campaignId, {
                type: "sheet.presence",
                characterId: value.characterId,
                path: value.path,
                presence: null,
            });
        }
    }
}

export const realtimeHub = new RealtimeHub();
