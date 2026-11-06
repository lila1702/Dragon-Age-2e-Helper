import { useEffect, useState } from "react";

import type { ApiUser, OwlbearRoomProfile } from "@dragon-age/client";

import { api } from "../../infrastructure/api/api";

interface AuthPanelProps {
    obrRoomId: string | null;
    onBack: () => void;
    onAuthenticated: (payload: {
        token: string;
        user: ApiUser;
        campaignId?: string;
    }) => void;
    onLogin: (login: string, password: string) => Promise<{ token: string; displayName: string }>;
}

export function AuthPanel({
    obrRoomId,
    onBack,
    onAuthenticated,
    onLogin,
}: AuthPanelProps) {
    const [mode, setMode] = useState<"room" | "account">("room");
    const [profiles, setProfiles] = useState<OwlbearRoomProfile[]>([]);
    const [campaignName, setCampaignName] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [loadingProfiles, setLoadingProfiles] = useState(Boolean(obrRoomId));

    useEffect(() => {
        if (!obrRoomId) {
            setMode("account");
            setLoadingProfiles(false);
            return;
        }
        let cancelled = false;
        setLoadingProfiles(true);
        void api
            .listOwlbearRoomProfiles(obrRoomId)
            .then((response) => {
                if (cancelled) return;
                setProfiles(response.profiles);
                setCampaignName(response.campaignName);
                setMode(response.profiles.length > 0 ? "room" : "account");
            })
            .catch(() => {
                if (cancelled) return;
                setProfiles([]);
                setMode("account");
            })
            .finally(() => {
                if (!cancelled) setLoadingProfiles(false);
            });
        return () => {
            cancelled = true;
        };
    }, [obrRoomId]);

    const submitRoom = async () => {
        if (!obrRoomId) return;
        setBusy(true);
        setError(null);
        try {
            let userId = selectedUserId;
            if (!userId && username.trim()) {
                const match = profiles.find(
                    (profile) =>
                        profile.displayName.trim().toLowerCase() === username.trim().toLowerCase()
                );
                userId = match?.userId ?? null;
            }
            if (!userId) {
                setError("Escolha ou digite o username do perfil.");
                return;
            }
            const session = await api.loginOwlbearRoomProfile(obrRoomId, userId, password);
            onAuthenticated({
                token: session.token,
                user: session.user,
                campaignId: session.campaignId,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha no login do perfil.");
        } finally {
            setBusy(false);
        }
    };

    const submitAccount = async () => {
        setBusy(true);
        setError(null);
        try {
            await onLogin(login.trim(), password);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha na autenticação.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mode-gate">
            <button type="button" className="mode-gate__back" onClick={onBack}>
                ← Voltar
            </button>
            <h1 className="mode-gate__title">Entrar na mesa</h1>

            {loadingProfiles ? (
                <p className="mode-gate__lead">Carregando perfis da sala…</p>
            ) : mode === "room" && profiles.length > 0 ? (
                <>
                    <p className="mode-gate__lead">
                        {campaignName
                            ? `Campanha “${campaignName}”. Escolha seu username e a senha.`
                            : "Escolha seu username e a senha do perfil."}
                    </p>
                    <div className="mode-gate__form">
                        <label>
                            Username
                            <select
                                value={selectedUserId ?? ""}
                                onChange={(e) => {
                                    setSelectedUserId(e.target.value || null);
                                    const profile = profiles.find((p) => p.userId === e.target.value);
                                    if (profile) setUsername(profile.displayName);
                                }}
                            >
                                <option value="">Selecionar perfil…</option>
                                {profiles.map((profile) => (
                                    <option key={profile.id} value={profile.userId}>
                                        {profile.displayName}
                                        {profile.kind === "gm" ? " (Mestre)" : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Ou digite o username
                            <input
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    const match = profiles.find(
                                        (p) =>
                                            p.displayName.trim().toLowerCase() ===
                                            e.target.value.trim().toLowerCase()
                                    );
                                    setSelectedUserId(match?.userId ?? null);
                                }}
                                placeholder="Username do jogador"
                                autoComplete="username"
                            />
                        </label>
                        <label>
                            Senha
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </label>
                        {error && <div className="mode-gate__error">{error}</div>}
                        <button
                            type="button"
                            className="mode-gate__btn mode-gate__btn--primary"
                            disabled={busy || (!selectedUserId && !username.trim())}
                            onClick={() => void submitRoom()}
                        >
                            Entrar
                        </button>
                        <button
                            type="button"
                            className="mode-gate__btn"
                            onClick={() => setMode("account")}
                        >
                            Conta com e-mail / username global
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p className="mode-gate__lead">
                        Use o username ou o e-mail da conta e a senha.
                    </p>
                    <div className="mode-gate__form">
                        <label>
                            Username ou e-mail
                            <input
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="Username ou e-mail"
                                autoComplete="username"
                            />
                        </label>
                        <label>
                            Senha
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </label>
                        {error && <div className="mode-gate__error">{error}</div>}
                        <button
                            type="button"
                            className="mode-gate__btn mode-gate__btn--primary"
                            disabled={busy || !login.trim()}
                            onClick={() => void submitAccount()}
                        >
                            Entrar
                        </button>
                        {obrRoomId && profiles.length > 0 && (
                            <button
                                type="button"
                                className="mode-gate__btn"
                                onClick={() => setMode("room")}
                            >
                                Perfis desta sala
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
