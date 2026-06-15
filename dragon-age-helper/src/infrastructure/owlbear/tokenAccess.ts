import OBR from "@owlbear-rodeo/sdk";

import { METADATA_KEYS } from "./metadataKeys";

import type { Item } from "@owlbear-rodeo/sdk";

export function readMetadataOwnerId(item: Item): string | null {
    const metaOwner = item.metadata?.[METADATA_KEYS.OWNER_PLAYER_ID];
    if (typeof metaOwner === "string" && metaOwner.length > 0) {
        return metaOwner;
    }
    return null;
}

export function getSheetOwnerId(item: Item): string | null {
    return item.createdUserId ?? readMetadataOwnerId(item);
}

export function isTokenOwner(item: Item, playerId: string): boolean {
    return getSheetOwnerId(item) === playerId;
}

export async function resolveCanEditToken(tokenId: string): Promise<boolean> {
    const role = await OBR.player.getRole();
    if (role === "GM") return true;

    const playerId = OBR.player.id;
    const items = await OBR.scene.items.getItems([tokenId]);
    const item = items[0];
    if (!item) return false;

    if (isTokenOwner(item, playerId)) return true;

    const permissions = await OBR.room.getPermissions();
    if (!permissions.includes("CHARACTER_UPDATE")) return false;

    return !permissions.includes("CHARACTER_OWNER_ONLY");
}
