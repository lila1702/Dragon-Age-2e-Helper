export interface DicePlusRollEnvelope {
    orderedD6: number[];
    totalValue: number;
}

export interface TokenBarValue {
    current: number;
    max: number;
    color: "red" | "blue";
}
