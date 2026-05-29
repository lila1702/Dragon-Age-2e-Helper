interface ResourceValueMaxProps {
    label: string;
    current: number;
    max: number;
    variant: "health" | "mana";
    onCurrentChange: (value: number) => void;
    onMaxChange: (value: number) => void;
    compact?: boolean;
}

function clampNonNegative(value: number): number {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function parseInput(value: string): number {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : clampNonNegative(parsed);
}

export function ResourceValueMax({
    label,
    current,
    max,
    variant,
    onCurrentChange,
    onMaxChange,
    compact = false,
}: ResourceValueMaxProps) {
    const currentClass =
        variant === "health" ? "resource-vm__current--hp" : "resource-vm__current--mp";

    const body = (
        <>
            <input
                type="number"
                className={`resource-vm__input resource-vm__current ${currentClass}`}
                value={current}
                min={0}
                max={max}
                aria-label={`${label} atual`}
                onChange={(e) => onCurrentChange(parseInput(e.target.value))}
            />
            <span className="resource-vm__sep" aria-hidden="true">
                /
            </span>
            <input
                type="number"
                className="resource-vm__input resource-vm__max"
                value={max}
                min={0}
                aria-label={`${label} máximo`}
                onChange={(e) => onMaxChange(parseInput(e.target.value))}
            />
        </>
    );

    if (compact) {
        return (
            <div className={`sheet-field sheet-field--combat-stat resource-vm resource-vm--compact resource-vm--${variant}`}>
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
