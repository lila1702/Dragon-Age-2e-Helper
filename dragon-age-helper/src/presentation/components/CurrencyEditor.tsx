import { useLayoutEffect, useRef, useState } from "react";

import type { Currency } from "../../domain/entities/inventario";
import {
    parseNumericExpression,
    sanitizeRelativeNumericInput,
} from "../../domain/entities/numericExpression";

type CurrencyField = keyof Currency;

interface CurrencyEditorProps {
    currency: Currency;
    disabled?: boolean;
    onUpdateCurrency: (patch: Partial<Currency>) => void;
}

const UNDO_LIMIT = 50;

const FIELD_LABELS: Record<CurrencyField, string> = {
    copper: "Peças de cobre",
    silver: "Peças de prata",
    gold: "Peças de ouro",
};

export function CurrencyEditor({ currency, disabled = false, onUpdateCurrency }: CurrencyEditorProps) {
    const [editingField, setEditingField] = useState<CurrencyField | null>(null);
    const [draft, setDraft] = useState("");
    const inputRefs = useRef<Partial<Record<CurrencyField, HTMLInputElement | null>>>({});
    const undoStackRef = useRef<Currency[]>([]);

    useLayoutEffect(() => {
        if (!editingField) return;

        const input = inputRefs.current[editingField];
        if (!input) return;

        input.focus();
        input.select();
    }, [editingField]);

    const pushUndo = (snapshot: Currency) => {
        undoStackRef.current.push({ ...snapshot });
        if (undoStackRef.current.length > UNDO_LIMIT) {
            undoStackRef.current.shift();
        }
    };

    const undo = () => {
        const previous = undoStackRef.current.pop();
        if (!previous) return;

        setEditingField(null);
        setDraft("");
        onUpdateCurrency({ ...previous });
    };

    const startEditing = (field: CurrencyField, value: number) => {
        if (disabled) return;
        setEditingField(field);
        setDraft(String(value));
    };

    const cancelEditing = () => {
        setEditingField(null);
        setDraft("");
    };

    const commitEditing = (field: CurrencyField) => {
        if (editingField !== field) return;

        const nextValue = parseNumericExpression(draft, currency[field], currency[field]);
        if (nextValue !== currency[field]) {
            pushUndo(currency);
            onUpdateCurrency({ [field]: nextValue });
        }

        setEditingField(null);
        setDraft("");
    };

    const renderField = (field: CurrencyField, classSuffix: "copper" | "silver" | "gold") => {
        const value = currency[field];
        const isEditing = editingField === field;

        return (
            <label className="inventario-currency__field">
                <span
                    className={`inventario-currency__label inventario-currency__label--${classSuffix}`}
                >
                    {field === "copper" && "Peças de Cobre"}
                    {field === "silver" && "Peças de Prata"}
                    {field === "gold" && "Peças de Ouro"}
                </span>
                <input
                    ref={(element) => {
                        inputRefs.current[field] = element;
                    }}
                    type="text"
                    inputMode="text"
                    className={`inventario-currency__input inventario-currency__input--${classSuffix}`}
                    value={isEditing ? draft : String(value)}
                    readOnly={!isEditing}
                    disabled={disabled}
                    aria-label={FIELD_LABELS[field]}
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
                        setDraft(sanitizeRelativeNumericInput(event.target.value));
                    }}
                    onBlur={() => {
                        if (isEditing) commitEditing(field);
                    }}
                    onKeyDown={(event) => {
                        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
                            event.preventDefault();
                            undo();
                            return;
                        }

                        if (!isEditing) return;

                        if (event.key === "Enter") {
                            event.currentTarget.blur();
                        }
                        if (event.key === "Escape") {
                            cancelEditing();
                        }
                    }}
                />
            </label>
        );
    };

    return (
        <div className="inventario-currency">
            {renderField("copper", "copper")}
            {renderField("silver", "silver")}
            {renderField("gold", "gold")}
        </div>
    );
}
