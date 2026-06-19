import { Fragment, useEffect, useRef, useState } from "react";

import {
    ARCANA_SCHOOLS,
    getArcanasForSchool,
    isArcanaSchool,
    type Spell,
} from "../../domain/entities/magias";

interface NameContextMenu {
    id: string;
    x: number;
    y: number;
}

interface SpellsDegreeTableProps {
    title: string;
    spells: Spell[];
    disabled?: boolean;
    onAddSpell: () => void;
    onUpdateSpell: (id: string, patch: Partial<Spell>) => void;
    onRemoveSpell: (id: string) => void;
}

export function SpellsDegreeTable({
    title,
    spells,
    disabled = false,
    onAddSpell,
    onUpdateSpell,
    onRemoveSpell,
}: SpellsDegreeTableProps) {
    const [expandedDescriptionId, setExpandedDescriptionId] = useState<string | null>(null);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [nameContextMenu, setNameContextMenu] = useState<NameContextMenu | null>(null);
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

    return (
        <section className="magia-degree-section" aria-label={title}>
            <h3 className="magia-degree-section__title">{title}</h3>

            <div className="magia-table-wrap">
                <table className="magia-table">
                    <thead>
                        <tr>
                            <th scope="col">Nome</th>
                            <th scope="col">Escola</th>
                            <th scope="col">Arcana</th>
                            <th scope="col">PM</th>
                            <th scope="col">Tempo</th>
                            <th scope="col">NA</th>
                            <th scope="col">Teste</th>
                        </tr>
                    </thead>
                    <tbody>
                        {spells.length === 0 ? (
                            <tr className="magia-table__empty-row">
                                <td colSpan={7}>Nenhuma magia cadastrada.</td>
                            </tr>
                        ) : (
                            spells.map((spell) => {
                                const schoolListId = `spell-school-${spell.id}`;
                                const arcanaListId = `spell-arcana-${spell.id}`;
                                const arcanaSuggestions = isArcanaSchool(spell.school)
                                    ? getArcanasForSchool(spell.school)
                                    : [];
                                const isDescriptionOpen = expandedDescriptionId === spell.id;
                                const isEditingName = editingNameId === spell.id;

                                return (
                                    <Fragment key={spell.id}>
                                        <tr
                                            className={
                                                isDescriptionOpen
                                                    ? "magia-table__row magia-table__row--expanded"
                                                    : "magia-table__row"
                                            }
                                        >
                                            <td>
                                                {isEditingName && !disabled ? (
                                                    <input
                                                        type="text"
                                                        className="magia-table__input magia-table__input--name-edit"
                                                        value={spell.name}
                                                        disabled={disabled}
                                                        aria-label="Nome da magia"
                                                        placeholder="Ex.: Bola de Fogo"
                                                        autoFocus
                                                        onFocus={(event) => {
                                                            requestAnimationFrame(() =>
                                                                event.target.select()
                                                            );
                                                        }}
                                                        onChange={(event) =>
                                                            onUpdateSpell(spell.id, {
                                                                name: event.target.value,
                                                            })
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
                                                        className={`magia-table__name-btn${
                                                            isDescriptionOpen
                                                                ? " magia-table__name-btn--open"
                                                                : ""
                                                        }`}
                                                        title="Clique para ver descrição (botão direito para opções)"
                                                        onClick={() =>
                                                            setExpandedDescriptionId((current) =>
                                                                current === spell.id
                                                                    ? null
                                                                    : spell.id
                                                            )
                                                        }
                                                        onContextMenu={(event) => {
                                                            event.preventDefault();
                                                            if (disabled) return;
                                                            setNameContextMenu({
                                                                id: spell.id,
                                                                x: event.clientX,
                                                                y: event.clientY,
                                                            });
                                                        }}
                                                    >
                                                        {spell.name || (
                                                            <span className="magia-table__name-placeholder">
                                                                Ex.: Bola de Fogo
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="magia-table__input magia-table__input--school"
                                                    value={spell.school}
                                                    disabled={disabled}
                                                    aria-label="Escola arcana"
                                                    placeholder="Primal"
                                                    list={schoolListId}
                                                    onChange={(event) =>
                                                        onUpdateSpell(spell.id, {
                                                            school: event.target.value,
                                                        })
                                                    }
                                                />
                                                <datalist id={schoolListId}>
                                                    {ARCANA_SCHOOLS.map((school) => (
                                                        <option key={school} value={school} />
                                                    ))}
                                                </datalist>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="magia-table__input magia-table__input--arcana"
                                                    value={spell.arcana}
                                                    disabled={disabled}
                                                    aria-label="Arcana"
                                                    placeholder="Arcana do Fogo"
                                                    list={arcanaListId}
                                                    onChange={(event) =>
                                                        onUpdateSpell(spell.id, {
                                                            arcana: event.target.value,
                                                        })
                                                    }
                                                />
                                                <datalist id={arcanaListId}>
                                                    {arcanaSuggestions.map((arcana) => (
                                                        <option key={arcana} value={arcana} />
                                                    ))}
                                                </datalist>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="magia-table__input magia-table__input--number"
                                                    value={spell.cost}
                                                    disabled={disabled}
                                                    aria-label="Custo em PM"
                                                    min={0}
                                                    onChange={(event) =>
                                                        onUpdateSpell(spell.id, {
                                                            cost:
                                                                Number.parseInt(
                                                                    event.target.value,
                                                                    10
                                                                ) || 0,
                                                        })
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="magia-table__input magia-table__input--time"
                                                    value={spell.time}
                                                    disabled={disabled}
                                                    aria-label="Tempo de conjuração"
                                                    placeholder="Ação Principal"
                                                    onChange={(event) =>
                                                        onUpdateSpell(spell.id, {
                                                            time: event.target.value,
                                                        })
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="magia-table__input magia-table__input--number"
                                                    value={spell.tn}
                                                    disabled={disabled}
                                                    aria-label="Número de acerto"
                                                    onChange={(event) =>
                                                        onUpdateSpell(spell.id, {
                                                            tn:
                                                                Number.parseInt(
                                                                    event.target.value,
                                                                    10
                                                                ) || 0,
                                                        })
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="magia-table__input magia-table__input--test"
                                                    value={spell.test}
                                                    disabled={disabled}
                                                    aria-label="Teste de resistência"
                                                    placeholder="DES"
                                                    onChange={(event) =>
                                                        onUpdateSpell(spell.id, {
                                                            test: event.target.value,
                                                        })
                                                    }
                                                />
                                            </td>
                                        </tr>
                                        {isDescriptionOpen && (
                                            <tr className="magia-table__description-row">
                                                <td colSpan={7}>
                                                    <label className="magia-table__description">
                                                        <span className="magia-table__description-label">
                                                            Descrição —{" "}
                                                            {spell.name.trim() || "Magia sem nome"}
                                                        </span>
                                                        <textarea
                                                            className="magia-table__description-textarea"
                                                            value={spell.description}
                                                            disabled={disabled}
                                                            aria-label={`Descrição de ${spell.name || "magia"}`}
                                                            placeholder="Descrição completa do feitiço."
                                                            rows={4}
                                                            onChange={(event) =>
                                                                onUpdateSpell(spell.id, {
                                                                    description: event.target.value,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

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
                        Editar
                    </button>
                    <button
                        type="button"
                        className="focus-context-menu__item focus-context-menu__item--danger"
                        role="menuitem"
                        onClick={() => {
                            if (expandedDescriptionId === nameContextMenu.id) {
                                setExpandedDescriptionId(null);
                            }
                            onRemoveSpell(nameContextMenu.id);
                            setNameContextMenu(null);
                        }}
                    >
                        Excluir
                    </button>
                </div>
            )}

            {!disabled && (
                <button type="button" className="magia-degree-section__add" onClick={onAddSpell}>
                    + {title}
                </button>
            )}
        </section>
    );
}
