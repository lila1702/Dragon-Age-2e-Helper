import OBR from "@owlbear-rodeo/sdk";

import type { ResourcePair, TabletopBridge, TabletopPlayer } from "@dragon-age/domain";

import { owlbearService } from "../owlbear/OwlbearService";
import { showOwlbearNotification } from "../owlbear/rollNotification";

export class OwlbearBridge implements TabletopBridge {
    async currentPlayer(): Promise<TabletopPlayer | null> {
        if (!OBR.isAvailable || !OBR.isReady) return null;
        const role = await OBR.player.getRole();
        return {
            id: OBR.player.id,
            role: role === "GM" ? "GM" : "PLAYER",
        };
    }

    async selectedToken(): Promise<string | null> {
        const selection = await owlbearService.resolveActiveToken();
        return selection.tokenId;
    }

    async pushBars(tokenId: string, hp: ResourcePair, mp: ResourcePair): Promise<void> {
        await owlbearService.updateTokenTrackers(
            tokenId,
            hp.current,
            hp.max,
            mp.current,
            mp.max
        );
    }

    async notify(
        message: string,
        variant: "INFO" | "WARNING" | "ERROR" = "INFO"
    ): Promise<void> {
        await showOwlbearNotification(message, variant);
    }
}
