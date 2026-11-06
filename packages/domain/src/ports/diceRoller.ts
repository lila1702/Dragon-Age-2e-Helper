export interface RolledDie {
    value: number;
    faces: number;
    /** Marks the AGE stunt die (Dragon Die). */
    stunt?: boolean;
    label?: string;
}

export interface RollRequest {
    notation: string;
    label?: string;
}

export interface DiceRoller {
    id: string;
    roll(request: RollRequest): Promise<RolledDie[]>;
}
