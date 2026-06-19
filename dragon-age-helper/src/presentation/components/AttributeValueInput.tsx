import { useEffect, useRef, useState } from "react";

import type { Attribute } from "../../domain/entities/characterSheet";
import { FocusContextMenu } from "./FocusContextMenu";

interface AttributeValueInputProps {
    attribute: Attribute;
    disabled?: boolean;
    onValueChange: (abbreviation: string, value: number) => void;
    onRoll: (attribute: Attribute) => void;
    onOpenSituationalRoll?: () => void;
}

function parseAttributeValue(raw: string, fallback: number): number {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-") return fallback;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function sanitizeSignedIntInput(value: string): string {
    const trimmed = value.trimStart();
    const negative = trimmed.startsWith("-");
    const digits = trimmed.replace(/-/g, "").replace(/\D/g, "");
    if (!negative) return digits;
    return digits === "" ? "-" : `-${digits}`;
}

export function AttributeValueInput({
    attribute,
    disabled = false,
    onValueChange,
    onRoll,
    onOpenSituationalRoll,
}: AttributeValueInputProps) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState("");
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

    const startEditing = () => {
        setContextMenu(null);
        setIsEditing(true);
        setDraft(String(attribute.value));
    };

    const commitEdit = () => {
        setIsEditing(false);
        onValueChange(attribute.abbreviation, parseAttributeValue(draft, attribute.value));
        setDraft("");
    };

    if (isEditing) {
        return (
            <input
                type="text"
                inputMode="numeric"
                className="attribute-strip__attr-input"
                value={draft}
                autoFocus
                aria-label={`Editar valor de ${attribute.name}`}
                onFocus={(e) => {
                    requestAnimationFrame(() => e.target.select());
                }}
                onChange={(e) => setDraft(sanitizeSignedIntInput(e.target.value))}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") {
                        setDraft(String(attribute.value));
                        setIsEditing(false);
                    }
                }}
            />
        );
    }

    return (
        <>
            <button
                type="button"
                className="attribute-strip__attr-btn"
                disabled={disabled}
                title={`${attribute.name}: clique para rolar (botão direito para editar)`}
                aria-label={`Rolar ${attribute.name}`}
                onClick={() => onRoll(attribute)}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY });
                }}
            >
                <span className="attribute-strip__attr-value">{attribute.value}</span>
            </button>

            {contextMenu && (
                <FocusContextMenu x={contextMenu.x} y={contextMenu.y} menuRef={menuRef}>
                    <button
                        type="button"
                        className="focus-context-menu__item"
                        role="menuitem"
                        onClick={startEditing}
                    >
                        Editar
                    </button>
                    {onOpenSituationalRoll && (
                        <button
                            type="button"
                            className="focus-context-menu__item"
                            role="menuitem"
                            onClick={() => {
                                setContextMenu(null);
                                onOpenSituationalRoll();
                            }}
                        >
                            Rolagem Situacional…
                        </button>
                    )}
                </FocusContextMenu>
            )}
        </>
    );
}
