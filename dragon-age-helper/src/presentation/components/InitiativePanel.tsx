import { useEffect, useState } from "react";

import type { InitiativeRecord } from "@dragon-age/client";

import { api } from "../../infrastructure/api/api";

interface InitiativePanelProps {
    campaignId: string | null;
    enabled: boolean;
}

export function InitiativePanel({ campaignId, enabled }: InitiativePanelProps) {
    const [entries, setEntries] = useState<InitiativeRecord[]>([]);

    useEffect(() => {
        if (!campaignId || !enabled) {
            setEntries([]);
            return;
        }
        void api.listInitiative(campaignId).then(setEntries).catch(() => setEntries([]));
    }, [campaignId, enabled]);

    if (!enabled || !campaignId) return null;

    return (
        <div className="token-bar" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
            <strong>Iniciativa</strong>
            {entries.length === 0 && <span>Nenhuma entrada.</span>}
            {entries.map((entry) => (
                <div key={entry.id} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{entry.label}</span>
                    <strong>{entry.value}</strong>
                </div>
            ))}
        </div>
    );
}
