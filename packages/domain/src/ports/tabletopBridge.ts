export interface TabletopPlayer {
    id: string;
    role: "GM" | "PLAYER";
}

export interface ResourcePair {
    current: number;
    max: number;
}

export interface TabletopBridge {
    currentPlayer(): Promise<TabletopPlayer | null>;
    selectedToken(): Promise<string | null>;
    pushBars(tokenId: string, hp: ResourcePair, mp: ResourcePair): Promise<void>;
    notify(message: string, variant?: "INFO" | "WARNING" | "ERROR"): Promise<void>;
}
