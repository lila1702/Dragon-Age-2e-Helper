import { useMemo } from "react";

import { AttackRowsTable } from "./AttackRowsTable";

import { parseWeaponGroups } from "../../domain/entities/attackBonus";
import { WEAPON_GROUP_SUGGESTIONS } from "../../domain/entities/weaponGroupDefinitions";

import type { AttackRollOptions } from "../../domain/entities/attackRoll";
import type { Attribute } from "../../domain/entities/characterSheet";
import type { Habilidades, MeleeAttack, RangedAttack } from "../../domain/entities/habilidades";

interface AttacksSectionProps {
    habilidades: Habilidades;
    attributes: Attribute[];
    isGM?: boolean;
    disabled?: boolean;
    canRoll?: boolean;
    onAddMeleeAttack: () => void;
    onUpdateMeleeAttack: (id: string, patch: Partial<MeleeAttack>) => void;
    onRemoveMeleeAttack: (id: string) => void;
    onReorderMeleeAttack: (fromIndex: number, toIndex: number) => void;
    onAddRangedAttack: () => void;
    onUpdateRangedAttack: (id: string, patch: Partial<RangedAttack>) => void;
    onRemoveRangedAttack: (id: string) => void;
    onReorderRangedAttack: (fromIndex: number, toIndex: number) => void;
    onWeaponGroupsChange: (value: string) => void;
    onLutUsesWillpowerForDamageChange: (enabled: boolean) => void;
    onArcaneWarriorOptionEnabledChange: (enabled: boolean) => void;
    onRollAttack: (
        attackId: string,
        attackKind: "melee" | "ranged",
        options?: AttackRollOptions
    ) => void;
    onRollDamage: (
        attackId: string,
        attackKind: "melee" | "ranged",
        options?: AttackRollOptions
    ) => void;
}

function buildWeaponGroupOptions(habilidades: Habilidades): string[] {
    const fromCharacter = parseWeaponGroups(habilidades.weaponGroups);
    const fromAttacks = [
        ...habilidades.meleeAttacks,
        ...habilidades.rangedAttacks,
    ]
        .map((attack) => attack.weaponGroup?.trim())
        .filter((group): group is string => Boolean(group));

    return [...new Set([...fromCharacter, ...fromAttacks, ...WEAPON_GROUP_SUGGESTIONS])];
}

export function AttacksSection({
    habilidades,
    attributes,
    isGM = false,
    disabled = false,
    canRoll = false,
    onAddMeleeAttack,
    onUpdateMeleeAttack,
    onRemoveMeleeAttack,
    onReorderMeleeAttack,
    onAddRangedAttack,
    onUpdateRangedAttack,
    onRemoveRangedAttack,
    onReorderRangedAttack,
    onWeaponGroupsChange,
    onLutUsesWillpowerForDamageChange,
    onArcaneWarriorOptionEnabledChange,
    onRollAttack,
    onRollDamage,
}: AttacksSectionProps) {
    const weaponGroupOptions = useMemo(
        () => buildWeaponGroupOptions(habilidades),
        [habilidades]
    );

    return (
        <section className="habilidades-attacks" aria-label="Ataques">
            {isGM && (
                <label className="habilidades-attacks__gm-option">
                    <input
                        type="checkbox"
                        className="habilidades-table__checkbox"
                        checked={habilidades.arcaneWarriorOptionEnabled === true}
                        disabled={disabled}
                        onChange={(event) =>
                            onArcaneWarriorOptionEnabledChange(event.target.checked)
                        }
                    />
                    <span>Habilitar opção Guerreira Arcana nesta ficha</span>
                </label>
            )}

            {habilidades.arcaneWarriorOptionEnabled && (
                <label className="habilidades-attacks__option">
                    <input
                        type="checkbox"
                        className="habilidades-table__checkbox"
                        checked={habilidades.lutUsesWillpowerForDamage === true}
                        disabled={disabled}
                        onChange={(event) =>
                            onLutUsesWillpowerForDamageChange(event.target.checked)
                        }
                    />
                    <span>
                        Modo Guerreira Arcana — ataques com <strong>Luta</strong> usam{" "}
                        <strong>Vontade</strong> no dano
                    </span>
                </label>
            )}

            <div className="habilidades-table-wrap">
                <table className="habilidades-table">
                    <thead>
                        <tr>
                            <th scope="col" className="habilidades-table__drag-head" aria-label="Reordenar" />
                            <th scope="col">Nome</th>
                            <th scope="col">Atrib.</th>
                            <th scope="col" title="Exceção ao padrão PRE→PER, LUT→FOR">
                                Dano
                            </th>
                            <th scope="col" title="Comparado com Grupos de Armas do personagem; fora da lista = −2 ataque e metade do dano">
                                Grupo
                            </th>
                            <th scope="col">Ataque</th>
                            <th scope="col">Dano</th>
                        </tr>
                    </thead>
                    <AttackRowsTable
                        variant="melee"
                        attacks={habilidades.meleeAttacks}
                        attributes={attributes}
                        characterWeaponGroups={habilidades.weaponGroups}
                        weaponGroupOptions={weaponGroupOptions}
                        weaponGroupDatalistId="melee-weapon-groups"
                        lutUsesWillpowerForDamage={habilidades.lutUsesWillpowerForDamage}
                        disabled={disabled}
                        canRoll={canRoll}
                        emptyMessage="Nenhuma arma corpo a corpo cadastrada."
                        onUpdate={onUpdateMeleeAttack}
                        onRemove={onRemoveMeleeAttack}
                        onReorder={onReorderMeleeAttack}
                        onRollAttack={onRollAttack}
                        onRollDamage={onRollDamage}
                    />
                    <tbody>
                        <tr className="habilidades-table__groups-row">
                            <td colSpan={7}>
                                <label className="habilidades-table__groups-label">
                                    <span>Grupos de Armas:</span>
                                    <input
                                        type="text"
                                        className="habilidades-table__input habilidades-table__input--groups"
                                        value={habilidades.weaponGroups}
                                        disabled={disabled}
                                        aria-label="Grupos de armas treinados"
                                        placeholder="Ex.: Lâminas Leves; Cajados; Briga; Arcos"
                                        onChange={(event) =>
                                            onWeaponGroupsChange(event.target.value)
                                        }
                                    />
                                </label>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {!disabled && (
                <button
                    type="button"
                    className="habilidades-section__add"
                    onClick={onAddMeleeAttack}
                >
                    + Arma corpo a corpo
                </button>
            )}

            <div className="habilidades-table-wrap habilidades-table-wrap--spaced">
                <table className="habilidades-table habilidades-table--ranged">
                    <thead>
                        <tr>
                            <th scope="col" className="habilidades-table__drag-head" aria-label="Reordenar" />
                            <th scope="col">Nome</th>
                            <th scope="col">Atrib.</th>
                            <th scope="col" title="Exceção ao padrão PRE→PER, LUT→FOR">
                                Dano
                            </th>
                            <th scope="col" title="Comparado com Grupos de Armas do personagem; fora da lista = −2 ataque e metade do dano">
                                Grupo
                            </th>
                            <th scope="col">Ataque</th>
                            <th scope="col">Dano</th>
                        </tr>
                    </thead>
                    <AttackRowsTable
                        variant="ranged"
                        attacks={habilidades.rangedAttacks}
                        attributes={attributes}
                        characterWeaponGroups={habilidades.weaponGroups}
                        weaponGroupOptions={weaponGroupOptions}
                        weaponGroupDatalistId="ranged-weapon-groups"
                        lutUsesWillpowerForDamage={habilidades.lutUsesWillpowerForDamage}
                        disabled={disabled}
                        canRoll={canRoll}
                        emptyMessage="Nenhuma arma à distância cadastrada."
                        onUpdate={onUpdateRangedAttack}
                        onRemove={onRemoveRangedAttack}
                        onReorder={onReorderRangedAttack}
                        onRollAttack={onRollAttack}
                        onRollDamage={onRollDamage}
                    />
                </table>
            </div>

            {!disabled && (
                <button
                    type="button"
                    className="habilidades-section__add"
                    onClick={onAddRangedAttack}
                >
                    + Arma à distância
                </button>
            )}
        </section>
    );
}
