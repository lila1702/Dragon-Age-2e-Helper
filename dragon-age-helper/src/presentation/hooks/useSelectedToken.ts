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

    const refreshSelection = useCallback(async () => {
        if (!isObrReady) return;

        try {
            const { tokenId: resolvedId, error } = await owlbearService.resolveSelection();
            const prev = selectionRef.current;

            if (prev.tokenId === resolvedId && prev.error === error) {
                return;
            }

            selectionRef.current = { tokenId: resolvedId, error };
            setTokenId(resolvedId);
            setSelectionError(error);

            if (resolvedId) {
                const name = await owlbearService.getTokenDisplayName(resolvedId);
                setTokenName(name);
            } else {
                setTokenName(null);
            }
        } catch (err) {
            console.error("Erro ao resolver seleção de token:", err);
            selectionRef.current = { tokenId: null, error: "Selecione um token no mapa para abrir a ficha." };
            setTokenId(null);
            setTokenName(null);
            setSelectionError("Selecione um token no mapa para abrir a ficha.");
        }
    }, [isObrReady]);

    useEffect(() => {
        if (!isObrReady) {
            selectionRef.current = { tokenId: null, error: null };
            setTokenId(null);
            setTokenName(null);
            setSelectionError(null);
            return;
        }

        void refreshSelection();

        const unsubscribe = OBR.player.onChange(() => {
            void refreshSelection();
        });

        return () => {
            unsubscribe();
        };
    }, [isObrReady, refreshSelection]);

    return {
        tokenId,
        tokenName,
        selectionError,
        refreshSelection,
    };
}
