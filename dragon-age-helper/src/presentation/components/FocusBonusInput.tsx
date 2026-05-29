import { DEFAULT_FOCUS_BONUS, resolveFocusBonus } from "../../domain/entities/attributeRoll";

import type { Attribute } from "../../domain/entities/characterSheet";

interface FocusBonusInputProps {
    attribute: Attribute;
    onFocusBonusChange: (abbreviation: string, bonus: number) => void;
}

function parseBonus(value: string): number {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return DEFAULT_FOCUS_BONUS;
    return Math.max(0, parsed);
}

export function FocusBonusInput({ attribute, onFocusBonusChange }: FocusBonusInputProps) {
    const effective = resolveFocusBonus(attribute);
    const isDefault = attribute.focusBonus === undefined;

    return (
        <div className="focus-bonus-input" title={`Bônus ao rolar com foco (padrão: +${DEFAULT_FOCUS_BONUS})`}>
            <span className="focus-bonus-input__prefix">+</span>
            <input
                type="number"
                className="focus-bonus-input__field"
                value={effective}
                min={0}
                aria-label={`Bônus de foco de ${attribute.name}`}
                onChange={(e) => onFocusBonusChange(attribute.abbreviation, parseBonus(e.target.value))}
            />
            {isDefault && (
                <span className="focus-bonus-input__hint" aria-hidden="true">
                    *
                </span>
            )}
        </div>
    );
}
