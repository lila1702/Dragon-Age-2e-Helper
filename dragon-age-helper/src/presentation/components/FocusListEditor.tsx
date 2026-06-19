import { useEffect, useRef, useState } from "react";

import { FocusContextMenu } from "./FocusContextMenu";

interface FocusListEditorProps {
    focusNames: string[];
    disabled?: boolean;
    onRollFocus: (focusName: string) => void;
    onOpenSituationalRoll?: (focusName: string) => void;
    onAddFocus: (name: string) => void;
    onRemoveFocus: (name: string) => void;
    onRenameFocus: (oldName: string, newName: string) => void;
    onReorderFocus: (fromIndex: number, toIndex: number) => void;
}

interface ContextMenuState {
    focusName: string;
    index: number;
    x: number;
    y: number;
}

export function FocusListEditor({
    focusNames,
    disabled = false,
    onRollFocus,
    onOpenSituationalRoll,
    onAddFocus,
    onRemoveFocus,
    onRenameFocus,
    onReorderFocus,
}: FocusListEditorProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [draft, setDraft] = useState("");
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState("");
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contextMenu) return;

        const closeMenu = (event: MouseEvent) => {
            if (menuRef.current?.contains(event.target as Node)) return;
            setContextMenu(null);
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setContextMenu(null);
        };

        window.addEventListener("mousedown", closeMenu);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("mousedown", closeMenu);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [contextMenu]);

    const submitNewFocus = () => {
        const trimmed = draft.trim();
        if (!trimmed) {
            setIsAdding(false);
            setDraft("");
            return;
        }
        if (!focusNames.includes(trimmed)) {
            onAddFocus(trimmed);
        }
        setDraft("");
        setIsAdding(false);
    };

    const startEditing = (index: number, name: string) => {
        setContextMenu(null);
        setEditingIndex(index);
        setEditDraft(name);
    };

    const commitEdit = (originalName: string) => {
        const trimmed = editDraft.trim();
        setEditingIndex(null);
        setEditDraft("");
        if (!trimmed || trimmed === originalName) return;
        if (focusNames.includes(trimmed)) return;
        onRenameFocus(originalName, trimmed);
    };

    const handleDragStart = (index: number) => {
        if (disabled || editingIndex !== null) return;
        setDragIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;
        setDropIndex(index);
    };

    const handleDrop = (index: number) => {
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null);
            setDropIndex(null);
            return;
        }
        onReorderFocus(dragIndex, index);
        setDragIndex(null);
        setDropIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDropIndex(null);
    };

    return (
        <div className="focus-list">
            <ul className="focus-list__items" aria-label="Focos do atributo">
                {focusNames.map((name, index) => (
                    <li
                        key={`${index}-${name}`}
                        className={`focus-list__item ${
                            dragIndex === index ? "focus-list__item--dragging" : ""
                        } ${dropIndex === index ? "focus-list__item--drop-target" : ""}`}
                        draggable={false}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        onDragLeave={() => {
                            if (dropIndex === index) setDropIndex(null);
                        }}
                    >
                        {editingIndex === index ? (
                            <input
                                type="text"
                                className="focus-list__input focus-list__input--edit"
                                value={editDraft}
                                autoFocus
                                onChange={(e) => setEditDraft(e.target.value)}
                                onFocus={(e) => {
                                    requestAnimationFrame(() => e.target.select());
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") commitEdit(name);
                                    if (e.key === "Escape") {
                                        setEditingIndex(null);
                                        setEditDraft("");
                                    }
                                }}
                                onBlur={() => commitEdit(name)}
                            />
                        ) : (
                            <div className="focus-list__row">
                                <span
                                    className="focus-list__drag-handle"
                                    draggable={!disabled}
                                    title="Arrastar para reordenar"
                                    aria-label={`Reordenar foco ${name}`}
                                    onDragStart={(e) => {
                                        e.stopPropagation();
                                        handleDragStart(index);
                                    }}
                                    onDragEnd={handleDragEnd}
                                >
                                    ⋮⋮
                                </span>
                                <button
                                    type="button"
                                    className="focus-list__focus-btn"
                                    disabled={disabled}
                                    title={`Rolar com foco: ${name}`}
                                    onClick={() => onRollFocus(name)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({
                                            focusName: name,
                                            index,
                                            x: e.clientX,
                                            y: e.clientY,
                                        });
                                    }}
                                >
                                    <span className="focus-list__focus-label">{name}</span>
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {contextMenu && (
                <FocusContextMenu x={contextMenu.x} y={contextMenu.y} menuRef={menuRef}>
                    <button
                        type="button"
                        className="focus-context-menu__item"
                        role="menuitem"
                        onClick={() => startEditing(contextMenu.index, contextMenu.focusName)}
                    >
                        Editar
                    </button>
                    {onOpenSituationalRoll && (
                        <button
                            type="button"
                            className="focus-context-menu__item"
                            role="menuitem"
                            onClick={() => {
                                onOpenSituationalRoll(contextMenu.focusName);
                                setContextMenu(null);
                            }}
                        >
                            Rolagem Situacional…
                        </button>
                    )}
                    <button
                        type="button"
                        className="focus-context-menu__item focus-context-menu__item--danger"
                        role="menuitem"
                        onClick={() => {
                            onRemoveFocus(contextMenu.focusName);
                            setContextMenu(null);
                        }}
                    >
                        Excluir
                    </button>
                </FocusContextMenu>
            )}

            {isAdding ? (
                <div className="focus-list__add-row">
                    <input
                        type="text"
                        className="focus-list__input"
                        value={draft}
                        placeholder="Nome do foco"
                        autoFocus
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") submitNewFocus();
                            if (e.key === "Escape") {
                                setIsAdding(false);
                                setDraft("");
                            }
                        }}
                        onBlur={submitNewFocus}
                    />
                </div>
            ) : (
                <button
                    type="button"
                    className="focus-list__add-btn"
                    disabled={disabled}
                    aria-label="Adicionar foco"
                    onClick={() => setIsAdding(true)}
                >
                    +
                </button>
            )}
        </div>
    );
}
