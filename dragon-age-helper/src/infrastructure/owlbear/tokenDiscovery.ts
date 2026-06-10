import OBR from "@owlbear-rodeo/sdk";

import { isTokenOwner } from "./tokenAccess";

export async function tokenExistsInScene(tokenId: string): Promise<boolean> {
    const items = await OBR.scene.items.getItems([tokenId]);
    return items.length > 0;
}

export async function findOwnedTokenIds(playerId: string): Promise<string[]> {
    const items = await OBR.scene.items.getItems();
    return items.filter((item) => isTokenOwner(item, playerId)).map((item) => item.id);
}
