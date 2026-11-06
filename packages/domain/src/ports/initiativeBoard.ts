export interface InitiativeEntry {
    id: string;
    campaignId: string;
    characterId: string | null;
    label: string;
    value: number;
    order: number;
}

export interface InitiativeBoard {
    list(campaignId: string): Promise<InitiativeEntry[]>;
    set(campaignId: string, entries: InitiativeEntry[]): Promise<void>;
}
