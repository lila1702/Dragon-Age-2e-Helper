import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
    applySheetPatch,
    createEmptySheet,
    createOpId,
    type CharacterSheet,
    type CampaignEvent,
    type SheetPatch,
} from "@dragon-age/domain";

import type { ApiClient } from "./apiClient";
import { RealtimeClient } from "./realtimeClient";
import type { CharacterRecord } from "./types";

const DEBOUNCE_MS = 450;
const IMMEDIATE_PATHS = new Set(["hpCurrent", "hpMax", "mpCurrent", "mpMax"]);

export interface SyncedSheetState {
    character: CharacterRecord | null;
    sheet: CharacterSheet;
    revision: number;
    connected: boolean;
    presenceByPath: Record<string, string>;
    isLoading: boolean;
    error: string | null;
    canEdit: boolean;
    setField: (path: string, value: unknown, options?: { immediate?: boolean }) => void;
    mutateSheet: (updater: (current: CharacterSheet) => CharacterSheet) => void;
    claimPresence: (path: string) => void;
    releasePresence: (path: string) => void;
    replaceSheet: (sheet: CharacterSheet) => Promise<void>;
    reload: () => Promise<void>;
}

interface SheetCacheEntry {
    character: CharacterRecord;
    sheet: CharacterSheet;
    revision: number;
}

function patchLocally(sheet: CharacterSheet, path: string, value: unknown): CharacterSheet {
    if (!path.includes("/")) {
        return { ...sheet, [path]: value } as CharacterSheet;
    }
    return applySheetPatch(sheet, path, value);
}

function clearTimers(timers: Map<string, ReturnType<typeof setTimeout>>) {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
}

export function useSyncedCharacterSheet(options: {
    api: ApiClient;
    characterId: string | null;
    campaignId: string | null;
    sessionToken: string | null;
    canEdit: boolean;
    displayName: string;
    /** Pré-aquece o cache com fichas já listadas (troca instantânea). */
    knownCharacters?: CharacterRecord[];
}): SyncedSheetState {
    const { api, characterId, campaignId, sessionToken, canEdit, displayName, knownCharacters } =
        options;
    const [character, setCharacter] = useState<CharacterRecord | null>(null);
    const [sheet, setSheet] = useState<CharacterSheet>(() => createEmptySheet(""));
    const [revision, setRevision] = useState(1);
    const [connected, setConnected] = useState(false);
    const [presenceByPath, setPresenceByPath] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const revisionRef = useRef(revision);
    const sheetRef = useRef(sheet);
    const characterIdRef = useRef(characterId);
    const pendingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const fullSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sentOps = useRef<Set<string>>(new Set());
    const realtimeRef = useRef<RealtimeClient | null>(null);
    const connectedRef = useRef(false);
    const cacheRef = useRef<Map<string, SheetCacheEntry>>(new Map());
    const loadSeq = useRef(0);

    revisionRef.current = revision;
    sheetRef.current = sheet;
    characterIdRef.current = characterId;
    connectedRef.current = connected;

    const remember = useCallback((record: CharacterRecord) => {
        cacheRef.current.set(record.id, {
            character: record,
            sheet: record.sheet,
            revision: record.revision,
        });
    }, []);

    useEffect(() => {
        if (!knownCharacters?.length) return;
        for (const record of knownCharacters) {
            if (!record.sheet) continue;
            const existing = cacheRef.current.get(record.id);
            // Não sobrescrever versão mais nova já editada localmente.
            if (existing && existing.revision >= record.revision) continue;
            remember(record);
        }
    }, [knownCharacters, remember]);

    const abandonPending = useCallback(() => {
        clearTimers(pendingTimers.current);
        if (fullSaveTimer.current) {
            clearTimeout(fullSaveTimer.current);
            fullSaveTimer.current = null;
        }
    }, []);

    const reload = useCallback(async () => {
        if (!characterId) {
            abandonPending();
            setCharacter(null);
            setSheet(createEmptySheet(""));
            setRevision(1);
            setPresenceByPath({});
            setIsLoading(false);
            return;
        }

        const seq = ++loadSeq.current;
        const cached = cacheRef.current.get(characterId);
        if (cached) {
            setCharacter(cached.character);
            setSheet(cached.sheet);
            setRevision(cached.revision);
            revisionRef.current = cached.revision;
            sheetRef.current = cached.sheet;
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }

        setError(null);
        try {
            const record = await api.getCharacter(characterId);
            if (seq !== loadSeq.current || characterIdRef.current !== characterId) return;
            remember(record);
            setCharacter(record);
            setSheet(record.sheet);
            setRevision(record.revision);
            revisionRef.current = record.revision;
            sheetRef.current = record.sheet;
        } catch (err) {
            if (seq !== loadSeq.current) return;
            setError(err instanceof Error ? err.message : "Falha ao carregar ficha.");
        } finally {
            if (seq === loadSeq.current) setIsLoading(false);
        }
    }, [abandonPending, api, characterId, remember]);

    useEffect(() => {
        abandonPending();
        setPresenceByPath({});
        void reload();
    }, [abandonPending, characterId, reload]);

    // WebSocket é por campanha — não reconectar ao trocar de ficha.
    useEffect(() => {
        if (!campaignId || !sessionToken) {
            realtimeRef.current?.disconnect();
            realtimeRef.current = null;
            setConnected(false);
            return;
        }

        const client = new RealtimeClient(
            () => api.websocketUrl(campaignId, sessionToken),
            setConnected
        );
        realtimeRef.current = client;

        const unsubscribe = client.subscribe((event: CampaignEvent) => {
            const activeId = characterIdRef.current;

            if (event.type === "sheet.patch") {
                if (event.patch.characterId !== activeId) {
                    const cached = cacheRef.current.get(event.patch.characterId);
                    if (cached) {
                        const nextSheet = patchLocally(
                            cached.sheet,
                            event.patch.path,
                            event.patch.value
                        );
                        cacheRef.current.set(event.patch.characterId, {
                            character: {
                                ...cached.character,
                                sheet: nextSheet,
                                revision: event.revision,
                                name: nextSheet.name || cached.character.name,
                            },
                            sheet: nextSheet,
                            revision: event.revision,
                        });
                    }
                    return;
                }
                if (sentOps.current.has(event.patch.opId)) {
                    sentOps.current.delete(event.patch.opId);
                    setRevision(event.revision);
                    revisionRef.current = event.revision;
                    return;
                }
                setSheet((prev) => {
                    const next = patchLocally(prev, event.patch.path, event.patch.value);
                    sheetRef.current = next;
                    if (activeId) {
                        const prevCache = cacheRef.current.get(activeId);
                        if (prevCache) {
                            cacheRef.current.set(activeId, {
                                character: {
                                    ...prevCache.character,
                                    sheet: next,
                                    revision: event.revision,
                                    name: next.name || prevCache.character.name,
                                },
                                sheet: next,
                                revision: event.revision,
                            });
                        }
                    }
                    return next;
                });
                setRevision(event.revision);
                revisionRef.current = event.revision;
                return;
            }

            if (event.type === "sheet.snapshot") {
                const snap = event.snapshot;
                // Não sobrescrever edições locais ainda não persistidas.
                const hasLocalPending =
                    snap.characterId === activeId &&
                    (fullSaveTimer.current !== null || pendingTimers.current.size > 0);
                const prevCache = cacheRef.current.get(snap.characterId);
                if (prevCache && !hasLocalPending) {
                    cacheRef.current.set(snap.characterId, {
                        character: {
                            ...prevCache.character,
                            sheet: snap.sheet,
                            revision: snap.revision,
                            name: snap.sheet.name || prevCache.character.name,
                        },
                        sheet: snap.sheet,
                        revision: snap.revision,
                    });
                }
                if (snap.characterId !== activeId) return;
                setRevision(snap.revision);
                revisionRef.current = snap.revision;
                if (hasLocalPending) {
                    setCharacter((prev) =>
                        prev ? { ...prev, revision: snap.revision } : prev
                    );
                    return;
                }
                setSheet(snap.sheet);
                sheetRef.current = snap.sheet;
                setCharacter((prev) =>
                    prev
                        ? {
                              ...prev,
                              sheet: snap.sheet,
                              revision: snap.revision,
                              name: snap.sheet.name || prev.name,
                          }
                        : prev
                );
                return;
            }

            if (event.type === "sheet.presence") {
                if (event.characterId !== activeId) return;
                setPresenceByPath((prev) => {
                    const next = { ...prev };
                    if (!event.presence) {
                        delete next[event.path];
                    } else {
                        next[event.path] = event.presence.displayName;
                    }
                    return next;
                });
            }
        });

        client.connect();

        return () => {
            unsubscribe();
            client.disconnect();
            realtimeRef.current = null;
        };
    }, [api, campaignId, sessionToken]);

    const sendPatch = useCallback(
        (patch: SheetPatch) => {
            sentOps.current.add(patch.opId);
            if (connectedRef.current) {
                realtimeRef.current?.sendPatch(patch);
                revisionRef.current += 1;
                setRevision(revisionRef.current);
                return;
            }
            void api.applyPatch(patch).then(
                (result) => {
                    if (characterIdRef.current !== patch.characterId) return;
                    setRevision(result.revision);
                    revisionRef.current = result.revision;
                },
                async (err) => {
                    console.error(err);
                    await reload();
                }
            );
        },
        [api, reload]
    );

    const enqueuePatch = useCallback(
        (path: string, value: unknown, immediate: boolean) => {
            if (!characterId || !canEdit) return;

            const existing = pendingTimers.current.get(path);
            if (existing) clearTimeout(existing);

            const send = () => {
                pendingTimers.current.delete(path);
                if (characterIdRef.current !== characterId) return;
                sendPatch({
                    characterId,
                    baseRevision: revisionRef.current,
                    opId: createOpId(),
                    path,
                    value,
                });
            };

            if (immediate || IMMEDIATE_PATHS.has(path)) {
                send();
            } else {
                pendingTimers.current.set(path, setTimeout(send, DEBOUNCE_MS));
            }
        },
        [canEdit, characterId, sendPatch]
    );

    const scheduleFullSave = useCallback(() => {
        if (!characterId || !canEdit) return;
        if (fullSaveTimer.current) clearTimeout(fullSaveTimer.current);
        fullSaveTimer.current = setTimeout(() => {
            fullSaveTimer.current = null;
            const id = characterId;
            if (characterIdRef.current !== id) return;
            // Descarta patches pontuais: o PUT já leva o sheetRef completo.
            clearTimers(pendingTimers.current);
            const snapshot = sheetRef.current;
            void api.putCharacter(id, revisionRef.current, snapshot).then(
                (updated) => {
                    if (characterIdRef.current !== id) {
                        remember(updated);
                        return;
                    }
                    // Mantém o sheet local se o usuário editou durante o round-trip.
                    const localSheet = sheetRef.current;
                    remember({
                        ...updated,
                        sheet: localSheet,
                        name: localSheet.name || updated.name,
                    });
                    setCharacter((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  ...updated,
                                  sheet: localSheet,
                                  name: localSheet.name || updated.name,
                              }
                            : updated
                    );
                    setRevision(updated.revision);
                    revisionRef.current = updated.revision;
                },
                async (err) => {
                    console.error(err);
                    await reload();
                }
            );
        }, DEBOUNCE_MS);
    }, [api, canEdit, characterId, reload, remember]);

    const setField = useCallback(
        (path: string, value: unknown, options?: { immediate?: boolean }) => {
            if (!canEdit) return;
            const lockedBy = presenceByPath[path];
            if (lockedBy && lockedBy !== displayName) return;

            setSheet((prev) => {
                const next = patchLocally(prev, path, value);
                sheetRef.current = next;
                const id = characterIdRef.current;
                if (id) {
                    const cached = cacheRef.current.get(id);
                    if (cached) {
                        cacheRef.current.set(id, {
                            character: {
                                ...cached.character,
                                sheet: next,
                                name:
                                    path === "name"
                                        ? String(value)
                                        : next.name || cached.character.name,
                            },
                            sheet: next,
                            revision: cached.revision,
                        });
                    }
                }
                if (path === "name") {
                    setCharacter((prevChar) =>
                        prevChar ? { ...prevChar, name: String(value), sheet: next } : prevChar
                    );
                }
                return next;
            });
            // Se já há save completo pendente (ex.: item recém-criado), só reagenda o PUT
            // em vez de mandar patch avulso (evita 409 / snapshot que apaga o texto).
            if (fullSaveTimer.current) {
                scheduleFullSave();
                return;
            }
            enqueuePatch(path, value, options?.immediate === true);
        },
        [canEdit, displayName, enqueuePatch, presenceByPath, scheduleFullSave]
    );

    const mutateSheet = useCallback(
        (updater: (current: CharacterSheet) => CharacterSheet) => {
            if (!canEdit) return;
            // Patches pendentes já estão no sheet local; o save completo as cobre.
            clearTimers(pendingTimers.current);
            setSheet((prev) => {
                const next = updater(prev);
                sheetRef.current = next;
                const id = characterIdRef.current;
                if (id) {
                    const cached = cacheRef.current.get(id);
                    if (cached) {
                        cacheRef.current.set(id, {
                            character: {
                                ...cached.character,
                                sheet: next,
                                name: next.name || cached.character.name,
                            },
                            sheet: next,
                            revision: cached.revision,
                        });
                    }
                }
                return next;
            });
            scheduleFullSave();
        },
        [canEdit, scheduleFullSave]
    );

    const claimPresence = useCallback(
        (path: string) => {
            if (!characterId || !canEdit) return;
            realtimeRef.current?.sendPresence(characterId, path, displayName);
        },
        [canEdit, characterId, displayName]
    );

    const releasePresence = useCallback(
        (path: string) => {
            if (!characterId) return;
            realtimeRef.current?.sendPresence(characterId, null, displayName);
            void path;
        },
        [characterId, displayName]
    );

    const replaceSheet = useCallback(
        async (next: CharacterSheet) => {
            if (!characterId || !canEdit) return;
            setSheet(next);
            sheetRef.current = next;
            const updated = await api.putCharacter(characterId, revisionRef.current, next);
            remember(updated);
            setCharacter(updated);
            setSheet(updated.sheet);
            setRevision(updated.revision);
            revisionRef.current = updated.revision;
        },
        [api, canEdit, characterId, remember]
    );

    return useMemo(
        () => ({
            character,
            sheet,
            revision,
            connected,
            presenceByPath,
            isLoading,
            error,
            canEdit,
            setField,
            mutateSheet,
            claimPresence,
            releasePresence,
            replaceSheet,
            reload,
        }),
        [
            character,
            sheet,
            revision,
            connected,
            presenceByPath,
            isLoading,
            error,
            canEdit,
            setField,
            mutateSheet,
            claimPresence,
            releasePresence,
            replaceSheet,
            reload,
        ]
    );
}
