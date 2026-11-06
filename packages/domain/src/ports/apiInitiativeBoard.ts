import type { InitiativeBoard, InitiativeEntry } from "./initiativeBoard";

export type InitiativeApi = {
    listInitiative(campaignId: string): Promise<InitiativeEntry[]>;
    setInitiative(
        campaignId: string,
        entries: Omit<InitiativeEntry, "campaignId">[]
    ): Promise<InitiativeEntry[]>;
};

/** InitiativeBoard backed by the shared REST API. */
export class ApiInitiativeBoard implements InitiativeBoard {
    constructor(private readonly api: InitiativeApi) {}

    list(campaignId: string): Promise<InitiativeEntry[]> {
        return this.api.listInitiative(campaignId);
    }

    async set(campaignId: string, entries: InitiativeEntry[]): Promise<void> {
        await this.api.setInitiative(
            campaignId,
            entries.map((entry) => ({
                id: entry.id,
                characterId: entry.characterId,
                label: entry.label,
                value: entry.value,
                order: entry.order,
            }))
        );
    }
}
