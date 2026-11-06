import {
    DEFAULT_FOCUS_BONUS,
    FOCUS_IMPROVEMENT_LEVEL,
    MAX_FOCUS_BONUS,
    canImproveFocusBonus,
    canReduceFocusBonus,
    resolveFocusBonus,
    type Attribute,
} from "@dragon-age/domain";

interface FocusBonusInputProps {
    attribute: Attribute;
    level: number;
    disabled?: boolean;
    onFocusBonusChange: (abbreviation: string, bonus: number) => void;
}

export function FocusBonusInput({
    attribute,
    level,
    disabled = false,
    onFocusBonusChange,
}: FocusBonusInputProps) {
    const effective = resolveFocusBonus(attribute);
    const showControls = !disabled && level >= FOCUS_IMPROVEMENT_LEVEL;
    const canImprove = showControls && canImproveFocusBonus(level, attribute);
    const canReduce = showControls && canReduceFocusBonus(level, attribute);

    return (
        <div
            className="focus-bonus-input"
            title={
                level < FOCUS_IMPROVEMENT_LEVEL
                    ? `Bônus de foco (padrão +${DEFAULT_FOCUS_BONUS}). Melhorias a partir do nível ${FOCUS_IMPROVEMENT_LEVEL} (máx. +${MAX_FOCUS_BONUS}).`
                    : `Bônus de foco (+${effective}). Use +/− para ajustar (máx. +${MAX_FOCUS_BONUS}).`
            }
        >
            <div className="focus-bonus-input__cluster">
                <span className="focus-bonus-input__prefix" aria-hidden="true">
                    +
                </span>
                <span
                    className="focus-bonus-input__value"
                    aria-label={`Bônus de foco de ${attribute.name}`}
                >
                    {effective}
                </span>
                {canImprove && (
                    <button
                        type="button"
                        className="focus-bonus-input__badge focus-bonus-input__badge--plus"
                        aria-label={`Melhorar foco de ${attribute.name}`}
                        onClick={() =>
                            onFocusBonusChange(
                                attribute.abbreviation,
                                Math.min(MAX_FOCUS_BONUS, effective + 1)
                            )
                        }
                    >
                        +
                    </button>
                )}
                {canReduce && (
                    <button
                        type="button"
                        className="focus-bonus-input__badge focus-bonus-input__badge--minus"
                        aria-label={`Reduzir foco de ${attribute.name}`}
                        onClick={() =>
                            onFocusBonusChange(
                                attribute.abbreviation,
                                Math.max(DEFAULT_FOCUS_BONUS, effective - 1)
                            )
                        }
                    >
                        {"\u2212"}
                    </button>
                )}
            </div>
        </div>
    );
}
