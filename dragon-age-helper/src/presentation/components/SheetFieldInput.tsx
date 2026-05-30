interface SheetFieldInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    combatStat?: boolean;
    inputMode?: "text" | "numeric" | "decimal";
    placeholder?: string;
    ariaLabel?: string;
    centered?: boolean;
    large?: boolean;
    disabled?: boolean;
}

export function SheetFieldInput({
    label,
    value,
    onChange,
    className = "",
    combatStat = false,
    inputMode = "text",
    placeholder,
    ariaLabel,
    centered = false,
    large = false,
    disabled = false,
}: SheetFieldInputProps) {
    const combatClass = combatStat ? "sheet-field--combat-stat" : "";
    const bodyClass = [
        "sheet-field__body",
        "sheet-field__body--input",
        combatStat ? "sheet-field__body--combat-stat" : "",
        centered ? "sheet-field__body--input-centered" : "",
        large ? "sheet-field__body--input-large" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={`sheet-field ${combatClass} ${className}`.trim()}>
            <div className="sheet-field__head">{label}</div>
            <div className={bodyClass}>
                <input
                    type="text"
                    className="sheet-field__input"
                    value={value}
                    inputMode={inputMode}
                    placeholder={placeholder}
                    aria-label={ariaLabel ?? label}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}
