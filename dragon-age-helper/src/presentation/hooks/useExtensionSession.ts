import { useCallback, useEffect, useMemo, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

import type { ApiUser, CampaignSummary, CharacterRecord } from "@dragon-age/client";
import { createEmptySheet } from "@dragon-age/domain";

import { METADATA_KEYS } from "../../infrastructure/owlbear/metadataKeys";
import { api, getApiToken, setApiToken } from "../../infrastructure/api/api";

const MODE_KEY = "da-helper-extension-mode";

export type ExtensionMode = "online" | "offline" | null;

function readStoredMode(): ExtensionMode {
    try {
        const value = sessionStorage.getItem(MODE_KEY);
        if (value === "online" || value === "offline") return value;
    } catch {
        /* ignore */
    }
    return null;
}

function writeStoredMode(mode: ExtensionMode) {
    try {
        if (!mode) sessionStorage.removeItem(MODE_KEY);
        else sessionStorage.setItem(MODE_KEY, mode);
    } catch {
        /* ignore */
    }
}

export function useExtensionSession(isObrReady: boolean) {
    const [mode, setModeState] = useState<ExtensionMode>(() => {
        if (getApiToken()) return "online";
        return readStoredMode();
    });
    const [authStep, setAuthStep] = useState(false);
    const [token, setToken] = useState<string | null>(() => getApiToken());
    const [user, setUser] = useState<ApiUser | null>(null);
    const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [linkedCharacter, setLinkedCharacter] = useState<CharacterRecord | null>(null);
    const [campaignCharacters, setCampaignCharacters] = useState<CharacterRecord[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [roomLinked, setRoomLinked] = useState(false);

    const setMode = useCallback((next: ExtensionMode) => {
        setModeState(next);
        writeStoredMode(next);
        if (next === "offline") {
            setAuthStep(false);
        }
    }, []);

    useEffect(() => {
        if (!token) {
            setUser(null);
            return;
        }
        void api
            .me()
            .then((me) => {
                setUser(me);
                setMode("online");
            })
            .catch(() => {
                setApiToken(null);
                setToken(null);
                setMode(null);
            });
    }, [setMode, token]);

    useEffect(() => {
        if (!user) {
            setCampaigns([]);
            return;
        }
        void api.listMyCampaigns().then((list) => {
            setCampaigns(list);
            setCampaignId((current) => current ?? list[0]?.id ?? null);
        });
    }, [user]);

    const reloadCampaignCharacters = useCallback(async () => {
        if (!campaignId || !user) {
            setCampaignCharacters([]);
            return;
        }
        try {
            const list = await api.listCampaignCharacters(campaignId);
            setCampaignCharacters(list);
        } catch {
            setCampaignCharacters([]);
        }
    }, [campaignId, user]);

    useEffect(() => {
        if (!campaignId || !user) {
            setCampaignCharacters([]);
            setRoomLinked(false);
            return;
        }
        void reloadCampaignCharacters();
        if (isObrReady && OBR.isAvailable) {
            void api
                .getCampaignOwlbearRoom(campaignId)
                .then((room) => {
                    const rooms = room.rooms ?? (room.obrRoomId ? [room.obrRoomId] : []);
                    setRoomLinked(rooms.includes(OBR.room.id));
                })
                .catch(() => setRoomLinked(false));
        } else {
            setRoomLinked(false);
        }
    }, [campaignId, isObrReady, user, linkedCharacter?.id, reloadCampaignCharacters]);

    const login = useCallback(async (loginId: string, password: string) => {
        const session = await api.login(loginId, password);
        setApiToken(session.token);
        setToken(session.token);
        setUser(session.user);
        setMode("online");
        setAuthStep(false);
        return { token: session.token, displayName: session.user.displayName };
    }, [setMode]);

    const acceptSession = useCallback(
        (sessionToken: string, nextUser: ApiUser, nextCampaignId?: string) => {
            setApiToken(sessionToken);
            setToken(sessionToken);
            setUser(nextUser);
            if (nextCampaignId) setCampaignId(nextCampaignId);
            setMode("online");
            setAuthStep(false);
            if (isObrReady) {
                void api.linkOwlbearIdentity(OBR.player.id, OBR.room.id).catch(() => undefined);
            }
        },
        [isObrReady, setMode]
    );

    const ensureRoomLinked = useCallback(async () => {
        if (!isObrReady || !campaignId || !user) return;
        const role = campaigns.find((entry) => entry.id === campaignId)?.role;
        if (role !== "GM") return;
        try {
            const current = await api.getCampaignOwlbearRoom(campaignId);
            const rooms = current.rooms ?? (current.obrRoomId ? [current.obrRoomId] : []);
            if (rooms.includes(OBR.room.id)) {
                setRoomLinked(true);
                return;
            }
            await api.linkCampaignOwlbearRoom(campaignId, OBR.room.id);
            setRoomLinked(true);
            setStatus("Esta sala Owlbear foi vinculada à campanha.");
        } catch {
            /* silencioso — GM pode vincular depois no site */
        }
    }, [campaignId, campaigns, isObrReady, user]);

    useEffect(() => {
        if (mode !== "online" || !user || !campaignId || !isObrReady) return;
        void ensureRoomLinked();
    }, [campaignId, ensureRoomLinked, isObrReady, mode, user]);

    const resolveCharacterForToken = useCallback(
        async (tokenId: string | null) => {
            if (mode !== "online" || !token || !campaignId || !tokenId || !isObrReady) {
                setLinkedCharacter(null);
                return null;
            }

            const roomId = OBR.room.id;

            try {
                const items = await OBR.scene.items.getItems([tokenId]);
                const item = items[0];
                const apiId = item?.metadata?.[METADATA_KEYS.CHARACTER_API_ID];
                if (typeof apiId === "string" && apiId) {
                    try {
                        const byMeta = await api.getCharacter(apiId);
                        await api.createTokenLink(byMeta.id, roomId, tokenId).catch(() => undefined);
                        setLinkedCharacter(byMeta);
                        return byMeta;
                    } catch {
                        /* metadata stale — continua lookup */
                    }
                }

                const existing = await api.findCharacterByToken(roomId, tokenId);
                if (existing) {
                    setLinkedCharacter(existing);
                    await OBR.scene.items.updateItems([tokenId], (draft) => {
                        for (const entry of draft) {
                            entry.metadata = {
                                ...entry.metadata,
                                [METADATA_KEYS.CHARACTER_API_ID]: existing.id,
                            };
                        }
                        return draft;
                    });
                    return existing;
                }
            } catch (err) {
                console.error(err);
            }

            setLinkedCharacter(null);
            return null;
        },
        [campaignId, isObrReady, mode, token]
    );

    const linkSelectedToken = useCallback(
        async (characterId: string, tokenId: string) => {
            if (!isObrReady) return;
            await api.createTokenLink(characterId, OBR.room.id, tokenId);
            await OBR.scene.items.updateItems([tokenId], (draft) => {
                for (const entry of draft) {
                    entry.metadata = {
                        ...entry.metadata,
                        [METADATA_KEYS.CHARACTER_API_ID]: characterId,
                    };
                }
                return draft;
            });
            const character = await api.getCharacter(characterId);
            setLinkedCharacter(character);
            setStatus(`Ficha “${character.name || "Sem nome"}” associada ao token.`);
        },
        [isObrReady]
    );

    const createCharacterForToken = useCallback(
        async (tokenId: string, tokenName: string | null, kind: "pc" | "npc") => {
            if (!campaignId || !isObrReady) return null;
            const sheet = createEmptySheet(tokenId);
            sheet.name = tokenName?.trim() || (kind === "npc" ? "NPC" : "Novo personagem");
            const created = await api.createCharacter(campaignId, sheet);
            await linkSelectedToken(created.id, tokenId);
            setCampaignCharacters((prev) => {
                if (prev.some((entry) => entry.id === created.id)) return prev;
                return [...prev, created];
            });
            return created;
        },
        [campaignId, isObrReady, linkSelectedToken]
    );

    const logout = useCallback(() => {
        setApiToken(null);
        setToken(null);
        setUser(null);
        setLinkedCharacter(null);
        setCampaignCharacters([]);
        setStatus(null);
        setMode(null);
        setAuthStep(false);
    }, [setMode]);

    const startLogin = useCallback(() => {
        setAuthStep(true);
    }, []);

    const cancelLogin = useCallback(() => {
        setAuthStep(false);
        if (!user) setMode(null);
    }, [setMode, user]);

    const chooseOffline = useCallback(() => {
        setMode("offline");
        setAuthStep(false);
        setLinkedCharacter(null);
    }, [setMode]);

    return useMemo(
        () => ({
            mode,
            authStep,
            token,
            user,
            campaigns,
            campaignId,
            setCampaignId,
            linkedCharacter,
            campaignCharacters,
            status,
            setStatus,
            roomLinked,
            login,
            acceptSession,
            logout,
            startLogin,
            cancelLogin,
            chooseOffline,
            resolveCharacterForToken,
            linkSelectedToken,
            createCharacterForToken,
            ensureRoomLinked,
            reloadCampaignCharacters,
            setCampaigns,
        }),
        [
            mode,
            authStep,
            token,
            user,
            campaigns,
            campaignId,
            linkedCharacter,
            campaignCharacters,
            status,
            roomLinked,
            login,
            acceptSession,
            logout,
            startLogin,
            cancelLogin,
            chooseOffline,
            resolveCharacterForToken,
            linkSelectedToken,
            createCharacterForToken,
            ensureRoomLinked,
            reloadCampaignCharacters,
        ]
    );
}
