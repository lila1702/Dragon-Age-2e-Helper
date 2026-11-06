import http from "node:http";

import cors from "cors";
import express from "express";
import { WebSocketServer } from "ws";
import { z } from "zod";
import type { SheetPatch } from "@dragon-age/domain";

import { resolveSession } from "./auth.js";
import { applyCharacterPatch, canReadCharacter, toCharacterDto } from "./characters.js";
import { query } from "./db.js";
import { realtimeHub } from "./realtimeHub.js";
import { router } from "./routes.js";
import { loadSettings } from "./settings.js";

const settings = loadSettings();
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.use(router);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: undefined });

wss.on("connection", async (socket, req) => {
    try {
        const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
        const match = /^\/ws\/campaigns\/([^/]+)$/.exec(url.pathname);
        if (!match) {
            socket.close();
            return;
        }
        const campaignId = match[1];
        const token = url.searchParams.get("token") ?? undefined;
        const user = await resolveSession(token);
        if (!user) {
            socket.close();
            return;
        }

        const membership = await query(
            `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
            [campaignId, user.id]
        );
        if (!membership.rows[0]) {
            socket.close();
            return;
        }

        realtimeHub.add({
            socket,
            userId: user.id,
            displayName: user.displayName,
            campaignId,
        });

        socket.on("message", async (raw) => {
            try {
                const message = JSON.parse(String(raw)) as {
                    type: string;
                    patch?: SheetPatch;
                    characterId?: string;
                    path?: string | null;
                    displayName?: string;
                };

                if (message.type === "sheet.presence") {
                    const characterId = message.characterId;
                    if (!characterId) return;
                    const readable = await canReadCharacter(user, characterId);
                    if (!readable || readable.campaign_id !== campaignId) return;
                    realtimeHub.setPresence(
                        campaignId,
                        characterId,
                        message.path ?? null,
                        user.id,
                        message.displayName ?? user.displayName
                    );
                    return;
                }

                if (message.type === "sheet.patch" && message.patch) {
                    const parsed = z
                        .object({
                            characterId: z.string().uuid(),
                            baseRevision: z.number().int(),
                            opId: z.string().min(1),
                            path: z.string().min(1),
                            value: z.unknown(),
                        })
                        .safeParse(message.patch);
                    if (!parsed.success) return;

                    try {
                        const { row, applied } = await applyCharacterPatch(user, parsed.data);
                        if (row.campaign_id !== campaignId) return;
                        realtimeHub.publishPatch(campaignId, applied, row.revision);
                    } catch (error) {
                        const snapshot = (error as { snapshot?: ReturnType<typeof toCharacterDto> })
                            .snapshot;
                        if (snapshot) {
                            socket.send(
                                JSON.stringify({
                                    type: "sheet.snapshot",
                                    snapshot: {
                                        characterId: snapshot.id,
                                        revision: snapshot.revision,
                                        sheet: snapshot.sheet,
                                    },
                                })
                            );
                        }
                    }
                }
            } catch (error) {
                console.error("Erro no WebSocket:", error);
            }
        });
    } catch (error) {
        console.error("Falha ao abrir WebSocket:", error);
        socket.close();
    }
});

server.listen(settings.port, () => {
    console.log(`API listening on http://localhost:${settings.port}`);
});
