import { useState, useEffect } from "react";
import { owlbearService } from "../../infrastructure/owlbear/OwlbearService";
import type { CharacterSheet, Attribute } from "../../domain/entities/characterSheet";

const INITIAL_CHARACTER: CharacterSheet = {
  id: "sheet_01",
  tokenId: undefined,
  name: "Loghain Mac Tir",
  className: "Guerreiro",
  level: 5,
  hpCurrent: 45,
  hpMax: 45,
  mpCurrent: 10,
  mpMax: 10,
  attributes: [
    { name: "Astúcia", abbreviation: "AST", value: 1, focus: 0 },
    { name: "Comunicação", abbreviation: "COM", value: 2, focus: 0 },
    { name: "Constituição", abbreviation: "CON", value: 3, focus: 2 },
    { name: "Destreza", abbreviation: "DES", value: 3, focus: 0 },
    { name: "Força", abbreviation: "FOR", value: 4, focus: 2 },
    { name: "Luta", abbreviation: "LUT", value: 0, focus: 0 },
    { name: "Percepção", abbreviation: "PER", value: 1, focus: 1 },
    { name: "Precisão", abbreviation: "PRE", value: 1, focus: 1 },
    { name: "Vontade", abbreviation: "VON", value: 2, focus: 0 },
  ]
};

export function useUserCharacterSheet() {
    const [characterSheet, setCharacterSheet] = useState<CharacterSheet>(INITIAL_CHARACTER);
    const [isObrReady, setIsObrReady] = useState(false);

    useEffect(() => {
        owlbearService.onReady(() => {
            setIsObrReady(true);
        });
    }, []);

    const rollAttribute = async (attribute: Attribute) => {
        if (!isObrReady) {
            console.warn("Owlbear Rodeo SDK is not ready yet.");
            return;
        }

        try {
            const result = await owlbearService.rollAttributeTest(attribute);
            console.log("Resultado do teste de atributo:", result);

            if (result.hasStunts) {
                alert(`Você conseguiu ${result.stuntPoints} pontos de façanha!`);
            }

        } catch (error) {
            console.error("Erro ao rolar teste de atributo:", error);
            alert("Ocorreu um erro ao rolar o teste. Verifique o console para mais detalhes.");
        }
    }

    const updateHp = async (amount: number) => {
        setCharacterSheet((prev) => {
            const newHpCurrent = Math.max(0, Math.min(prev.hpMax, prev.hpCurrent + amount));

            if (prev.tokenId && isObrReady) {
                owlbearService.updateTokenTrackers(prev.tokenId, newHpCurrent, prev.hpMax, prev.mpCurrent, prev.mpMax);
            }

            return { ...prev, hpCurrent: newHpCurrent };
        });
    };

    const updateMp = async (amount: number) => {
        setCharacterSheet((prev) => {
            const newMpCurrent = Math.max(0, Math.min(prev.mpMax, prev.mpCurrent + amount));

            if (prev.tokenId && isObrReady) {
                owlbearService.updateTokenTrackers(prev.tokenId, prev.hpCurrent, prev.hpMax, newMpCurrent, prev.mpMax);
            }

            return { ...prev, mpCurrent: newMpCurrent };
        });
    };

    return { characterSheet, isObrReady, rollAttribute, updateHp, updateMp };
}