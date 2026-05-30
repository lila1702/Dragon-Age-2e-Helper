import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from "react";
import OBR from "@owlbear-rodeo/sdk";

import { owlbearService } from "../../infrastructure/owlbear/OwlbearService";
import {
    readHpMpFromOwlTrackers,
    tokenResourcesMatch,
} from "../../infrastructure/owlbear/owlTrackersSync";

import type { CharacterSheet } from "../../domain/entities/characterSheet";

const TRACKER_SYNC_DEBOUNCE_MS = 300;
const OUTBOUND_ECHO_GUARD_MS = 800;

interface UseOwlTrackerSyncOptions {
    isObrAvailable: boolean;
    isObrReady: boolean;
    tokenId: string | null;
    hasSheetOnToken: boolean;
    isLoadingSheet: boolean;
    canEditToken: boolean;
    loadedTokenIdRef: RefObject<string | null>;
    characterSheet: CharacterSheet;
    setCharacterSheet: Dispatch<SetStateAction<CharacterSheet>>;
    isDirtyRef: MutableRefObject<boolean>;
    isEditingResourcesRef: RefObject<boolean>;
}

export function useOwlTrackerSync({
    isObrAvailable,
    isObrReady,
    tokenId,
    hasSheetOnToken,
    isLoadingSheet,
    canEditToken,
    loadedTokenIdRef,
    characterSheet,
    setCharacterSheet,
    isDirtyRef,
    isEditingResourcesRef,
}: UseOwlTrackerSyncOptions): {
    pushTrackersToToken: (sheet: CharacterSheet, targetTokenId: string) => void;
} {
    const skipInboundSyncRef = useRef(false);
    const ignoreInboundUntilRef = useRef(0);

    const markOutboundSync = () => {
        skipInboundSyncRef.current = true;
        ignoreInboundUntilRef.current = Date.now() + OUTBOUND_ECHO_GUARD_MS;
    };

    const pushTrackersToToken = (sheet: CharacterSheet, targetTokenId: string) => {
        if (!isObrAvailable) return;

        markOutboundSync();
        void owlbearService.updateTokenTrackers(
            targetTokenId,
            sheet.hpCurrent,
            sheet.hpMax,
            sheet.mpCurrent,
            sheet.mpMax
        );
    };

    useEffect(() => {
        if (
            !isObrAvailable ||
            !isObrReady ||
            !tokenId ||
            !hasSheetOnToken ||
            isLoadingSheet ||
            !canEditToken ||
            loadedTokenIdRef.current !== tokenId
        ) {
            return;
        }

        const syncTokenId = tokenId;
        const { hpCurrent, hpMax, mpCurrent, mpMax } = characterSheet;

        const timer = window.setTimeout(() => {
            if (loadedTokenIdRef.current !== syncTokenId) return;

            markOutboundSync();
            void owlbearService.updateTokenTrackers(
                syncTokenId,
                hpCurrent,
                hpMax,
                mpCurrent,
                mpMax
            );
        }, TRACKER_SYNC_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [
        isObrAvailable,
        isObrReady,
        tokenId,
        hasSheetOnToken,
        isLoadingSheet,
        canEditToken,
        loadedTokenIdRef,
        characterSheet.hpCurrent,
        characterSheet.hpMax,
        characterSheet.mpCurrent,
        characterSheet.mpMax,
    ]);

    useEffect(() => {
        if (!isObrAvailable || !isObrReady || !tokenId || !hasSheetOnToken) {
            return;
        }

        const watchedTokenId = tokenId;

        return OBR.scene.items.onChange((items) => {
            if (isEditingResourcesRef.current) return;

            if (Date.now() < ignoreInboundUntilRef.current) return;

            if (skipInboundSyncRef.current) {
                skipInboundSyncRef.current = false;
                return;
            }

            const item = items.find((entry) => entry.id === watchedTokenId);
            if (!item) return;

            const resources = readHpMpFromOwlTrackers(item);
            if (!resources) return;

            setCharacterSheet((prev) => {
                if (tokenResourcesMatch(prev, resources)) return prev;

                isDirtyRef.current = true;
                return {
                    ...prev,
                    hpCurrent: resources.hpCurrent,
                    hpMax: resources.hpMax,
                    mpCurrent: resources.mpCurrent,
                    mpMax: resources.mpMax,
                };
            });
        });
    }, [
        isObrAvailable,
        isObrReady,
        tokenId,
        hasSheetOnToken,
        setCharacterSheet,
        isDirtyRef,
        isEditingResourcesRef,
    ]);

    return { pushTrackersToToken };
}
