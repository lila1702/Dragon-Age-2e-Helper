import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { getPool } from "../db/pool.js";
import type { CharacterRecord, CharacterSheetPayload } from "../schemas/characterSheet.js";
import {
    assembleCharacterSheet,
    disassembleCharacterSheet,
    type CharacterChildren,
    type CharacterMainRow,
} from "./characterAssembler.js";

interface CharacterRow extends RowDataPacket, CharacterMainRow {
    sheet_json: CharacterSheetPayload | null;
}

function toIsoString(value: Date): string {
    return value.toISOString();
}

async function hasRelationalData(
    connection: PoolConnection,
    characterId: string
): Promise<boolean> {
    const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT 1 FROM character_attributes WHERE character_id = ? LIMIT 1",
        [characterId]
    );
    return rows.length > 0;
}

async function loadChildren(connection: PoolConnection, characterId: string): Promise<CharacterChildren> {
    const [attributes] = await connection.query<RowDataPacket[]>(
        `SELECT abbreviation, name, value, is_primary, focus_bonus, active_focus_name, sort_order
         FROM character_attributes WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );
    const [focuses] = await connection.query<RowDataPacket[]>(
        `SELECT attribute_abbreviation, focus_name, sort_order
         FROM character_focuses WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );
    const [meleeAttacks] = await connection.query<RowDataPacket[]>(
        `SELECT id, name, attribute_abbreviation, damage_attribute_abbreviation, weapon_group, damage, sort_order
         FROM melee_attacks WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );
    const [rangedAttacks] = await connection.query<RowDataPacket[]>(
        `SELECT id, name, attribute_abbreviation, damage_attribute_abbreviation, weapon_group, damage,
                short_range, long_range, reload, sort_order
         FROM ranged_attacks WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );
    const [classAbilities] = await connection.query<RowDataPacket[]>(
        `SELECT id, name, description, sort_order
         FROM class_abilities WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );
    const [talents] = await connection.query<RowDataPacket[]>(
        `SELECT id, name, benefit_novato, benefit_experiente, benefit_mestre, sort_order
         FROM talents WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );
    const [arcanaSpecializations] = await connection.query<RowDataPacket[]>(
        `SELECT id, name, benefit_novato, benefit_experiente, benefit_mestre, sort_order
         FROM arcana_specializations WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );
    const [spells] = await connection.query<RowDataPacket[]>(
        `SELECT id, degree, name, school, arcana, cost, spell_time, tn, spell_test, description, sort_order
         FROM spells WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );
    const [inventoryItems] = await connection.query<RowDataPacket[]>(
        `SELECT id, name, sale_value, description, quantity, sort_order
         FROM inventory_items WHERE character_id = ? ORDER BY sort_order`,
        [characterId]
    );

    return {
        attributes: attributes as CharacterChildren["attributes"],
        focuses: focuses as CharacterChildren["focuses"],
        meleeAttacks: meleeAttacks as CharacterChildren["meleeAttacks"],
        rangedAttacks: rangedAttacks as CharacterChildren["rangedAttacks"],
        classAbilities: classAbilities as CharacterChildren["classAbilities"],
        talents: talents as CharacterChildren["talents"],
        arcanaSpecializations: arcanaSpecializations as CharacterChildren["arcanaSpecializations"],
        spells: spells as CharacterChildren["spells"],
        inventoryItems: inventoryItems as CharacterChildren["inventoryItems"],
    };
}

async function loadCharacterRow(
    connection: PoolConnection,
    id: string
): Promise<CharacterRow | null> {
    const [rows] = await connection.query<CharacterRow[]>(
        `SELECT id, token_id, name, historico, class_name, level, idade, sexo,
                speed, defense, armor, armor_penalty,
                hp_current, hp_max, mp_current, mp_max,
                weapon_groups, lut_uses_willpower, arcane_warrior_option,
                currency_copper, currency_silver, currency_gold,
                sheet_json, created_at, updated_at
         FROM characters WHERE id = ?`,
        [id]
    );

    return rows[0] ?? null;
}

function toCharacterRecord(main: CharacterMainRow, sheet: CharacterSheetPayload): CharacterRecord {
    return {
        id: main.id,
        sheet,
        createdAt: toIsoString(main.created_at),
        updatedAt: toIsoString(main.updated_at),
    };
}

async function saveChildren(
    connection: PoolConnection,
    characterId: string,
    children: CharacterChildren
): Promise<void> {
    await connection.query("DELETE FROM character_attributes WHERE character_id = ?", [characterId]);
    await connection.query("DELETE FROM character_focuses WHERE character_id = ?", [characterId]);
    await connection.query("DELETE FROM melee_attacks WHERE character_id = ?", [characterId]);
    await connection.query("DELETE FROM ranged_attacks WHERE character_id = ?", [characterId]);
    await connection.query("DELETE FROM class_abilities WHERE character_id = ?", [characterId]);
    await connection.query("DELETE FROM talents WHERE character_id = ?", [characterId]);
    await connection.query("DELETE FROM arcana_specializations WHERE character_id = ?", [characterId]);
    await connection.query("DELETE FROM spells WHERE character_id = ?", [characterId]);
    await connection.query("DELETE FROM inventory_items WHERE character_id = ?", [characterId]);

    for (const attr of children.attributes) {
        await connection.query(
            `INSERT INTO character_attributes
                (character_id, abbreviation, name, value, is_primary, focus_bonus, active_focus_name, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                characterId,
                attr.abbreviation,
                attr.name,
                attr.value,
                attr.is_primary,
                attr.focus_bonus,
                attr.active_focus_name,
                attr.sort_order,
            ]
        );
    }

    for (const focus of children.focuses) {
        await connection.query(
            `INSERT INTO character_focuses (character_id, attribute_abbreviation, focus_name, sort_order)
             VALUES (?, ?, ?, ?)`,
            [characterId, focus.attribute_abbreviation, focus.focus_name, focus.sort_order]
        );
    }

    for (const attack of children.meleeAttacks) {
        await connection.query(
            `INSERT INTO melee_attacks
                (id, character_id, name, attribute_abbreviation, damage_attribute_abbreviation, weapon_group, damage, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                attack.id,
                characterId,
                attack.name,
                attack.attribute_abbreviation,
                attack.damage_attribute_abbreviation,
                attack.weapon_group,
                attack.damage,
                attack.sort_order,
            ]
        );
    }

    for (const attack of children.rangedAttacks) {
        await connection.query(
            `INSERT INTO ranged_attacks
                (id, character_id, name, attribute_abbreviation, damage_attribute_abbreviation, weapon_group, damage,
                 short_range, long_range, reload, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                attack.id,
                characterId,
                attack.name,
                attack.attribute_abbreviation,
                attack.damage_attribute_abbreviation,
                attack.weapon_group,
                attack.damage,
                attack.short_range,
                attack.long_range,
                attack.reload,
                attack.sort_order,
            ]
        );
    }

    for (const ability of children.classAbilities) {
        await connection.query(
            `INSERT INTO class_abilities (id, character_id, name, description, sort_order)
             VALUES (?, ?, ?, ?, ?)`,
            [ability.id, characterId, ability.name, ability.description, ability.sort_order]
        );
    }

    for (const talent of children.talents) {
        await connection.query(
            `INSERT INTO talents
                (id, character_id, name, benefit_novato, benefit_experiente, benefit_mestre, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                talent.id,
                characterId,
                talent.name,
                talent.benefit_novato,
                talent.benefit_experiente,
                talent.benefit_mestre,
                talent.sort_order,
            ]
        );
    }

    for (const spec of children.arcanaSpecializations) {
        await connection.query(
            `INSERT INTO arcana_specializations
                (id, character_id, name, benefit_novato, benefit_experiente, benefit_mestre, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                spec.id,
                characterId,
                spec.name,
                spec.benefit_novato,
                spec.benefit_experiente,
                spec.benefit_mestre,
                spec.sort_order,
            ]
        );
    }

    for (const spell of children.spells) {
        await connection.query(
            `INSERT INTO spells
                (id, character_id, degree, name, school, arcana, cost, spell_time, tn, spell_test, description, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                spell.id,
                characterId,
                spell.degree,
                spell.name,
                spell.school,
                spell.arcana,
                spell.cost,
                spell.spell_time,
                spell.tn,
                spell.spell_test,
                spell.description,
                spell.sort_order,
            ]
        );
    }

    for (const item of children.inventoryItems) {
        await connection.query(
            `INSERT INTO inventory_items
                (id, character_id, name, sale_value, description, quantity, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                item.id,
                characterId,
                item.name,
                item.sale_value,
                item.description,
                item.quantity,
                item.sort_order,
            ]
        );
    }
}

async function upsertMainRow(
    connection: PoolConnection,
    main: ReturnType<typeof disassembleCharacterSheet>["main"]
): Promise<void> {
    await connection.query(
        `INSERT INTO characters (
            id, token_id, name, historico, class_name, level, idade, sexo,
            speed, defense, armor, armor_penalty,
            hp_current, hp_max, mp_current, mp_max,
            weapon_groups, lut_uses_willpower, arcane_warrior_option,
            currency_copper, currency_silver, currency_gold,
            sheet_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
        ON DUPLICATE KEY UPDATE
            token_id = VALUES(token_id),
            name = VALUES(name),
            historico = VALUES(historico),
            class_name = VALUES(class_name),
            level = VALUES(level),
            idade = VALUES(idade),
            sexo = VALUES(sexo),
            speed = VALUES(speed),
            defense = VALUES(defense),
            armor = VALUES(armor),
            armor_penalty = VALUES(armor_penalty),
            hp_current = VALUES(hp_current),
            hp_max = VALUES(hp_max),
            mp_current = VALUES(mp_current),
            mp_max = VALUES(mp_max),
            weapon_groups = VALUES(weapon_groups),
            lut_uses_willpower = VALUES(lut_uses_willpower),
            arcane_warrior_option = VALUES(arcane_warrior_option),
            currency_copper = VALUES(currency_copper),
            currency_silver = VALUES(currency_silver),
            currency_gold = VALUES(currency_gold),
            sheet_json = NULL`,
        [
            main.id,
            main.token_id,
            main.name,
            main.historico,
            main.class_name,
            main.level,
            main.idade,
            main.sexo,
            main.speed,
            main.defense,
            main.armor,
            main.armor_penalty,
            main.hp_current,
            main.hp_max,
            main.mp_current,
            main.mp_max,
            main.weapon_groups,
            main.lut_uses_willpower,
            main.arcane_warrior_option,
            main.currency_copper,
            main.currency_silver,
            main.currency_gold,
        ]
    );
}

export async function saveCharacterRelational(
    connection: PoolConnection,
    sheet: CharacterSheetPayload
): Promise<void> {
    const { main, children } = disassembleCharacterSheet(sheet);
    await upsertMainRow(connection, main);
    await saveChildren(connection, main.id, children);
}

async function loadCharacterRecordFromRow(
    connection: PoolConnection,
    row: CharacterRow
): Promise<CharacterRecord> {
    if (row.sheet_json && !(await hasRelationalData(connection, row.id))) {
        await connection.beginTransaction();
        try {
            await saveCharacterRelational(connection, row.sheet_json);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        }

        const refreshed = await loadCharacterRow(connection, row.id);
        if (!refreshed) {
            throw new Error("Failed to reload character after JSON backfill.");
        }
        row = refreshed;
    }

    const children = await loadChildren(connection, row.id);
    const sheet = assembleCharacterSheet(row, children);
    return toCharacterRecord(row, sheet);
}

export async function findCharacterById(id: string): Promise<CharacterRecord | null> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        const row = await loadCharacterRow(connection, id);
        if (!row) return null;
        return loadCharacterRecordFromRow(connection, row);
    } finally {
        connection.release();
    }
}

export async function insertCharacter(
    id: string,
    sheet: CharacterSheetPayload
): Promise<CharacterRecord> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const payload = { ...sheet, id };
        await saveCharacterRelational(connection, payload);
        await connection.commit();

        const created = await findCharacterById(id);
        if (!created) {
            throw new Error("Failed to load character after insert.");
        }
        return created;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export async function updateCharacter(
    id: string,
    sheet: CharacterSheetPayload,
    expectedUpdatedAt?: string
): Promise<CharacterRecord | "conflict" | null> {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        const existingRow = await loadCharacterRow(connection, id);
        if (!existingRow) return null;

        const existing = await loadCharacterRecordFromRow(connection, existingRow);
        if (expectedUpdatedAt && existing.updatedAt !== expectedUpdatedAt) {
            return "conflict";
        }

        await connection.beginTransaction();
        await saveCharacterRelational(connection, { ...sheet, id });
        await connection.commit();

        const updated = await findCharacterById(id);
        if (!updated) {
            throw new Error("Failed to load character after update.");
        }
        return updated;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
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

export async function backfillAllCharactersFromJson(): Promise<number> {
    const pool = getPool();
    const connection = await pool.getConnection();
    let migrated = 0;

    try {
        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM characters WHERE sheet_json IS NOT NULL"
        );

        for (const row of rows) {
            const characterId = String(row.id);
            const loaded = await loadCharacterRow(connection, characterId);
            if (!loaded?.sheet_json) continue;

            await connection.beginTransaction();
            await saveCharacterRelational(connection, loaded.sheet_json);
            await connection.commit();
            migrated += 1;
            console.log(`Backfilled ${characterId}`);
        }

        return migrated;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
