import { Router } from "express";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

import {
    findCharacterById,
    insertCharacter,
    upsertCharacter,
} from "../repositories/characterRepository.js";
import { broadcastCharacterUpdated } from "../realtime/broadcast.js";
import {
    characterSheetSchema,
    createCharacterBodySchema,
    updateCharacterBodySchema,
} from "../schemas/characterSheet.js";
import { applyResourceRules } from "../services/sheetNormalization.js";

export const charactersRouter = Router();

function formatZodError(error: ZodError): string {
    return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

charactersRouter.get("/:id", async (req, res) => {
    try {
        const character = await findCharacterById(req.params.id);
        if (!character) {
            res.status(404).json({ error: "Character not found." });
            return;
        }

        res.json(character);
    } catch (error) {
        console.error("GET /characters/:id failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

charactersRouter.post("/", async (req, res) => {
    try {
        const parsed = createCharacterBodySchema.parse(req.body);
        const id = parsed.id ?? parsed.sheet.id ?? randomUUID();
        const sheet = applyResourceRules({ ...parsed.sheet, id });

        characterSheetSchema.parse(sheet);

        const existing = await findCharacterById(id);
        if (existing) {
            res.status(409).json({ error: "Character already exists.", id });
            return;
        }

        const created = await insertCharacter(id, sheet);
        broadcastCharacterUpdated(created);
        res.status(201).json(created);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: formatZodError(error) });
            return;
        }

        console.error("POST /characters failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

charactersRouter.put("/:id", async (req, res) => {
    try {
        const parsed = updateCharacterBodySchema.parse(req.body);
        const id = req.params.id;
        const sheet = applyResourceRules({ ...parsed.sheet, id });

        characterSheetSchema.parse(sheet);

        const result = await upsertCharacter(id, sheet, parsed.expectedUpdatedAt);

        if (result === "conflict") {
            const current = await findCharacterById(id);
            res.status(409).json({
                error: "Conflict: character was modified elsewhere.",
                current,
            });
            return;
        }

        broadcastCharacterUpdated(result);
        res.json(result);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: formatZodError(error) });
            return;
        }

        console.error("PUT /characters/:id failed:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});
