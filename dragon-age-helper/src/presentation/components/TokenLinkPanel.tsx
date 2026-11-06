import { useMemo, useState } from "react";

interface CharacterOption {
    id: string;
    name: string;
}

interface TokenLinkPanelProps {
    tokenName: string | null;
    characters: CharacterOption[];
    isGm: boolean;
    busy?: boolean;
    status?: string | null;
    /** Quando já há ficha na nuvem, permite trocar o token associado (aparência nova). */
    linkedCharacterId?: string | null;
    linkedCharacterName?: string | null;
    onLinkExisting: (characterId: string) => void;
    onCreateForToken: (kind: "pc" | "npc") => void;
    onRelinkCurrent?: () => void;
}

export function TokenLinkPanel({
    tokenName,
    characters,
    isGm,
    busy = false,
    status,
    linkedCharacterId,
    linkedCharacterName,
    onLinkExisting,
    onCreateForToken,
    onRelinkCurrent,
}: TokenLinkPanelProps) {
    const [selectedId, setSelectedId] = useState(linkedCharacterId ?? "");
    const sorted = useMemo(
        () => [...characters].sort((a, b) => a.name.localeCompare(b.name, "pt")),
        [characters]
    );

    const title = linkedCharacterId
        ? "Trocar token desta ficha"
        : "Associar token a uma ficha existente";

    return (
        <div className="token-link-panel">
            <strong className="token-link-panel__title">{title}</strong>
            <p className="token-link-panel__text">
                {linkedCharacterId ? (
                    <>
                        Use isto quando a aparência do token mudou: escolha o token novo no mapa e
                        associe de novo a ficha{" "}
                        <strong>{linkedCharacterName ?? "atual"}</strong> (sem recriar dados).
                    </>
                ) : (
                    <>
                        Token <strong>{tokenName ?? "selecionado"}</strong> ainda não aponta para
                        uma ficha na nuvem. Associe a uma ficha já criada (PC, NPC ou inimigo) —
                        o caminho normal quando você atualiza o visual do personagem.
                    </>
                )}
            </p>

            {sorted.length > 0 && (
                <div className="token-link-panel__row">
                    <select
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        disabled={busy}
                        aria-label="Ficha da campanha"
                    >
                        <option value="">Escolher ficha existente…</option>
                        {sorted.map((character) => (
                            <option key={character.id} value={character.id}>
                                {character.name || "Sem nome"}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="token-bar__btn"
                        disabled={busy || !selectedId}
                        onClick={() => onLinkExisting(selectedId)}
                    >
                        Associar ficha ao token
                    </button>
                </div>
            )}

            {linkedCharacterId && onRelinkCurrent && (
                <button
                    type="button"
                    className="token-bar__btn"
                    disabled={busy}
                    onClick={onRelinkCurrent}
                >
                    Reassociar ficha atual a este token
                </button>
            )}

            {!linkedCharacterId && (
                <div className="token-link-panel__row">
                    <button
                        type="button"
                        className="token-bar__btn"
                        disabled={busy}
                        onClick={() => onCreateForToken(isGm ? "npc" : "pc")}
                    >
                        {isGm
                            ? "Ou criar ficha nova neste token"
                            : "Ou criar minha ficha neste token"}
                    </button>
                </div>
            )}

            {status && <p className="token-link-panel__status">{status}</p>}
        </div>
    );
}
