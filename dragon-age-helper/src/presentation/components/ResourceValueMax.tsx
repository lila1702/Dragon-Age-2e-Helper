import { useLayoutEffect, useRef, useState } from "react";

interface ResourceValueMaxProps {
    label: string;
    current: number;
    max: number;
    variant: "health" | "mana";
    onCurrentChange: (value: number) => void;
    onMaxChange: (value: number) => void;
    onEditingChange?: (isEditing: boolean) => void;
    compact?: boolean;
    disabled?: boolean;
}

type EditingField = "current" | "max" | null;

function sanitizeDigitsInput(value: string): string {
    return value.replace(/\D/g, "");
}

function sanitizeRelativeCurrentInput(value: string): string {
    const trimmed = value.trimStart();
    if (trimmed.startsWith("+")) {
        const digits = trimmed.slice(1).replace(/\D/g, "");
        return digits === "" ? "+" : `+${digits}`;
    }
    if (trimmed.startsWith("-")) {
        const digits = trimmed.slice(1).replace(/\D/g, "");
        return digits === "" ? "-" : `-${digits}`;
    }
    return sanitizeDigitsInput(value);
}

function parseResourceMaxValue(raw: string, fallback: number): number {
    const trimmed = raw.trim();
    if (trimmed === "") return fallback;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? fallback : Math.max(0, parsed);
}

function parseResourceCurrentValue(raw: string, current: number, fallback: number): number {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "+" || trimmed === "-") return fallback;

    if (trimmed.startsWith("+")) {
        const delta = Number.parseInt(trimmed.slice(1), 10);
        if (Number.isNaN(delta)) return fallback;
        return Math.max(0, current + delta);
    }

    if (trimmed.startsWith("-")) {
        const delta = Number.parseInt(trimmed.slice(1), 10);
        if (Number.isNaN(delta)) return fallback;
        return Math.max(0, current - delta);
    }

    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? fallback : Math.max(0, parsed);
}

export function ResourceValueMax({
    label,
    current,
    max,
    variant,
    onCurrentChange,
    onMaxChange,
    onEditingChange,
    compact = false,
    disabled = false,
}: ResourceValueMaxProps) {
    const [editingField, setEditingField] = useState<EditingField>(null);
    const [draft, setDraft] = useState("");
    const editingDepthRef = useRef(0);
    const inputRefs = useRef<Partial<Record<Exclude<EditingField, null>, HTMLInputElement | null>>>(
        {}
    );

    useLayoutEffect(() => {
        if (!editingField) return;

        const input = inputRefs.current[editingField];
        if (!input) return;

        input.focus();
        input.select();
    }, [editingField]);

    const currentClass =
        variant === "health" ? "resource-vm__current--hp" : "resource-vm__current--mp";

    const notifyEditing = (isEditing: boolean) => {
        if (isEditing) {
            editingDepthRef.current += 1;
            if (editingDepthRef.current === 1) {
                onEditingChange?.(true);
            }
            return;
        }

        editingDepthRef.current = Math.max(0, editingDepthRef.current - 1);
        if (editingDepthRef.current === 0) {
            onEditingChange?.(false);
        }
    };

    const startEditing = (field: Exclude<EditingField, null>, value: number) => {
        if (disabled) return;
        setEditingField(field);
        setDraft(String(value));
        notifyEditing(true);
    };

    const cancelEditing = (field: Exclude<EditingField, null>) => {
        if (editingField !== field) return;
        setEditingField(null);
        setDraft("");
        notifyEditing(false);
    };

    const commitEditing = (field: Exclude<EditingField, null>) => {
        if (editingField !== field) return;

        if (field === "current") {
            const next = parseResourceCurrentValue(draft, current, current);
            onCurrentChange(Math.min(next, max));
        } else {
            onMaxChange(parseResourceMaxValue(draft, max));
        }

        setEditingField(null);
        setDraft("");
        notifyEditing(false);
    };

    const renderInput = (field: Exclude<EditingField, null>, value: number, className: string) => {
        const isEditing = editingField === field;
        const isCurrent = field === "current";
        const ariaLabel = isCurrent ? `${label} atual` : `${label} máximo`;

        return (
            <input
                ref={(element) => {
                    inputRefs.current[field] = element;
                }}
                type="text"
                inputMode={isCurrent ? "text" : "numeric"}
                className={className}
                value={isEditing ? draft : String(value)}
                readOnly={!isEditing}
                disabled={disabled}
                aria-label={ariaLabel}
                onPointerDown={(event) => {
                    if (disabled || isEditing) return;
                    event.preventDefault();
                    startEditing(field, value);
                }}
                onFocus={() => {
                    if (disabled || isEditing) return;
                    startEditing(field, value);
                }}
                onChange={(event) => {
                    if (!isEditing) return;

                    setDraft(
                        isCurrent
                            ? sanitizeRelativeCurrentInput(event.target.value)
                            : sanitizeDigitsInput(event.target.value)
                    );
                }}
                onBlur={() => {
                    if (isEditing) commitEditing(field);
                }}
                onKeyDown={(event) => {
                    if (!isEditing) return;

                    if (event.key === "Enter") {
                        event.currentTarget.blur();
                    }
                    if (event.key === "Escape") {
                        cancelEditing(field);
                    }
                }}
            />
        );
    };

    const body = (
        <>
            {renderInput(
                "current",
                current,
                `resource-vm__input resource-vm__current ${currentClass}`
            )}
            <span className="resource-vm__sep" aria-hidden="true">
                /
            </span>
            {renderInput("max", max, "resource-vm__input resource-vm__max")}
        </>
    );

    if (compact) {
        return (
            <div
                className={`sheet-field sheet-field--combat-stat resource-vm resource-vm--compact resource-vm--${variant}`}
            >
                <div className="sheet-field__head">{label}</div>
                <div className="sheet-field__body sheet-field__body--resource-compact">{body}</div>
            </div>
        );
    }

    return (
        <div className={`resource-vm resource-vm--${variant}`}>
            <div className="resource-vm__head">{label}</div>
            <div className="resource-vm__body">{body}</div>
        </div>
    );
}
