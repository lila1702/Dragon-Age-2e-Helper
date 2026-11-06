import { useEffect, useMemo, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

import { CatalogProvider, useSyncedCharacterSheet } from "@dragon-age/client";
import {
    createEmptyArcanaSpecialization,
    createEmptyClassAbility,
    createEmptyHabilidades,
    createEmptyInventoryItem,
    createEmptyMeleeAttack,
    createEmptyRangedAttack,
    createEmptySpell,
    createEmptyTalent,
    registerDiceRoller,
    type CharacterSheet,
} from "@dragon-age/domain";

import { api } from "./infrastructure/api/api";
import { WEB_APP_URL } from "./infrastructure/api/config";
import { DicePlusRoller } from "./infrastructure/ports/dicePlusRoller";
import { OwlbearBridge } from "./infrastructure/ports/owlbearBridge";
import { owlbearService } from "./infrastructure/owlbear/OwlbearService";
import { AuthPanel } from "./presentation/components/AuthPanel";
import { CharacterSheetView } from "./presentation/components/CharacterSheetView";
import { GmSettingsPanel } from "./presentation/components/GmSettingsPanel";
import { ModeGate } from "./presentation/components/ModeGate";
import { TokenLinkPanel } from "./presentation/components/TokenLinkPanel";
import { useCharacterSheet } from "./presentation/hooks/useCharacterSheet";
import { useExtensionSession } from "./presentation/hooks/useExtensionSession";
import { usePlayerRole } from "./presentation/hooks/usePlayerRole";

import "./index.css";
import "./presentation/styles/modeGate.css";

registerDiceRoller(new DicePlusRoller());
const tabletop = new OwlbearBridge();

function App() {
    const local = useCharacterSheet();
    const { isGM } = usePlayerRole(local.isObrReady);
    const session = useExtensionSession(local.isObrReady);
    const [linkBusy, setLinkBusy] = useState(false);
    const [forceRelink, setForceRelink] = useState(false);

    useEffect(() => {
        setForceRelink(false);
        session.setStatus(null);
        if (session.mode !== "online" || !session.user) return;
        void session.resolveCharacterForToken(local.tokenId);
    }, [local.tokenId, session.mode, session.user, session.campaignId, session.setStatus, session.resolveCharacterForToken]);

    const canEditApi = useMemo(() => {
        if (!session.user || !session.linkedCharacter) return false;
        return (
            session.linkedCharacter.ownerUserId === session.user.id ||
            session.linkedCharacter.assignedPlayerUserId === session.user.id ||
            session.campaigns.find((campaign) => campaign.id === session.campaignId)?.role === "GM"
        );
    }, [session.campaignId, session.campaigns, session.linkedCharacter, session.user]);

    const synced = useSyncedCharacterSheet({
        api,
        characterId: session.mode === "online" ? session.linkedCharacter?.id ?? null : null,
        campaignId: session.mode === "online" ? session.campaignId : null,
        sessionToken: session.mode === "online" ? session.token : null,
        canEdit: canEditApi,
        displayName: session.user?.displayName ?? "Jogador",
        knownCharacters: session.campaignCharacters,
    });

    useEffect(() => {
        if (session.mode !== "online" || !session.linkedCharacter || !local.isObrReady) return;
        if (!local.tokenId) return;
        const hp = { current: synced.sheet.hpCurrent, max: synced.sheet.hpMax };
        const mp = { current: synced.sheet.mpCurrent, max: synced.sheet.mpMax };
        const tokenId = local.tokenId;
        const timer = window.setTimeout(() => {
            void tabletop.pushBars(tokenId, hp, mp);
        }, 180);
        return () => window.clearTimeout(timer);
    }, [
        local.isObrReady,
        local.tokenId,
        session.linkedCharacter,
        session.mode,
        synced.sheet.hpCurrent,
        synced.sheet.hpMax,
        synced.sheet.mpCurrent,
        synced.sheet.mpMax,
    ]);

    const usingApi = session.mode === "online" && Boolean(session.user && session.linkedCharacter);
    const needsTokenLink =
        session.mode === "online" &&
        Boolean(
            session.user &&
                local.tokenId &&
                !local.isLoadingSheet &&
                (!session.linkedCharacter || forceRelink)
        );
    const sheet = usingApi ? synced.sheet : local.characterSheet;
    const canEditSheet = usingApi ? synced.canEdit : local.canEditSheet;
    const isLoadingSheet = usingApi ? synced.isLoading : local.isLoadingSheet;
    const isReadOnlySheet = usingApi ? !synced.canEdit : local.isReadOnlySheet;

    const mutateApi = (updater: (current: CharacterSheet) => CharacterSheet) => {
        if (!usingApi) return false;
        synced.mutateSheet(updater);
        return true;
    };

    const showGate = session.mode === null && !session.authStep;
    const showAuth = session.authStep && !session.user;

    if (showGate) {
        return (
            <ModeGate
                webAppUrl={WEB_APP_URL}
                onLogin={session.startLogin}
                onOffline={session.chooseOffline}
            />
        );
    }

    if (showAuth) {
        return (
            <AuthPanel
                obrRoomId={local.isObrReady && OBR.isAvailable ? OBR.room.id : null}
                onBack={session.cancelLogin}
                onAuthenticated={({ token, user, campaignId }) => {
                    session.acceptSession(token, user, campaignId);
                }}
                onLogin={session.login}
            />
        );
    }

    return (
        <CatalogProvider
            api={session.mode === "online" && session.user ? api : null}
            rulesetId={
                session.campaigns.find((campaign) => campaign.id === session.campaignId)?.rulesetId ??
                "dragon-age-age"
            }
        >
            {session.mode === "online" && session.user && (
                <div className="session-chrome">
                    <div className="session-chrome__row">
                        <div className="session-chrome__who">
                            <strong>{session.user.displayName}</strong>
                            <span>
                                {synced.connected ? "ao vivo" : "nuvem"}
                                {session.roomLinked ? " · sala ok" : ""}
                                {session.linkedCharacter
                                    ? ` · ${session.linkedCharacter.name || "ficha"}`
                                    : ""}
                            </span>
                        </div>
                        <div className="session-chrome__row" style={{ gap: 6 }}>
                            {isGM && (
                                <GmSettingsPanel
                                    campaignId={session.campaignId}
                                    campaigns={session.campaigns}
                                    characters={session.campaignCharacters}
                                    onCampaignUpdated={(updated) => {
                                        session.setCampaigns((prev) =>
                                            prev.map((entry) =>
                                                entry.id === updated.id
                                                    ? { ...entry, ...updated }
                                                    : entry
                                            )
                                        );
                                        session.setStatus("Preferência da campanha atualizada.");
                                    }}
                                    onCharacterUpdated={() => {
                                        void session.reloadCampaignCharacters();
                                    }}
                                />
                            )}
                            {session.linkedCharacter && local.tokenId && (
                                <button
                                    type="button"
                                    className="token-bar__btn"
                                    onClick={() => setForceRelink((value) => !value)}
                                >
                                    {forceRelink ? "Cancelar troca" : "Trocar token/ficha"}
                                </button>
                            )}
                            <button type="button" className="token-bar__btn" onClick={session.logout}>
                                Sair
                            </button>
                        </div>
                    </div>
                    {session.campaigns.length > 1 && (
                        <label className="session-chrome__campaign">
                            Campanha
                            <select
                                value={session.campaignId ?? ""}
                                onChange={(event) =>
                                    session.setCampaignId(event.target.value || null)
                                }
                            >
                                {session.campaigns.map((campaign) => (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    {session.status && <p className="session-chrome__status">{session.status}</p>}
                </div>
            )}

            {session.mode === "offline" && (
                <div className="session-chrome session-chrome--offline">
                    <span>Modo offline — ficha só neste token</span>
                    <button type="button" className="token-bar__btn" onClick={session.logout}>
                        Trocar modo
                    </button>
                </div>
            )}

            {needsTokenLink && local.tokenId && (
                <TokenLinkPanel
                    tokenName={local.tokenName}
                    characters={session.campaignCharacters
                        .filter((entry) => entry.status !== "inactive")
                        .map((entry) => ({
                            id: entry.id,
                            name: entry.name || entry.sheet.name || "Sem nome",
                        }))}
                    isGm={isGM}
                    busy={linkBusy}
                    status={session.status}
                    linkedCharacterId={forceRelink ? session.linkedCharacter?.id ?? null : null}
                    linkedCharacterName={forceRelink ? session.linkedCharacter?.name ?? null : null}
                    onLinkExisting={(characterId) => {
                        setLinkBusy(true);
                        session.setStatus(null);
                        void session
                            .linkSelectedToken(characterId, local.tokenId!)
                            .then(() => setForceRelink(false))
                            .catch((err) =>
                                session.setStatus(
                                    err instanceof Error ? err.message : "Falha ao associar ficha."
                                )
                            )
                            .finally(() => setLinkBusy(false));
                    }}
                    onRelinkCurrent={
                        session.linkedCharacter
                            ? () => {
                                  setLinkBusy(true);
                                  session.setStatus(null);
                                  void session
                                      .linkSelectedToken(
                                          session.linkedCharacter!.id,
                                          local.tokenId!
                                      )
                                      .then(() => setForceRelink(false))
                                      .catch((err) =>
                                          session.setStatus(
                                              err instanceof Error
                                                  ? err.message
                                                  : "Falha ao reassociar."
                                          )
                                      )
                                      .finally(() => setLinkBusy(false));
                              }
                            : undefined
                    }
                    onCreateForToken={(kind) => {
                        setLinkBusy(true);
                        session.setStatus(null);
                        void (async () => {
                            const tokenId = local.tokenId!;
                            const existingLocal = await owlbearService.loadCharacterSheet(tokenId);
                            if (existingLocal && session.campaignId) {
                                const migrated = await api.migrateCharacter(session.campaignId, {
                                    ...existingLocal,
                                    name:
                                        existingLocal.name ||
                                        local.tokenName ||
                                        (kind === "npc" ? "NPC" : "Personagem"),
                                });
                                await session.linkSelectedToken(migrated.id, tokenId);
                                setForceRelink(false);
                                return;
                            }
                            await session.createCharacterForToken(tokenId, local.tokenName, kind);
                            setForceRelink(false);
                        })()
                            .catch((err) =>
                                session.setStatus(
                                    err instanceof Error ? err.message : "Falha ao criar ficha."
                                )
                            )
                            .finally(() => setLinkBusy(false));
                    }}
                />
            )}

            <CharacterSheetView
                sheet={sheet}
                isObrAvailable={local.isObrAvailable}
                isObrReady={local.isObrReady}
                isGM={isGM}
                tokenName={local.tokenName}
                selectionError={local.selectionError}
                isLoadingSheet={isLoadingSheet}
                needsCreateSheet={
                    session.mode === "offline"
                        ? local.needsCreateSheet
                        : !usingApi && !needsTokenLink && local.needsCreateSheet
                }
                canCreateSheet={session.mode === "offline" && local.canCreateSheet}
                canEditSheet={canEditSheet}
                canRoll={local.canRoll || (usingApi && canEditSheet)}
                isReadOnlySheet={isReadOnlySheet}
                isCreatingSheet={local.isCreatingSheet}
                onCreateSheet={() => void local.createSheetOnToken()}
                onRollAttribute={local.rollAttribute}
                onRollAttack={(attackId, attackKind, options) =>
                    void local.rollAttack(attackId, attackKind, options)
                }
                onRollDamage={(attackId, attackKind, options) =>
                    void local.rollDamage(attackId, attackKind, options)
                }
                onNameChange={(value) =>
                    usingApi ? synced.setField("name", value) : local.setName(value)
                }
                onHistoricoChange={(value) =>
                    usingApi ? synced.setField("historico", value) : local.setHistorico(value)
                }
                onClassNameChange={(value) =>
                    usingApi ? synced.setField("className", value) : local.setClassName(value)
                }
                onLevelChange={(value) =>
                    usingApi
                        ? synced.setField("level", value, { immediate: true })
                        : local.setLevel(value)
                }
                onIdadeChange={(value) =>
                    usingApi ? synced.setField("idade", value) : local.setIdade(value)
                }
                onSexoChange={(value) =>
                    usingApi ? synced.setField("sexo", value) : local.setSexo(value)
                }
                onCombatStatChange={(stat, value) =>
                    usingApi
                        ? synced.setField(`combatStats/${stat}`, value, { immediate: true })
                        : local.setCombatStat(stat, value)
                }
                onAttributeValueChange={(abbreviation, value) =>
                    usingApi
                        ? synced.setField(`attributes/${abbreviation}/value`, value, {
                              immediate: true,
                          })
                        : local.setAttributeValue(abbreviation, value)
                }
                onHpCurrentChange={(value) =>
                    usingApi
                        ? synced.setField("hpCurrent", value, { immediate: true })
                        : local.setHpCurrent(value)
                }
                onHpMaxChange={(value) =>
                    usingApi
                        ? synced.setField("hpMax", value, { immediate: true })
                        : local.setHpMax(value)
                }
                onMpCurrentChange={(value) =>
                    usingApi
                        ? synced.setField("mpCurrent", value, { immediate: true })
                        : local.setMpCurrent(value)
                }
                onMpMaxChange={(value) =>
                    usingApi
                        ? synced.setField("mpMax", value, { immediate: true })
                        : local.setMpMax(value)
                }
                onResourceEditingChange={local.setResourceEditing}
                onAddFocus={(abbreviation, focusName) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            attributes: current.attributes.map((attr) =>
                                attr.abbreviation === abbreviation
                                    ? {
                                          ...attr,
                                          focusNames: [...(attr.focusNames ?? []), focusName],
                                      }
                                    : attr
                            ),
                        }))
                    ) {
                        return;
                    }
                    local.addFocus(abbreviation, focusName);
                }}
                onRemoveFocus={(abbreviation, focusName) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            attributes: current.attributes.map((attr) =>
                                attr.abbreviation === abbreviation
                                    ? {
                                          ...attr,
                                          focusNames: (attr.focusNames ?? []).filter(
                                              (name) => name !== focusName
                                          ),
                                      }
                                    : attr
                            ),
                        }))
                    ) {
                        return;
                    }
                    local.removeFocus(abbreviation, focusName);
                }}
                onRenameFocus={local.renameFocus}
                onReorderFocus={local.reorderFocus}
                onFocusBonusChange={(abbreviation, bonus) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            attributes: current.attributes.map((attr) =>
                                attr.abbreviation === abbreviation
                                    ? { ...attr, focusBonus: bonus }
                                    : attr
                            ),
                        }))
                    ) {
                        return;
                    }
                    local.setFocusBonus(abbreviation, bonus);
                }}
                onPrimaryChange={(abbreviation, isPrimary) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            attributes: current.attributes.map((attr) =>
                                attr.abbreviation === abbreviation
                                    ? { ...attr, isPrimary }
                                    : attr
                            ),
                        }))
                    ) {
                        return;
                    }
                    local.setAttributePrimary(abbreviation, isPrimary);
                }}
                onAddMeleeAttack={() => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    meleeAttacks: [
                                        ...habilidades.meleeAttacks,
                                        createEmptyMeleeAttack(),
                                    ],
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.addMeleeAttack();
                }}
                onUpdateMeleeAttack={(id, patch) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    meleeAttacks: habilidades.meleeAttacks.map((attack) =>
                                        attack.id === id ? { ...attack, ...patch } : attack
                                    ),
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.updateMeleeAttack(id, patch);
                }}
                onRemoveMeleeAttack={(id) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    meleeAttacks: habilidades.meleeAttacks.filter(
                                        (attack) => attack.id !== id
                                    ),
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.removeMeleeAttack(id);
                }}
                onReorderMeleeAttack={local.reorderMeleeAttack}
                onAddRangedAttack={() => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    rangedAttacks: [
                                        ...habilidades.rangedAttacks,
                                        createEmptyRangedAttack(),
                                    ],
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.addRangedAttack();
                }}
                onUpdateRangedAttack={(id, patch) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    rangedAttacks: habilidades.rangedAttacks.map((attack) =>
                                        attack.id === id ? { ...attack, ...patch } : attack
                                    ),
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.updateRangedAttack(id, patch);
                }}
                onRemoveRangedAttack={(id) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    rangedAttacks: habilidades.rangedAttacks.filter(
                                        (attack) => attack.id !== id
                                    ),
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.removeRangedAttack(id);
                }}
                onReorderRangedAttack={local.reorderRangedAttack}
                onWeaponGroupsChange={(value) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: { ...habilidades, weaponGroups: value },
                            };
                        })
                    ) {
                        return;
                    }
                    local.setWeaponGroups(value);
                }}
                onLutUsesWillpowerForDamageChange={(enabled) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    lutUsesWillpowerForDamage: enabled,
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.setLutUsesWillpowerForDamage(enabled);
                }}
                onArcaneWarriorOptionEnabledChange={(enabled) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    arcaneWarriorOptionEnabled: enabled,
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.setArcaneWarriorOptionEnabled(enabled);
                }}
                onAddClassAbility={() => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    classAbilities: [
                                        ...habilidades.classAbilities,
                                        createEmptyClassAbility(),
                                    ],
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.addClassAbility();
                }}
                onUpdateClassAbility={(id, patch) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    classAbilities: habilidades.classAbilities.map((ability) =>
                                        ability.id === id ? { ...ability, ...patch } : ability
                                    ),
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.updateClassAbility(id, patch);
                }}
                onRemoveClassAbility={(id) => {
                    if (
                        mutateApi((current) => {
                            const habilidades = current.habilidades ?? createEmptyHabilidades();
                            return {
                                ...current,
                                habilidades: {
                                    ...habilidades,
                                    classAbilities: habilidades.classAbilities.filter(
                                        (ability) => ability.id !== id
                                    ),
                                },
                            };
                        })
                    ) {
                        return;
                    }
                    local.removeClassAbility(id);
                }}
                onAddTalent={() => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            talents: [...current.talents, createEmptyTalent()],
                        }))
                    ) {
                        return;
                    }
                    local.addTalent();
                }}
                onUpdateTalent={(id, patch) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            talents: current.talents.map((talent) =>
                                talent.id === id
                                    ? {
                                          ...talent,
                                          ...patch,
                                          benefits: patch.benefits
                                              ? { ...talent.benefits, ...patch.benefits }
                                              : talent.benefits,
                                      }
                                    : talent
                            ),
                        }))
                    ) {
                        return;
                    }
                    local.updateTalent(id, patch);
                }}
                onRemoveTalent={(id) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            talents: current.talents.filter((talent) => talent.id !== id),
                        }))
                    ) {
                        return;
                    }
                    local.removeTalent(id);
                }}
                onAddArcanaSpecialization={() => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            arcanaSpecializations: [
                                ...current.arcanaSpecializations,
                                createEmptyArcanaSpecialization(),
                            ],
                        }))
                    ) {
                        return;
                    }
                    local.addArcanaSpecialization();
                }}
                onUpdateArcanaSpecialization={(id, patch) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            arcanaSpecializations: current.arcanaSpecializations.map((entry) =>
                                entry.id === id
                                    ? {
                                          ...entry,
                                          ...patch,
                                          benefits: patch.benefits
                                              ? { ...entry.benefits, ...patch.benefits }
                                              : entry.benefits,
                                      }
                                    : entry
                            ),
                        }))
                    ) {
                        return;
                    }
                    local.updateArcanaSpecialization(id, patch);
                }}
                onRemoveArcanaSpecialization={(id) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            arcanaSpecializations: current.arcanaSpecializations.filter(
                                (entry) => entry.id !== id
                            ),
                        }))
                    ) {
                        return;
                    }
                    local.removeArcanaSpecialization(id);
                }}
                onAddSpell={(degree) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            spells: [...current.spells, createEmptySpell(degree)],
                        }))
                    ) {
                        return;
                    }
                    local.addSpell(degree);
                }}
                onUpdateSpell={(id, patch) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            spells: current.spells.map((spell) =>
                                spell.id === id ? { ...spell, ...patch } : spell
                            ),
                        }))
                    ) {
                        return;
                    }
                    local.updateSpell(id, patch);
                }}
                onRemoveSpell={(id) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            spells: current.spells.filter((spell) => spell.id !== id),
                        }))
                    ) {
                        return;
                    }
                    local.removeSpell(id);
                }}
                onAddInventoryItem={() => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            inventory: {
                                ...current.inventory,
                                items: [...current.inventory.items, createEmptyInventoryItem()],
                            },
                        }))
                    ) {
                        return;
                    }
                    local.addInventoryItem();
                }}
                onUpdateInventoryItem={(id, patch) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            inventory: {
                                ...current.inventory,
                                items: current.inventory.items.map((item) =>
                                    item.id === id ? { ...item, ...patch } : item
                                ),
                            },
                        }))
                    ) {
                        return;
                    }
                    local.updateInventoryItem(id, patch);
                }}
                onRemoveInventoryItem={(id) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            inventory: {
                                ...current.inventory,
                                items: current.inventory.items.filter((item) => item.id !== id),
                            },
                        }))
                    ) {
                        return;
                    }
                    local.removeInventoryItem(id);
                }}
                onReorderInventoryItem={(fromIndex, toIndex) => {
                    if (
                        mutateApi((current) => {
                            const items = [...current.inventory.items];
                            const [moved] = items.splice(fromIndex, 1);
                            if (!moved) return current;
                            items.splice(toIndex, 0, moved);
                            return {
                                ...current,
                                inventory: { ...current.inventory, items },
                            };
                        })
                    ) {
                        return;
                    }
                    local.reorderInventoryItem(fromIndex, toIndex);
                }}
                onUpdateCurrency={(patch) => {
                    if (
                        mutateApi((current) => ({
                            ...current,
                            inventory: {
                                ...current.inventory,
                                currency: { ...current.inventory.currency, ...patch },
                            },
                        }))
                    ) {
                        return;
                    }
                    local.updateCurrency(patch);
                }}
            />
        </CatalogProvider>
    );
}

export default App;
