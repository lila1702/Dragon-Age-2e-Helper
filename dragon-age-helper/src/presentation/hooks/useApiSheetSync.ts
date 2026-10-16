import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useRef } from "react";

import { apiClient, ApiError } from "../../infrastructure/api/ApiClient";
import { isApiEnabled } from "../../infrastructure/api/config";
import { realtimeClient } from "../../infrastructure/api/realtimeClient";
import { owlbearService } from "../../infrastructure/owlbear/OwlbearService";

import type { CharacterSheet } from "../../domain/entities/characterSheet";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

interface UseApiSheetSyncOptions {
    isObrReady: boolean;
    tokenId: string | null;
    hasSheetOnToken: boolean;
    isLoadingSheet: boolean;
    canEditToken: boolean;
    characterSheet: CharacterSheet;
    setCharacterSheet: Dispatch<SetStateAction<CharacterSheet>>;
    isDirtyRef: MutableRefObject<boolean>;
    skipSaveRef: MutableRefObject<boolean>;
    loadedTokenIdRef: MutableRefObject<string | null>;
    pushTrackersToToken: (sheet: CharacterSheet, tokenId: string) => void;
}

export function useApiSheetSync({
    isObrReady,
    tokenId,
    hasSheetOnToken,
    isLoadingSheet,
    canEditToken,
    characterSheet,
    setCharacterSheet,
    isDirtyRef,
    skipSaveRef,
    loadedTokenIdRef,
    pushTrackersToToken,
}: UseApiSheetSyncOptions): void {
    const apiUpdatedAtRef = useRef<string | null>(null);
    const subscribedCharacterIdRef = useRef<string | null>(null);
    const characterId = hasSheetOnToken ? characterSheet.id : null;

    useEffect(() => {
        if (!isApiEnabled() || !isObrReady || !tokenId || !hasSheetOnToken || isLoadingSheet) {
            return;
        }

        let cancelled = false;

        void (async () => {
            try {
                const roomId = OBR.room.id;
                let remoteId = characterSheet.id;

                const binding = await apiClient.getTokenBinding(roomId, tokenId);
                if (binding && binding.characterId !== remoteId) {
                    remoteId = binding.characterId;
                }

                const record = await apiClient.getCharacter(remoteId);
                if (cancelled) return;

                apiUpdatedAtRef.current = record.updatedAt;

                if (!isDirtyRef.current) {
                    skipSaveRef.current = true;
                    const normalized = record.sheet;
                    setCharacterSheet(normalized);
                    pushTrackersToToken(normalized, tokenId);
                    isDirtyRef.current = false;
                    queueMicrotask(() => {
                        skipSaveRef.current = false;
                    });
                }

                await apiClient.putTokenBinding(roomId, tokenId, record.id);
            } catch (error) {
                if (error instanceof ApiError && error.status === 404) {
                    if (!canEditToken) return;
                    try {
                        const created = await apiClient.createCharacter(characterSheet);
                        if (cancelled) return;
                        apiUpdatedAtRef.current = created.updatedAt;
                        await apiClient.putTokenBinding(OBR.room.id, tokenId, created.id);
                    } catch (createError) {
                        console.warn("Falha ao registrar ficha na API:", createError);
                    }
                    return;
                }
                console.warn("Sync inicial com API falhou:", error);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync once per token load
    }, [isObrReady, tokenId, hasSheetOnToken, isLoadingSheet]);

    useEffect(() => {
        if (!isApiEnabled() || !characterId) return;

        if (subscribedCharacterIdRef.current && subscribedCharacterIdRef.current !== characterId) {
            realtimeClient.unsubscribeCharacter(subscribedCharacterIdRef.current);
        }

        realtimeClient.subscribeCharacter(characterId);
        subscribedCharacterIdRef.current = characterId;

        const unsubscribe = realtimeClient.onCharacterUpdated((record) => {
            if (record.id !== characterId) return;
            if (isDirtyRef.current) return;

            apiUpdatedAtRef.current = record.updatedAt;
            const activeToken = loadedTokenIdRef.current ?? tokenId ?? record.sheet.tokenId ?? "";
            skipSaveRef.current = true;
            const normalized = record.sheet;
            setCharacterSheet(normalized);

            if (activeToken) {
                pushTrackersToToken(normalized, activeToken);
                void owlbearService.saveCharacterSheet(activeToken, normalized).catch((error) => {
                    console.warn("Falha ao espelhar ficha no token após evento realtime:", error);
                });
            }

            queueMicrotask(() => {
                skipSaveRef.current = false;
            });
        });

        return () => {
            unsubscribe();
            if (subscribedCharacterIdRef.current === characterId) {
                realtimeClient.unsubscribeCharacter(characterId);
                subscribedCharacterIdRef.current = null;
            }
        };
    }, [
        characterId,
        tokenId,
        setCharacterSheet,
        isDirtyRef,
        skipSaveRef,
        loadedTokenIdRef,
        pushTrackersToToken,
    ]);

    useEffect(() => {
        if (
            !isApiEnabled() ||
            !isObrReady ||
            !tokenId ||
            !hasSheetOnToken ||
            isLoadingSheet ||
            !canEditToken ||
            skipSaveRef.current ||
            !isDirtyRef.current
        ) {
            return;
        }

        const timer = window.setTimeout(() => {
            if (!isDirtyRef.current || skipSaveRef.current) return;

            void (async () => {
                try {
                    const record = await apiClient.saveCharacter(
                        characterSheet.id,
                        characterSheet,
                        apiUpdatedAtRef.current ?? undefined
                    );
                    apiUpdatedAtRef.current = record.updatedAt;
                    await apiClient.putTokenBinding(OBR.room.id, tokenId, record.id);
                } catch (error) {
                    if (error instanceof ApiError && error.status === 409) {
                        console.warn("Conflito ao salvar na API; recarregue a ficha.", error.body);
                        return;
                    }
                    console.warn("Falha ao salvar ficha na API:", error);
                }
            })();
        }, 800);

        return () => window.clearTimeout(timer);
    }, [
        characterSheet,
        isObrReady,
        tokenId,
        hasSheetOnToken,
        isLoadingSheet,
        canEditToken,
        isDirtyRef,
        skipSaveRef,
    ]);
}
