import { useState, useEffect, useCallback } from "react";
import OBR from "@owlbear-rodeo/sdk";

import { owlbearService } from "../../infrastructure/owlbear/OwlbearService";
import { POPOVER_HEIGHT, POPOVER_WIDTH } from "../layout/popoverLayout";

import type { CharacterSheet, Attribute } from "../../domain/entities/characterSheet";
import type { StuntRollResult } from "../../domain/entities/diceRules";

const INITIAL_CHARACTER: CharacterSheet = {
    id: "sheet_01",
    tokenId: undefined,
    name: "Loghain Mac Tir",
    historico: "Soldado de Ferelden",
    className: "Guerreiro",
    level: 5,
    idade: "42",
    sexo: "Masculino",
    combatStats: {
        speed: 12,
        defense: 14,
        armor: 6,
        armorPenalty: 2,
    },
    hpCurrent: 45,
    hpMax: 45,
    mpCurrent: 10,
    mpMax: 10,
    attributes: [
        { name: "Astúcia", abbreviation: "AST", value: 1, focusNames: [] },
        { name: "Comunicação", abbreviation: "COM", value: 2, focusNames: [] },
        {
            name: "Constituição",
            abbreviation: "CON",
            value: 3,
            focusNames: ["Vigor"],
        },
        { name: "Destreza", abbreviation: "DES", value: 3, focusNames: [] },
        {
            name: "Força",
            abbreviation: "FOR",
            value: 4,
            focusNames: ["Espadas"],
        },
        { name: "Luta", abbreviation: "LUT", value: 0, focusNames: [] },
        {
            name: "Percepção",
            abbreviation: "PER",
            value: 1,
            focusNames: ["Audição"],
        },
        {
            name: "Precisão",
            abbreviation: "PRE",
            value: 1,
            focusNames: ["Arcos"],
        },
        { name: "Vontade", abbreviation: "VON", value: 2, focusNames: [] },
    ],
};

function syncTrackers(sheet: CharacterSheet, isObrReady: boolean): void {
    if (sheet.tokenId && isObrReady) {
        void owlbearService.updateTokenTrackers(
            sheet.tokenId,
            sheet.hpCurrent,
            sheet.hpMax,
            sheet.mpCurrent,
            sheet.mpMax
        );
    }
}

export function useCharacterSheet() {
    const [characterSheet, setCharacterSheet] = useState<CharacterSheet>(INITIAL_CHARACTER);
    const [isObrAvailable] = useState(() => OBR.isAvailable);
    const [isObrReady, setIsObrReady] = useState(
        () => isObrAvailable && OBR.isReady
    );
    const [lastRollResult, setLastRollResult] = useState<StuntRollResult | null>(null);
    const [rollError, setRollError] = useState<string | null>(null);

    useEffect(() => {
        if (!isObrAvailable || isObrReady) return;

        owlbearService.onReady(() => {
            setIsObrReady(true);
        });
    }, [isObrAvailable, isObrReady]);

    useEffect(() => {
        if (!isObrReady) return;

        void OBR.action.setWidth(POPOVER_WIDTH);
        void OBR.action.setHeight(POPOVER_HEIGHT);
    }, [isObrReady]);

    const rollAttribute = async (attribute: Attribute, focusName?: string) => {
        if (!isObrReady) {
            setRollError("Owlbear ainda não está pronto para rolagens.");
            return;
        }

        setRollError(null);

        const rollAttributePayload: Attribute = {
            ...attribute,
            activeFocusName: focusName,
        };

        try {
            const result = await owlbearService.rollAttributeTest(rollAttributePayload, {
                focusName,
            });
            setLastRollResult(result);
        } catch (error) {
            console.error("Erro ao rolar teste de atributo:", error);
            setRollError("Não foi possível rolar. Verifique se a extensão Dice+ está ativa na sala.");
        }
    };

    const clearLastRoll = () => {
        setLastRollResult(null);
        setRollError(null);
    };

    const setHpCurrent = useCallback(
        (value: number) => {
            setCharacterSheet((prev) => {
                const hpCurrent = Math.max(0, Math.min(prev.hpMax, value));
                const next = { ...prev, hpCurrent };
                syncTrackers(next, isObrReady);
                return next;
            });
        },
        [isObrReady]
    );

    const setHpMax = useCallback(
        (value: number) => {
            setCharacterSheet((prev) => {
                const hpMax = Math.max(0, value);
                const hpCurrent = Math.min(prev.hpCurrent, hpMax);
                const next = { ...prev, hpMax, hpCurrent };
                syncTrackers(next, isObrReady);
                return next;
            });
        },
        [isObrReady]
    );

    const setMpCurrent = useCallback(
        (value: number) => {
            setCharacterSheet((prev) => {
                const mpCurrent = Math.max(0, Math.min(prev.mpMax, value));
                const next = { ...prev, mpCurrent };
                syncTrackers(next, isObrReady);
                return next;
            });
        },
        [isObrReady]
    );

    const setMpMax = useCallback(
        (value: number) => {
            setCharacterSheet((prev) => {
                const mpMax = Math.max(0, value);
                const mpCurrent = Math.min(prev.mpCurrent, mpMax);
                const next = { ...prev, mpMax, mpCurrent };
                syncTrackers(next, isObrReady);
                return next;
            });
        },
        [isObrReady]
    );

    const addFocus = useCallback((abbreviation: string, focusName: string) => {
        setCharacterSheet((prev) => ({
            ...prev,
            attributes: prev.attributes.map((attr) => {
                if (attr.abbreviation !== abbreviation) return attr;
                const names = attr.focusNames ?? [];
                if (names.includes(focusName)) return attr;
                return { ...attr, focusNames: [...names, focusName] };
            }),
        }));
    }, []);

    const removeFocus = useCallback((abbreviation: string, focusName: string) => {
        setCharacterSheet((prev) => ({
            ...prev,
            attributes: prev.attributes.map((attr) => {
                if (attr.abbreviation !== abbreviation) return attr;
                const names = (attr.focusNames ?? []).filter((n) => n !== focusName);
                return { ...attr, focusNames: names };
            }),
        }));
    }, []);

    const setFocusBonus = useCallback((abbreviation: string, bonus: number) => {
        setCharacterSheet((prev) => ({
            ...prev,
            attributes: prev.attributes.map((attr) =>
                attr.abbreviation === abbreviation ? { ...attr, focusBonus: bonus } : attr
            ),
        }));
    }, []);

    return {
        characterSheet,
        isObrReady,
        lastRollResult,
        rollError,
        rollAttribute,
        clearLastRoll,
        setHpCurrent,
        setHpMax,
        setMpCurrent,
        setMpMax,
        addFocus,
        removeFocus,
        setFocusBonus,
    };
}

/** @deprecated Use useCharacterSheet */
export const useUserCharacterSheet = useCharacterSheet;
