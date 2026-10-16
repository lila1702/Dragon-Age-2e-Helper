import { Router } from "express";
import { z, ZodError } from "zod";

import { findCharacterById } from "../repositories/characterRepository.js";
import {
    findTokenBinding,
    listRoomBindings,
    upsertTokenBinding,
} from "../repositories/tokenBindingRepository.js";
import { broadcastRoomBinding } from "../realtime/broadcast.js";

export const roomsRouter = Router();

const bindingBodySchema = z.object({
    characterId: z.string().min(1),
});

function formatZodError(error: ZodError): string {
    return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

roomsRouter.get("/:roomId/bindings", async (req, res) => {
    try {
        const bindings = await listRoomBindings(req.params.roomId);
        res.json({ roomId: req.params.roomId, bindings });
    } catch (error) {
        console.error("GET /rooms/:roomId/bindings failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

roomsRouter.get("/:roomId/tokens/:tokenId/binding", async (req, res) => {
    try {
        const binding = await findTokenBinding(req.params.roomId, req.params.tokenId);
        if (!binding) {
            res.status(404).json({ error: "Binding not found." });
            return;
        }

        res.json(binding);
    } catch (error) {
        console.error("GET binding failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

roomsRouter.put("/:roomId/tokens/:tokenId/binding", async (req, res) => {
    try {
        const parsed = bindingBodySchema.parse(req.body);
        const character = await findCharacterById(parsed.characterId);
        if (!character) {
            res.status(404).json({ error: "Character not found.", characterId: parsed.characterId });
            return;
        }

        const binding = await upsertTokenBinding(
            req.params.roomId,
            req.params.tokenId,
            parsed.characterId
        );

        broadcastRoomBinding(req.params.roomId, {
            tokenId: req.params.tokenId,
            characterId: parsed.characterId,
        });

        res.json(binding);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: formatZodError(error) });
            return;
        }

        console.error("PUT binding failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});
