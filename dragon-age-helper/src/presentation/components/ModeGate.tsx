interface ModeGateProps {
    webAppUrl: string;
    onLogin: () => void;
    onOffline: () => void;
}

export function ModeGate({ webAppUrl, onLogin, onOffline }: ModeGateProps) {
    return (
        <div className="mode-gate">
            <h1 className="mode-gate__title">Dragon Age Helper</h1>
            <p className="mode-gate__lead">
                Como quer usar a extensão nesta sala?
            </p>

            <div className="mode-gate__actions">
                <button type="button" className="mode-gate__btn mode-gate__btn--primary" onClick={onLogin}>
                    Entrar na mesa
                </button>
                <p className="mode-gate__hint">
                    Usa a API: perfis da campanha, fichas sincronizadas (PCs, NPCs e inimigos) e
                    vínculo com tokens.
                </p>

                <button type="button" className="mode-gate__btn" onClick={onOffline}>
                    Usar offline
                </button>
                <p className="mode-gate__hint">
                    Ficha só neste token do Owlbear, sem conta e sem nuvem — como antes da API.
                </p>

                <a
                    className="mode-gate__btn mode-gate__btn--link"
                    href={webAppUrl}
                    target="_blank"
                    rel="noreferrer"
                >
                    Abrir site web
                </a>
                <p className="mode-gate__hint">
                    Gerencie campanha, jogadoras e fichas no navegador.
                </p>
            </div>
        </div>
    );
}
