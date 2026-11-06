import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

import type { CampaignPlayerProfile, CampaignSummary, CharacterRecord } from "@dragon-age/client";

import { api } from "../../infrastructure/api/api";
import { WEB_APP_URL } from "../../infrastructure/api/config";

interface GmSettingsPanelProps {
    campaignId: string | null;
    campaigns: CampaignSummary[];
    characters: CharacterRecord[];
    onCampaignUpdated: (campaign: CampaignSummary) => void;
    onCharacterUpdated: (character: CharacterRecord) => void;
}

export function GmSettingsPanel({
    campaignId,
    campaigns,
    characters,
    onCampaignUpdated,
    onCharacterUpdated,
}: GmSettingsPanelProps) {
    const [open, setOpen] = useState(false);
    const [players, setPlayers] = useState<CampaignPlayerProfile[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const campaign = campaigns.find((entry) => entry.id === campaignId) ?? null;

    useEffect(() => {
        if (!open || !campaignId) return;
        void api.listCampaignPlayers(campaignId).then(setPlayers).catch(() => setPlayers([]));
    }, [open, campaignId]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    if (!campaignId || !campaign) return null;

    return (
        <div className="gm-settings">
            <button
                type="button"
                className="gm-settings__gear"
                title="Configurações do mestre"
                aria-expanded={open}
                aria-label="Configurações do mestre"
                onClick={() => setOpen((value) => !value)}
            >
                {"\u2699"}
            </button>

            {open && (
                <div className="gm-settings__overlay" role="dialog" aria-label="Configurações da mesa">
                    <div className="gm-settings__panel">
                        <div className="gm-settings__panel-head">
                            <div>
                                <strong>Configurações da mesa</strong>
                                <p className="gm-settings__hint">
                                    Preferências da campanha e vínculo de fichas.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="gm-settings__close secondary"
                                onClick={() => setOpen(false)}
                            >
                                Fechar
                            </button>
                        </div>

                        <div className="gm-settings__actions">
                            <a
                                className="mode-gate__btn mode-gate__btn--link"
                                href={WEB_APP_URL}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Abrir site web
                            </a>

                            <button
                                type="button"
                                className="token-bar__btn"
                                disabled={busy}
                                onClick={() => {
                                    if (!OBR.isAvailable) return;
                                    setBusy(true);
                                    setStatus(null);
                                    void api
                                        .linkCampaignOwlbearRoom(campaignId, OBR.room.id)
                                        .then((result) => {
                                            const count = result.rooms?.length ?? 1;
                                            setStatus(
                                                count > 1
                                                    ? `Sala vinculada: ${result.obrRoomId} (${count} salas nesta campanha).`
                                                    : `Sala vinculada: ${result.obrRoomId}`
                                            );
                                        })
                                        .catch((err) =>
                                            setStatus(
                                                err instanceof Error
                                                    ? err.message
                                                    : "Falha ao vincular sala."
                                            )
                                        )
                                        .finally(() => setBusy(false));
                                }}
                            >
                                Vincular esta sala Owlbear à campanha
                            </button>
                            <p className="gm-settings__hint">
                                Pode vincular várias salas (mesa oficial + mesa de teste). Vincular
                                aqui adiciona a sala atual sem remover as outras.
                            </p>
                        </div>

                        <label className="gm-settings__check">
                            <input
                                type="checkbox"
                                checked={Boolean(campaign.playersSeeOnlyOwnSheets)}
                                disabled={busy}
                                onChange={(e) => {
                                    const value = e.target.checked;
                                    setBusy(true);
                                    void api
                                        .updateCampaignSettings(campaignId, {
                                            playersSeeOnlyOwnSheets: value,
                                        })
                                        .then((updated) => {
                                            onCampaignUpdated(updated);
                                            setStatus(
                                                value
                                                    ? "Web: jogadores só veem as próprias fichas."
                                                    : "Web: jogadores veem todas as fichas ativas."
                                            );
                                        })
                                        .finally(() => setBusy(false));
                                }}
                            />
                            Na Web, jogadores só veem as próprias fichas
                        </label>

                        <div className="gm-settings__assign">
                            <strong>Vincular ficha → jogador</strong>
                            {characters.length === 0 && (
                                <p className="gm-settings__hint">Nenhuma ficha na campanha.</p>
                            )}
                            <div className="gm-settings__assign-grid">
                                {characters.map((character) => (
                                    <label key={character.id} className="gm-settings__assign-row">
                                        <span className="gm-settings__assign-name">
                                            {character.name || "Sem nome"}
                                        </span>
                                        <select
                                            value={character.assignedPlayerUserId ?? ""}
                                            disabled={busy}
                                            onChange={(e) => {
                                                const userId = e.target.value || null;
                                                setBusy(true);
                                                void api
                                                    .assignCharacterPlayer(character.id, userId)
                                                    .then((updated) => {
                                                        onCharacterUpdated(updated);
                                                        setStatus(
                                                            userId
                                                                ? `“${updated.name}” vinculada a um jogador.`
                                                                : `“${updated.name}” sem jogador (NPC/mesa).`
                                                        );
                                                    })
                                                    .finally(() => setBusy(false));
                                            }}
                                        >
                                            <option value="">NPC / mesa</option>
                                            {players.map((player) => (
                                                <option key={player.id} value={player.userId}>
                                                    {player.displayName}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {status && <p className="gm-settings__status">{status}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
