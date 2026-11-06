import type { CharacterRecord, InitiativeRecord } from "@dragon-age/client";

import { api } from "./api";

interface InitiativePanelProps {
    campaignId: string;
    entries: InitiativeRecord[];
    characters: CharacterRecord[];
    onChange: (entries: InitiativeRecord[]) => void;
}

export function InitiativePanel({
    campaignId,
    entries,
    characters,
    onChange,
}: InitiativePanelProps) {
    const save = async (next: InitiativeRecord[]) => {
        const saved = await api.setInitiative(
            campaignId,
            next.map((entry) => ({
                id: entry.id,
                characterId: entry.characterId,
                label: entry.label,
                value: entry.value,
                order: entry.order,
            }))
        );
        onChange(saved);
    };

    return (
        <div className="initiative">
            <strong>Iniciativa</strong>
            {entries.map((entry, index) => (
                <div className="initiative__row" key={entry.id}>
                    <input
                        value={entry.label}
                        onChange={(event) => {
                            const next = entries.map((item) =>
                                item.id === entry.id ? { ...item, label: event.target.value } : item
                            );
                            onChange(next);
                        }}
                        onBlur={() => void save(entries)}
                    />
                    <input
                        type="number"
                        value={entry.value}
                        onChange={(event) => {
                            const next = entries.map((item) =>
                                item.id === entry.id
                                    ? { ...item, value: Number(event.target.value) || 0 }
                                    : item
                            );
                            onChange(next);
                        }}
                        onBlur={() => void save(entries)}
                    />
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                            const next = entries.filter((item) => item.id !== entry.id);
                            void save(next);
                        }}
                    >
                        ×
                    </button>
                    <span style={{ display: "none" }}>{index}</span>
                </div>
            ))}
            <button
                type="button"
                onClick={() => {
                    const character = characters[0];
                    const next: InitiativeRecord[] = [
                        ...entries,
                        {
                            id: crypto.randomUUID(),
                            campaignId,
                            characterId: character?.id ?? null,
                            label: character?.name || "Combatente",
                            value: 0,
                            order: entries.length,
                        },
                    ];
                    void save(next);
                }}
            >
                Adicionar à iniciativa
            </button>
        </div>
    );
}
