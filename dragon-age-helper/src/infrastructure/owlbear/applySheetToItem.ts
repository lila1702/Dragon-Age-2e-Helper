import { METADATA_KEYS, SCHEMA_VERSION } from "./metadataKeys";
import { readMetadataOwnerId } from "./tokenAccess";
import { setTokenBarValues } from "./tokenBars";

import type { Item } from "@owlbear-rodeo/sdk";
import type { CharacterSheet } from "../../domain/entities/characterSheet";

export function applySheetMetadataToItem(
    item: Item,
    sheetToSave: CharacterSheet,
    actingPlayerId: string
): void {
    const ownerId = item.createdUserId ?? readMetadataOwnerId(item) ?? actingPlayerId;

    item.metadata = {
        ...item.metadata,
        [METADATA_KEYS.SHEET]: JSON.parse(JSON.stringify(sheetToSave)) as CharacterSheet,
        [METADATA_KEYS.SCHEMA_VERSION]: SCHEMA_VERSION,
        [METADATA_KEYS.TRACKERS]: {
            hp: { current: sheetToSave.hpCurrent, max: sheetToSave.hpMax },
            mp: { current: sheetToSave.mpCurrent, max: sheetToSave.mpMax },
        },
        [METADATA_KEYS.OWNER_PLAYER_ID]: ownerId,
    };

    setTokenBarValues(
        item,
        sheetToSave.hpCurrent,
        sheetToSave.hpMax,
        sheetToSave.mpCurrent,
        sheetToSave.mpMax
    );
}
