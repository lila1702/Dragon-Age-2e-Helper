import { useEffect, useState } from "react";

import type { CampaignPlayerProfile } from "@dragon-age/client";
import { parseOwlbearRoomId } from "@dragon-age/domain";

import { api } from "./api";

interface GmPanelProps {
    campaignId: string;
    isGm: boolean;
}

export function GmPanel({ campaignId, isGm }: GmPanelProps) {
    const [players, setPlayers] = useState<CampaignPlayerProfile[]>([]);
    const [obrRoomId, setObrRoomId] = useState("");
    const [linkedRooms, setLinkedRooms] = useState<string[]>([]);
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPassword, setEditPassword] = useState("");

    const reload = async () => {
        const [list, room] = await Promise.all([
            api.listCampaignPlayers(campaignId),
            api.getCampaignOwlbearRoom(campaignId),
        ]);
        setPlayers(list);
        setLinkedRooms(room.rooms ?? (room.obrRoomId ? [room.obrRoomId] : []));
    };

    useEffect(() => {
        if (!isGm) return;
        void reload().catch((err) =>
            setError(err instanceof Error ? err.message : "Falha ao carregar painel GM.")
        );
    }, [campaignId, isGm]);

    if (!isGm) return null;

    return (
        <details className="panel-fold" open>
            <summary className="panel-fold__summary">Mestre — jogadoras e sala</summary>
            <div className="panel-fold__body">
                <p className="hint">
                    Crie e gerencie perfis com senha para a campanha. Vincule a sala Owlbear para as
                    jogadoras entrarem pela extensão com o perfil da mesa.
                </p>
                <p className="hint">
                    Cole o ID ou a URL da sala (trecho entre <code>/room/</code> e o nome). Pode
                    vincular várias salas à mesma campanha (mesa oficial + teste). Também dá pela
                    extensão.
                </p>

                <label>
                    ID ou URL da sala Owlbear
                    <input
                        value={obrRoomId}
                        onChange={(e) => setObrRoomId(e.target.value)}
                        placeholder="https://www.owlbear.rodeo/room/… ou só o ID"
                    />
                </label>
                <button
                    type="button"
                    onClick={() => {
                        setError(null);
                        setMessage(null);
                        const normalized = parseOwlbearRoomId(obrRoomId);
                        if (!normalized) {
                            setError("Informe o ID ou a URL da sala.");
                            return;
                        }
                        void api
                            .linkCampaignOwlbearRoom(campaignId, normalized)
                            .then((result) => {
                                setObrRoomId("");
                                setLinkedRooms(result.rooms ?? [result.obrRoomId]);
                                setMessage(`Sala vinculada: ${result.obrRoomId}`);
                            })
                            .catch((err) =>
                                setError(
                                    err instanceof Error ? err.message : "Falha ao vincular sala."
                                )
                            );
                    }}
                >
                    Adicionar sala à campanha
                </button>
                {linkedRooms.length > 0 ? (
                    <ul className="gm-room-list">
                        {linkedRooms.map((roomId) => (
                            <li key={roomId} className="gm-room-list__item">
                                <span className="highlight">{roomId}</span>
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={() => {
                                        setError(null);
                                        setMessage(null);
                                        void api
                                            .unlinkCampaignOwlbearRoom(campaignId, roomId)
                                            .then(() => {
                                                setLinkedRooms((prev) =>
                                                    prev.filter((entry) => entry !== roomId)
                                                );
                                                setMessage(`Sala desvinculada: ${roomId}`);
                                            })
                                            .catch((err) =>
                                                setError(
                                                    err instanceof Error
                                                        ? err.message
                                                        : "Falha ao desvincular sala."
                                                )
                                            );
                                    }}
                                >
                                    Remover
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="hint">Nenhuma sala vinculada ainda.</p>
                )}

                <details className="panel-fold panel-fold--nested" open>
                    <summary className="panel-fold__summary">Jogadoras da campanha</summary>
                    <div className="panel-fold__body">
                        {players.length === 0 && (
                            <p className="hint">Nenhum perfil criado ainda.</p>
                        )}
                        <div className="gm-player-list">
                            {players.map((player) => (
                                <div key={player.id} className="gm-player-card">
                                    {editingId === player.id ? (
                                        <div className="gm-form">
                                            <label>
                                                Username do jogador
                                                <input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                />
                                            </label>
                                            <label>
                                                Nova senha (opcional)
                                                <input
                                                    type="password"
                                                    value={editPassword}
                                                    onChange={(e) => setEditPassword(e.target.value)}
                                                    placeholder="Deixe em branco para manter"
                                                />
                                            </label>
                                            <div className="gm-player-card__actions">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setError(null);
                                                        setMessage(null);
                                                        const patch: {
                                                            displayName?: string;
                                                            password?: string;
                                                        } = {};
                                                        if (editName.trim()) {
                                                            patch.displayName = editName.trim();
                                                        }
                                                        if (editPassword.trim()) {
                                                            patch.password = editPassword.trim();
                                                        }
                                                        void api
                                                            .updateCampaignPlayer(
                                                                campaignId,
                                                                player.id,
                                                                patch
                                                            )
                                                            .then((updated) => {
                                                                setPlayers((prev) =>
                                                                    prev.map((entry) =>
                                                                        entry.id === updated.id
                                                                            ? updated
                                                                            : entry
                                                                    )
                                                                );
                                                                setEditingId(null);
                                                                setEditPassword("");
                                                                setMessage(
                                                                    `Perfil atualizado: ${updated.displayName}`
                                                                );
                                                            })
                                                            .catch((err) =>
                                                                setError(
                                                                    err instanceof Error
                                                                        ? err.message
                                                                        : "Falha ao atualizar."
                                                                )
                                                            );
                                                    }}
                                                >
                                                    Salvar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditPassword("");
                                                    }}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="gm-player-card__meta">
                                                <strong>{player.displayName}</strong>
                                                <span className="hint">{player.email}</span>
                                            </div>
                                            <div className="gm-player-card__actions">
                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    onClick={() => {
                                                        setEditingId(player.id);
                                                        setEditName(player.displayName);
                                                        setEditPassword("");
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => {
                                                        if (
                                                            !window.confirm(
                                                                `Remover o perfil “${player.displayName}” desta campanha?`
                                                            )
                                                        ) {
                                                            return;
                                                        }
                                                        setError(null);
                                                        setMessage(null);
                                                        void api
                                                            .deleteCampaignPlayer(
                                                                campaignId,
                                                                player.id
                                                            )
                                                            .then(() => {
                                                                setPlayers((prev) =>
                                                                    prev.filter(
                                                                        (entry) =>
                                                                            entry.id !== player.id
                                                                    )
                                                                );
                                                                setMessage(
                                                                    `Perfil removido: ${player.displayName}`
                                                                );
                                                            })
                                                            .catch((err) =>
                                                                setError(
                                                                    err instanceof Error
                                                                        ? err.message
                                                                        : "Falha ao remover."
                                                                )
                                                            );
                                                    }}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </details>

                <details className="panel-fold panel-fold--nested">
                    <summary className="panel-fold__summary">Nova jogadora</summary>
                    <div className="panel-fold__body gm-form">
                        <label>
                            Username do jogador
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </label>
                        <label>
                            Senha do perfil
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </label>
                        <label>
                            E-mail (opcional)
                            <input value={email} onChange={(e) => setEmail(e.target.value)} />
                        </label>
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                setMessage(null);
                                void api
                                    .createCampaignPlayer(
                                        campaignId,
                                        displayName.trim(),
                                        password,
                                        email.trim() || undefined
                                    )
                                    .then((created) => {
                                        setPlayers((prev) => [...prev, created]);
                                        setDisplayName("");
                                        setPassword("");
                                        setEmail("");
                                        setMessage(
                                            `Perfil criado: ${created.displayName} (${created.email})`
                                        );
                                    })
                                    .catch((err) =>
                                        setError(
                                            err instanceof Error
                                                ? err.message
                                                : "Falha ao criar perfil."
                                        )
                                    );
                            }}
                        >
                            Criar perfil
                        </button>
                    </div>
                </details>

                {message && <p className="hint highlight">{message}</p>}
                {error && <div className="error">{error}</div>}
            </div>
        </details>
    );
}
