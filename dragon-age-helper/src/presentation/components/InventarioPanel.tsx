import { useEffect, useRef, useState } from "react";

import type { Currency, InventoryItem } from "../../domain/entities/inventario";
import { CurrencyEditor } from "./CurrencyEditor";
import { FocusContextMenu } from "./FocusContextMenu";

interface ItemContextMenu {
    id: string;
    x: number;
    y: number;
}

interface InventarioPanelProps {
    items: InventoryItem[];
    currency: Currency;
    disabled?: boolean;
    onAddItem: () => void;
    onUpdateItem: (id: string, patch: Partial<InventoryItem>) => void;
    onRemoveItem: (id: string) => void;
    onUpdateCurrency: (patch: Partial<Currency>) => void;
}

export function InventarioPanel({
    items,
    currency,
    disabled = false,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    onUpdateCurrency,
}: InventarioPanelProps) {
    const [itemContextMenu, setItemContextMenu] = useState<ItemContextMenu | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!itemContextMenu) return;

        const closeMenu = (event: MouseEvent) => {
            if (menuRef.current?.contains(event.target as Node)) return;
            setItemContextMenu(null);
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setItemContextMenu(null);
        };

        window.addEventListener("mousedown", closeMenu);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("mousedown", closeMenu);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [itemContextMenu]);

    return (
        <div className="inventario-panel" aria-label="Inventário">
            <section className="inventario-section" aria-label="Equipamento">
                <h3 className="inventario-section__title">Equipamento</h3>

                <div className="inventario-table-wrap">
                    <table className="inventario-table">
                        <colgroup>
                            <col className="inventario-table__col-item" />
                            <col className="inventario-table__col-description" />
                            <col className="inventario-table__col-qty" />
                            <col className="inventario-table__col-value" />
                            <col className="inventario-table__col-delete" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th scope="col">Item</th>
                                <th scope="col">Descrição</th>
                                <th scope="col">Qtd</th>
                                <th scope="col" title="valor de venda padrão">
                                    Valor
                                </th>
                                <th
                                    scope="col"
                                    className="inventario-table__delete-head"
                                    aria-hidden="true"
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr className="inventario-table__empty-row">
                                    <td colSpan={5}>Nenhum item cadastrado.</td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="inventario-table__row">
                                        <td>
                                            <input
                                                type="text"
                                                className="inventario-table__input inventario-table__input--name"
                                                value={item.name}
                                                disabled={disabled}
                                                aria-label="Nome do item"
                                                placeholder="Ex.: Mochila"
                                                onChange={(event) =>
                                                    onUpdateItem(item.id, {
                                                        name: event.target.value,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="inventario-table__input inventario-table__input--description"
                                                value={item.description}
                                                disabled={disabled}
                                                aria-label={`Descrição de ${item.name || "item"}`}
                                                placeholder="Detalhes do item"
                                                onChange={(event) =>
                                                    onUpdateItem(item.id, {
                                                        description: event.target.value,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td>
                                            <div className="inventario-table__qty">
                                                {item.quantity === null ? (
                                                    <input
                                                        type="text"
                                                        className="inventario-table__input inventario-table__input--qty"
                                                        value="--"
                                                        disabled={disabled}
                                                        aria-label="Quantidade indeterminada"
                                                        readOnly
                                                    />
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="inventario-table__input inventario-table__input--qty"
                                                        value={item.quantity}
                                                        disabled={disabled}
                                                        aria-label="Quantidade"
                                                        min={0}
                                                        onChange={(event) =>
                                                            onUpdateItem(item.id, {
                                                                quantity:
                                                                    Number.parseInt(
                                                                        event.target.value,
                                                                        10
                                                                    ) || 0,
                                                            })
                                                        }
                                                    />
                                                )}
                                                {!disabled && (
                                                    <button
                                                        type="button"
                                                        className="inventario-table__qty-toggle"
                                                        title={
                                                            item.quantity === null
                                                                ? "Definir quantidade"
                                                                : "Quantidade indeterminada (--)"
                                                        }
                                                        aria-label={
                                                            item.quantity === null
                                                                ? "Definir quantidade"
                                                                : "Marcar quantidade como indeterminada"
                                                        }
                                                        onClick={() =>
                                                            onUpdateItem(item.id, {
                                                                quantity:
                                                                    item.quantity === null
                                                                        ? 1
                                                                        : null,
                                                            })
                                                        }
                                                    >
                                                        {item.quantity === null ? "#" : "—"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="inventario-table__input inventario-table__input--value"
                                                value={item.saleValue}
                                                disabled={disabled}
                                                aria-label="Valor de venda padrão"
                                                placeholder="2 PP"
                                                onChange={(event) =>
                                                    onUpdateItem(item.id, {
                                                        saleValue: event.target.value,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td
                                            className="inventario-table__delete-zone"
                                            title={
                                                disabled
                                                    ? undefined
                                                    : "Clique direito para excluir"
                                            }
                                            onContextMenu={(event) => {
                                                event.preventDefault();
                                                if (disabled) return;
                                                setItemContextMenu({
                                                    id: item.id,
                                                    x: event.clientX,
                                                    y: event.clientY,
                                                });
                                            }}
                                        />
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!disabled && (
                    <button type="button" className="inventario-section__add" onClick={onAddItem}>
                        + Item
                    </button>
                )}
            </section>

            <section className="inventario-section inventario-section--currency" aria-label="Dinheiro">
                <h3 className="inventario-section__title">Dinheiro</h3>

                <CurrencyEditor
                    currency={currency}
                    disabled={disabled}
                    onUpdateCurrency={onUpdateCurrency}
                />
            </section>

            {itemContextMenu && (
                <FocusContextMenu
                    x={itemContextMenu.x}
                    y={itemContextMenu.y}
                    menuRef={menuRef}
                >
                    <button
                        type="button"
                        className="focus-context-menu__item focus-context-menu__item--danger"
                        role="menuitem"
                        onClick={() => {
                            onRemoveItem(itemContextMenu.id);
                            setItemContextMenu(null);
                        }}
                    >
                        Excluir
                    </button>
                </FocusContextMenu>
            )}
        </div>
    );
}
