import type OBR from "@owlbear-rodeo/sdk";

export interface DicePlusDieSpec {
    die: "D6";
    count: number;
    name: string;
}

export interface DicePlusRollEnvelope {
    orderedD6: number[];
    totalValue: number;
}

export interface TokenBarValue {
    current: number;
    max: number;
    color: "red" | "blue";
}

export type OwlbearSdkWithDice = typeof OBR & {
    dice: {
        roll(spec: DicePlusDieSpec[]): Promise<DicePlusRollEnvelope>;
    };
};
