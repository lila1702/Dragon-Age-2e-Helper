import type { TabletopBridge } from "./tabletopBridge";

export class NoTabletop implements TabletopBridge {
    async currentPlayer() {
        return null;
    }

    async selectedToken() {
        return null;
    }

    async pushBars(): Promise<void> {
        return;
    }

    async notify(message: string): Promise<void> {
        console.info(message);
    }
}
