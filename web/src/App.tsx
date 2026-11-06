import { useEffect, useMemo, useState } from "react";

import {
    CatalogProvider,
    useSyncedCharacterSheet,
    type ApiUser,
    type CampaignSummary,
    type CharacterRecord,
} from "@dragon-age/client";
import {
    AgeRuleset,
    LocalRoller,
    applyCatalogEntryToSheet,
    createEmptyArcanaSpecialization,
    createEmptyClassAbility,
    createEmptyHabilidades,
    createEmptyInventoryItem,
    createEmptyMeleeAttack,
    createEmptyRangedAttack,
    createEmptySheet,
    createEmptySpell,
    createEmptyTalent,
    getDiceRoller,
    registerDiceRoller,
    type Attribute,
    type CharacterSheet,
} from "@dragon-age/domain";

import { CharacterSheetView } from "@extension/presentation/components/CharacterSheetView";

import { api, getApiToken, setApiToken } from "./api";
import { CatalogPanel } from "./CatalogPanel";
import { CharacterListPanel } from "./CharacterListPanel";
import { GmPanel } from "./GmPanel";
import type { CampaignPlayerProfile } from "@dragon-age/client";

registerDiceRoller(new LocalRoller());
const ruleset = new AgeRuleset();

export function App() {
    const [user, setUser] = useState<ApiUser | null>(null);
    const [token, setToken] = useState<string | null>(() => getApiToken());
    const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [characters, setCharacters] = useState<CharacterRecord[]>([]);
    const [characterId, setCharacterId] = useState<string | null>(null);
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [rollLog, setRollLog] = useState<string[]>([]);
    const [players, setPlayers] = useState<CampaignPlayerProfile[]>([]);
    const [mainView, setMainView] = useState<"sheet" | "catalog">("sheet");

    const selectedCampaign = useMemo(
        () => campaigns.find((campaign) => campaign.id === campaignId) ?? null,
        [campaignId, campaigns]
    );

    useEffect(() => {
        if (!token) {
            setUser(null);
            return;
        }
        void api.me().then(setUser).catch(() => {
            setApiToken(null);
            setToken(null);
        });
    }, [token]);

    useEffect(() => {
        if (!user) return;
        void api.listMyCampaigns().then((list) => {
            setCampaigns(list);
            if (!campaignId && list[0]) setCampaignId(list[0].id);
        });
    }, [user, campaignId]);

    useEffect(() => {
        setMainView("sheet");
    }, [campaignId]);

    useEffect(() => {
        if (!campaignId) {
            setCharacters([]);
            setPlayers([]);
            return;
        }
        void api
            .listCampaignCharacters(campaignId, {
                includeInactive: selectedCampaign?.role === "GM",
            })
            .then((list) => {
                setCharacters(list);
                if (!characterId || !list.some((entry) => entry.id === characterId)) {
                    setCharacterId(
                        list.find((entry) => entry.status !== "inactive")?.id ?? list[0]?.id ?? null
                    );
                }
            });
        if (selectedCampaign?.role === "GM") {
            void api.listCampaignPlayers(campaignId).then(setPlayers).catch(() => setPlayers([]));
        } else {
            setPlayers([]);
        }
    }, [campaignId, selectedCampaign?.role]);

    const canEdit = useMemo(() => {
        if (!user || !characterId) return false;
        const character = characters.find((entry) => entry.id === characterId);
        if (!character) return false;
        return (
            character.ownerUserId === user.id ||
            character.assignedPlayerUserId === user.id ||
            selectedCampaign?.role === "GM"
        );
    }, [characters, characterId, selectedCampaign?.role, user]);

    const synced = useSyncedCharacterSheet({
        api,
        characterId,
        campaignId,
        sessionToken: token,
        canEdit,
        displayName: user?.displayName ?? "Usuário",
        knownCharacters: characters,
    });

    useEffect(() => {
        if (!characterId) return;
        const liveName = synced.sheet.name?.trim() || synced.character?.name;
        if (!liveName) return;
        setCharacters((prev) => {
            const current = prev.find((entry) => entry.id === characterId);
            if (!current || current.name === liveName) return prev;
            return prev.map((entry) =>
                entry.id === characterId ? { ...entry, name: liveName } : entry
            );
        });
    }, [characterId, synced.character?.name, synced.sheet.name]);

    const mutate = (updater: (current: CharacterSheet) => CharacterSheet) => {
        synced.mutateSheet(updater);
    };

    const authenticate = async () => {
        setError(null);
        try {
            const session =
                authMode === "login"
                    ? await api.login(email, password)
                    : await api.register(email, password, displayName || email);
            setApiToken(session.token);
            setToken(session.token);
            setUser(session.user);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha na autenticação.");
        }
    };

    const createCampaign = async () => {
        const name = window.prompt("Nome da campanha");
        if (!name) return;
        const campaign = await api.createCampaign(name);
        setCampaigns((prev) => [...prev, campaign]);
        setCampaignId(campaign.id);
    };

    const createCharacter = async () => {
        if (!campaignId) return;
        const sheet = createEmptySheet("");
        sheet.name = "Novo personagem";
        const created = await api.createCharacter(campaignId, sheet);
        setCharacters((prev) => [...prev, created]);
        setCharacterId(created.id);
    };

    const rollAttribute = async (attribute: Attribute) => {
        const roller = getDiceRoller("local");
        const dice = await roller.roll({
            notation: "1d6{Vermelho} + 1d6{Vermelho} + 1d6{Dragão}",
            label: attribute.abbreviation,
        });
        const result = ruleset.interpretTest(dice, {
            attribute: attribute.value,
            focus: attribute.focusBonus ?? 0,
            situational: 0,
        });
        setRollLog((prev) =>
            [
                `${attribute.abbreviation}: ${result.finalResult}${
                    result.hasStunts ? ` (PF ${result.stuntPoints})` : ""
                }`,
                ...prev,
            ].slice(0, 8)
        );
    };

    if (!user) {
        return (
            <div className="auth-shell auth-form">
                <h1>Dragon Age Helper</h1>
                <p>Entre para editar fichas. A mesma conta vale na extensão Owlbear.</p>
                <label>
                    Username ou e-mail
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Username ou e-mail"
                        autoComplete="username"
                    />
                </label>
                {authMode === "register" && (
                    <label>
                        Nome
                        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </label>
                )}
                <label>
                    Senha
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                {error && <div className="error">{error}</div>}
                <button type="button" onClick={() => void authenticate()}>
                    {authMode === "login" ? "Entrar" : "Criar conta"}
                </button>
                <button
                    type="button"
                    className="secondary"
                    onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                >
                    {authMode === "login" ? "Criar conta" : "Já tenho conta"}
                </button>
            </div>
        );
    }

    return (
        <CatalogProvider api={api} rulesetId={selectedCampaign?.rulesetId ?? "dragon-age-age"}>
            <div className="app-shell">
                <header className="app-topbar">
                    <h1>Dragon Age Helper</h1>
                    <div className="app-topbar__meta">
                        <span>
                            <span className={`status-dot ${synced.connected ? "online" : ""}`} />
                            {user.displayName}
                            {synced.connected ? " · ao vivo" : ""}
                        </span>
                        <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                                setApiToken(null);
                                setToken(null);
                                setUser(null);
                            }}
                        >
                            Sair
                        </button>
                    </div>
                </header>

                <div className="app-main">
                    <aside className="app-sidebar">
                        <div className="panel-block">
                            <h2 className="panel-title">Campanha</h2>
                            <label>
                                Selecionar
                                <select
                                    value={campaignId ?? ""}
                                    onChange={(e) => {
                                        setCampaignId(e.target.value || null);
                                        setCharacterId(null);
                                    }}
                                >
                                    {campaigns.map((campaign) => (
                                        <option key={campaign.id} value={campaign.id}>
                                            {campaign.name} ({campaign.role})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button type="button" className="secondary" onClick={() => void createCampaign()}>
                                Nova campanha
                            </button>
                        </div>

                        <CharacterListPanel
                            characters={characters}
                            characterId={characterId}
                            isGm={selectedCampaign?.role === "GM"}
                            players={players}
                            onSelect={(id) => {
                                setCharacterId(id);
                                setMainView("sheet");
                            }}
                            onCreate={() => {
                                setMainView("sheet");
                                void createCharacter();
                            }}
                            onDuplicate={async (id) => {
                                const created = await api.duplicateCharacter(id);
                                setCharacters((prev) => [...prev, created]);
                                setCharacterId(created.id);
                                setMainView("sheet");
                            }}
                            onSetStatus={async (id, status) => {
                                const updated = await api.setCharacterStatus(id, status);
                                setCharacters((prev) =>
                                    prev.map((entry) => (entry.id === id ? updated : entry))
                                );
                            }}
                            onAssignPlayer={async (id, userId) => {
                                const updated = await api.assignCharacterPlayer(id, userId);
                                setCharacters((prev) =>
                                    prev.map((entry) => (entry.id === id ? updated : entry))
                                );
                            }}
                        />

                        {campaignId && selectedCampaign?.role === "GM" && (
                            <div className="panel-block">
                                <button
                                    type="button"
                                    className={
                                        mainView === "catalog" ? "is-active" : "secondary"
                                    }
                                    onClick={() => setMainView("catalog")}
                                >
                                    Abrir catálogo
                                </button>
                            </div>
                        )}

                        {campaignId && selectedCampaign?.role === "GM" && (
                            <div className="panel-block">
                                <h2 className="panel-title">Preferências da campanha</h2>
                                <label className="character-list__toggle">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(selectedCampaign.playersSeeOnlyOwnSheets)}
                                        onChange={(e) => {
                                            const value = e.target.checked;
                                            void api
                                                .updateCampaignSettings(campaignId, {
                                                    playersSeeOnlyOwnSheets: value,
                                                })
                                                .then((updated) => {
                                                    setCampaigns((prev) =>
                                                        prev.map((entry) =>
                                                            entry.id === campaignId
                                                                ? {
                                                                      ...entry,
                                                                      playersSeeOnlyOwnSheets:
                                                                          updated.playersSeeOnlyOwnSheets,
                                                                  }
                                                                : entry
                                                        )
                                                    );
                                                });
                                        }}
                                    />
                                    Na Web, jogadores só veem as próprias fichas
                                </label>
                                <p className="hint">
                                    No Owlbear, a visualização das fichas abertas não muda.
                                </p>
                            </div>
                        )}

                        {campaignId && (
                            <GmPanel
                                campaignId={campaignId}
                                isGm={selectedCampaign?.role === "GM"}
                            />
                        )}

                        {rollLog.length > 0 && (
                            <div className="panel-block">
                                <h2 className="panel-title">Rolagens</h2>
                                {rollLog.map((line) => (
                                    <div key={line} className="hint">
                                        {line}
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>

                    <main className="app-content">
                        {synced.error && mainView === "sheet" && (
                            <div className="error">{synced.error}</div>
                        )}
                        {mainView === "catalog" && selectedCampaign?.role === "GM" && (
                            <CatalogPanel
                                rulesetId={selectedCampaign.rulesetId}
                                canAddToSheet={Boolean(characterId && synced.canEdit)}
                                sheetName={
                                    characters.find((entry) => entry.id === characterId)?.name ??
                                    synced.sheet.name
                                }
                                onAddToSheet={(entry) => {
                                    mutate((current) => applyCatalogEntryToSheet(current, entry));
                                }}
                            />
                        )}
                        {mainView === "sheet" && characterId && (
                            <CharacterSheetView
                                sheet={synced.sheet}
                                layout="widescreen"
                                isObrAvailable={false}
                                isObrReady={false}
                                tokenName={null}
                                selectionError={null}
                                isLoadingSheet={synced.isLoading}
                                needsCreateSheet={false}
                                canCreateSheet={false}
                                canEditSheet={synced.canEdit}
                                canRoll={false}
                                isReadOnlySheet={!synced.canEdit}
                                isCreatingSheet={false}
                                onCreateSheet={() => undefined}
                                onRollAttribute={(attribute) => void rollAttribute(attribute)}
                                onNameChange={(value) => synced.setField("name", value)}
                                onHistoricoChange={(value) => synced.setField("historico", value)}
                                onClassNameChange={(value) => synced.setField("className", value)}
                                onLevelChange={(value) =>
                                    synced.setField("level", value, { immediate: true })
                                }
                                onIdadeChange={(value) => synced.setField("idade", value)}
                                onSexoChange={(value) => synced.setField("sexo", value)}
                                onCombatStatChange={(stat, value) =>
                                    synced.setField(`combatStats/${stat}`, value, { immediate: true })
                                }
                                onAttributeValueChange={(abbreviation, value) =>
                                    synced.setField(`attributes/${abbreviation}/value`, value, {
                                        immediate: true,
                                    })
                                }
                                onHpCurrentChange={(value) =>
                                    synced.setField("hpCurrent", value, { immediate: true })
                                }
                                onHpMaxChange={(value) =>
                                    synced.setField("hpMax", value, { immediate: true })
                                }
                                onMpCurrentChange={(value) =>
                                    synced.setField("mpCurrent", value, { immediate: true })
                                }
                                onMpMaxChange={(value) =>
                                    synced.setField("mpMax", value, { immediate: true })
                                }
                                onAddFocus={(abbreviation, focusName) =>
                                    mutate((current) => ({
                                        ...current,
                                        attributes: current.attributes.map((attr) =>
                                            attr.abbreviation === abbreviation
                                                ? {
                                                      ...attr,
                                                      focusNames: [
                                                          ...(attr.focusNames ?? []),
                                                          focusName,
                                                      ],
                                                  }
                                                : attr
                                        ),
                                    }))
                                }
                                onRemoveFocus={(abbreviation, focusName) =>
                                    mutate((current) => ({
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
                                }
                                onRenameFocus={(abbreviation, oldName, newName) =>
                                    mutate((current) => ({
                                        ...current,
                                        attributes: current.attributes.map((attr) =>
                                            attr.abbreviation === abbreviation
                                                ? {
                                                      ...attr,
                                                      focusNames: (attr.focusNames ?? []).map(
                                                          (name) => (name === oldName ? newName : name)
                                                      ),
                                                  }
                                                : attr
                                        ),
                                    }))
                                }
                                onReorderFocus={(abbreviation, fromIndex, toIndex) =>
                                    mutate((current) => ({
                                        ...current,
                                        attributes: current.attributes.map((attr) => {
                                            if (attr.abbreviation !== abbreviation) return attr;
                                            const names = [...(attr.focusNames ?? [])];
                                            const [moved] = names.splice(fromIndex, 1);
                                            if (!moved) return attr;
                                            names.splice(toIndex, 0, moved);
                                            return { ...attr, focusNames: names };
                                        }),
                                    }))
                                }
                                onFocusBonusChange={(abbreviation, bonus) =>
                                    synced.setField(`attributes/${abbreviation}/focusBonus`, bonus, {
                                        immediate: true,
                                    })
                                }
                                onPrimaryChange={(abbreviation, isPrimary) =>
                                    synced.setField(`attributes/${abbreviation}/isPrimary`, isPrimary, {
                                        immediate: true,
                                    })
                                }
                                onAddMeleeAttack={() =>
                                    mutate((current) => {
                                        const habilidades =
                                            current.habilidades ?? createEmptyHabilidades();
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
                                }
                                onUpdateMeleeAttack={(id, patch) => {
                                    for (const [key, value] of Object.entries(patch)) {
                                        synced.setField(`habilidades/meleeAttacks/${id}/${key}`, value);
                                    }
                                }}
                                onRemoveMeleeAttack={(id) =>
                                    mutate((current) => {
                                        const habilidades =
                                            current.habilidades ?? createEmptyHabilidades();
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
                                }
                                onReorderMeleeAttack={() => undefined}
                                onAddRangedAttack={() =>
                                    mutate((current) => {
                                        const habilidades =
                                            current.habilidades ?? createEmptyHabilidades();
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
                                }
                                onUpdateRangedAttack={(id, patch) => {
                                    for (const [key, value] of Object.entries(patch)) {
                                        synced.setField(
                                            `habilidades/rangedAttacks/${id}/${key}`,
                                            value
                                        );
                                    }
                                }}
                                onRemoveRangedAttack={(id) =>
                                    mutate((current) => {
                                        const habilidades =
                                            current.habilidades ?? createEmptyHabilidades();
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
                                }
                                onReorderRangedAttack={() => undefined}
                                onWeaponGroupsChange={(value) =>
                                    synced.setField("habilidades/weaponGroups", value)
                                }
                                onLutUsesWillpowerForDamageChange={(enabled) =>
                                    synced.setField("habilidades/lutUsesWillpowerForDamage", enabled, {
                                        immediate: true,
                                    })
                                }
                                onArcaneWarriorOptionEnabledChange={(enabled) =>
                                    synced.setField(
                                        "habilidades/arcaneWarriorOptionEnabled",
                                        enabled,
                                        { immediate: true }
                                    )
                                }
                                onRollAttack={() => undefined}
                                onRollDamage={() => undefined}
                                onAddClassAbility={() =>
                                    mutate((current) => {
                                        const habilidades =
                                            current.habilidades ?? createEmptyHabilidades();
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
                                }
                                onUpdateClassAbility={(id, patch) =>
                                    mutate((current) => {
                                        const habilidades =
                                            current.habilidades ?? createEmptyHabilidades();
                                        return {
                                            ...current,
                                            habilidades: {
                                                ...habilidades,
                                                classAbilities: habilidades.classAbilities.map(
                                                    (ability) =>
                                                        ability.id === id
                                                            ? { ...ability, ...patch }
                                                            : ability
                                                ),
                                            },
                                        };
                                    })
                                }
                                onRemoveClassAbility={(id) =>
                                    mutate((current) => {
                                        const habilidades =
                                            current.habilidades ?? createEmptyHabilidades();
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
                                }
                                onAddTalent={() =>
                                    mutate((current) => ({
                                        ...current,
                                        talents: [...current.talents, createEmptyTalent()],
                                    }))
                                }
                                onUpdateTalent={(id, patch) =>
                                    mutate((current) => ({
                                        ...current,
                                        talents: current.talents.map((talent) =>
                                            talent.id === id
                                                ? {
                                                      ...talent,
                                                      ...patch,
                                                      benefits: patch.benefits
                                                          ? {
                                                                ...talent.benefits,
                                                                ...patch.benefits,
                                                            }
                                                          : talent.benefits,
                                                  }
                                                : talent
                                        ),
                                    }))
                                }
                                onRemoveTalent={(id) =>
                                    mutate((current) => ({
                                        ...current,
                                        talents: current.talents.filter((talent) => talent.id !== id),
                                    }))
                                }
                                onAddArcanaSpecialization={() =>
                                    mutate((current) => ({
                                        ...current,
                                        arcanaSpecializations: [
                                            ...current.arcanaSpecializations,
                                            createEmptyArcanaSpecialization(),
                                        ],
                                    }))
                                }
                                onUpdateArcanaSpecialization={(id, patch) =>
                                    mutate((current) => ({
                                        ...current,
                                        arcanaSpecializations: current.arcanaSpecializations.map(
                                            (entry) =>
                                                entry.id === id
                                                    ? {
                                                          ...entry,
                                                          ...patch,
                                                          benefits: patch.benefits
                                                              ? {
                                                                    ...entry.benefits,
                                                                    ...patch.benefits,
                                                                }
                                                              : entry.benefits,
                                                      }
                                                    : entry
                                        ),
                                    }))
                                }
                                onRemoveArcanaSpecialization={(id) =>
                                    mutate((current) => ({
                                        ...current,
                                        arcanaSpecializations: current.arcanaSpecializations.filter(
                                            (entry) => entry.id !== id
                                        ),
                                    }))
                                }
                                onAddSpell={(degree) =>
                                    mutate((current) => ({
                                        ...current,
                                        spells: [...current.spells, createEmptySpell(degree)],
                                    }))
                                }
                                onUpdateSpell={(id, patch) =>
                                    mutate((current) => ({
                                        ...current,
                                        spells: current.spells.map((spell) =>
                                            spell.id === id ? { ...spell, ...patch } : spell
                                        ),
                                    }))
                                }
                                onRemoveSpell={(id) =>
                                    mutate((current) => ({
                                        ...current,
                                        spells: current.spells.filter((spell) => spell.id !== id),
                                    }))
                                }
                                onAddInventoryItem={() =>
                                    mutate((current) => ({
                                        ...current,
                                        inventory: {
                                            ...current.inventory,
                                            items: [
                                                ...current.inventory.items,
                                                createEmptyInventoryItem(),
                                            ],
                                        },
                                    }))
                                }
                                onUpdateInventoryItem={(id, patch) =>
                                    mutate((current) => ({
                                        ...current,
                                        inventory: {
                                            ...current.inventory,
                                            items: current.inventory.items.map((item) =>
                                                item.id === id ? { ...item, ...patch } : item
                                            ),
                                        },
                                    }))
                                }
                                onRemoveInventoryItem={(id) =>
                                    mutate((current) => ({
                                        ...current,
                                        inventory: {
                                            ...current.inventory,
                                            items: current.inventory.items.filter(
                                                (item) => item.id !== id
                                            ),
                                        },
                                    }))
                                }
                                onReorderInventoryItem={(fromIndex, toIndex) =>
                                    mutate((current) => {
                                        const items = [...current.inventory.items];
                                        const [moved] = items.splice(fromIndex, 1);
                                        if (!moved) return current;
                                        items.splice(toIndex, 0, moved);
                                        return {
                                            ...current,
                                            inventory: { ...current.inventory, items },
                                        };
                                    })
                                }
                                onUpdateCurrency={(patch) => {
                                    for (const [key, value] of Object.entries(patch)) {
                                        synced.setField(`inventory/currency/${key}`, value, {
                                            immediate: true,
                                        });
                                    }
                                }}
                            />
                        )}
                    </main>
                </div>
            </div>
        </CatalogProvider>
    );
}
