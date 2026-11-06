import { randomUUID } from "node:crypto";

import {
    applySheetPatch,
    normalizeCharacterSheet,
    type CharacterSheet,
    type SheetPatch,
} from "@dragon-age/domain";

import { query } from "./db.js";
import type { AuthUser } from "./auth.js";

export interface CharacterRow {
    id: string;
    campaign_id: string;
    owner_user_id: string;
    ruleset_id: string;
    revision: number;
    sheet: CharacterSheet;
    name: string;
    status?: string;
    assigned_player_user_id?: string | null;
}

export function toCharacterDto(row: CharacterRow) {
    const sheet =
        typeof row.sheet === "string"
            ? (JSON.parse(row.sheet) as CharacterSheet)
            : row.sheet;
    return {
        id: row.id,
        campaignId: row.campaign_id,
        ownerUserId: row.owner_user_id,
        assignedPlayerUserId: row.assigned_player_user_id ?? null,
        status: (row.status === "inactive" ? "inactive" : "active") as "active" | "inactive",
        rulesetId: row.ruleset_id,
        revision: row.revision,
        sheet,
        name: row.name || sheet.name || "",
    };
}

export async function canEditCharacter(
    user: AuthUser,
    characterId: string
): Promise<CharacterRow | null> {
    const result = await query<CharacterRow & { role: string | null }>(
        `SELECT c.*, m.role
         FROM characters c
         LEFT JOIN memberships m
           ON m.campaign_id = c.campaign_id AND m.user_id = $2
         WHERE c.id = $1`,
        [characterId, user.id]
    );
    const row = result.rows[0];
    if (!row) return null;
    if (
        row.owner_user_id === user.id ||
        row.assigned_player_user_id === user.id ||
        row.role === "GM"
    ) {
        return row;
    }
    return null;
}

export async function canReadCharacter(
    user: AuthUser,
    characterId: string
): Promise<CharacterRow | null> {
    const result = await query<CharacterRow & { role: string | null }>(
        `SELECT c.*, m.role
         FROM characters c
         LEFT JOIN memberships m
           ON m.campaign_id = c.campaign_id AND m.user_id = $2
         WHERE c.id = $1`,
        [characterId, user.id]
    );
    const row = result.rows[0];
    if (!row) return null;
    if (
        row.owner_user_id === user.id ||
        row.assigned_player_user_id === user.id ||
        row.role === "GM" ||
        row.role === "PLAYER"
    ) {
        return row;
    }
    return null;
}

export async function createCharacter(
    user: AuthUser,
    campaignId: string,
    sheetInput: CharacterSheet,
    characterId?: string
): Promise<CharacterRow> {
    const membership = await query(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [campaignId, user.id]
    );
    if (!membership.rows[0]) {
        throw Object.assign(new Error("Sem acesso à campanha."), { status: 403 });
    }

    const campaign = await query<{ ruleset_id: string }>(
        `SELECT ruleset_id FROM campaigns WHERE id = $1`,
        [campaignId]
    );
    const rulesetId = campaign.rows[0]?.ruleset_id;
    if (!rulesetId) {
        throw Object.assign(new Error("Campanha não encontrada."), { status: 404 });
    }

    const id = characterId ?? sheetInput.id ?? randomUUID();
    const sheet =
        normalizeCharacterSheet({ ...sheetInput, id }, sheetInput.tokenId ?? "") ??
        ({ ...sheetInput, id } as CharacterSheet);
    await query(
        `INSERT INTO characters (
            id, campaign_id, owner_user_id, ruleset_id, revision, sheet, name, status
         ) VALUES ($1, $2, $3, $4, 1, $5::jsonb, $6, 'active')`,
        [id, campaignId, user.id, rulesetId, JSON.stringify(sheet), sheet.name ?? ""]
    );

    const created = await query<CharacterRow>(`SELECT * FROM characters WHERE id = $1`, [id]);
    return created.rows[0];
}

export async function duplicateCharacter(
    user: AuthUser,
    characterId: string
): Promise<CharacterRow> {
    const source = await canEditCharacter(user, characterId);
    if (!source) {
        throw Object.assign(new Error("Sem permissão para duplicar."), { status: 403 });
    }
    const sheet =
        typeof source.sheet === "string"
            ? (JSON.parse(source.sheet) as CharacterSheet)
            : structuredClone(source.sheet);
    const id = randomUUID();
    const nameBase = (source.name || sheet.name || "Ficha").trim() || "Ficha";
    sheet.id = id;
    sheet.tokenId = "";
    sheet.name = `${nameBase} (cópia)`;
    return createCharacter(user, source.campaign_id, sheet, id);
}

export async function setCharacterStatus(
    user: AuthUser,
    characterId: string,
    status: "active" | "inactive"
): Promise<CharacterRow> {
    const editable = await canEditCharacter(user, characterId);
    if (!editable) {
        throw Object.assign(new Error("Sem permissão."), { status: 403 });
    }
    const membership = await query<{ role: string }>(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [editable.campaign_id, user.id]
    );
    if (membership.rows[0]?.role !== "GM") {
        throw Object.assign(new Error("Somente o mestre altera status da ficha."), { status: 403 });
    }
    const result = await query<CharacterRow>(
        `UPDATE characters SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [characterId, status]
    );
    return result.rows[0];
}

export async function assignCharacterPlayer(
    user: AuthUser,
    characterId: string,
    playerUserId: string | null
): Promise<CharacterRow> {
    const editable = await canEditCharacter(user, characterId);
    if (!editable) {
        throw Object.assign(new Error("Sem permissão."), { status: 403 });
    }
    const membership = await query<{ role: string }>(
        `SELECT role FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
        [editable.campaign_id, user.id]
    );
    if (membership.rows[0]?.role !== "GM") {
        throw Object.assign(new Error("Somente o mestre vincula ficha a jogador."), {
            status: 403,
        });
    }

    if (playerUserId) {
        const playerMembership = await query(
            `SELECT 1 FROM memberships WHERE campaign_id = $1 AND user_id = $2`,
            [editable.campaign_id, playerUserId]
        );
        if (!playerMembership.rows[0]) {
            throw Object.assign(new Error("Jogador não pertence à campanha."), { status: 400 });
        }
    }

    const result = await query<CharacterRow>(
        `UPDATE characters
         SET assigned_player_user_id = $2,
             owner_user_id = COALESCE($2, owner_user_id),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [characterId, playerUserId]
    );
    return result.rows[0];
}

export async function replaceCharacter(
    user: AuthUser,
    characterId: string,
    revision: number,
    sheetInput: CharacterSheet
): Promise<CharacterRow> {
    const editable = await canEditCharacter(user, characterId);
    if (!editable) {
        throw Object.assign(new Error("Sem permissão para editar."), { status: 403 });
    }
    if (editable.revision !== revision) {
        throw Object.assign(new Error("Revisão desatualizada."), {
            status: 409,
            snapshot: toCharacterDto(editable),
        });
    }

    const sheet =
        normalizeCharacterSheet({ ...sheetInput, id: characterId }, sheetInput.tokenId ?? "") ??
        ({ ...sheetInput, id: characterId } as CharacterSheet);
    const result = await query<CharacterRow>(
        `UPDATE characters
         SET sheet = $2::jsonb, name = $3, revision = revision + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [characterId, JSON.stringify(sheet), sheet.name ?? ""]
    );
    return result.rows[0];
}

export async function applyCharacterPatch(
    user: AuthUser,
    patch: SheetPatch
): Promise<{ row: CharacterRow; applied: SheetPatch }> {
    const editable = await canEditCharacter(user, patch.characterId);
    if (!editable) {
        throw Object.assign(new Error("Sem permissão para editar."), { status: 403 });
    }

    if (patch.baseRevision !== editable.revision) {
        throw Object.assign(new Error("Revisão desatualizada."), {
            status: 409,
            snapshot: toCharacterDto(editable),
        });
    }

    const nextSheet = applySheetPatch(editable.sheet, patch.path, patch.value);
    const result = await query<CharacterRow>(
        `UPDATE characters
         SET sheet = $2::jsonb, name = $3, revision = revision + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [patch.characterId, JSON.stringify(nextSheet), nextSheet.name ?? ""]
    );

    return { row: result.rows[0], applied: patch };
}
