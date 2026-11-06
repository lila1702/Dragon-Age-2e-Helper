import { randomUUID } from "node:crypto";

import { Router } from "express";
import { z } from "zod";
import {
    DEFAULT_RULESET_CATALOG,
    isCatalogEntryKind,
    normalizeCharacterSheet,
    parseOwlbearRoomId,
    type CharacterSheet,
    type SheetPatch,
} from "@dragon-age/domain";

import {
    authenticate,
    createSession,
    createUser,
    requireAuth,
    setUserDisplayName,
    setUserPassword,
} from "./auth.js";
import bcrypt from "bcryptjs";
import {
    applyCharacterPatch,
    assignCharacterPlayer,
    canReadCharacter,
    createCharacter,
    duplicateCharacter,
    replaceCharacter,
    setCharacterStatus,
    toCharacterDto,
    type CharacterRow,
} from "./characters.js";
import { query } from "./db.js";
import { realtimeHub } from "./realtimeHub.js";

export const router = Router();

/** Express 5 types route params as `string | string[]`. */
function param(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
}

function mapCharacter(row: CharacterRow) {
    return toCharacterDto(row);
}

router.post("/users", async (req, res) => {
    const body = z
        .object({
            email: z.string().email(),
            password: z.string().min(6),
            displayName: z.string().min(1),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    try {
        const user = await createUser(body.data.email, body.data.password, body.data.displayName);
        const token = await createSession(user.id);
        res.status(201).json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(409).json({ error: "Não foi possível criar o usuário." });
    }
});

router.post("/sessions", async (req, res) => {
    const body = z
        .object({
            login: z.string().min(1).optional(),
            email: z.string().min(1).optional(),
            password: z.string().min(1),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const login = (body.data.login ?? body.data.email ?? "").trim();
    if (!login) {
        res.status(400).json({ error: "Informe username ou e-mail." });
        return;
    }

    const user = await authenticate(login, body.data.password);
    if (!user) {
        res.status(401).json({ error: "Username/e-mail ou senha incorretos." });
        return;
    }
    const token = await createSession(user.id);
    res.json({ token, user });
});

router.get("/me", requireAuth, async (req, res) => {
    res.json(req.user);
});

router.get("/me/campaigns", requireAuth, async (req, res) => {
    const result = await query<{
        id: string;
        name: string;
        ruleset_id: string;
        dice_roller: "dice-plus" | "local";
        players_see_only_own_sheets: boolean;
        role: "GM" | "PLAYER";
    }>(
        `SELECT c.id, c.name, c.ruleset_id, c.dice_roller, c.players_see_only_own_sheets, m.role
         FROM campaigns c
         JOIN memberships m ON m.campaign_id = c.id
         WHERE m.user_id = $1
         ORDER BY c.name`,
        [req.user!.id]
    );
    res.json(
        result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            rulesetId: row.ruleset_id,
            diceRoller: row.dice_roller,
            playersSeeOnlyOwnSheets: Boolean(row.players_see_only_own_sheets),
            role: row.role,
        }))
    );
});

router.post("/campaigns", requireAuth, async (req, res) => {
    const body = z
        .object({
            name: z.string().min(1),
            rulesetId: z.string().default("dragon-age-age"),
            diceRoller: z.enum(["dice-plus", "local"]).default("dice-plus"),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const id = randomUUID();
    await query(
        `INSERT INTO campaigns (id, name, ruleset_id, dice_roller, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, body.data.name, body.data.rulesetId, body.data.diceRoller, req.user!.id]
    );
    await query(
        `INSERT INTO memberships (campaign_id, user_id, role) VALUES ($1, $2, 'GM')`,
        [id, req.user!.id]
    );

    res.status(201).json({
        id,
        name: body.data.name,
        rulesetId: body.data.rulesetId,
        diceRoller: body.data.diceRoller,
        role: "GM" as const,
    });
});

router.get("/me/characters", requireAuth, async (req, res) => {
    const result = await query<CharacterRow>(
        `SELECT * FROM characters WHERE owner_user_id = $1 ORDER BY name`,
        [req.user!.id]
    );
    res.json(result.rows.map(mapCharacter));
});

router.get("/campaigns/:campaignId/characters", requireAuth, async (req, res) => {
    const membership = await query<{ role: string }>(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [param(req.params.campaignId), req.user!.id]
    );
    if (!membership.rows[0]) {
        res.status(403).json({ error: "Sem acesso à campanha." });
        return;
    }

    const includeInactive = String(req.query.includeInactive ?? "") === "1";
    const campaign = await query<{ players_see_only_own_sheets: boolean }>(
        `SELECT players_see_only_own_sheets FROM campaigns WHERE id = $1`,
        [param(req.params.campaignId)]
    );
    const onlyOwn =
        membership.rows[0].role === "PLAYER" &&
        Boolean(campaign.rows[0]?.players_see_only_own_sheets);

    const result = await query<CharacterRow>(
        `SELECT * FROM characters
         WHERE campaign_id = $1
           AND ($2::boolean OR status = 'active')
           AND (
             NOT $3::boolean
             OR owner_user_id = $4
             OR assigned_player_user_id = $4
           )
         ORDER BY status ASC, name ASC`,
        [
            param(req.params.campaignId),
            includeInactive && membership.rows[0].role === "GM",
            onlyOwn,
            req.user!.id,
        ]
    );
    res.json(result.rows.map(mapCharacter));
});

router.patch("/campaigns/:campaignId/settings", requireAuth, async (req, res) => {
    if (!(await requireCampaignGm(param(req.params.campaignId), req.user!.id))) {
        res.status(403).json({ error: "Somente o mestre altera preferências." });
        return;
    }
    const body = z
        .object({
            playersSeeOnlyOwnSheets: z.boolean().optional(),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }
    if (body.data.playersSeeOnlyOwnSheets !== undefined) {
        await query(
            `UPDATE campaigns SET players_see_only_own_sheets = $2 WHERE id = $1`,
            [param(req.params.campaignId), body.data.playersSeeOnlyOwnSheets]
        );
    }
    const updated = await query<{
        id: string;
        name: string;
        ruleset_id: string;
        dice_roller: string;
        players_see_only_own_sheets: boolean;
    }>(`SELECT * FROM campaigns WHERE id = $1`, [param(req.params.campaignId)]);
    const row = updated.rows[0];
    res.json({
        id: row.id,
        name: row.name,
        rulesetId: row.ruleset_id,
        diceRoller: row.dice_roller,
        playersSeeOnlyOwnSheets: Boolean(row.players_see_only_own_sheets),
        role: "GM" as const,
    });
});

router.post("/characters", requireAuth, async (req, res) => {
    const body = z
        .object({
            campaignId: z.string().uuid(),
            sheet: z.unknown(),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    try {
        const sheet =
            normalizeCharacterSheet(body.data.sheet, "") ??
            ({ id: randomUUID() } as CharacterSheet);
        const row = await createCharacter(req.user!, body.data.campaignId, sheet);
        res.status(201).json(mapCharacter(row));
    } catch (error) {
        const status = (error as { status?: number }).status ?? 500;
        res.status(status).json({ error: (error as Error).message });
    }
});

router.post("/characters/migrate", requireAuth, async (req, res) => {
    const body = z
        .object({
            campaignId: z.string().uuid(),
            sheet: z.unknown(),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const sheet = normalizeCharacterSheet(body.data.sheet, "");
    if (!sheet) {
        res.status(400).json({ error: "Ficha inválida." });
        return;
    }

    const existing = await query<CharacterRow>(`SELECT * FROM characters WHERE id = $1`, [
        sheet.id,
    ]);
    if (existing.rows[0]) {
        res.json(mapCharacter(existing.rows[0]));
        return;
    }

    try {
        const row = await createCharacter(req.user!, body.data.campaignId, sheet, sheet.id);
        res.status(201).json(mapCharacter(row));
    } catch (error) {
        const status = (error as { status?: number }).status ?? 500;
        res.status(status).json({ error: (error as Error).message });
    }
});

router.get("/characters/:id", requireAuth, async (req, res) => {
    const row = await canReadCharacter(req.user!, param(req.params.id));
    if (!row) {
        res.status(404).json({ error: "Ficha não encontrada." });
        return;
    }
    res.json(mapCharacter(row));
});

router.put("/characters/:id", requireAuth, async (req, res) => {
    const body = z
        .object({
            revision: z.number().int(),
            sheet: z.unknown(),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const sheet = normalizeCharacterSheet(body.data.sheet, "");
    if (!sheet) {
        res.status(400).json({ error: "Ficha inválida." });
        return;
    }

    try {
        const row = await replaceCharacter(req.user!, param(req.params.id), body.data.revision, sheet);
        realtimeHub.broadcast(row.campaign_id, {
            type: "sheet.snapshot",
            snapshot: {
                characterId: row.id,
                revision: row.revision,
                sheet: row.sheet,
            },
        });
        res.json(mapCharacter(row));
    } catch (error) {
        const status = (error as { status?: number }).status ?? 500;
        const snapshot = (error as { snapshot?: unknown }).snapshot;
        res.status(status).json({ error: (error as Error).message, snapshot });
    }
});

router.post("/characters/:id/duplicate", requireAuth, async (req, res) => {
    try {
        const row = await duplicateCharacter(req.user!, param(req.params.id));
        res.status(201).json(mapCharacter(row));
    } catch (error) {
        const status = (error as { status?: number }).status ?? 500;
        res.status(status).json({ error: (error as Error).message });
    }
});

router.patch("/characters/:id/status", requireAuth, async (req, res) => {
    const body = z
        .object({ status: z.enum(["active", "inactive"]) })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }
    try {
        const row = await setCharacterStatus(req.user!, param(req.params.id), body.data.status);
        res.json(mapCharacter(row));
    } catch (error) {
        const status = (error as { status?: number }).status ?? 500;
        res.status(status).json({ error: (error as Error).message });
    }
});

router.patch("/characters/:id/assign-player", requireAuth, async (req, res) => {
    const body = z
        .object({ userId: z.string().uuid().nullable() })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }
    try {
        const row = await assignCharacterPlayer(req.user!, param(req.params.id), body.data.userId);
        res.json(mapCharacter(row));
    } catch (error) {
        const status = (error as { status?: number }).status ?? 500;
        res.status(status).json({ error: (error as Error).message });
    }
});

router.post("/characters/:id/patches", requireAuth, async (req, res) => {
    const body = z
        .object({
            characterId: z.string().uuid(),
            baseRevision: z.number().int(),
            opId: z.string().min(1),
            path: z.string().min(1),
            value: z.unknown(),
        })
        .safeParse({ ...req.body, characterId: param(req.params.id) });
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    try {
        const { row, applied } = await applyCharacterPatch(req.user!, body.data as SheetPatch);
        realtimeHub.publishPatch(row.campaign_id, applied, row.revision);
        res.json({ revision: row.revision });
    } catch (error) {
        const status = (error as { status?: number }).status ?? 500;
        const snapshot = (error as { snapshot?: unknown }).snapshot;
        res.status(status).json({ error: (error as Error).message, snapshot });
    }
});

router.post("/characters/:id/token-links", requireAuth, async (req, res) => {
    const body = z
        .object({
            obrRoomId: z.string().min(1),
            tokenId: z.string().min(1),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const character = await canReadCharacter(req.user!, param(req.params.id));
    if (!character) {
        res.status(404).json({ error: "Ficha não encontrada." });
        return;
    }

    const id = randomUUID();
    await query(
        `INSERT INTO token_links (id, character_id, obr_room_id, token_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (obr_room_id, token_id)
         DO UPDATE SET character_id = EXCLUDED.character_id
         RETURNING id`,
        [id, character.id, body.data.obrRoomId, body.data.tokenId]
    );

    const link = await query<{
        id: string;
        character_id: string;
        obr_room_id: string;
        token_id: string;
    }>(
        `SELECT * FROM token_links WHERE obr_room_id = $1 AND token_id = $2`,
        [body.data.obrRoomId, body.data.tokenId]
    );

    const row = link.rows[0];
    res.status(201).json({
        id: row.id,
        characterId: row.character_id,
        obrRoomId: row.obr_room_id,
        tokenId: row.token_id,
    });
});

router.get("/characters/:id/token-links", requireAuth, async (req, res) => {
    const character = await canReadCharacter(req.user!, param(req.params.id));
    if (!character) {
        res.status(404).json({ error: "Ficha não encontrada." });
        return;
    }
    const result = await query<{
        id: string;
        character_id: string;
        obr_room_id: string;
        token_id: string;
    }>(`SELECT * FROM token_links WHERE character_id = $1`, [character.id]);
    res.json(
        result.rows.map((row) => ({
            id: row.id,
            characterId: row.character_id,
            obrRoomId: row.obr_room_id,
            tokenId: row.token_id,
        }))
    );
});

router.delete("/characters/:id/token-links/:tokenId", requireAuth, async (req, res) => {
    const character = await canReadCharacter(req.user!, param(req.params.id));
    if (!character) {
        res.status(404).json({ error: "Ficha não encontrada." });
        return;
    }
    await query(`DELETE FROM token_links WHERE character_id = $1 AND token_id = $2`, [
        character.id,
        param(req.params.tokenId),
    ]);
    res.status(204).end();
});

router.get("/token-links/lookup", requireAuth, async (req, res) => {
    const obrRoomId = String(req.query.obrRoomId ?? "");
    const tokenId = String(req.query.tokenId ?? "");
    if (!obrRoomId || !tokenId) {
        res.status(400).json({ error: "Parâmetros inválidos." });
        return;
    }

    const result = await query<CharacterRow>(
        `SELECT c.*
         FROM token_links t
         JOIN characters c ON c.id = t.character_id
         WHERE t.obr_room_id = $1 AND t.token_id = $2`,
        [obrRoomId, tokenId]
    );
    const row = result.rows[0];
    if (!row) {
        res.status(404).json({ error: "Vínculo não encontrado." });
        return;
    }
    const readable = await canReadCharacter(req.user!, row.id);
    if (!readable) {
        res.status(403).json({ error: "Sem acesso." });
        return;
    }
    res.json(mapCharacter(row));
});

router.post("/me/owlbear-identities", requireAuth, async (req, res) => {
    const body = z
        .object({
            obrPlayerId: z.string().min(1),
            obrRoomId: z.string().min(1),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    await query(
        `INSERT INTO owlbear_identities (user_id, obr_player_id, obr_room_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (obr_player_id, obr_room_id)
         DO UPDATE SET user_id = EXCLUDED.user_id, linked_at = NOW()`,
        [req.user!.id, body.data.obrPlayerId, body.data.obrRoomId]
    );
    res.status(204).end();
});

router.get("/rulesets/:id/catalog", requireAuth, async (req, res) => {
    const rulesetId = param(req.params.id);
    const attributes = await query(
        `SELECT id, name, abbreviation, sort_order AS "sortOrder"
         FROM catalog_attributes WHERE ruleset_id = $1 ORDER BY sort_order`,
        [rulesetId]
    );
    if (attributes.rows.length === 0 && rulesetId === DEFAULT_RULESET_CATALOG.rulesetId) {
        res.json(DEFAULT_RULESET_CATALOG);
        return;
    }
    if (attributes.rows.length === 0) {
        res.status(404).json({ error: "Ruleset não encontrado." });
        return;
    }

    const [schools, arcanas, weaponGroups, degrees] = await Promise.all([
        query(
            `SELECT id, name, sort_order AS "sortOrder"
             FROM catalog_schools WHERE ruleset_id = $1 ORDER BY sort_order`,
            [rulesetId]
        ),
        query(
            `SELECT id, school_id AS "schoolId", name, sort_order AS "sortOrder"
             FROM catalog_arcanas WHERE ruleset_id = $1 ORDER BY sort_order`,
            [rulesetId]
        ),
        query(
            `SELECT id, name, sort_order AS "sortOrder"
             FROM catalog_weapon_groups WHERE ruleset_id = $1 ORDER BY sort_order`,
            [rulesetId]
        ),
        query(
            `SELECT id, name, sort_order AS "sortOrder"
             FROM catalog_degrees WHERE ruleset_id = $1 ORDER BY sort_order`,
            [rulesetId]
        ),
    ]);

    res.json({
        rulesetId,
        attributes: attributes.rows,
        schools: schools.rows,
        arcanas: arcanas.rows,
        weaponGroups: weaponGroups.rows,
        degrees: degrees.rows,
    });
});

type CatalogEntryRow = {
    id: string;
    ruleset_id: string;
    kind: string;
    name: string;
    summary: string;
    body: Record<string, unknown>;
    class_tags: string[];
    requirement_tags: string[];
    requirements_text: string;
    sort_order: number;
};

function mapCatalogEntry(row: CatalogEntryRow) {
    return {
        id: row.id,
        rulesetId: row.ruleset_id,
        kind: row.kind,
        name: row.name,
        summary: row.summary,
        body: row.body ?? {},
        classTags: row.class_tags ?? [],
        requirementTags: row.requirement_tags ?? [],
        requirementsText: row.requirements_text ?? "",
        sortOrder: row.sort_order ?? 0,
    };
}

const catalogEntryKindSchema = z.enum([
    "item",
    "spell",
    "talent",
    "class_ability",
    "class_specialization",
]);

const catalogEntryBodySchema = z.object({
    kind: catalogEntryKindSchema,
    name: z.string().min(1),
    summary: z.string().optional(),
    body: z.record(z.string(), z.unknown()).optional(),
    classTags: z.array(z.string()).optional(),
    requirementTags: z.array(z.string()).optional(),
    requirementsText: z.string().optional(),
    sortOrder: z.number().int().optional(),
});

router.get("/rulesets/:id/catalog-entries", requireAuth, async (req, res) => {
    const rulesetId = param(req.params.id);
    const kind = typeof req.query.kind === "string" ? req.query.kind : null;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (kind && !isCatalogEntryKind(kind)) {
        res.status(400).json({ error: "Tipo de entrada inválido." });
        return;
    }

    const params: unknown[] = [rulesetId];
    let sql = `SELECT id, ruleset_id, kind, name, summary, body,
                      class_tags, requirement_tags, requirements_text, sort_order
               FROM catalog_entries
               WHERE ruleset_id = $1`;
    if (kind) {
        params.push(kind);
        sql += ` AND kind = $${params.length}`;
    }
    if (q) {
        params.push(`%${q}%`);
        sql += ` AND (name ILIKE $${params.length} OR summary ILIKE $${params.length}
                      OR requirements_text ILIKE $${params.length})`;
    }
    sql += ` ORDER BY sort_order, name`;

    const result = await query<CatalogEntryRow>(sql, params);
    res.json(result.rows.map(mapCatalogEntry));
});

router.post("/rulesets/:id/catalog-entries", requireAuth, async (req, res) => {
    const parsed = catalogEntryBodySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const rulesetId = param(req.params.id);
    const id = randomUUID();
    const data = parsed.data;
    const result = await query<CatalogEntryRow>(
        `INSERT INTO catalog_entries (
            id, ruleset_id, kind, name, summary, body,
            class_tags, requirement_tags, requirements_text, sort_order
         ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
         RETURNING id, ruleset_id, kind, name, summary, body,
                   class_tags, requirement_tags, requirements_text, sort_order`,
        [
            id,
            rulesetId,
            data.kind,
            data.name.trim(),
            data.summary?.trim() ?? "",
            JSON.stringify(data.body ?? {}),
            data.classTags ?? [],
            data.requirementTags ?? [],
            data.requirementsText?.trim() ?? "",
            data.sortOrder ?? 0,
        ]
    );
    res.status(201).json(mapCatalogEntry(result.rows[0]));
});

router.patch("/catalog-entries/:id", requireAuth, async (req, res) => {
    const parsed = catalogEntryBodySchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const existing = await query<CatalogEntryRow>(
        `SELECT id, ruleset_id, kind, name, summary, body,
                class_tags, requirement_tags, requirements_text, sort_order
         FROM catalog_entries WHERE id = $1`,
        [param(req.params.id)]
    );
    if (!existing.rows[0]) {
        res.status(404).json({ error: "Entrada não encontrada." });
        return;
    }

    const current = existing.rows[0];
    const data = parsed.data;
    const result = await query<CatalogEntryRow>(
        `UPDATE catalog_entries SET
            kind = $2,
            name = $3,
            summary = $4,
            body = $5::jsonb,
            class_tags = $6,
            requirement_tags = $7,
            requirements_text = $8,
            sort_order = $9,
            updated_at = NOW()
         WHERE id = $1
         RETURNING id, ruleset_id, kind, name, summary, body,
                   class_tags, requirement_tags, requirements_text, sort_order`,
        [
            param(req.params.id),
            data.kind ?? current.kind,
            data.name?.trim() ?? current.name,
            data.summary !== undefined ? data.summary.trim() : current.summary,
            JSON.stringify(data.body ?? current.body ?? {}),
            data.classTags ?? current.class_tags,
            data.requirementTags ?? current.requirement_tags,
            data.requirementsText !== undefined
                ? data.requirementsText.trim()
                : current.requirements_text,
            data.sortOrder ?? current.sort_order,
        ]
    );
    res.json(mapCatalogEntry(result.rows[0]));
});

router.delete("/catalog-entries/:id", requireAuth, async (req, res) => {
    const result = await query(`DELETE FROM catalog_entries WHERE id = $1 RETURNING id`, [
        param(req.params.id),
    ]);
    if (!result.rows[0]) {
        res.status(404).json({ error: "Entrada não encontrada." });
        return;
    }
    res.status(204).end();
});

async function requireCampaignGm(campaignId: string, userId: string): Promise<boolean> {
    const membership = await query<{ role: string }>(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [campaignId, userId]
    );
    return membership.rows[0]?.role === "GM";
}

async function listCampaignOwlbearRooms(campaignId: string): Promise<string[]> {
    const result = await query<{ obr_room_id: string }>(
        `SELECT obr_room_id FROM campaign_owlbear_rooms
         WHERE campaign_id = $1
         ORDER BY linked_at ASC`,
        [campaignId]
    );
    return result.rows.map((row) => row.obr_room_id);
}

router.post("/campaigns/:campaignId/players", requireAuth, async (req, res) => {
    if (!(await requireCampaignGm(param(req.params.campaignId), req.user!.id))) {
        res.status(403).json({ error: "Somente o mestre cria perfis de jogadoras." });
        return;
    }

    const body = z
        .object({
            displayName: z.string().min(1),
            password: z.string().min(4),
            email: z.string().email().optional(),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const email =
        body.data.email?.toLowerCase() ??
        `player+${randomUUID().slice(0, 8)}@${param(req.params.campaignId).slice(0, 8)}.local`;

    try {
        const user = await createUser(email, body.data.password, body.data.displayName);
        await query(
            `INSERT INTO memberships (campaign_id, user_id, role) VALUES ($1, $2, 'PLAYER')
             ON CONFLICT (campaign_id, user_id) DO UPDATE SET role = 'PLAYER'`,
            [param(req.params.campaignId), user.id]
        );
        const profileId = randomUUID();
        await query(
            `INSERT INTO campaign_player_profiles (id, campaign_id, user_id, display_name)
             VALUES ($1, $2, $3, $4)`,
            [profileId, param(req.params.campaignId), user.id, body.data.displayName]
        );
        res.status(201).json({
            id: profileId,
            userId: user.id,
            displayName: body.data.displayName,
            email: user.email,
        });
    } catch (error) {
        console.error(error);
        res.status(409).json({ error: "Não foi possível criar o perfil." });
    }
});

router.get("/campaigns/:campaignId/players", requireAuth, async (req, res) => {
    const membership = await query(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [param(req.params.campaignId), req.user!.id]
    );
    if (!membership.rows[0]) {
        res.status(403).json({ error: "Sem acesso." });
        return;
    }

    const result = await query<{
        id: string;
        user_id: string;
        display_name: string;
        email: string;
    }>(
        `SELECT p.id, p.user_id, p.display_name, u.email
         FROM campaign_player_profiles p
         JOIN users u ON u.id = p.user_id
         WHERE p.campaign_id = $1
         ORDER BY p.display_name`,
        [param(req.params.campaignId)]
    );
    res.json(
        result.rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            displayName: row.display_name,
            email: row.email,
        }))
    );
});

router.patch("/campaigns/:campaignId/players/:profileId", requireAuth, async (req, res) => {
    if (!(await requireCampaignGm(param(req.params.campaignId), req.user!.id))) {
        res.status(403).json({ error: "Somente o mestre gerencia perfis." });
        return;
    }

    const body = z
        .object({
            displayName: z.string().min(1).optional(),
            password: z.string().min(4).optional(),
        })
        .safeParse(req.body);
    if (!body.success || (!body.data.displayName && !body.data.password)) {
        res.status(400).json({ error: "Informe username e/ou nova senha." });
        return;
    }

    const profile = await query<{ id: string; user_id: string; display_name: string }>(
        `SELECT id, user_id, display_name FROM campaign_player_profiles
         WHERE id = $1 AND campaign_id = $2`,
        [param(req.params.profileId), param(req.params.campaignId)]
    );
    const row = profile.rows[0];
    if (!row) {
        res.status(404).json({ error: "Perfil não encontrado." });
        return;
    }

    const displayName = body.data.displayName?.trim() || row.display_name;
    if (body.data.displayName) {
        await query(
            `UPDATE campaign_player_profiles SET display_name = $2 WHERE id = $1`,
            [row.id, displayName]
        );
        await setUserDisplayName(row.user_id, displayName);
    }
    if (body.data.password) {
        await setUserPassword(row.user_id, body.data.password);
    }

    const user = await query<{ email: string }>(`SELECT email FROM users WHERE id = $1`, [
        row.user_id,
    ]);
    res.json({
        id: row.id,
        userId: row.user_id,
        displayName,
        email: user.rows[0]?.email ?? "",
    });
});

router.delete("/campaigns/:campaignId/players/:profileId", requireAuth, async (req, res) => {
    if (!(await requireCampaignGm(param(req.params.campaignId), req.user!.id))) {
        res.status(403).json({ error: "Somente o mestre remove perfis." });
        return;
    }

    const profile = await query<{ id: string; user_id: string }>(
        `SELECT id, user_id FROM campaign_player_profiles
         WHERE id = $1 AND campaign_id = $2`,
        [param(req.params.profileId), param(req.params.campaignId)]
    );
    const row = profile.rows[0];
    if (!row) {
        res.status(404).json({ error: "Perfil não encontrado." });
        return;
    }

    await query(`DELETE FROM campaign_player_profiles WHERE id = $1`, [row.id]);
    await query(`DELETE FROM memberships WHERE campaign_id = $1 AND user_id = $2`, [
        param(req.params.campaignId),
        row.user_id,
    ]);
    res.status(204).send();
});

router.put("/campaigns/:campaignId/owlbear-room", requireAuth, async (req, res) => {
    if (!(await requireCampaignGm(param(req.params.campaignId), req.user!.id))) {
        res.status(403).json({ error: "Somente o mestre vincula a sala." });
        return;
    }
    const body = z.object({ obrRoomId: z.string().min(1) }).safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const obrRoomId = parseOwlbearRoomId(body.data.obrRoomId);
    if (!obrRoomId) {
        res.status(400).json({ error: "ID da sala inválido." });
        return;
    }

    await query(
        `INSERT INTO campaign_owlbear_rooms (campaign_id, obr_room_id)
         VALUES ($1, $2)
         ON CONFLICT (obr_room_id)
         DO UPDATE SET campaign_id = EXCLUDED.campaign_id, linked_at = NOW()`,
        [param(req.params.campaignId), obrRoomId]
    );
    const rooms = await listCampaignOwlbearRooms(param(req.params.campaignId));
    res.json({ campaignId: param(req.params.campaignId), obrRoomId, rooms });
});

router.get("/campaigns/:campaignId/owlbear-room", requireAuth, async (req, res) => {
    const membership = await query(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [param(req.params.campaignId), req.user!.id]
    );
    if (!membership.rows[0]) {
        res.status(403).json({ error: "Sem acesso." });
        return;
    }
    const rooms = await listCampaignOwlbearRooms(param(req.params.campaignId));
    res.json({
        campaignId: param(req.params.campaignId),
        obrRoomId: rooms[0] ?? null,
        rooms,
    });
});

router.delete("/campaigns/:campaignId/owlbear-room/:obrRoomId", requireAuth, async (req, res) => {
    if (!(await requireCampaignGm(param(req.params.campaignId), req.user!.id))) {
        res.status(403).json({ error: "Somente o mestre desvincula a sala." });
        return;
    }
    const obrRoomId = parseOwlbearRoomId(param(req.params.obrRoomId));
    if (!obrRoomId) {
        res.status(400).json({ error: "ID da sala inválido." });
        return;
    }
    await query(
        `DELETE FROM campaign_owlbear_rooms WHERE campaign_id = $1 AND obr_room_id = $2`,
        [param(req.params.campaignId), obrRoomId]
    );
    res.status(204).send();
});

router.get("/owlbear/rooms/:obrRoomId/profiles", async (req, res) => {
    const obrRoomId = parseOwlbearRoomId(param(req.params.obrRoomId));
    const link = await query<{ campaign_id: string; name: string }>(
        `SELECT r.campaign_id, c.name
         FROM campaign_owlbear_rooms r
         JOIN campaigns c ON c.id = r.campaign_id
         WHERE r.obr_room_id = $1
            OR r.obr_room_id LIKE '%/room/' || $1 || '/%'
            OR r.obr_room_id LIKE '%/room/' || $1`,
        [obrRoomId]
    );
    const row = link.rows[0];
    if (!row) {
        res.status(404).json({ error: "Sala sem campanha vinculada." });
        return;
    }

    const profiles = await query<{
        id: string;
        user_id: string;
        display_name: string;
    }>(
        `SELECT id, user_id, display_name
         FROM campaign_player_profiles
         WHERE campaign_id = $1
         ORDER BY display_name`,
        [row.campaign_id]
    );

    const gm = await query<{ user_id: string; display_name: string }>(
        `SELECT m.user_id, u.display_name
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.campaign_id = $1 AND m.role = 'GM'`,
        [row.campaign_id]
    );

    res.json({
        campaignId: row.campaign_id,
        campaignName: row.name,
        profiles: [
            ...gm.rows.map((entry) => ({
                id: `gm-${entry.user_id}`,
                userId: entry.user_id,
                displayName: `${entry.display_name} (Mestre)`,
                kind: "gm" as const,
            })),
            ...profiles.rows.map((entry) => ({
                id: entry.id,
                userId: entry.user_id,
                displayName: entry.display_name,
                kind: "player" as const,
            })),
        ],
    });
});

router.post("/owlbear/rooms/:obrRoomId/login", async (req, res) => {
    const body = z
        .object({
            userId: z.string().uuid(),
            password: z.string().min(1),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const obrRoomId = parseOwlbearRoomId(param(req.params.obrRoomId));
    const link = await query<{ campaign_id: string }>(
        `SELECT campaign_id FROM campaign_owlbear_rooms
         WHERE obr_room_id = $1
            OR obr_room_id LIKE '%/room/' || $1 || '/%'
            OR obr_room_id LIKE '%/room/' || $1`,
        [obrRoomId]
    );
    if (!link.rows[0]) {
        res.status(404).json({ error: "Sala sem campanha vinculada." });
        return;
    }

    const member = await query(
        `SELECT 1 FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [link.rows[0].campaign_id, body.data.userId]
    );
    if (!member.rows[0]) {
        res.status(403).json({ error: "Perfil não pertence a esta campanha." });
        return;
    }

    const userRow = await query<{
        id: string;
        email: string;
        password_hash: string;
        display_name: string;
    }>(`SELECT id, email, password_hash, display_name FROM users WHERE id = $1`, [
        body.data.userId,
    ]);
    const user = userRow.rows[0];
    if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
    }

    const ok = await bcrypt.compare(body.data.password, user.password_hash);
    if (!ok) {
        res.status(401).json({ error: "Senha incorreta." });
        return;
    }

    const token = await createSession(user.id);
    res.json({
        token,
        user: { id: user.id, email: user.email, displayName: user.display_name },
        campaignId: link.rows[0].campaign_id,
    });
});

router.get("/campaigns/:campaignId/initiative", requireAuth, async (req, res) => {
    const membership = await query(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [param(req.params.campaignId), req.user!.id]
    );
    if (!membership.rows[0]) {
        res.status(403).json({ error: "Sem acesso." });
        return;
    }

    const result = await query<{
        id: string;
        campaign_id: string;
        character_id: string | null;
        label: string;
        value: number;
        sort_order: number;
    }>(
        `SELECT * FROM initiative_entries WHERE campaign_id = $1 ORDER BY sort_order, value DESC`,
        [param(req.params.campaignId)]
    );
    res.json(
        result.rows.map((row) => ({
            id: row.id,
            campaignId: row.campaign_id,
            characterId: row.character_id,
            label: row.label,
            value: row.value,
            order: row.sort_order,
        }))
    );
});

router.put("/campaigns/:campaignId/initiative", requireAuth, async (req, res) => {
    const membership = await query<{ role: string }>(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [param(req.params.campaignId), req.user!.id]
    );
    if (membership.rows[0]?.role !== "GM") {
        res.status(403).json({ error: "Somente o mestre altera a iniciativa." });
        return;
    }

    const body = z
        .object({
            entries: z.array(
                z.object({
                    id: z.string().uuid().optional(),
                    characterId: z.string().uuid().nullable().optional(),
                    label: z.string(),
                    value: z.number().int(),
                    order: z.number().int(),
                })
            ),
        })
        .safeParse(req.body);
    if (!body.success) {
        res.status(400).json({ error: "Dados inválidos." });
        return;
    }

    const campaignId = param(req.params.campaignId);
    await query(`DELETE FROM initiative_entries WHERE campaign_id = $1`, [campaignId]);

    const saved = [];
    for (const entry of body.data.entries) {
        const id = entry.id ?? randomUUID();
        await query(
            `INSERT INTO initiative_entries (id, campaign_id, character_id, label, value, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, campaignId, entry.characterId ?? null, entry.label, entry.value, entry.order]
        );
        saved.push({
            id,
            campaignId,
            characterId: entry.characterId ?? null,
            label: entry.label,
            value: entry.value,
            order: entry.order,
        });
    }

    realtimeHub.broadcast(campaignId, {
        type: "initiative.updated",
        campaignId,
    });

    res.json(saved);
});
