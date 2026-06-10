import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

import { owlbearService } from "../../infrastructure/owlbear/OwlbearService";

export function usePlayerRole(isObrReady: boolean) {
    const [isGM, setIsGM] = useState(false);

    useEffect(() => {
        if (!isObrReady) {
            setIsGM(false);
            return;
        }

        void owlbearService.isCurrentPlayerGm().then(setIsGM);

        const unsubscribe = OBR.player.onChange(() => {
            void owlbearService.isCurrentPlayerGm().then(setIsGM);
        });

        return () => {
            unsubscribe();
        };
    }, [isObrReady]);

    return { isGM };
}
