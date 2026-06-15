import OBR from "@owlbear-rodeo/sdk";
import { calculateDicePlusStunt } from "../../domain/entities/diceRules";
import { normalizeCharacterSheet } from "../../domain/entities/normalizeCharacterSheet";

import { METADATA_KEYS, SCHEMA_VERSION } from "./metadataKeys";
import { SELECTION_ERRORS } from "./selectionErrors";
import { applySheetMetadataToItem } from "./applySheetToItem";
import { devDiceRoll, devGenericDiceRoll } from "./devDiceRoll";
import { rollDicePlus, rollDicePlusGeneric } from "./dicePlusClient";
import {
    clearPinnedToken,
    readPinnedToken,
    writePinnedToken,
} from "./pinnedTokenStorage";
import { findOwnedTokenIds, tokenExistsInScene } from "./tokenDiscovery";
import { resolveCanEditToken } from "./tokenAccess";
import { setTokenBarValues } from "./tokenBars";

import type { IOwlbearService, SelectionResult } from "./IOwlbearService";
import {
    buildAttributeTestDiceNotation,
    getAttributeRollBreakdown,
} from "../../domain/entities/attributeRoll";

import {
    buildAttackRollModifiers,
    buildAttackTestDiceNotation,
    buildDamageRollNotationForDicePlus,
    computeDamageRawTotal,
    halveDamageTotal,
} from "../../domain/entities/attackRoll";

import type { AttackRollOptions, DamageRollResult } from "../../domain/entities/attackRoll";

import type { AttributeRollOptions } from "../../domain/entities/attributeRoll";
import type { Attribute, CharacterSheet } from "../../domain/entities/characterSheet";
import type { StuntRollResult } from "../../domain/entities/diceRules";

export class OwlbearService implements IOwlbearService {
    onReady(callback: () => void): void {
        OBR.onReady(() => {
            console.log("Owlbear Rodeo SDK is ready.");
            callback();
        });
    }

    async resolveSelection(): Promise<SelectionResult> {
        return this.resolveActiveToken();
    }

    async resolveActiveToken(): Promise<SelectionResult> {
        const selection = (await OBR.player.getSelection()) ?? [];
        const playerId = OBR.player.id;
        const roomId = OBR.room.id;

        if (selection.length > 1) {
            return { tokenId: null, error: SELECTION_ERRORS.MULTIPLE };
        }

        if (selection.length === 1) {
            const tokenId = selection[0];
            writePinnedToken(roomId, playerId, tokenId);
            return { tokenId, error: SELECTION_ERRORS.NONE };
        }

        let pinned = readPinnedToken(roomId, playerId);
        if (pinned && !(await tokenExistsInScene(pinned))) {
            clearPinnedToken(roomId, playerId);
            pinned = null;
        }

        if (pinned) {
            return { tokenId: pinned, error: SELECTION_ERRORS.NONE };
        }

        const role = await OBR.player.getRole();
        if (role !== "GM") {
            const ownedIds = await findOwnedTokenIds(playerId);
            if (ownedIds.length === 1) {
                const tokenId = ownedIds[0];
                writePinnedToken(roomId, playerId, tokenId);
                return { tokenId, error: SELECTION_ERRORS.NONE };
            }
        }

        return { tokenId: null, error: SELECTION_ERRORS.NO_TOKEN };
    }

    async getTokenDisplayName(tokenId: string): Promise<string | null> {
        const items = await OBR.scene.items.getItems([tokenId]);
        const item = items[0];
        if (!item) return null;
        return item.name?.trim() || null;
    }

    async isCurrentPlayerGm(): Promise<boolean> {
        const role = await OBR.player.getRole();
        return role === "GM";
    }

    async canEditToken(tokenId: string): Promise<boolean> {
        return resolveCanEditToken(tokenId);
    }

    async rollAttributeTest(
        attribute: Attribute,
        options?: AttributeRollOptions
    ): Promise<StuntRollResult> {
        const breakdown = getAttributeRollBreakdown(attribute, options);
        const diceNotation = buildAttributeTestDiceNotation(breakdown);

        const results = OBR.isAvailable
            ? await rollDicePlus(diceNotation)
            : devDiceRoll();

        const diceTotal = results.orderedD6.reduce((sum, value) => sum + value, 0);
        const modifierTotal =
            breakdown.attributeValue + breakdown.focusBonus + breakdown.situationalModifier;

        return calculateDicePlusStunt(
            results.orderedD6,
            diceTotal + modifierTotal,
            {
                attribute: breakdown.attributeValue,
                focus: breakdown.focusBonus,
                situational: breakdown.situationalModifier,
            }
        );
    }

    async rollAttackTest(
        attackBonus: number | null,
        options?: AttackRollOptions
    ): Promise<StuntRollResult> {
        const situationalModifier = options?.situationalModifier ?? 0;
        const diceNotation = buildAttackTestDiceNotation(attackBonus, situationalModifier);
        const modifiers = buildAttackRollModifiers(attackBonus, situationalModifier);

        const results = OBR.isAvailable
            ? await rollDicePlus(diceNotation)
            : devDiceRoll();

        const diceTotal = results.orderedD6.reduce((sum, value) => sum + value, 0);
        const modifierTotal = (attackBonus ?? 0) + situationalModifier;

        return calculateDicePlusStunt(results.orderedD6, diceTotal + modifierTotal, modifiers);
    }

    async rollDamageTest(
        fullDamage: string,
        halve: boolean,
        options?: AttackRollOptions
    ): Promise<DamageRollResult> {
        const situationalModifier = options?.situationalModifier ?? 0;
        const diceNotation = buildDamageRollNotationForDicePlus(
            fullDamage,
            situationalModifier,
            halve
        );
        if (!diceNotation) {
            throw new Error("Notação de dano inválida para rolagem.");
        }

        const results = OBR.isAvailable
            ? await rollDicePlusGeneric(diceNotation)
            : devGenericDiceRoll(diceNotation);

        const rawTotal = computeDamageRawTotal(
            results.diceValues,
            fullDamage,
            situationalModifier
        );
        const total = halve ? halveDamageTotal(rawTotal) : results.totalValue;

        return {
            diceValues: results.diceValues,
            total,
            rawTotal,
            halved: halve,
        };
    }

    async loadCharacterSheet(tokenId: string): Promise<CharacterSheet | null> {
        const items = await OBR.scene.items.getItems([tokenId]);
        const item = items[0];
        if (!item) return null;

        let raw: unknown = item.metadata?.[METADATA_KEYS.SHEET];
        if (raw === undefined || raw === null) return null;

        if (typeof raw === "string") {
            try {
                raw = JSON.parse(raw) as unknown;
            } catch {
                console.warn("Metadata da ficha não é JSON válido:", raw);
                return null;
            }
        }

        return normalizeCharacterSheet(raw, tokenId);
    }

    async saveCharacterSheet(tokenId: string, sheet: CharacterSheet): Promise<void> {
        const sheetToSave: CharacterSheet = {
            ...sheet,
            tokenId,
        };

        const items = await OBR.scene.items.getItems([tokenId]);
        if (items.length === 0) {
            throw new Error("Token não encontrado na cena.");
        }

        const actingPlayerId = OBR.player.id;

        try {
            await OBR.scene.items.updateItems(items, (draft) => {
                for (const item of draft) {
                    applySheetMetadataToItem(item, sheetToSave, actingPlayerId);
                }
                return draft;
            });
        } catch (error) {
            console.error("Falha ao gravar metadata no token:", error);

            try {
                await OBR.scene.items.updateItems(items, (draft) => {
                    for (const item of draft) {
                        const existingOwner = item.createdUserId ?? actingPlayerId;
                        item.metadata = {
                            ...item.metadata,
                            [METADATA_KEYS.SHEET]: JSON.parse(
                                JSON.stringify(sheetToSave)
                            ) as CharacterSheet,
                            [METADATA_KEYS.SCHEMA_VERSION]: SCHEMA_VERSION,
                            [METADATA_KEYS.TRACKERS]: {
                                hp: { current: sheetToSave.hpCurrent, max: sheetToSave.hpMax },
                                mp: { current: sheetToSave.mpCurrent, max: sheetToSave.mpMax },
                            },
                            [METADATA_KEYS.OWNER_PLAYER_ID]: existingOwner,
                        };
                    }
                    return draft;
                });
            } catch (retryError) {
                console.error("Falha ao gravar ficha (sem barras HP/MP):", retryError);
                throw retryError instanceof Error
                    ? retryError
                    : new Error("Não foi possível salvar a ficha neste token.");
            }
        }
    }

    async updateTokenTrackers(
        tokenId: string,
        hpCurrent: number,
        hpMax: number,
        mpCurrent: number,
        mpMax: number
    ): Promise<void> {
        const items = await OBR.scene.items.getItems([tokenId]);
        if (items.length === 0) return;

        await OBR.scene.items.updateItems(items, (draft) => {
            for (const item of draft) {
                item.metadata = {
                    ...item.metadata,
                    [METADATA_KEYS.TRACKERS]: {
                        hp: { current: hpCurrent, max: hpMax },
                        mp: { current: mpCurrent, max: mpMax },
                    },
                };

                setTokenBarValues(item, hpCurrent, hpMax, mpCurrent, mpMax);
            }
            return draft;
        });
    }
}

export const owlbearService = new OwlbearService();
