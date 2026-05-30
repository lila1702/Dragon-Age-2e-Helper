interface TokenSelectionBarProps {
    isObrAvailable: boolean;
    isLoading: boolean;
    tokenName: string | null;
    selectionError: string | null;
    needsCreateSheet: boolean;
    canCreateSheet: boolean;
    isReadOnlySheet: boolean;
    isCreating: boolean;
    onCreateSheet?: () => void;
}

export function TokenSelectionBar({
    isObrAvailable,
    isLoading,
    tokenName,
    selectionError,
    needsCreateSheet,
    canCreateSheet,
    isReadOnlySheet,
    isCreating,
    onCreateSheet,
}: TokenSelectionBarProps) {
    if (!isObrAvailable) {
        return (
            <div className="token-bar token-bar--dev" role="status">
                Modo desenvolvimento — ficha de exemplo (não salva no mapa).
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="token-bar token-bar--loading" role="status">
                Carregando ficha do token…
            </div>
        );
    }

    if (selectionError) {
        return (
            <div className="token-bar token-bar--readonly" role="status">
                {selectionError}
            </div>
        );
    }

    if (needsCreateSheet && canCreateSheet) {
        return (
            <div className="token-bar token-bar--action">
                <span className="token-bar__text">
                    Token <strong>{tokenName ?? "selecionado"}</strong> sem ficha.
                </span>
                <button
                    type="button"
                    className="token-bar__btn"
                    disabled={isCreating}
                    onClick={onCreateSheet}
                >
                    {isCreating ? "Criando…" : "Criar ficha neste token"}
                </button>
            </div>
        );
    }

    if (needsCreateSheet && !canCreateSheet) {
        return (
            <div className="token-bar token-bar--readonly" role="status">
                Token <strong>{tokenName ?? "selecionado"}</strong> sem ficha — somente o dono
                do token ou o GM pode criar.
            </div>
        );
    }

    if (isReadOnlySheet) {
        return (
            <div className="token-bar token-bar--readonly" role="status">
                Vinculado a <strong>{tokenName ?? "token"}</strong> — somente leitura (ficha de
                outro jogador).
            </div>
        );
    }

    return (
        <div className="token-bar token-bar--ok" role="status">
            Vinculado a <strong>{tokenName ?? "token"}</strong>
        </div>
    );
}
