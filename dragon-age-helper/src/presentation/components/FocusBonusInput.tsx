import { useState } from "react";

import { DEFAULT_FOCUS_BONUS, resolveFocusBonus } from "../../domain/entities/attributeRoll";

import type { Attribute } from "../../domain/entities/characterSheet";

interface FocusBonusInputProps {
    attribute: Attribute;
    onFocusBonusChange: (abbreviation: string, bonus: number) => void;
}

function parseBonus(value: string): number {
    if (value.trim() === "") return DEFAULT_FOCUS_BONUS;
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return DEFAULT_FOCUS_BONUS;
    return Math.max(0, parsed);
}

export function FocusBonusInput({ attribute, onFocusBonusChange }: FocusBonusInputProps) {
    const effective = resolveFocusBonus(attribute);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState("");

    const commit = (raw: string) => {
        onFocusBonusChange(attribute.abbreviation, parseBonus(raw));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsEditing(true);
        setDraft(String(effective));
        requestAnimationFrame(() => e.target.select());
    };

    const handleBlur = () => {
        setIsEditing(false);
        commit(draft);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraft(e.target.value.replace(/\D/g, ""));
    };

    return (
        <div
            className="focus-bonus-input"
            title={`Bônus ao rolar com foco (padrão: +${DEFAULT_FOCUS_BONUS})`}
        >
            <div className="focus-bonus-input__cluster">
                <span className="focus-bonus-input__prefix" aria-hidden="true">
                    +
                </span>
                <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="focus-bonus-input__field"
                    value={isEditing ? draft : String(effective)}
                    aria-label={`Bônus de foco de ${attribute.name}`}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                            setDraft(String(effective));
                            e.currentTarget.blur();
                        }
                    }}
                />
            </div>
        </div>
    );
}
