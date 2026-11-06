import { useEffect, useMemo, useRef, useState } from "react";

import type { CampaignPlayerProfile, CharacterRecord } from "@dragon-age/client";

interface CharacterListPanelProps {
    characters: CharacterRecord[];
    characterId: string | null;
    isGm: boolean;
    players: CampaignPlayerProfile[];
    onSelect: (id: string) => void;
    onCreate: () => void;
    onDuplicate: (id: string) => Promise<void>;
    onSetStatus: (id: string, status: "active" | "inactive") => Promise<void>;
    onAssignPlayer: (id: string, userId: string | null) => Promise<void>;
}

interface MenuState {
    characterId: string;
    x: number;
    y: number;
}

export function CharacterListPanel({
    characters,
    characterId,
    isGm,
    players,
    onSelect,
    onCreate,
    onDuplicate,
    onSetStatus,
    onAssignPlayer,
}: CharacterListPanelProps) {
    const [showInactive, setShowInactive] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [menu, setMenu] = useState<MenuState | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const visible = useMemo(() => {
        return characters.filter((entry) => showInactive || entry.status !== "inactive");
    }, [characters, showInactive]);

    const menuCharacter = useMemo(
        () => characters.find((entry) => entry.id === menu?.characterId) ?? null,
        [characters, menu]
    );

    useEffect(() => {
        if (!menu) return;

        const onPointerDown = (event: MouseEvent) => {
            if (menuRef.current?.contains(event.target as Node)) return;
            setMenu(null);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setMenu(null);
        };

        window.addEventListener("mousedown", onPointerDown);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("mousedown", onPointerDown);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [menu]);

    const openMenu = (id: string, clientX: number, clientY: number) => {
        const pad = 8;
        const width = 220;
        const height = 200;
        const x = Math.min(clientX, window.innerWidth - width - pad);
        const y = Math.min(clientY, window.innerHeight - height - pad);
        setMenu({ characterId: id, x: Math.max(pad, x), y: Math.max(pad, y) });
    };

    const runAction = async (id: string, action: () => Promise<void>) => {
        setBusyId(id);
        try {
            await action();
        } finally {
            setBusyId(null);
            setMenu(null);
        }
    };

    return (
        <div className="panel-block">
            <h2 className="panel-title">Fichas</h2>
            {isGm && (
                <label className="character-list__toggle">
                    <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                    />
                    Mostrar inativas
                </label>
            )}
            <div className="character-list">
                {visible.map((character) => {
                    const inactive = character.status === "inactive";
                    return (
                        <div
                            key={character.id}
                            className={`character-list__item${
                                character.id === characterId ? " is-selected" : ""
                            }${inactive ? " is-inactive" : ""}`}
                            onContextMenu={(event) => {
                                if (!isGm) return;
                                event.preventDefault();
                                openMenu(character.id, event.clientX, event.clientY);
                            }}
                        >
                            <div className="character-list__row">
                                <button
                                    type="button"
                                    className={
                                        character.id === characterId ? "is-active" : "secondary"
                                    }
                                    onClick={() => onSelect(character.id)}
                                >
                                    {character.name || "Sem nome"}
                                    {inactive ? " (inativa)" : ""}
                                </button>
                                {isGm && (
                                    <button
                                        type="button"
                                        className="character-list__menu-btn secondary"
                                        aria-label="Ações da ficha"
                                        title="Ações"
                                        disabled={busyId === character.id}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            const rect = event.currentTarget.getBoundingClientRect();
                                            openMenu(character.id, rect.right - 8, rect.bottom + 4);
                                        }}
                                    >
                                        {"\u22EE"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <button type="button" onClick={onCreate}>
                Nova ficha
            </button>

            {isGm && menu && menuCharacter && (
                <div
                    ref={menuRef}
                    className="character-list__context-menu"
                    style={{ left: menu.x, top: menu.y }}
                    role="menu"
                >
                    <button
                        type="button"
                        role="menuitem"
                        disabled={busyId === menuCharacter.id}
                        onClick={() => {
                            onSelect(menuCharacter.id);
                            setMenu(null);
                        }}
                    >
                        Abrir
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        disabled={busyId === menuCharacter.id}
                        onClick={() =>
                            void runAction(menuCharacter.id, () => onDuplicate(menuCharacter.id))
                        }
                    >
                        Duplicar
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        disabled={busyId === menuCharacter.id}
                        onClick={() =>
                            void runAction(menuCharacter.id, () =>
                                onSetStatus(
                                    menuCharacter.id,
                                    menuCharacter.status === "inactive" ? "active" : "inactive"
                                )
                            )
                        }
                    >
                        {menuCharacter.status === "inactive" ? "Reativar" : "Inativar"}
                    </button>
                    <label className="character-list__context-assign">
                        Jogador
                        <select
                            value={menuCharacter.assignedPlayerUserId ?? ""}
                            disabled={busyId === menuCharacter.id}
                            onChange={(e) => {
                                const userId = e.target.value || null;
                                void runAction(menuCharacter.id, () =>
                                    onAssignPlayer(menuCharacter.id, userId)
                                );
                            }}
                        >
                            <option value="">Nenhum (NPC / mesa)</option>
                            {players.map((player) => (
                                <option key={player.id} value={player.userId}>
                                    {player.displayName}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
        </div>
    );
}
