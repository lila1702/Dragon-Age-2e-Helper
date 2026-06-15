import { Fragment, useEffect, useRef, useState } from "react";

import { RollSituationalModal } from "./RollSituationalModal";

import { ATTRIBUTE_DEFINITIONS } from "../../domain/entities/attributeDefinitions";
import {
    computeAttackBonus,
    computeDamageWithAttribute,
    formatAttackBonus,
    formatEffectiveDamage,
    hasWeaponFocus,
    isAttackUntrained,
    resolveDamageAttributeAbbreviation,
} from "../../domain/entities/attackBonus";
import { buildDamageRollNotation } from "../../domain/entities/attackRoll";
import { resolveFocusBonus } from "../../domain/entities/attributeRoll";
import { RELOAD_ACTION_OPTIONS } from "../../domain/entities/weaponReload";

import type { AttackRollOptions } from "../../domain/entities/attackRoll";
import type { Attribute } from "../../domain/entities/characterSheet";
import type { MeleeAttack, RangedAttack } from "../../domain/entities/habilidades";

type AttackRow = MeleeAttack | RangedAttack;
type AttackKind = "melee" | "ranged";

interface NameContextMenu {
    id: string;
    x: number;
    y: number;
}

interface PendingSituationalRoll {
    attackId: string;
    kind: "attack" | "damage";
}

interface AttackRowsTableProps<T extends AttackRow> {
    variant: AttackKind;
    attacks: T[];
    attributes: Attribute[];
    characterWeaponGroups: string;
    weaponGroupOptions: string[];
    weaponGroupDatalistId: string;
    lutUsesWillpowerForDamage?: boolean;
    disabled?: boolean;
    canRoll?: boolean;
    emptyMessage: string;
    onUpdate: (id: string, patch: Partial<T>) => void;
    onRemove: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRollAttack: (attackId: string, attackKind: AttackKind, options?: AttackRollOptions) => void;
    onRollDamage: (attackId: string, attackKind: AttackKind, options?: AttackRollOptions) => void;
}

function isRangedAttack(attack: AttackRow): attack is RangedAttack {
    return "shortRange" in attack || "longRange" in attack || "reload" in attack;
}

function buildAttackTitle(
    attributes: Attribute[],
    attackAttributeAbbreviation: string,
    weaponGroup: string | undefined,
    untrained: boolean
): string | undefined {
    const parts: string[] = [];

    if (untrained) {
        parts.push("Sem treinamento no grupo (−2 ataque, metade do dano)");
    }

    if (hasWeaponFocus(attributes, attackAttributeAbbreviation, weaponGroup ?? "")) {
        const attribute = attributes.find(
            (entry) =>
                entry.abbreviation.toUpperCase() ===
                attackAttributeAbbreviation.trim().toUpperCase()
        );
        if (attribute) {
            const bonus = resolveFocusBonus(attribute);
            parts.push(`Bônus de foco em ${weaponGroup} (+${bonus})`);
        }
    }

    return parts.length > 0 ? parts.join("; ") : undefined;
}

export function AttackRowsTable<T extends AttackRow>({
    variant,
    attacks,
    attributes,
    characterWeaponGroups,
    weaponGroupOptions,
    weaponGroupDatalistId,
    lutUsesWillpowerForDamage = false,
    disabled = false,
    canRoll = false,
    emptyMessage,
    onUpdate,
    onRemove,
    onReorder,
    onRollAttack,
    onRollDamage,
}: AttackRowsTableProps<T>) {
    const [nameContextMenu, setNameContextMenu] = useState<NameContextMenu | null>(null);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [pendingSituationalRoll, setPendingSituationalRoll] =
        useState<PendingSituationalRoll | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!nameContextMenu) return;

        const closeMenu = (event: MouseEvent) => {
            if (menuRef.current?.contains(event.target as Node)) return;
            setNameContextMenu(null);
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setNameContextMenu(null);
        };

        window.addEventListener("mousedown", closeMenu);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("mousedown", closeMenu);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [nameContextMenu]);

    const handleDragStart = (index: number) => {
        if (disabled) return;
        setDragIndex(index);
    };

    const handleDrop = (index: number) => {
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null);
            setDropIndex(null);
            return;
        }
        onReorder(dragIndex, index);
        setDragIndex(null);
        setDropIndex(null);
    };

    const colSpanEmpty = 7;

    const handleSituationalConfirm = (situationalModifier: number) => {
        if (!pendingSituationalRoll) return;
        const { attackId, kind } = pendingSituationalRoll;
        if (kind === "attack") {
            onRollAttack(attackId, variant, { situationalModifier });
        } else {
            onRollDamage(attackId, variant, { situationalModifier });
        }
        setPendingSituationalRoll(null);
    };

    const situationalRollLabel = (() => {
        if (!pendingSituationalRoll) return "";
        const attack = attacks.find((entry) => entry.id === pendingSituationalRoll.attackId);
        if (!attack) return "";
        const suffix = pendingSituationalRoll.kind === "attack" ? "ataque" : "dano";
        return `${attack.name || "Arma"} — ${suffix}`;
    })();

    return (
        <>
            <datalist id={weaponGroupDatalistId}>
                {weaponGroupOptions.map((group) => (
                    <option key={group} value={group} />
                ))}
            </datalist>

            <tbody>
                {attacks.length === 0 ? (
                    <tr className="habilidades-table__empty-row">
                        <td colSpan={colSpanEmpty}>{emptyMessage}</td>
                    </tr>
                ) : (
                    attacks.map((attack, index) => {
                        const untrained = isAttackUntrained(
                            attack.weaponGroup,
                            characterWeaponGroups
                        );
                        const damageOptions = {
                            attributes,
                            attackAttributeAbbreviation: attack.attributeAbbreviation,
                            damageAttributeAbbreviation: attack.damageAttributeAbbreviation,
                            lutUsesWillpowerForDamage,
                        };
                        const fullDamage = computeDamageWithAttribute(
                            attack.damage,
                            damageOptions
                        );
                        const effectiveDamage = formatEffectiveDamage(fullDamage, untrained);
                        const displayDamage =
                            effectiveDamage ??
                            (fullDamage && fullDamage !== attack.damage.trim()
                                ? fullDamage
                                : fullDamage);
                        const damageAttrUsed = resolveDamageAttributeAbbreviation(damageOptions);
                        const attackBonus = computeAttackBonus(
                            attributes,
                            attack.attributeAbbreviation,
                            untrained,
                            attack.weaponGroup
                        );
                        const attackTitle = buildAttackTitle(
                            attributes,
                            attack.attributeAbbreviation,
                            attack.weaponGroup,
                            untrained
                        );
                        const isDragging = dragIndex === index;
                        const isDropTarget = dropIndex === index;
                        const canRollDamage = Boolean(
                            fullDamage.trim() &&
                                buildDamageRollNotation(fullDamage)
                        );
                        const isEditingName = editingNameId === attack.id;

                        const essentialRow = (
                            <tr
                                key={attack.id}
                                className={`habilidades-table__row ${
                                    isDragging ? "habilidades-table__row--dragging" : ""
                                } ${isDropTarget ? "habilidades-table__row--drop-target" : ""} ${
                                    untrained ? "habilidades-table__row--untrained" : ""
                                }`}
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    if (dragIndex === null || dragIndex === index) return;
                                    setDropIndex(index);
                                }}
                                onDrop={() => handleDrop(index)}
                                onDragLeave={() => {
                                    if (dropIndex === index) setDropIndex(null);
                                }}
                            >
                                <td className="habilidades-table__drag">
                                    {!disabled && (
                                        <span
                                            className="habilidades-table__drag-handle"
                                            draggable
                                            title="Arrastar para reordenar"
                                            aria-label={`Reordenar ${attack.name || "arma"}`}
                                            onDragStart={(event) => {
                                                event.stopPropagation();
                                                handleDragStart(index);
                                            }}
                                            onDragEnd={() => {
                                                setDragIndex(null);
                                                setDropIndex(null);
                                            }}
                                        >
                                            ⋮⋮
                                        </span>
                                    )}
                                </td>
                                <td>
                                    {isEditingName ? (
                                        <input
                                            type="text"
                                            className="habilidades-table__input"
                                            value={attack.name}
                                            disabled={disabled}
                                            autoFocus
                                            aria-label="Nome da arma"
                                            placeholder="Ex.: Espada Curta"
                                            onFocus={(event) => {
                                                requestAnimationFrame(() => event.target.select());
                                            }}
                                            onChange={(event) =>
                                                onUpdate(attack.id, {
                                                    name: event.target.value,
                                                } as Partial<T>)
                                            }
                                            onBlur={() => setEditingNameId(null)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.currentTarget.blur();
                                                }
                                                if (event.key === "Escape") {
                                                    setEditingNameId(null);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            className="habilidades-table__roll-btn"
                                            disabled={disabled || !canRoll}
                                            title={
                                                canRoll
                                                    ? "Clique para rolar ataque (botão direito para opções)"
                                                    : attack.name || "Nome da arma"
                                            }
                                            onClick={() => onRollAttack(attack.id, variant)}
                                            onContextMenu={(event) => {
                                                event.preventDefault();
                                                setNameContextMenu({
                                                    id: attack.id,
                                                    x: event.clientX,
                                                    y: event.clientY,
                                                });
                                            }}
                                        >
                                            {attack.name || (
                                                <span className="habilidades-table__placeholder">
                                                    Ex.: Espada Curta
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </td>
                                <td>
                                    <select
                                        className="habilidades-table__input habilidades-table__select"
                                        value={attack.attributeAbbreviation}
                                        disabled={disabled}
                                        aria-label="Atributo usado no ataque"
                                        onChange={(event) =>
                                            onUpdate(attack.id, {
                                                attributeAbbreviation: event.target.value,
                                            } as Partial<T>)
                                        }
                                    >
                                        <option value="">—</option>
                                        {ATTRIBUTE_DEFINITIONS.map((def) => (
                                            <option key={def.abbreviation} value={def.abbreviation}>
                                                {def.abbreviation}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select
                                        className="habilidades-table__input habilidades-table__select habilidades-table__select--damage-attr"
                                        value={attack.damageAttributeAbbreviation ?? ""}
                                        disabled={disabled}
                                        aria-label="Atributo somado ao dano"
                                        title="Padrão: Precisão→Percepção, Luta→Força (ou Vontade no modo Guerreira Arcana)"
                                        onChange={(event) =>
                                            onUpdate(attack.id, {
                                                damageAttributeAbbreviation: event.target.value,
                                            } as Partial<T>)
                                        }
                                    >
                                        <option value="">Padrão</option>
                                        {ATTRIBUTE_DEFINITIONS.map((def) => (
                                            <option key={def.abbreviation} value={def.abbreviation}>
                                                {def.abbreviation}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className={`habilidades-table__input habilidades-table__input--group ${
                                            untrained ? "habilidades-table__input--untrained" : ""
                                        }`}
                                        list={weaponGroupDatalistId}
                                        value={attack.weaponGroup ?? ""}
                                        disabled={disabled}
                                        aria-label="Grupo de armas"
                                        placeholder="Ex.: Lâminas Leves"
                                        title={
                                            untrained
                                                ? "Grupo não consta em Grupos de Armas do personagem"
                                                : "Bônus de foco +2 se houver foco com o mesmo nome"
                                        }
                                        onChange={(event) =>
                                            onUpdate(attack.id, {
                                                weaponGroup: event.target.value,
                                            } as Partial<T>)
                                        }
                                    />
                                </td>
                                <td>
                                    <span
                                        className="habilidades-table__attack-value"
                                        title={
                                            attackTitle ??
                                            ("Bônus do atributo de ataque" +
                                                (damageAttrUsed
                                                    ? `; dano usa ${damageAttrUsed}`
                                                    : ""))
                                        }
                                    >
                                        {formatAttackBonus(attackBonus)}
                                    </span>
                                </td>
                                <td>
                                    <div className="habilidades-table__damage-cell">
                                        <input
                                            type="text"
                                            className="habilidades-table__input habilidades-table__input--damage-base"
                                            value={attack.damage}
                                            disabled={disabled}
                                            aria-label="Dano base da arma"
                                            placeholder="Ex.: 2d6"
                                            onChange={(event) =>
                                                onUpdate(attack.id, {
                                                    damage: event.target.value,
                                                } as Partial<T>)
                                            }
                                        />
                                        {displayDamage && (
                                            <button
                                                type="button"
                                                className="habilidades-table__damage-roll"
                                                disabled={disabled || !canRoll || !canRollDamage}
                                                title={
                                                    canRoll
                                                        ? "Clique para rolar dano (botão direito para opções)"
                                                        : undefined
                                                }
                                                onClick={() => onRollDamage(attack.id, variant)}
                                                onContextMenu={(event) => {
                                                    if (!canRoll) return;
                                                    event.preventDefault();
                                                    setPendingSituationalRoll({
                                                        attackId: attack.id,
                                                        kind: "damage",
                                                    });
                                                }}
                                            >
                                                → {displayDamage}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );

                        if (variant !== "ranged" || !isRangedAttack(attack)) {
                            return essentialRow;
                        }

                        return (
                            <Fragment key={attack.id}>
                                {essentialRow}
                                <tr className="habilidades-table__details-row">
                                    <td colSpan={7}>
                                        <div className="habilidades-table__ranged-details">
                                            <label className="habilidades-table__detail-field">
                                                <span>Alcance curto</span>
                                                <input
                                                    type="text"
                                                    className="habilidades-table__input"
                                                    value={attack.shortRange ?? ""}
                                                    disabled={disabled}
                                                    aria-label="Alcance curto"
                                                    placeholder="30 m"
                                                    onChange={(event) =>
                                                        onUpdate(attack.id, {
                                                            shortRange: event.target.value,
                                                        } as unknown as Partial<T>)
                                                    }
                                                />
                                            </label>
                                            <label className="habilidades-table__detail-field">
                                                <span>Alcance longo</span>
                                                <input
                                                    type="text"
                                                    className="habilidades-table__input"
                                                    value={attack.longRange ?? ""}
                                                    disabled={disabled}
                                                    aria-label="Alcance longo"
                                                    placeholder="60 m"
                                                    onChange={(event) =>
                                                        onUpdate(attack.id, {
                                                            longRange: event.target.value,
                                                        } as unknown as Partial<T>)
                                                    }
                                                />
                                            </label>
                                            <label className="habilidades-table__detail-field">
                                                <span>Recarregar</span>
                                                <select
                                                    className="habilidades-table__input habilidades-table__select"
                                                    value={attack.reload ?? ""}
                                                    disabled={disabled}
                                                    aria-label="Recarregar"
                                                    onChange={(event) =>
                                                        onUpdate(attack.id, {
                                                            reload: event.target.value,
                                                        } as unknown as Partial<T>)
                                                    }
                                                >
                                                    <option value="">—</option>
                                                    {RELOAD_ACTION_OPTIONS.map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            </Fragment>
                        );
                    })
                )}
            </tbody>

            {nameContextMenu && (
                <div
                    ref={menuRef}
                    className="focus-context-menu"
                    role="menu"
                    style={{
                        position: "fixed",
                        left: nameContextMenu.x,
                        top: nameContextMenu.y,
                        zIndex: 1000,
                    }}
                >
                    <button
                        type="button"
                        className="focus-context-menu__item"
                        role="menuitem"
                        onClick={() => {
                            setEditingNameId(nameContextMenu.id);
                            setNameContextMenu(null);
                        }}
                    >
                        Editar nome
                    </button>
                    {canRoll && (
                        <button
                            type="button"
                            className="focus-context-menu__item"
                            role="menuitem"
                            onClick={() => {
                                setPendingSituationalRoll({
                                    attackId: nameContextMenu.id,
                                    kind: "attack",
                                });
                                setNameContextMenu(null);
                            }}
                        >
                            Rolagem Situacional…
                        </button>
                    )}
                    {!disabled && (
                        <button
                            type="button"
                            className="focus-context-menu__item focus-context-menu__item--danger"
                            role="menuitem"
                            onClick={() => {
                                onRemove(nameContextMenu.id);
                                setNameContextMenu(null);
                            }}
                        >
                            Excluir
                        </button>
                    )}
                </div>
            )}

            <RollSituationalModal
                open={pendingSituationalRoll !== null}
                rollLabel={situationalRollLabel}
                onConfirm={handleSituationalConfirm}
                onCancel={() => setPendingSituationalRoll(null)}
            />
        </>
    );
}
