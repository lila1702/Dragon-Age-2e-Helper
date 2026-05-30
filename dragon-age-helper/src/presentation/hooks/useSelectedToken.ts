import { useCallback, useEffect, useRef, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

import { owlbearService } from "../../infrastructure/owlbear/OwlbearService";

import type { SelectionError } from "../../infrastructure/owlbear/selectionErrors";

export function useSelectedToken(isObrReady: boolean) {
    const [tokenId, setTokenId] = useState<string | null>(null);
    const [tokenName, setTokenName] = useState<string | null>(null);
    const [selectionError, setSelectionError] = useState<SelectionError>(null);
    const selectionRef = useRef<{ tokenId: string | null; error: SelectionError }>({
        tokenId: null,
        error: null,
    });
    const refreshGenerationRef = useRef(0);

    const refreshSelection = useCallback(async () => {
        if (!isObrReady) return;

        const generation = ++refreshGenerationRef.current;

        try {
            const { tokenId: resolvedId, error } = await owlbearService.resolveActiveToken();
            if (generation !== refreshGenerationRef.current) return;

            const prev = selectionRef.current;
            if (prev.tokenId === resolvedId && prev.error === error) {
                return;
            }

            selectionRef.current = { tokenId: resolvedId, error };
            setTokenId(resolvedId);
            setSelectionError(error);

            if (resolvedId) {
                const name = await owlbearService.getTokenDisplayName(resolvedId);
                if (generation !== refreshGenerationRef.current) return;
                setTokenName(name);
            } else {
                setTokenName(null);
            }
        } catch (err) {
            if (generation !== refreshGenerationRef.current) return;

            console.error("Erro ao resolver seleção de token:", err);
            selectionRef.current = { tokenId: null, error: "Selecione um token no mapa para abrir a ficha." };
            setTokenId(null);
            setTokenName(null);
            setSelectionError("Selecione um token no mapa para abrir a ficha.");
        }
    }, [isObrReady]);

    useEffect(() => {
        if (!isObrReady) {
            refreshGenerationRef.current += 1;
            selectionRef.current = { tokenId: null, error: null };
            setTokenId(null);
            setTokenName(null);
            setSelectionError(null);
            return;
        }

        void refreshSelection();

        const unsubscribePlayer = OBR.player.onChange(() => {
            void refreshSelection();
        });

        const unsubscribeSceneItems = OBR.scene.items.onChange((items) => {
            const activeTokenId = selectionRef.current.tokenId;
            if (activeTokenId && !items.some((item) => item.id === activeTokenId)) {
                void refreshSelection();
            }
        });

        let unsubscribeSceneReady: (() => void) | undefined;
        void OBR.scene.isReady().then((ready) => {
            if (!ready) {
                unsubscribeSceneReady = OBR.scene.onReadyChange((isReady) => {
                    if (isReady) void refreshSelection();
                });
            }
        });

        return () => {
            unsubscribePlayer();
            unsubscribeSceneItems();
            unsubscribeSceneReady?.();
        };
    }, [isObrReady, refreshSelection]);

    return {
        tokenId,
        tokenName,
        selectionError,
        refreshSelection,
    };
}
