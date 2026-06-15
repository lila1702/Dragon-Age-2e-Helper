import { useState, useEffect, useCallback, useRef } from "react";
import OBR from "@owlbear-rodeo/sdk";

import { createEmptySheet } from "../../domain/entities/createEmptySheet";
import { owlbearService } from "../../infrastructure/owlbear/OwlbearService";
import { showOwlbearNotification, showRollNotification, showDamageRollNotification } from "../../infrastructure/owlbear/rollNotification";
import { DEV_MOCK_CHARACTER } from "../fixtures/devMockCharacter";
import { POPOVER_HEIGHT, POPOVER_WIDTH } from "../layout/popoverLayout";
import { useSelectedToken } from "./useSelectedToken";
import { useOwlTrackerSync } from "./useOwlTrackerSync";

import {
    createEmptyClassAbility,
    createEmptyHabilidades,
    createEmptyMeleeAttack,
    createEmptyRangedAttack,
} from "../../domain/entities/habilidades";

import type { CharacterSheet, Attribute, CombatStats } from "../../domain/entities/characterSheet";
import type { ClassAbility, MeleeAttack, RangedAttack } from "../../domain/entities/habilidades";
import type { AttributeRollOptions } from "../../domain/entities/attributeRoll";
import type { AttackRollOptions } from "../../domain/entities/attackRoll";
import {
    computeAttackBonus,
    computeDamageWithAttribute,
    isAttackUntrained,
} from "../../domain/entities/attackBonus";
import { buildDamageRollNotation } from "../../domain/entities/attackRoll";

const SAVE_DEBOUNCE_MS = 600;

const SAVE_ERROR_MESSAGE =
    "Não foi possível salvar a ficha. Verifique se você pode editar este token.";

export function useCharacterSheet() {
    const [isObrAvailable] = useState(() => OBR.isAvailable);
    const [isObrReady, setIsObrReady] = useState(() => isObrAvailable && OBR.isReady);
    const [characterSheet, setCharacterSheet] = useState<CharacterSheet>(
        () => (isObrAvailable ? createEmptySheet("") : DEV_MOCK_CHARACTER)
    );
    const [hasSheetOnToken, setHasSheetOnToken] = useState(!isObrAvailable);
    const [isLoadingSheet, setIsLoadingSheet] = useState(false);
    const [isCreatingSheet, setIsCreatingSheet] = useState(false);
    const [canEditToken, setCanEditToken] = useState(!isObrAvailable);

    const skipSaveRef = useRef(true);
    const isRollingRef = useRef(false);
    const loadedTokenIdRef = useRef<string | null>(null);
    const previousTokenIdRef = useRef<string | null>(null);
    const isDirtyRef = useRef(false);
    const isEditingResourcesRef = useRef(false);
    const sheetSnapshotRef = useRef({
        tokenId: null as string | null,
        sheet: characterSheet,
        hasSheet: false,
    });

    const { tokenId, tokenName, selectionError } = useSelectedToken(isObrReady);

    const { pushTrackersToToken } = useOwlTrackerSync({
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
    });

    sheetSnapshotRef.current = {
        tokenId: loadedTokenIdRef.current,
        sheet: characterSheet,
        hasSheet: hasSheetOnToken,
    };

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

    const flushSaveForToken = useCallback(async (targetTokenId: string) => {
        const snap = sheetSnapshotRef.current;
        if (snap.tokenId !== targetTokenId || !snap.hasSheet || !isDirtyRef.current) return;

        const editable = await owlbearService.canEditToken(targetTokenId);
        if (!editable) return;

        try {
            await owlbearService.saveCharacterSheet(targetTokenId, snap.sheet);
            isDirtyRef.current = false;
        } catch (error) {
            console.error("Erro ao salvar ficha do token:", error);
            void showOwlbearNotification(SAVE_ERROR_MESSAGE, "WARNING");
        }
    }, []);

    useEffect(() => {
        return () => {
            const snap = sheetSnapshotRef.current;
            if (!snap.tokenId || !snap.hasSheet || !isDirtyRef.current) return;

            void (async () => {
                const editable = await owlbearService.canEditToken(snap.tokenId!);
                if (!editable) return;
                try {
                    await owlbearService.saveCharacterSheet(snap.tokenId!, snap.sheet);
                } catch (error) {
                    console.error("Erro ao salvar ficha ao fechar:", error);
                }
            })();
        };
    }, []);

    useEffect(() => {
        if (!isObrAvailable) {
            skipSaveRef.current = true;
            loadedTokenIdRef.current = null;
            isDirtyRef.current = false;
            setCanEditToken(true);
            setCharacterSheet(DEV_MOCK_CHARACTER);
            setHasSheetOnToken(true);
            return;
        }

        if (!isObrReady || !tokenId || selectionError) {
            const tokenToFlush = loadedTokenIdRef.current;
            previousTokenIdRef.current = null;
            if (tokenToFlush) {
                void flushSaveForToken(tokenToFlush);
            }
            skipSaveRef.current = true;
            loadedTokenIdRef.current = null;
            isDirtyRef.current = false;
            setCanEditToken(false);
            setHasSheetOnToken(false);
            return;
        }

        if (tokenId === loadedTokenIdRef.current) {
            return;
        }

        let cancelled = false;
        const loadForToken = tokenId;
        const tokenToFlush = previousTokenIdRef.current;
        previousTokenIdRef.current = loadForToken;

        skipSaveRef.current = true;
        loadedTokenIdRef.current = null;
        isDirtyRef.current = false;
        setIsLoadingSheet(true);

        void (async () => {
            try {
                if (tokenToFlush && tokenToFlush !== loadForToken) {
                    await flushSaveForToken(tokenToFlush);
                }
                if (cancelled) return;

                const [loaded, editable] = await Promise.all([
                    owlbearService.loadCharacterSheet(loadForToken),
                    owlbearService.canEditToken(loadForToken),
                ]);

                if (cancelled) return;

                setCanEditToken(editable);
                skipSaveRef.current = true;
                loadedTokenIdRef.current = loadForToken;
                isDirtyRef.current = false;

                if (loaded) {
                    setHasSheetOnToken(true);
                    setCharacterSheet(loaded);
                    pushTrackersToToken(loaded, loadForToken);
                } else {
                    setHasSheetOnToken(false);
                    setCharacterSheet(createEmptySheet(loadForToken));
                }
            } catch (error) {
                console.error("Erro ao carregar ficha do token:", error);
                if (!cancelled) {
                    loadedTokenIdRef.current = loadForToken;
                    isDirtyRef.current = false;
                    setHasSheetOnToken(false);
                    setCharacterSheet(createEmptySheet(loadForToken));
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingSheet(false);
                    queueMicrotask(() => {
                        skipSaveRef.current = false;
                    });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isObrAvailable, isObrReady, tokenId, selectionError, flushSaveForToken, pushTrackersToToken]);

    useEffect(() => {
        if (!isObrReady || !tokenId || !hasSheetOnToken || skipSaveRef.current) return;
        if (isLoadingSheet || loadedTokenIdRef.current !== tokenId || !canEditToken) return;
        if (!isDirtyRef.current) return;

        const saveTokenId = tokenId;

        const persist = async () => {
            if (!isDirtyRef.current || loadedTokenIdRef.current !== saveTokenId) return;

            const sheetToSave = sheetSnapshotRef.current.sheet;
            try {
                await owlbearService.saveCharacterSheet(saveTokenId, sheetToSave);
                isDirtyRef.current = false;
            } catch (error) {
                console.error("Erro ao salvar ficha do token:", error);
                void showOwlbearNotification(SAVE_ERROR_MESSAGE, "WARNING");
            }
        };

        const timer = window.setTimeout(() => void persist(), SAVE_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timer);
        };
    }, [characterSheet, hasSheetOnToken, isObrReady, tokenId, isLoadingSheet, canEditToken]);

    const canEditSheet =
        (!isObrAvailable && hasSheetOnToken) ||
        (isObrReady &&
            !!tokenId &&
            !selectionError &&
            hasSheetOnToken &&
            !isLoadingSheet &&
            canEditToken);

    const isReadOnlySheet =
        isObrAvailable &&
        isObrReady &&
        !!tokenId &&
        !selectionError &&
        hasSheetOnToken &&
        !isLoadingSheet &&
        !canEditToken;

    const needsCreateSheet =
        isObrAvailable &&
        isObrReady &&
        !!tokenId &&
        !selectionError &&
        !hasSheetOnToken &&
        !isLoadingSheet;

    const canCreateSheet = needsCreateSheet && canEditToken;

    const createSheetOnToken = useCallback(async () => {
        if (!tokenId || !isObrReady || !canEditToken) return;

        setIsCreatingSheet(true);
        try {
            const sheet = createEmptySheet(tokenId);
            skipSaveRef.current = true;
            await owlbearService.saveCharacterSheet(tokenId, sheet);
            loadedTokenIdRef.current = tokenId;
            isDirtyRef.current = false;
            setCharacterSheet(sheet);
            setHasSheetOnToken(true);
            queueMicrotask(() => {
                skipSaveRef.current = false;
            });
        } catch (error) {
            console.error("Erro ao criar ficha no token:", error);
            void showOwlbearNotification(SAVE_ERROR_MESSAGE, "WARNING");
        } finally {
            setIsCreatingSheet(false);
        }
    }, [tokenId, isObrReady, canEditToken]);

    const rollAttribute = async (attribute: Attribute, options?: AttributeRollOptions) => {
        const canRoll = !isObrAvailable || isObrReady;
        if (!canRoll) {
            void showOwlbearNotification("Owlbear ainda não está pronto para rolagens.", "WARNING");
            return;
        }

        if (!canEditSheet) return;

        if (isRollingRef.current) {
            void showOwlbearNotification("Aguarde a rolagem anterior terminar.", "INFO");
            return;
        }

        isRollingRef.current = true;

        const rollAttributePayload: Attribute = {
            ...attribute,
            activeFocusName: options?.focusName,
        };

        const rollLabel = options?.focusName
            ? `${attribute.abbreviation} (${options.focusName})`
            : attribute.abbreviation;

        try {
            const result = await owlbearService.rollAttributeTest(rollAttributePayload, options);
            await showRollNotification(rollLabel, result);
        } catch (error) {
            console.error("Erro ao rolar teste de atributo:", error);
            const fallback = isObrAvailable
                ? "Não foi possível rolar. Verifique se a extensão Dice+ está ativa na sala."
                : "Não foi possível simular a rolagem.";
            const message = error instanceof Error ? error.message : fallback;
            void showOwlbearNotification(message, "WARNING");
        } finally {
            isRollingRef.current = false;
        }
    };

    const rollAttack = useCallback(
        async (
            attackId: string,
            attackKind: "melee" | "ranged",
            options?: AttackRollOptions
        ) => {
            const canRollNow = !isObrAvailable || isObrReady;
            if (!canRollNow) {
                void showOwlbearNotification("Owlbear ainda não está pronto para rolagens.", "WARNING");
                return;
            }
            if (!canEditSheet) return;
            if (isRollingRef.current) {
                void showOwlbearNotification("Aguarde a rolagem anterior terminar.", "INFO");
                return;
            }

            const habilidades = characterSheet.habilidades ?? createEmptyHabilidades();
            const attack =
                attackKind === "melee"
                    ? habilidades.meleeAttacks.find((entry) => entry.id === attackId)
                    : habilidades.rangedAttacks.find((entry) => entry.id === attackId);
            if (!attack) return;

            const untrained = isAttackUntrained(attack.weaponGroup, habilidades.weaponGroups);
            const attackBonus = computeAttackBonus(
                characterSheet.attributes,
                attack.attributeAbbreviation,
                untrained,
                attack.weaponGroup
            );
            const rollLabel = `${attack.name || "Ataque"} (${attack.attributeAbbreviation || "—"})`;

            isRollingRef.current = true;
            try {
                const result = await owlbearService.rollAttackTest(attackBonus, options);
                await showRollNotification(rollLabel, result);
            } catch (error) {
                console.error("Erro ao rolar ataque:", error);
                const message =
                    error instanceof Error ? error.message : "Não foi possível rolar o ataque.";
                void showOwlbearNotification(message, "WARNING");
            } finally {
                isRollingRef.current = false;
            }
        },
        [canEditSheet, characterSheet, isObrAvailable, isObrReady]
    );

    const rollDamage = useCallback(
        async (
            attackId: string,
            attackKind: "melee" | "ranged",
            options?: AttackRollOptions
        ) => {
            const canRollNow = !isObrAvailable || isObrReady;
            if (!canRollNow) {
                void showOwlbearNotification("Owlbear ainda não está pronto para rolagens.", "WARNING");
                return;
            }
            if (!canEditSheet) return;
            if (isRollingRef.current) {
                void showOwlbearNotification("Aguarde a rolagem anterior terminar.", "INFO");
                return;
            }

            const habilidades = characterSheet.habilidades ?? createEmptyHabilidades();
            const attack =
                attackKind === "melee"
                    ? habilidades.meleeAttacks.find((entry) => entry.id === attackId)
                    : habilidades.rangedAttacks.find((entry) => entry.id === attackId);
            if (!attack) return;

            const untrained = isAttackUntrained(attack.weaponGroup, habilidades.weaponGroups);
            const damageOptions = {
                attributes: characterSheet.attributes,
                attackAttributeAbbreviation: attack.attributeAbbreviation,
                damageAttributeAbbreviation: attack.damageAttributeAbbreviation,
                lutUsesWillpowerForDamage: habilidades.lutUsesWillpowerForDamage,
            };
            const fullDamage = computeDamageWithAttribute(attack.damage, damageOptions);

            if (!buildDamageRollNotation(fullDamage, options?.situationalModifier ?? 0)) {
                void showOwlbearNotification("Dano inválido para rolagem.", "WARNING");
                return;
            }

            const rollLabel = `${attack.name || "Arma"} — dano`;
            isRollingRef.current = true;
            try {
                const result = await owlbearService.rollDamageTest(
                    fullDamage,
                    untrained,
                    options
                );
                await showDamageRollNotification(
                    rollLabel,
                    result.diceValues,
                    result.total,
                    result.halved,
                    result.rawTotal
                );
            } catch (error) {
                console.error("Erro ao rolar dano:", error);
                const message =
                    error instanceof Error ? error.message : "Não foi possível rolar o dano.";
                void showOwlbearNotification(message, "WARNING");
            } finally {
                isRollingRef.current = false;
            }
        },
        [canEditSheet, characterSheet, isObrAvailable, isObrReady]
    );

    const updateSheet = useCallback(
        (updater: (prev: CharacterSheet) => CharacterSheet) => {
            if (!canEditSheet) return;
            isDirtyRef.current = true;
            setCharacterSheet(updater);
        },
        [canEditSheet]
    );

    const setResourceEditing = useCallback((isEditing: boolean) => {
        isEditingResourcesRef.current = isEditing;
    }, []);

    const setName = useCallback((name: string) => updateSheet((prev) => ({ ...prev, name })), [updateSheet]);

    const setHistorico = useCallback(
        (historico: string) => updateSheet((prev) => ({ ...prev, historico })),
        [updateSheet]
    );

    const setClassName = useCallback(
        (className: string) => updateSheet((prev) => ({ ...prev, className })),
        [updateSheet]
    );

    const setLevel = useCallback(
        (level: number) =>
            updateSheet((prev) => ({
                ...prev,
                level: Math.max(1, level),
            })),
        [updateSheet]
    );

    const setIdade = useCallback(
        (idade: string) => updateSheet((prev) => ({ ...prev, idade })),
        [updateSheet]
    );

    const setSexo = useCallback(
        (sexo: string) => updateSheet((prev) => ({ ...prev, sexo })),
        [updateSheet]
    );

    const setCombatStat = useCallback(
        (stat: keyof CombatStats, value: number) =>
            updateSheet((prev) => ({
                ...prev,
                combatStats: {
                    speed: 0,
                    defense: 0,
                    armor: 0,
                    armorPenalty: 0,
                    ...prev.combatStats,
                    [stat]: value,
                },
            })),
        [updateSheet]
    );

    const setAttributeValue = useCallback(
        (abbreviation: string, value: number) =>
            updateSheet((prev) => ({
                ...prev,
                attributes: prev.attributes.map((attr) =>
                    attr.abbreviation === abbreviation ? { ...attr, value } : attr
                ),
            })),
        [updateSheet]
    );

    const setHpCurrent = useCallback(
        (value: number) =>
            updateSheet((prev) => {
                const hpCurrent = Math.max(0, Math.min(prev.hpMax, value));
                return { ...prev, hpCurrent };
            }),
        [updateSheet]
    );

    const setHpMax = useCallback(
        (value: number) =>
            updateSheet((prev) => {
                const hpMax = Math.max(0, value);
                const hpCurrent = Math.min(prev.hpCurrent, hpMax);
                return { ...prev, hpMax, hpCurrent };
            }),
        [updateSheet]
    );

    const setMpCurrent = useCallback(
        (value: number) =>
            updateSheet((prev) => {
                const mpCurrent = Math.max(0, Math.min(prev.mpMax, value));
                return { ...prev, mpCurrent };
            }),
        [updateSheet]
    );

    const setMpMax = useCallback(
        (value: number) =>
            updateSheet((prev) => {
                const mpMax = Math.max(0, value);
                const mpCurrent = Math.min(prev.mpCurrent, mpMax);
                return { ...prev, mpMax, mpCurrent };
            }),
        [updateSheet]
    );

    const addFocus = useCallback(
        (abbreviation: string, focusName: string) =>
            updateSheet((prev) => ({
                ...prev,
                attributes: prev.attributes.map((attr) => {
                    if (attr.abbreviation !== abbreviation) return attr;
                    const names = attr.focusNames ?? [];
                    if (names.includes(focusName)) return attr;
                    return { ...attr, focusNames: [...names, focusName] };
                }),
            })),
        [updateSheet]
    );

    const removeFocus = useCallback(
        (abbreviation: string, focusName: string) =>
            updateSheet((prev) => ({
                ...prev,
                attributes: prev.attributes.map((attr) => {
                    if (attr.abbreviation !== abbreviation) return attr;
                    const names = (attr.focusNames ?? []).filter((n) => n !== focusName);
                    return { ...attr, focusNames: names };
                }),
            })),
        [updateSheet]
    );

    const renameFocus = useCallback(
        (abbreviation: string, oldName: string, newName: string) => {
            const trimmed = newName.trim();
            if (!trimmed || trimmed === oldName) return;
            updateSheet((prev) => ({
                ...prev,
                attributes: prev.attributes.map((attr) => {
                    if (attr.abbreviation !== abbreviation) return attr;
                    const names = attr.focusNames ?? [];
                    if (names.includes(trimmed)) return attr;
                    return {
                        ...attr,
                        focusNames: names.map((n) => (n === oldName ? trimmed : n)),
                    };
                }),
            }));
        },
        [updateSheet]
    );

    const reorderFocus = useCallback(
        (abbreviation: string, fromIndex: number, toIndex: number) => {
            if (fromIndex === toIndex) return;
            updateSheet((prev) => ({
                ...prev,
                attributes: prev.attributes.map((attr) => {
                    if (attr.abbreviation !== abbreviation) return attr;
                    const names = [...(attr.focusNames ?? [])];
                    const [moved] = names.splice(fromIndex, 1);
                    if (!moved) return attr;
                    names.splice(toIndex, 0, moved);
                    return { ...attr, focusNames: names };
                }),
            }));
        },
        [updateSheet]
    );

    const setFocusBonus = useCallback(
        (abbreviation: string, bonus: number) =>
            updateSheet((prev) => ({
                ...prev,
                attributes: prev.attributes.map((attr) =>
                    attr.abbreviation === abbreviation ? { ...attr, focusBonus: bonus } : attr
                ),
            })),
        [updateSheet]
    );

    const setAttributePrimary = useCallback(
        (abbreviation: string, isPrimary: boolean) =>
            updateSheet((prev) => ({
                ...prev,
                attributes: prev.attributes.map((attr) =>
                    attr.abbreviation === abbreviation ? { ...attr, isPrimary } : attr
                ),
            })),
        [updateSheet]
    );

    const addMeleeAttack = useCallback(
        () =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        meleeAttacks: [...habilidades.meleeAttacks, createEmptyMeleeAttack()],
                    },
                };
            }),
        [updateSheet]
    );

    const updateMeleeAttack = useCallback(
        (id: string, patch: Partial<MeleeAttack>) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        meleeAttacks: habilidades.meleeAttacks.map((attack) =>
                            attack.id === id ? { ...attack, ...patch } : attack
                        ),
                    },
                };
            }),
        [updateSheet]
    );

    const removeMeleeAttack = useCallback(
        (id: string) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        meleeAttacks: habilidades.meleeAttacks.filter((attack) => attack.id !== id),
                    },
                };
            }),
        [updateSheet]
    );

    const reorderMeleeAttack = useCallback(
        (fromIndex: number, toIndex: number) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                const attacks = [...habilidades.meleeAttacks];
                const [moved] = attacks.splice(fromIndex, 1);
                if (!moved) return prev;
                attacks.splice(toIndex, 0, moved);
                return {
                    ...prev,
                    habilidades: { ...habilidades, meleeAttacks: attacks },
                };
            }),
        [updateSheet]
    );

    const addRangedAttack = useCallback(
        () =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        rangedAttacks: [...habilidades.rangedAttacks, createEmptyRangedAttack()],
                    },
                };
            }),
        [updateSheet]
    );

    const updateRangedAttack = useCallback(
        (id: string, patch: Partial<RangedAttack>) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        rangedAttacks: habilidades.rangedAttacks.map((attack) =>
                            attack.id === id ? { ...attack, ...patch } : attack
                        ),
                    },
                };
            }),
        [updateSheet]
    );

    const removeRangedAttack = useCallback(
        (id: string) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        rangedAttacks: habilidades.rangedAttacks.filter((attack) => attack.id !== id),
                    },
                };
            }),
        [updateSheet]
    );

    const reorderRangedAttack = useCallback(
        (fromIndex: number, toIndex: number) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                const attacks = [...habilidades.rangedAttacks];
                const [moved] = attacks.splice(fromIndex, 1);
                if (!moved) return prev;
                attacks.splice(toIndex, 0, moved);
                return {
                    ...prev,
                    habilidades: { ...habilidades, rangedAttacks: attacks },
                };
            }),
        [updateSheet]
    );

    const setWeaponGroups = useCallback(
        (weaponGroups: string) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: { ...habilidades, weaponGroups },
                };
            }),
        [updateSheet]
    );

    const setLutUsesWillpowerForDamage = useCallback(
        (lutUsesWillpowerForDamage: boolean) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: { ...habilidades, lutUsesWillpowerForDamage },
                };
            }),
        [updateSheet]
    );

    const setArcaneWarriorOptionEnabled = useCallback(
        (arcaneWarriorOptionEnabled: boolean) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        arcaneWarriorOptionEnabled,
                        lutUsesWillpowerForDamage: arcaneWarriorOptionEnabled
                            ? habilidades.lutUsesWillpowerForDamage
                            : false,
                    },
                };
            }),
        [updateSheet]
    );

    const addClassAbility = useCallback(
        () =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        classAbilities: [...habilidades.classAbilities, createEmptyClassAbility()],
                    },
                };
            }),
        [updateSheet]
    );

    const updateClassAbility = useCallback(
        (id: string, patch: Partial<ClassAbility>) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        classAbilities: habilidades.classAbilities.map((ability) =>
                            ability.id === id ? { ...ability, ...patch } : ability
                        ),
                    },
                };
            }),
        [updateSheet]
    );

    const removeClassAbility = useCallback(
        (id: string) =>
            updateSheet((prev) => {
                const habilidades = prev.habilidades ?? createEmptyHabilidades();
                return {
                    ...prev,
                    habilidades: {
                        ...habilidades,
                        classAbilities: habilidades.classAbilities.filter(
                            (ability) => ability.id !== id
                        ),
                    },
                };
            }),
        [updateSheet]
    );

    const canRoll = canEditSheet && (!isObrAvailable || isObrReady);

    return {
        characterSheet,
        isObrAvailable,
        isObrReady,
        tokenId,
        tokenName,
        selectionError,
        isLoadingSheet,
        needsCreateSheet,
        canCreateSheet,
        canEditSheet,
        canRoll,
        isReadOnlySheet,
        isCreatingSheet,
        createSheetOnToken,
        rollAttribute,
        rollAttack,
        rollDamage,
        setName,
        setHistorico,
        setClassName,
        setLevel,
        setIdade,
        setSexo,
        setCombatStat,
        setAttributeValue,
        setHpCurrent,
        setHpMax,
        setMpCurrent,
        setMpMax,
        setResourceEditing,
        addFocus,
        removeFocus,
        renameFocus,
        reorderFocus,
        setFocusBonus,
        setAttributePrimary,
        addMeleeAttack,
        updateMeleeAttack,
        removeMeleeAttack,
        reorderMeleeAttack,
        addRangedAttack,
        updateRangedAttack,
        removeRangedAttack,
        reorderRangedAttack,
        setWeaponGroups,
        setLutUsesWillpowerForDamage,
        setArcaneWarriorOptionEnabled,
        addClassAbility,
        updateClassAbility,
        removeClassAbility,
    };
}

/** @deprecated Use useCharacterSheet */
export const useUserCharacterSheet = useCharacterSheet;
